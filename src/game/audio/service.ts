import type { DomainEvent } from '../domain/result';
import type { CinematicAudioPort, CinematicSequence, FeedbackCue } from '../../ui/types';
import {
  OPENING_SHOT_SFX,
  OPENING_VOICE_CUES,
  musicAsset,
  resolveSfxCue,
  sfxAsset,
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
  load?(): void;
  pause(): void;
  play(): Promise<void> | void;
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
  playMusic(id: MusicId | string, enabled?: boolean): Promise<void>;
  stopMusic(): void;
  seekMusic(positionMs: number): void;
  playAmbience(id: AmbienceId, enabled?: boolean): Promise<void>;
  stopAmbience(): void;
  narrateCaption(text: string, options?: NarrationOptions): void;
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
  try {
    const result = element.play();
    if (result && typeof result.catch === 'function') void result.catch(() => onFailure?.());
  } catch {
    onFailure?.();
  }
}

export function createAudioService(dependencies: AudioServiceDependencies = {}): AudioService {
  const createAudio = dependencies.createAudio ?? browserAudioFactory;
  const localSpeech = dependencies.localSpeech === undefined ? browserSpeechPort() : dependencies.localSpeech;
  const rotations = new Map<string, number>();
  const sfxPools = new Map<string, { readonly elements: AudioElementLike[]; cursor: number }>();
  let settings = { ...DEFAULT_PREFERENCES };
  let music: { readonly id: string; readonly element: AudioElementLike } | null = null;
  let ambience: { readonly id: string; readonly element: AudioElementLike } | null = null;
  let narration: AudioElementLike | null = null;
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

  const configure = (changed: Partial<AudioPreferences>): void => {
    settings = {
      ...settings,
      ...changed,
      sfxVolume: clampVolume(changed.sfxVolume ?? settings.sfxVolume),
      musicVolume: clampVolume(changed.musicVolume ?? settings.musicVolume),
      voiceVolume: clampVolume(changed.voiceVolume ?? settings.voiceVolume),
    };
    if (music) music.element.volume = settings.musicVolume;
    if (ambience) ambience.element.volume = settings.musicVolume * 0.55;
    if (!settings.musicEnabled || settings.musicVolume === 0) safePause(music?.element ?? null);
    if (!settings.ambienceEnabled || settings.musicVolume === 0) safePause(ambience?.element ?? null);
    if (!settings.voiceEnabled || settings.voiceVolume === 0) {
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

  const playMusic = async (id: MusicId | string, enabled = true): Promise<void> => {
    if (!enabled || !settings.musicEnabled || settings.musicVolume === 0) { safePause(music?.element ?? null); return; }
    const asset = musicAsset(id);
    if (!asset) return;
    if (music?.id !== asset.id) {
      safePause(music?.element ?? null);
      const element = make(asset.src);
      if (!element) return;
      element.loop = true;
      element.currentTime = asset.loopStartMs / 1_000;
      music = { id: asset.id, element };
    }
    music.element.volume = settings.musicVolume;
    safePlay(music.element);
  };

  const stopMusic = (): void => {
    safePause(music?.element ?? null);
    if (music) {
      try { music.element.currentTime = 0; } catch { /* Optional audio. */ }
    }
    music = null;
  };

  const seekMusic = (positionMs: number): void => {
    if (!music) return;
    const asset = musicAsset(music.id);
    if (!asset) return;
    const loopDuration = Math.max(1, asset.loopEndMs - asset.loopStartMs);
    try { music.element.currentTime = (asset.loopStartMs + Math.max(0, positionMs) % loopDuration) / 1_000; } catch { /* Optional audio. */ }
  };

  const playAmbience = async (id: AmbienceId, enabled = true): Promise<void> => {
    if (!enabled || !settings.ambienceEnabled || settings.musicVolume === 0) { safePause(ambience?.element ?? null); return; }
    const asset = sfxAsset(id);
    if (!asset || asset.group !== 'ambience') return;
    if (ambience?.id !== id) {
      safePause(ambience?.element ?? null);
      const element = make(asset.src);
      if (!element) return;
      element.loop = true;
      ambience = { id, element };
    }
    ambience.element.volume = settings.musicVolume * 0.55;
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

  const narrateCaption = (text: string, options: NarrationOptions = {}): void => {
    if (!text.trim() || !settings.voiceEnabled || settings.voiceVolume === 0) return;
    const speaker = options.speaker ?? 'Eldrin';
    safePause(narration);
    narration = null;
    if (!options.audioSrc) { speakLocally(text, speaker); return; }
    try { localSpeech?.cancel(); } catch { /* Captions remain authoritative. */ }
    const clip = make(options.audioSrc);
    if (!clip) { speakLocally(text, speaker); return; }
    clip.loop = false;
    clip.volume = settings.voiceVolume;
    narration = clip;
    safePlay(clip, () => {
      if (narration === clip) narration = null;
      speakLocally(text, speaker);
    });
  };

  const cancelNarration = (): void => {
    safePause(narration);
    narration = null;
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
    if (resumeMusic) safePlay(music?.element ?? null);
    if (resumeAmbience) safePlay(ambience?.element ?? null);
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
  if (event.type === 'boss_phase_changed') return 'boss-phase';
  if (event.type === 'combatant_defeated') return 'enemy-death';
  if (event.type === 'companion_activated') return 'confirm';
  if (event.type === 'flee_resolved' && event.escaped) return 'flee';
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
      for (const cue of cues) if (cue.type === 'sfx') service.playSfx(cue.cueId, true, cue.volume);
    },
  };
}

export function createCinematicAudioPort(service: AudioService): CinematicAudioPort {
  let timers: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = (): void => {
    timers.forEach((timer) => clearTimeout(timer));
    timers = [];
    service.cancelNarration();
  };

  const runOpeningVoice = (fromMs: number): void => {
    for (const cue of OPENING_VOICE_CUES) {
      const startMs = cue.startMs ?? 0;
      const endMs = cue.endMs ?? startMs;
      if (endMs <= fromMs) continue;
      const delay = Math.max(0, startMs - fromMs);
      const speak = () => service.narrateCaption(cue.spokenText, { speaker: cue.speaker, audioSrc: cue.audioSrc });
      if (delay === 0) speak();
      else timers.push(setTimeout(speak, delay));
    }
  };

  const runShotCues = (active: CinematicSequence, fromMs: number): void => {
    for (const shot of active.shots) {
      if (shot.endMs <= fromMs) continue;
      const ids = [...new Set([...shot.sfxCueIds, ...(OPENING_SHOT_SFX[shot.id] ?? [])])];
      if (ids.length === 0) continue;
      const delay = Math.max(0, shot.startMs - fromMs);
      const play = () => ids.forEach((id) => service.playSfx(id));
      if (delay === 0) play();
      else timers.push(setTimeout(play, delay));
    }
  };

  return {
    async preload(active): Promise<void> {
      const music = musicAsset(active.musicId);
      const sfx = [...new Set(active.shots.flatMap((shot) => [...shot.sfxCueIds, ...(OPENING_SHOT_SFX[shot.id] ?? [])]))]
        .map((id) => sfxAsset(id)?.src)
        .filter((src): src is string => Boolean(src));
      const voice = OPENING_VOICE_CUES.map((cue) => cue.audioSrc).filter((src): src is string => Boolean(src));
      await service.preload([...(music ? [music.src] : []), ...sfx, ...voice]);
    },
    async play(active, fromMs): Promise<void> {
      clearTimers();
      await service.playMusic(active.musicId);
      service.seekMusic(fromMs);
      if (active.id === 'chronicle-1-opening') runOpeningVoice(fromMs);
      runShotCues(active, fromMs);
    },
    pause(): void { clearTimers(); service.pauseAll(); },
    seek(positionMs): void { clearTimers(); service.seekMusic(positionMs); },
    stop(): void { clearTimers(); service.stopMusic(); },
    setVolumes(levels): void {
      service.configure({
        musicVolume: levels.music, musicEnabled: levels.music > 0,
        voiceVolume: levels.voice, voiceEnabled: levels.voice > 0,
        sfxVolume: levels.sfx, sfxEnabled: levels.sfx > 0,
      });
    },
  };
}
