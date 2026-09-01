import { describe, expect, it } from 'vitest';
import { CH01_SCENES } from '../src/game/content/chronicle1/chapters/ch01';

const scene = (id: string) => CH01_SCENES.find((candidate) => candidate.id === id)!;
const next = (sceneId: string, choiceId: string) => {
  const choice = scene(sceneId).choices.find((candidate) => candidate.id === choiceId)!;
  return 'check' in choice ? choice.check.success.nextSceneId : choice.nextSceneId;
};

describe('Chapter 1 living encounter seams', () => {
  it('joins departure through Mara and the tollhouse search fork', () => {
    expect(next('ch01-main-three-days-to-greywatch', 'ch01-choice-inspect-the-wagons')).toBe('ch01-living-bent-axle-setup');
    expect(next('ch01-main-medicine-for-the-north', 'ch01-choice-brace-the-medicine-cases')).toBe('ch01-living-hooves-chalk-setup');
    expect(next('ch01-living-hooves-chalk-aftermath', 'ch01-choice-mark-the-paired-tracks')).toBe('ch01-living-cut-milestone-setup');
    expect(next('ch01-living-birch-marks-aftermath', 'ch01-choice-approach-tollhouse-under-cover')).toBe('ch01-main-the-empty-tollhouse');
    expect(next('ch01-main-the-empty-tollhouse', 'ch01-choice-search-the-tollhouse')).toBe('ch01-living-bell-wire-setup');
    expect(next('ch01-living-below-desk-aftermath', 'ch01-choice-seal-the-tollhouse-evidence')).toBe('ch01-living-smoke-verge-setup');
  });

  it('joins the bypass route and queues the mandatory orchard aftermath before the bridge', () => {
    expect(next('ch01-main-the-empty-tollhouse', 'ch01-choice-push-the-wagons-through')).toBe('ch01-living-snared-scout-setup');
    expect(next('ch01-living-snared-scout-aftermath', 'ch01-choice-carry-halen-with-the-convoy')).toBe('ch01-living-smoke-verge-setup');
    expect(next('ch01-main-the-first-arrow', 'ch01-choice-cover-jory-and-the-dispatch')).toBe('ch01-living-split-fletched-arrow-setup');
    expect(next('ch01-living-split-fletched-arrow-battle', 'ch01-choice-form-around-jory-and-the-teams')).toBe('ch01-living-split-fletched-arrow-aftermath');
    expect(next('ch01-living-split-fletched-arrow-aftermath', 'ch01-choice-preserve-the-split-fletched-arrow')).toBe('ch01-main-the-bridge-in-smoke');
  });
});
