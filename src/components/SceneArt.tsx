import type { RegionId } from '../game/types';
import { composeSceneVisual } from '../game/visuals';

const REGION_LABELS: Record<RegionId, string> = {
  gloamwood: 'Gloamwood Verge',
  'drowned-road': 'The Drowned Road',
  embervault: 'Embervault',
  'crownless-keep': 'The Crownless Keep',
};

interface SceneArtProps {
  readonly region: RegionId;
  readonly sceneKey: string;
  readonly enemyId?: string;
  readonly enemyArtFamily?: string;
}

export function SceneArt({ region, sceneKey, enemyId, enemyArtFamily }: SceneArtProps) {
  const visual = composeSceneVisual({ region, sceneKey, enemyId, enemyArtFamily });
  return (
    <figure className={`scene-art scene-${region}${visual.enemySource ? ' has-enemy' : ''}`} data-scene-key={visual.visualKey}>
      <img src={visual.enemySource ?? visual.backgroundSource} alt={visual.enemySource ? visual.alt : `The road through ${REGION_LABELS[region]}`} />
    </figure>
  );
}
