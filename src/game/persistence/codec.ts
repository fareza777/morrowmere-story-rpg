import { buildCompanionCombatSnapshot } from '../companions';
import type { ContentIndex } from '../content/schema';
import { roleForEnemy } from '../combat/enemy-ai';
import type { CombatState, EnemyCombatant, HeroCombatant, StatusEffect } from '../combat/types';
import type { EnemyDefinition } from '../types';
import { merchantRestockSeed } from '../merchant';
import { deriveHeroStats } from '../progression';
import type { CampaignCheckpointPayload, CampaignState, ExpeditionState, GameStateV2, ProfileState } from '../state/types';
import {
  isProfileState,
  isSaveStateDto,
  type CampaignCheckpointDto,
  type CampaignDto,
  type CombatDto,
  type CombatStatusDto,
  type DirectorDto,
  type DirectorMemoryDto,
  type EnemyCombatDto,
  type EnemyModifierDto,
  type EnemySourceDto,
  type ExpeditionDto,
  type InventoryDto,
  type PlayerModifierDto,
  type SaveStateDto,
} from './schema';

const rootKeys = ['schemaVersion', 'profile', 'campaign', 'expedition', 'checkpoints', 'flow', 'updatedAt'];
const campaignKeys = ['seed', 'chapterId', 'heroName', 'hero', 'inventory', 'bankedGold', 'flags', 'evidence', 'factions', 'companions', 'directorMemory', 'attemptCounters', 'routeSeedNonce', 'transitionCounter'];
const checkpointCampaignKeys = campaignKeys.slice(0, -3);
const inventoryKeys = ['pack', 'stash', 'questItems', 'equipment'];
const directorMemoryKeys = ['rngState', 'seenEventIds', 'familyCooldowns', 'pendingCallbacks'];
const directorKeys = [...directorMemoryKeys, 'usedSceneIds', 'recentSceneKinds', 'recentFamilies', 'currentRunBlockedFamilies', 'tension', 'threat'];

function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> { return record(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key)); }
function exactOptional(value: unknown, required: readonly string[], optional: readonly string[]): value is Record<string, unknown> { return record(value) && required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) && Object.keys(value).every((key) => required.includes(key) || optional.includes(key)); }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function finiteInteger(value: unknown): value is number { return Number.isSafeInteger(value); }
function id(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }
function strings(value: unknown): value is readonly string[] { return Array.isArray(value) && value.every(id); }
function sameArray(left: readonly unknown[], right: readonly unknown[]): boolean { return left.length === right.length && left.every((value, index) => value === right[index]); }
function sameRecord(left: Readonly<Record<string, unknown>>, right: Readonly<Record<string, unknown>>): boolean { const leftKeys = Object.keys(left).sort(); const rightKeys = Object.keys(right).sort(); return sameArray(leftKeys, rightKeys) && leftKeys.every((key) => left[key] === right[key]); }

function encodeProfile(profile: ProfileState): ProfileState | null {
  if (!isProfileState(profile)) return null;
  return {
    settings: { ...profile.settings },
    discoveries: { events: [...profile.discoveries.events], enemies: [...profile.discoveries.enemies], codex: [...profile.discoveries.codex] },
  };
}

function encodeInventory(value: CampaignState['inventory']): InventoryDto | null {
  if (!exact(value, inventoryKeys) || !exact(value.equipment, ['weapon', 'armor', 'charms']) || !Array.isArray(value.pack) || !Array.isArray(value.stash) || !strings(value.questItems) || !strings(value.equipment.charms)) return null;
  const entries = [...value.pack, ...value.stash];
  if (!entries.every((entry) => exact(entry, ['id', 'itemId', 'quantity']) && id(entry.id) && id(entry.itemId) && finiteInteger(entry.quantity) && entry.quantity > 0)) return null;
  if (value.equipment.weapon !== null && !id(value.equipment.weapon)) return null;
  if (value.equipment.armor !== null && !id(value.equipment.armor)) return null;
  return {
    pack: value.pack.map((entry) => ({ id: entry.id, itemId: entry.itemId, quantity: entry.quantity })),
    stash: value.stash.map((entry) => ({ id: entry.id, itemId: entry.itemId, quantity: entry.quantity })),
    questItems: [...value.questItems], equipment: { weapon: value.equipment.weapon, armor: value.equipment.armor, charms: [...value.equipment.charms] },
  };
}

