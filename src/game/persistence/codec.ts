import { buildCompanionCombatSnapshot } from '../companions';
import type { ContentIndex, EncounterDefinition } from '../content/schema';
import { roleForEnemy } from '../combat/enemy-ai';
import { calculateCompanionSupportCeiling } from '../combat/encounters';
import type { CombatState, EnemyCombatant, HeroCombatant, StatusEffect } from '../combat/types';
import type { EnemyDefinition } from '../types';
import { generateMerchantVisit, merchantRestockSeed } from '../merchant';
import { chapterLevelCap, deriveHeroStats } from '../progression';
import type { CampaignCheckpointPayload, CampaignState, ExpeditionState, GameStateV2, ProfileState } from '../state/types';
import {
  isProfileState,
  isJsonCompatible,
  isPlainRecord,
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
const campaignKeys = ['seed', 'chapterId', 'heroName', 'hero', 'inventory', 'bankedGold', 'flags', 'evidence', 'factions', 'encounterFamilyVictories', 'companions', 'directorMemory', 'attemptCounters', 'routeSeedNonce', 'transitionCounter'];
const checkpointCampaignKeys = campaignKeys.slice(0, -3);
const inventoryKeys = ['pack', 'stash', 'questItems', 'equipment'];
const directorMemoryKeys = ['rngState', 'seenEventIds', 'familyCooldowns', 'pendingCallbacks'];
const directorKeys = [...directorMemoryKeys, 'usedSceneIds', 'recentSceneKinds', 'recentFamilies', 'currentRunBlockedFamilies', 'tension', 'threat'];

function record(value: unknown): value is Record<string, unknown> { return isPlainRecord(value); }
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

function hasCatalogId(catalog: ReadonlyMap<string, unknown>, value: string): boolean {
  return catalog.has(value);
}

function hasCatalogIds(catalog: ReadonlyMap<string, unknown>, values: readonly string[]): boolean {
  return values.every((value) => hasCatalogId(catalog, value));
}

function validInventoryContent(value: InventoryDto, heroClass: CampaignDto['hero']['heroClass'], content: ContentIndex): boolean {
  const entries = [...value.pack, ...value.stash];
  for (const entry of entries) {
    const item = content.items.get(entry.itemId as never);
    if (!item || item.category === 'quest' || ((item.category !== 'potion' && item.category !== 'scroll') && entry.quantity !== 1)) return false;
  }
  if (!value.questItems.every((itemId) => content.items.get(itemId as never)?.category === 'quest')) return false;
  const weapon = value.equipment.weapon === null ? null : content.items.get(value.equipment.weapon as never);
  const armor = value.equipment.armor === null ? null : content.items.get(value.equipment.armor as never);
  if (value.equipment.weapon !== null && (!weapon || weapon.category !== 'weapon' || !weapon.allowedClasses.includes(heroClass))) return false;
  if (value.equipment.armor !== null && (!armor || armor.category !== 'armor' || !armor.allowedClasses.includes(heroClass))) return false;
  return value.equipment.charms.every((itemId) => {
    const item = content.items.get(itemId as never);
    return item !== undefined && item.category === 'charm' && item.allowedClasses.includes(heroClass);
  });
}

function contentFamilies(content: ContentIndex): ReadonlySet<string> {
  return new Set([...content.events.values()].map((event) => event.family));
}

function validDirectorMemoryContent(value: DirectorMemoryDto, content: ContentIndex, families = contentFamilies(content)): boolean {
  return hasCatalogIds(content.events as ReadonlyMap<string, unknown>, value.seenEventIds)
    && Object.keys(value.familyCooldowns).every((family) => families.has(family))
    && value.pendingCallbacks.every((callback) => {
      const target = content.events.get(callback.targetEventId as never);
    return target !== undefined && target.chapterId === callback.deadline.chapterId && callback.deadline.slot >= 1;
    });
}

function validCompanionsContent(value: CampaignDto['companions'], content: ContentIndex): boolean {
  if (!value.records.every((record) => hasCatalogId(content.companions as ReadonlyMap<string, unknown>, record.companionId))) return false;
  return value.activeCompanionId === null || value.records.some((record) => record.companionId === value.activeCompanionId && record.status === 'recruited');
}

function validCampaignCheckpointContent(value: CampaignCheckpointDto, content: ContentIndex): boolean {
  return validInventoryContent(value.inventory, value.hero.heroClass, content)
    && Object.keys(value.encounterFamilyVictories).every((family) => [...content.encounters.values()].some((encounter) => encounter.family === family))
    && validCompanionsContent(value.companions, content)
    && validDirectorMemoryContent(value.directorMemory, content);
}

function validDirectorContent(value: DirectorDto, content: ContentIndex): boolean {
  const families = contentFamilies(content);
  return validDirectorMemoryContent(value, content, families)
    && hasCatalogIds(content.events as ReadonlyMap<string, unknown>, value.usedSceneIds)
    && value.recentFamilies.every((family) => families.has(family))
    && value.currentRunBlockedFamilies.every((family) => families.has(family));
}

function validProbability(value: number): boolean { return finite(value) && value >= 0 && value <= 100; }

interface ExpectedDirectEnemy {
  readonly instanceId: string;
  readonly enemyId: string;
}

function expectedDirectEnemies(enemyIds: readonly string[]): readonly ExpectedDirectEnemy[] {
  const occurrences = new Map<string, number>();
  return enemyIds.map((enemyId) => {
    const occurrence = (occurrences.get(enemyId) ?? 0) + 1;
    occurrences.set(enemyId, occurrence);
    return { enemyId, instanceId: occurrence === 1 ? enemyId : `${enemyId}-${occurrence}` };
  });
}

function compatibilityEnemyId(enemies: readonly EnemyCombatDto[]): string | null {
  return enemies.find((enemy) => enemy.health > 0)?.instanceId ?? enemies[0]?.instanceId ?? null;
}

function orderedSubset<T>(actual: readonly T[], expected: readonly T[], same: (left: T, right: T) => boolean): boolean {
  let cursor = 0;
  for (const value of actual) {
    while (cursor < expected.length && !same(value, expected[cursor]!)) cursor += 1;
    if (cursor === expected.length) return false;
    cursor += 1;
  }
  return true;
}

function validHydratedPlayer(value: CombatDto['player'], campaign: CampaignDto, content: ContentIndex): boolean {
  const base = basePlayer(decodeCampaign(campaign), content);
  const player = {
    attackBonus: base.attackBonus + value.modifiers.attackBonus,
    armor: base.armor + value.modifiers.armor,
    ward: base.ward + value.modifiers.ward,
    maxHealth: base.maxHealth + value.modifiers.maxHealth,
    maxFocus: base.maxFocus + value.modifiers.maxFocus,
    strength: base.strength + value.modifiers.strength,
    cunning: base.cunning + value.modifiers.cunning,
    will: base.will + value.modifiers.will,
  };
  return Object.values(player).every(finite)
    && player.attackBonus >= 0 && player.armor >= 0 && player.ward >= 0
    && player.maxHealth >= 1 && player.maxFocus >= 0
    && player.strength >= 0 && player.cunning >= 0 && player.will >= 0
    && value.health >= 0 && value.health <= player.maxHealth
    && value.focus >= 0 && value.focus <= player.maxFocus;
}

function validHydratedEnemy(value: EnemyCombatDto, content: ContentIndex): boolean {
  const definitionId = value.source.kind === 'catalog' ? value.source.enemyId : value.source.originEnemyId;
  const definition = content.enemies.get(definitionId as never);
  if (!definition) return false;
  const base = value.source.kind === 'catalog' ? catalogEnemy(definition, value.instanceId, value.isBoss) : smokeEnemy(definition, value.instanceId);
  const enemy = {
    maxHealth: base.maxHealth + value.modifiers.maxHealth,
    attack: base.attack + value.modifiers.attack,
    armor: base.armor + value.modifiers.armor,
    ward: base.ward + value.modifiers.ward,
    evasion: base.evasion + value.modifiers.evasion,
    blockChance: base.blockChance + value.modifiers.blockChance,
    parryChance: base.parryChance + value.modifiers.parryChance,
  };
  if (!Object.values(enemy).every(finite) || enemy.maxHealth < 1 || enemy.attack < 0 || enemy.armor < 0 || enemy.ward < 0 || !validProbability(enemy.evasion) || !validProbability(enemy.blockChance) || !validProbability(enemy.parryChance) || value.health < 0 || value.health > enemy.maxHealth) return false;
  if (value.source.kind === 'summon-smoke') return !value.isBoss && value.phase === 1 && value.roleUses === 0;
  if ((!value.isBoss && value.phase !== 1) || (value.isBoss && value.phase !== 1 && value.phase !== 2)) return false;
  return roleForEnemy(definition) === 'summoner'
    ? value.roleUses === 0 || value.roleUses === 1
    : value.roleUses === 0;
}

function validCombatContent(value: CombatDto, campaign: CampaignDto, encounter: EncounterDefinition, content: ContentIndex): boolean {
  if (!validHydratedPlayer(value.player, campaign, content)) return false;
  const direct = expectedDirectEnemies(encounter.enemyIds);
  if (value.enemies.length < direct.length || new Set(value.enemies.map((enemy) => enemy.instanceId)).size !== value.enemies.length || !value.enemies.every((enemy) => validHydratedEnemy(enemy, content))) return false;
  for (const [index, expected] of direct.entries()) {
    const enemy = value.enemies[index]!;
    if (enemy.source.kind !== 'catalog' || enemy.source.enemyId !== expected.enemyId || enemy.instanceId !== expected.instanceId) return false;
    if (enemy.isBoss !== (encounter.kind === 'boss' && encounter.bossEnemyId === expected.enemyId)) return false;
  }
  const directCombatants = value.enemies.slice(0, direct.length);
  const summonedOwners = new Set<string>();
  for (const enemy of value.enemies.slice(direct.length)) {
    if (enemy.source.kind !== 'summon-smoke') return false;
    const owner = directCombatants.find((candidate) => candidate.source.kind === 'catalog' && `${candidate.instanceId}-smoke-1` === enemy.instanceId);
    if (!owner || owner.source.kind !== 'catalog') return false;
    const definition = content.enemies.get(owner.source.enemyId as never);
    if (!definition || roleForEnemy(definition) !== 'summoner' || enemy.source.originEnemyId !== owner.source.enemyId || summonedOwners.has(owner.instanceId)) return false;
    summonedOwners.add(owner.instanceId);
  }
  for (const enemy of directCombatants) {
    if (enemy.source.kind !== 'catalog') return false;
    const definition = content.enemies.get(enemy.source.enemyId as never);
    if (!definition) return false;
    const smokePresent = summonedOwners.has(enemy.instanceId);
    if (roleForEnemy(definition) === 'summoner') {
      if (enemy.roleUses !== (smokePresent ? 0 : 1)) return false;
    } else if (enemy.roleUses !== 0) return false;
  }
  const primaryEnemyId = compatibilityEnemyId(value.enemies);
  if (primaryEnemyId === null || value.primaryEnemyId !== primaryEnemyId) return false;
  const living = value.enemies.filter((enemy) => enemy.health > 0);
  if (value.outcome === 'active') {
    if (value.player.health <= 0 || living.length === 0 || value.enemyIntents.length !== living.length) return false;
    const intentIds = new Set(value.enemyIntents.map((intent) => intent.enemyId));
    const primaryIntent = value.enemyIntents.find((intent) => intent.enemyId === primaryEnemyId);
    if (intentIds.size !== value.enemyIntents.length || living.some((enemy) => !intentIds.has(enemy.instanceId)) || !primaryIntent || value.enemyIntent !== primaryIntent.intent) return false;
  } else if (value.outcome === 'victory') {
    if (value.player.health <= 0 || living.length !== 0) return false;
  } else if (value.outcome === 'defeat') {
    if (value.player.health !== 0 || living.length === 0) return false;
  } else if (value.outcome === 'fled' && (value.player.health <= 0 || living.length === 0)) return false;
  if (value.companionId === null) return value.companionCooldown === 0 && value.companionDamageDealt === 0;
  const companion = buildCompanionCombatSnapshot(decodeCampaign(campaign).companions, content);
  const definitions = encounter.enemyIds.map((enemyId) => content.enemies.get(enemyId)).filter((enemy): enemy is EnemyDefinition => Boolean(enemy));
  const supportBudget = calculateCompanionSupportCeiling(encounter, definitions, campaign.hero.level, companion);
  return companion?.companionId === value.companionId && value.companionDamageDealt <= supportBudget;
}

function validMerchantVisitsContent(value: ExpeditionDto, campaign: CampaignDto, content: ContentIndex): boolean {
  const namespaces = new Set<string>();
  return value.merchantVisits.every((visit) => {
    const merchant = content.merchants.get(visit.merchantId as never);
    const namespace = `${visit.merchantId}\u0000${visit.restockKey}`;
    if (!merchant || visit.generatedAtLevel > campaign.hero.level || visit.generatedAtLevel > chapterLevelCap(value.position.chapterId as never) || namespaces.has(namespace)) return false;
    namespaces.add(namespace);
    const authorizesVisit = [...content.events.values()].some((scene) => scene.chapterId === value.position.chapterId && scene.type === 'hub' && scene.merchantId === visit.merchantId && scene.merchantRestockKey !== undefined && `${value.routeSeed}:${scene.merchantId}:${scene.merchantRestockKey}` === visit.restockKey);
    if (!authorizesVisit) return false;
    const original = generateMerchantVisit({ content, seed: value.routeSeed, restockKey: visit.restockKey, heroLevel: visit.generatedAtLevel, chapter: Number(value.position.chapterId.slice(2)), reputation: 0, scarcityMultiplier: 1 }, merchant);
    return visit.stock.length <= 6 && orderedSubset(visit.stock, original.stock, (actual, expected) => actual.id === expected.id && actual.itemId === expected.itemId);
  });
}

function validExpeditionContent(value: ExpeditionDto, campaign: CampaignDto, content: ContentIndex): boolean {
  const scene = value.currentSceneId === null ? null : content.events.get(value.currentSceneId as never);
  const encounter = value.currentCombat === null ? null : content.encounters.get(value.currentCombat.encounterId as never);
  if (!validDirectorContent(value.director, content)) return false;
  if (value.currentSceneId !== null && (!scene || scene.chapterId !== value.position.chapterId)) return false;
  if (value.sceneResolution !== null) {
    if (!scene || value.sceneResolution.eventId !== scene.id) return false;
    if (value.sceneResolution.choiceId === null ? scene.choices.length !== 0 : !scene.choices.some((choice) => choice.id === value.sceneResolution!.choiceId)) return false;
  } else if (scene && scene.choices.length === 0) return false;
  const decodedCampaign = decodeCampaign(campaign);
  const maxima = deriveHeroStats(decodedCampaign.hero, decodedCampaign.inventory, content.items);
  if (value.heroVitals.health > maxima.maxHealth || value.heroVitals.resource > maxima.maxFocus) return false;
  if (value.currentCombat !== null) {
    if (!encounter || (value.currentCombat.combat !== null && !validCombatContent(value.currentCombat.combat, campaign, encounter, content))) return false;
  }
  const combat = value.currentCombat?.combat;
  if (combat && (combat.player.health !== value.heroVitals.health || combat.player.focus !== value.heroVitals.resource)) return false;
  if (value.pendingReward !== null) {
    const rewardEncounter = content.encounters.get(value.pendingReward.encounterId as never);
    if (!rewardEncounter || combat?.outcome !== 'victory' || value.currentCombat?.encounterId !== value.pendingReward.encounterId) return false;
    const expectedId = `${value.routeSeed}:${value.position.slot}:${value.pendingReward.encounterId}`;
    if (value.pendingReward.rewardId !== expectedId || !sameArray(value.pendingReward.itemChoices, rewardEncounter.reward.itemChoices) || value.pendingReward.baseGold !== rewardEncounter.reward.gold || value.pendingReward.grantedXp > rewardEncounter.reward.xp || value.pendingReward.adEligible !== (rewardEncounter.kind === 'regular')) return false;
  } else if (combat?.outcome === 'victory') return false;
  return hasCatalogIds(content.items as ReadonlyMap<string, unknown>, value.pendingReward?.itemChoices ?? [])
    && hasCatalogIds(content.items as ReadonlyMap<string, unknown>, value.unbankedLoot)
    && validMerchantVisitsContent(value, campaign, content);
}

function validFlowContent(value: SaveStateDto, content: ContentIndex): boolean {
  const { expedition, flow } = value;
  if ((flow.screen === 'merchant') !== (flow.merchant !== null)) return false;
  if (flow.merchant !== null) {
    const scene = expedition?.currentSceneId === null || expedition === null ? null : content.events.get(expedition.currentSceneId as never);
    if (!expedition || expedition.currentCombat !== null || !scene || scene.type !== 'hub' || scene.merchantId !== flow.merchant.merchantId || !scene.merchantRestockKey) return false;
    const expectedRestockKey = `${expedition.routeSeed}:${scene.merchantId}:${scene.merchantRestockKey}`;
    return flow.merchant.restockKey === expectedRestockKey
      && expedition.merchantVisits.some((visit) => visit.merchantId === flow.merchant!.merchantId && visit.restockKey === flow.merchant!.restockKey);
  }
  const combat = expedition?.currentCombat?.combat ?? null;
  if (combat === null) return !['combat', 'reward'].includes(flow.screen);
  if (combat.outcome === 'active') return flow.screen === 'combat';
  if (combat.outcome === 'victory') return flow.screen === 'reward' && expedition?.pendingReward !== null;
  if (combat.outcome === 'fled') return false;
  return flow.screen === 'defeat';
}

/** Content maps own immutable definitions; a DTO may only carry IDs that can be hydrated from those maps. */
export function isContentBackedProfile(profile: ProfileState, content: ContentIndex): boolean {
  return hasCatalogIds(content.events as ReadonlyMap<string, unknown>, profile.discoveries.events)
    && hasCatalogIds(content.enemies as ReadonlyMap<string, unknown>, profile.discoveries.enemies);
}

function sameCampaignIdentity(left: CampaignCheckpointDto, right: CampaignCheckpointDto): boolean {
  return left.seed === right.seed && left.heroName === right.heroName && left.hero.heroClass === right.hero.heroClass;
}

function validCheckpointCoherence(value: SaveStateDto, content: ContentIndex): boolean {
  const { campaign, checkpoints } = value;
  if (campaign.chapterId !== checkpoints.chapter.campaign.chapterId || !sameCampaignIdentity(campaign, checkpoints.chapter.campaign)) return false;
  if (checkpoints.camp !== null) {
    const campScene = checkpoints.camp.campSceneId === null ? null : content.events.get(checkpoints.camp.campSceneId as never);
    if (checkpoints.camp.campaign.chapterId !== campaign.chapterId || !sameCampaignIdentity(campaign, checkpoints.camp.campaign) || (checkpoints.camp.campSceneId !== null && (!campScene || campScene.chapterId !== campaign.chapterId))) return false;
  }
  return value.expedition === null || value.expedition.position.chapterId === campaign.chapterId;
}

export function isContentBackedSaveState(value: SaveStateDto, content: ContentIndex): boolean {
  if (!isContentBackedProfile(value.profile, content) || !validCampaignCheckpointContent(value.campaign, content) || !validCampaignCheckpointContent(value.checkpoints.chapter.campaign, content) || (value.checkpoints.camp !== null && !validCampaignCheckpointContent(value.checkpoints.camp.campaign, content))) return false;
  if (value.checkpoints.camp?.campSceneId !== null && value.checkpoints.camp?.campSceneId !== undefined && !hasCatalogId(content.events as ReadonlyMap<string, unknown>, value.checkpoints.camp.campSceneId)) return false;
  if (!validCheckpointCoherence(value, content) || (value.expedition !== null && !validExpeditionContent(value.expedition, value.campaign, content))) return false;
  return validFlowContent(value, content);
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
  if (!exact(value, checkpointCampaignKeys) || !finiteInteger(value.seed) || value.seed < 0 || typeof value.chapterId !== 'string' || !id(value.heroName) || value.heroName.length > 48 || !exact(value.hero, ['heroClass', 'level', 'xp', 'talents']) || !['warrior', 'mage', 'warden'].includes(value.hero.heroClass) || !finiteInteger(value.hero.level) || value.hero.level < 1 || !finiteInteger(value.hero.xp) || value.hero.xp < 0 || !strings(value.hero.talents) || !strings(value.flags) || !strings(value.evidence) || !finiteInteger(value.bankedGold) || value.bankedGold < 0 || !record(value.factions) || !Object.values(value.factions).every(finite) || !record(value.encounterFamilyVictories) || !Object.values(value.encounterFamilyVictories).every((entry) => finiteInteger(entry) && entry >= 0)) return null;
  const inventory = encodeInventory(value.inventory);
  const companions = encodeCompanions(value.companions);
  const directorMemory = encodeDirectorMemory(value.directorMemory);
  return inventory && companions && directorMemory ? {
    seed: value.seed, chapterId: value.chapterId, heroName: value.heroName, hero: { heroClass: value.hero.heroClass, level: value.hero.level, xp: value.hero.xp, talents: [...value.hero.talents] }, inventory,
    bankedGold: value.bankedGold, flags: [...value.flags], evidence: [...value.evidence], factions: { ...value.factions }, encounterFamilyVictories: { ...value.encounterFamilyVictories }, companions, directorMemory,
  } : null;
}

function encodeCampaign(value: CampaignState): CampaignDto | null {
  if (!exact(value, campaignKeys) || !record(value.attemptCounters) || !Object.entries(value.attemptCounters).every(([key, entry]) => /^ch0[1-8]$/.test(key) && finiteInteger(entry) && entry >= 0) || !finiteInteger(value.routeSeedNonce) || value.routeSeedNonce < 0 || !finiteInteger(value.transitionCounter) || value.transitionCounter < 0) return null;
  const checkpoint = encodeCampaignCheckpoint({ seed: value.seed, chapterId: value.chapterId, heroName: value.heroName, hero: value.hero, inventory: value.inventory, bankedGold: value.bankedGold, flags: value.flags, evidence: value.evidence, factions: value.factions, encounterFamilyVictories: value.encounterFamilyVictories, companions: value.companions, directorMemory: value.directorMemory } as CampaignCheckpointPayload);
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

function encodeCombat(value: CombatState, campaign: CampaignState, campaignDto: CampaignDto, encounter: EncounterDefinition, content: ContentIndex): CombatDto | null {
  if (!exact(value, ['turn', 'rngState', 'player', 'enemy', 'enemies', 'enemyIntent', 'enemyIntents', 'intentText', 'outcome', 'log', 'missedAttacks', 'companion', 'companionCooldown', 'companionDamageDealt', 'companionSupportBudget']) || !record(value.player) || !record(value.enemy) || !Array.isArray(value.enemies) || !Array.isArray(value.enemyIntents) || !Array.isArray(value.log) || !finiteInteger(value.turn) || value.turn < 1 || !finiteInteger(value.rngState) || value.rngState < 0 || value.enemies.length === 0 || !['strike', 'heavy', 'guard', 'hex', 'recover', 'flee'].includes(value.enemyIntent) || !['active', 'victory', 'defeat', 'fled'].includes(value.outcome) || !finiteInteger(value.missedAttacks) || value.missedAttacks < 0 || !finiteInteger(value.companionCooldown) || value.companionCooldown < 0 || !finite(value.companionDamageDealt) || !finite(value.companionSupportBudget)) return null;
  if (value.companion !== null && !validRuntimeCompanion(value.companion)) return null;
  const base = basePlayer(campaign, content);
  const modifiers = playerModifiers(value.player, base);
  const statuses = encodeStatuses(value.player.statuses);
  const enemies = value.enemies.map((enemy) => encodeEnemy(enemy, content));
  const intents = value.enemyIntents.map((intent) => exact(intent, ['enemyId', 'intent', 'text']) && id(intent.enemyId) && typeof intent.text === 'string' && typeof intent.intent === 'string' && ['strike', 'heavy', 'guard', 'hex', 'recover', 'flee'].includes(intent.intent) ? { enemyId: intent.enemyId, intent: intent.intent } : null);
  const companion = value.companion === null ? null : buildCompanionCombatSnapshot(campaign.companions, content);
  if (!modifiers || !statuses || enemies.some((entry) => entry === null) || intents.some((entry) => entry === null) || !id(value.enemy.id) || (value.companion !== null && (!companion || companion.companionId !== value.companion.companionId))) return null;
  const encodedEnemies = enemies as readonly EnemyCombatDto[];
  const primaryEnemyId = compatibilityEnemyId(encodedEnemies);
  if (primaryEnemyId === null || value.enemy.id !== primaryEnemyId) return null;
  const terminal = value.outcome !== 'active';
  const dto: CombatDto = {
    turn: value.turn,
    rngState: value.rngState,
    player: { health: value.player.health, focus: value.player.focus, guarding: value.player.guarding, statuses, modifiers },
    enemies: encodedEnemies,
    primaryEnemyId,
    enemyIntent: terminal ? 'strike' : value.enemyIntent,
    enemyIntents: terminal ? [] : intents as CombatDto['enemyIntents'],
    outcome: value.outcome,
    missedAttacks: value.missedAttacks,
    companionId: companion?.companionId ?? null,
    companionCooldown: value.companionCooldown,
    companionDamageDealt: value.companionDamageDealt,
  };
  const definitions = encounter.enemyIds.map((enemyId) => content.enemies.get(enemyId)).filter((enemy): enemy is EnemyDefinition => Boolean(enemy));
  const expectedSupport = calculateCompanionSupportCeiling(encounter, definitions, campaign.hero.level, companion);
  return value.companionSupportBudget === expectedSupport && validCombatContent(dto, campaignDto, encounter, content) ? dto : null;
}

function encodeExpedition(value: ExpeditionState, campaign: CampaignState, campaignDto: CampaignDto, content: ContentIndex): ExpeditionDto | null {
  if (!exact(value, ['routeProfile', 'routeSeed', 'director', 'position', 'currentSceneId', 'sceneResolution', 'heroVitals', 'currentCombat', 'pendingReward', 'unbankedGold', 'unbankedLoot', 'temporaryBoons', 'merchantVisits']) || !['kings-road', 'old-forest', 'ruined-pass'].includes(value.routeProfile) || !finiteInteger(value.routeSeed) || value.routeSeed < 0 || !exact(value.position, ['chapterId', 'slot']) || typeof value.position.chapterId !== 'string' || !finiteInteger(value.position.slot) || value.position.slot < 0 || (value.currentSceneId !== null && !id(value.currentSceneId)) || (value.sceneResolution !== null && (!exact(value.sceneResolution, ['eventId', 'choiceId']) || !id(value.sceneResolution.eventId) || (value.sceneResolution.choiceId !== null && !id(value.sceneResolution.choiceId)))) || !exact(value.heroVitals, ['health', 'resource']) || !finite(value.heroVitals.health) || value.heroVitals.health < 0 || !finite(value.heroVitals.resource) || value.heroVitals.resource < 0 || (value.pendingReward !== null && (!exact(value.pendingReward, ['rewardId', 'encounterId', 'itemChoices', 'baseGold', 'grantedXp', 'adEligible']) || !id(value.pendingReward.rewardId) || !id(value.pendingReward.encounterId) || !strings(value.pendingReward.itemChoices) || !finiteInteger(value.pendingReward.baseGold) || value.pendingReward.baseGold < 0 || !finiteInteger(value.pendingReward.grantedXp) || value.pendingReward.grantedXp < 0 || typeof value.pendingReward.adEligible !== 'boolean')) || !finiteInteger(value.unbankedGold) || value.unbankedGold < 0 || !strings(value.unbankedLoot) || !strings(value.temporaryBoons) || !Array.isArray(value.merchantVisits)) return null;
  const director = encodeDirector(value.director);
  const encounter = value.currentCombat === null ? null : content.encounters.get(value.currentCombat.encounterId);
  const currentCombat = value.currentCombat === null ? null : exact(value.currentCombat, ['encounterId', 'combat']) && id(value.currentCombat.encounterId) && encounter !== null && encounter !== undefined ? { encounterId: value.currentCombat.encounterId, combat: value.currentCombat.combat === null ? null : encodeCombat(value.currentCombat.combat, campaign, campaignDto, encounter, content) } : null;
  if (!director || (value.currentCombat !== null && (!currentCombat || currentCombat.combat === null && value.currentCombat.combat !== null))) return null;
  const merchantVisits = value.merchantVisits.map((visit) => exact(visit, ['merchantId', 'restockKey', 'restockSeed', 'generatedAtLevel', 'stock']) && id(visit.merchantId) && id(visit.restockKey) && finiteInteger(visit.restockSeed) && visit.restockSeed >= 0 && finiteInteger(visit.generatedAtLevel) && visit.generatedAtLevel >= 1 && visit.generatedAtLevel <= 15 && Array.isArray(visit.stock) && visit.stock.every((entry) => exact(entry, ['id', 'itemId']) && id(entry.id) && id(entry.itemId)) ? { merchantId: visit.merchantId, restockKey: visit.restockKey, generatedAtLevel: visit.generatedAtLevel, stock: visit.stock.map((entry) => ({ id: entry.id, itemId: entry.itemId })) } : null);
  if (merchantVisits.some((entry) => entry === null)) return null;
  return { routeProfile: value.routeProfile, routeSeed: value.routeSeed, director, position: { chapterId: value.position.chapterId, slot: value.position.slot }, currentSceneId: value.currentSceneId, sceneResolution: value.sceneResolution ? { ...value.sceneResolution } : null, heroVitals: { ...value.heroVitals }, currentCombat: currentCombat as ExpeditionDto['currentCombat'], pendingReward: value.pendingReward ? { ...value.pendingReward, itemChoices: [...value.pendingReward.itemChoices] } : null, unbankedGold: value.unbankedGold, unbankedLoot: [...value.unbankedLoot], temporaryBoons: [...value.temporaryBoons], merchantVisits: merchantVisits as readonly ExpeditionDto['merchantVisits'][number][] };
}

function validRuntimeShell(state: GameStateV2): boolean {
  if (!exact(state, rootKeys) || state.schemaVersion !== 2 || !exact(state.checkpoints, ['chapter', 'camp']) || !exact(state.checkpoints.chapter, ['campaign', 'enteredAt']) || typeof state.checkpoints.chapter.enteredAt !== 'string' || !exact(state.flow, ['screen', 'overlay', 'merchant']) || typeof state.updatedAt !== 'string') return false;
  if (state.checkpoints.camp !== null && (!exact(state.checkpoints.camp, ['campaign', 'campSceneId', 'savedAt']) || typeof state.checkpoints.camp.savedAt !== 'string' || (state.checkpoints.camp.campSceneId !== null && !id(state.checkpoints.camp.campSceneId)))) return false;
  if (!['camp', 'story', 'combat', 'reward', 'merchant', 'defeat', 'ending'].includes(state.flow.screen)) return false;
  if (state.flow.overlay !== null && !['inventory', 'chronicle', 'bestiary', 'settings'].includes(state.flow.overlay)) return false;
  return state.flow.merchant === null || (exact(state.flow.merchant, ['merchantId', 'restockKey', 'returnScreen']) && id(state.flow.merchant.merchantId) && id(state.flow.merchant.restockKey) && ['camp', 'story'].includes(state.flow.merchant.returnScreen));
}

export function encodeSaveState(state: GameStateV2, content: ContentIndex): SaveStateDto | null {
  if (!isJsonCompatible(state) || !validRuntimeShell(state)) return null;
  const profile = encodeProfile(state.profile);
  const campaign = encodeCampaign(state.campaign);
  const chapter = encodeCampaignCheckpoint(state.checkpoints.chapter.campaign);
  const camp = state.checkpoints.camp === null ? null : encodeCampaignCheckpoint(state.checkpoints.camp.campaign);
  if (!profile || !campaign || !chapter || (state.checkpoints.camp !== null && !camp)) return null;
  const expedition = state.expedition === null ? null : encodeExpedition(state.expedition, state.campaign, campaign, content);
  if (state.expedition !== null && !expedition) return null;
  const dto: SaveStateDto = { schemaVersion: 2, profile, campaign, expedition, checkpoints: { chapter: { campaign: chapter, enteredAt: state.checkpoints.chapter.enteredAt }, camp: camp && state.checkpoints.camp ? { campaign: camp, campSceneId: state.checkpoints.camp.campSceneId, savedAt: state.checkpoints.camp.savedAt } : null }, flow: { screen: state.flow.screen, overlay: state.flow.overlay, merchant: state.flow.merchant ? { ...state.flow.merchant } : null }, updatedAt: state.updatedAt };
  return isSaveStateDto(dto) && isContentBackedSaveState(dto, content) && decodeSaveState(dto, content) ? dto : null;
}

function decodeInventory(value: InventoryDto): CampaignState['inventory'] { return { pack: value.pack.map((entry) => ({ id: entry.id, itemId: entry.itemId as never, quantity: entry.quantity })), stash: value.stash.map((entry) => ({ id: entry.id, itemId: entry.itemId as never, quantity: entry.quantity })), questItems: value.questItems as never, equipment: { weapon: value.equipment.weapon as never, armor: value.equipment.armor as never, charms: value.equipment.charms as never } }; }
function decodeDirectorMemory(value: DirectorMemoryDto): CampaignState['directorMemory'] { return { rngState: value.rngState, seenEventIds: value.seenEventIds as never, familyCooldowns: { ...value.familyCooldowns }, pendingCallbacks: value.pendingCallbacks.map((entry) => ({ targetEventId: entry.targetEventId as never, deadline: { chapterId: entry.deadline.chapterId as never, slot: entry.deadline.slot }, status: entry.status, required: entry.required })) }; }
function decodeCampaignCheckpoint(value: CampaignCheckpointDto): CampaignCheckpointPayload { return { seed: value.seed, chapterId: value.chapterId as never, heroName: value.heroName, hero: { heroClass: value.hero.heroClass, level: value.hero.level, xp: value.hero.xp, talents: [...value.hero.talents] }, inventory: decodeInventory(value.inventory), bankedGold: value.bankedGold, flags: [...value.flags], evidence: [...value.evidence], factions: { ...value.factions }, encounterFamilyVictories: { ...value.encounterFamilyVictories }, companions: { activeCompanionId: value.companions.activeCompanionId as never, records: value.companions.records.map((entry) => ({ companionId: entry.companionId as never, status: entry.status, questStage: entry.questStage as never, loyalty: entry.loyalty, injured: entry.injured })) }, directorMemory: decodeDirectorMemory(value.directorMemory) }; }
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
function decodeCombat(value: CombatDto, campaign: CampaignState, encounter: EncounterDefinition, content: ContentIndex): CombatState | null {
  const base = basePlayer(campaign, content);
  const player: HeroCombatant = { ...base, attackBonus: base.attackBonus + value.player.modifiers.attackBonus, armor: base.armor + value.player.modifiers.armor, ward: base.ward + value.player.modifiers.ward, maxHealth: base.maxHealth + value.player.modifiers.maxHealth, maxFocus: base.maxFocus + value.player.modifiers.maxFocus, strength: base.strength + value.player.modifiers.strength, cunning: base.cunning + value.player.modifiers.cunning, will: base.will + value.player.modifiers.will, health: value.player.health, focus: value.player.focus, guarding: value.player.guarding, statuses: decodeStatuses(value.player.statuses) };
  if (![player.attackBonus, player.armor, player.ward, player.maxHealth, player.maxFocus, player.strength, player.cunning, player.will, player.health, player.focus].every(finite) || player.maxHealth < 1 || player.maxFocus < 0 || player.health < 0 || player.health > player.maxHealth || player.focus < 0 || player.focus > player.maxFocus) return null;
  const enemies = value.enemies.map((entry) => decodeEnemy(entry, content));
  if (enemies.some((entry) => entry === null)) return null;
  const hydratedEnemies = enemies as readonly EnemyCombatant[];
  const primary = hydratedEnemies.find((enemy) => enemy.id === value.primaryEnemyId);
  const companion = value.companionId === null ? null : buildCompanionCombatSnapshot(campaign.companions, content);
  if (!primary || (value.companionId !== null && (!companion || companion.companionId !== value.companionId)) || !value.enemyIntents.every((entry) => hydratedEnemies.some((enemy) => enemy.id === entry.enemyId))) return null;
  const terminal = value.outcome !== 'active';
  const enemyIntents = terminal ? [] : value.enemyIntents.map((entry) => ({ enemyId: entry.enemyId, intent: entry.intent, text: intentText(entry.intent) }));
  const enemyIntent = terminal ? 'strike' : value.enemyIntent;
  const definitions = encounter.enemyIds.map((enemyId) => content.enemies.get(enemyId)).filter((enemy): enemy is EnemyDefinition => Boolean(enemy));
  const companionSupportBudget = calculateCompanionSupportCeiling(encounter, definitions, campaign.hero.level, companion);
  return { turn: value.turn, rngState: value.rngState, player, enemy: primary, enemies: hydratedEnemies, enemyIntent, enemyIntents, intentText: intentText(enemyIntent), outcome: value.outcome, log: [], missedAttacks: value.missedAttacks, companion, companionCooldown: value.companionCooldown, companionDamageDealt: value.companionDamageDealt, companionSupportBudget };
}
function decodeDirector(value: DirectorDto): ExpeditionState['director'] { return { ...decodeDirectorMemory(value), usedSceneIds: value.usedSceneIds as never, recentSceneKinds: [...value.recentSceneKinds], recentFamilies: [...value.recentFamilies], currentRunBlockedFamilies: [...value.currentRunBlockedFamilies], tension: value.tension, threat: value.threat }; }
function decodeExpedition(value: ExpeditionDto, campaign: CampaignState, content: ContentIndex): ExpeditionState | null {
  const encounter = value.currentCombat === null ? null : content.encounters.get(value.currentCombat.encounterId as never);
  const currentCombat = value.currentCombat === null ? null : { encounterId: value.currentCombat.encounterId as never, combat: value.currentCombat.combat === null || !encounter ? null : decodeCombat(value.currentCombat.combat, campaign, encounter, content) };
  if (value.currentCombat !== null && value.currentCombat.combat !== null && currentCombat?.combat === null) return null;
  return { routeProfile: value.routeProfile, routeSeed: value.routeSeed, director: decodeDirector(value.director), position: { chapterId: value.position.chapterId as never, slot: value.position.slot }, currentSceneId: value.currentSceneId as never, sceneResolution: value.sceneResolution === null ? null : { eventId: value.sceneResolution.eventId as never, choiceId: value.sceneResolution.choiceId as never }, heroVitals: { ...value.heroVitals }, currentCombat, pendingReward: value.pendingReward === null ? null : { rewardId: value.pendingReward.rewardId, encounterId: value.pendingReward.encounterId as never, itemChoices: value.pendingReward.itemChoices as never, baseGold: value.pendingReward.baseGold, grantedXp: value.pendingReward.grantedXp, adEligible: value.pendingReward.adEligible }, unbankedGold: value.unbankedGold, unbankedLoot: value.unbankedLoot as never, temporaryBoons: [...value.temporaryBoons], merchantVisits: value.merchantVisits.map((visit) => ({ merchantId: visit.merchantId as never, restockKey: visit.restockKey, restockSeed: merchantRestockSeed(value.routeSeed, visit.merchantId as never, visit.restockKey), generatedAtLevel: visit.generatedAtLevel, stock: visit.stock.map((entry) => ({ id: entry.id, itemId: entry.itemId as never })) })) };
}

export function decodeSaveState(value: unknown, content: ContentIndex): GameStateV2 | null {
  if (!isSaveStateDto(value) || !isContentBackedSaveState(value, content)) return null;
  const campaign = decodeCampaign(value.campaign);
  const expedition = value.expedition === null ? null : decodeExpedition(value.expedition, campaign, content);
  if (value.expedition !== null && !expedition) return null;
  return { schemaVersion: 2, profile: { settings: { ...value.profile.settings }, discoveries: { events: value.profile.discoveries.events as never, enemies: [...value.profile.discoveries.enemies], codex: [...value.profile.discoveries.codex] } }, campaign, expedition, checkpoints: { chapter: { campaign: decodeCampaignCheckpoint(value.checkpoints.chapter.campaign), enteredAt: value.checkpoints.chapter.enteredAt }, camp: value.checkpoints.camp === null ? null : { campaign: decodeCampaignCheckpoint(value.checkpoints.camp.campaign), campSceneId: value.checkpoints.camp.campSceneId as never, savedAt: value.checkpoints.camp.savedAt } }, flow: { screen: value.flow.screen, overlay: value.flow.overlay, merchant: value.flow.merchant === null ? null : { merchantId: value.flow.merchant.merchantId as never, restockKey: value.flow.merchant.restockKey, returnScreen: value.flow.merchant.returnScreen } }, updatedAt: value.updatedAt };
}
