import type { ChronicleRouteDefinition } from '../schema';
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
