import type { AdPacingState, ProfileState } from '../state/types';
import { PACK_CAPACITY } from '../inventory';
import { isTalentForClass, LEVEL_CAP } from '../progression';
import { checksumFor } from './checksum';

export interface InventoryEntryDto { readonly id: string; readonly itemId: string; readonly quantity: number; }
export interface InventoryDto { readonly pack: readonly InventoryEntryDto[]; readonly stash: readonly InventoryEntryDto[]; readonly questItems: readonly string[]; readonly equipment: { readonly weapon: string | null; readonly armor: string | null; readonly charms: readonly string[] }; }
export interface HeroDto { readonly heroClass: 'warrior' | 'mage' | 'warden'; readonly level: number; readonly xp: number; readonly talents: readonly string[]; }
export interface PendingCallbackDto { readonly targetEventId: string; readonly deadline: { readonly chapterId: string; readonly slot: number }; readonly status: 'pending' | 'fulfilled'; readonly required: boolean; }
export interface DirectorMemoryDto { readonly rngState: number; readonly seenEventIds: readonly string[]; readonly familyCooldowns: Readonly<Record<string, number>>; readonly pendingCallbacks: readonly PendingCallbackDto[]; }
export interface DirectorDto extends DirectorMemoryDto { readonly usedSceneIds: readonly string[]; readonly recentSceneKinds: readonly ('danger' | 'merchant' | 'recovery' | 'quiet')[]; readonly recentFamilies: readonly string[]; readonly currentRunBlockedFamilies: readonly string[]; readonly tension: number; readonly threat: number; }
export interface CompanionRecordDto { readonly companionId: string; readonly status: 'unknown' | 'recruited' | 'left' | 'dead'; readonly questStage: number; readonly loyalty: number; readonly injured: boolean; }
export interface CompanionsDto { readonly activeCompanionId: string | null; readonly records: readonly CompanionRecordDto[]; }
export type SaveSlot = 1 | 2 | 3;
export interface ProfileSettingsDto {
  readonly textScale: number;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly sound: boolean;
  readonly music: boolean;
  readonly narration: boolean;
  readonly haptics?: boolean;
  readonly reducedHaptics?: boolean;
}
export interface ProfileDto {
  readonly settings: ProfileSettingsDto;
  readonly discoveries: ProfileState['discoveries'];
}
export interface CampaignCheckpointDto { readonly seed: number; readonly chapterId: string; readonly heroName: string; readonly hero: HeroDto; readonly inventory: InventoryDto; readonly bankedGold: number; readonly flags: readonly string[]; readonly evidence: readonly string[]; readonly factions: Readonly<Record<string, number>>; readonly encounterFamilyVictories: Readonly<Record<string, number>>; readonly companions: CompanionsDto; readonly directorMemory: DirectorMemoryDto; }
export interface CampaignDto extends CampaignCheckpointDto { readonly attemptCounters: Readonly<Record<string, number>>; readonly routeSeedNonce: number; readonly transitionCounter: number; }
export interface CombatStatusDto { readonly id: string; readonly duration: number; readonly potency: number; }
export interface PlayerModifierDto { readonly attackBonus: number; readonly armor: number; readonly ward: number; readonly maxHealth: number; readonly maxFocus: number; readonly strength: number; readonly cunning: number; readonly will: number; }
export interface EnemyModifierDto { readonly maxHealth: number; readonly attack: number; readonly armor: number; readonly ward: number; readonly evasion: number; readonly blockChance: number; readonly parryChance: number; }
export type EnemySourceDto = { readonly kind: 'catalog'; readonly enemyId: string } | { readonly kind: 'summon-smoke'; readonly originEnemyId: string };
export interface EnemyCombatDto { readonly instanceId: string; readonly source: EnemySourceDto; readonly isBoss: boolean; readonly health: number; readonly guarding: boolean; readonly statuses: readonly CombatStatusDto[]; readonly phase: number; readonly roleUses: number | null; readonly modifiers: EnemyModifierDto; }
export interface CombatIntentDto { readonly enemyId: string; readonly intent: 'strike' | 'heavy' | 'guard' | 'hex' | 'recover' | 'flee'; }
export interface CombatDto { readonly turn: number; readonly rngState: number; readonly player: { readonly health: number; readonly focus: number; readonly guarding: boolean; readonly statuses: readonly CombatStatusDto[]; readonly modifiers: PlayerModifierDto; }; readonly enemies: readonly EnemyCombatDto[]; readonly primaryEnemyId: string; readonly enemyIntent: CombatIntentDto['intent']; readonly enemyIntents: readonly CombatIntentDto[]; readonly outcome: 'active' | 'victory' | 'defeat' | 'fled'; readonly missedAttacks: number; readonly companionId: string | null; readonly companionCooldown: number; readonly companionDamageDealt: number; }
export interface MerchantVisitDto { readonly merchantId: string; readonly restockKey: string; readonly generatedAtLevel: number; readonly stock: readonly { readonly id: string; readonly itemId: string }[]; }
export interface PendingBattleRewardDto { readonly rewardId: string; readonly rewardOfferId?: string; readonly encounterId: string; readonly itemChoices: readonly string[]; readonly baseGold: number; readonly grantedXp: number; readonly adEligible: boolean; readonly rewardedGoldSettlement?: 'available' | 'claimed' | 'ineligible'; }
export interface CompactSceneResolutionDto { readonly eventId: string; readonly choiceId: string | null; }
export interface RichSceneResolutionDto extends CompactSceneResolutionDto { readonly resultKind: 'direct' | 'critical-success' | 'success' | 'failure' | 'critical-failure'; readonly chance: number | null; readonly roll: number | null; readonly outcome: string; readonly effectSummary: readonly string[]; readonly nextSceneId: string | null; readonly continueLabel: string | null; }
export type LegacySceneResolutionDto = CompactSceneResolutionDto | RichSceneResolutionDto;
interface SceneResolutionBaseDto extends CompactSceneResolutionDto { readonly outcome: string; readonly effectSummary: readonly string[]; readonly nextSceneId: string | null; readonly continueLabel: string | null; }
export interface DirectSceneResolutionDto extends SceneResolutionBaseDto { readonly resultKind: 'direct'; readonly chance: null; readonly roll: null; }
export interface CheckedSceneResolutionDto extends SceneResolutionBaseDto { readonly choiceId: string; readonly resultKind: 'critical-success' | 'success' | 'failure' | 'critical-failure'; readonly chance: number; readonly roll: number; }
export type SceneResolutionDto = DirectSceneResolutionDto | CheckedSceneResolutionDto;
export interface CheckedAttemptDto { readonly eventId: string; readonly choiceId: string; readonly visitOrdinal: number; readonly chance: number; readonly roll: number; readonly resultKind: CheckedSceneResolutionDto['resultKind']; }
export interface AuthoredSceneQueueEntryDto { readonly sceneId: string; readonly sourceSceneId: string; readonly requirementMode: 'required' | 'optional'; readonly reason?: string; }
interface ExpeditionBaseDto { readonly routeProfile: 'kings-road' | 'old-forest' | 'ruined-pass'; readonly routeSeed: number; readonly director: DirectorDto; readonly position: { readonly chapterId: string; readonly slot: number }; readonly currentSceneId: string | null; readonly authoredSceneQueue: readonly AuthoredSceneQueueEntryDto[]; readonly heroVitals: { readonly health: number; readonly resource: number }; readonly currentCombat: { readonly encounterId: string; readonly combat: CombatDto | null } | null; readonly pendingReward: PendingBattleRewardDto | null; readonly unbankedGold: number; readonly unbankedLoot: readonly string[]; readonly temporaryBoons: readonly string[]; readonly merchantVisits: readonly MerchantVisitDto[]; }
export interface ExpeditionV2Dto extends Omit<ExpeditionBaseDto, 'authoredSceneQueue'> { readonly sceneResolution: LegacySceneResolutionDto | null; readonly authoredSceneQueue?: readonly AuthoredSceneQueueEntryDto[]; }
export interface ExpeditionDto extends ExpeditionBaseDto { readonly dialogueBeatIndex: number; readonly sceneResolution: SceneResolutionDto | null; readonly sceneVisitCounts: Readonly<Record<string, number>>; readonly checkedAttempts: readonly CheckedAttemptDto[]; }
interface SaveStateBaseDto { readonly profile: ProfileDto; readonly campaign: CampaignDto; readonly adPacing?: AdPacingState; readonly checkpoints: { readonly chapter: { readonly campaign: CampaignCheckpointDto; readonly enteredAt: string }; readonly camp: { readonly campaign: CampaignCheckpointDto; readonly campSceneId: string | null; readonly savedAt: string } | null }; readonly flow: { readonly screen: 'camp' | 'story' | 'combat' | 'reward' | 'merchant' | 'defeat' | 'ending'; readonly overlay: 'inventory' | 'chronicle' | 'bestiary' | 'settings' | null; readonly merchant: { readonly merchantId: string; readonly restockKey: string; readonly returnScreen: 'camp' | 'story' } | null }; readonly updatedAt: string; }
export interface SaveStateV2Dto extends SaveStateBaseDto { readonly schemaVersion: 2; readonly expedition: ExpeditionV2Dto | null; }
export interface SaveStateDto extends SaveStateBaseDto { readonly schemaVersion: 3; readonly expedition: ExpeditionDto | null; }

