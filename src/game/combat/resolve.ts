import { useItem } from '../inventory';
import { chooseEnemyIntents } from './enemy-ai';
import { hasStatus, resolveAttack } from './attack';
import type { CombatAction, CombatContent, CombatState, CombatTurnResult, DomainEvent, EnemyCombatant, HeroCombatant } from './types';

function tickStatuses(id: string, statuses: readonly { readonly id: string; readonly label: string; readonly duration: number; readonly potency: number }[], events: DomainEvent[]) {
  return statuses.flatMap((status) => {
    const remainingDuration = status.duration - 1;
    events.push({ type: 'status_ticked', combatantId: id, statusId: status.id, remainingDuration });
    return remainingDuration > 0 ? [{ ...status, duration: remainingDuration }] : [];
  });
}

function replaceEnemy(enemies: readonly EnemyCombatant[], changed: EnemyCombatant): readonly EnemyCombatant[] {
  return enemies.map((enemy) => enemy.id === changed.id ? changed : enemy);
}

function livingTarget(state: CombatState, targetId?: string): EnemyCombatant | null {
  return state.enemies.find((enemy) => enemy.id === targetId && enemy.health > 0) ?? (!targetId ? state.enemies.find((enemy) => enemy.health > 0) ?? null : null);
}

function textForEvent(event: DomainEvent): string {
  if (event.type === 'attack_resolved') return event.outcome === 'miss' ? 'Your attack misses. Steel finds only rain.' : event.outcome === 'critical' ? `Critical hit! You strike for ${event.damage} damage.` : `You strike for ${event.damage} damage.`;
  if (event.type === 'combat_action_rejected' && event.reason === 'boss_cannot_flee') return 'There is no road out of this confrontation.';
  return '';
}

function finalize(state: CombatState, player: HeroCombatant, enemies: readonly EnemyCombatant[], rngState: number, events: DomainEvent[], inventory: CombatTurnResult['inventory'], spentTurn: boolean): CombatTurnResult {
  const living = enemies.filter((enemy) => enemy.health > 0);
  if (!spentTurn) return { combat: state, inventory, events };
  if (living.length === 0) {
    const combat: CombatState = { ...state, turn: state.turn + 1, rngState, player: { ...player, guarding: false, statuses: tickStatuses('hero', player.statuses, events) }, enemies, enemy: enemies[0]!, outcome: 'victory', log: [...state.log, ...events.map(textForEvent).filter(Boolean)].slice(-8), companionCooldown: Math.max(0, state.companionCooldown - 1) };
    return { combat, inventory, events };
  }

  let nextPlayer = player;
  let nextEnemies = enemies;
  let nextRng = rngState;
  for (const view of state.enemyIntents) {
    const enemy = nextEnemies.find((candidate) => candidate.id === view.enemyId && candidate.health > 0);
    if (!enemy) continue;
    if (view.intent === 'guard') { nextEnemies = replaceEnemy(nextEnemies, { ...enemy, guarding: true }); continue; }
    if (view.intent === 'recover') { nextEnemies = replaceEnemy(nextEnemies, { ...enemy, health: Math.min(enemy.maxHealth, enemy.health + Math.max(2, Math.floor(enemy.maxHealth * 0.08))) }); continue; }
    if (view.intent === 'flee' && !enemy.isBoss) { nextEnemies = replaceEnemy(nextEnemies, { ...enemy, health: 0 }); events.push({ type: 'combatant_defeated', combatantId: enemy.id }); continue; }
    const attack = resolveAttack({ rngState: nextRng, attacker: enemy, target: nextPlayer, power: enemy.attack + (view.intent === 'heavy' ? 4 : view.intent === 'hex' ? 2 : 0), kind: view.intent === 'hex' ? 'sorcery' : 'physical', varyPower: false });
    nextRng = attack.rngState;
    if (attack.damage > 0) nextPlayer = { ...nextPlayer, health: Math.max(0, nextPlayer.health - attack.damage) };
    events.push({ type: 'attack_resolved', attackerId: enemy.id, targetId: 'hero', outcome: attack.outcome, damage: attack.damage, powerVariation: attack.powerVariation });
  }
  nextPlayer = { ...nextPlayer, guarding: false, statuses: tickStatuses('hero', nextPlayer.statuses, events) };
  nextEnemies = nextEnemies.map((enemy) => ({ ...enemy, statuses: tickStatuses(enemy.id, enemy.statuses, events) }));
  const selected = chooseEnemyIntents(nextEnemies, nextRng);
  events.push(...selected.intents.map((intent) => ({ type: 'intent_revealed' as const, enemyId: intent.enemyId, intent: intent.intent })));
  const primary = selected.intents[0] ?? { enemyId: nextEnemies[0]!.id, intent: 'strike' as const, text: 'The enemy advances.' };
  const outcome = nextPlayer.health <= 0 ? 'defeat' : nextEnemies.every((enemy) => enemy.health <= 0) ? 'victory' : 'active';
  const combat: CombatState = {
    ...state, turn: state.turn + 1, rngState: selected.rngState, player: nextPlayer, enemies: nextEnemies, enemy: nextEnemies[0]!,
    enemyIntent: primary.intent, enemyIntents: selected.intents, intentText: primary.text, outcome,
    companionCooldown: Math.max(0, state.companionCooldown - 1),
    log: [...state.log, ...events.map(textForEvent).filter(Boolean)].slice(-8),
  };
  return { combat, inventory, events };
}

