import type { CSSProperties } from 'react';
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
  const style = {
    '--scene-x': visual.objectPosition.split(' ')[0],
    '--scene-y': visual.objectPosition.split(' ')[1],
    '--scene-scale': visual.scale,
    '--scene-mirror': visual.mirror ? -1 : 1,
    '--scene-hue': `${visual.hue}deg`,
    '--scene-contrast': visual.contrast,
  } as CSSProperties;
  return (
    <figure className={`scene-art scene-${region}`} data-scene-key={visual.visualKey} data-weather={visual.weather} data-lighting={visual.lighting} style={style}>
      <img src={visual.enemySource ?? visual.backgroundSource} alt={visual.enemySource ? visual.alt : `The dark road through ${REGION_LABELS[region]}`} />
      <div className="scene-scrim" aria-hidden="true" />
    </figure>
  );
}