function encodePendingCallbacks(value: unknown): DirectorMemoryDto['pendingCallbacks'] | null {
  if (!Array.isArray(value)) return null;
  const encoded = value.map((callback) => {
    if (!exact(callback, ['targetEventId', 'deadline', 'status', 'required']) || !id(callback.targetEventId) || !exact(callback.deadline, ['chapterId', 'slot']) || typeof callback.deadline.chapterId !== 'string' || !finiteInteger(callback.deadline.slot) || callback.deadline.slot < 0 || (callback.status !== 'pending' && callback.status !== 'fulfilled') || typeof callback.required !== 'boolean') return null;
    return { targetEventId: callback.targetEventId, deadline: { chapterId: callback.deadline.chapterId, slot: callback.deadline.slot }, status: callback.status, required: callback.required };
  });
  return encoded.some((entry) => entry === null) ? null : encoded as DirectorMemoryDto['pendingCallbacks'];
}

function encodeDirectorMemory(value: CampaignState['directorMemory']): DirectorMemoryDto | null {
  if (!exact(value, directorMemoryKeys) || !finiteInteger(value.rngState) || value.rngState < 0 || !strings(value.seenEventIds) || !record(value.familyCooldowns) || !Object.values(value.familyCooldowns).every((entry) => finiteInteger(entry) && entry >= 0)) return null;
  const pendingCallbacks = encodePendingCallbacks(value.pendingCallbacks);
  return pendingCallbacks ? { rngState: value.rngState, seenEventIds: [...value.seenEventIds], familyCooldowns: { ...value.familyCooldowns }, pendingCallbacks } : null;
}

function encodeDirector(value: ExpeditionState['director']): DirectorDto | null {
  if (!exact(value, directorKeys) || !strings(value.usedSceneIds) || !Array.isArray(value.recentSceneKinds) || !value.recentSceneKinds.every((entry) => entry === 'danger' || entry === 'merchant' || entry === 'recovery' || entry === 'quiet') || !strings(value.recentFamilies) || !strings(value.currentRunBlockedFamilies) || !finiteInteger(value.tension) || value.tension < 0 || !finiteInteger(value.threat) || value.threat < 0) return null;
  const memory = encodeDirectorMemory({ rngState: value.rngState, seenEventIds: value.seenEventIds, familyCooldowns: value.familyCooldowns, pendingCallbacks: value.pendingCallbacks } as CampaignState['directorMemory']);
  return memory ? { ...memory, usedSceneIds: [...value.usedSceneIds], recentSceneKinds: [...value.recentSceneKinds], recentFamilies: [...value.recentFamilies], currentRunBlockedFamilies: [...value.currentRunBlockedFamilies], tension: value.tension, threat: value.threat } : null;
}

function encodeCompanions(value: CampaignState['companions']): CampaignDto['companions'] | null {
  if (!exact(value, ['activeCompanionId', 'records']) || (value.activeCompanionId !== null && !id(value.activeCompanionId)) || !Array.isArray(value.records)) return null;
  const records = value.records.map((entry) => {
    if (!exact(entry, ['companionId', 'status', 'questStage', 'loyalty', 'injured']) || !id(entry.companionId) || typeof entry.status !== 'string' || !['unknown', 'recruited', 'left', 'dead'].includes(entry.status) || !finiteInteger(entry.questStage) || entry.questStage < 0 || entry.questStage > 3 || !finite(entry.loyalty) || entry.loyalty < -100 || entry.loyalty > 100 || typeof entry.injured !== 'boolean') return null;
    return { companionId: entry.companionId, status: entry.status, questStage: entry.questStage, loyalty: entry.loyalty, injured: entry.injured };
  });
  return records.some((entry) => entry === null) ? null : { activeCompanionId: value.activeCompanionId, records: records as CampaignDto['companions']['records'] };
}

function encodeCampaignCheckpoint(value: CampaignCheckpointPayload): CampaignCheckpointDto | null {
  if (!exact(value, checkpointCampaignKeys) || !finiteInteger(value.seed) || value.seed < 0 || typeof value.chapterId !== 'string' || !id(value.heroName) || value.heroName.length > 48 || !exact(value.hero, ['heroClass', 'level', 'xp', 'talents']) || !['warrior', 'mage', 'warden'].includes(value.hero.heroClass) || !finiteInteger(value.hero.level) || value.hero.level < 1 || !finiteInteger(value.hero.xp) || value.hero.xp < 0 || !strings(value.hero.talents) || !strings(value.flags) || !strings(value.evidence) || !finiteInteger(value.bankedGold) || value.bankedGold < 0 || !record(value.factions) || !Object.values(value.factions).every(finite)) return null;
  const inventory = encodeInventory(value.inventory);
  const companions = encodeCompanions(value.companions);
  const directorMemory = encodeDirectorMemory(value.directorMemory);
  return inventory && companions && directorMemory ? {
    seed: value.seed, chapterId: value.chapterId, heroName: value.heroName, hero: { heroClass: value.hero.heroClass, level: value.hero.level, xp: value.hero.xp, talents: [...value.hero.talents] }, inventory,
    bankedGold: value.bankedGold, flags: [...value.flags], evidence: [...value.evidence], factions: { ...value.factions }, companions, directorMemory,
  } : null;
}

