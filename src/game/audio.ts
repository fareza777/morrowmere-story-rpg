import type { GameCommand, GameState } from './state';

export type SfxCue = 'ui' | 'attack' | 'critical' | 'miss' | 'guard' | 'magic' | 'heal' | 'equip' | 'victory' | 'defeat';

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function tone(context: AudioContext, frequency: number, duration: number, gain: number, delay = 0, type: OscillatorType = 'sine') {
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * 0.72), start + duration);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(volume).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playSfx(cue: SfxCue, enabled = true): void {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;
  const patterns: Record<SfxCue, readonly [number, number, number, number?, OscillatorType?][]> = {
    ui: [[420, 0.06, 0.035]],
    attack: [[150, 0.08, 0.07, 0, 'sawtooth'], [92, 0.12, 0.06, 0.045, 'square']],
    critical: [[185, 0.1, 0.09, 0, 'sawtooth'], [640, 0.16, 0.06, 0.045, 'triangle'], [920, 0.2, 0.04, 0.1]],
    miss: [[310, 0.08, 0.035, 0, 'triangle'], [185, 0.12, 0.03, 0.06, 'triangle']],
    guard: [[110, 0.16, 0.08, 0, 'square'], [225, 0.09, 0.04, 0.03, 'triangle']],
    magic: [[260, 0.2, 0.045], [520, 0.22, 0.04, 0.04, 'triangle'], [780, 0.24, 0.025, 0.08]],
    heal: [[330, 0.14, 0.035], [440, 0.16, 0.035, 0.08], [660, 0.2, 0.03, 0.16]],
    equip: [[190, 0.08, 0.05, 0, 'square'], [380, 0.1, 0.035, 0.065, 'triangle']],
    victory: [[294, 0.18, 0.045], [440, 0.2, 0.045, 0.12], [587, 0.32, 0.04, 0.24]],
    defeat: [[220, 0.24, 0.04, 0, 'triangle'], [147, 0.34, 0.045, 0.17, 'sawtooth']],
  };
  patterns[cue].forEach(([frequency, duration, gain, delay, type]) => tone(context, frequency, duration, gain, delay, type));
}

export function playTransitionSfx(before: GameState, after: GameState, command: GameCommand): void {
  if (!after.settings.sound) return;
  if (command.type === 'EQUIP_ITEM' || command.type === 'UNEQUIP_ITEM') return playSfx('equip');
  if (command.type === 'CLAIM_REWARD' || command.type === 'CHOOSE' || command.type === 'ADVANCE') return playSfx('ui');
  if (command.type !== 'COMBAT') return;
  if (after.screen === 'defeat') return playSfx('defeat');
  if (before.screen === 'combat' && after.screen === 'reward') return playSfx('victory');
  const recent = after.combat?.log.slice(-3).join(' ') ?? '';
  if (recent.includes('Critical')) return playSfx('critical');
  if (recent.includes('misses')) return playSfx('miss');
  if (command.action.type === 'guard') return playSfx('guard');
  if (command.action.type === 'technique') return playSfx('magic');
  if (command.action.type === 'item') return playSfx('heal');
  if (command.action.type === 'attack') return playSfx('attack');
  playSfx('ui');
}
