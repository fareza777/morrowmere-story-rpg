import type { RegionId } from './types';
import { EVENTS } from './content/events';

const REGIONS: readonly RegionId[] = ['gloamwood', 'drowned-road', 'embervault', 'crownless-keep'];
const PLATES_PER_REGION = 3;
const WEATHERS = ['black-rain', 'silver-moths', 'ashfall', 'mist', 'clear'] as const;
const LIGHTING = ['moonless', 'witchlight', 'ember', 'storm', 'dawn'] as const;
const X_POSITIONS = [38, 44, 50, 56, 62] as const;
const Y_POSITIONS = [34, 40, 46, 52, 58] as const;
const EVENT_IDS = new Set(EVENTS.map((event) => event.id));

export const BACKGROUND_VARIANT_COUNT = REGIONS.length * PLATES_PER_REGION * WEATHERS.length * LIGHTING.length;

export interface SceneVisualInput {
  readonly region: RegionId;
  readonly sceneKey: string;
  readonly enemyId?: string;
  readonly enemyArtFamily?: string;
}

export interface SceneVisual {
  readonly visualKey: string;
  readonly backgroundSource: string;
  readonly enemySource?: string;
  readonly plate: number;
  readonly weather: typeof WEATHERS[number];
  readonly lighting: typeof LIGHTING[number];
  readonly objectPosition: string;
  readonly scale: number;
  readonly mirror: boolean;
  readonly hue: number;
  readonly contrast: number;
  readonly alt: string;
}

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeVisual(
  region: RegionId,
  plate: number,
  weatherIndex: number,
  lightingIndex: number,
  identity: string,
  enemyId?: string,
  enemyArtFamily?: string,
): SceneVisual {
  const hash = hashText(identity);
  const weather = WEATHERS[weatherIndex];
  const lighting = LIGHTING[lightingIndex];
  const treatment = enemyId ? `enemy:${enemyId}` : `background:${region}:${plate}:${weather}:${lighting}`;
  const sceneId = identity.split('|')[0] ?? '';
  return {
    visualKey: treatment,
    backgroundSource: EVENT_IDS.has(sceneId) ? `/assets/events/${sceneId}.webp` : `/assets/backgrounds/${region}.webp`,
    ...(enemyArtFamily ? { enemySource: `/assets/enemies/${enemyArtFamily}.webp` } : {}),
    plate,
    weather,
    lighting,
    objectPosition: `${X_POSITIONS[(hash >>> 3) % X_POSITIONS.length]}% ${Y_POSITIONS[(hash >>> 7) % Y_POSITIONS.length]}%`,
    scale: 1 + ((hash >>> 11) % 7) / 100,
    mirror: ((hash >>> 16) & 1) === 1,
    hue: ((hash >>> 18) % 13) - 6,
    contrast: 1.02 + ((hash >>> 23) % 9) / 100,
    alt: enemyArtFamily
      ? `${enemyArtFamily[0].toUpperCase()}${enemyArtFamily.slice(1)} adversary in ${region.replaceAll('-', ' ')}`
      : `The dark road through ${region.replaceAll('-', ' ')}`,
  };
}

export function composeSceneVisual(input: SceneVisualInput): SceneVisual {
  const hash = hashText(`${input.region}|${input.sceneKey}|${input.enemyId ?? ''}`);
  return makeVisual(
    input.region,
    hash % PLATES_PER_REGION,
    (hash >>> 5) % WEATHERS.length,
    (hash >>> 10) % LIGHTING.length,
    `${input.sceneKey}|${input.enemyId ?? ''}`,
    input.enemyId,
    input.enemyArtFamily,
  );
}

export function enumerateBackgroundVariants(): readonly SceneVisual[] {
  return REGIONS.flatMap((region) => Array.from({ length: PLATES_PER_REGION }, (_, plate) =>
    WEATHERS.flatMap((_, weatherIndex) => LIGHTING.map((__, lightingIndex) =>
      makeVisual(region, plate, weatherIndex, lightingIndex, `${region}|${plate}|${weatherIndex}|${lightingIndex}`),
    )),
  ).flat());
}
