import type { ChronicleDefinition, SevenAnchorIds } from '../schema';
import type { ChapterId } from '../../domain/ids';
import { deepFreeze } from './builders';

export const MAIN_ANCHOR_IDS = deepFreeze({
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
} as const) as unknown as Readonly<Record<ChapterId, SevenAnchorIds>>;

const CHAPTERS = [
  { id: 'ch01', order: 1, title: 'The Greywatch Road', levelBand: { min: 1, max: 2 }, region: 'gloamwood', anchorIds: MAIN_ANCHOR_IDS.ch01 },
  { id: 'ch02', order: 2, title: 'Raiders at Dawn', levelBand: { min: 2, max: 4 }, region: 'gloamwood', anchorIds: MAIN_ANCHOR_IDS.ch02 },
  { id: 'ch03', order: 3, title: 'The Drowned Road', levelBand: { min: 4, max: 6 }, region: 'drowned-road', anchorIds: MAIN_ANCHOR_IDS.ch03 },
  { id: 'ch04', order: 4, title: 'Banners at Redwater', levelBand: { min: 6, max: 8 }, region: 'drowned-road', anchorIds: MAIN_ANCHOR_IDS.ch04 },
  { id: 'ch05', order: 5, title: 'The Embervault Conspiracy', levelBand: { min: 8, max: 10 }, region: 'embervault', anchorIds: MAIN_ANCHOR_IDS.ch05 },
  { id: 'ch06', order: 6, title: 'The Broken Oath', levelBand: { min: 10, max: 12 }, region: 'gloamwood', anchorIds: MAIN_ANCHOR_IDS.ch06 },
  { id: 'ch07', order: 7, title: 'March on Crownless Keep', levelBand: { min: 12, max: 14 }, region: 'crownless-keep', anchorIds: MAIN_ANCHOR_IDS.ch07 },
  { id: 'ch08', order: 8, title: 'The False Coronation', levelBand: { min: 14, max: 15 }, region: 'crownless-keep', anchorIds: MAIN_ANCHOR_IDS.ch08 },
] as const;

export const CHRONICLE1 = deepFreeze({
  id: 'chronicle-1',
  title: 'Chronicle I — The Black Banner',
  chapters: CHAPTERS,
} as const) satisfies ChronicleDefinition;
