import { describe, expect, it } from 'vitest';
import type { CompanionId } from '../../src/game/domain/ids';
import type { CampaignState } from '../../src/game/state/types';
import {
  CHRONICLE1_ENDINGS,
  CHRONICLE1_EPILOGUE_FRAGMENTS,
  resolveChronicle1Ending,
} from '../../src/game/content/chronicle1/endings';

const COMPANION_IDS = ['mara', 'rukhar', 'caldus', 'lyra', 'talla'] as const;

interface CampaignOptions {
  readonly evidence?: number;
  readonly flags?: readonly string[];
  readonly loyalCompanions?: readonly typeof COMPANION_IDS[number][];
  readonly factions?: Readonly<Record<string, number>>;
}

function campaignWith(options: CampaignOptions = {}): CampaignState {
  const loyal = new Set(options.loyalCompanions ?? []);
  return {
    seed: 81,
    chapterId: 'ch08',
    heroName: 'Rowan',
    hero: { heroClass: 'warden', level: 15, xp: 5950, talents: [] },
    inventory: {
      pack: [], stash: [], questItems: [],
      equipment: { weapon: null, armor: null, charms: [] },
    },
    bankedGold: 40,
    flags: [...(options.flags ?? [])],
    evidence: Array.from({ length: options.evidence ?? 0 }, (_, index) => `ending-proof-${index + 1}`),
    factions: options.factions ?? { greywatch: 0, 'border-council': 0, 'free-host': 0 },
    encounterFamilyVictories: {},
    companions: {
      records: COMPANION_IDS.map((companionId) => ({
        companionId: companionId as CompanionId,
        status: loyal.has(companionId) ? 'recruited' as const : 'left' as const,
        questStage: 3 as const,
        loyalty: loyal.has(companionId) ? 80 : 20,
        injured: false,
      })),
      activeCompanionId: null,
    },
    directorMemory: { rngState: 81, seenEventIds: [], familyCooldowns: {}, pendingCallbacks: [] },
    attemptCounters: { ch01: 0, ch02: 0, ch03: 0, ch04: 0, ch05: 0, ch06: 0, ch07: 0, ch08: 0 },
    routeSeedNonce: 0,
    transitionCounter: 0,
  };
}

const STABLE_VICTORY = [
  'voss-exposed',
  'war-mechanism-dismantled',
  'border-war-stopped',
] as const;

