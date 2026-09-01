import type { DomainEvent } from '../domain/result';
import type { CinematicAudioPort, CinematicSequence, FeedbackCue } from '../../ui/types';
import {
  OPENING_VOICE_CUES,
  musicAsset,
  resolveSfxCue,
  sfxAsset,
  voiceCueForId,
  voiceCueForScene,
  voiceProfile,
  type AmbienceId,
  type MusicId,
  type SemanticSfxCue,
  type SfxCue,
  type VoiceSpeaker,
} from './catalog';

export interface AudioElementLike {
  currentTime: number;
  loop: boolean;
  preload: string;
  volume: number;
  addEventListener?(type: 'ended' | 'error', listener: () => void): void;
  load?(): void;
  pause(): void;
  play(): Promise<void> | void;
  removeEventListener?(type: 'ended' | 'error', listener: () => void): void;
}

export interface LocalSpeechPort {
  cancel(): void;
  speak(text: string, options: { readonly lang: string; readonly rate: number; readonly pitch: number; readonly volume: number }): void;
}

export interface AudioPreferences {
  readonly sfxEnabled: boolean;
  readonly musicEnabled: boolean;
  readonly ambienceEnabled: boolean;
  readonly voiceEnabled: boolean;
  readonly sfxVolume: number;
  readonly musicVolume: number;
  readonly voiceVolume: number;
}

export interface NarrationOptions {
  readonly speaker?: VoiceSpeaker;
  readonly audioSrc?: string | null;
  readonly offsetMs?: number;
  readonly reportFailure?: boolean;
  readonly holdMusicDucking?: boolean;
  readonly onComplete?: () => void;
}

export interface MusicPlaybackOptions {
  readonly loop?: boolean;
  readonly positionMs?: number;
  readonly reportFailure?: boolean;
  readonly src?: string;
}

export interface AudioServiceDependencies {
  readonly createAudio?: (src: string) => AudioElementLike;
  readonly localSpeech?: LocalSpeechPort | null;
}

export interface AudioService {
  configure(settings: Partial<AudioPreferences>): void;
  preferences(): AudioPreferences;
  preload(srcs: readonly string[]): Promise<void>;
  playSfx(cue: SfxCue, enabled?: boolean, volumeScale?: number): void;
  playMusic(id: MusicId | string, enabled?: boolean, options?: MusicPlaybackOptions): Promise<void>;
  stopMusic(): void;
  seekMusic(positionMs: number): void;
  playAmbience(id: AmbienceId, enabled?: boolean): Promise<void>;
  stopAmbience(): void;
  narrateCaption(text: string, options?: NarrationOptions): Promise<void>;
  narrateCue(voiceCueId: string, onComplete?: () => void): Promise<boolean>;
  narrateScene(sceneId: string): Promise<boolean>;
  cancelNarration(): void;
  pauseAll(): void;
  resumeAll(): void;
  stopAll(): void;
}

const DEFAULT_PREFERENCES: AudioPreferences = Object.freeze({
  sfxEnabled: true,
  musicEnabled: true,
  ambienceEnabled: true,
  voiceEnabled: false,
  sfxVolume: 0.8,
  musicVolume: 0.7,
  voiceVolume: 0.9,
});

const VOICE_DUCK_GAIN = 10 ** (-10 / 20);

function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function browserAudioFactory(src: string): AudioElementLike {
  if (typeof Audio === 'undefined') throw new Error('HTML audio is unavailable.');
  return new Audio(src);
}

function browserSpeechPort(): LocalSpeechPort | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return null;
  return {
    cancel(): void { window.speechSynthesis.cancel(); },
    speak(text, options): void {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang;
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.volume = options.volume;
      const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith(options.lang.toLowerCase()));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    },
  };
}

function safePause(element: AudioElementLike | null): void {
  if (!element) return;
  try { element.pause(); } catch { /* Audio is optional and must fail open. */ }
}

