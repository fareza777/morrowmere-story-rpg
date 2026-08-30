import type { RegionId } from '../game/types';

const REGION_LABELS: Record<RegionId, string> = {
  gloamwood: 'Gloamwood Verge',
  'drowned-road': 'The Drowned Road',
  embervault: 'Embervault',
  'crownless-keep': 'The Crownless Keep',
};

interface SceneArtProps {
  readonly region: RegionId;
  readonly sceneKey: string;
  readonly enemyArtFamily?: string;
}

export function SceneArt({ region, sceneKey, enemyArtFamily }: SceneArtProps) {
  const source = enemyArtFamily
    ? `/assets/enemies/${enemyArtFamily}.webp`
    : `/assets/backgrounds/${region}.webp`;
  return (
    <figure className={`scene-art scene-${region}`} data-scene-key={sceneKey}>
      <img src={source} alt={enemyArtFamily ? `A ${enemyArtFamily} adversary` : `The dark road through ${REGION_LABELS[region]}`} />
      <div className="scene-scrim" aria-hidden="true" />
    </figure>
  );
}
