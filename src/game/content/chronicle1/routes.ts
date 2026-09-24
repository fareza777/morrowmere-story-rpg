import type { ChronicleRouteDefinition } from '../schema';
import type { RouteJunctionDefinition } from '../../dungeon/types';
import type { RouteOption } from '../../director/types';
import { deepFreeze } from './builders';

export const ROUTE_IDS = deepFreeze([
  'kings-road',
  'old-forest',
  'ruined-pass',
] as const);

export const CHRONICLE1_ROUTES = deepFreeze([
  {
    id: 'kings-road',
    label: "The King's Road",
    description: "Built for royal couriers, the broad stone road runs straight across wind-bent fields. Weathered mileposts and fallen statues mark the old kingdom's reach, while broken paving near the river flats slows a loaded wagon.",
    danger: 1,
    recoveryWeight: 3,
    merchantWeight: 3,
    companionWeight: 1,
    relicWeight: 0,
  },
  {
    id: 'old-forest',
    label: 'The Old Forest',
    description: 'Older than the kingdom, the forest closes over narrow paths between ancient oaks and moss-slick roots. Fallen trunks and soft ground make every cart choose its way, while dusk gathers early beneath the canopy.',
    danger: 2,
    recoveryWeight: 2,
    merchantWeight: 1,
    companionWeight: 3,
    relicWeight: 1,
  },
  {
    id: 'ruined-pass',
    label: 'The Ruined Pass',
    description: 'Once the northern road, the pass climbs through bare crags and shattered watchtowers. Loose stone, steep grades, and old switchbacks leave little room for wagons; snow lingers in the shade after the lowlands thaw.',
    danger: 3,
    recoveryWeight: 1,
    merchantWeight: 0,
    companionWeight: 1,
    relicWeight: 3,
  },
] as const) satisfies readonly ChronicleRouteDefinition[];

/** Converts the richer authored route profile into the stable core facade. */
export function toRouteOption(route: ChronicleRouteDefinition): RouteOption {
  return {
    id: route.id,
    label: route.label,
    description: route.description,
    risk: route.danger,
    recoveryBias: route.recoveryWeight,
    merchantBias: route.merchantWeight,
  };
}

export const adaptChronicleRoute = toRouteOption;

export const CHRONICLE1_ROUTE_OPTIONS = deepFreeze(
  CHRONICLE1_ROUTES.map(toRouteOption),
);

