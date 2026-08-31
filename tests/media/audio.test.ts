import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CinematicSequence } from '../../src/ui/types';
import { OPENING_NARRATION, OPENING_SEQUENCE } from '../../src/ui/openingSequence';
import {
  AUDIO_MANIFEST,
  MUSIC_ASSETS,
  MUSIC_IDS,
  OPENING_VOICE_CUES,
  SFX_ASSETS,
  SFX_CUE_VARIANTS,
  VOICE_PROFILES,
  VOICE_SCRIPT,
  createAudioService,
  createCinematicAudioPort,
  cueForDomainEvent,
} from '../../src/game/audio';

const ROOT = resolve(import.meta.dirname, '../..');
const CREDENTIAL_PATTERN = new RegExp([
  'xi-api-key',
  'ELEVENLABS_API_KEY',
  String.raw`\bsk_[A-Za-z0-9_-]+`,
].join('|'), 'i');

class FakeAudio {
  currentTime = 0;
  loop = false;
  preload = 'none';
  volume = 1;
  playCount = 0;
  pauseCount = 0;
  loadCount = 0;

  constructor(readonly src: string) {}

  load(): void { this.loadCount += 1; }
  pause(): void { this.pauseCount += 1; }
  play(): Promise<void> { this.playCount += 1; return Promise.resolve(); }
}

const EXPECTED_MUSIC_IDS = [
  'music-title', 'music-camp', 'music-merchant', 'music-kings-road', 'music-greywatch', 'music-old-forest',
  'music-redwater', 'music-embervault', 'music-greywatch-siege', 'music-crownless-keep',
  'music-false-coronation', 'music-ending-road',
] as const;

