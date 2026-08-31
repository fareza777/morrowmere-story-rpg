import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const ROOT = resolve(import.meta.dirname, '../..');
const AUDIO_ROOT = resolve(ROOT, 'public/audio/chronicle1');
const MANIFEST_PATH = resolve(ROOT, 'production/chronicle1/media/audio-manifest.json');
const PROVENANCE_PATH = resolve(ROOT, 'production/chronicle1/media/audio-provenance.json');
const VOICE_SCRIPT_PATH = resolve(ROOT, 'production/chronicle1/media/voice-script.json');
const VOICE_PROFILES_PATH = resolve(ROOT, 'production/chronicle1/media/voice-profiles.json');
const OPENING_TIMELINE_PATH = resolve(ROOT, 'production/chronicle1/media/opening-timeline.json');

const MUSIC_IDS = [
  'music-title', 'music-camp', 'music-merchant', 'music-kings-road', 'music-greywatch', 'music-old-forest',
  'music-redwater', 'music-embervault', 'music-greywatch-siege', 'music-crownless-keep',
  'music-false-coronation', 'music-ending-road',
];
const SFX_GROUPS = { weapons: 12, defense: 8, magic: 12, status: 8, enemy: 12, ui: 14, narrative: 12, ambience: 6 };
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const SECRET_PATTERN = new RegExp([
  String.raw`xi-api-key\s*[:=]\s*["']?` + 's' + 'k_',
  String.raw`\b` + 's' + String.raw`k_[A-Za-z0-9_-]{20,}`,
].join('|'), 'i');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function assetPath(src) {
  assert(/^\/audio\/chronicle1\/(music|sfx)\/[a-z0-9-]+\.mp3$/.test(src), `Unsafe or non-canonical audio path: ${src}`);
  const path = resolve(ROOT, `public${src}`);
  assert(path.startsWith(`${AUDIO_ROOT}${sep}`), `Audio path escapes the shipped root: ${src}`);
  return path;
}

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  assert(result.status === 0, `${label} failed: ${(result.stderr || result.stdout || 'unknown error').trim()}`);
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

function probe(path, id) {
  const output = run('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration',
    '-of', 'json', path,
  ], `ffprobe ${id}`);
  const data = JSON.parse(output);
  assert(data.streams?.length === 1, `${id} must contain one audio stream.`);
  const stream = data.streams[0];
  return { codec: stream.codec_name, sampleRate: Number(stream.sample_rate), channels: Number(stream.channels), durationMs: Number(data.format.duration) * 1_000 };
}

function decode(path, id) {
  run('ffmpeg', ['-v', 'error', '-nostdin', '-i', path, '-map', '0:a:0', '-f', 'null', '-'], `decode ${id}`);
}

function measureLoudness(path, id) {
  const output = run('ffmpeg', ['-hide_banner', '-nostats', '-nostdin', '-i', path, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], `loudness ${id}`);
  const integrated = [...output.matchAll(/\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/g)].at(-1);
  const peak = [...output.matchAll(/\bPeak:\s*(-?\d+(?:\.\d+)?)\s+dBFS/g)].at(-1);
  assert(integrated && peak, `Could not parse loudness summary for ${id}.`);
  return { integrated: Number(integrated[1]), peak: Number(peak[1]) };
}

async function listMp3(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...await listMp3(path));
    else if (entry.isFile() && entry.name.endsWith('.mp3')) output.push(path);
  }
  return output.sort();
}