function encodeCampaign(value: CampaignState): CampaignDto | null {
  if (!exact(value, campaignKeys) || !record(value.attemptCounters) || !Object.entries(value.attemptCounters).every(([key, entry]) => /^ch0[1-8]$/.test(key) && finiteInteger(entry) && entry >= 0) || !finiteInteger(value.routeSeedNonce) || value.routeSeedNonce < 0 || !finiteInteger(value.transitionCounter) || value.transitionCounter < 0) return null;
  const checkpoint = encodeCampaignCheckpoint({ seed: value.seed, chapterId: value.chapterId, heroName: value.heroName, hero: value.hero, inventory: value.inventory, bankedGold: value.bankedGold, flags: value.flags, evidence: value.evidence, factions: value.factions, companions: value.companions, directorMemory: value.directorMemory } as CampaignCheckpointPayload);
  return checkpoint ? { ...checkpoint, attemptCounters: { ...value.attemptCounters }, routeSeedNonce: value.routeSeedNonce, transitionCounter: value.transitionCounter } : null;
}

function encodeStatuses(value: readonly StatusEffect[]): readonly CombatStatusDto[] | null {
  if (!Array.isArray(value)) return null;
  const statuses = value.map((status) => {
    if (!exact(status, ['id', 'label', 'duration', 'potency']) || !id(status.id) || typeof status.label !== 'string' || !finiteInteger(status.duration) || status.duration < 0 || !finite(status.potency)) return null;
    return { id: status.id, duration: status.duration, potency: status.potency };
  });
  return statuses.some((entry) => entry === null) ? null : statuses as readonly CombatStatusDto[];
}

function basePlayer(campaign: CampaignState, content: ContentIndex): HeroCombatant {
  const stats = deriveHeroStats(campaign.hero, campaign.inventory, content.items);
  return {
    class: stats.heroClass, name: campaign.heroName, level: stats.level, xp: stats.xp, health: stats.maxHealth, maxHealth: stats.maxHealth, focus: stats.maxFocus, maxFocus: stats.maxFocus,
    strength: stats.strength, cunning: stats.cunning, will: stats.will, armor: stats.armor, ward: stats.ward, attackBonus: Math.max(0, stats.attack - stats.strength), guarding: false, statuses: [], inventory: [], equipment: { weapon: null, armor: null, charms: [] },
  };
}

function playerModifiers(player: HeroCombatant, base: HeroCombatant): PlayerModifierDto | null {
  if (!exactOptional(player, ['class', 'name', 'level', 'xp', 'health', 'maxHealth', 'focus', 'maxFocus', 'strength', 'cunning', 'will', 'armor', 'ward', 'attackBonus', 'guarding', 'statuses', 'inventory', 'equipment'], ['attackAccuracy', 'criticalChance']) || player.attackAccuracy !== undefined || player.criticalChance !== undefined || player.class !== base.class || player.name !== base.name || player.level !== base.level || player.xp !== base.xp || !finite(player.health) || !finite(player.maxHealth) || !finite(player.focus) || !finite(player.maxFocus) || player.maxHealth < 1 || player.maxFocus < 0 || player.health < 0 || player.health > player.maxHealth || player.focus < 0 || player.focus > player.maxFocus || typeof player.guarding !== 'boolean' || !strings(player.inventory) || !sameArray(player.inventory, base.inventory) || !exact(player.equipment, ['weapon', 'armor', 'charms']) || player.equipment.weapon !== base.equipment.weapon || player.equipment.armor !== base.equipment.armor || !strings(player.equipment.charms) || !sameArray(player.equipment.charms, base.equipment.charms)) return null;
  const modifiers = { attackBonus: player.attackBonus - base.attackBonus, armor: player.armor - base.armor, ward: player.ward - base.ward, maxHealth: player.maxHealth - base.maxHealth, maxFocus: player.maxFocus - base.maxFocus, strength: player.strength - base.strength, cunning: player.cunning - base.cunning, will: player.will - base.will };
  return Object.values(modifiers).every(finite) ? modifiers : null;
}