export function resolveCombatTurn(state: CombatState, action: CombatAction, inventory: CombatTurnResult['inventory'], content: CombatContent): CombatTurnResult {
  if (state.outcome !== 'active') return { combat: state, inventory, events: [] };
  const events: DomainEvent[] = [];
  let player = { ...state.player };
  let enemies = state.enemies.map((enemy) => ({ ...enemy }));
  let rngState = state.rngState;
  let missedAttacks = state.missedAttacks;
  let companionDamageDealt = state.companionDamageDealt;

  if (action.type === 'flee') {
    if (state.enemies.some((enemy) => enemy.isBoss)) return { combat: state, inventory, events: [{ type: 'combat_action_rejected', reason: 'boss_cannot_flee' }] };
    const escaped = player.cunning + (rngState % 10) + 1 >= Math.max(...enemies.map((enemy) => enemy.level)) + 7;
    rngState = (rngState + 0x6d2b79f5) >>> 0;
    if (escaped) return { combat: { ...state, rngState, outcome: 'fled', log: [...state.log, 'You break contact and find another road.'] }, inventory, events: [{ type: 'flee_resolved', escaped: true }] };
    return finalize(state, player, enemies, rngState, [{ type: 'flee_resolved', escaped: false }], inventory, true);
  }

  if (action.type === 'guard') { player = { ...player, guarding: true }; return finalize(state, player, enemies, rngState, events, inventory, true); }
  if (action.type === 'consumable' || action.type === 'item') {
    const instanceId = action.type === 'consumable' ? action.instanceId : action.itemId;
    const used = useItem(inventory, instanceId, 'combat', content.items as never);
    if (!used.ok) return { combat: state, inventory, events: [{ type: 'combat_action_rejected', reason: 'item_unavailable' }] };
    player = { ...player, health: Math.min(player.maxHealth, player.health + (used.value.effects.health ?? 0)), focus: Math.min(player.maxFocus, player.focus + (used.value.effects.focus ?? 0)), armor: player.armor + (used.value.effects.armor ?? 0), ward: player.ward + (used.value.effects.ward ?? 0) };
    return finalize(state, player, enemies, rngState, [{ type: 'consumable_used', instanceId }], used.value.inventory, true);
  }
  const target = livingTarget({ ...state, enemies }, action.type === 'attack' || action.type === 'technique' || action.type === 'companion' ? action.targetId : undefined);
  if (!target) return { combat: state, inventory, events: [{ type: 'combat_action_rejected', reason: 'invalid_target' }] };
  if (action.type === 'companion') {
    if (!state.companion) return { combat: state, inventory, events: [{ type: 'combat_action_rejected', reason: 'companion_unavailable' }] };
    if (state.companionCooldown > 0) return { combat: state, inventory, events: [{ type: 'combat_action_rejected', reason: 'companion_cooling_down' }] };
    const available = state.companionSupportBudget - companionDamageDealt;
    if (available <= 0) return { combat: state, inventory, events: [{ type: 'combat_action_rejected', reason: 'companion_support_budget' }] };
    const damage = Math.min(available, Math.max(1, state.companion.attack + Math.floor(state.companion.will / 2)));
    const updated = { ...target, health: Math.max(0, target.health - damage), guarding: false };
    enemies = replaceEnemy(enemies, updated).map((enemy) => enemy.health <= enemy.maxHealth / 2 && enemy.isBoss && enemy.phase === 1 ? { ...enemy, phase: 2, attack: enemy.attack + 2 } : enemy);
    companionDamageDealt += damage;
    events.push({ type: 'companion_commanded', companionId: state.companion.companionId, damage });
    if (updated.health <= 0) events.push({ type: 'combatant_defeated', combatantId: updated.id });
    const phaseChanged = enemies.find((enemy) => enemy.id === target.id && enemy.phase === 2 && target.phase === 1);
    if (phaseChanged) events.push({ type: 'boss_phase_changed', enemyId: phaseChanged.id, phase: 2 });
    return finalize({ ...state, companionCooldown: 2, companionDamageDealt }, player, enemies, rngState, events, inventory, true);
  }

  let power = player.strength + player.attackBonus + 4;
  let kind: 'physical' | 'sorcery' = 'physical';
  if (action.type === 'technique') {
    if (player.focus < 3) return { combat: state, inventory, events: [{ type: 'combat_action_rejected', reason: 'insufficient_resource' }] };
    player = { ...player, focus: player.focus - 3 };
    kind = player.class === 'mage' || action.techniqueId === 'witchfire' ? 'sorcery' : 'physical';
    power = kind === 'sorcery' ? player.will + 7 : player.strength + player.cunning + 3;
  }
  const attack = resolveAttack({ rngState, attacker: player, target, power, kind, missedAttacks });
  rngState = attack.rngState;
  missedAttacks = attack.outcome === 'miss' ? missedAttacks + 1 : 0;
  const updated = { ...target, health: Math.max(0, target.health - attack.damage), guarding: attack.outcome === 'blocked' ? target.guarding : false };
  enemies = replaceEnemy(enemies, updated).map((enemy) => enemy.health <= enemy.maxHealth / 2 && enemy.isBoss && enemy.phase === 1 ? { ...enemy, phase: 2, attack: enemy.attack + 2 } : enemy);
  events.push({ type: 'attack_resolved', attackerId: 'hero', targetId: target.id, outcome: attack.outcome, damage: attack.damage, powerVariation: attack.powerVariation });
  if (updated.health <= 0) events.push({ type: 'combatant_defeated', combatantId: updated.id });
  const phaseChanged = enemies.find((enemy) => enemy.id === target.id && enemy.phase === 2 && target.phase === 1);
  if (phaseChanged) events.push({ type: 'boss_phase_changed', enemyId: phaseChanged.id, phase: 2 });
  return finalize({ ...state, missedAttacks }, player, enemies, rngState, events, inventory, true);
}
