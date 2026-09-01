import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CinematicSequence } from '../src/ui/types';
import { OPENING_SEQUENCE } from '../src/ui/openingSequence';
import * as audioCatalog from '../src/game/audio/catalog';
import { createAudioService, createCinematicAudioPort } from '../src/game/audio/service';

class ControllableAudio {
  currentTime = 0;
  loop = false;
  preload = 'none';
  volume = 1;
  playCount = 0;
  pauseCount = 0;
  currentTimeAtPlay: number | null = null;

  private readonly listeners = new Map<'ended' | 'error', Set<() => void>>();

  constructor(
    readonly src: string,
    private readonly start: () => Promise<void> = () => Promise.resolve(),
  ) {}

  addEventListener(type: 'ended' | 'error', listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: 'ended' | 'error', listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: 'ended' | 'error'): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener();
  }

  pause(): void { this.pauseCount += 1; }

  play(): Promise<void> {
    this.playCount += 1;
    this.currentTimeAtPlay = this.currentTime;
    return this.start();
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe('opening file-backed audio', () => {
  it('plays the dedicated opening score from its bundled path without looping', async () => {
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(src);
        created.push(audio);
        return audio;
      },
      localSpeech: null,
    });
    service.configure({ musicEnabled: true, musicVolume: 0.7, voiceEnabled: false });

    await createCinematicAudioPort(service).play(OPENING_SEQUENCE, 12_500);

    const score = created.find((audio) => audio.src === '/audio/chronicle1/music/music-opening-score.mp3');
    expect(score).toMatchObject({ loop: false, currentTime: 12.5, currentTimeAtPlay: 12.5, playCount: 1 });
    expect((OPENING_SEQUENCE as CinematicSequence & { readonly musicId: string }).musicId).toBe('music-opening-score');
  });

  it('rejects cinematic playback when the browser blocks the opening score', async () => {
    const service = createAudioService({
      createAudio: (src) => new ControllableAudio(src, () => Promise.reject(new Error('autoplay blocked'))),
      localSpeech: null,
    });
    service.configure({ musicEnabled: true, voiceEnabled: false });

    await expect(createCinematicAudioPort(service).play(OPENING_SEQUENCE, 0)).rejects.toThrow('autoplay blocked');
  });

  it('advances opening voice and SFX only when the cinematic timeline advances', async () => {
    vi.useFakeTimers();
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(src);
        created.push(audio);
        return audio;
      },
      localSpeech: null,
    });
    service.configure({ musicEnabled: true, voiceEnabled: true, sfxEnabled: true });
    const port = createCinematicAudioPort(service) as ReturnType<typeof createCinematicAudioPort> & {
      sync(positionMs: number): void;
    };

    await port.play(OPENING_SEQUENCE, 0);
    vi.advanceTimersByTime(36_500);

    expect(created.some((audio) => audio.src.endsWith('/voice-opening-07.mp3') && audio.playCount > 0)).toBe(false);
    expect(created.some((audio) => audio.src.endsWith('/sfx-narrative-warning.mp3') && audio.playCount > 0)).toBe(false);
    expect(port.sync).toBeTypeOf('function');

    port.sync?.(36_500);
    expect(created.some((audio) => audio.src.endsWith('/voice-opening-07.mp3') && audio.playCount > 0)).toBe(true);
    expect(created.some((audio) => audio.src.endsWith('/sfx-narrative-warning.mp3') && audio.playCount > 0)).toBe(true);
    expect(created.some((audio) => audio.src.endsWith('/sfx-arrow-hit.mp3') && audio.playCount > 0)).toBe(false);
  });

  it('reconciles delayed audio startup to the latest cinematic frame', async () => {
    let releaseScore: (() => void) | undefined;
    const scoreStarted = new Promise<void>((resolve) => { releaseScore = resolve; });
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(
          src,
          src.endsWith('/music-opening-score.mp3') ? () => scoreStarted : () => Promise.resolve(),
        );
        created.push(audio);
        return audio;
      },
      localSpeech: null,
    });
    service.configure({ musicEnabled: true, voiceEnabled: true });
    const port = createCinematicAudioPort(service) as ReturnType<typeof createCinematicAudioPort> & {
      sync(positionMs: number): void;
    };

    const playback = port.play(OPENING_SEQUENCE, 0);
    await Promise.resolve();
    expect(port.sync).toBeTypeOf('function');
    port.sync?.(7_500);
    releaseScore?.();
    await playback;

    expect(created.find((audio) => audio.src.endsWith('/music-opening-score.mp3'))?.currentTime).toBe(7.5);
    expect(created.find((audio) => audio.src.endsWith('/voice-opening-02.mp3'))?.currentTimeAtPlay).toBe(3.5);
  });

  it('keeps cinematic SFX below narration at a shared shot boundary', async () => {
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(src);
        created.push(audio);
        return audio;
      },
      localSpeech: null,
    });
    service.configure({ musicEnabled: true, voiceEnabled: true, sfxEnabled: true, sfxVolume: 0.8 });

    await createCinematicAudioPort(service).play(OPENING_SEQUENCE, 32_500);

    expect(created.find((audio) => audio.src.endsWith('/sfx-arrow-hit.mp3'))?.volume).toBeCloseTo(0.44, 5);
  });

  it('honors non-looping metadata when the opening score is played directly from the catalog', async () => {
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(src);
        created.push(audio);
        return audio;
      },
      localSpeech: null,
    });
    service.configure({ musicEnabled: true });

    await service.playMusic('music-opening-score');

    expect(created.find((audio) => audio.src.endsWith('/music-opening-score.mp3'))?.loop).toBe(false);
  });

  it('prefers a bundled voice clip, ducks music by ten decibels, and restores it when the clip ends', async () => {
    const spoken = vi.fn();
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(src);
        created.push(audio);
        return audio;
      },
      localSpeech: { cancel: vi.fn(), speak: spoken },
    });
    service.configure({ musicEnabled: true, musicVolume: 0.8, voiceEnabled: true, voiceVolume: 0.6 });
    await service.playMusic('music-title');

    await service.narrateCaption('The road remembers.', {
      speaker: 'Eldrin',
      audioSrc: '/audio/chronicle1/voice/opening/voice-opening-01.mp3',
    });

    const music = created.find((audio) => audio.src.endsWith('/music-title.mp3'));
    const voice = created.find((audio) => audio.src.endsWith('/voice-opening-01.mp3'));
    expect(voice).toMatchObject({ loop: false, volume: 0.6, playCount: 1 });
    expect(spoken).not.toHaveBeenCalled();
    expect(music?.volume).toBeCloseTo(0.8 * (10 ** (-10 / 20)), 5);

    voice?.emit('ended');
    expect(music?.volume).toBe(0.8);
  });

  it('keeps the opening score continuously ducked between shot-level voice clips', async () => {
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(src);
        created.push(audio);
        return audio;
      },
      localSpeech: null,
    });
    service.configure({ musicEnabled: true, musicVolume: 0.8, voiceEnabled: true, voiceVolume: 0.9 });
    const port = createCinematicAudioPort(service);

    await port.play(OPENING_SEQUENCE, 0);

    const score = created.find((audio) => audio.src.endsWith('/music-opening-score.mp3'));
    const firstVoice = created.find((audio) => audio.src.endsWith('/voice-opening-01.mp3'));
    expect(score?.volume).toBeCloseTo(0.8 * (10 ** (-10 / 20)), 5);

    firstVoice?.emit('ended');
    expect(score?.volume).toBeCloseTo(0.8 * (10 ** (-10 / 20)), 5);

    port.sync(4_000);
    created.find((audio) => audio.src.endsWith('/voice-opening-02.mp3'))?.emit('ended');
    expect(score?.volume).toBeCloseTo(0.8 * (10 ** (-10 / 20)), 5);

    port.stop();
    await service.playMusic('music-title');
    expect(created.find((audio) => audio.src.endsWith('/music-title.mp3'))?.volume).toBe(0.8);
  });

  it('falls back to local speech, restores ducking, and reports a rejected voice clip when requested', async () => {
    const spoken = vi.fn();
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(
          src,
          src.endsWith('/voice-opening-01.mp3')
            ? () => Promise.reject(new Error('voice decode failed'))
            : () => Promise.resolve(),
        );
        created.push(audio);
        return audio;
      },
      localSpeech: { cancel: vi.fn(), speak: spoken },
    });
    service.configure({ musicEnabled: true, musicVolume: 0.7, voiceEnabled: true });
    await service.playMusic('music-title');

    const narration = (service.narrateCaption as unknown as (
      text: string,
      options: { readonly speaker: 'Eldrin'; readonly audioSrc: string; readonly reportFailure: boolean },
    ) => Promise<void>)('No crown waits at Greywatch.', {
      speaker: 'Eldrin',
      audioSrc: '/audio/chronicle1/voice/opening/voice-opening-01.mp3',
      reportFailure: true,
    });

    expect(narration).toBeInstanceOf(Promise);
    await expect(narration).rejects.toThrow('voice decode failed');
    expect(spoken).toHaveBeenCalledWith('No crown waits at Greywatch.', expect.objectContaining({ volume: 0.9 }));
    expect(created.find((audio) => audio.src.endsWith('/music-title.mp3'))?.volume).toBe(0.7);
  });

  it('ignores a late failure from a voice clip that a newer cue replaced', async () => {
    let rejectFirst: ((error: Error) => void) | undefined;
    const firstStart = new Promise<void>((_resolve, reject) => { rejectFirst = reject; });
    const spoken = vi.fn();
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(
          src,
          src.endsWith('/voice-opening-01.mp3') ? () => firstStart : () => Promise.resolve(),
        );
        created.push(audio);
        return audio;
      },
      localSpeech: { cancel: vi.fn(), speak: spoken },
    });
    service.configure({ musicEnabled: true, musicVolume: 0.7, voiceEnabled: true });
    await service.playMusic('music-title');

    const first = service.narrateCaption('First cue.', {
      audioSrc: '/audio/chronicle1/voice/opening/voice-opening-01.mp3',
    });
    await service.narrateCaption('Second cue.', {
      audioSrc: '/audio/chronicle1/voice/opening/voice-opening-02.mp3',
    });
    rejectFirst?.(new Error('late failure'));
    await first;

    expect(spoken).not.toHaveBeenCalled();
    expect(created.find((audio) => audio.src.endsWith('/music-title.mp3'))?.volume)
      .toBeCloseTo(0.7 * (10 ** (-10 / 20)), 5);
  });

  it('exposes scene voice lookup and playback for main and companion cues', async () => {
    const lookup = (audioCatalog as unknown as {
      readonly voiceCueForScene?: (sceneId: string) => { readonly id: string } | undefined;
    }).voiceCueForScene;
    expect(lookup).toBeTypeOf('function');
    expect(lookup?.('ch01-main-the-first-arrow')?.id).toBe('voice-ch01-main-the-first-arrow');
    expect(lookup?.('scene-that-does-not-exist')).toBeUndefined();

    const spoken = vi.fn();
    const created: ControllableAudio[] = [];
    const service = createAudioService({
      createAudio(src) {
        const audio = new ControllableAudio(src);
        created.push(audio);
        return audio;
      },
      localSpeech: { cancel: vi.fn(), speak: spoken },
    });
    service.configure({ voiceEnabled: true });
    const narrateScene = (service as unknown as {
      readonly narrateScene?: (sceneId: string) => Promise<boolean>;
    }).narrateScene;
    expect(narrateScene).toBeTypeOf('function');
    await expect(narrateScene?.('ch01-main-the-first-arrow')).resolves.toBe(true);
    expect(created.find((audio) => audio.src === '/audio/chronicle1/voice/en/voice-ch01-main-the-first-arrow.mp3'))
      .toMatchObject({ playCount: 1, loop: false });
    expect(spoken).not.toHaveBeenCalled();
    await expect(narrateScene?.('scene-that-does-not-exist')).resolves.toBe(false);
  });
});