function catalogSource(enemy: EnemyCombatant, content: ContentIndex): { readonly source: EnemySourceDto; readonly definition: EnemyDefinition; readonly smoke: boolean } | null {
  const definitions = [...content.enemies.values()];
  const smokeCandidates = definitions.filter((definition) => enemy.archetypeId === `${definition.archetypeId}-smoke` && enemy.id.startsWith(`${definition.id}`));
  if (enemy.id.includes('-smoke-') && smokeCandidates.length > 0) {
    const definition = smokeCandidates.sort((left, right) => right.id.length - left.id.length)[0]!;
    return { source: { kind: 'summon-smoke', originEnemyId: definition.id }, definition, smoke: true };
  }
  const direct = content.enemies.get(enemy.id as never);
  const definition = direct ?? definitions.find((candidate) => enemy.archetypeId === candidate.archetypeId && (enemy.id === candidate.id || enemy.id.startsWith(`${candidate.id}-`)));
  return definition ? { source: { kind: 'catalog', enemyId: definition.id }, definition, smoke: false } : null;
}

function catalogEnemy(definition: EnemyDefinition, instanceId: string, isBoss: boolean): EnemyCombatant {
  const role = roleForEnemy(definition);
  return { ...definition, id: instanceId, health: definition.maxHealth, guarding: false, isBoss, statuses: [], role, evasion: role === 'assassin' ? 12 : 0, blockChance: role === 'defender' ? 30 : 0, parryChance: role === 'assassin' ? 10 : 0, phase: 1, roleUses: role === 'summoner' ? 1 : undefined };
}

function smokeEnemy(definition: EnemyDefinition, instanceId: string): EnemyCombatant {
  const base = catalogEnemy(definition, instanceId, false);
  const maxHealth = Math.max(4, Math.floor(base.maxHealth * 0.25));
  return { ...base, archetypeId: `${base.archetypeId}-smoke`, name: `${base.name} Smoke Minion`, maxHealth, health: maxHealth, attack: Math.max(1, Math.floor(base.attack * 0.5)), armor: 0, ward: Math.max(0, Math.floor(base.ward * 0.5)), intentWeights: { strike: 1 }, traits: ['Summoned Smoke'], isBoss: false, guarding: false, statuses: [], role: 'specialist', evasion: 0, blockChance: 0, parryChance: 0, phase: 1, roleUses: 0 };
}

function sameImmutableEnemy(value: EnemyCombatant, base: EnemyCombatant): boolean {
  return value.id === base.id && value.archetypeId === base.archetypeId && value.name === base.name && value.rank === base.rank && value.level === base.level && value.species === base.species && value.region === base.region && value.description === base.description && value.artFamily === base.artFamily && sameRecord(value.intentWeights, base.intentWeights) && sameArray(value.traits, base.traits) && sameArray(value.rewardTags, base.rewardTags) && value.role === base.role;
}

function encodeEnemy(value: EnemyCombatant, content: ContentIndex): EnemyCombatDto | null {
  if (!exactOptional(value, ['id', 'archetypeId', 'name', 'rank', 'level', 'species', 'region', 'maxHealth', 'attack', 'armor', 'ward', 'intentWeights', 'traits', 'rewardTags', 'description', 'artFamily', 'health', 'guarding', 'isBoss', 'statuses', 'role', 'evasion', 'blockChance', 'parryChance', 'phase'], ['roleUses']) || !id(value.id) || !id(value.archetypeId) || !record(value.intentWeights) || !Array.isArray(value.traits) || !Array.isArray(value.rewardTags) || !Array.isArray(value.statuses)) return null;
  const catalog = catalogSource(value, content);
  if (!catalog) return null;
  const base = catalog.smoke ? smokeEnemy(catalog.definition, value.id) : catalogEnemy(catalog.definition, value.id, value.isBoss);
  if (!sameImmutableEnemy(value, base) || !finite(value.maxHealth) || value.maxHealth < 1 || !finite(value.health) || value.health < 0 || value.health > value.maxHealth || typeof value.guarding !== 'boolean' || !finiteInteger(value.phase) || value.phase < 1 || (value.roleUses !== undefined && (!finiteInteger(value.roleUses) || value.roleUses < 0))) return null;
  const statuses = encodeStatuses(value.statuses);
  const modifiers: EnemyModifierDto = { maxHealth: value.maxHealth - base.maxHealth, attack: value.attack - base.attack, armor: value.armor - base.armor, ward: value.ward - base.ward, evasion: value.evasion - base.evasion, blockChance: value.blockChance - base.blockChance, parryChance: value.parryChance - base.parryChance };
  return statuses && Object.values(modifiers).every(finite) ? { instanceId: value.id, source: catalog.source, isBoss: value.isBoss, health: value.health, guarding: value.guarding, statuses, phase: value.phase, roleUses: value.roleUses ?? null, modifiers } : null;
}

