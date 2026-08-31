import { describe, expect, it } from 'vitest';
import { defineScene } from '../../src/game/content/chronicle1/builders';
import {
  CHRONICLE1,
  MAIN_ANCHOR_IDS,
} from '../../src/game/content/chronicle1/chronicle';
import { CHRONICLE1_FACTIONS } from '../../src/game/content/chronicle1/factions';
import { CHRONICLE1_COMPANIONS } from '../../src/game/content/chronicle1/companions';
import { CHRONICLE1_MERCHANTS } from '../../src/game/content/chronicle1/merchants';
import {
  CHRONICLE1_ROUTES,
  CHRONICLE1_ROUTE_OPTIONS,
} from '../../src/game/content/chronicle1/routes';
import { ROUTE_OPTIONS } from '../../src/game/director/pacing';

const EXPECTED_ANCHORS = {
  ch01: [
    'ch01-main-three-days-to-greywatch',
    'ch01-main-medicine-for-the-north',
    'ch01-main-the-empty-tollhouse',
    'ch01-main-the-first-arrow',
    'ch01-main-the-bridge-in-smoke',
    'ch01-main-a-banner-placed-too-neatly',
    'ch01-main-before-the-gates-close',
  ],
  ch02: [
    'ch02-main-warning-before-dawn',
    'ch02-main-raiders-at-the-wall',
    'ch02-main-hold-the-south-gate',
    'ch02-main-the-royal-fletching',
    'ch02-main-the-witness-speaks',
    'ch02-main-greywatch-council',
    'ch02-main-the-hidden-depot',
  ],
  ch03: [
    'ch03-main-orders-for-redwater',
    'ch03-main-the-flooded-mile',
    'ch03-main-the-captured-courier',
    'ch03-main-rukhar-at-the-crossing',
    'ch03-main-evidence-on-both-sides',
    'ch03-main-the-attack-with-two-banners',
    'ch03-main-redwater-in-sight',
  ],
  ch04: [
    'ch04-main-two-armies-one-field',
    'ch04-main-parley-between-lines',
    'ch04-main-the-murdered-scout',
    'ch04-main-orders-written-to-be-found',
    'ch04-main-before-the-first-charge',
    'ch04-main-terms-at-redwater',
    'ch04-main-what-the-river-carried-away',
  ],
  ch05: [
    'ch05-main-the-mouth-of-embervault',
    'ch05-main-the-missing-shift',
    'ch05-main-forge-behind-the-wall',
    'ch05-main-the-quartermasters-ledger',
    'ch05-main-weapons-for-both-armies',
    'ch05-main-the-name-severin-voss',
    'ch05-main-escape-through-the-cinder-shaft',
  ],
  ch06: [
    'ch06-main-smoke-over-greywatch',
    'ch06-main-the-message-that-broke',
    'ch06-main-the-leak-in-the-watch',
    'ch06-main-hostages-under-the-chapel',
    'ch06-main-the-siege-begins',
    'ch06-main-the-last-open-breach',
    'ch06-main-what-remains-of-greywatch',
  ],
  ch07: [
    'ch07-main-council-before-the-march',
    'ch07-main-banners-on-the-kingroad',
    'ch07-main-the-outer-patrol',
    'ch07-main-wall-or-hidden-way',
    'ch07-main-the-crownless-gate',
    'ch07-main-voss-last-champion',
    'ch07-main-inside-the-keep',
  ],
  ch08: [
    'ch08-main-guests-for-a-false-king',
    'ch08-main-the-hall-of-seals',
    'ch08-main-evidence-before-the-realm',
    'ch08-main-voss-offers-order',
    'ch08-main-the-marshal-and-the-banner',
    'ch08-main-who-keeps-the-crownless-keep',
    'ch08-main-the-letter-in-cipher',
  ],
} as const;

