import { describe, expect, it } from 'vitest';
import { CH01_SCENES } from '../../src/game/content/chronicle1/chapters/ch01';
import { CHRONICLE1_ENCOUNTERS } from '../../src/game/content/chronicle1/enemies';

describe('Chapter 1 living encounter packets 1 through 9', () => {
  it('adds the exact 27 early-road scenes and their two new encounters', () => {
    const living = CH01_SCENES.filter((scene) => scene.id.startsWith('ch01-living-'));
    expect(living).toHaveLength(27);
    expect(CH01_SCENES).toHaveLength(68);
    expect(CHRONICLE1_ENCOUNTERS.filter((encounter) => encounter.id.startsWith('enc-ch01-'))).toContainEqual(
      expect.objectContaining({ id: 'enc-ch01-verge-signalers', reward: expect.objectContaining({ xp: 34, gold: 16 }) }),
    );
    expect(CHRONICLE1_ENCOUNTERS).toContainEqual(
      expect.objectContaining({ id: 'enc-ch01-tollhouse-cellar', reward: expect.objectContaining({ itemChoices: ['consumable-lamp-oil'] }) }),
    );
  });

  it('keeps Mara an unrecruited road contact and uses the approved gold gate', () => {
    const meeting = CH01_SCENES.find((scene) => scene.id === 'ch01-living-cut-milestone-setup')!;
    expect(meeting.choices.flatMap((choice) => 'effects' in choice ? choice.effects : [])).not.toContainEqual(
      expect.objectContaining({ type: 'companion', operation: 'recruit' }),
    );
    const axle = CH01_SCENES.find((scene) => scene.id === 'ch01-living-bent-axle-setup')!;
    expect(axle.choices.find((choice) => choice.id === 'ch01-choice-send-for-an-axle-fitting')).toMatchObject({
      requirements: [{ type: 'gold', scope: 'banked', amount: 6 }],
    });
  });
});