function validRuntimeCompanion(value: unknown): boolean {
  return exact(value, ['companionId', 'loyaltyTier', 'questStage', 'injured', 'attack', 'guard', 'will', 'actionId']) && id(value.companionId)
    && ['wary', 'respectful', 'loyal'].includes(value.loyaltyTier as string) && finiteInteger(value.questStage) && value.questStage >= 0 && value.questStage <= 3
    && typeof value.injured === 'boolean' && finite(value.attack) && finite(value.guard) && finite(value.will) && id(value.actionId);
}

function encodeCombat(value: CombatState, campaign: CampaignState, content: ContentIndex): CombatDto | null {
  if (!exact(value, ['turn', 'rngState', 'player', 'enemy', 'enemies', 'enemyIntent', 'enemyIntents', 'intentText', 'outcome', 'log', 'missedAttacks', 'companion', 'companionCooldown', 'companionDamageDealt', 'companionSupportBudget']) || !record(value.player) || !record(value.enemy) || !Array.isArray(value.enemies) || !Array.isArray(value.enemyIntents) || !Array.isArray(value.log) || !finiteInteger(value.turn) || value.turn < 1 || !finiteInteger(value.rngState) || value.rngState < 0 || value.enemies.length === 0 || !['strike', 'heavy', 'guard', 'hex', 'recover', 'flee'].includes(value.enemyIntent) || !['active', 'victory', 'defeat', 'fled'].includes(value.outcome) || !finiteInteger(value.missedAttacks) || value.missedAttacks < 0 || !finiteInteger(value.companionCooldown) || value.companionCooldown < 0 || !finite(value.companionDamageDealt) || !finite(value.companionSupportBudget)) return null;
  if (value.companion !== null && !validRuntimeCompanion(value.companion)) return null;
  const base = basePlayer(campaign, content);
  const modifiers = playerModifiers(value.player, base);
  const statuses = encodeStatuses(value.player.statuses);
  const enemies = value.enemies.map((enemy) => encodeEnemy(enemy, content));
  const intents = value.enemyIntents.map((intent) => exact(intent, ['enemyId', 'intent', 'text']) && id(intent.enemyId) && typeof intent.text === 'string' && typeof intent.intent === 'string' && ['strike', 'heavy', 'guard', 'hex', 'recover', 'flee'].includes(intent.intent) ? { enemyId: intent.enemyId, intent: intent.intent } : null);
  const companion = value.companion === null ? null : buildCompanionCombatSnapshot(campaign.companions, content);
  if (!modifiers || !statuses || enemies.some((entry) => entry === null) || intents.some((entry) => entry === null) || !id(value.enemy.id) || !value.enemies.some((enemy) => enemy.id === value.enemy.id) || (value.companion !== null && (!companion || companion.companionId !== value.companion.companionId))) return null;
  return { turn: value.turn, rngState: value.rngState, player: { health: value.player.health, focus: value.player.focus, guarding: value.player.guarding, statuses, modifiers }, enemies: enemies as readonly EnemyCombatDto[], primaryEnemyId: value.enemy.id, enemyIntent: value.enemyIntent, enemyIntents: intents as CombatDto['enemyIntents'], outcome: value.outcome, missedAttacks: value.missedAttacks, companionId: companion?.companionId ?? null, companionCooldown: value.companionCooldown, companionDamageDealt: value.companionDamageDealt, companionSupportBudget: value.companionSupportBudget };
}