/** Junctions interrupt the story only where the party has a concrete route decision. */
export const CHRONICLE1_ROUTE_JUNCTIONS: readonly RouteJunctionDefinition[] = [
  {
    id: 'ch01-tollhouse-crossroads', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 43 }, afterEventId: 'ch01-living-smoke-verge-aftermath',
    options: [
      { id: 'ch01-stay-with-wagons', label: 'Stay with the medicine wagons', detail: 'Keep the load moving toward the orchard while Jory records the abandoned tollhouse.', consequence: 'The missing collector and the cellar remain unsearched; the convoy reaches the first arrow sooner.', kind: 'story', destination: { kind: 'scene', sceneId: 'ch01-main-the-first-arrow' } },
      { id: 'ch01-descend-cellar', label: 'Descend into the tollhouse cellar', detail: 'The key and fresh boot scrape from your search lead below the desk into a short culvert.', consequence: 'Risk a fight beneath the post to recover the thieves\' trail before rejoining the wagons.', kind: 'dungeon', destination: { kind: 'dungeon', dungeonId: 'ch01-tollhouse-culvert' }, requiredFlags: ['tollhouse-searched'] },
    ],
  },
  {
    id: 'ch02-depot-approach', chapterId: 'ch02', position: { chapterId: 'ch02', slot: 35 }, afterEventId: 'ch02-main-greywatch-council',
    options: [
      { id: 'ch02-advance-with-patrol', label: 'Advance with the Greywatch patrol', detail: 'Approach the lime kiln openly with the council\'s soldiers and witnessed orders.', consequence: 'Reach the hidden depot without an underwall detour, but lose surprise.', kind: 'story', destination: { kind: 'scene', sceneId: 'ch02-main-the-hidden-depot' } },
      { id: 'ch02-enter-underwall', label: 'Enter the underwall conduit', detail: 'Take the cooperage drain and choose whether to infiltrate the cistern or confront its guards.', consequence: 'A longer delve through the basin and depot watch may reveal how the raiders entered Greywatch.', kind: 'dungeon', destination: { kind: 'dungeon', dungeonId: 'ch02-underwall-depot' } },
      { id: 'ch02-use-stolen-cloaks', label: 'Use the stolen Greywatch cloaks', detail: 'The uniforms recovered in the tollhouse cellar let your group pass the first underwall watch.', consequence: 'Begin the same depot delve with the patrol less alert, though the disguises cannot survive a close inspection.', kind: 'shortcut', destination: { kind: 'dungeon', dungeonId: 'ch02-underwall-depot' }, requiredFlags: ['stolen-greywatch-cloaks-found'], effects: [{ type: 'threat', amount: -1 }] },
    ],
  },
  {
    id: 'ch03-archive-crossing', chapterId: 'ch03', position: { chapterId: 'ch03', slot: 26 }, afterEventId: 'ch03-main-evidence-on-both-sides',
    options: [
      { id: 'ch03-guard-evidence-ferry', label: 'Guard the evidence ferry', detail: 'Keep the paired cache proof with both escorts as the force moves toward Redwater.', consequence: 'Reach the two-banner attack with the current case secure, leaving the drowned archive unexplored.', kind: 'story', destination: { kind: 'scene', sceneId: 'ch03-main-the-attack-with-two-banners' } },
      { id: 'ch03-search-toll-archive', label: 'Search the flooded toll archive', detail: 'The false freight names point to records below the old crossing; the sluice mechanism still controls its water.', consequence: 'Face the saboteurs, then choose proof from the gears or a dry place to recover before the attack.', kind: 'dungeon', destination: { kind: 'dungeon', dungeonId: 'ch03-flooded-toll-archive' } },
    ],
  },
  {
    id: 'ch04-mill-warehouse', chapterId: 'ch04', position: { chapterId: 'ch04', slot: 21 }, afterEventId: 'ch04-main-orders-written-to-be-found',
    options: [
      { id: 'ch04-hold-the-parley', label: 'Hold the parley line', detail: 'Keep witnesses beside Holt while both commanders inspect the matched orders.', consequence: 'Preserve the public case and reach the first charge without tracing the covert passage.', kind: 'story', destination: { kind: 'scene', sceneId: 'ch04-main-before-the-first-charge' } },
      { id: 'ch04-follow-mill-drains', label: 'Follow the mill drains', detail: 'Trace signal horns and wet boot prints below the warehouses before the false charge can begin.', consequence: 'Fight the arsonists, then choose between locating the missing bakers and recovering the clerk\'s freight proof.', kind: 'dungeon', destination: { kind: 'dungeon', dungeonId: 'ch04-mill-drains-warehouse' } },
      { id: 'ch04-use-sluice-rubbing', label: 'Use the archive sluice rubbing', detail: 'The altered gear marks from the flooded toll archive reveal which drain wheel opens the warehouse tunnel.', consequence: 'Enter the same delve with the water route already mapped and less risk of an ambush.', kind: 'shortcut', destination: { kind: 'dungeon', dungeonId: 'ch04-mill-drains-warehouse' }, requiredFlags: ['archive-sluice-tampering-recorded'], effects: [{ type: 'threat', amount: -1 }] },
    ],
  },
  {
    id: 'ch05-embervault-descent', chapterId: 'ch05', position: { chapterId: 'ch05', slot: 8 }, afterEventId: 'ch05-main-the-missing-shift',
    options: [
      { id: 'ch05-take-the-ore-cart-descent', label: 'Take the ore-cart descent', detail: 'Ride the mine’s marked brake cart toward the lower workshops and stay on the direct route to the forge.', consequence: 'Reach the next story beat without spending strength in the sealed pressure works.', kind: 'story', destination: { kind: 'scene', sceneId: 'ch05-journey-the-ore-cart-descent' } },
      { id: 'ch05-descend-into-the-underworks', label: 'Descend into the Embervault underworks', detail: 'Dessa spots a chain-lift key among the shift records; a sealed pressure network lies below the cages and runs toward the forge.', consequence: 'Choose your passage through a long delve with two recovery routes, branch-specific patrols, two elite sentinels, and a pressure-engine boss; retreat remains possible.', kind: 'dungeon', destination: { kind: 'dungeon', dungeonId: 'ch05-embervault-underworks' } },
    ],
  },
];
