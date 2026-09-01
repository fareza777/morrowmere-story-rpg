import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  cues: readonly { audioSrc: string | null; delivery: string; captionText: string }[];
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
    expect(contract.itemIcons).toHaveLength(100);
    expect(contract.enemyPortraits).toHaveLength(80);
    expect(opening.shots).toHaveLength(14);
    expect(audio.music).toHaveLength(13);
    expect(audio.sfx).toHaveLength(84);
    expect(new Set(localPaths).size).toBe(localPaths.length);
    for (const path of localPaths) expectShippedLocalPath(path);
  });

  it('keeps voice caption-first and any future rendered clip local', () => {
    const voice = readJson<VoiceScript>('production/chronicle1/media/voice-script.json');
    expect(voice.cues).toHaveLength(32);
    for (const cue of voice.cues) {
      expect(cue.captionText.trim().length).toBeGreaterThan(0);
      if (cue.audioSrc === null) {
        expect(cue.delivery).toBe('local-web-speech-fallback');
      } else {
        expectShippedLocalPath(cue.audioSrc);
      }
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