function encodeExpedition(value: ExpeditionState, campaign: CampaignState, content: ContentIndex): ExpeditionDto | null {
  if (!exact(value, ['routeProfile', 'routeSeed', 'director', 'position', 'currentSceneId', 'currentCombat', 'pendingRewards', 'unbankedGold', 'unbankedLoot', 'temporaryBoons', 'merchantVisits']) || !['kings-road', 'old-forest', 'ruined-pass'].includes(value.routeProfile) || !finiteInteger(value.routeSeed) || value.routeSeed < 0 || !exact(value.position, ['chapterId', 'slot']) || typeof value.position.chapterId !== 'string' || !finiteInteger(value.position.slot) || value.position.slot < 0 || (value.currentSceneId !== null && !id(value.currentSceneId)) || !strings(value.pendingRewards) || !finiteInteger(value.unbankedGold) || value.unbankedGold < 0 || !strings(value.unbankedLoot) || !strings(value.temporaryBoons) || !Array.isArray(value.merchantVisits)) return null;
  const director = encodeDirector(value.director);
  const currentCombat = value.currentCombat === null ? null : exact(value.currentCombat, ['encounterId', 'combat']) && id(value.currentCombat.encounterId) ? { encounterId: value.currentCombat.encounterId, combat: value.currentCombat.combat === null ? null : encodeCombat(value.currentCombat.combat, campaign, content) } : null;
  if (!director || (value.currentCombat !== null && (!currentCombat || currentCombat.combat === null && value.currentCombat.combat !== null))) return null;
  const merchantVisits = value.merchantVisits.map((visit) => exact(visit, ['merchantId', 'restockKey', 'restockSeed', 'stock']) && id(visit.merchantId) && id(visit.restockKey) && finiteInteger(visit.restockSeed) && visit.restockSeed >= 0 && Array.isArray(visit.stock) && visit.stock.every((entry) => exact(entry, ['id', 'itemId']) && id(entry.id) && id(entry.itemId)) ? { merchantId: visit.merchantId, restockKey: visit.restockKey, stock: visit.stock.map((entry) => ({ id: entry.id, itemId: entry.itemId })) } : null);
  return merchantVisits.some((entry) => entry === null) ? null : { routeProfile: value.routeProfile, routeSeed: value.routeSeed, director, position: { chapterId: value.position.chapterId, slot: value.position.slot }, currentSceneId: value.currentSceneId, currentCombat: currentCombat as ExpeditionDto['currentCombat'], pendingRewards: [...value.pendingRewards], unbankedGold: value.unbankedGold, unbankedLoot: [...value.unbankedLoot], temporaryBoons: [...value.temporaryBoons], merchantVisits: merchantVisits as readonly ExpeditionDto['merchantVisits'][number][] };
}

function validRuntimeShell(state: GameStateV2): boolean {
  if (!exact(state, rootKeys) || state.schemaVersion !== 2 || !exact(state.checkpoints, ['chapter', 'camp']) || !exact(state.checkpoints.chapter, ['campaign', 'enteredAt']) || typeof state.checkpoints.chapter.enteredAt !== 'string' || !exact(state.flow, ['screen', 'overlay', 'merchant']) || typeof state.updatedAt !== 'string') return false;
  if (state.checkpoints.camp !== null && (!exact(state.checkpoints.camp, ['campaign', 'campSceneId', 'savedAt']) || typeof state.checkpoints.camp.savedAt !== 'string' || (state.checkpoints.camp.campSceneId !== null && !id(state.checkpoints.camp.campSceneId)))) return false;
  if (!['camp', 'story', 'combat', 'reward', 'merchant', 'defeat', 'ending'].includes(state.flow.screen)) return false;
  if (state.flow.overlay !== null && !['inventory', 'chronicle', 'bestiary', 'settings'].includes(state.flow.overlay)) return false;
  return state.flow.merchant === null || (exact(state.flow.merchant, ['merchantId', 'restockKey', 'returnScreen']) && id(state.flow.merchant.merchantId) && id(state.flow.merchant.restockKey) && ['camp', 'story'].includes(state.flow.merchant.returnScreen));
}

export function encodeSaveState(state: GameStateV2, content: ContentIndex): SaveStateDto | null {
  if (!validRuntimeShell(state)) return null;
  const profile = encodeProfile(state.profile);
  const campaign = encodeCampaign(state.campaign);
  const chapter = encodeCampaignCheckpoint(state.checkpoints.chapter.campaign);
  const camp = state.checkpoints.camp === null ? null : encodeCampaignCheckpoint(state.checkpoints.camp.campaign);
  const expedition = state.expedition === null ? null : encodeExpedition(state.expedition, state.campaign, content);
  if (!profile || !campaign || !chapter || (state.checkpoints.camp !== null && !camp) || (state.expedition !== null && !expedition)) return null;
  const dto: SaveStateDto = { schemaVersion: 2, profile, campaign, expedition, checkpoints: { chapter: { campaign: chapter, enteredAt: state.checkpoints.chapter.enteredAt }, camp: camp && state.checkpoints.camp ? { campaign: camp, campSceneId: state.checkpoints.camp.campSceneId, savedAt: state.checkpoints.camp.savedAt } : null }, flow: { screen: state.flow.screen, overlay: state.flow.overlay, merchant: state.flow.merchant ? { ...state.flow.merchant } : null }, updatedAt: state.updatedAt };
  return isSaveStateDto(dto) ? dto : null;
}