async function main() {
  const [manifest, provenance, voiceScript, voiceProfiles, openingTimeline] = await Promise.all([
    readJson(MANIFEST_PATH), readJson(PROVENANCE_PATH), readJson(VOICE_SCRIPT_PATH), readJson(VOICE_PROFILES_PATH), readJson(OPENING_TIMELINE_PATH),
  ]);
  const serializedMetadata = JSON.stringify({ manifest, provenance, voiceScript, voiceProfiles });
  assert(!SECRET_PATTERN.test(serializedMetadata), 'Audio metadata contains a credential-like value.');
  assert(manifest.version === 1 && manifest.codec === 'mp3', 'Unsupported audio manifest version or codec.');
  assert(manifest.sampleRate === 22050 && manifest.channels === 1, 'Android pack must be 22.05 kHz mono.');
  assert(JSON.stringify(manifest.music.map((asset) => asset.id)) === JSON.stringify(MUSIC_IDS), 'Music IDs/order differ from the locked contract.');
  assert(manifest.music.length === 12, 'Expected exactly 12 music tracks.');
  assert(manifest.sfx.length === 84, 'Expected exactly 84 SFX.');

  for (const [group, expected] of Object.entries(SFX_GROUPS)) {
    assert(manifest.sfx.filter((asset) => asset.group === group).length === expected, `SFX group ${group} must contain ${expected} cues.`);
  }

  const assets = [...manifest.music, ...manifest.sfx];
  assert(new Set(assets.map((asset) => asset.id)).size === 96, 'Audio asset IDs must be unique.');
  assert(new Set(assets.map((asset) => asset.src)).size === 96, 'Audio source paths must be unique.');
  assert(new Set(assets.map((asset) => asset.sha256)).size === 96, 'Output hashes must be unique.');
  assert(provenance.assets.length === 96, 'Every audio asset needs one provenance record.');
  const provenanceById = new Map(provenance.assets.map((entry) => [entry.id, entry]));
  assert(provenanceById.size === 96, 'Provenance IDs must be unique.');
  const expectedFiles = new Set();
  let totalBytes = 0;

  for (const asset of assets) {
    const path = assetPath(asset.src);
    expectedFiles.add(path);
    const bytes = await readFile(path);
    const details = await stat(path);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    assert(details.size === asset.bytes, `${asset.id} byte count differs from its manifest.`);
    assert(sha256 === asset.sha256 && HASH_PATTERN.test(asset.sha256), `${asset.id} hash differs from its manifest.`);
    totalBytes += details.size;

    const record = provenanceById.get(asset.provenanceId);
    assert(record?.assetId === asset.id, `${asset.id} has missing or mismatched provenance.`);
    assert(record.generator === 'morrowmere-procedural-audio-v1', `${asset.id} must identify the project generator.`);
    assert(record.commercialDistribution === true && record.externalSource === null, `${asset.id} is not cleared for original commercial distribution.`);
    assert(HASH_PATTERN.test(record.sourceMasterSha256), `${asset.id} source-master hash is invalid.`);
    assert(record.outputSha256 === asset.sha256, `${asset.id} provenance output hash differs.`);

    const media = probe(path, asset.id);
    assert(media.codec === 'mp3' && media.sampleRate === 22050 && media.channels === 1, `${asset.id} is not 22.05 kHz mono MP3.`);
    assert(Math.abs(media.durationMs - asset.durationMs) <= 120, `${asset.id} duration differs by more than 120 ms.`);
    if (asset.id.startsWith('music-')) {
      assert(asset.durationMs >= 75_000 && asset.durationMs <= 240_000, `${asset.id} music duration is outside the contract.`);
      assert(asset.loopStartMs >= 0 && asset.loopEndMs > asset.loopStartMs + 30_000 && Math.abs(asset.loopEndMs - asset.durationMs) <= 120, `${asset.id} loop window is invalid.`);
      const loudness = measureLoudness(path, asset.id);
      assert(Math.abs(loudness.integrated - (-18)) <= 1, `${asset.id} measures ${loudness.integrated} LUFS; expected -18 +/-1.`);
      assert(loudness.peak <= -1, `${asset.id} true/sample peak ${loudness.peak} dBFS exceeds -1 dBFS.`);
    } else {
      assert(asset.durationMs >= 40 && asset.durationMs <= 20_000, `${asset.id} SFX duration is outside the contract.`);
    }
    decode(path, asset.id);
  }

  const actualFiles = await listMp3(AUDIO_ROOT);
  assert(actualFiles.length === 96, `Expected exactly 96 shipped MP3 files; found ${actualFiles.length}.`);
  assert(actualFiles.every((path) => expectedFiles.has(path)), 'The shipped audio directory contains an orphan MP3.');
  assert(totalBytes < 55 * 1024 * 1024, `Audio pack is ${totalBytes} bytes; budget is 55 MiB.`);

  const groupCounts = Object.fromEntries(['opening', 'main', 'companion'].map((group) => [group, voiceScript.cues.filter((cue) => cue.group === group).length]));
  assert(JSON.stringify(groupCounts) === JSON.stringify({ opening: 8, main: 16, companion: 8 }), 'Voice script must contain 8 opening, 16 main, and 8 companion cues.');
  const openingVoice = voiceScript.cues.filter((cue) => cue.group === 'opening');
  assert(openingVoice[0].startMs === 0 && openingVoice.at(-1).endMs === openingTimeline.durationMs, 'Opening voice timing must fill the cinematic without overrunning it.');
  assert(openingVoice.slice(1).every((cue, index) => cue.startMs === openingVoice[index].endMs), 'Opening voice timing must be ordered and contiguous.');
  assert(voiceScript.cues.filter((cue) => cue.group === 'main').every((cue) => cue.sceneId.includes('-main-')), 'Main voice cues must reference main scenes.');
  assert(voiceScript.cues.filter((cue) => cue.group === 'companion').every((cue) => cue.sceneId.includes('-companion-')), 'Companion voice cues must reference companion scenes.');
  const companionSpeakers = Object.fromEntries(['Mara', 'Rukhar', 'Caldus', 'Lyra', 'Talla'].map((speaker) => [speaker, voiceScript.cues.filter((cue) => cue.group === 'companion' && cue.speaker === speaker).length]));
  assert(JSON.stringify(companionSpeakers) === JSON.stringify({ Mara: 1, Rukhar: 2, Caldus: 2, Lyra: 2, Talla: 1 }), 'Companion voice allocation differs from the approved script.');
  assert(voiceScript.cues.every((cue) => cue.spokenText === cue.captionText), 'Every voice line must exactly match its caption.');
  assert(voiceScript.cues.every((cue) => cue.audioSrc === null && cue.delivery === 'local-web-speech-fallback'), 'Unapproved paid voice files must not be represented as shipped clips.');
  assert(voiceProfiles.profiles.length === 7 && voiceProfiles.profiles.every((profile) => profile.provider.voiceId === null), 'Provider voices must remain unselected until an authorized audition.');

  process.stdout.write(`Audio validation passed: 12 music, 84 SFX, 96 decoded MP3 files, ${totalBytes} bytes.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Audio validation failed.'}\n`);
  process.exitCode = 1;
});
