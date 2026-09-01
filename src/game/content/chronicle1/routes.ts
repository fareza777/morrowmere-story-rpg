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
    description: 'Built for royal couriers, its broad stones cross wind-bent fields between weathered mileposts and fallen statues.',
    danger: 1,
    recoveryWeight: 3,
    merchantWeight: 3,
    companionWeight: 1,
    relicWeight: 0,
  },
  {
    id: 'old-forest',
    label: 'The Old Forest',
    description: 'Older than the kingdom, its moss-dark paths wind beneath ancient oaks, a place spoken of softly after dusk.',
    danger: 2,
    recoveryWeight: 2,
    merchantWeight: 1,
    companionWeight: 3,
    relicWeight: 1,
  },
  {
    id: 'ruined-pass',
    label: 'The Ruined Pass',
    description: 'Once the northern road, it climbs between shattered watchtowers and bare crags under a sky that always feels like winter.',
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