function safePlay(element: AudioElementLike | null, onFailure?: () => void): void {
  if (!element) { onFailure?.(); return; }
  void attemptPlay(element).catch(() => onFailure?.());
}

function attemptPlay(element: AudioElementLike): Promise<void> {
  try {
    const result = element.play();
    return result ? Promise.resolve(result) : Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

export function createAudioService(dependencies: AudioServiceDependencies = {}): AudioService {
  const createAudio = dependencies.createAudio ?? browserAudioFactory;
  const localSpeech = dependencies.localSpeech === undefined ? browserSpeechPort() : dependencies.localSpeech;
  const rotations = new Map<string, number>();
  const sfxPools = new Map<string, { readonly elements: AudioElementLike[]; cursor: number }>();
  let settings = { ...DEFAULT_PREFERENCES };
  let music: {
    readonly id: string;
    readonly src: string;
    readonly element: AudioElementLike;
    readonly loop: boolean;
    readonly loopStartMs: number;
    readonly loopEndMs: number;
  } | null = null;
  let ambience: { readonly id: string; readonly element: AudioElementLike } | null = null;
  let narration: {
    readonly element: AudioElementLike;
    readonly holdMusicDucking: boolean;
    detach(): void;
  } | null = null;
  let musicDucked = false;
  let resumeMusic = false;
  let resumeAmbience = false;

  const make = (src: string): AudioElementLike | null => {
    try {
      const element = createAudio(src);
      element.preload = 'auto';
      return element;
    } catch {
      return null;
    }
  };

  const applyMusicVolume = (): void => {
    if (!music) return;
    try {
      music.element.volume = clampVolume(settings.musicVolume * (musicDucked ? VOICE_DUCK_GAIN : 1));
    } catch { /* Optional audio must fail open. */ }
  };

  const releaseNarration = (element: AudioElementLike, pause: boolean): void => {
    if (narration?.element !== element) return;
    const active = narration;
    narration = null;
    active.detach();
    if (pause) safePause(element);
    if (!active.holdMusicDucking) {
      musicDucked = false;
      applyMusicVolume();
    }
  };

  const stopNarrationFile = (): void => {
    if (!narration) return;
    releaseNarration(narration.element, true);
  };

  const seekActiveMusic = (positionMs: number): void => {
    if (!music) return;
    const position = Math.max(0, positionMs);
    const loopDuration = music.loopEndMs - music.loopStartMs;
    const targetMs = music.loop && loopDuration > 0
      ? music.loopStartMs + position % loopDuration
      : position;
    try { music.element.currentTime = targetMs / 1_000; } catch { /* Optional audio. */ }
  };

  const configure = (changed: Partial<AudioPreferences>): void => {
    settings = {
      ...settings,
      ...changed,
      sfxVolume: clampVolume(changed.sfxVolume ?? settings.sfxVolume),
      musicVolume: clampVolume(changed.musicVolume ?? settings.musicVolume),
      voiceVolume: clampVolume(changed.voiceVolume ?? settings.voiceVolume),
    };
    applyMusicVolume();
    try { if (ambience) ambience.element.volume = settings.musicVolume * 0.55; } catch { /* Optional audio must fail open. */ }
    if (!settings.musicEnabled || settings.musicVolume === 0) {
      resumeMusic = false;
      safePause(music?.element ?? null);
    }
    if (!settings.ambienceEnabled || settings.musicVolume === 0) {
      resumeAmbience = false;
      safePause(ambience?.element ?? null);
    }
    if (!settings.voiceEnabled || settings.voiceVolume === 0) {
      stopNarrationFile();
      musicDucked = false;
      applyMusicVolume();
      try { localSpeech?.cancel(); } catch { /* Local narration is optional. */ }
    }
  };

  const playSfx = (cue: SfxCue, enabled = true, volumeScale = 1): void => {
    if (!enabled || !settings.sfxEnabled || settings.sfxVolume === 0) return;
    const rotation = rotations.get(cue) ?? 0;
    const asset = resolveSfxCue(cue, rotation);
    if (!asset) return;
    rotations.set(cue, rotation + 1);
    let pool = sfxPools.get(asset.src);
    if (!pool) {
      pool = { elements: [], cursor: 0 };
      sfxPools.set(asset.src, pool);
    }
    let element: AudioElementLike | undefined = pool.elements[pool.cursor];
    if (!element) {
      element = make(asset.src) ?? undefined;
      if (!element) return;
      pool.elements.push(element);
    }
    pool.cursor = (pool.cursor + 1) % 3;
    try {
      element.currentTime = 0;
      element.volume = clampVolume(settings.sfxVolume * volumeScale);
      element.loop = false;
    } catch { return; }
    safePlay(element);
  };

  const playMusic = async (
    id: MusicId | string,
    enabled = true,
    options: MusicPlaybackOptions = {},
  ): Promise<void> => {
    if (!enabled || !settings.musicEnabled || settings.musicVolume === 0) { safePause(music?.element ?? null); return; }
    const asset = musicAsset(id);
    const src = options.src ?? asset?.src;
    if (!src) {
      if (options.reportFailure) throw new Error(`Unknown music asset ${id}.`);
      return;
    }
    const loop = options.loop ?? asset?.loop ?? true;
    if (music?.id !== id || music.src !== src || music.loop !== loop) {
      safePause(music?.element ?? null);
      const element = make(src);
      if (!element) {
        if (options.reportFailure) throw new Error(`Unable to create audio for ${id}.`);
        return;
      }
      try {
        element.loop = loop;
        element.currentTime = loop ? (asset?.loopStartMs ?? 0) / 1_000 : 0;
      } catch (error) {
        if (options.reportFailure) throw error;
        return;
      }
      music = {
        id,
        src,
        element,
        loop,
        loopStartMs: asset?.loopStartMs ?? 0,
        loopEndMs: asset?.loopEndMs ?? 0,
      };
    }
    if (options.positionMs !== undefined) seekActiveMusic(options.positionMs);
    applyMusicVolume();
    try {
      await attemptPlay(music.element);
    } catch (error) {
      if (options.reportFailure) throw error;
    }
  };

  const stopMusic = (): void => {
    safePause(music?.element ?? null);
    if (music) {
      try { music.element.currentTime = 0; } catch { /* Optional audio. */ }
    }
    music = null;
  };

  const seekMusic = (positionMs: number): void => {
    seekActiveMusic(positionMs);
  };

  const playAmbience = async (id: AmbienceId, enabled = true): Promise<void> => {
    if (!enabled || !settings.ambienceEnabled || settings.musicVolume === 0) { safePause(ambience?.element ?? null); return; }
    const asset = sfxAsset(id);
    if (!asset || asset.group !== 'ambience') return;
    if (ambience?.id !== id) {
      safePause(ambience?.element ?? null);
      const element = make(asset.src);
      if (!element) return;
      try { element.loop = true; } catch { return; }
      ambience = { id, element };
    }
    try { ambience.element.volume = settings.musicVolume * 0.55; } catch { return; }
    safePlay(ambience.element);
  };

  const stopAmbience = (): void => {
    safePause(ambience?.element ?? null);
    ambience = null;
  };

  const speakLocally = (text: string, speaker: VoiceSpeaker): void => {
    const profile = voiceProfile(speaker) ?? voiceProfile('Eldrin');
    if (!localSpeech || !profile) return;
    try {
      localSpeech.cancel();
      localSpeech.speak(text, { ...profile.local, volume: settings.voiceVolume });
    } catch { /* Captions remain authoritative if local speech fails. */ }
  };

  const narrateCaption = async (text: string, options: NarrationOptions = {}): Promise<void> => {
    if (!text.trim() || !settings.voiceEnabled || settings.voiceVolume === 0) return;
    const speaker = options.speaker ?? 'Eldrin';
    stopNarrationFile();
    if (!options.audioSrc) { speakLocally(text, speaker); options.onComplete?.(); return; }
    try { localSpeech?.cancel(); } catch { /* Captions remain authoritative. */ }
    const clip = make(options.audioSrc);
    if (!clip) {
      speakLocally(text, speaker);
      options.onComplete?.();
      if (options.reportFailure) throw new Error(`Unable to create narration audio ${options.audioSrc}.`);
      return;
    }
    try {
      clip.loop = false;
      clip.volume = settings.voiceVolume;
      clip.currentTime = Math.max(0, options.offsetMs ?? 0) / 1_000;
    } catch (error) {
      speakLocally(text, speaker);
      options.onComplete?.();
      if (options.reportFailure) throw error;
      return;
    }
    let usedFallback = false;
    const fallback = (): void => {
      if (usedFallback || !settings.voiceEnabled || settings.voiceVolume === 0) return;
      usedFallback = true;
      speakLocally(text, speaker);
    };
    let completed = false;
    const finish = (fallbackToSpeech: boolean): void => {
      if (completed || narration?.element !== clip) return;
      completed = true;
      releaseNarration(clip, false);
      if (fallbackToSpeech) fallback();
      options.onComplete?.();
    };
    const ended = (): void => { finish(false); };
    const failed = (): void => {
      finish(true);
    };
    const active = {
      element: clip,
      holdMusicDucking: options.holdMusicDucking ?? false,
      detach(): void {
        try { clip.removeEventListener?.('ended', ended); } catch { /* Optional audio. */ }
        try { clip.removeEventListener?.('error', failed); } catch { /* Optional audio. */ }
      },
    };
    narration = active;
    try { clip.addEventListener?.('ended', ended); } catch { /* Optional audio. */ }
    try { clip.addEventListener?.('error', failed); } catch { /* Optional audio. */ }
    musicDucked = true;
    applyMusicVolume();
    try {
      await attemptPlay(clip);
    } catch (error) {
      failed();
      if (options.reportFailure) throw error;
    }
  };

  const narrateScene = async (sceneId: string): Promise<boolean> => {
    const cue = voiceCueForScene(sceneId);
    if (!cue) return false;
    await narrateCaption(cue.spokenText, { speaker: cue.speaker, audioSrc: cue.audioSrc });
    return true;
  };

  const narrateCue = async (voiceCueId: string, onComplete?: () => void): Promise<boolean> => {
    const cue = voiceCueForId(voiceCueId);
    if (!cue) return false;
    await narrateCaption(cue.spokenText, { speaker: cue.speaker, audioSrc: cue.audioSrc, onComplete });
    return true;
  };

  const cancelNarration = (): void => {
    stopNarrationFile();
    musicDucked = false;
    applyMusicVolume();
    try { localSpeech?.cancel(); } catch { /* Optional narration. */ }
  };

  const pauseAll = (): void => {
    resumeMusic = music !== null && settings.musicEnabled && settings.musicVolume > 0;
    resumeAmbience = ambience !== null && settings.ambienceEnabled && settings.musicVolume > 0;
    safePause(music?.element ?? null);
    safePause(ambience?.element ?? null);
    cancelNarration();
  };

  const resumeAll = (): void => {
    if (resumeMusic && settings.musicEnabled && settings.musicVolume > 0) safePlay(music?.element ?? null);
    if (resumeAmbience && settings.ambienceEnabled && settings.musicVolume > 0) safePlay(ambience?.element ?? null);
    resumeMusic = false;
    resumeAmbience = false;
  };

  return {
    configure,
    preferences: () => ({ ...settings }),
    async preload(srcs): Promise<void> {
      for (const src of new Set(srcs)) {
        const element = make(src);
        if (!element) continue;
        try { element.load?.(); } catch { /* Preload never blocks the visual experience. */ }
      }
    },
    playSfx,
    playMusic,
    stopMusic,
    seekMusic,
    playAmbience,
    stopAmbience,
    narrateCaption,
    narrateCue,
    narrateScene,
    cancelNarration,
    pauseAll,
    resumeAll,
    stopAll(): void {
      stopMusic();
      stopAmbience();
      cancelNarration();
      for (const pool of sfxPools.values()) pool.elements.forEach(safePause);
    },
  };
}

export function cueForDomainEvent(event: DomainEvent): SemanticSfxCue | null {
  if (event.type === 'attack_resolved') {
    if (event.outcome === 'critical') return 'critical';
    if (event.outcome === 'miss') return 'miss';
    if (event.outcome === 'blocked') return 'block';
    if (event.outcome === 'parried') return 'parry';
    return 'attack';
  }
  if (event.type === 'combat_started') return 'warning';
  if (event.type === 'combat_ended') return event.outcome === 'victory' ? 'victory' : event.outcome === 'defeat' ? 'defeat' : 'flee';
  if (event.type === 'choice_resolved') return 'choice';
  if (event.type === 'trade_completed') return event.tradeType === 'buy' ? 'merchant-buy' : 'merchant-sell';
  if (event.type === 'battle_rewards_granted' || event.type === 'battle_reward_claimed') return 'loot';
  if (event.type === 'item_changed') return event.quantity > 0 ? 'loot' : 'consume';
  if (event.type === 'consumable_used') return 'consume';
  if (event.type === 'boss_phase_changed') return 'boss-phase';
  if (event.type === 'combatant_defeated') return 'enemy-death';
  if (event.type === 'companion_activated') return 'confirm';
  if (event.type === 'camp_banked') return 'coins';
  if (event.type === 'combat_action_rejected' || (event.type === 'flee_resolved' && !event.escaped)) return 'warning';
  return null;
}

export function playDomainEvents(service: AudioService, events: readonly DomainEvent[], enabled = true): void {
  if (!enabled) return;
  for (const event of events) {
    const cue = cueForDomainEvent(event);
    if (cue) service.playSfx(cue);
  }
}

export function createFeedbackAudioPort(service: AudioService): { consume(cues: readonly FeedbackCue[]): void } {
  return {
    consume(cues): void {
      for (const cue of cues) if (cue.type === 'sfx') service.playSfx(cue.cueId, true, cue.gain);
    },
  };
}

export interface TimelineCinematicAudioPort extends CinematicAudioPort {
  sync(positionMs: number): void;
}

interface ActiveCinematicTimeline {
  readonly sequence: CinematicSequence;
  readonly generation: number;
  positionMs: number;
  ready: boolean;
  voiceCueId: string | null;
}

const CINEMATIC_SFX_GAIN = 0.55;
const CINEMATIC_CUE_GRACE_MS = 500;

export function createCinematicAudioPort(service: AudioService): TimelineCinematicAudioPort {
  let generation = 0;
  let timeline: ActiveCinematicTimeline | null = null;

  const invalidateTimeline = (): void => {
    generation += 1;
    timeline = null;
    service.cancelNarration();
  };

  const voiceAt = (active: CinematicSequence, positionMs: number) => (
    active.id === 'chronicle-1-opening'
      ? OPENING_VOICE_CUES.find((cue) => {
        const startMs = cue.startMs ?? 0;
        const endMs = cue.endMs ?? startMs;
        return startMs <= positionMs && positionMs < endMs;
      })
      : undefined
  );

  const syncVoice = (active: ActiveCinematicTimeline, reportFailure: boolean): Promise<void> => {
    const cue = voiceAt(active.sequence, active.positionMs);
    if (!cue) {
      if (active.voiceCueId !== null) service.cancelNarration();
      active.voiceCueId = null;
      return Promise.resolve();
    }
    if (active.voiceCueId === cue.id) return Promise.resolve();
    active.voiceCueId = cue.id;
    const startMs = cue.startMs ?? 0;
    return service.narrateCaption(cue.spokenText, {
      speaker: cue.speaker,
      audioSrc: cue.audioSrc,
      offsetMs: Math.max(0, active.positionMs - startMs),
      reportFailure,
      holdMusicDucking: true,
    });
  };

  const runFreshShotCues = (
    active: CinematicSequence,
    previousMs: number,
    positionMs: number,
    includePrevious: boolean,
  ): void => {
    if (positionMs < previousMs) return;
    for (const shot of active.shots) {
      const crossedStart = shot.startMs <= positionMs
        && (shot.startMs > previousMs || (includePrevious && shot.startMs === previousMs));
      if (!crossedStart || positionMs - shot.startMs > CINEMATIC_CUE_GRACE_MS) continue;
      const ids = [...new Set(shot.sfxCueIds)];
      ids.forEach((id) => service.playSfx(id, true, CINEMATIC_SFX_GAIN));
    }
  };

  return {
    async preload(active): Promise<void> {
      const music = musicAsset(active.musicId);
      const sfx = [...new Set(active.shots.flatMap((shot) => shot.sfxCueIds))]
        .map((id) => sfxAsset(id)?.src)
        .filter((src): src is string => Boolean(src));
      const voice = OPENING_VOICE_CUES.map((cue) => cue.audioSrc).filter((src): src is string => Boolean(src));
      const musicSrc = active.musicSrc ?? music?.src;
      await service.preload([...(musicSrc ? [musicSrc] : []), ...sfx, ...voice]);
    },
    async play(active, fromMs): Promise<void> {
      invalidateTimeline();
      const startPositionMs = Math.max(0, Math.min(active.durationMs, fromMs));
      const current: ActiveCinematicTimeline = {
        sequence: active,
        generation,
        positionMs: startPositionMs,
        ready: false,
        voiceCueId: null,
      };
      timeline = current;
      await service.playMusic(active.musicId, true, {
        loop: active.musicLoop ?? true,
        positionMs: startPositionMs,
        reportFailure: true,
        ...(active.musicSrc ? { src: active.musicSrc } : {}),
      });
      if (timeline !== current || current.generation !== generation) return;
      if (current.positionMs !== startPositionMs) service.seekMusic(current.positionMs);
      current.ready = true;
      const voice = syncVoice(current, true);
      runFreshShotCues(active, startPositionMs, current.positionMs, true);
      await voice;
    },
    sync(positionMs): void {
      const current = timeline;
      if (!current) return;
      const nextPositionMs = Math.max(0, Math.min(current.sequence.durationMs, positionMs));
      const previousMs = current.positionMs;
      current.positionMs = nextPositionMs;
      if (!current.ready) return;
      if (nextPositionMs < previousMs) {
        current.voiceCueId = null;
        service.cancelNarration();
        service.seekMusic(nextPositionMs);
        void syncVoice(current, false);
        runFreshShotCues(current.sequence, nextPositionMs, nextPositionMs, true);
        return;
      }
      if (nextPositionMs - previousMs > CINEMATIC_CUE_GRACE_MS) service.seekMusic(nextPositionMs);
      void syncVoice(current, false);
      runFreshShotCues(current.sequence, previousMs, nextPositionMs, false);
    },
    pause(): void { invalidateTimeline(); service.pauseAll(); },
    seek(positionMs): void { invalidateTimeline(); service.seekMusic(positionMs); },
    stop(): void { invalidateTimeline(); service.stopMusic(); },
    setVolumes(levels): void {
      service.configure({
        musicVolume: levels.music, musicEnabled: levels.music > 0,
        voiceVolume: levels.voice, voiceEnabled: levels.voice > 0,
        sfxVolume: levels.sfx, sfxEnabled: levels.sfx > 0,
      });
    },
  };
}
