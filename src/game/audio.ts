import type { GameCommand, GameState } from './state';
import { createAudioService, createCinematicAudioPort } from './audio/service';
import type { SfxCue } from './audio/catalog';

export * from './audio/catalog';
export * from './audio/service';

export const gameAudio = createAudioService();
export const cinematicAudio = createCinematicAudioPort(gameAudio);

export function configureGameAudio(settings: {
  readonly sound?: boolean;
  readonly music?: boolean;
  readonly narration?: boolean;
  readonly sfxVolume?: number;
  readonly musicVolume?: number;
  readonly voiceVolume?: number;
}): void {
  gameAudio.configure({
    ...(settings.sound === undefined ? {} : { sfxEnabled: settings.sound }),
    ...(settings.music === undefined ? {} : { musicEnabled: settings.music }),
    ...(settings.narration === undefined ? {} : { voiceEnabled: settings.narration }),
    ...(settings.sfxVolume === undefined ? {} : { sfxVolume: settings.sfxVolume }),
    ...(settings.musicVolume === undefined ? {} : { musicVolume: settings.musicVolume }),
    ...(settings.voiceVolume === undefined ? {} : { voiceVolume: settings.voiceVolume }),
  });
}

export function suspendAllAudio(): void {
  gameAudio.pauseAll();
}

export function resumeEnabledAudio(settings: {
  readonly sfxVolume: number;
  readonly musicVolume: number;
  readonly voiceVolume: number;
}): void {
  configureGameAudio({
    sound: settings.sfxVolume > 0,
    music: settings.musicVolume > 0,
    narration: settings.voiceVolume > 0,
    sfxVolume: settings.sfxVolume,
    musicVolume: settings.musicVolume,
    voiceVolume: settings.voiceVolume,
  });
  gameAudio.resumeAll();
}

/** Compatibility wrapper used by the current shell while UI ports migrate to `gameAudio`. */
export function playSfx(cue: SfxCue, enabled = true): void {
  gameAudio.playSfx(cue, enabled);
}

export function playTransitionSfx(before: GameState, after: GameState, command: GameCommand): void {
  configureGameAudio({ sound: after.settings.sound, music: after.settings.music, narration: after.settings.narration });
  if (!after.settings.sound) return;
  if (command.type === 'EQUIP_ITEM') return playSfx('equip');
  if (command.type === 'UNEQUIP_ITEM') return playSfx('unequip');
  if (command.type === 'CLAIM_REWARD') return playSfx('loot');
  if (command.type === 'CHOOSE') return playSfx('choice');
  if (command.type === 'ADVANCE') return playSfx('ui');
  if (command.type !== 'COMBAT') return;
  if (after.screen === 'defeat') return playSfx('defeat');
  if (before.screen === 'combat' && after.screen === 'reward') return playSfx('victory');
  const recent = after.combat?.log.slice(-3).join(' ') ?? '';
  if (recent.includes('Critical')) return playSfx('critical');
  if (recent.includes('misses')) return playSfx('miss');
  if (recent.includes('blocks')) return playSfx('block');
  if (command.action.type === 'guard') return playSfx('guard');
  if (command.action.type === 'technique') return playSfx('magic');
  if (command.action.type === 'item') return playSfx('heal');
  if (command.action.type === 'attack') return playSfx('attack');
  playSfx('ui');
}
