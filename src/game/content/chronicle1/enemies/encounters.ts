import type { ChapterId, EncounterId, EnemyId } from '../../../domain/ids';
import { deepFreeze } from '../builders';
import { CHRONICLE1_BOSSES } from './bosses';
import { CHRONICLE1_RANKED_ENEMIES } from './ranked';
import type {
  ChapterThreatBudget,
  Chronicle1EncounterDefinition,
  Chronicle1EnemyDefinition,
  EncounterValidationIssue,
  EnemyCompatibilityTag,
} from './types';

export const CHAPTER_THREAT_BUDGETS = deepFreeze({
  ch01: { levelBand: { min: 1, max: 2 }, region: 'gloamwood', maxThreat: 10, maxOpeningDamage: 30 },
  ch02: { levelBand: { min: 2, max: 4 }, region: 'gloamwood', maxThreat: 12, maxOpeningDamage: 36 },
  ch03: { levelBand: { min: 4, max: 6 }, region: 'drowned-road', maxThreat: 16, maxOpeningDamage: 44 },
  ch04: { levelBand: { min: 6, max: 8 }, region: 'drowned-road', maxThreat: 19, maxOpeningDamage: 52 },
  ch05: { levelBand: { min: 8, max: 10 }, region: 'embervault', maxThreat: 23, maxOpeningDamage: 60 },
  ch06: { levelBand: { min: 10, max: 12 }, region: 'gloamwood', maxThreat: 27, maxOpeningDamage: 68 },
  ch07: { levelBand: { min: 12, max: 14 }, region: 'crownless-keep', maxThreat: 31, maxOpeningDamage: 76 },
  ch08: { levelBand: { min: 14, max: 15 }, region: 'crownless-keep', maxThreat: 42, maxOpeningDamage: 86 },
} as const satisfies Readonly<Record<ChapterId, ChapterThreatBudget>>);

interface EncounterSpec {
  readonly id: string;
  readonly enemyIds: readonly string[];
  readonly threatBudget: number;
  readonly compatibilityTags: readonly EnemyCompatibilityTag[];
  readonly counterplay: string;
  readonly kind?: 'regular' | 'lieutenant' | 'boss';
  readonly bossEnemyId?: string;
  readonly reward?: { readonly xp: number; readonly gold: number; readonly itemChoices: readonly string[] };
}

