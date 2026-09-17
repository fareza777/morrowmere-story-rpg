import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

interface MediaContract {
  scenes: readonly { id: string; chapterId: string; type: string }[];
  itemIcons: readonly { id: string }[];
  enemyPortraits: readonly { id: string }[];
}

interface AudioManifest {
  music: readonly { src: string }[];
  sfx: readonly { src: string }[];
}

interface OpeningTimeline {
  shots: readonly { base: string }[];
}

interface VoiceScript {
  cues: readonly { audioSrc: string; delivery: string; captionText: string; spokenText: string; group: string }[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(path), 'utf8')) as T;
}

function expectShippedLocalPath(path: string): void {
  expect(path).toMatch(/^\/(?:assets|audio)\//);
  expect(path).not.toMatch(/^https?:/i);
  expect(path).not.toContain('..');
  expect(existsSync(resolve('public', path.slice(1))), `Missing local media ${path}`).toBe(true);
}

describe('offline Chronicle I media', () => {
  it('probes every shipped MP3 without ffprobe using actual frame data', () => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import { readFileSync } from 'node:fs';
      import { probe } from './scripts/media/validate-audio.mjs';
      const missing = () => ({ error: Object.assign(new Error('missing'), { code: 'ENOENT' }), status: null });
      const manifest = JSON.parse(readFileSync('production/chronicle1/media/audio-manifest.json'));
      const voice = JSON.parse(readFileSync('production/chronicle1/media/voice-provenance.json'));
      for (const asset of [...manifest.music, ...manifest.sfx, ...voice.assets]) {
        const actual = probe('public' + asset.src, asset.id, missing);
        assert.equal(actual.codec, 'mp3');
        assert.equal(actual.channels, 1);
        assert.equal(actual.sampleRate, asset.src.includes('/voice/') ? 24000 : 22050);
        assert.ok(Math.abs(actual.durationMs - asset.durationMs) <= 120, asset.id + ': ' + actual.durationMs);
      }
    `], { encoding: 'utf8', windowsHide: true });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('rejects malformed frames and never falls back after an available ffprobe fails', () => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import { readFileSync } from 'node:fs';
      import { probe, probeMp3 } from './scripts/media/validate-audio.mjs';
      const path = 'public/audio/chronicle1/music/music-title.mp3';
      const missing = () => ({ error: Object.assign(new Error('missing'), { code: 'ENOENT' }), status: null });
      assert.throws(() => probe('package.json', 'not-mp3', missing), /MP3|MPEG|frame/);
      const bytes = readFileSync(path);
      assert.throws(() => probeMp3(bytes.subarray(0, bytes.length - 1), 'truncated'), /truncated|frame/i);
      const broken = Buffer.from(bytes);
      broken.fill(0, Math.floor(broken.length / 2), Math.floor(broken.length / 2) + 1024);
      assert.throws(() => probeMp3(broken, 'corrupt'), /frame/i);
      for (const result of [
        { status: 1, stderr: 'invalid audio' },
        { status: null, error: Object.assign(new Error('denied'), { code: 'EACCES' }) },
        { status: null, signal: 'SIGTERM' },
        { status: 0, stdout: '{invalid json' },
        { status: 0, stdout: JSON.stringify({ streams: [] }) },
      ]) assert.throws(() => probe(path, 'bad-probe', () => result));
      const output = { streams: [{ codec_name: 'mp3', sample_rate: '22050', channels: 1 }], format: { duration: '12.5' } };
      assert.deepEqual(probe('nonexistent.mp3', 'available', () => ({ status: 0, stdout: JSON.stringify(output) })),
        { codec: 'mp3', sampleRate: 22050, channels: 1, durationMs: 12500 });
    `], { encoding: 'utf8', windowsHide: true });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('ships every runtime-backed art and audio manifest path locally', () => {
    const contract = readJson<MediaContract>('content/manifests/chronicle1-media-contract.json');
    const audio = readJson<AudioManifest>('production/chronicle1/media/audio-manifest.json');
    const opening = readJson<OpeningTimeline>('production/chronicle1/media/opening-timeline.json');

    const localPaths = [
      ...contract.scenes
        .filter((scene) => scene.type === 'main')
        .map((scene) => `/assets/chronicle1/scenes/${scene.chapterId}/${scene.id}.webp`),
      ...contract.itemIcons.map((item) => `/assets/chronicle1/items/${item.id}.webp`),
      ...contract.enemyPortraits.map((enemy) => `/assets/chronicle1/enemies/${enemy.id}.webp`),
      ...opening.shots.map((shot) => shot.base),
      ...audio.music.map((entry) => entry.src),
      ...audio.sfx.map((entry) => entry.src),
    ];

    expect(contract.scenes.filter((scene) => scene.type === 'main')).toHaveLength(56);
    expect(contract.itemIcons).toHaveLength(106);
    expect(contract.enemyPortraits).toHaveLength(84);
    expect(opening.shots).toHaveLength(14);
    expect(audio.music).toHaveLength(13);
    expect(audio.sfx).toHaveLength(84);
    expect(new Set(localPaths).size).toBe(localPaths.length);
    for (const path of localPaths) expectShippedLocalPath(path);
  });

  it('ships all 38 caption-matched voice clips locally', () => {
    const voice = readJson<VoiceScript>('production/chronicle1/media/voice-script.json');
    expect(voice.cues).toHaveLength(38);
    expect(['opening', 'main', 'companion'].map((group) => voice.cues.filter((cue) => cue.group === group).length)).toEqual([14, 16, 8]);
    expect(new Set(voice.cues.map((cue) => cue.audioSrc)).size).toBe(38);
    for (const cue of voice.cues) {
      expect(cue.captionText.trim().length).toBeGreaterThan(0);
      expect(cue.spokenText).toBe(cue.captionText);
      expect(cue.delivery).toBe('bundled-kokoro-onnx');
      expectShippedLocalPath(cue.audioSrc);
    }
  });

  it('prevents service workers in Android modes and bounds web media caching', () => {
    const vite = readFileSync(resolve('vite.config.ts'), 'utf8');
    expect(vite).toContain("mode.startsWith('android')");
    expect(vite).toContain('ogg,m4a,mp3,json');
    expect(vite).toContain("'assets/chronicle1/**/*'");
    expect(vite).toContain("'audio/chronicle1/**/*'");
    expect(vite).toContain("handler: 'CacheFirst'");
    expect(vite).toContain('maxEntries: 800');
  });

  it('keeps the hard Android release gate at 180 MiB', () => {
    const script = readFileSync(resolve('scripts/check-android-size.mjs'), 'utf8');
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(script).toContain('188_743_680');
    expect(script).toContain('app-release.aab');
    expect(packageJson.scripts['check:android-size']).toBe('node scripts/check-android-size.mjs');
  });
});