describe('Chronicle I endings', () => {
  it('publishes four ordered endings and the exact 24-fragment category budget', () => {
    expect(CHRONICLE1_ENDINGS.map((ending) => ending.id)).toEqual([
      'the-banner-broken',
      'the-iron-peace',
      'council-of-the-road',
      'the-war-without-end',
    ]);
    expect(CHRONICLE1_ENDINGS.every((ending) => ending.title.trim() && ending.paragraphs.every((paragraph) => paragraph.trim()))).toBe(true);

    expect(CHRONICLE1_EPILOGUE_FRAGMENTS).toHaveLength(24);
    expect(new Set(CHRONICLE1_EPILOGUE_FRAGMENTS.map((fragment) => fragment.id)).size).toBe(24);
    expect(Object.fromEntries(
      ['greywatch', 'companion', 'faction', 'custodian', 'truth', 'medicine', 'patron'].map((category) => [
        category,
        CHRONICLE1_EPILOGUE_FRAGMENTS.filter((fragment) => fragment.category === category).length,
      ]),
    )).toEqual({ greywatch: 4, companion: 10, faction: 3, custodian: 4, truth: 1, medicine: 1, patron: 1 });
  });

  it.each([
    {
      label: 'Council outranks force when strong evidence, peace, and coalition all survive',
      evidence: 5,
      flags: [...STABLE_VICTORY, 'border-peace', 'coalition-formed', 'forceful-settlement'],
      endingId: 'council-of-the-road',
    },
    {
      label: 'forceful victory outranks the ordinary broken-banner settlement',
      evidence: 5,
      flags: [...STABLE_VICTORY, 'forceful-settlement'],
      endingId: 'the-iron-peace',
    },
    {
      label: 'an accountable non-forceful victory breaks the banner',
      evidence: 3,
      flags: [...STABLE_VICTORY],
      endingId: 'the-banner-broken',
    },
    {
      label: 'open war defeats otherwise strong coalition state',
      evidence: 8,
      flags: ['voss-exposed', 'war-mechanism-dismantled', 'border-peace', 'coalition-formed', 'forceful-settlement', 'open-war', 'failed-accountability'],
      endingId: 'the-war-without-end',
    },
    {
      label: 'one clue cannot turn the final choice into a victory',
      evidence: 1,
      flags: [...STABLE_VICTORY, 'forceful-settlement'],
      endingId: 'the-war-without-end',
    },
  ])('resolves $label', ({ evidence, flags, endingId }) => {
    expect(resolveChronicle1Ending(campaignWith({ evidence, flags })).endingId).toBe(endingId);
  });

  it('selects state fragments in a stable category order and appends one restrained patron hook', () => {
    const campaign = campaignWith({
      evidence: 6,
      flags: [
        ...STABLE_VICTORY,
        'border-peace',
        'coalition-formed',
        'greywatch-held',
        'keep-border-council',
        'civilian-medicine-delivered',
      ],
      loyalCompanions: ['mara', 'caldus', 'talla'],
      factions: { greywatch: 3, 'border-council': 10, 'free-host': 5 },
    });

    const first = resolveChronicle1Ending(campaign);
    const second = resolveChronicle1Ending(campaign);

    expect(first).toEqual(second);
    expect(first.epilogueFragmentIds).toEqual([
      'greywatch-held-the-bells-return',
      'mara-loyal-a-watch-of-her-own',
      'rukhar-estranged-an-oath-unfinished',
      'caldus-loyal-the-open-infirmary',
      'lyra-estranged-the-closed-ledger',
      'talla-loyal-keys-to-the-hidden-roads',
      'faction-border-council-charter',
      'custodian-border-council',
      'truth-the-complete-public-record',
      'medicine-the-wagons-finish-the-road',
      'patron-the-first-fracture-letter',
    ]);
    expect(first.epilogueFragmentIds.filter((id) => id.startsWith('patron-'))).toHaveLength(1);
    expect(first.epilogueFragmentIds.at(-1)).toBe('patron-the-first-fracture-letter');
    expect(first.paragraphs.length).toBeGreaterThan(first.epilogueFragmentIds.length);
    expect(first.paragraphs.every((paragraph) => paragraph.trim().length > 0)).toBe(true);
  });

  it('covers the Greywatch, peace, coalition, and companion outcome matrix without unstable selection', () => {
    const greywatchCases = [
      { flags: ['greywatch-held'], fragmentId: 'greywatch-held-the-bells-return' },
      { flags: ['greywatch-damaged'], fragmentId: 'greywatch-damaged-stone-by-stone' },
      { flags: ['greywatch-fallen', 'greywatch-survivors-organized'], fragmentId: 'greywatch-fallen-survivors-on-the-road' },
      { flags: ['greywatch-fallen'], fragmentId: 'greywatch-scattered-no-wall-to-return-to' },
    ] as const;

    for (const greywatch of greywatchCases) {
      for (const borderPeace of [false, true]) {
        for (const coalition of [false, true]) {
          for (const maraLoyal of [false, true]) {
            const flags = [
              ...STABLE_VICTORY,
              ...greywatch.flags,
              'keep-neutral-wardens',
              ...(borderPeace ? ['border-peace'] : []),
              ...(coalition ? ['coalition-formed'] : []),
            ];
            const resolution = resolveChronicle1Ending(campaignWith({
              evidence: 5,
              flags,
              loyalCompanions: maraLoyal ? ['mara'] : [],
            }));

            expect(resolution.endingId).toBe(borderPeace && coalition ? 'council-of-the-road' : 'the-banner-broken');
            expect(resolution.epilogueFragmentIds).toContain(greywatch.fragmentId);
            expect(resolution.epilogueFragmentIds).toContain(
              maraLoyal ? 'mara-loyal-a-watch-of-her-own' : 'mara-estranged-the-empty-watch',
            );
            expect(resolution.epilogueFragmentIds.filter((id) => id.startsWith('patron-'))).toEqual([
              'patron-the-first-fracture-letter',
            ]);
          }
        }
      }
    }
  });
});
