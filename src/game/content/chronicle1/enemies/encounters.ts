import type { ChapterId, EncounterId, EnemyId, ItemId } from '../../../domain/ids';
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
  readonly battlefieldArtId?: string;
  readonly battlefieldArtAlt?: string;
  readonly reward?: { readonly xp: number; readonly gold: number; readonly itemChoices: readonly string[] };
}

const ENCOUNTER_SPECS: readonly EncounterSpec[] = [
  { id: 'enc-ch01-ditch-road-cutters', battlefieldArtId: 'enc-ch01-ditch-road-cutters', battlefieldArtAlt: 'A hooded goblin cutpurse and black-cloaked reaver corner an adventurer beside a rain-soaked produce wagon in Gloamwood.', enemyIds: ['goblin-cutpurse-01', 'black-banner-01'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Hold the wagon gap to contain the knife fighter, or cross the open ditch to expose the heavier reaver first.' },
  { id: 'enc-ch01-tollhouse-lookouts', battlefieldArtId: 'enc-ch01-tollhouse-lookouts', battlefieldArtAlt: 'A battered human shieldman and a hooded goblin cutpurse face each other in the flooded tollhouse culvert.', enemyIds: ['iron-deserter-01', 'goblin-cutpurse-01'], threatBudget: 6, compatibilityTags: ['frontline', 'mobile'], counterplay: 'Guard the deserter’s announced heavy blow, then spend focus to break its armor before the cutpurse can circle.', reward: { xp: 34, gold: 16, itemChoices: ['consumable-lamp-oil'] } },
  { id: 'enc-ch01-orchard-volley', battlefieldArtId: 'enc-ch01-orchard-volley', battlefieldArtAlt: 'A goblin torchling hurls an ember flask from among the apple trees as a black-cloaked reaver closes on the road.', enemyIds: ['goblin-torchling-01', 'black-banner-01'], threatBudget: 6, compatibilityTags: ['ranged', 'mobile'], counterplay: 'Use wagon cover against the cinder shot, then close on the reaver before the pair can trade positions.' },
  { id: 'enc-ch01-verge-signalers', enemyIds: ['black-banner-01', 'goblin-torchling-01'], threatBudget: 6, compatibilityTags: ['ranged', 'mobile', 'false-flag', 'fire'], counterplay: 'Use the hedge against the cinder throw, then prevent the reaver from reaching the signal pot.', reward: { xp: 34, gold: 16, itemChoices: ['consumable-smoke-bomb'] } },
  { id: 'enc-ch01-tollhouse-cellar', battlefieldArtId: 'enc-ch01-tollhouse-cellar', battlefieldArtAlt: 'A shield-bearing deserter blocks a flooded stone stair while a hooded goblin cutpurse lunges through the tollhouse cellar.', enemyIds: ['iron-deserter-01', 'goblin-cutpurse-01'], threatBudget: 6, compatibilityTags: ['frontline', 'mobile', 'false-flag'], counterplay: 'Hold the stair so the cutpurse cannot reach Jory, then break the deserter’s guard in the low tunnel.', reward: { xp: 34, gold: 16, itemChoices: ['consumable-lamp-oil'] } },
  { id: 'enc-ch01-smoke-on-the-bridge', enemyIds: ['boss-rattlehook-bridge-chief', 'goblin-cutpurse-01'], threatBudget: 10, compatibilityTags: ['elite', 'mobile'], counterplay: 'Read Rattlehook’s rail taps, protect the escape rope, and remove his lone knife fighter before the second phase.', kind: 'boss', bossEnemyId: 'boss-rattlehook-bridge-chief' },
  { id: 'enc-ch01-reedbank-pursuers', enemyIds: ['black-banner-01', 'black-banner-01'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Force the riders into the narrow road and focus one pursuer; spreading damage lets both keep circling.' },
  { id: 'enc-ch01-recover-the-false-banner', enemyIds: ['black-banner-01', 'goblin-cutpurse-02'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Guard the evidence carrier through the hooked-pole swing, then mark the cutpurse before it changes targets.', reward: { xp: 34, gold: 16, itemChoices: ['consumable-smoke-bomb'] } },
  { id: 'enc-ch01-millers-cart-raiders', enemyIds: ['black-banner-01', 'goblin-cutpurse-01'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Stop the horn bearer, then keep the reaver out of the mill-race rescue lane.', reward: { xp: 34, gold: 15, itemChoices: ['consumable-field-bandage'] } },
  { id: 'enc-ch01-warning-tree-penitents', enemyIds: ['thorn-penitent-01', 'black-banner-01'], threatBudget: 8, compatibilityTags: ['hard-control', 'mobile', 'false-flag', 'expeditionary'], counterplay: 'Cut the thorn line to limit the masked penitent, then keep the knife-bearing zealot away from the courier evidence.', reward: { xp: 38, gold: 13, itemChoices: [] } },
  { id: 'enc-ch01-kneeling-harness', enemyIds: ['barrow-soldier-01'], threatBudget: 4, compatibilityTags: ['undead', 'frontline'], counterplay: 'Interrupt the drill call by presenting the command token or breaking the sealed breastplate.', kind: 'lieutenant', reward: { xp: 46, gold: 16, itemChoices: [] } },
  { id: 'enc-ch01-war-camp-wargs', enemyIds: ['gloam-warg-01', 'gloam-warg-01'], threatBudget: 6, compatibilityTags: ['beast', 'mobile'], counterplay: 'Hold the sack lane so only one warg can reach Vekk at a time.', reward: { xp: 34, gold: 12, itemChoices: [] } },
  { id: 'enc-ch01-grave-tithe-warden', enemyIds: ['barrow-soldier-01'], threatBudget: 4, compatibilityTags: ['undead', 'frontline'], counterplay: 'Speak Halren’s name during his guard intent to stagger him, then break the command grip.', kind: 'lieutenant', reward: { xp: 46, gold: 14, itemChoices: [] } },
  { id: 'enc-ch01-shrine-warg', enemyIds: ['gloam-warg-01'], threatBudget: 3, compatibilityTags: ['beast', 'mobile'], counterplay: 'Keep the cleared gully open and defend the wagon road rather than chasing into the cellar.', reward: { xp: 34, gold: 10, itemChoices: [] } },
  { id: 'enc-ch01-siege-cart-maw', enemyIds: ['siege-cart-maw-01'], threatBudget: 4, compatibilityTags: ['beast', 'frontline', 'siege'], counterplay: 'Guard the announced chain drag, move it beyond the wagon lane, then strike while its chain mantle is open.', kind: 'lieutenant', reward: { xp: 46, gold: 18, itemChoices: [] } },

  { id: 'enc-ch02-north-wall-ladders', enemyIds: ['boss-captain-oren-dusk', 'goblin-torchling-02'], threatBudget: 12, compatibilityTags: ['leader', 'ranged'], counterplay: 'Interrupt Oren’s baton count or defeat the supporting archer before challenging his organized wall advance.', kind: 'boss', bossEnemyId: 'boss-captain-oren-dusk' },
  { id: 'enc-ch02-granary-fire-team', enemyIds: ['goblin-torchling-02', 'ash-magus-01'], threatBudget: 7, compatibilityTags: ['fire', 'ranged', 'support'], counterplay: 'Guard the telegraphed cinder flask, then pressure the magus before its focus drain delays the bucket line.' },
  { id: 'enc-ch02-south-gate-sapper', enemyIds: ['boss-black-banner-gatebreaker', 'goblin-cutpurse-02'], threatBudget: 12, compatibilityTags: ['frontline', 'mobile', 'siege'], counterplay: 'Break the powder-cart guard or wheel, then stop the cutpurse before it reaches the exposed gate crew.', kind: 'boss', bossEnemyId: 'boss-black-banner-gatebreaker' },
  { id: 'enc-ch02-armory-infiltrators', battlefieldArtId: 'enc-ch02-armory-infiltrators', battlefieldArtAlt: 'Two ragged Black Banner reavers hold the damp underwall armory, split by a maintenance grate and open weapon chests.', enemyIds: ['black-banner-02', 'black-banner-02'], threatBudget: 6, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Block the maintenance grate and focus one infiltrator at a time instead of defending every chest equally.' },
  { id: 'enc-ch02-council-passage-assassins', enemyIds: ['black-banner-03', 'goblin-cutpurse-03'], threatBudget: 8, compatibilityTags: ['mobile', 'false-flag'], counterplay: 'Mark the assassin nearest Tomas, then use the stone pillar to deny the fire-flask carrier a clean lane.' },
  { id: 'enc-ch02-lime-kiln-sentries', battlefieldArtId: 'enc-ch02-lime-kiln-sentries', battlefieldArtAlt: 'A shield-bearing deserter and a goblin with an ember flask guard the chalky firing lanes of the lime kiln.', enemyIds: ['iron-deserter-02', 'goblin-torchling-03'], threatBudget: 7, compatibilityTags: ['frontline', 'ranged'], counterplay: 'Drive the shield away from the rear tunnel before crossing the torchling’s clearly telegraphed firing lane.' },

  { id: 'enc-ch03-flooded-orchard', enemyIds: ['boss-osra-mire-witch', 'marsh-crawler-03'], threatBudget: 15, compatibilityTags: ['hard-control', 'frontline', 'water'], counterplay: 'Move out of Osra’s named current and break the crawler’s plate only when the witch begins retying her knot.', kind: 'boss', bossEnemyId: 'boss-osra-mire-witch' },
  { id: 'enc-ch03-black-skiffs', enemyIds: ['boss-harrow-ferry-reaver', 'goblin-cutpurse-04'], threatBudget: 15, compatibilityTags: ['elite', 'mobile', 'water'], counterplay: 'Cut Harrow’s boarding rope, mark his chosen gunwale, and remove the cutpurse before it reaches the evidence chest.', kind: 'boss', bossEnemyId: 'boss-harrow-ferry-reaver' },
  { id: 'enc-ch03-marsh-hounds', enemyIds: ['gloam-warg-04', 'gloam-warg-04'], threatBudget: 8, compatibilityTags: ['beast', 'mobile'], counterplay: 'Hold the gangplank so only one hound can lunge at a time, then focus the injured animal before its partner circles.' },
  { id: 'enc-ch03-borrowed-faces', enemyIds: ['iron-deserter-04', 'black-banner-04'], threatBudget: 8, compatibilityTags: ['frontline', 'mobile', 'false-flag'], counterplay: 'Break the false sergeant’s shield line before chasing the mobile reaver toward the signal flare.' },
  { id: 'enc-ch03-sluice-breakers', battlefieldArtId: 'enc-ch03-sluice-breakers', battlefieldArtAlt: 'A veteran shieldman and cinder-throwing goblin contest the flooded toll-archive sluice beside its iron winch.', enemyIds: ['iron-deserter-05', 'goblin-torchling-04'], threatBudget: 9, compatibilityTags: ['frontline', 'ranged', 'siege'], counterplay: 'Use the winch house as cover from cinder fire, then guard-break the deserter before pulling the final wedge.' },
  { id: 'enc-ch03-two-banner-rearguard', enemyIds: ['black-banner-05', 'orc-freeblade-04'], threatBudget: 9, compatibilityTags: ['mobile', 'specialist', 'false-flag'], counterplay: 'Protect the civilian fork first, then punish the freeblade after its visible oath-strike recovery.' },

  { id: 'enc-ch04-parley-rope', enemyIds: ['boss-kargan-war-chief', 'iron-deserter-05'], threatBudget: 18, compatibilityTags: ['leader', 'frontline'], counterplay: 'Answer Kargan’s named challenge while a companion or guard break removes the deserter from the witness lane.', kind: 'boss', bossEnemyId: 'boss-kargan-war-chief' },
  { id: 'enc-ch04-millrace-knives', enemyIds: ['black-banner-05', 'rain-wraith-05'], threatBudget: 10, compatibilityTags: ['mobile', 'undead', 'water'], counterplay: 'Mark the wraith’s outline and hold around the witness until the reaver commits across the narrow bridge.' },
  { id: 'enc-ch04-warehouse-arsonists', battlefieldArtId: 'enc-ch04-warehouse-arsonists', battlefieldArtAlt: 'A hooded black-banner reaver and goblin torchling fight among smoke-stained freight crates above the river.', enemyIds: ['black-banner-05', 'goblin-torchling-05'], threatBudget: 10, compatibilityTags: ['mobile', 'ranged', 'fire'], counterplay: 'Open a smoke-free lane, guard the first cinder throw, and prevent the reaver from reaching the freight records.' },
  { id: 'enc-ch04-south-tower-provocateurs', enemyIds: ['boss-redwater-provocateur', 'goblin-torchling-05'], threatBudget: 18, compatibilityTags: ['hard-control', 'ranged', 'false-flag'], counterplay: 'Interrupt the visible horn or flag signal, then cross under the roof line while the archer resets.', kind: 'boss', bossEnemyId: 'boss-redwater-provocateur' },
  { id: 'enc-ch04-panicked-war-oxen', enemyIds: ['marsh-crawler-06', 'bridge-troll-05'], threatBudget: 10, compatibilityTags: ['beast', 'frontline', 'specialist'], counterplay: 'Keep the lane narrow, break the crawler plate, and interrupt the troll’s announced recovery before the next charge.' },
  { id: 'enc-ch04-north-road-rearguard', enemyIds: ['iron-deserter-06', 'black-banner-06', 'goblin-torchling-05'], threatBudget: 15, compatibilityTags: ['frontline', 'mobile', 'ranged'], counterplay: 'Use the quarry bend to deny the archer, then break the shield before the reaver can ignite the evidence cart.' },

  { id: 'enc-ch05-chained-gate-veterans', enemyIds: ['iron-deserter-06', 'black-banner-06', 'vault-gargoyle-06'], threatBudget: 15, compatibilityTags: ['frontline', 'mobile', 'ranged'], counterplay: 'Shelter behind the rail stanchions, remove the fixed gargoyle, and then break the veteran shield line.' },
  { id: 'enc-ch05-missing-shift-jailers', enemyIds: ['black-banner-06', 'gloam-warg-06'], threatBudget: 10, compatibilityTags: ['mobile', 'beast'], counterplay: 'Draw the hound into the empty ore bay, mark it, and return before the reaver reaches the worker line.' },
  { id: 'enc-ch05-black-banner-forgemaster', enemyIds: ['boss-embervault-forgemaster', 'cinder-troll-06'], threatBudget: 20, compatibilityTags: ['elite', 'frontline', 'fire'], counterplay: 'Disable the quenching channel, interrupt the troll’s recovery, and cross only after Hadrik’s hammer falls.', kind: 'boss', bossEnemyId: 'boss-embervault-forgemaster' },
  { id: 'enc-ch05-ledger-vault-cutters', enemyIds: ['black-banner-07', 'ash-magus-06'], threatBudget: 12, compatibilityTags: ['mobile', 'support', 'fire'], counterplay: 'Break the acid carrier’s lane first, then pressure the magus after its named focus-draining hex.' },
  { id: 'enc-ch05-twin-armory-convoy', enemyIds: ['boss-royal-armory-golem', 'black-banner-07'], threatBudget: 21, compatibilityTags: ['construct', 'frontline', 'mobile'], counterplay: 'Expose the golem’s numbered plate at the shared brake, then mark the reaver before it changes carts.', kind: 'boss', bossEnemyId: 'boss-royal-armory-golem' },
  { id: 'enc-ch05-cinder-shaft-demolition', enemyIds: ['ash-magus-07', 'iron-deserter-07', 'goblin-torchling-07'], threatBudget: 19, compatibilityTags: ['support', 'frontline', 'ranged', 'fire'], counterplay: 'Use the blast shield against cinder fire, break the deserter’s guard, and interrupt the magus at the ladder bolts.' },
  { id: 'enc-ch05-underworks-lift-watch-a', battlefieldArtId: 'enc-ch05-underworks-lift-watch-a', battlefieldArtAlt: 'An iron shieldman and stone gargoyle defend the exposed landing of Embervault’s chain lift.', enemyIds: ['iron-deserter-06', 'vault-gargoyle-06'], threatBudget: 12, compatibilityTags: ['frontline', 'ranged', 'construct'], counterplay: 'Break the lift guard’s stance, then stagger the fixed shooter before it can call the next ore cage down.' , reward: { xp: 40, gold: 18, itemChoices: [] } },
  { id: 'enc-ch05-underworks-lift-watch-b', battlefieldArtId: 'enc-ch05-underworks-lift-watch-b', battlefieldArtAlt: 'A black-cloaked reaver and firebomb-toting goblin stalk a narrow platform above the lift shaft.', enemyIds: ['black-banner-06', 'goblin-torchling-06'], threatBudget: 12, compatibilityTags: ['mobile', 'ranged', 'false-flag', 'fire'], counterplay: 'Guard the first cinder throw and mark the reaver before it leaves the chain platform exposed.', reward: { xp: 42, gold: 16, itemChoices: [] } },
  { id: 'enc-ch05-smelter-rail-patrol-a', battlefieldArtId: 'enc-ch05-smelter-rail-patrol-a', battlefieldArtAlt: 'An armored deserter and hooked-blade reaver clash across the moving ore rail in Embervault’s smelter.', enemyIds: ['iron-deserter-07', 'black-banner-07'], threatBudget: 14, compatibilityTags: ['frontline', 'mobile', 'false-flag'], counterplay: 'Draw the shield away from the narrow rail, then punish the reaver after its committed hook pass.', reward: { xp: 46, gold: 21, itemChoices: [] } },
  { id: 'enc-ch05-smelter-rail-patrol-b', battlefieldArtId: 'enc-ch05-smelter-rail-patrol-b', battlefieldArtAlt: 'A winged vault gargoyle and ember-staff ash magus guard a furnace bulkhead overlooking the smelter rail.', enemyIds: ['vault-gargoyle-07', 'ash-magus-07'], threatBudget: 15, compatibilityTags: ['construct', 'ranged', 'support', 'fire'], counterplay: 'Use the bulkhead against the magus’s hex and stagger the gargoyle before its second aimed shot.', reward: { xp: 44, gold: 19, itemChoices: [] } },
  { id: 'enc-ch05-quench-corridor-team-a', battlefieldArtId: 'enc-ch05-quench-corridor-team-a', battlefieldArtAlt: 'A massive cinder troll and ember-flask goblin hold the steaming valve lane of Embervault’s quench corridor.', enemyIds: ['cinder-troll-06', 'goblin-torchling-07'], threatBudget: 15, compatibilityTags: ['frontline', 'specialist', 'ranged', 'fire'], counterplay: 'Leave the marked quench lane before the troll commits, then stop the torchling’s flask from reaching the valve.', reward: { xp: 45, gold: 18, itemChoices: [] } },
  { id: 'enc-ch05-quench-corridor-team-b', battlefieldArtId: 'enc-ch05-quench-corridor-team-b', battlefieldArtAlt: 'An iron-shielded veteran faces a spread-winged vault gargoyle beneath a low, steam-wet stone passage.', enemyIds: ['iron-deserter-08', 'vault-gargoyle-08'], threatBudget: 16, compatibilityTags: ['frontline', 'ranged', 'construct'], counterplay: 'Keep the deserter from pinning you beneath the perch and stagger the gargoyle when it spreads its wings.', reward: { xp: 48, gold: 22, itemChoices: [] } },
  { id: 'enc-ch05-cinder-troll-elite', battlefieldArtId: 'enc-ch05-cinder-troll-elite', battlefieldArtAlt: 'An ember-cracked cinder troll fills a low quench corridor of dark wet stone and steaming iron vents.', enemyIds: ['cinder-troll-08'], threatBudget: 9, compatibilityTags: ['elite', 'specialist', 'fire'], counterplay: 'Guard its announced molten charge, then attack the cracked flank while the troll catches its breath.', kind: 'lieutenant', reward: { xp: 58, gold: 26, itemChoices: [] } },
  { id: 'enc-ch05-ledger-gallery-watch-a', battlefieldArtId: 'enc-ch05-ledger-gallery-watch-a', battlefieldArtAlt: 'A black-cloaked reaver and hooded ash magus confront intruders among Embervault’s ironbound ledger shelves.', enemyIds: ['black-banner-06', 'ash-magus-06'], threatBudget: 17, compatibilityTags: ['mobile', 'support', 'fire', 'false-flag'], counterplay: 'Break the magus’s ward before its reaver reaches the records case; guard only when both lanes threaten a killing blow.', reward: { xp: 50, gold: 25, itemChoices: [] } },
  { id: 'enc-ch05-ledger-gallery-watch-b', battlefieldArtId: 'enc-ch05-ledger-gallery-watch-b', battlefieldArtAlt: 'An iron-shielded deserter and goblin torchling guard a pillar-lined Embervault records aisle.', enemyIds: ['iron-deserter-06', 'goblin-torchling-06'], threatBudget: 16, compatibilityTags: ['frontline', 'ranged', 'fire', 'false-flag'], counterplay: 'Use a pillar to break the torchling’s firing lane, then pressure the veteran while the goblin resets its flask.', reward: { xp: 52, gold: 23, itemChoices: [] } },
  { id: 'enc-ch05-worker-cage-patrol-a', battlefieldArtId: 'enc-ch05-worker-cage-patrol-a', battlefieldArtAlt: 'A dark-furred warg and black-cloaked reaver guard barred worker cages, with captives behind iron bars.', enemyIds: ['gloam-warg-08', 'black-banner-09'], threatBudget: 17, compatibilityTags: ['beast', 'mobile', 'false-flag'], counterplay: 'Hold the cage gate so the warg cannot flank the witness, then mark the reaver during its recovery.', reward: { xp: 55, gold: 20, itemChoices: [] } },
  { id: 'enc-ch05-worker-cage-patrol-b', battlefieldArtId: 'enc-ch05-worker-cage-patrol-b', battlefieldArtAlt: 'A stone gargoyle perches over an open cage gate as a black-cloaked reaver blocks the escape lane.', enemyIds: ['vault-gargoyle-08', 'black-banner-08'], threatBudget: 16, compatibilityTags: ['construct', 'ranged', 'mobile', 'false-flag'], counterplay: 'Move out of the gargoyle’s marked firing lane and keep the reaver away from the open worker cages.', reward: { xp: 49, gold: 28, itemChoices: [] } },
  { id: 'enc-ch05-vault-gargoyle-elite', battlefieldArtId: 'enc-ch05-vault-gargoyle-elite', battlefieldArtAlt: 'An enormous stone gargoyle spreads its wings above the steep, broken approach to the Embervault vault.', enemyIds: ['vault-gargoyle-07'], threatBudget: 10, compatibilityTags: ['elite', 'construct', 'ranged'], counterplay: 'Keep moving under the marked firing lane; its opened wings leave a brief chance to strike before it regains height.', kind: 'lieutenant', reward: { xp: 62, gold: 24, itemChoices: [] } },
  { id: 'enc-ch05-cinder-heart-regulator', battlefieldArtId: 'enc-ch05-cinder-heart-regulator', battlefieldArtAlt: 'The towering iron Cinder-Heart Regulator and its black-cloaked reaver guard the valve lane inside the furnace hall.', enemyIds: ['boss-embervault-cinder-heart-regulator', 'black-banner-06'], threatBudget: 20, compatibilityTags: ['unique', 'construct', 'specialist', 'mobile', 'frontline'], counterplay: 'Read the regulator’s marked valve lane, interrupt the relay during its pressure reset, and keep the reaver off the control rail.', kind: 'boss', bossEnemyId: 'boss-embervault-cinder-heart-regulator', reward: { xp: 92, gold: 42, itemChoices: [] } },

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

  { id: 'enc-ch06-ossuary-bell-jailers', battlefieldArtId: 'enc-ch06-ossuary-bell-jailers', battlefieldArtAlt: 'A bell-bearing cultist and undead armored soldier hold the cracked pillar on a bone-lined chapel stair.', enemyIds: ['bell-apostle-07', 'barrow-soldier-07'], threatBudget: 14, compatibilityTags: ['hard-control', 'leader', 'undead'], counterplay: 'Guard the raised warning bell, break the soldier’s drill call, and use the cracked pillar before the jailers close the stair.' },
  { id: 'enc-ch06-bell-loft-sentinel', battlefieldArtId: 'enc-ch06-bell-loft-sentinel', battlefieldArtAlt: 'A winged stone gargoyle descends toward the alarm bell as a banner reaver guards the narrow loft.', enemyIds: ['vault-gargoyle-07', 'black-banner-08'], threatBudget: 17, compatibilityTags: ['construct', 'ranged', 'mobile', 'false-flag'], counterplay: 'Leave the marked bell lane before the stone sentinel drops, then stop the reaver from sounding the second alarm.', kind: 'lieutenant' },
  { id: 'enc-ch07-aqueduct-crossbow-patrol', battlefieldArtId: 'enc-ch07-aqueduct-crossbow-patrol', battlefieldArtAlt: 'A high-perched winged gargoyle and iron-shielded deserter hold a dry aqueduct bridge below a firing slit.', enemyIds: ['vault-gargoyle-09', 'iron-deserter-09'], threatBudget: 19, compatibilityTags: ['construct', 'ranged', 'frontline'], counterplay: 'Take cover below the high firing slit, stagger the gargoyle as it opens its wings, and then break the shield on the bridge.', reward: { xp: 76, gold: 28, itemChoices: ['consumable-field-bandage'] } },
  { id: 'enc-ch07-compact-archive-wardens', battlefieldArtId: 'enc-ch07-compact-archive-wardens', battlefieldArtAlt: 'An undead soldier and iron-shielded deserter defend the tight stair between compact archive shelves.', enemyIds: ['barrow-soldier-09', 'iron-deserter-09'], threatBudget: 20, compatibilityTags: ['undead', 'leader', 'frontline'], counterplay: 'Interrupt the roster call, separate the shield veteran from the record shelf, and seize the stair before the next rotation.', kind: 'lieutenant' },
  { id: 'enc-ch08-engine-gallery-watch', battlefieldArtId: 'enc-ch08-engine-gallery-watch', battlefieldArtAlt: 'A blocky stone-and-iron abbey golem and black-banner reaver close the lane around the pulley housing.', enemyIds: ['black-banner-09', 'abbey-golem-09'], threatBudget: 20, compatibilityTags: ['mobile', 'construct', 'frontline'], counterplay: 'Use the pulley housing to break the reaver’s lane, then expose the golem’s numbered service plate before it seals the stair.' },
  { id: 'enc-ch08-regulator-control-crew', battlefieldArtId: 'enc-ch08-regulator-control-crew', battlefieldArtAlt: 'An ash magus, bell apostle, and black-banner reaver spread across the regulator lever and signal bell gallery.', enemyIds: ['ash-magus-10', 'bell-apostle-09', 'black-banner-10'], threatBudget: 23, compatibilityTags: ['support', 'hard-control', 'mobile', 'fire'], counterplay: 'Jam the pressure lever during the magus’s vent, silence the bell signal, and mark the runner before it reaches the platform flags.', kind: 'lieutenant', reward: { xp: 112, gold: 34, itemChoices: ['consumable-field-bandage'] } },
];

const ADDITIONAL_BATTLEFIELD_ART_ALTS: Readonly<Record<string, string>> = deepFreeze({
  'enc-ch01-verge-signalers': 'A black-cloaked reaver and ember-flask goblin guard a signal pot beside a rain-dark hedge in Gloamwood.',
  'enc-ch01-smoke-on-the-bridge': 'Rattlehook and a hooded cutpurse hold a smoke-veiled rope bridge above a wooded ravine.',
  'enc-ch01-reedbank-pursuers': 'Two black-cloaked riders wait among reed beds beside a flooded Gloamwood bank.',
  'enc-ch01-recover-the-false-banner': 'A black-banner raider and hooded cutpurse guard a captured false banner at a muddy trail fork.',
  'enc-ch01-millers-cart-raiders': 'A reaver and knife-bearing goblin flank a loaded miller cart on the narrow millrace path.',
  'enc-ch01-warning-tree-penitents': 'A masked thorn penitent and black-cloaked reaver stand near a warning tree bound in thorn branches.',
  'enc-ch01-kneeling-harness': 'An undead barrow soldier kneels beside a sealed iron harness among misty Gloamwood grave markers.',
  'enc-ch01-war-camp-wargs': 'Two dark-furred wargs prowl at the edge of a rough forest camp and its provision sacks.',
  'enc-ch01-grave-tithe-warden': 'An armored barrow warden stands beside grave-tithe markers in a misty churchyard.',
  'enc-ch01-shrine-warg': 'A gray warg watches the wagon trail from beside a weathered roadside shrine in the forest.',
  'enc-ch01-siege-cart-maw': 'A chain-armored siege-cart maw blocks the wagon track at the Gloamwood treeline.',
  'enc-ch02-north-wall-ladders': 'Captain Oren Dusk and a torchling archer defend assault ladders beneath Greywatch north wall.',
  'enc-ch02-granary-fire-team': 'An ember goblin and ash magus hold the granary floor beside stacked grain and a bucket line.',
  'enc-ch02-south-gate-sapper': 'An armored gatebreaker and hooded cutpurse defend a powder cart beneath the south gate.',
  'enc-ch02-council-passage-assassins': 'A black-banner reaver and goblin assassin guard a narrow council passage between stone pillars.',
  'enc-ch03-flooded-orchard': 'A mire witch and plated marsh crawler face the party across a flooded orchard lane.',
  'enc-ch03-black-skiffs': 'A ferry reaver and hooded cutpurse hold opposite ends of a narrow black skiff on rain-dark water.',
  'enc-ch03-marsh-hounds': 'Two marsh hounds face the party across a flooded gangplank between reed-covered banks.',
  'enc-ch03-borrowed-faces': 'A shielded deserter and black-cloaked reaver hold a marsh signal post beside a flare basket.',
  'enc-ch03-two-banner-rearguard': 'A banner reaver and orc freeblade contest a rain-soaked road fork beneath two signal banners.',
  'enc-ch04-parley-rope': 'A war chief and shielded deserter face the party across a rope-bound parley circle in river fog.',
  'enc-ch04-millrace-knives': 'A black-banner knife fighter and rain wraith hold a narrow millrace bridge beneath wet timber beams.',
  'enc-ch04-south-tower-provocateurs': 'A Redwater provocateur and goblin archer defend a signal platform in the south tower.',
  'enc-ch04-panicked-war-oxen': 'A marsh crawler and hulking bridge troll block a muddy lane as war oxen wait behind ropes.',
  'enc-ch04-north-road-rearguard': 'A deserter, reaver, and torchling contest a quarry-road bend beside a covered evidence cart.',
  'enc-ch05-chained-gate-veterans': 'A shielded veteran, black-banner reaver, and winged gargoyle defend Embervault’s chained gate.',
  'enc-ch05-missing-shift-jailers': 'A black-cloaked reaver and dark warg hold an empty ore bay beside barred worker cages.',
  'enc-ch05-black-banner-forgemaster': 'Embervault’s forgemaster and a cinder troll face the party beside the furnace quenching channel.',
  'enc-ch05-ledger-vault-cutters': 'A reaver and ash magus guard a sealed ledger vault beneath ironbound record shelves.',
  'enc-ch05-twin-armory-convoy': 'A royal armory golem and black-banner reaver defend a twin-cart convoy along Embervault rails.',
  'enc-ch05-cinder-shaft-demolition': 'An ash magus, shielded deserter, and torchling guard a blasting lane beside the cinder-shaft ladder.',
  'enc-ch06-evidence-road-riders': 'A reaver, shielded deserter, and winged gargoyle face the party beside a witness cart on the King’s Road.',
  'enc-ch06-outer-ditch-screen': 'An undead drill leader and winged gargoyle hold a prepared firing perch above a road ditch.',
  'enc-ch06-chapel-hostage-jailers': 'A bell apostle and shielded veteran hold a chapel stair beside a warning bell and smoke lever.',
  'enc-ch06-covered-siege-ram': 'Siege engineer Malrec and an ash magus defend a covered ram at the west-wall approach.',
  'enc-ch06-west-wall-breach': 'A reaver, armored deserter, and torchling hold a breach among fallen Greywatch masonry.',
  'enc-ch06-last-rear-guard': 'The Black Banner commander and a reaver hold the broken west wall beneath a dark signal standard.',
  'enc-ch07-kingroad-wagon-cutters': 'A reaver, shielded deserter, and winged gargoyle block a loaded wagon on the rain-dark King’s Road.',
  'enc-ch07-duplicate-patrol': 'An undead drill leader and black-cloaked reaver guard the remount rail beside a false patrol standard.',
  'enc-ch07-quarry-crossbows': 'Two winged gargoyles and a shielded deserter control crossfire around a quarry crane.',
  'enc-ch07-postern-sappers': 'An ash magus and shielded deserter guard a slow fuse beside the Crownless Keep postern hatch.',
  'enc-ch07-counterweight-house': 'The Crownless Gate Warden and a reaver stand by the brake key beneath immense counterweight chains.',
  'enc-ch07-voss-last-champion': 'Elian Roake and an armored deserter hold the narrow record-stair beneath Crownless Keep banners.',
  'enc-ch08-guest-guard-rotation': 'A key-bearing captain and armored guards block the service stair as delegates leave the guest rooms.',
  'enc-ch08-seal-case-wardens': 'An iron golem and undead warden defend seal cases suspended above the archive document well.',
  'enc-ch08-archive-furnace-detail': 'An ash magus and reaver guard the iron furnace between oil jars and archive records.',
  'enc-ch08-coronation-engine': 'Marshal Voss and the immense iron coronation engine command a hall of chains, shutters, and portcullis.',
  'enc-ch08-upper-courtyard-loyalists': 'A loyalist line with a bell standard holds a rain-soaked courtyard between an archive cart and infirmary.',
  'enc-ch08-record-wing-holdouts': 'A reaver and ash magus defend a cipher chest among sealed trial records in the private archive wing.',
});

function chapterFromEncounterId(id: string): ChapterId {
  const chapterId = id.slice(4, 8) as ChapterId;
  if (!(chapterId in CHAPTER_THREAT_BUDGETS)) throw new Error(`Encounter ${id} has no Chronicle I chapter budget.`);
  return chapterId;
}

function buildEncounter(spec: EncounterSpec, sequence: number): Chronicle1EncounterDefinition {
  const chapterId = chapterFromEncounterId(spec.id);
  const chapter = CHAPTER_THREAT_BUDGETS[chapterId];
  const kind = spec.kind ?? 'regular';
  const battlefieldArtAlt = spec.battlefieldArtAlt ?? ADDITIONAL_BATTLEFIELD_ART_ALTS[spec.id];
  if (!battlefieldArtAlt) throw new Error(`Encounter ${spec.id} has no battlefield art alt text.`);
  return {
    id: spec.id as EncounterId,
    chapterId,
    region: chapter.region,
    levelBand: chapter.levelBand,
    family: spec.id.replace(/^enc-ch\d{2}-/, ''),
    kind,
    enemyIds: spec.enemyIds as readonly EnemyId[],
    bossEnemyId: spec.bossEnemyId as EnemyId | undefined,
    battlefieldArtId: spec.battlefieldArtId ?? spec.id,
    battlefieldArtAlt,
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