export interface SaveEnvelopeV2 { readonly schemaVersion: 2; readonly slot: SaveSlot; readonly savedAt: string; readonly state: SaveStateV2Dto; readonly checksum: string; }
export interface SaveEnvelopeV3 { readonly schemaVersion: 3; readonly slot: SaveSlot; readonly savedAt: string; readonly state: SaveStateDto; readonly checksum: string; }
export type SaveEnvelope = SaveEnvelopeV2 | SaveEnvelopeV3;
export interface ProfileEnvelope { readonly schemaVersion: 2; readonly savedAt: string; readonly profile: ProfileDto; readonly checksum: string; }

const chapterIds = ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'] as const;
const chapters = new Set<string>(chapterIds);
const heroClasses = new Set(['warrior', 'mage', 'warden']);
const routeProfiles = new Set(['kings-road', 'old-forest', 'ruined-pass']);
const scenePacing = new Set(['danger', 'merchant', 'recovery', 'quiet']);
const pendingStatuses = new Set(['pending', 'fulfilled']);
const companionStatuses = new Set(['unknown', 'recruited', 'left', 'dead']);
const flowScreens = new Set(['camp', 'story', 'combat', 'reward', 'merchant', 'defeat', 'ending']);
const overlays = new Set(['inventory', 'chronicle', 'bestiary', 'settings']);
const combatOutcomes = new Set(['active', 'victory', 'defeat', 'fled']);
const combatIntents = new Set(['strike', 'heavy', 'guard', 'hex', 'recover', 'flee']);
const slots = new Set([1, 2, 3]);