describe('Chronicle I offline audio pack', () => {
  it('ships the exact original music and SFX ledger with unique verified files', () => {
    expect(MUSIC_IDS).toEqual(EXPECTED_MUSIC_IDS);
    expect(MUSIC_ASSETS).toHaveLength(12);
    expect(SFX_ASSETS).toHaveLength(84);
    expect(Object.fromEntries(
      ['weapons', 'defense', 'magic', 'status', 'enemy', 'ui', 'narrative', 'ambience']
        .map((group) => [group, SFX_ASSETS.filter((asset) => asset.group === group).length]),
    )).toEqual({ weapons: 12, defense: 8, magic: 12, status: 8, enemy: 12, ui: 14, narrative: 12, ambience: 6 });
    expect(SFX_CUE_VARIANTS.attack).toHaveLength(3);
    expect(SFX_CUE_VARIANTS.block).toHaveLength(3);
    expect(new Set([...MUSIC_ASSETS, ...SFX_ASSETS].map((asset) => asset.id)).size).toBe(96);
    expect(new Set([...MUSIC_ASSETS, ...SFX_ASSETS].map((asset) => asset.src)).size).toBe(96);
    expect(new Set([...MUSIC_ASSETS, ...SFX_ASSETS].map((asset) => asset.sha256)).size).toBe(96);
    expect(MUSIC_ASSETS.every((asset) => asset.durationMs >= 75_000 && asset.durationMs <= 240_000)).toBe(true);
    expect(MUSIC_ASSETS.every((asset) => asset.loopEndMs > asset.loopStartMs + 30_000)).toBe(true);
    expect(SFX_ASSETS.every((asset) => asset.durationMs >= 40 && asset.durationMs <= 20_000)).toBe(true);
    expect([...MUSIC_ASSETS, ...SFX_ASSETS].every((asset) => asset.provenance.commercialDistribution)).toBe(true);

    for (const asset of [...MUSIC_ASSETS, ...SFX_ASSETS]) {
      const bytes = readFileSync(resolve(ROOT, asset.src.replace(/^\//, 'public/')));
      expect(bytes.byteLength, asset.id).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex'), asset.id).toBe(asset.sha256);
    }
    expect([...MUSIC_ASSETS, ...SFX_ASSETS].reduce((sum, asset) => sum + asset.bytes, 0)).toBeLessThan(55 * 1024 * 1024);
    expect(JSON.stringify(AUDIO_MANIFEST)).not.toMatch(CREDENTIAL_PATTERN);
  });

  it('keeps critical, miss, and block as distinct sound designs and maps core outcomes', () => {
    const critical = new Set<string>(SFX_CUE_VARIANTS.critical);
    const miss = new Set<string>(SFX_CUE_VARIANTS.miss);
    const block = new Set<string>(SFX_CUE_VARIANTS.block);
    expect([...critical].some((id) => miss.has(id) || block.has(id))).toBe(false);
    expect([...miss].some((id) => block.has(id))).toBe(false);
    expect(cueForDomainEvent({ type: 'attack_resolved', attackerId: 'hero', targetId: 'orc', outcome: 'critical', damage: 12, powerVariation: 1 })).toBe('critical');
    expect(cueForDomainEvent({ type: 'attack_resolved', attackerId: 'orc', targetId: 'hero', outcome: 'blocked', damage: 0, powerVariation: 0 })).toBe('block');
    expect(cueForDomainEvent({ type: 'trade_completed', merchantId: 'road-trader' as never, tradeType: 'buy', itemId: 'potion' as never, quantity: 1, total: 4, unbankedSpent: 4, bankedSpent: 0 })).toBe('merchant-buy');
    expect(cueForDomainEvent({ type: 'consumable_used', instanceId: 'field-tonic-1' })).toBe('consume');
    expect(cueForDomainEvent({ type: 'flee_resolved', escaped: true })).toBeNull();
    expect(cueForDomainEvent({ type: 'combat_ended', encounterId: 'road-ambush' as never, outcome: 'fled' })).toBe('flee');
  });

  it('rotates file-backed variants, honors channel settings, and fails open', async () => {
    const audio: FakeAudio[] = [];
    const service = createAudioService({
      createAudio: (src) => {
        const element = new FakeAudio(src);
        audio.push(element);
        return element;
      },
    });
    service.configure({ sfxEnabled: true, musicEnabled: true, sfxVolume: 0.4, musicVolume: 0.3 });
    service.playSfx('attack');
    service.playSfx('attack');
    service.playSfx('attack');
    const attacks = audio.filter((element) => element.playCount > 0);
    expect(attacks.map((element) => element.src)).toEqual(SFX_CUE_VARIANTS.attack.map((id) => `/audio/chronicle1/sfx/${id}.mp3`));
    expect(attacks.every((element) => element.volume === 0.4)).toBe(true);

    service.configure({ sfxEnabled: false });
    service.playSfx('critical');
    expect(audio.filter((element) => element.playCount > 0)).toHaveLength(3);

    await service.playMusic('music-title');
    const music = audio.find((element) => element.src === '/audio/chronicle1/music/music-title.mp3');
    expect(music).toMatchObject({ loop: true, volume: 0.3, playCount: 1 });
    service.configure({ musicEnabled: false });
    expect(music?.pauseCount).toBe(1);

    const unavailable = createAudioService({ createAudio: () => { throw new Error('unsupported'); } });
    expect(() => unavailable.playSfx('attack')).not.toThrow();
    await expect(unavailable.playMusic('music-title')).resolves.toBeUndefined();
  });

  it('uses exact caption text for local speech and keeps the cinematic port non-fatal', async () => {
    vi.useFakeTimers();
    const spoken: string[] = [];
    const audio: FakeAudio[] = [];
    const service = createAudioService({
      createAudio: (src) => {
        const element = new FakeAudio(src);
        audio.push(element);
        return element;
      },
      localSpeech: {
        cancel(): void {},
        speak(text): void { spoken.push(text); },
      },
    });
    service.configure({ voiceEnabled: true, voiceVolume: 0.7 });
    service.narrateCaption('Keep the road open.', { speaker: 'Eldrin' });
    expect(spoken).toEqual(['Keep the road open.']);
    service.configure({ voiceEnabled: false });
    service.narrateCaption('This must remain caption-only.', { speaker: 'Eldrin' });
    expect(spoken).toEqual(['Keep the road open.']);

    const sequence: CinematicSequence = {
      id: 'chronicle-1-opening',
      durationMs: 2_000,
      musicId: 'music-title',
      voiceId: 'voice-opening-eldrin-en',
      shots: [
        { id: 'opening-01-fractured-kingdom', imageId: '/one.webp', alt: 'One', caption: 'First caption.', startMs: 0, endMs: 1_000, motion: 'still', sfxCueIds: ['sfx-narrative-reveal'] },
        { id: 'opening-06-the-first-arrow', imageId: '/two.webp', alt: 'Two', caption: 'Second caption.', startMs: 1_000, endMs: 2_000, motion: 'still', sfxCueIds: ['sfx-arrow-hit'] },
      ],
    };
    service.configure({ voiceEnabled: true });
    const port = createCinematicAudioPort(service);
    await expect(port.preload(sequence)).resolves.toBeUndefined();
    await expect(port.play(sequence, 0)).resolves.toBeUndefined();
    expect(audio.some((element) => element.src === '/audio/chronicle1/music/music-title.mp3' && element.playCount > 0)).toBe(true);
    expect(spoken.at(-1)).toBe(OPENING_VOICE_CUES[0]?.spokenText);
    vi.advanceTimersByTime(1_000);
    expect(audio.some((element) => element.src.endsWith('/sfx-arrow-hit.mp3') && element.playCount > 0)).toBe(true);
    port.stop();
  });

  it('locks a caption-identical 8 + 16 + 8 voice script without shipping credentials', () => {
    expect(VOICE_SCRIPT.filter((cue) => cue.group === 'opening')).toHaveLength(8);
    expect(VOICE_SCRIPT.filter((cue) => cue.group === 'main')).toHaveLength(16);
    expect(VOICE_SCRIPT.filter((cue) => cue.group === 'companion')).toHaveLength(8);
    expect(VOICE_SCRIPT.filter((cue) => cue.group === 'main').every((cue) => cue.sceneId?.includes('-main-'))).toBe(true);
    expect(VOICE_SCRIPT.filter((cue) => cue.group === 'companion').every((cue) => cue.sceneId?.includes('-companion-'))).toBe(true);
    expect(Object.fromEntries(['Mara', 'Rukhar', 'Caldus', 'Lyra', 'Talla'].map((speaker) => [
      speaker,
      VOICE_SCRIPT.filter((cue) => cue.group === 'companion' && cue.speaker === speaker).length,
    ]))).toEqual({ Mara: 1, Rukhar: 2, Caldus: 2, Lyra: 2, Talla: 1 });
    expect(VOICE_SCRIPT.every((cue) => cue.captionText === cue.spokenText)).toBe(true);
    expect(OPENING_VOICE_CUES).toHaveLength(8);
    expect(OPENING_VOICE_CUES.map((cue) => cue.spokenText)).toEqual(OPENING_NARRATION);
    expect(OPENING_VOICE_CUES[0]?.startMs).toBe(0);
    expect(OPENING_VOICE_CUES.at(-1)?.endMs).toBe(OPENING_SEQUENCE.durationMs);
    expect(OPENING_VOICE_CUES.slice(1).every((cue, index) => cue.startMs === OPENING_VOICE_CUES[index]?.endMs)).toBe(true);
    expect(JSON.stringify({ script: VOICE_SCRIPT, profiles: VOICE_PROFILES })).not.toMatch(CREDENTIAL_PATTERN);
  });
});

afterEach(() => {
  vi.useRealTimers();
});
