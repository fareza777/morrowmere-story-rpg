import { describe, expect, it, vi } from 'vitest';
import type { DomainEvent } from '../src/game/domain/result';
import { feedbackForTransition } from '../src/ui/feedback';
import type { UiSettings } from '../src/ui/types';

const SETTINGS: UiSettings = {
  textScale: 1,
  highContrast: false,
  reducedMotion: false,
  hapticsEnabled: true,
  reducedHaptics: false,
  sfxVolume: 0.8,
  musicVolume: 0.7,
  voiceVolume: 0.9,
  captions: true,
  voiceReplay: 'automatic',
  screenReaderAnnouncements: true,
};

const event = <T extends DomainEvent>(value: T): T => value;

describe('typed transition feedback', () => {
  it.each([
    ['hit', 'attack', 'medium'],
    ['miss', 'miss', 'minimal'],
    ['blocked', 'block', 'double'],
    ['parried', 'parry', 'double'],
    ['critical', 'critical', 'strong'],
  ] as const)('maps a hero %s without reading combat prose', (outcome, cueId, pattern) => {
    const cues = feedbackForTransition([
      event({ type: 'attack_resolved', attackerId: 'hero', targetId: 'enemy-1', outcome, damage: outcome === 'critical' ? 18 : outcome === 'hit' ? 7 : 0, powerVariation: 0 }),
    ], SETTINGS);

    expect(cues).toContainEqual({ type: 'sfx', cueId, gain: 1 });
    expect(cues).toContainEqual({ type: 'haptic', pattern });
  });

  it('uses a neutral armor impact when an enemy hits the hero', () => {
    const cues = feedbackForTransition([
      event({ type: 'attack_resolved', attackerId: 'wolf', targetId: 'hero', outcome: 'hit', damage: 6, powerVariation: 0 }),
    ], SETTINGS);

    expect(cues).toContainEqual({ type: 'sfx', cueId: 'armor-hit', gain: 1 });
    expect(cues).not.toContainEqual(expect.objectContaining({ type: 'sfx', cueId: 'enemy-hit' }));
  });

  it('uses heavy feedback when an enemy deals at least ten damage to the hero', () => {
    const cues = feedbackForTransition([
      event({ type: 'attack_resolved', attackerId: 'orc-captain', targetId: 'hero', outcome: 'hit', damage: 10, powerVariation: 1 }),
    ], SETTINGS);

    expect(cues).toContainEqual({ type: 'haptic', pattern: 'heavy' });
    expect(cues).toContainEqual({ type: 'announce', message: 'You take 10 damage.' });
  });

  it.each([
    [event({ type: 'consumable_used', instanceId: 'potion-1' }), 'consume', 'Item used.'],
    [event({ type: 'choice_resolved', eventId: 'event-1' as never, choiceId: 'choice-1' as never }), 'choice', 'Choice recorded.'],
    [event({ type: 'combat_ended', encounterId: 'encounter-1' as never, outcome: 'victory' }), 'victory', 'Victory.'],
    [event({ type: 'combat_ended', encounterId: 'encounter-1' as never, outcome: 'defeat' }), 'defeat', 'You have fallen.'],
  ] as const)('maps %s to an audible cue and clear announcement', (domainEvent, cueId, announcement) => {
    const cues = feedbackForTransition([domainEvent], SETTINGS);
    expect(cues).toContainEqual({ type: 'sfx', cueId, gain: 1 });
    expect(cues).toContainEqual({ type: 'announce', message: announcement });
  });

  it('emits one terminal defeat cue when the hero defeat and combat end arrive together', () => {
    const cues = feedbackForTransition([
      event({ type: 'combatant_defeated', combatantId: 'hero' }),
      event({ type: 'combat_ended', encounterId: 'encounter-1' as never, outcome: 'defeat' }),
    ], SETTINGS);

    expect(cues.filter((cue) => cue.type === 'sfx' && cue.cueId === 'defeat')).toHaveLength(1);
    expect(cues.filter((cue) => cue.type === 'announce' && cue.message === 'You have fallen.')).toHaveLength(1);
    expect(cues).toContainEqual({ type: 'haptic', pattern: 'defeat' });
  });

  it.each([
    ['enemy-goblin-cutthroat', 'sfx-goblin-death'],
    ['enemy-orc-vanguard', 'sfx-orc-death'],
    ['enemy-marsh-warg', 'sfx-beast-death'],
    ['enemy-siege-cart-maw', 'sfx-beast-death'],
    ['enemy-bone-sentinel', 'sfx-undead-death'],
    ['enemy-border-deserter', 'sfx-human-death'],
  ])('matches %s defeat feedback to its creature family', (combatantId, cueId) => {
    const cues = feedbackForTransition([
      event({ type: 'combatant_defeated', combatantId }),
    ], SETTINGS);

    expect(cues).toContainEqual({ type: 'sfx', cueId, gain: 1 });
  });

  it('maps the typed level-up event without parsing a notification message', () => {
    const levelUp = { type: 'level_up', level: 2 } as unknown as DomainEvent;
    expect(feedbackForTransition([levelUp], SETTINGS)).toEqual([
      { type: 'sfx', cueId: 'level-up', gain: 1 },
      { type: 'haptic', pattern: 'level-up' },
      { type: 'announce', message: 'Level 2 reached.' },
    ]);
  });

  it('respects disabled and reduced feedback preferences', () => {
    const critical = event({ type: 'attack_resolved', attackerId: 'hero', targetId: 'enemy-1', outcome: 'critical', damage: 18, powerVariation: 0 });
    const disabled = feedbackForTransition([critical], { ...SETTINGS, hapticsEnabled: false, sfxVolume: 0, screenReaderAnnouncements: false });
    expect(disabled).toEqual([]);

    const reduced = feedbackForTransition([critical], { ...SETTINGS, reducedHaptics: true });
    expect(reduced).toContainEqual({ type: 'haptic', pattern: 'minimal' });
    expect(reduced).not.toContainEqual({ type: 'haptic', pattern: 'strong' });
  });

  it('reports an unknown development event without emitting a player cue', () => {
    const diagnostic = vi.fn();
    const cues = feedbackForTransition(
      [{ type: 'future_event' } as unknown as DomainEvent],
      SETTINGS,
      diagnostic,
    );
    expect(cues).toEqual([]);
    expect(diagnostic).toHaveBeenCalledWith({ code: 'unknown-domain-event', eventType: 'future_event' });
  });
});