const ENCOUNTER_SPECS: readonly EncounterSpec[] = [
  { id: 'enc-ch01-ditch-road-cutters', enemyIds: ['goblin-cutpurse-01', 'goblin-cutpurse-01', 'black-banner-01'], threatBudget: 9, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Hold the wagon gap to contain both knives, or cross the open ditch to remove the heavier reaver first.' },
  { id: 'enc-ch01-tollhouse-lookouts', enemyIds: ['iron-deserter-01', 'goblin-cutpurse-01'], threatBudget: 6, compatibilityTags: ['frontline', 'mobile'], counterplay: 'Break the lone shield before chasing the rooftop skirmisher, or guard until the skirmisher descends.' },
  { id: 'enc-ch01-orchard-volley', enemyIds: ['goblin-torchling-01', 'black-banner-01'], threatBudget: 6, compatibilityTags: ['ranged', 'mobile'], counterplay: 'Use wagon cover against the cinder shot, then close on the reaver before the pair can trade positions.' },
  { id: 'enc-ch01-verge-signalers', enemyIds: ['black-banner-01', 'goblin-torchling-01'], threatBudget: 6, compatibilityTags: ['ranged', 'mobile', 'false-flag', 'fire'], counterplay: 'Use the hedge against the cinder throw, then prevent the reaver from reaching the signal pot.', reward: { xp: 34, gold: 16, itemChoices: ['consumable-smoke-bomb'] } },
  { id: 'enc-ch01-tollhouse-cellar', enemyIds: ['iron-deserter-01', 'goblin-cutpurse-01'], threatBudget: 6, compatibilityTags: ['frontline', 'mobile', 'false-flag'], counterplay: 'Hold the stair so the cutpurse cannot reach Jory, then break the deserter’s guard in the low tunnel.', reward: { xp: 34, gold: 16, itemChoices: ['consumable-lamp-oil'] } },
  { id: 'enc-ch01-smoke-on-the-bridge', enemyIds: ['boss-rattlehook-bridge-chief', 'goblin-cutpurse-01'], threatBudget: 10, compatibilityTags: ['elite', 'mobile'], counterplay: 'Read Rattlehook’s rail taps, protect the escape rope, and remove his lone knife fighter before the second phase.', kind: 'boss', bossEnemyId: 'boss-rattlehook-bridge-chief' },
  { id: 'enc-ch01-reedbank-pursuers', enemyIds: ['black-banner-01', 'black-banner-01'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Force the riders into the narrow road and focus one pursuer; spreading damage lets both keep circling.' },
  { id: 'enc-ch01-recover-the-false-banner', enemyIds: ['black-banner-01', 'goblin-cutpurse-02'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Guard the evidence carrier through the hooked-pole swing, then mark the cutpurse before it changes targets.' },

  { id: 'enc-ch02-north-wall-ladders', enemyIds: ['boss-captain-oren-dusk', 'goblin-torchling-02'], threatBudget: 12, compatibilityTags: ['leader', 'ranged'], counterplay: 'Interrupt Oren’s baton count or defeat the supporting archer before challenging his organized wall advance.', kind: 'boss', bossEnemyId: 'boss-captain-oren-dusk' },
  { id: 'enc-ch02-granary-fire-team', enemyIds: ['goblin-torchling-02', 'ash-magus-01'], threatBudget: 7, compatibilityTags: ['fire', 'ranged', 'support'], counterplay: 'Guard the telegraphed cinder flask, then pressure the magus before its focus drain delays the bucket line.' },
  { id: 'enc-ch02-south-gate-sapper', enemyIds: ['boss-black-banner-gatebreaker', 'goblin-cutpurse-02'], threatBudget: 12, compatibilityTags: ['frontline', 'mobile', 'siege'], counterplay: 'Break the powder-cart guard or wheel, then stop the cutpurse before it reaches the exposed gate crew.', kind: 'boss', bossEnemyId: 'boss-black-banner-gatebreaker' },
  { id: 'enc-ch02-armory-infiltrators', enemyIds: ['black-banner-02', 'black-banner-02'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Block the maintenance grate and focus one infiltrator at a time instead of defending every chest equally.' },
  { id: 'enc-ch02-council-passage-assassins', enemyIds: ['black-banner-03', 'goblin-cutpurse-03'], threatBudget: 8, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Mark the assassin nearest Tomas, then use the stone pillar to deny the fire-flask carrier a clean lane.' },
  { id: 'enc-ch02-lime-kiln-sentries', enemyIds: ['iron-deserter-02', 'goblin-torchling-03'], threatBudget: 7, compatibilityTags: ['frontline', 'ranged'], counterplay: 'Drive the shield away from the rear tunnel before crossing the torchling’s clearly telegraphed firing lane.' },

  { id: 'enc-ch03-flooded-orchard', enemyIds: ['boss-osra-mire-witch', 'marsh-crawler-03'], threatBudget: 15, compatibilityTags: ['hard-control', 'frontline', 'water'], counterplay: 'Move out of Osra’s named current and break the crawler’s plate only when the witch begins retying her knot.', kind: 'boss', bossEnemyId: 'boss-osra-mire-witch' },
  { id: 'enc-ch03-black-skiffs', enemyIds: ['boss-harrow-ferry-reaver', 'goblin-cutpurse-04'], threatBudget: 15, compatibilityTags: ['elite', 'mobile', 'water'], counterplay: 'Cut Harrow’s boarding rope, mark his chosen gunwale, and remove the cutpurse before it reaches the evidence chest.', kind: 'boss', bossEnemyId: 'boss-harrow-ferry-reaver' },
  { id: 'enc-ch03-marsh-hounds', enemyIds: ['gloam-warg-04', 'gloam-warg-04'], threatBudget: 8, compatibilityTags: ['beast', 'mobile'], counterplay: 'Hold the gangplank so only one hound can lunge at a time, then focus the injured animal before its partner circles.' },
  { id: 'enc-ch03-borrowed-faces', enemyIds: ['iron-deserter-04', 'black-banner-04'], threatBudget: 8, compatibilityTags: ['frontline', 'mobile', 'false-flag'], counterplay: 'Break the false sergeant’s shield line before chasing the mobile reaver toward the signal flare.' },
  { id: 'enc-ch03-sluice-breakers', enemyIds: ['iron-deserter-05', 'goblin-torchling-04'], threatBudget: 9, compatibilityTags: ['frontline', 'ranged', 'siege'], counterplay: 'Use the winch house as cover from cinder fire, then guard-break the deserter before pulling the final wedge.' },
  { id: 'enc-ch03-two-banner-rearguard', enemyIds: ['black-banner-05', 'orc-freeblade-04'], threatBudget: 9, compatibilityTags: ['mobile', 'specialist', 'false-flag'], counterplay: 'Protect the civilian fork first, then punish the freeblade after its visible oath-strike recovery.' },

  { id: 'enc-ch04-parley-rope', enemyIds: ['boss-kargan-war-chief', 'iron-deserter-05'], threatBudget: 18, compatibilityTags: ['leader', 'frontline'], counterplay: 'Answer Kargan’s named challenge while a companion or guard break removes the deserter from the witness lane.', kind: 'boss', bossEnemyId: 'boss-kargan-war-chief' },
  { id: 'enc-ch04-millrace-knives', enemyIds: ['black-banner-05', 'rain-wraith-05'], threatBudget: 10, compatibilityTags: ['mobile', 'undead', 'water'], counterplay: 'Mark the wraith’s outline and hold around the witness until the reaver commits across the narrow bridge.' },
  { id: 'enc-ch04-warehouse-arsonists', enemyIds: ['black-banner-05', 'goblin-torchling-05'], threatBudget: 10, compatibilityTags: ['mobile', 'ranged', 'fire'], counterplay: 'Open a smoke-free lane, guard the first cinder throw, and prevent the reaver from reaching the freight records.' },
  { id: 'enc-ch04-south-tower-provocateurs', enemyIds: ['boss-redwater-provocateur', 'goblin-torchling-05'], threatBudget: 18, compatibilityTags: ['hard-control', 'ranged', 'false-flag'], counterplay: 'Interrupt the visible horn or flag signal, then cross under the roof line while the archer resets.', kind: 'boss', bossEnemyId: 'boss-redwater-provocateur' },
  { id: 'enc-ch04-panicked-war-oxen', enemyIds: ['marsh-crawler-06', 'bridge-troll-05'], threatBudget: 10, compatibilityTags: ['beast', 'frontline', 'specialist'], counterplay: 'Keep the lane narrow, break the crawler plate, and interrupt the troll’s announced recovery before the next charge.' },
  { id: 'enc-ch04-north-road-rearguard', enemyIds: ['iron-deserter-06', 'black-banner-06', 'goblin-torchling-05'], threatBudget: 15, compatibilityTags: ['frontline', 'mobile', 'ranged'], counterplay: 'Use the quarry bend to deny the archer, then break the shield before the reaver can ignite the evidence cart.' },

  { id: 'enc-ch05-chained-gate-veterans', enemyIds: ['iron-deserter-06', 'black-banner-06', 'vault-gargoyle-06'], threatBudget: 15, compatibilityTags: ['frontline', 'mobile', 'ranged'], counterplay: 'Shelter behind the rail stanchions, remove the fixed gargoyle, and then break the veteran shield line.' },
  { id: 'enc-ch05-missing-shift-jailers', enemyIds: ['black-banner-06', 'gloam-warg-06'], threatBudget: 10, compatibilityTags: ['mobile', 'beast'], counterplay: 'Draw the hound into the empty ore bay, mark it, and return before the reaver reaches the worker line.' },
  { id: 'enc-ch05-black-banner-forgemaster', enemyIds: ['boss-embervault-forgemaster', 'cinder-troll-06'], threatBudget: 20, compatibilityTags: ['elite', 'frontline', 'fire'], counterplay: 'Disable the quenching channel, interrupt the troll’s recovery, and cross only after Hadrik’s hammer falls.', kind: 'boss', bossEnemyId: 'boss-embervault-forgemaster' },
  { id: 'enc-ch05-ledger-vault-cutters', enemyIds: ['black-banner-07', 'ash-magus-06'], threatBudget: 12, compatibilityTags: ['mobile', 'support', 'fire'], counterplay: 'Break the acid carrier’s lane first, then pressure the magus after its named focus-draining hex.' },
  { id: 'enc-ch05-twin-armory-convoy', enemyIds: ['boss-royal-armory-golem', 'black-banner-07'], threatBudget: 21, compatibilityTags: ['construct', 'frontline', 'mobile'], counterplay: 'Expose the golem’s numbered plate at the shared brake, then mark the reaver before it changes carts.', kind: 'boss', bossEnemyId: 'boss-royal-armory-golem' },
  { id: 'enc-ch05-cinder-shaft-demolition', enemyIds: ['ash-magus-07', 'iron-deserter-07', 'goblin-torchling-07'], threatBudget: 19, compatibilityTags: ['support', 'frontline', 'ranged', 'fire'], counterplay: 'Use the blast shield against cinder fire, break the deserter’s guard, and interrupt the magus at the ladder bolts.' },

  { id: 'enc-ch06-evidence-road-riders', enemyIds: ['black-banner-07', 'iron-deserter-07', 'vault-gargoyle-07'], threatBudget: 18, compatibilityTags: ['mobile', 'frontline', 'ranged'], counterplay: 'Form around the witnesses until the fixed shooter fires, then break the shield and isolate the circling reaver.' },
  { id: 'enc-ch06-outer-ditch-screen', enemyIds: ['barrow-soldier-07', 'vault-gargoyle-07'], threatBudget: 13, compatibilityTags: ['leader', 'ranged', 'undead'], counterplay: 'Stop the soldier’s drill call before crossing the ditch, then stagger the gargoyle off its prepared firing perch.' },
  { id: 'enc-ch06-chapel-hostage-jailers', enemyIds: ['bell-apostle-07', 'iron-deserter-07'], threatBudget: 13, compatibilityTags: ['hard-control', 'frontline'], counterplay: 'Guard the clearly raised bell toll, seize the smoke lever, and only then break the veteran stair line.' },
  { id: 'enc-ch06-covered-siege-ram', enemyIds: ['boss-siege-engineer-malrec', 'ash-magus-07'], threatBudget: 24, compatibilityTags: ['leader', 'support', 'siege', 'fire'], counterplay: 'Interrupt Malrec’s three-count and pressure the magus while Greywatch crews pull the exposed rear rope.', kind: 'boss', bossEnemyId: 'boss-siege-engineer-malrec' },
  { id: 'enc-ch06-west-wall-breach', enemyIds: ['black-banner-08', 'iron-deserter-08', 'goblin-torchling-08'], threatBudget: 18, compatibilityTags: ['mobile', 'frontline', 'ranged'], counterplay: 'Use fallen stone against the cinder shot, stop the mobile reaver, and leave the plated defender for last.' },
  { id: 'enc-ch06-last-rear-guard', enemyIds: ['boss-black-banner-commander', 'black-banner-08'], threatBudget: 23, compatibilityTags: ['leader', 'mobile', 'false-flag'], counterplay: 'Protect Jory from the marked flank, then break Venn’s command stance before pursuing the remaining assassin.', kind: 'boss', bossEnemyId: 'boss-black-banner-commander' },

  { id: 'enc-ch07-kingroad-wagon-cutters', enemyIds: ['black-banner-08', 'iron-deserter-08', 'vault-gargoyle-08'], threatBudget: 18, compatibilityTags: ['mobile', 'frontline', 'ranged'], counterplay: 'Keep the archive horses behind the shield line, stagger the shooter, and punish the reaver after its hooked pass.' },
  { id: 'enc-ch07-duplicate-patrol', enemyIds: ['barrow-soldier-08', 'black-banner-08'], threatBudget: 13, compatibilityTags: ['leader', 'mobile', 'false-flag'], counterplay: 'Break the counterfeit command before freeing the remount line, then mark the reaver carrying the pay roll.' },
  { id: 'enc-ch07-quarry-crossbows', enemyIds: ['vault-gargoyle-09', 'vault-gargoyle-09', 'iron-deserter-08'], threatBudget: 20, compatibilityTags: ['ranged', 'frontline', 'construct'], counterplay: 'Use the quarry crane as cover, remove one firing perch, and break the shield only after the crossfire weakens.' },
  { id: 'enc-ch07-postern-sappers', enemyIds: ['ash-magus-08', 'iron-deserter-08'], threatBudget: 13, compatibilityTags: ['support', 'frontline', 'siege'], counterplay: 'Stop the visible fuse first, guard the magus’s heat hex, and then force the shield crew away from the hatch.' },
  { id: 'enc-ch07-counterweight-house', enemyIds: ['boss-crownless-gate-warden', 'black-banner-08'], threatBudget: 25, compatibilityTags: ['frontline', 'mobile', 'siege'], counterplay: 'Bait the Warden away from the brake key, mark the reaver, and interrupt the chain pull in the second phase.', kind: 'boss', bossEnemyId: 'boss-crownless-gate-warden' },
  { id: 'enc-ch07-voss-last-champion', enemyIds: ['boss-voss-champion-elian-roake', 'iron-deserter-09'], threatBudget: 26, compatibilityTags: ['leader', 'frontline'], counterplay: 'Open one shield flank, answer Roake’s named stair strike, and use the custody evidence when his line hesitates.', kind: 'boss', bossEnemyId: 'boss-voss-champion-elian-roake' },

  { id: 'enc-ch08-guest-guard-rotation', enemyIds: ['black-banner-09', 'iron-deserter-09', 'vault-gargoyle-09'], threatBudget: 21, compatibilityTags: ['mobile', 'frontline', 'ranged'], counterplay: 'Hold the service stair, use its corner against the shooter, and seize the master keys after the shield breaks.' },
  { id: 'enc-ch08-seal-case-wardens', enemyIds: ['abbey-golem-09', 'barrow-soldier-09'], threatBudget: 15, compatibilityTags: ['construct', 'undead', 'frontline', 'leader'], counterplay: 'Show the custody register during the soldier’s command pause, then break the golem plate beside the lift.' },
  { id: 'enc-ch08-archive-furnace-detail', enemyIds: ['ash-magus-09', 'black-banner-09'], threatBudget: 15, compatibilityTags: ['support', 'mobile', 'fire'], counterplay: 'Break the oil lane, guard the furnace hex, and capture the magus after the reaver commits to the fuse.' },
  { id: 'enc-ch08-coronation-engine', enemyIds: ['boss-marshal-severin-voss', 'boss-coronation-engine'], threatBudget: 42, compatibilityTags: ['leader', 'specialist', 'siege', 'unique'], counterplay: 'Contest Voss’s announced lane, take the signal rail, and arrest one named mechanism at a time instead of trading blindly.', kind: 'boss', bossEnemyId: 'boss-coronation-engine' },
  { id: 'enc-ch08-upper-courtyard-loyalists', enemyIds: ['black-banner-10', 'iron-deserter-10', 'bell-apostle-09'], threatBudget: 22, compatibilityTags: ['mobile', 'frontline', 'hard-control'], counterplay: 'Guard the bell telegraph while opening the infirmary lane, then break the shield before chasing the reaver.' },
  { id: 'enc-ch08-record-wing-holdouts', enemyIds: ['black-banner-10', 'ash-magus-10'], threatBudget: 15, compatibilityTags: ['mobile', 'support', 'fire'], counterplay: 'Seal the ventilation grate, pressure the magus after its hex, and mark the reaver beside the cipher chest.' },
];

function chapterFromEncounterId(id: string): ChapterId {
  const chapterId = id.slice(4, 8) as ChapterId;
  if (!(chapterId in CHAPTER_THREAT_BUDGETS)) throw new Error(`Encounter ${id} has no Chronicle I chapter budget.`);
  return chapterId;
}

function buildEncounter(spec: EncounterSpec, sequence: number): Chronicle1EncounterDefinition {
  const chapterId = chapterFromEncounterId(spec.id);
  const chapter = CHAPTER_THREAT_BUDGETS[chapterId];
  const kind = spec.kind ?? 'regular';
  return {
    id: spec.id as EncounterId,
    chapterId,
    region: chapter.region,
    levelBand: chapter.levelBand,
    family: spec.id.replace(/^enc-ch\d{2}-/, ''),
    kind,
    enemyIds: spec.enemyIds as readonly EnemyId[],
    bossEnemyId: spec.bossEnemyId as EnemyId | undefined,
    threatBudget: spec.threatBudget,
    openingDamageCap: chapter.maxOpeningDamage,
    compatibilityTags: spec.compatibilityTags,
    counterplay: spec.counterplay,
    reward: spec.reward ? {
      xp: spec.reward.xp,
      gold: spec.reward.gold,
      itemChoices: spec.reward.itemChoices as readonly ItemId[],
    } : {
      xp: 18 + Number(chapterId.slice(2)) * 16 + (kind === 'boss' ? 24 : kind === 'lieutenant' ? 12 : 0),
      gold: 8 + Number(chapterId.slice(2)) * 7 + (kind === 'boss' ? 10 : 0) + (sequence % 3),
      itemChoices: [],
    },
  };
}

export const CHRONICLE1_ENCOUNTERS = deepFreeze(ENCOUNTER_SPECS.map(buildEncounter));

function issue(
  code: EncounterValidationIssue['code'],
  encounterId: string,
  message: string,
): EncounterValidationIssue {
  return { code, encounterId, message };
}

function maximumOpeningDamage(enemy: Chronicle1EnemyDefinition): number {
  const roleBonus = enemy.role === 'assassin' ? 2 : enemy.role === 'archer' ? 1 : 0;
  const intentBonus = (enemy.intentWeights.heavy ?? 0) > 0
    ? 4
    : (enemy.intentWeights.hex ?? 0) > 0 ? 2 : 0;
  return enemy.attack + roleBonus + intentBonus;
}

/** Validates authored compositions without simulating RNG or erasing equipment advantage. */
export function validateEncounterGroups(
  encounters: readonly Chronicle1EncounterDefinition[],
  enemies: readonly Chronicle1EnemyDefinition[],
): readonly EncounterValidationIssue[] {
  const issues: EncounterValidationIssue[] = [];
  const enemyById = new Map(enemies.map((enemy) => [enemy.id, enemy] as const));
  const uniqueBossIds = new Set(enemies.filter((enemy) => 'isBoss' in enemy && enemy.isBoss).map((enemy) => enemy.id));
  const encounterIds = new Set<string>();
  const usedBosses = new Map<string, string>();

  for (const encounter of encounters) {
    if (encounterIds.has(encounter.id)) {
      issues.push(issue('duplicate_encounter_id', encounter.id, `Encounter ID ${encounter.id} is authored more than once.`));
    }
    encounterIds.add(encounter.id);
    if (encounter.enemyIds.length === 0) {
      issues.push(issue('empty_encounter', encounter.id, 'An encounter must contain at least one enemy.'));
      continue;
    }

    const chapter = CHAPTER_THREAT_BUDGETS[encounter.chapterId];
    if (
      !chapter
      || encounter.region !== chapter.region
      || encounter.levelBand.min !== chapter.levelBand.min
      || encounter.levelBand.max !== chapter.levelBand.max
      || encounter.threatBudget > chapter.maxThreat
      || encounter.openingDamageCap !== chapter.maxOpeningDamage
    ) {
      issues.push(issue('invalid_chapter_budget', encounter.id, `Encounter ${encounter.id} exceeds or mismatches its chapter budget.`));
    }

    const definitions = encounter.enemyIds.flatMap((enemyId) => {
      const enemy = enemyById.get(enemyId);
      if (!enemy) {
        issues.push(issue('missing_enemy', encounter.id, `Encounter ${encounter.id} references missing enemy ${enemyId}.`));
        return [];
      }
      if (!enemy.eligibleRegions.includes(encounter.region)) {
        issues.push(issue('invalid_enemy_region', encounter.id, `${enemy.id} is not eligible for ${encounter.region}.`));
      }
      return [enemy];
    });

    const bossIds = encounter.enemyIds.filter((enemyId) => uniqueBossIds.has(enemyId));
    for (const bossId of bossIds) {
      const firstEncounter = usedBosses.get(bossId);
      if (firstEncounter || bossIds.filter((candidate) => candidate === bossId).length > 1) {
        issues.push(issue('duplicate_unique_boss', encounter.id, `${bossId} is repeated after ${firstEncounter ?? encounter.id}.`));
      } else {
        usedBosses.set(bossId, encounter.id);
      }
    }

    if (
      (encounter.kind === 'boss' && (!encounter.bossEnemyId || !bossIds.includes(encounter.bossEnemyId)))
      || (encounter.kind !== 'boss' && encounter.bossEnemyId !== undefined)
    ) {
      issues.push(issue('invalid_boss_identity', encounter.id, `Encounter ${encounter.id} has an invalid designated boss.`));
    }

    const totalThreat = definitions.reduce((sum, enemy) => sum + enemy.threatCost, 0);
    if (totalThreat > encounter.threatBudget) {
      issues.push(issue('threat_budget_exceeded', encounter.id, `${encounter.id} spends ${totalThreat} of ${encounter.threatBudget} threat.`));
    }

    const openingDamage = definitions.reduce((sum, enemy) => sum + maximumOpeningDamage(enemy), 0);
    if (openingDamage > encounter.openingDamageCap) {
      issues.push(issue('unsafe_opening_damage', encounter.id, `${encounter.id} can present ${openingDamage} opening damage over its ${encounter.openingDamageCap} cap.`));
    }

    const controllers = definitions.filter((enemy) => enemy.role === 'controller');
    const summoners = definitions.filter((enemy) => enemy.role === 'summoner');
    if (controllers.length > 1 || summoners.length > 1 || (controllers.length > 0 && summoners.length > 0)) {
      issues.push(issue('permanent_control_loop', encounter.id, `${encounter.id} combines repeatable control or summon locks.`));
    }

    for (let leftIndex = 0; leftIndex < definitions.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < definitions.length; rightIndex += 1) {
        const left = definitions[leftIndex]!;
        const right = definitions[rightIndex]!;
        const conflicts = left.incompatibleTags.some((tag) => right.compatibilityTags.includes(tag))
          || right.incompatibleTags.some((tag) => left.compatibilityTags.includes(tag));
        if (conflicts) {
          issues.push(issue('incompatible_enemy_group', encounter.id, `${left.id} and ${right.id} use conflicting compatibility tags.`));
        }
      }
    }
  }

  return issues;
}
