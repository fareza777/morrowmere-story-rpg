import { describe, expect, it } from 'vitest';
import { illustrationFallbackSource } from '../src/components/SceneArt';

describe('semantic scene artwork fallback', () => {
  it.each([
    [
      'scene-ch01-journey-the-wagonwrights-mile',
      '/assets/chronicle1/hubs/three-roads-crossroads.webp',
    ],
    [
      'scene-ch01-companion-mara-measures-the-road',
      '/assets/chronicle1/hubs/three-roads-crossroads.webp',
    ],
    [
      'scene-ch01-hub-first-night-camp',
      '/assets/chronicle1/hubs/road-camp-morning.webp',
    ],
    [
      'scene-ch01-combat-smoke-on-the-bridge',
      '/assets/chronicle1/scenes/ch01/scene-ch01-main-the-bridge-in-smoke.webp',
    ],
    [
      'scene-ch02-combat-ladders-on-the-north-wall',
      '/assets/chronicle1/scenes/ch02/scene-ch02-main-raiders-at-the-wall.webp',
    ],
    [
      'scene-ch05-combat-the-black-banner-forgemaster',
      '/assets/chronicle1/scenes/ch05/scene-ch05-main-forge-behind-the-wall.webp',
    ],
    [
      'scene-ch06-journey-the-siege-route-map',
      '/assets/chronicle1/scenes/ch06/scene-ch06-main-the-siege-begins.webp',
    ],
    [
      'scene-ch08-journey-audit-the-custodian-inventory',
      '/assets/chronicle1/scenes/ch08/scene-ch08-main-evidence-before-the-realm.webp',
    ],
    [
      'scene-ch08-journey-through-the-lower-ward',
      '/assets/chronicle1/scenes/ch08/scene-ch08-main-who-keeps-the-crownless-keep.webp',
    ],
  ])('maps %s to the closest existing artwork', (illustrationId, expectedSource) => {
    expect(illustrationFallbackSource(illustrationId)).toBe(expectedSource);
  });

  it('uses the chapter establishing artwork when no semantic cue matches', () => {
    expect(illustrationFallbackSource('scene-ch05-unclassified-moment')).toBe(
      '/assets/chronicle1/scenes/ch05/scene-ch05-main-the-mouth-of-embervault.webp',
    );
  });

  it('does not retry the same authored asset after that asset fails to load', () => {
    expect(illustrationFallbackSource('scene-ch05-main-the-mouth-of-embervault')).toBe(
      '/assets/chronicle1/scenes/ch05/scene-ch05-main-forge-behind-the-wall.webp',
    );
  });

  it('uses the lone-traveller road artwork when the chapter cannot be identified', () => {
    expect(illustrationFallbackSource('scene-unknown-unclassified-moment')).toBe(
      '/assets/chronicle1/hubs/three-roads-crossroads.webp',
    );
  });
});
