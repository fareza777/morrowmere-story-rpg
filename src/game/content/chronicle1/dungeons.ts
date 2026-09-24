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
];