/** Save data is JSON only: allow ordinary own-key records (including null prototypes), never collection or class instances. */
export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null)
      && Object.getOwnPropertySymbols(value).length === 0
      && Object.getOwnPropertyNames(value).every((key) => Object.prototype.propertyIsEnumerable.call(value, key));
  } catch { return false; }
}

/** Reject values JSON would silently drop, along with cycles and custom collection/class instances. */
export function isJsonCompatible(value: unknown, ancestors = new Set<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length > 0) return false;
      const names = Object.getOwnPropertyNames(value);
      if (names.length !== value.length + 1 || !names.includes('length')) return false;
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index) || !isJsonCompatible(value[index], ancestors)) return false;
      }
      return true;
    }
    if (!isPlainRecord(value)) return false;
    return Object.keys(value).every((key) => isJsonCompatible(value[key], ancestors));
  } catch { return false; }
  finally { ancestors.delete(value); }
}

function record(value: unknown): value is Record<string, unknown> { return isPlainRecord(value); }
function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> { return record(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key)); }
function number(value: unknown, minimum = -Infinity, integer = false): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= minimum && (!integer || Number.isSafeInteger(value)); }
function nonEmptyString(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }
function stringArray(value: unknown): value is readonly string[] { return Array.isArray(value) && value.every(nonEmptyString); }
function uniqueStrings(value: unknown): value is readonly string[] { return stringArray(value) && new Set(value).size === value.length; }
function idOrNull(value: unknown): boolean { return value === null || nonEmptyString(value); }
function chapter(value: unknown): boolean { return typeof value === 'string' && chapters.has(value); }
function numericRecord(value: unknown, minimum = -Infinity, integer = false, permittedKeys?: ReadonlySet<string>): boolean {
  if (!record(value)) return false;
  return Object.keys(value).every((key) => nonEmptyString(key) && (!permittedKeys || permittedKeys.has(key)) && number(value[key], minimum, integer));
}
function exactNumericRecord(value: unknown, minimum: number, permittedKeys: ReadonlySet<string>): boolean {
  return record(value) && numericRecord(value, minimum, true, permittedKeys) && Object.keys(value).length === permittedKeys.size;
}

