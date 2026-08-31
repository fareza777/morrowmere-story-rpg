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
    description: 'Lower risk, frequent merchants, and reliable recovery.',
    danger: 1,
    recoveryWeight: 3,
    merchantWeight: 3,
    companionWeight: 1,
    relicWeight: 0,
  },
  {
    id: 'old-forest',
    label: 'The Old Forest',
    description: 'Balanced danger with companion and exploration opportunities.',
    danger: 2,
    recoveryWeight: 2,
    merchantWeight: 1,
    companionWeight: 3,
    relicWeight: 1,
  },
  {
    id: 'ruined-pass',
    label: 'The Ruined Pass',
    description: 'High-risk relic hunting with scarce recovery and trade.',
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