describe('Chronicle I metadata', () => {
  it('freezes the exact eight-chapter campaign and all 56 ordered anchor IDs', () => {
    expect(CHRONICLE1).toMatchObject({
      id: 'chronicle-1',
      title: 'Chronicle I — The Black Banner',
    });
    expect(
      CHRONICLE1.chapters.map(({ id, order, title, levelBand, region }) => [
        id,
        order,
        title,
        levelBand.min,
        levelBand.max,
        region,
      ]),
    ).toEqual([
      ['ch01', 1, 'The Greywatch Road', 1, 2, 'gloamwood'],
      ['ch02', 2, 'Raiders at Dawn', 2, 4, 'gloamwood'],
      ['ch03', 3, 'The Drowned Road', 4, 6, 'drowned-road'],
      ['ch04', 4, 'Banners at Redwater', 6, 8, 'drowned-road'],
      ['ch05', 5, 'The Embervault Conspiracy', 8, 10, 'embervault'],
      ['ch06', 6, 'The Broken Oath', 10, 12, 'gloamwood'],
      ['ch07', 7, 'March on Crownless Keep', 12, 14, 'crownless-keep'],
      ['ch08', 8, 'The False Coronation', 14, 15, 'crownless-keep'],
    ]);
    expect(MAIN_ANCHOR_IDS).toEqual(EXPECTED_ANCHORS);
    expect(Object.values(MAIN_ANCHOR_IDS).flat()).toHaveLength(56);
    expect(new Set(Object.values(MAIN_ANCHOR_IDS).flat()).size).toBe(56);
    expect(CHRONICLE1.chapters.map((chapter) => chapter.anchorIds)).toEqual(
      Object.values(EXPECTED_ANCHORS),
    );
    expect(Object.isFrozen(CHRONICLE1)).toBe(true);
    expect(Object.isFrozen(CHRONICLE1.chapters)).toBe(true);
    expect(CHRONICLE1.chapters.every((chapter) => Object.isFrozen(chapter.anchorIds))).toBe(true);
  });

  it('keeps one authoritative route catalog in parity with the core adapter', () => {
    expect(
      CHRONICLE1_ROUTES.map(
        ({ id, danger, recoveryWeight, merchantWeight, companionWeight, relicWeight }) => ({
          id,
          danger,
          recoveryWeight,
          merchantWeight,
          companionWeight,
          relicWeight,
        }),
      ),
    ).toEqual([
      { id: 'kings-road', danger: 1, recoveryWeight: 3, merchantWeight: 3, companionWeight: 1, relicWeight: 0 },
      { id: 'old-forest', danger: 2, recoveryWeight: 2, merchantWeight: 1, companionWeight: 3, relicWeight: 1 },
      { id: 'ruined-pass', danger: 3, recoveryWeight: 1, merchantWeight: 0, companionWeight: 1, relicWeight: 3 },
    ]);
    expect(CHRONICLE1_ROUTE_OPTIONS).toEqual(ROUTE_OPTIONS);
  });

  it('defines the canonical factions and six stable merchant identities', () => {
    expect(CHRONICLE1_FACTIONS.map(({ id, name }) => [id, name])).toEqual([
      ['greywatch', 'Greywatch'],
      ['border-council', 'Border Council'],
      ['free-host', 'Free Host'],
      ['abbey', 'Iron Abbey'],
      ['conclave', 'Pale Conclave'],
      ['black-banner', 'Black Banner'],
    ]);
    expect(CHRONICLE1_FACTIONS.some(({ id }) => id === ('border-peace' as never))).toBe(false);
    expect(
      CHRONICLE1_MERCHANTS.map(({ id, name, stockPoolId, dialogueSetId, illustrationId, restockGateIds }) => ({
        id,
        name,
        stockPoolId,
        dialogueSetId,
        illustrationId,
        restockGateIds,
      })),
    ).toEqual([
      { id: 'road-trader', name: 'Road Trader', stockPoolId: 'stock-road-trader', dialogueSetId: 'dialogue-road-trader', illustrationId: 'merchant-road-trader', restockGateIds: ['ch01-hub-orrens-charcoal-wagon', 'ch03-hub-sella-vains-flatboat'] },
      { id: 'blacksmith', name: 'Blacksmith', stockPoolId: 'stock-blacksmith', dialogueSetId: 'dialogue-blacksmith', illustrationId: 'merchant-blacksmith', restockGateIds: ['ch02-hub-dorrans-wall-forge', 'ch08-hub-orrens-courtyard-forge'] },
      { id: 'apothecary', name: 'Apothecary', stockPoolId: 'stock-apothecary', dialogueSetId: 'dialogue-apothecary', illustrationId: 'merchant-apothecary', restockGateIds: ['ch01-hub-ilenes-field-apothecary', 'ch03-hub-mother-ailsas-reed-clinic', 'ch06-hub-ilene-at-the-south-chapel', 'ch08-hub-ilene-beside-the-witness-gallery'] },
      { id: 'relic-dealer', name: 'Relic Dealer', stockPoolId: 'stock-relic-dealer', dialogueSetId: 'dialogue-relic-dealer', illustrationId: 'merchant-relic-dealer', restockGateIds: ['ch05-hub-omarens-relic-bench'] },
      { id: 'quartermaster', name: 'Quartermaster', stockPoolId: 'stock-quartermaster', dialogueSetId: 'dialogue-quartermaster', illustrationId: 'merchant-quartermaster', restockGateIds: ['ch02-hub-quartermaster-coles-yard', 'ch04-hub-the-neutral-quartermaster', 'ch06-hub-nessa-coles-siege-yard', 'ch07-hub-nessas-march-quartermaster'] },
      { id: 'goblin-broker', name: 'Goblin Broker', stockPoolId: 'stock-goblin-broker', dialogueSetId: 'dialogue-goblin-broker', illustrationId: 'merchant-goblin-broker', restockGateIds: ['ch04-hub-the-nimble-nail-exchange', 'ch05-hub-vekkas-boiler-room-market', 'ch07-hub-brez-at-the-abandoned-tollhouse'] },
    ]);
    expect(CHRONICLE1_COMPANIONS.find(({ id }) => id === 'talla')?.outcomeSceneIds).toEqual([
      'ch08-companion-talla-takes-the-hidden-road',
    ]);
  });

  it('deep-freezes authored scenes without losing Chronicle-only contracts', () => {
    const scene = defineScene({
      id: 'ch01-journey-builder-contract',
      chapterId: 'ch01',
      region: 'gloamwood',
      slot: 99,
      type: 'journey',
      journeySubtype: 'investigation',
      family: 'builder-contract',
      weight: 1,
      pacing: 'quiet',
      illustrationId: 'scene-ch01-journey-builder-contract',
      title: 'Builder Contract',
      narrative: ['A nested authored scene remains immutable.'],
      eligibility: { routes: ['kings-road'], minLevel: 1, maxLevel: 2 },
      requirements: [{ type: 'flag', flagId: 'clue-found' }],
      exclusions: [{ type: 'flag', flagId: 'route-closed', present: true }],
      cooldownRuns: 0,
      oneShot: true,
      followUps: [],
      callbackPromises: [],
      choices: [{
        id: 'ch01-choice-builder-contract',
        label: 'Continue',
        detail: 'Keep the evidence in view.',
        requirements: [{ type: 'flag', flagId: 'clue-found', present: true }],
        exclusions: [{ type: 'flag', flagId: 'clue-spent', present: true }],
        effects: [{ type: 'evidence', operation: 'add', evidenceId: 'builder-proof' }],
        outcome: 'The proof remains legible.',
      }],
      continueOnly: true,
    });

    expect(Object.isFrozen(scene)).toBe(true);
    expect(Object.isFrozen(scene.eligibility)).toBe(true);
    expect(Object.isFrozen(scene.narrative)).toBe(true);
    expect(Object.isFrozen(scene.requirements)).toBe(true);
    expect(Object.isFrozen(scene.requirements?.[0])).toBe(true);
    expect(scene.requirements?.[0]?.present).toBe(true);
    expect(Object.isFrozen(scene.choices[0]?.requirements)).toBe(true);
    expect(Object.isFrozen(scene.choices[0]?.effects[0])).toBe(true);
  });
});
