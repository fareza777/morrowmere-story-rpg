import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(import.meta.dirname, '../..');
const AUDIO_ROOT = resolve(ROOT, 'public/audio/chronicle1');
const MANIFEST_PATH = resolve(ROOT, 'production/chronicle1/media/audio-manifest.json');
const PROVENANCE_PATH = resolve(ROOT, 'production/chronicle1/media/audio-provenance.json');
const VOICE_SCRIPT_PATH = resolve(ROOT, 'production/chronicle1/media/voice-script.json');
const VOICE_PROFILES_PATH = resolve(ROOT, 'production/chronicle1/media/voice-profiles.json');
const OPENING_TIMELINE_PATH = resolve(ROOT, 'production/chronicle1/media/opening-timeline.json');

const MUSIC_IDS = [
  'music-title', 'music-opening-score', 'music-camp', 'music-merchant', 'music-kings-road', 'music-greywatch', 'music-old-forest',
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
  assert(/^\/audio\/chronicle1\/(?:music|sfx|voice\/en)\/[a-z0-9-]+\.mp3$/.test(src), `Unsafe or non-canonical audio path: ${src}`);
  const path = resolve(ROOT, `public${src}`);
  assert(path.startsWith(`${AUDIO_ROOT}${sep}`), `Audio path escapes the shipped root: ${src}`);
  return path;
}

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  assert(!result.error && result.status === 0, `${label} failed: ${(result.error?.message || result.stderr || result.stdout || 'unknown error').trim()}`);
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

// This checks every Layer III frame, not a bitrate estimate or trusted metadata.
// FFmpeg decoding and post-encode loudness checks remain mandatory below.
export function probeMp3(bytes, id) {
  let offset = 0;
  let end = bytes.length;
  if (bytes.toString('ascii', 0, 3) === 'ID3') {
    assert(bytes.length >= 10 && [2, 3, 4].includes(bytes[3]), `${id} has an invalid MP3 ID3 header.`);
    const sizeBytes = [...bytes.subarray(6, 10)];
    assert(sizeBytes.every((value) => value < 128), `${id} has an invalid MP3 ID3 size.`);
    offset = 10 + sizeBytes.reduce((size, value) => size * 128 + value, 0);
    if (bytes[3] === 4 && (bytes[5] & 0x10)) offset += 10;
    assert(offset < end, `${id} has a truncated MP3 ID3 tag or no frames.`);
  }
  if (end - offset >= 128 && bytes.toString('ascii', end - 128, end - 125) === 'TAG') end -= 128;
  let format;
  let samples = 0;
  while (offset < end) {
    assert(offset + 4 <= end, `${id} has a truncated MP3 frame header.`);
    const header = bytes.readUInt32BE(offset);
    const version = (header >>> 19) & 3;
    const layer = (header >>> 17) & 3;
    const bitrateIndex = (header >>> 12) & 15;
    const rateIndex = (header >>> 10) & 3;
    assert((header >>> 21) === 0x7ff && version !== 1 && layer === 1
      && bitrateIndex > 0 && bitrateIndex < 15 && rateIndex < 3 && (header & 3) !== 2,
    `${id} has an invalid MPEG Layer III frame at byte ${offset}.`);
    const sampleRate = [44100, 48000, 32000][rateIndex] / (version === 3 ? 1 : version === 2 ? 2 : 4);
    const channels = ((header >>> 6) & 3) === 3 ? 1 : 2;
    const bitrate = (version === 3
      ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
      : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160])[bitrateIndex];
    const frameBytes = Math.floor((version === 3 ? 144000 : 72000) * bitrate / sampleRate) + ((header >>> 9) & 1);
    assert(offset + frameBytes <= end, `${id} has a truncated MP3 frame at byte ${offset}.`);
    assert(!format || (format.sampleRate === sampleRate && format.channels === channels), `${id} changes format between MP3 frames.`);
    format ??= { codec: 'mp3', sampleRate, channels };
    samples += version === 3 ? 1152 : 576;
    offset += frameBytes;
  }
  assert(format && samples > 0, `${id} contains no MP3 audio frames.`);
  return { ...format, durationMs: samples / format.sampleRate * 1000 };
}

