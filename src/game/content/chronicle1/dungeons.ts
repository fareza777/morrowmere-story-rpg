import type { DungeonDefinition } from '../../dungeon/types';

/** Compact authored delves reuse the chapter's existing illustrated scenes and encounters. */
export const CHRONICLE1_DUNGEONS: readonly DungeonDefinition[] = [
  {
    id: 'ch01-tollhouse-culvert', chapterId: 'ch01', startNodeId: 'ch01-cellar-stair', exitNodeIds: ['ch01-orchard-emergence'],
    nodes: [
      { id: 'ch01-cellar-stair', kind: 'scene', sceneId: 'ch01-journey-the-tollhouse-cellar', exits: [
        { id: 'ch01-follow-boot-scrapes', targetNodeId: 'ch01-tollhouse-lookouts', label: 'Follow the boot scrapes', detail: 'Descend through the cellar and meet whoever still guards the orchard culvert.' },
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
        { id: 'ch05-take-a-breather', targetNodeId: 'ch05-underworks-rest-niche', label: 'Rest in the valve niche', detail: 'Catch your breath beside the cooling pipes and restore the resource your chosen run currently lacks.' },
        { id: 'ch05-claim-the-supply-crate', targetNodeId: 'ch05-underworks-supply-cache', label: 'Take the sealed supply crate', detail: 'Keep moving without a full rest, but recover a small reserve for the final pressure rooms.' },
      ] },
      { id: 'ch05-underworks-rest-niche', kind: 'rest', rewardVariants: [
        { id: 'ch05-rest-water-and-bandage', effects: [{ type: 'vitals', health: 8, resource: 1 }, { type: 'flag', operation: 'add', flagId: 'underworks-rested-at-valve' }] },
        { id: 'ch05-rest-focus-tonic', effects: [{ type: 'vitals', health: 3, resource: 4 }, { type: 'flag', operation: 'add', flagId: 'underworks-rested-at-valve' }] },
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
        { id: 'ch05-ledger-path-to-sentinel', targetNodeId: 'ch05-vault-gargoyle-sentinel', label: 'Press on to the sentinel', detail: 'Keep the authorization rubbing dry as the final vault guardian wakes beyond the relay arch.' },
      ] },
      { id: 'ch05-worker-path-rescue', kind: 'combat', encounterVariants: ['enc-ch05-worker-cage-patrol-a', 'enc-ch05-worker-cage-patrol-b'], exits: [
        { id: 'ch05-worker-path-to-sentinel', targetNodeId: 'ch05-vault-gargoyle-sentinel', label: 'Press on to the sentinel', detail: 'Get the freed shift behind the bulkhead before the last guardian turns its firing perch toward them.' },
      ] },
      { id: 'ch05-vault-gargoyle-sentinel', kind: 'elite', encounterId: 'enc-ch05-vault-gargoyle-elite', exits: [
        { id: 'ch05-enter-the-regulator-vault', targetNodeId: 'ch05-cinder-heart-regulator', label: 'Enter the regulator vault', detail: 'The pressure core is exposed beyond the sentinel; choose your stance before its shutters begin to move.' },
      ] },
      { id: 'ch05-cinder-heart-regulator', kind: 'boss', encounterId: 'enc-ch05-cinder-heart-regulator', exits: [
        { id: 'ch05-emerge-at-the-hidden-forge', targetNodeId: 'ch05-underworks-forge-exit', label: 'Reach the hidden forge', detail: 'Secure the engine room and climb into the forge behind the false wall.' },
      ] },
      { id: 'ch05-underworks-forge-exit', kind: 'exit', exitKind: 'complete', sceneId: 'ch05-main-forge-behind-the-wall', exits: [] },
      { id: 'ch05-underworks-retreat-after-lift', kind: 'exit', exitKind: 'retreat', sceneId: 'ch05-journey-the-underworks-retreat', exits: [] },
      { id: 'ch05-underworks-retreat-from-smelter', kind: 'exit', exitKind: 'retreat', sceneId: 'ch05-journey-the-underworks-retreat', exits: [] },
      { id: 'ch05-underworks-retreat-from-quench', kind: 'exit', exitKind: 'retreat', sceneId: 'ch05-journey-the-underworks-retreat', exits: [] },
    ],
  },
];
