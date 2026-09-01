import type { DomainEvent } from '../game/domain/result';
import type { FeedbackCue, UiSettings } from './types';

export interface FeedbackDiagnostic {
  readonly code: 'unknown-domain-event';
  readonly eventType: string;
}

export type FeedbackDiagnosticLogger = (diagnostic: FeedbackDiagnostic) => void;

function defaultDiagnosticLogger(diagnostic: FeedbackDiagnostic): void {
  if (import.meta.env.DEV && typeof console !== 'undefined') {
    console.warn(`[${diagnostic.code}] ${diagnostic.eventType}`);
  }
}

function eventType(event: DomainEvent): string {
  return typeof (event as { readonly type?: unknown }).type === 'string'
    ? (event as { readonly type: string }).type
    : 'invalid-event';
}

function defeatedCreatureCue(combatantId: string): string {
  const id = combatantId.toLowerCase();
  if (id.includes('goblin') || id.includes('hobgoblin')) return 'sfx-goblin-death';
  if (id.includes('orc') || id.includes('ogre') || id.includes('troll')) return 'sfx-orc-death';
  if (/wolf|warg|boar|bear|hound|beast|spider|rat|maw/.test(id)) return 'sfx-beast-death';
  if (/undead|skeleton|bone|wight|ghoul|lich|revenant/.test(id)) return 'sfx-undead-death';
  return 'sfx-human-death';
}

export function feedbackForTransition(
  events: readonly DomainEvent[],
  settings: UiSettings,
  logDiagnostic: FeedbackDiagnosticLogger = defaultDiagnosticLogger,
): readonly FeedbackCue[] {
  const cues: FeedbackCue[] = [];
  const soundEnabled = Math.max(0, Math.min(1, settings.sfxVolume)) > 0;
  const sfx = (cueId: string, gain = 1) => { if (soundEnabled) cues.push({ type: 'sfx', cueId, gain }); };
  const haptic = (pattern: Extract<FeedbackCue, { readonly type: 'haptic' }>['pattern']) => {
    if (settings.hapticsEnabled) cues.push({ type: 'haptic', pattern: settings.reducedHaptics ? 'minimal' : pattern });
  };
  const announce = (message: string) => { if (settings.screenReaderAnnouncements) cues.push({ type: 'announce', message }); };
  const terminalCombat = events.find((event) => event.type === 'combat_ended');

  for (const event of events) {
    switch (event.type) {
      case 'attack_resolved': {
        const cueId = event.outcome === 'critical' ? 'critical'
          : event.outcome === 'miss' ? 'miss'
            : event.outcome === 'blocked' ? 'block'
              : event.outcome === 'parried' ? 'parry'
                : event.outcome === 'glancing' || event.targetId === 'hero' ? 'armor-hit'
                  : 'attack';
        const pattern = event.targetId === 'hero' && event.damage >= 10 ? 'heavy'
          : event.outcome === 'critical' ? 'strong'
            : event.outcome === 'blocked' || event.outcome === 'parried' ? 'double'
              : event.outcome === 'miss' || event.outcome === 'glancing' ? 'minimal'
                : 'medium';
        sfx(cueId);
        haptic(pattern);
        if (event.targetId === 'hero') announce(event.damage > 0 ? `You take ${event.damage} damage.` : 'The attack does no damage.');
        else if (event.outcome === 'critical') announce(`Critical hit for ${event.damage} damage.`);
        else if (event.outcome === 'miss') announce('Your attack misses.');
        else if (event.outcome === 'blocked') announce('Your attack is blocked.');
        else if (event.outcome === 'parried') announce('Your attack is parried.');
        else announce(`You deal ${event.damage} damage.`);
        break;
      }
      case 'combat_started':
        sfx('warning'); haptic('medium'); announce('Battle begins.'); break;
      case 'combat_ended':
        if (event.outcome === 'victory') { sfx('victory'); haptic('victory'); announce('Victory.'); }
        else if (event.outcome === 'defeat') { sfx('defeat'); haptic('defeat'); announce('You have fallen.'); }
        else { sfx('flee'); haptic('light'); announce('You escape the battle.'); }
        break;
      case 'choice_resolved':
        sfx('choice'); haptic('light'); announce('Choice recorded.'); break;
      case 'consumable_used':
        sfx('consume'); haptic('light'); announce('Item used.'); break;
      case 'item_changed':
        sfx(event.quantity >= 0 ? 'loot' : 'consume'); announce(event.quantity >= 0 ? 'Item received.' : 'Item removed.'); break;
      case 'level_up':
        sfx('level-up'); haptic('level-up'); announce(`Level ${event.level} reached.`); break;
      case 'notification':
        announce(event.message); break;
      case 'combat_action_rejected':
        sfx('warning'); haptic('minimal'); announce('That combat action is not available.'); break;
      case 'combatant_defeated':
        if (event.combatantId === 'hero') {
          if (terminalCombat?.type === 'combat_ended' && terminalCombat.outcome === 'defeat') break;
          sfx('defeat'); haptic('defeat'); announce('You have fallen.');
        } else {
          sfx(defeatedCreatureCue(event.combatantId)); announce('Enemy defeated.');
        }
        break;
      case 'companion_commanded':
        sfx('confirm'); haptic('medium'); announce('Companion action completed.'); break;
      case 'flee_resolved':
        sfx(event.escaped ? 'flee' : 'warning'); haptic(event.escaped ? 'light' : 'medium'); announce(event.escaped ? 'Escape succeeded.' : 'Escape failed.'); break;
      case 'boss_phase_changed':
        sfx('boss-phase'); haptic('heavy'); announce(`Boss phase ${event.phase}.`); break;
      case 'battle_rewards_granted':
        sfx('loot'); announce(`${event.gold} gold and ${event.xp} experience earned.`); break;
      case 'battle_reward_claimed':
        sfx('loot'); haptic('light'); announce('Battle reward claimed.'); break;
      case 'companion_activated':
        sfx('confirm'); haptic('light'); announce(event.companionId ? 'Active companion changed.' : 'Companion slot cleared.'); break;
      case 'trade_completed':
        sfx(event.tradeType === 'buy' ? 'merchant-buy' : 'merchant-sell'); haptic('light'); announce(event.tradeType === 'buy' ? 'Purchase complete.' : 'Sale complete.'); break;
      case 'camp_banked':
        sfx('coins'); haptic('light'); announce(`${event.gold} gold secured at camp.`); break;
      case 'status_ticked':
      case 'intent_revealed':
        break;
      default:
        logDiagnostic({ code: 'unknown-domain-event', eventType: eventType(event) });
    }
  }
  return cues;
}
