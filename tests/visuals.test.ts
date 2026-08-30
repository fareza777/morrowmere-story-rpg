import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ENEMIES } from '../src/game/content/enemies';
import {
  BACKGROUND_VARIANT_COUNT,
  composeSceneVisual,
  enumerateBackgroundVariants,
} from '../src/game/visuals';

describe('procedural visual compositor', () => {
  it('offers at least 300 deterministic background combinations', () => {
    const variants = enumerateBackgroundVariants();
    expect(BACKGROUND_VARIANT_COUNT).toBeGreaterThanOrEqual(300);
    expect(variants).toHaveLength(BACKGROUND_VARIANT_COUNT);
    expect(new Set(variants.map((variant) => variant.visualKey)).size).toBe(BACKGROUND_VARIANT_COUNT);
  });

  it('maps every bestiary entry to a distinct visual treatment', () => {
    const treatments = ENEMIES.map((enemy) => composeSceneVisual({
      region: enemy.region,
      sceneKey: enemy.id,
      enemyId: enemy.id,
      enemyArtFamily: enemy.artFamily,
    }));

    expect(treatments).toHaveLength(200);
    expect(new Set(treatments.map((treatment) => treatment.visualKey)).size).toBe(200);
    expect(treatments.every((treatment) => treatment.enemySource?.endsWith('.webp'))).toBe(true);
  });

  it('returns identical composition values for the same scene key', () => {
    const input = { region: 'embervault' as const, sceneKey: 'furnace|magus|cinders|red' };
    expect(composeSceneVisual(input)).toEqual(composeSceneVisual(input));
  });

  it('ships every visual source referenced by the compositor', () => {
    const sources = new Set(ENEMIES.flatMap((enemy) => {
      const visual = composeSceneVisual({ region: enemy.region, sceneKey: enemy.id, enemyId: enemy.id, enemyArtFamily: enemy.artFamily });
      return [visual.backgroundSource, visual.enemySource];
    }).filter(Boolean));
    sources.add('/assets/backgrounds/title.webp');
    sources.add('/assets/icons/app-icon.webp');

    expect([...sources].every((source) => existsSync(join(process.cwd(), 'public', source as string)))).toBe(true);
  });
});