function decodeInventory(value: InventoryDto): CampaignState['inventory'] { return { pack: value.pack.map((entry) => ({ id: entry.id, itemId: entry.itemId as never, quantity: entry.quantity })), stash: value.stash.map((entry) => ({ id: entry.id, itemId: entry.itemId as never, quantity: entry.quantity })), questItems: value.questItems as never, equipment: { weapon: value.equipment.weapon as never, armor: value.equipment.armor as never, charms: value.equipment.charms as never } }; }
function decodeDirectorMemory(value: DirectorMemoryDto): CampaignState['directorMemory'] { return { rngState: value.rngState, seenEventIds: value.seenEventIds as never, familyCooldowns: { ...value.familyCooldowns }, pendingCallbacks: value.pendingCallbacks.map((entry) => ({ targetEventId: entry.targetEventId as never, deadline: { chapterId: entry.deadline.chapterId as never, slot: entry.deadline.slot }, status: entry.status, required: entry.required })) }; }
function decodeCampaignCheckpoint(value: CampaignCheckpointDto): CampaignCheckpointPayload { return { seed: value.seed, chapterId: value.chapterId as never, heroName: value.heroName, hero: { heroClass: value.hero.heroClass, level: value.hero.level, xp: value.hero.xp, talents: [...value.hero.talents] }, inventory: decodeInventory(value.inventory), bankedGold: value.bankedGold, flags: [...value.flags], evidence: [...value.evidence], factions: { ...value.factions }, companions: { activeCompanionId: value.companions.activeCompanionId as never, records: value.companions.records.map((entry) => ({ companionId: entry.companionId as never, status: entry.status, questStage: entry.questStage as never, loyalty: entry.loyalty, injured: entry.injured })) }, directorMemory: decodeDirectorMemory(value.directorMemory) }; }
function decodeCampaign(value: CampaignDto): CampaignState { return { ...decodeCampaignCheckpoint(value), attemptCounters: { ...value.attemptCounters } as never, routeSeedNonce: value.routeSeedNonce, transitionCounter: value.transitionCounter }; }
function statusLabel(id: string): string { return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()); }
function decodeStatuses(value: readonly CombatStatusDto[]): readonly StatusEffect[] { return value.map((entry) => ({ id: entry.id, label: statusLabel(entry.id), duration: entry.duration, potency: entry.potency })); }
function decodeEnemy(value: EnemyCombatDto, content: ContentIndex): EnemyCombatant | null {
  const definitionId = value.source.kind === 'catalog' ? value.source.enemyId : value.source.originEnemyId;
  const definition = content.enemies.get(definitionId as never);
  if (!definition) return null;
  const base = value.source.kind === 'catalog' ? catalogEnemy(definition, value.instanceId, value.isBoss) : smokeEnemy(definition, value.instanceId);
  if (value.source.kind === 'summon-smoke' && value.isBoss) return null;
  const enemy: EnemyCombatant = { ...base, maxHealth: base.maxHealth + value.modifiers.maxHealth, attack: base.attack + value.modifiers.attack, armor: base.armor + value.modifiers.armor, ward: base.ward + value.modifiers.ward, evasion: base.evasion + value.modifiers.evasion, blockChance: base.blockChance + value.modifiers.blockChance, parryChance: base.parryChance + value.modifiers.parryChance, health: value.health, guarding: value.guarding, statuses: decodeStatuses(value.statuses), phase: value.phase, roleUses: value.roleUses ?? undefined };
  return [enemy.maxHealth, enemy.attack, enemy.armor, enemy.ward, enemy.evasion, enemy.blockChance, enemy.parryChance, enemy.health].every(finite) && enemy.maxHealth >= 1 && enemy.health >= 0 && enemy.health <= enemy.maxHealth ? enemy : null;
}
function intentText(intent: string): string { return intent; }
function decodeCombat(value: CombatDto, campaign: CampaignState, content: ContentIndex): CombatState | null {
  const base = basePlayer(campaign, content);
  const player: HeroCombatant = { ...base, attackBonus: base.attackBonus + value.player.modifiers.attackBonus, armor: base.armor + value.player.modifiers.armor, ward: base.ward + value.player.modifiers.ward, maxHealth: base.maxHealth + value.player.modifiers.maxHealth, maxFocus: base.maxFocus + value.player.modifiers.maxFocus, strength: base.strength + value.player.modifiers.strength, cunning: base.cunning + value.player.modifiers.cunning, will: base.will + value.player.modifiers.will, health: value.player.health, focus: value.player.focus, guarding: value.player.guarding, statuses: decodeStatuses(value.player.statuses) };
  if (![player.attackBonus, player.armor, player.ward, player.maxHealth, player.maxFocus, player.strength, player.cunning, player.will, player.health, player.focus].every(finite) || player.maxHealth < 1 || player.maxFocus < 0 || player.health < 0 || player.health > player.maxHealth || player.focus < 0 || player.focus > player.maxFocus) return null;
  const enemies = value.enemies.map((entry) => decodeEnemy(entry, content));
  if (enemies.some((entry) => entry === null)) return null;
  const hydratedEnemies = enemies as readonly EnemyCombatant[];
  const primary = hydratedEnemies.find((enemy) => enemy.id === value.primaryEnemyId);
  const companion = value.companionId === null ? null : buildCompanionCombatSnapshot(campaign.companions, content);
  if (!primary || (value.companionId !== null && (!companion || companion.companionId !== value.companionId)) || !value.enemyIntents.every((entry) => hydratedEnemies.some((enemy) => enemy.id === entry.enemyId))) return null;
  return { turn: value.turn, rngState: value.rngState, player, enemy: primary, enemies: hydratedEnemies, enemyIntent: value.enemyIntent, enemyIntents: value.enemyIntents.map((entry) => ({ enemyId: entry.enemyId, intent: entry.intent, text: intentText(entry.intent) })), intentText: intentText(value.enemyIntent), outcome: value.outcome, log: [], missedAttacks: value.missedAttacks, companion, companionCooldown: value.companionCooldown, companionDamageDealt: value.companionDamageDealt, companionSupportBudget: value.companionSupportBudget };
}
function decodeDirector(value: DirectorDto): ExpeditionState['director'] { return { ...decodeDirectorMemory(value), usedSceneIds: value.usedSceneIds as never, recentSceneKinds: [...value.recentSceneKinds], recentFamilies: [...value.recentFamilies], currentRunBlockedFamilies: [...value.currentRunBlockedFamilies], tension: value.tension, threat: value.threat }; }
function decodeExpedition(value: ExpeditionDto, campaign: CampaignState, content: ContentIndex): ExpeditionState | null {
  const currentCombat = value.currentCombat === null ? null : { encounterId: value.currentCombat.encounterId as never, combat: value.currentCombat.combat === null ? null : decodeCombat(value.currentCombat.combat, campaign, content) };
  if (value.currentCombat !== null && value.currentCombat.combat !== null && currentCombat?.combat === null) return null;
  return { routeProfile: value.routeProfile, routeSeed: value.routeSeed, director: decodeDirector(value.director), position: { chapterId: value.position.chapterId as never, slot: value.position.slot }, currentSceneId: value.currentSceneId as never, currentCombat, pendingRewards: value.pendingRewards as never, unbankedGold: value.unbankedGold, unbankedLoot: value.unbankedLoot as never, temporaryBoons: [...value.temporaryBoons], merchantVisits: value.merchantVisits.map((visit) => ({ merchantId: visit.merchantId as never, restockKey: visit.restockKey, restockSeed: merchantRestockSeed(value.routeSeed, visit.merchantId as never, visit.restockKey), stock: visit.stock.map((entry) => ({ id: entry.id, itemId: entry.itemId as never })) })) };
}