const LEGACY_SETTING_KEYS = ['textScale', 'highContrast', 'reducedMotion', 'sound', 'music', 'narration'] as const;
const CURRENT_SETTING_KEYS = [...LEGACY_SETTING_KEYS, 'haptics', 'reducedHaptics'] as const;
function validSettingsBase(value: Record<string, unknown>): boolean { return number(value.textScale, 0.5) && typeof value.highContrast === 'boolean' && typeof value.reducedMotion === 'boolean' && typeof value.sound === 'boolean' && typeof value.music === 'boolean' && typeof value.narration === 'boolean'; }
function validPersistedSettings(value: unknown): boolean { return (exact(value, LEGACY_SETTING_KEYS) && validSettingsBase(value)) || (exact(value, CURRENT_SETTING_KEYS) && validSettingsBase(value) && typeof value.haptics === 'boolean' && typeof value.reducedHaptics === 'boolean'); }
function validDiscoveries(value: unknown): boolean { return exact(value, ['events', 'enemies', 'codex']) && uniqueStrings(value.events) && uniqueStrings(value.enemies) && uniqueStrings(value.codex); }
export function isProfileDto(value: unknown): value is ProfileDto { return isJsonCompatible(value) && exact(value, ['settings', 'discoveries']) && validPersistedSettings(value.settings) && validDiscoveries(value.discoveries); }
export function isProfileState(value: unknown): value is ProfileState { return isProfileDto(value) && exact(value.settings, CURRENT_SETTING_KEYS); }
function validEquipment(value: unknown): boolean { return exact(value, ['weapon', 'armor', 'charms']) && idOrNull(value.weapon) && idOrNull(value.armor) && stringArray(value.charms); }
function validInventoryEntry(value: unknown): boolean { return exact(value, ['id', 'itemId', 'quantity']) && nonEmptyString(value.id) && nonEmptyString(value.itemId) && number(value.quantity, 1, true); }
function validInventory(value: unknown): boolean {
  if (!exact(value, ['pack', 'stash', 'questItems', 'equipment']) || !Array.isArray(value.pack) || !Array.isArray(value.stash) || !validEquipment(value.equipment) || !exact(value.equipment, ['weapon', 'armor', 'charms'])) return false;
  return value.pack.length <= PACK_CAPACITY
    && value.pack.every(validInventoryEntry)
    && value.stash.every(validInventoryEntry)
    && new Set([...value.pack, ...value.stash].map((entry) => entry.id)).size === value.pack.length + value.stash.length
    && uniqueStrings(value.questItems)
    && uniqueStrings(value.equipment.charms)
    && value.equipment.charms.length <= 2;
}
function validHero(value: unknown): boolean { return exact(value, ['heroClass', 'level', 'xp', 'talents']) && typeof value.heroClass === 'string' && heroClasses.has(value.heroClass) && number(value.level, 1, true) && value.level <= LEVEL_CAP && number(value.xp, 0, true) && uniqueStrings(value.talents) && value.talents.length <= Math.floor(value.level / 3) && value.talents.every((talent) => isTalentForClass(value.heroClass as HeroDto['heroClass'], talent)); }
function validPosition(value: unknown): boolean { return exact(value, ['chapterId', 'slot']) && chapter(value.chapterId) && number(value.slot, 0, true); }
function validPendingCallback(value: unknown): boolean {
  if (!exact(value, ['targetEventId', 'deadline', 'status', 'required']) || !exact(value.deadline, ['chapterId', 'slot'])) return false;
  return nonEmptyString(value.targetEventId) && chapter(value.deadline.chapterId) && number(value.deadline.slot, 1, true)
    && typeof value.status === 'string' && pendingStatuses.has(value.status) && typeof value.required === 'boolean';
}
function validDirectorMemory(value: unknown): boolean { return exact(value, ['rngState', 'seenEventIds', 'familyCooldowns', 'pendingCallbacks']) && number(value.rngState, 0, true) && stringArray(value.seenEventIds) && numericRecord(value.familyCooldowns, 0, true) && Array.isArray(value.pendingCallbacks) && value.pendingCallbacks.every(validPendingCallback); }
function validDirector(value: unknown): boolean { return exact(value, ['rngState', 'seenEventIds', 'familyCooldowns', 'pendingCallbacks', 'usedSceneIds', 'recentSceneKinds', 'recentFamilies', 'currentRunBlockedFamilies', 'tension', 'threat']) && validDirectorMemory({ rngState: value.rngState, seenEventIds: value.seenEventIds, familyCooldowns: value.familyCooldowns, pendingCallbacks: value.pendingCallbacks }) && stringArray(value.usedSceneIds) && Array.isArray(value.recentSceneKinds) && value.recentSceneKinds.every((entry) => typeof entry === 'string' && scenePacing.has(entry)) && stringArray(value.recentFamilies) && stringArray(value.currentRunBlockedFamilies) && number(value.tension, 0, true) && value.tension <= 10 && number(value.threat, 0, true) && value.threat <= 10; }
function validCompanionRecord(value: unknown): boolean { return exact(value, ['companionId', 'status', 'questStage', 'loyalty', 'injured']) && nonEmptyString(value.companionId) && typeof value.status === 'string' && companionStatuses.has(value.status) && number(value.questStage, 0, true) && value.questStage <= 3 && number(value.loyalty, -100) && value.loyalty <= 100 && typeof value.injured === 'boolean'; }
function validCompanions(value: unknown): boolean { return exact(value, ['activeCompanionId', 'records']) && idOrNull(value.activeCompanionId) && Array.isArray(value.records) && value.records.every(validCompanionRecord) && new Set(value.records.map((record) => record.companionId)).size === value.records.length; }
function validCampaignCheckpoint(value: unknown): boolean { return exact(value, ['seed', 'chapterId', 'heroName', 'hero', 'inventory', 'bankedGold', 'flags', 'evidence', 'factions', 'encounterFamilyVictories', 'companions', 'directorMemory']) && number(value.seed, 0, true) && chapter(value.chapterId) && nonEmptyString(value.heroName) && value.heroName.length <= 48 && validHero(value.hero) && validInventory(value.inventory) && number(value.bankedGold, 0, true) && stringArray(value.flags) && stringArray(value.evidence) && numericRecord(value.factions) && numericRecord(value.encounterFamilyVictories, 0, true) && validCompanions(value.companions) && validDirectorMemory(value.directorMemory); }
function validCampaign(value: unknown): boolean { return exact(value, ['seed', 'chapterId', 'heroName', 'hero', 'inventory', 'bankedGold', 'flags', 'evidence', 'factions', 'encounterFamilyVictories', 'companions', 'directorMemory', 'attemptCounters', 'routeSeedNonce', 'transitionCounter']) && validCampaignCheckpoint({ seed: value.seed, chapterId: value.chapterId, heroName: value.heroName, hero: value.hero, inventory: value.inventory, bankedGold: value.bankedGold, flags: value.flags, evidence: value.evidence, factions: value.factions, encounterFamilyVictories: value.encounterFamilyVictories, companions: value.companions, directorMemory: value.directorMemory }) && exactNumericRecord(value.attemptCounters, 0, chapters) && number(value.routeSeedNonce, 0, true) && number(value.transitionCounter, 0, true); }
function validCombatStatus(value: unknown): boolean { return exact(value, ['id', 'duration', 'potency']) && nonEmptyString(value.id) && number(value.duration, 0, true) && number(value.potency); }
function validPlayerModifiers(value: unknown): boolean { return exact(value, ['attackBonus', 'armor', 'ward', 'maxHealth', 'maxFocus', 'strength', 'cunning', 'will']) && Object.values(value).every((entry) => number(entry)); }
function validEnemyModifiers(value: unknown): boolean { return exact(value, ['maxHealth', 'attack', 'armor', 'ward', 'evasion', 'blockChance', 'parryChance']) && Object.values(value).every((entry) => number(entry)); }
function validEnemySource(value: unknown): boolean { return (exact(value, ['kind', 'enemyId']) && value.kind === 'catalog' && nonEmptyString(value.enemyId)) || (exact(value, ['kind', 'originEnemyId']) && value.kind === 'summon-smoke' && nonEmptyString(value.originEnemyId)); }
function validEnemyCombat(value: unknown): value is EnemyCombatDto { return exact(value, ['instanceId', 'source', 'isBoss', 'health', 'guarding', 'statuses', 'phase', 'roleUses', 'modifiers']) && nonEmptyString(value.instanceId) && validEnemySource(value.source) && typeof value.isBoss === 'boolean' && number(value.health, 0) && typeof value.guarding === 'boolean' && Array.isArray(value.statuses) && value.statuses.every(validCombatStatus) && number(value.phase, 1, true) && (value.roleUses === null || number(value.roleUses, 0, true)) && validEnemyModifiers(value.modifiers); }
function validCombatIntent(value: unknown): value is CombatIntentDto { return exact(value, ['enemyId', 'intent']) && nonEmptyString(value.enemyId) && typeof value.intent === 'string' && combatIntents.has(value.intent); }
function validCombat(value: unknown): boolean {
  if (!exact(value, ['turn', 'rngState', 'player', 'enemies', 'primaryEnemyId', 'enemyIntent', 'enemyIntents', 'outcome', 'missedAttacks', 'companionId', 'companionCooldown', 'companionDamageDealt'])) return false;
  const { player, enemies, enemyIntents, primaryEnemyId } = value;
  if (!number(value.turn, 1, true) || !number(value.rngState, 0, true) || !exact(player, ['health', 'focus', 'guarding', 'statuses', 'modifiers']) || !number(player.health, 0) || !number(player.focus, 0) || typeof player.guarding !== 'boolean' || !Array.isArray(player.statuses) || !player.statuses.every(validCombatStatus) || !validPlayerModifiers(player.modifiers)) return false;
  if (!Array.isArray(enemies) || enemies.length === 0 || !enemies.every(validEnemyCombat) || !nonEmptyString(primaryEnemyId)) return false;
  const enemyIds = new Set(enemies.map((enemy) => enemy.instanceId));
  const intentEnemyIds = Array.isArray(enemyIntents) ? new Set(enemyIntents.map((intent) => record(intent) ? intent.enemyId : undefined)) : new Set<unknown>();
  if (enemyIds.size !== enemies.length || !enemyIds.has(primaryEnemyId) || typeof value.enemyIntent !== 'string' || !combatIntents.has(value.enemyIntent) || !Array.isArray(enemyIntents) || !enemyIntents.every(validCombatIntent) || !enemyIntents.every((intent) => enemyIds.has(intent.enemyId)) || intentEnemyIds.size !== enemyIntents.length) return false;
  return typeof value.outcome === 'string' && combatOutcomes.has(value.outcome) && number(value.missedAttacks, 0, true) && idOrNull(value.companionId) && number(value.companionCooldown, 0, true) && number(value.companionDamageDealt, 0);
}
function validMerchantVisit(value: unknown): boolean {
  return exact(value, ['merchantId', 'restockKey', 'generatedAtLevel', 'stock'])
    && nonEmptyString(value.merchantId)
    && nonEmptyString(value.restockKey)
    && number(value.generatedAtLevel, 1, true)
    && value.generatedAtLevel <= LEVEL_CAP
    && Array.isArray(value.stock)
    && value.stock.length <= 6
    && value.stock.every((entry) => exact(entry, ['id', 'itemId']) && nonEmptyString(entry.id) && nonEmptyString(entry.itemId))
    && new Set(value.stock.map((entry) => entry.id)).size === value.stock.length;
}
export function isLegacySceneResolutionDto(value: unknown): value is LegacySceneResolutionDto {
  const compact = exact(value, ['eventId', 'choiceId']) && nonEmptyString(value.eventId) && idOrNull(value.choiceId);
  const rich = exact(value, ['eventId', 'choiceId', 'resultKind', 'chance', 'roll', 'outcome', 'effectSummary', 'nextSceneId', 'continueLabel'])
    && nonEmptyString(value.eventId)
    && idOrNull(value.choiceId)
    && typeof value.resultKind === 'string'
    && ['direct', 'critical-success', 'success', 'failure', 'critical-failure'].includes(value.resultKind)
    && (value.chance === null || number(value.chance, 0, true))
    && (value.roll === null || number(value.roll, 1, true))
    && nonEmptyString(value.outcome)
    && stringArray(value.effectSummary)
    && idOrNull(value.nextSceneId)
    && (value.continueLabel === null || nonEmptyString(value.continueLabel));
  return compact || rich;
}
export function isSceneResolutionDto(value: unknown): value is SceneResolutionDto {
  if (!exact(value, ['eventId', 'choiceId', 'resultKind', 'chance', 'roll', 'outcome', 'effectSummary', 'nextSceneId', 'continueLabel'])
    || !nonEmptyString(value.eventId) || !idOrNull(value.choiceId) || !nonEmptyString(value.outcome)
    || !stringArray(value.effectSummary) || !idOrNull(value.nextSceneId) || (value.continueLabel !== null && !nonEmptyString(value.continueLabel))) return false;
  if (value.resultKind === 'direct') return value.chance === null && value.roll === null;
  return nonEmptyString(value.choiceId)
    && typeof value.resultKind === 'string'
    && ['critical-success', 'success', 'failure', 'critical-failure'].includes(value.resultKind)
    && number(value.chance, 0, true) && value.chance <= 100
    && number(value.roll, 1, true) && value.roll <= 100;
}
const expeditionBaseKeys = ['routeProfile', 'routeSeed', 'director', 'position', 'currentSceneId', 'sceneResolution', 'authoredSceneQueue', 'heroVitals', 'currentCombat', 'pendingReward', 'unbankedGold', 'unbankedLoot', 'temporaryBoons', 'merchantVisits'] as const;
function validExpeditionBase(value: Record<string, unknown>, sceneResolution: boolean, allowMissingQueue = false): boolean {
  const authoredSceneQueue = (allowMissingQueue && value.authoredSceneQueue === undefined) || (Array.isArray(value.authoredSceneQueue) && value.authoredSceneQueue.every((entry) => (
    (exact(entry, ['sceneId', 'sourceSceneId', 'requirementMode'])
      || (exact(entry, ['sceneId', 'sourceSceneId', 'requirementMode', 'reason']) && nonEmptyString(entry.reason)))
    && nonEmptyString(entry.sceneId)
    && nonEmptyString(entry.sourceSceneId)
    && (entry.requirementMode === 'required' || entry.requirementMode === 'optional')
  )));
  const heroVitals = exact(value.heroVitals, ['health', 'resource']) && number(value.heroVitals.health, 0) && number(value.heroVitals.resource, 0);
  const rewardKeys = ['rewardId', 'encounterId', 'itemChoices', 'baseGold', 'grantedXp', 'adEligible'] as const;
  const currentRewardKeys = ['rewardId', 'rewardOfferId', 'encounterId', 'itemChoices', 'baseGold', 'grantedXp', 'adEligible', 'rewardedGoldSettlement'] as const;
  const pendingReward = value.pendingReward === null || (((exact(value.pendingReward, rewardKeys)) || (exact(value.pendingReward, currentRewardKeys) && nonEmptyString(value.pendingReward.rewardOfferId) && typeof value.pendingReward.rewardedGoldSettlement === 'string' && ['available', 'claimed', 'ineligible'].includes(value.pendingReward.rewardedGoldSettlement))) && nonEmptyString(value.pendingReward.rewardId) && nonEmptyString(value.pendingReward.encounterId) && uniqueStrings(value.pendingReward.itemChoices) && number(value.pendingReward.baseGold, 0, true) && number(value.pendingReward.grantedXp, 0, true) && typeof value.pendingReward.adEligible === 'boolean');
  return typeof value.routeProfile === 'string' && routeProfiles.has(value.routeProfile) && number(value.routeSeed, 0, true) && validDirector(value.director) && validPosition(value.position) && idOrNull(value.currentSceneId) && sceneResolution && authoredSceneQueue && heroVitals && (value.currentCombat === null || (exact(value.currentCombat, ['encounterId', 'combat']) && nonEmptyString(value.currentCombat.encounterId) && (value.currentCombat.combat === null || validCombat(value.currentCombat.combat)))) && pendingReward && number(value.unbankedGold, 0, true) && stringArray(value.unbankedLoot) && stringArray(value.temporaryBoons) && Array.isArray(value.merchantVisits) && value.merchantVisits.every(validMerchantVisit);
}
function validExpeditionV2(value: unknown): value is ExpeditionV2Dto {
  const legacyKeys = expeditionBaseKeys.filter((key) => key !== 'authoredSceneQueue');
  return (exact(value, expeditionBaseKeys) || exact(value, legacyKeys))
    && validExpeditionBase(value, value.sceneResolution === null || isLegacySceneResolutionDto(value.sceneResolution), true);
}
function validCheckedAttempt(value: unknown): value is CheckedAttemptDto {
  return exact(value, ['eventId', 'choiceId', 'visitOrdinal', 'chance', 'roll', 'resultKind'])
    && nonEmptyString(value.eventId) && nonEmptyString(value.choiceId) && number(value.visitOrdinal, 1, true)
    && number(value.chance, 0, true) && value.chance <= 100 && number(value.roll, 1, true) && value.roll <= 100
    && typeof value.resultKind === 'string' && ['critical-success', 'success', 'failure', 'critical-failure'].includes(value.resultKind);
}
function validExpedition(value: unknown): value is ExpeditionDto {
  const keys = [...expeditionBaseKeys, 'dialogueBeatIndex', 'sceneVisitCounts', 'checkedAttempts'];
  if (!exact(value, keys) || !validExpeditionBase(value, value.sceneResolution === null || isSceneResolutionDto(value.sceneResolution))) return false;
  if (!number(value.dialogueBeatIndex, 0, true) || !numericRecord(value.sceneVisitCounts, 1, true) || !Array.isArray(value.checkedAttempts) || !value.checkedAttempts.every(validCheckedAttempt)) return false;
  const attempts = value.checkedAttempts as readonly CheckedAttemptDto[];
  const resolution = value.sceneResolution === null ? null : value.sceneResolution as SceneResolutionDto;
  const identities = attempts.map((attempt) => `${attempt.eventId}\u0000${attempt.visitOrdinal}`);
  if (new Set(identities).size !== identities.length || attempts.some((attempt) => (value.sceneVisitCounts as Record<string, number>)[attempt.eventId] < attempt.visitOrdinal)) return false;
  if (value.currentSceneId !== null && (value.sceneVisitCounts as Record<string, number>)[value.currentSceneId as string] === undefined) return false;
  if (resolution !== null && resolution.resultKind !== 'direct') {
    const ordinal = (value.sceneVisitCounts as Record<string, number>)[resolution.eventId];
    if (!attempts.some((attempt) => attempt.eventId === resolution.eventId && attempt.choiceId === resolution.choiceId && attempt.visitOrdinal === ordinal && attempt.chance === resolution.chance && attempt.roll === resolution.roll && attempt.resultKind === resolution.resultKind)) return false;
  }
  return true;
}
function validCheckpoints(value: unknown): boolean { return exact(value, ['chapter', 'camp']) && exact(value.chapter, ['campaign', 'enteredAt']) && validCampaignCheckpoint(value.chapter.campaign) && typeof value.chapter.enteredAt === 'string' && (value.camp === null || (exact(value.camp, ['campaign', 'campSceneId', 'savedAt']) && validCampaignCheckpoint(value.camp.campaign) && idOrNull(value.camp.campSceneId) && typeof value.camp.savedAt === 'string')); }
function validFlow(value: unknown): boolean { return exact(value, ['screen', 'overlay', 'merchant']) && typeof value.screen === 'string' && flowScreens.has(value.screen) && (value.overlay === null || (typeof value.overlay === 'string' && overlays.has(value.overlay))) && (value.merchant === null || (exact(value.merchant, ['merchantId', 'restockKey', 'returnScreen']) && nonEmptyString(value.merchant.merchantId) && nonEmptyString(value.merchant.restockKey) && (value.merchant.returnScreen === 'camp' || value.merchant.returnScreen === 'story'))); }