export function probe(path, id, spawn = spawnSync) {
  const result = spawn('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration',
    '-of', 'json', path,
  ], { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  if (result.error?.code === 'ENOENT') return probeMp3(readFileSync(path), id);
  assert(!result.error && result.status === 0 && !result.stderr?.trim(),
    `ffprobe ${id} failed: ${(result.error?.message || result.stderr || result.signal || 'unknown error').trim()}`);
  const data = JSON.parse(result.stdout);
  assert(data.streams?.length === 1, `${id} must contain one audio stream.`);
  const stream = data.streams[0];
  const media = { codec: stream.codec_name, sampleRate: Number(stream.sample_rate), channels: Number(stream.channels), durationMs: Number(data.format?.duration) * 1_000 };
  assert(Number.isFinite(media.durationMs) && media.durationMs > 0 && media.sampleRate > 0 && media.channels > 0, `${id} has invalid audio probe metadata.`);
  return media;
}

function decode(path, id) {
  run('ffmpeg', ['-v', 'error', '-xerror', '-err_detect', 'explode', '-nostdin', '-i', path, '-map', '0:a:0', '-f', 'null', '-'], `decode ${id}`);
}

function measureLoudness(path, id) {
  const output = run('ffmpeg', ['-hide_banner', '-nostats', '-nostdin', '-i', path, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], `loudness ${id}`);
  const integrated = [...output.matchAll(/\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/g)].at(-1);
  const peak = [...output.matchAll(/\bPeak:\s*(-?\d+(?:\.\d+)?)\s+dBFS/g)].at(-1);
  assert(integrated && peak, `Could not parse loudness summary for ${id}.`);
  return { integrated: Number(integrated[1]), peak: Number(peak[1]) };
}

function windowRms(path, startSeconds, durationSeconds, id) {
  const result = spawnSync('ffmpeg', [
    '-v', 'error', '-nostdin', '-ss', String(startSeconds), '-i', path,
    '-t', String(durationSeconds), '-ac', '1', '-ar', '22050', '-f', 'f32le', '-',
  ], { windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  assert(result.status === 0, `Loop-window decode failed for ${id}.`);
  const bytes = result.stdout;
  assert(Buffer.isBuffer(bytes) && bytes.byteLength >= 4, `Loop-window decode was empty for ${id}.`);
  let energy = 0;
  const samples = Math.floor(bytes.byteLength / 4);
  for (let offset = 0; offset < samples * 4; offset += 4) {
    const value = bytes.readFloatLE(offset);
    energy += value * value;
  }
  return Math.sqrt(energy / samples);
}

function validateLoopBoundary(path, durationMs, id) {
  const durationSeconds = durationMs / 1_000;
  const windowSeconds = 0.08;
  const start = windowRms(path, 0, windowSeconds, id);
  const beforeEnd = windowRms(path, Math.max(0, durationSeconds - 0.24), windowSeconds, id);
  const end = windowRms(path, Math.max(0, durationSeconds - windowSeconds), windowSeconds, id);
  assert(start >= beforeEnd * 0.18, `${id} fades down at its loop start.`);
  assert(end >= beforeEnd * 0.18, `${id} fades down at its loop end.`);
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
  assert(manifest.measurement?.loudness.includes('Post-encode EBU R128') && manifest.measurement?.peak.includes('Post-encode EBU R128'), 'Audio measurement method must be explicit.');
  assert(JSON.stringify(manifest.music.map((asset) => asset.id)) === JSON.stringify(MUSIC_IDS), 'Music IDs/order differ from the locked contract.');
  assert(manifest.music.length === 13, 'Expected exactly 13 music tracks.');
  assert(manifest.sfx.length === 84, 'Expected exactly 84 SFX.');

  for (const [group, expected] of Object.entries(SFX_GROUPS)) {
    assert(manifest.sfx.filter((asset) => asset.group === group).length === expected, `SFX group ${group} must contain ${expected} cues.`);
  }

  const assets = [...manifest.music, ...manifest.sfx];
  assert(new Set(assets.map((asset) => asset.id)).size === 97, 'Audio asset IDs must be unique.');
  assert(new Set(assets.map((asset) => asset.src)).size === 97, 'Audio source paths must be unique.');
  assert(new Set(assets.map((asset) => asset.sha256)).size === 97, 'Output hashes must be unique.');
  assert(provenance.assets.length === 97, 'Every generated music/SFX asset needs one provenance record.');
  const provenanceById = new Map(provenance.assets.map((entry) => [entry.id, entry]));
  assert(provenanceById.size === 97, 'Provenance IDs must be unique.');
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
    const isOriginal = record.generator === 'morrowmere-procedural-audio-v1' && record.externalSource === null;
    const isClearedRemaster = record.generator === 'morrowmere-cc0-remaster-v1'
      && Array.isArray(record.externalSource)
      && record.externalSource.length > 0
      && record.externalSource.every((source) => (
        source.license === 'CC0-1.0'
        && source.licenseUrl === 'https://creativecommons.org/publicdomain/zero/1.0/'
        && /^https:\/\/opengameart\.org\/content\/[a-z0-9-]+$/.test(source.sourceUrl)
        && /^https:\/\/opengameart\.org\/sites\/default\/files\/.+/.test(source.downloadUrl)
      ));
    assert(isOriginal || isClearedRemaster, `${asset.id} does not have cleared original or CC0 provenance.`);
    assert(record.commercialDistribution === true, `${asset.id} is not cleared for commercial distribution.`);
    assert(HASH_PATTERN.test(record.sourceMasterSha256), `${asset.id} source-master hash is invalid.`);
    assert(record.outputSha256 === asset.sha256, `${asset.id} provenance output hash differs.`);

    const media = probe(path, asset.id);
    assert(media.codec === 'mp3' && media.sampleRate === 22050 && media.channels === 1, `${asset.id} is not 22.05 kHz mono MP3.`);
    assert(Math.abs(media.durationMs - asset.durationMs) <= 120, `${asset.id} duration differs by more than 120 ms.`);
    const loudness = measureLoudness(path, asset.id);
    assert(Math.abs(loudness.integrated - asset.loudnessLufs) <= 0.11, `${asset.id} measured loudness differs from its manifest.`);
    assert(Math.abs(loudness.peak - asset.truePeakDbtp) <= 0.11, `${asset.id} measured peak differs from its manifest.`);
    if (asset.id.startsWith('music-')) {
      assert(asset.durationMs >= 75_000 && asset.durationMs <= 240_000, `${asset.id} music duration is outside the contract.`);
      if (asset.loop === false) {
        assert(asset.id === 'music-opening-score' && asset.loopStartMs === null && asset.loopEndMs === null, `${asset.id} is the only approved non-looping score.`);
      } else {
        assert(asset.loopStartMs >= 0 && asset.loopEndMs > asset.loopStartMs + 30_000 && Math.abs(asset.loopEndMs - asset.durationMs) <= 120, `${asset.id} loop window is invalid.`);
      }
      const targetLoudness = asset.id === 'music-opening-score' ? -17 : -18;
      assert(Math.abs(loudness.integrated - targetLoudness) <= 1, `${asset.id} measures ${loudness.integrated} LUFS; expected ${targetLoudness} +/-1.`);
      assert(loudness.peak <= -1, `${asset.id} true/sample peak ${loudness.peak} dBFS exceeds -1 dBFS.`);
    } else {
      assert(asset.durationMs >= 40 && asset.durationMs <= 20_000, `${asset.id} SFX duration is outside the contract.`);
    }
    if (asset.loop === true) validateLoopBoundary(path, asset.durationMs, asset.id);
    decode(path, asset.id);
  }

  const groupCounts = Object.fromEntries(['opening', 'main', 'companion'].map((group) => [group, voiceScript.cues.filter((cue) => cue.group === group).length]));
  assert(JSON.stringify(groupCounts) === JSON.stringify({ opening: 14, main: 16, companion: 8 }), 'Voice script must contain 14 opening, 16 main, and 8 companion cues.');
  const openingVoice = voiceScript.cues.filter((cue) => cue.group === 'opening');
  assert(openingVoice[0].startMs === 0 && openingVoice.at(-1).endMs === openingTimeline.durationMs, 'Opening voice timing must fill the cinematic without overrunning it.');
  assert(openingVoice.slice(1).every((cue, index) => cue.startMs === openingVoice[index].endMs), 'Opening voice timing must be ordered and contiguous.');
  assert(openingVoice.every((cue, index) => (
    cue.startMs === openingTimeline.shots[index]?.startMs
    && cue.endMs === openingTimeline.shots[index]?.endMs
  )), 'Every opening voice cue must align to exactly one visual shot.');
  assert(voiceScript.cues.filter((cue) => cue.group === 'main').every((cue) => cue.sceneId.includes('-main-')), 'Main voice cues must reference main scenes.');
  assert(voiceScript.cues.filter((cue) => cue.group === 'companion').every((cue) => cue.sceneId.includes('-companion-')), 'Companion voice cues must reference companion scenes.');
  const companionSpeakers = Object.fromEntries(['Mara', 'Rukhar', 'Caldus', 'Lyra', 'Talla'].map((speaker) => [speaker, voiceScript.cues.filter((cue) => cue.group === 'companion' && cue.speaker === speaker).length]));
  assert(JSON.stringify(companionSpeakers) === JSON.stringify({ Mara: 1, Rukhar: 2, Caldus: 2, Lyra: 2, Talla: 1 }), 'Companion voice allocation differs from the approved script.');
  assert(voiceScript.cues.every((cue) => cue.spokenText === cue.captionText), 'Every voice line must exactly match its caption.');
  assert(voiceScript.cues.every((cue) => cue.audioSrc && cue.delivery === 'bundled-kokoro-onnx'), 'Every approved story cue must use its bundled offline voice clip.');
  assert(voiceProfiles.profiles.length === 7 && voiceProfiles.profiles.every((profile) => profile.provider.voiceId === null), 'Provider voices must remain unselected until an authorized audition.');

  for (const cue of voiceScript.cues) {
    const path = assetPath(cue.audioSrc);
    expectedFiles.add(path);
    const details = await stat(path);
    assert(details.size > 4_000, `${cue.id} voice clip is unexpectedly small.`);
    const media = probe(path, cue.id);
    assert(media.codec === 'mp3' && media.sampleRate === 24_000 && media.channels === 1, `${cue.id} is not 24 kHz mono MP3.`);
    assert(media.durationMs >= 500 && media.durationMs <= 20_000, `${cue.id} voice duration is outside the contract.`);
    if (cue.group === 'opening') assert(media.durationMs < cue.endMs - cue.startMs, `${cue.id} overruns its cinematic slot.`);
    decode(path, cue.id);
    totalBytes += details.size;
  }

  const actualFiles = await listMp3(AUDIO_ROOT);
  assert(actualFiles.length === 135, `Expected exactly 135 shipped MP3 files; found ${actualFiles.length}.`);
  assert(actualFiles.every((path) => expectedFiles.has(path)), 'The shipped audio directory contains an orphan MP3.');
  assert(totalBytes < 55 * 1024 * 1024, `Audio pack is ${totalBytes} bytes; budget is 55 MiB.`);

  process.stdout.write(`Audio validation passed: 13 music, 84 SFX, 38 voice clips, 135 decoded MP3 files, ${totalBytes} bytes.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Audio validation failed.'}\n`);
    process.exitCode = 1;
  });
}