export function decodeSaveState(value: unknown, content: ContentIndex): GameStateV2 | null {
  if (!isSaveStateDto(value)) return null;
  const campaign = decodeCampaign(value.campaign);
  const expedition = value.expedition === null ? null : decodeExpedition(value.expedition, campaign, content);
  if (value.expedition !== null && !expedition) return null;
  return { schemaVersion: 2, profile: { settings: { ...value.profile.settings }, discoveries: { events: value.profile.discoveries.events as never, enemies: [...value.profile.discoveries.enemies], codex: [...value.profile.discoveries.codex] } }, campaign, expedition, checkpoints: { chapter: { campaign: decodeCampaignCheckpoint(value.checkpoints.chapter.campaign), enteredAt: value.checkpoints.chapter.enteredAt }, camp: value.checkpoints.camp === null ? null : { campaign: decodeCampaignCheckpoint(value.checkpoints.camp.campaign), campSceneId: value.checkpoints.camp.campSceneId as never, savedAt: value.checkpoints.camp.savedAt } }, flow: { screen: value.flow.screen, overlay: value.flow.overlay, merchant: value.flow.merchant === null ? null : { merchantId: value.flow.merchant.merchantId as never, restockKey: value.flow.merchant.restockKey, returnScreen: value.flow.merchant.returnScreen } }, updatedAt: value.updatedAt };
}