function validAdPacing(value: unknown): boolean { return exact(value, ['lastInterstitialAt', 'expeditionBreaksSinceInterstitial', 'rewardedShownAtCurrentBreak', 'claimedRewardOfferIds', 'rewardedClaimsThisExpedition']) && (value.lastInterstitialAt === null || (typeof value.lastInterstitialAt === 'string' && Number.isFinite(Date.parse(value.lastInterstitialAt)))) && number(value.expeditionBreaksSinceInterstitial, 0, true) && typeof value.rewardedShownAtCurrentBreak === 'boolean' && uniqueStrings(value.claimedRewardOfferIds) && number(value.rewardedClaimsThisExpedition, 0, true) && value.rewardedClaimsThisExpedition <= 3; }
function validSaveRoot(value: unknown): value is Record<string, unknown> { return isJsonCompatible(value) && (exact(value, ['schemaVersion', 'profile', 'campaign', 'expedition', 'checkpoints', 'flow', 'updatedAt']) || (exact(value, ['schemaVersion', 'profile', 'campaign', 'expedition', 'adPacing', 'checkpoints', 'flow', 'updatedAt']) && validAdPacing(value.adPacing))) && isProfileDto(value.profile) && validCampaign(value.campaign) && validCheckpoints(value.checkpoints) && validFlow(value.flow) && typeof value.updatedAt === 'string'; }
export function isSaveStateV2Dto(value: unknown): value is SaveStateV2Dto { return validSaveRoot(value) && value.schemaVersion === 2 && (value.expedition === null || validExpeditionV2(value.expedition)); }
export function isSaveStateDto(value: unknown): value is SaveStateDto { return validSaveRoot(value) && value.schemaVersion === 3 && (value.expedition === null || validExpedition(value.expedition)); }
export function createSaveEnvelope(slot: SaveSlot, state: SaveStateDto, savedAt: string): SaveEnvelopeV3 { const unsigned = { schemaVersion: 3 as const, slot, savedAt, state }; return { ...unsigned, checksum: checksumFor(unsigned) }; }
export function createProfileEnvelope(profile: ProfileState, savedAt: string): ProfileEnvelope { const unsigned = { schemaVersion: 2 as const, savedAt, profile }; return { ...unsigned, checksum: checksumFor(unsigned) }; }
export function isSaveEnvelope(value: unknown): value is SaveEnvelope { if (!exact(value, ['schemaVersion', 'slot', 'savedAt', 'state', 'checksum']) || (value.schemaVersion !== 2 && value.schemaVersion !== 3) || !slots.has(value.slot as number) || typeof value.savedAt !== 'string' || typeof value.checksum !== 'string' || (value.schemaVersion === 2 ? !isSaveStateV2Dto(value.state) : !isSaveStateDto(value.state))) return false; const { checksum: _checksum, ...unsigned } = value; return checksumFor(unsigned) === value.checksum; }
export function isProfileEnvelope(value: unknown): value is ProfileEnvelope { if (!exact(value, ['schemaVersion', 'savedAt', 'profile', 'checksum']) || value.schemaVersion !== 2 || typeof value.savedAt !== 'string' || typeof value.checksum !== 'string' || !isProfileDto(value.profile)) return false; const { checksum: _checksum, ...unsigned } = value; return checksumFor(unsigned) === value.checksum; }
