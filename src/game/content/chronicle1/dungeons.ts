import type { DungeonDefinition } from '../../dungeon/types';
import type { AuthoredContent } from './authored-content';

/** Compact authored delves reuse the chapter's existing illustrated scenes and encounters. */
const AUTHORED_CHRONICLE1_DUNGEONS = [
  {
    id: 'ch01-tollhouse-culvert', chapterId: 'ch01', startNodeId: 'ch01-cellar-stair', exitNodeIds: ['ch01-orchard-emergence'],
    nodes: [
      { id: 'ch01-cellar-stair', kind: 'scene', sceneId: 'ch01-living-below-toll-desk-entry', exits: [
        { id: 'ch01-enter-the-lookouts', targetNodeId: 'ch01-tollhouse-lookouts', label: 'Follow the boot scrapes', detail: 'Take the badge proof and meet the lookouts guarding the orchard culvert.', requiredFlags: ['stolen-greywatch-cloaks-found'] },
        { id: 'ch01-leave-by-the-tollhouse-stair', targetNodeId: 'ch01-culvert-tracks', label: 'Leave by the tollhouse stair', detail: 'Seal the hidden approach and return to the road without risking a fight.', requiredFlags: ['tollhouse-tunnel-collapsed'] },
      ] },
      { id: 'ch01-tollhouse-lookouts', kind: 'combat', encounterId: 'enc-ch01-tollhouse-lookouts', exits: [
        { id: 'ch01-crawl-through-culvert', targetNodeId: 'ch01-culvert-tracks', label: 'Crawl through the culvert', detail: 'Leave the cleared lookout post by the low drain where the smaller tracks continue.' },
      ] },
      { id: 'ch01-culvert-tracks', kind: 'scene', sceneId: 'ch01-journey-tracks-beyond-the-orchard', exits: [
        { id: 'ch01-return-to-convoy', targetNodeId: 'ch01-orchard-emergence', label: 'Return to the convoy', detail: 'Carry the trail you chose back to Jory before the next arrow reaches the wagons.' },
      ] },
      { id: 'ch01-orchard-emergence', kind: 'exit', exitKind: 'complete', sceneId: 'ch01-main-the-first-arrow', exits: [] },
    ],
  },
  {
    id: 'ch02-underwall-depot', chapterId: 'ch02', startNodeId: 'ch02-underwall-entry', exitNodeIds: ['ch02-depot-discovery'],
    nodes: [
      { id: 'ch02-underwall-entry', kind: 'scene', sceneId: 'ch02-journey-the-underwall-conduit', exits: [
        { id: 'ch02-slip-through-cistern', targetNodeId: 'ch02-cistern-hatch', label: 'Slip through the dry basin', detail: 'Use the inspection hatch to reach the depot unseen, but spend time in the smoke.' },
        { id: 'ch02-confront-underwall-guards', targetNodeId: 'ch02-underwall-guards', label: 'Confront the underwall guards', detail: 'Clear the armed infiltrators before they can close the passage, at the cost of an extra fight.' },
      ] },
      { id: 'ch02-underwall-guards', kind: 'combat', encounterId: 'enc-ch02-armory-infiltrators', exits: [
        { id: 'ch02-press-to-kiln', targetNodeId: 'ch02-kiln-sentries', label: 'Press toward the kiln', detail: 'Follow the fleeing infiltrators straight to the depot watch.' },
      ] },
      { id: 'ch02-cistern-hatch', kind: 'scene', sceneId: 'ch02-journey-the-depot-cistern', exits: [
        { id: 'ch02-open-from-below', targetNodeId: 'ch02-kiln-sentries', label: 'Open the depot from below', detail: 'Emerge behind the crates as the kiln sentries turn toward the hatch.' },
      ] },
      { id: 'ch02-kiln-sentries', kind: 'combat', encounterId: 'enc-ch02-lime-kiln-sentries', exits: [
        { id: 'ch02-secure-hidden-depot', targetNodeId: 'ch02-depot-discovery', label: 'Secure the depot', detail: 'Bring the captured route and any surviving proof before the Greywatch inquiry.' },
      ] },
      { id: 'ch02-depot-discovery', kind: 'exit', exitKind: 'complete', sceneId: 'ch02-main-the-hidden-depot', exits: [] },
    ],
  },
  {
    id: 'ch03-flooded-toll-archive', chapterId: 'ch03', startNodeId: 'ch03-archive-stair', exitNodeIds: ['ch03-levee-emergence'],
    nodes: [
      { id: 'ch03-archive-stair', kind: 'scene', sceneId: 'ch03-journey-the-flooded-toll-archive', exits: [
        { id: 'ch03-turn-the-sluice-wheel', targetNodeId: 'ch03-sluice-breakers', label: 'Turn the sluice wheel', detail: 'Lower the archive water and expose the agents who have been breaking the mechanism.' },
      ] },
      { id: 'ch03-sluice-breakers', kind: 'combat', encounterId: 'enc-ch03-sluice-breakers', exits: [
        { id: 'ch03-copy-the-gear-marks', targetNodeId: 'ch03-gear-cache', label: 'Copy the gear marks', detail: 'Record the altered sluice teeth as proof; the damp chamber offers no recovery.' },
        { id: 'ch03-rest-on-dry-landing', targetNodeId: 'ch03-dry-landing', label: 'Rest on the dry landing', detail: 'Treat wounds before the levee attack, leaving the mechanism evidence in the water.' },
      ] },
      { id: 'ch03-gear-cache', kind: 'cache', rewardVariants: [{ id: 'ch03-gear-rubbing', effects: [{ type: 'flag', operation: 'add', flagId: 'archive-sluice-tampering-recorded' }, { type: 'threat', amount: 1 }] }], exits: [
        { id: 'ch03-carry-gear-rubbing', targetNodeId: 'ch03-levee-emergence', label: 'Carry the rubbing to the levee', detail: 'Take the altered-gear proof toward the attack with two banners.' },
      ] },
      { id: 'ch03-dry-landing', kind: 'rest', rewardVariants: [{ id: 'ch03-landing-bandages', effects: [{ type: 'vitals', health: 3 }, { type: 'flag', operation: 'add', flagId: 'archive-landing-rested' }] }], exits: [
        { id: 'ch03-leave-archive-rested', targetNodeId: 'ch03-levee-emergence', label: 'Return to the levee', detail: 'Rejoin the evidence ferry before the two-banner attackers arrive.' },
      ] },
      { id: 'ch03-levee-emergence', kind: 'exit', exitKind: 'complete', sceneId: 'ch03-main-the-attack-with-two-banners', exits: [] },
    ],
  },
  {
    id: 'ch04-mill-drains-warehouse', chapterId: 'ch04', startNodeId: 'ch04-mill-drain-mouth', exitNodeIds: ['ch04-first-charge'],
    nodes: [
      { id: 'ch04-mill-drain-mouth', kind: 'scene', sceneId: 'ch04-journey-beneath-the-mill-drains', exits: [
        { id: 'ch04-enter-warehouse-drain', targetNodeId: 'ch04-warehouse-fire', label: 'Follow the drain to the warehouse', detail: 'Track the signal horns beneath the warehouses while the paper trail is still warm.' },
      ] },
      { id: 'ch04-warehouse-fire', kind: 'combat', encounterId: 'enc-ch04-warehouse-arsonists', exits: [
        { id: 'ch04-search-for-bakers', targetNodeId: 'ch04-bakers-rescue', label: 'Search for the missing bakers', detail: 'Follow the locked bread cart toward the tannery; the clerk may escape with the manifest.' },
        { id: 'ch04-pursue-warehouse-clerk', targetNodeId: 'ch04-warehouse-cellar', label: 'Pursue the warehouse clerk', detail: 'Chase the burning manifests below; the bakers must wait for town wardens.' },
      ] },
      { id: 'ch04-bakers-rescue', kind: 'scene', sceneId: 'ch04-journey-the-missing-bakers', exits: [
        { id: 'ch04-report-bakers-trail', targetNodeId: 'ch04-first-charge', label: 'Report the bakers\' trail', detail: 'Give the commanders the tannery location and your ration decision before the false charge begins.' },
      ] },
      { id: 'ch04-warehouse-cellar', kind: 'scene', sceneId: 'ch04-journey-the-north-warehouse-cellar', exits: [
        { id: 'ch04-bring-proof-to-parley', targetNodeId: 'ch04-first-charge', label: 'Bring the warehouse proof to safety', detail: 'Testimony or crates can expose the paired supplies before the armies move.' },
      ] },
      { id: 'ch04-first-charge', kind: 'exit', exitKind: 'complete', sceneId: 'ch04-main-before-the-first-charge', exits: [] },
    ],
  },
  {
    id: 'ch05-embervault-underworks', chapterId: 'ch05', startNodeId: 'ch05-underworks-lift-watch',
    exitNodeIds: [
      'ch05-underworks-forge-exit',
      'ch05-underworks-retreat-after-lift',
      'ch05-underworks-retreat-from-smelter',
      'ch05-underworks-retreat-from-quench',
      'ch05-underworks-retreat-after-sentinel',
    ],
    nodes: [
      { id: 'ch05-underworks-lift-watch', kind: 'combat', encounterVariants: ['enc-ch05-underworks-lift-watch-a', 'enc-ch05-underworks-lift-watch-b'], exits: [
        { id: 'ch05-take-the-smelter-rail', targetNodeId: 'ch05-smelter-rail-patrol', label: 'Take the smelter rail', detail: 'Cross the narrow furnace-side catwalk, where shield guards and a fixed perch cover the pressure controls.' },
        { id: 'ch05-drop-through-the-quench-cut', targetNodeId: 'ch05-quench-corridor-team', label: 'Drop through the quench cut', detail: 'Take the lower service channel through steam and slag; its patrol favors close pressure and sudden fire.' },
        { id: 'ch05-withdraw-from-the-lift', targetNodeId: 'ch05-underworks-retreat-after-lift', label: 'Withdraw through the ore lift', detail: 'Leave the lower works before the lift crew can seal the return chain; the deeper records stay behind.', excludedFlags: ['underworks-retreat-closed'] },
      ] },
      { id: 'ch05-smelter-rail-patrol', kind: 'combat', encounterVariants: ['enc-ch05-smelter-rail-patrol-a', 'enc-ch05-smelter-rail-patrol-b'], exits: [
        { id: 'ch05-recover-after-smelter-rail', targetNodeId: 'ch05-underworks-breakpoint', label: 'Reach the pressure alcove', detail: 'Get off the exposed rail and choose between a short recovery and supplies before the first elite guard.' },
        { id: 'ch05-retreat-from-smelter-rail', targetNodeId: 'ch05-underworks-retreat-from-smelter', label: 'Retreat with the rail docket', detail: 'Cut back to the lift with the patrol route in hand, securing only part of the unbanked haul.' },
      ] },
      { id: 'ch05-quench-corridor-team', kind: 'combat', encounterVariants: ['enc-ch05-quench-corridor-team-a', 'enc-ch05-quench-corridor-team-b'], exits: [
        { id: 'ch05-recover-after-quench-cut', targetNodeId: 'ch05-underworks-breakpoint', label: 'Reach the pressure alcove', detail: 'Leave the flooded channel and choose between a short recovery and supplies before the first elite guard.' },
        { id: 'ch05-retreat-from-quench-cut', targetNodeId: 'ch05-underworks-retreat-from-quench', label: 'Retreat along the drain', detail: 'Return by the flooded cut before the shutters close, securing only part of the unbanked haul.' },
      ] },
      { id: 'ch05-underworks-breakpoint', kind: 'hazard', exits: [
        { id: 'ch05-take-a-breather', targetNodeId: 'ch05-underworks-rest-niche', label: 'Rest in the valve niche', detail: 'Take a proper breather beside the cooling pipes: choose a stronger health recovery or a deeper focus reserve.' },
        { id: 'ch05-claim-the-supply-crate', targetNodeId: 'ch05-underworks-supply-cache', label: 'Take the sealed supply crate', detail: 'Keep moving without a full rest, but recover a small reserve for the final pressure rooms.' },
      ] },
      { id: 'ch05-underworks-rest-niche', kind: 'rest', rewardVariants: [
        { id: 'ch05-rest-water-and-bandage', effects: [{ type: 'vitals', health: 18, resource: 2 }, { type: 'flag', operation: 'add', flagId: 'underworks-rested-at-valve' }] },
        { id: 'ch05-rest-focus-tonic', effects: [{ type: 'vitals', health: 10, resource: 4 }, { type: 'flag', operation: 'add', flagId: 'underworks-rested-at-valve' }] },
      ], exits: [
        { id: 'ch05-continue-to-rivet-guard-from-rest', targetNodeId: 'ch05-rivet-guard', label: 'Move past the rivet guard', detail: 'Leave the niche before the pressure cycle resets and blocks the route to the records platform.' },
      ] },
      { id: 'ch05-underworks-supply-cache', kind: 'cache', rewardVariants: [
        { id: 'ch05-cache-ore-scrip', effects: [{ type: 'gold', scope: 'unbanked', amount: 16 }, { type: 'vitals', resource: 2 }, { type: 'flag', operation: 'add', flagId: 'underworks-supply-crate-opened' }] },
        { id: 'ch05-cache-field-stock', effects: [{ type: 'gold', scope: 'unbanked', amount: 10 }, { type: 'vitals', health: 5 }, { type: 'flag', operation: 'add', flagId: 'underworks-supply-crate-opened' }] },
      ], exits: [
        { id: 'ch05-continue-to-rivet-guard-from-supplies', targetNodeId: 'ch05-rivet-guard', label: 'Move past the rivet guard', detail: 'Carry the recovered stock into the pressure hall and meet the elite sentry at its active relay.' },
      ] },
      { id: 'ch05-rivet-guard', kind: 'elite', encounterId: 'enc-ch05-cinder-troll-elite', exits: [
        { id: 'ch05-reach-the-dead-letter-cache', targetNodeId: 'ch05-dead-letter-cache', label: 'Open the dead-letter locker', detail: 'The sentinel guarded two different things: an authorization rubbing and the workers’ hidden shift roll.' },
      ] },
      { id: 'ch05-dead-letter-cache', kind: 'cache', rewardVariants: [
        { id: 'ch05-cache-ledger-rubbing', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'embervault-ledger-copy' }, { type: 'flag', operation: 'add', flagId: 'underworks-ledger-rubbing-found' }, { type: 'gold', scope: 'unbanked', amount: 12 }] },
        { id: 'ch05-cache-workers-shift-roll', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }, { type: 'flag', operation: 'add', flagId: 'underworks-shift-roll-found' }, { type: 'faction', factionId: 'border-council', amount: 1 }] },
      ], exits: [
        { id: 'ch05-protect-the-ledger-gallery', targetNodeId: 'ch05-ledger-path-ambush', label: 'Protect the ledger gallery', detail: 'Follow the numbered authorization marks and fight through its evidence wardens before the relay hall.' },
        { id: 'ch05-open-the-worker-cages', targetNodeId: 'ch05-worker-path-rescue', label: 'Open the worker cages', detail: 'Use the hidden shift roll to reach the occupied cages, where a different patrol guards the release levers.' },
      ] },
      { id: 'ch05-ledger-path-ambush', kind: 'combat', encounterVariants: ['enc-ch05-ledger-gallery-watch-a', 'enc-ch05-ledger-gallery-watch-b'], exits: [
        { id: 'ch05-ledger-path-to-recovery', targetNodeId: 'ch05-underworks-bulkhead-rest', label: 'Bind wounds at the bulkhead', detail: 'Spend a moment treating the cuts before the vault sentinel notices the gallery has gone quiet.' },
        { id: 'ch05-ledger-path-rush-sentinel', targetNodeId: 'ch05-vault-gargoyle-sentinel', label: 'Rush the vault sentinel', detail: 'Keep the gallery alarm from spreading, but face the sentinel without a pause to recover.' },
      ] },
      { id: 'ch05-worker-path-rescue', kind: 'combat', encounterVariants: ['enc-ch05-worker-cage-patrol-a', 'enc-ch05-worker-cage-patrol-b'], exits: [
        { id: 'ch05-worker-path-to-recovery', targetNodeId: 'ch05-underworks-bulkhead-rest', label: 'Treat the rescued miners and regroup', detail: 'Let the freed workers help bind wounds before the last guardian turns its firing perch toward them.' },
        { id: 'ch05-worker-path-rush-sentinel', targetNodeId: 'ch05-vault-gargoyle-sentinel', label: 'Reach the sentinel before the alarm', detail: 'Move the workers out quickly, but give up the chance to recover before the vault guardian.' },
      ] },
      { id: 'ch05-underworks-bulkhead-rest', kind: 'rest', rewardVariants: [
        { id: 'ch05-bulkhead-field-dressing', effects: [{ type: 'vitals', health: 36, resource: 2 }, { type: 'flag', operation: 'add', flagId: 'underworks-rested-before-vault' }] },
        { id: 'ch05-bulkhead-focus-tonic', effects: [{ type: 'vitals', health: 24, resource: 4 }, { type: 'flag', operation: 'add', flagId: 'underworks-rested-before-vault' }] },
      ], exits: [
        { id: 'ch05-bulkhead-rest-to-sentinel', targetNodeId: 'ch05-vault-gargoyle-sentinel', label: 'Climb to the vault sentinel', detail: 'The party is steadier now; the sentinel still owns the narrow stair above.' },
      ] },
      { id: 'ch05-vault-gargoyle-sentinel', kind: 'elite', encounterId: 'enc-ch05-vault-gargoyle-elite', exits: [
        { id: 'ch05-enter-the-regulator-vault', targetNodeId: 'ch05-cinder-heart-regulator', label: 'Enter the regulator vault', detail: 'The pressure core is exposed beyond the sentinel; choose your stance before its shutters begin to move.' },
        { id: 'ch05-search-pressure-medic-cache', targetNodeId: 'ch05-underworks-pressure-medic-cache', label: 'Search the pressure medic’s cache', detail: 'Take a short detour through the sentinel’s service bay; sealed tonic and salvage wait behind its armor rack.' },
        { id: 'ch05-withdraw-before-regulator', targetNodeId: 'ch05-underworks-retreat-after-sentinel', label: 'Withdraw with the recovered evidence', detail: 'Carry the docket and worker testimony back to the lift, but leave the regulator running below.' },
      ] },
      { id: 'ch05-underworks-pressure-medic-cache', kind: 'cache', rewardVariants: [
        { id: 'ch05-pressure-medic-tonic', effects: [
          { type: 'vitals', health: 28, resource: 2 },
          { type: 'item', operation: 'grant', itemId: 'consumable-burn-paste', quantity: 2, destination: 'pack' },
          { type: 'gold', scope: 'unbanked', amount: 8 },
          { type: 'flag', operation: 'add', flagId: 'underworks-pressure-medic-cache-opened' },
        ] },
      ], exits: [
        { id: 'ch05-cache-to-regulator', targetNodeId: 'ch05-cinder-heart-regulator', label: 'Descend to the regulator', detail: 'The tonic steadies your hands; the damaged pressure core is still waiting below.' },
      ] },
      { id: 'ch05-cinder-heart-regulator', kind: 'boss', encounterId: 'enc-ch05-cinder-heart-regulator', exits: [
        { id: 'ch05-emerge-at-the-hidden-forge', targetNodeId: 'ch05-underworks-forge-exit', label: 'Reach the hidden forge', detail: 'Secure the engine room and climb into the forge behind the false wall.' },
      ] },
      { id: 'ch05-underworks-forge-exit', kind: 'exit', exitKind: 'complete', sceneId: 'ch05-main-forge-behind-the-wall', exits: [] },
      { id: 'ch05-underworks-retreat-after-lift', kind: 'exit', exitKind: 'retreat', sceneId: 'ch05-journey-the-underworks-retreat', exits: [] },
      { id: 'ch05-underworks-retreat-from-smelter', kind: 'exit', exitKind: 'retreat', sceneId: 'ch05-journey-the-underworks-retreat', exits: [] },
      { id: 'ch05-underworks-retreat-from-quench', kind: 'exit', exitKind: 'retreat', sceneId: 'ch05-journey-the-underworks-retreat', exits: [] },
      { id: 'ch05-underworks-retreat-after-sentinel', kind: 'exit', exitKind: 'retreat', sceneId: 'ch05-journey-the-underworks-retreat', exits: [] },
    ],
  },
  {
    id: 'ch06-chapel-undercroft-holdout', chapterId: 'ch06', startNodeId: 'ch06-ossuary-entry',
    exitNodeIds: ['ch06-chapel-holdout-return'],
    nodes: [
      { id: 'ch06-ossuary-entry', kind: 'scene', sceneId: 'ch06-journey-the-chapel-ossuary', exits: [
        { id: 'ch06-cut-through-the-cell-stair', targetNodeId: 'ch06-ossuary-bell-jailers', label: 'Break through the cell stair', detail: 'Reach the hostage keys quickly, but the bell keepers have a clear line down the narrow steps.' },
        { id: 'ch06-climb-to-the-novice', targetNodeId: 'ch06-novice-bell-loft', label: 'Reach the trapped novice first', detail: 'Use the archive roof to bring a frightened bell novice down before the defenders regroup.' },
      ] },
      { id: 'ch06-ossuary-bell-jailers', kind: 'combat', encounterId: 'enc-ch06-ossuary-bell-jailers', exits: [
        { id: 'ch06-hold-the-undercroft', targetNodeId: 'ch06-undercroft-holdout', label: 'Hold the undercroft passage', detail: 'Keep the rescued witnesses behind the cracked arch while the siege line shifts above.' },
      ] },
      { id: 'ch06-novice-bell-loft', kind: 'scene', sceneId: 'ch06-journey-the-novice-in-the-bell-loft', exits: [
        { id: 'ch06-bring-the-novice-to-the-holdout', targetNodeId: 'ch06-undercroft-holdout', label: 'Bring the novice to the holdout', detail: 'Guide her down the archive stair before the bell crew can signal another patrol.' },
      ] },
      { id: 'ch06-undercroft-holdout', kind: 'hazard', exits: [
        { id: 'ch06-stabilize-the-wounded-stair', targetNodeId: 'ch06-undercroft-recovery', label: 'Stabilize the wounded stair', detail: 'Spend a few minutes treating the rescued before the next push reaches the chapel door.' },
        { id: 'ch06-barricade-the-service-arch', targetNodeId: 'ch06-service-arch-supplies', label: 'Barricade the service arch', detail: 'Take the stored brace kit and keep moving, leaving no time for a full recovery.' },
      ] },
      { id: 'ch06-undercroft-recovery', kind: 'rest', rewardVariants: [
        { id: 'ch06-chapel-bandages', effects: [{ type: 'vitals', health: 7 }, { type: 'flag', operation: 'add', flagId: 'chapel-wounded-stabilized' }] },
        { id: 'ch06-chapel-water-and-wraps', effects: [{ type: 'vitals', health: 4, resource: 2 }, { type: 'flag', operation: 'add', flagId: 'chapel-wounded-stabilized' }] },
      ], exits: [
        { id: 'ch06-stand-against-the-bell-sentinel', targetNodeId: 'ch06-bell-loft-sentinel', label: 'Stand against the bell sentinel', detail: 'The last signal guard is already moving toward the hostage stair.' },
      ] },
      { id: 'ch06-service-arch-supplies', kind: 'cache', rewardVariants: [
        { id: 'ch06-chapel-brace-kit', effects: [{ type: 'gold', scope: 'unbanked', amount: 12 }, { type: 'vitals', resource: 2 }, { type: 'flag', operation: 'add', flagId: 'chapel-service-arch-braced' }] },
      ], exits: [
        { id: 'ch06-press-past-the-sentinel', targetNodeId: 'ch06-bell-loft-sentinel', label: 'Press past the sentinel', detail: 'Carry the brace kit into the bell stair and stop the next alarm before it reaches the west wall.' },
      ] },
      { id: 'ch06-bell-loft-sentinel', kind: 'elite', encounterId: 'enc-ch06-bell-loft-sentinel', exits: [
        { id: 'ch06-return-with-the-hostages', targetNodeId: 'ch06-chapel-holdout-return', label: 'Return to the siege line', detail: 'Bring the rescued people and the undercroft report back to Greywatch’s defenders.' },
      ] },
      { id: 'ch06-chapel-holdout-return', kind: 'exit', exitKind: 'complete', sceneId: 'ch06-main-the-siege-begins', exits: [] },
    ],
  },
  {
    id: 'ch07-aqueduct-compact-archive', chapterId: 'ch07', startNodeId: 'ch07-keep-ridge-entry',
    exitNodeIds: ['ch07-return-to-the-crownless-gate'],
    nodes: [
      { id: 'ch07-keep-ridge-entry', kind: 'scene', sceneId: 'ch07-journey-beneath-the-keep-ridge', exits: [
        { id: 'ch07-read-the-waterline', targetNodeId: 'ch07-aqueduct-route-choice', label: 'Read the waterline', detail: 'The dry channel reaches an archive stair, but the upper crossing and lower sluice demand different risks.' },
      ] },
      { id: 'ch07-aqueduct-route-choice', kind: 'hazard', exits: [
        { id: 'ch07-cross-the-upper-aqueduct', targetNodeId: 'ch07-aqueduct-crossbow-watch', label: 'Cross the upper aqueduct', detail: 'Move quickly over the open channel and fight the keep patrol before it can close the archive stair.' },
        { id: 'ch07-lower-the-silt-sluice', targetNodeId: 'ch07-aqueduct-ledger-cache', label: 'Lower the silt sluice', detail: 'Take longer to quiet the water, avoid the first patrol, and search its abandoned watch ledger.' },
      ] },
      { id: 'ch07-aqueduct-crossbow-watch', kind: 'combat', encounterId: 'enc-ch07-aqueduct-crossbow-patrol', exits: [
        { id: 'ch07-reach-the-compact-wardens-fast', targetNodeId: 'ch07-compact-archive-wardens', label: 'Reach the compact wardens', detail: 'The open route saved time, but the archive sentries heard the fight above.' },
      ] },
      { id: 'ch07-aqueduct-ledger-cache', kind: 'cache', rewardVariants: [
        { id: 'ch07-copy-the-duplicate-watch-roll', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'keep-duplicate-patrol-roll' }, { type: 'flag', operation: 'add', flagId: 'aqueduct-watch-roll-copied' }, { type: 'threat', amount: -1 }] },
        { id: 'ch07-recover-the-keep-patrol-sketch', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'keep-patrol-sketch' }, { type: 'flag', operation: 'add', flagId: 'aqueduct-watch-roll-copied' }] },
      ], exits: [
        { id: 'ch07-enter-the-compact-archive-slowly', targetNodeId: 'ch07-compact-archive-wardens', label: 'Enter the compact archive', detail: 'The recovered patrol record reveals the guard rotation, though the silt route cost precious minutes.' },
      ] },
      { id: 'ch07-compact-archive-wardens', kind: 'elite', encounterId: 'enc-ch07-compact-archive-wardens', exits: [
        { id: 'ch07-rejoin-at-the-crownless-gate', targetNodeId: 'ch07-return-to-the-crownless-gate', label: 'Rejoin the column', detail: 'Bring the records or the remaining patrol detail back to the gate approach.' },
      ] },
      { id: 'ch07-return-to-the-crownless-gate', kind: 'exit', exitKind: 'complete', sceneId: 'ch07-combat-the-counterweight-house', exits: [] },
    ],
  },
  {
    id: 'ch08-engine-service-galleries', chapterId: 'ch08', startNodeId: 'ch08-audit-voss-promises',
    exitNodeIds: ['ch08-service-gallery-extract', 'ch08-engine-control-exit'],
    nodes: [
      { id: 'ch08-audit-voss-promises', kind: 'scene', sceneId: 'ch08-journey-audit-voss-grain-promises', exits: [
        { id: 'ch08-slip-into-the-service-gallery', targetNodeId: 'ch08-engine-gallery-watch', label: 'Slip into the service gallery', detail: 'Follow the grain ledger below the command platform, where the engine crew still guards its pressure controls.' },
      ] },
      { id: 'ch08-engine-gallery-watch', kind: 'combat', encounterId: 'enc-ch08-engine-gallery-watch', exits: [
        { id: 'ch08-reach-the-control-fork', targetNodeId: 'ch08-control-gallery-fork', label: 'Reach the control fork', detail: 'The guards are down, but the service stair and deeper control room are both still open.' },
      ] },
      { id: 'ch08-control-gallery-fork', kind: 'hazard', exits: [
        { id: 'ch08-extract-by-the-service-stair', targetNodeId: 'ch08-service-gallery-extract', label: 'Extract by the service stair', detail: 'Leave before the platform locks down; the engine remains active and its control ledger stays below.' },
        { id: 'ch08-push-to-the-regulator-room', targetNodeId: 'ch08-regulator-control-crew', label: 'Push to the regulator room', detail: 'Risk one more guard line to copy the engine controls before the final confrontation.' },
      ] },
      { id: 'ch08-regulator-control-crew', kind: 'combat', encounterId: 'enc-ch08-regulator-control-crew', exits: [
        { id: 'ch08-copy-the-pressure-ledger', targetNodeId: 'ch08-pressure-ledger-cache', label: 'Copy the pressure ledger', detail: 'Secure the brake sequence while the remaining platform guard tries to restart the press.' },
      ] },
      { id: 'ch08-pressure-ledger-cache', kind: 'cache', rewardVariants: [
        { id: 'ch08-seal-the-engine-control-copy', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'saved-voss-dispatches' }, { type: 'flag', operation: 'add', flagId: 'engine-pressure-schematic-copied' }] },
        { id: 'ch08-copy-the-brake-order', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'private-ledger-receiving-line' }, { type: 'flag', operation: 'add', flagId: 'engine-pressure-schematic-copied' }, { type: 'threat', amount: -1 }] },
      ], exits: [
        { id: 'ch08-withdraw-under-the-platform', targetNodeId: 'ch08-under-platform-withdrawal', label: 'Withdraw under the platform', detail: 'Use the service cutout to return with the copied sequence before the hall doors close.' },
      ] },
      { id: 'ch08-under-platform-withdrawal', kind: 'scene', sceneId: 'ch08-journey-beneath-the-command-platform', exits: [
        { id: 'ch08-return-with-the-control-ledger', targetNodeId: 'ch08-engine-control-exit', label: 'Return with the control ledger', detail: 'The engine crew has lost its pressure schedule; the final confrontation can begin on your terms.' },
      ] },
      { id: 'ch08-service-gallery-extract', kind: 'exit', exitKind: 'extract', sceneId: 'ch08-combat-the-coronation-engine', exits: [] },
      { id: 'ch08-engine-control-exit', kind: 'exit', exitKind: 'complete', sceneId: 'ch08-combat-the-coronation-engine', exits: [] },
    ],
  },
] satisfies readonly AuthoredContent<DungeonDefinition>[];

export const CHRONICLE1_DUNGEONS = AUTHORED_CHRONICLE1_DUNGEONS as unknown as readonly DungeonDefinition[];
