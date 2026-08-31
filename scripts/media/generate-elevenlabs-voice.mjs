import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT_PATH = resolve(ROOT, 'production/chronicle1/media/voice-script.json');
const PROFILES_PATH = resolve(ROOT, 'production/chronicle1/media/voice-profiles.json');
const OUTPUT_DIRECTORY = resolve(ROOT, '.media-work/chronicle1/voice/en');

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function main() {
  if (!process.argv.includes('--execute')) {
    fail('Refusing to call a paid provider without --execute. Review voice profiles and run with ELEVENLABS_API_KEY in the local environment.');
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    fail('ELEVENLABS_API_KEY is required in the local process environment.');
    return;
  }

  const [script, profiles] = await Promise.all([readJson(SCRIPT_PATH), readJson(PROFILES_PATH)]);
  const profileBySpeaker = new Map(profiles.profiles.map((profile) => [profile.speaker, profile]));
  const jobs = script.cues.map((cue) => {
    const profile = profileBySpeaker.get(cue.speaker);
    if (!profile?.provider?.voiceId || profile.provider.status !== 'approved') {
      throw new Error(`Voice profile ${cue.speaker} is not approved; audition and record a non-secret voiceId before generation.`);
    }
    if (cue.spokenText !== cue.captionText) throw new Error(`Caption mismatch for ${cue.id}.`);
    if (!/^[a-z0-9-]+$/.test(cue.id)) throw new Error(`Unsafe cue ID ${cue.id}.`);
    return { cue, profile };
  });

  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  for (const { cue, profile } of jobs) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(profile.provider.voiceId)}?output_format=mp3_44100_128`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({
        text: cue.spokenText,
        model_id: profile.provider.modelId,
        voice_settings: { stability: 0.52, similarity_boost: 0.72, style: 0.18, use_speaker_boost: true },
      }),
    });
    if (!response.ok) throw new Error(`Voice generation failed for ${cue.id} with HTTP ${response.status}.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(resolve(OUTPUT_DIRECTORY, `${cue.id}.mp3`), bytes);
    process.stdout.write(`${cue.id}: HTTP ${response.status}, ${bytes.byteLength} bytes\n`);
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : 'Voice generation failed.'));
