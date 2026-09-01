import openingTimeline from '../../production/chronicle1/media/opening-timeline.json';
import { OPENING_MUSIC_ID, OPENING_MUSIC_SRC } from '../game/audio/catalog';
import type { CinematicSequence, CinematicShot } from './types';

export const OPENING_NARRATION = Object.freeze([
  'The job should have taken three days.',
  'Escort two wagons of medicine north to Greywatch, collect your pay, and leave before the border frost.',
  'In Morrowmere, that counts as honest work.',
  'The kingdom has lived eighteen years without a king. Its roads belong to toll collectors, deserters, and anything strong enough to hold a blade.',
  'Goblin raids are common. Orc patrols stay west of Redwater. Everyone knows where the danger lies.',
  'Until this morning.',
  'The first arrow kills the driver.',
  'The second carries the mark of the royal armory.',
  'When the attackers retreat, they leave an orc banner beside a dead officer—as if they want the truth found too quickly.',
  'Someone is preparing a war.',
  'You have no title, no army, and no lord to protect you.',
  'You have one wounded witness, one sealed order, and a road that now leads straight to Greywatch.',
  'By nightfall, half the border will want what you carry.',
  'This is where your chronicle begins.',
] as const);

type ShotDirection = Pick<CinematicShot, 'alt' | 'caption' | 'motion' | 'sfxCueIds' | 'haptic'>;

const SHOT_DIRECTIONS: readonly ShotDirection[] = Object.freeze([
  {
    alt: 'Dawn over the fractured kingdom of Morrowmere.',
    caption: 'The job should have taken three days.',
    motion: 'pull-back',
    sfxCueIds: [],
  },
  {
    alt: 'Two medicine wagons travel north on a bright rural road.',
    caption: 'Escort two wagons of medicine north to Greywatch, collect your pay, and leave before the border frost.',
    motion: 'pan-right',
    sfxCueIds: [],
  },
  {
    alt: 'The caravan guard watches the road from horseback.',
    caption: 'In Morrowmere, that counts as honest work.',
    motion: 'push-in',
    sfxCueIds: [],
  },
  {
    alt: 'Greywatch stands beyond fields and low northern hills.',
    caption: 'The kingdom has lived eighteen years without a king. Its roads belong to toll collectors, deserters, and anything strong enough to hold a blade.',
    motion: 'pan-left',
    sfxCueIds: [],
  },
  {
    alt: 'The caravan passes an abandoned border checkpoint.',
    caption: 'Goblin raids are common. Orc patrols stay west of Redwater. Everyone knows where the danger lies.',
    motion: 'focus-shift',
    sfxCueIds: [],
  },
  {
    alt: 'An arrow strikes the medicine wagon driver.',
    caption: 'Until this morning.',
    motion: 'push-in',
    sfxCueIds: [],
    haptic: 'strong',
  },
  {
    alt: 'Goblin raiders attack the caravan near a stone bridge.',
    caption: 'The first arrow kills the driver.',
    motion: 'pan-left',
    sfxCueIds: [],
    haptic: 'medium',
  },
  {
    alt: 'A close view reveals the royal armory mark on the second arrow.',
    caption: 'The second carries the mark of the royal armory.',
    motion: 'focus-shift',
    sfxCueIds: [],
  },
  {
    alt: 'An orc banner lies too neatly beside a dead officer.',
    caption: 'When the attackers retreat, they leave an orc banner beside a dead officer—as if they want the truth found too quickly.',
    motion: 'pull-back',
    sfxCueIds: [],
  },
  {
    alt: 'The caravan guard draws steel and protects a wounded survivor.',
    caption: 'Someone is preparing a war.',
    motion: 'push-in',
    sfxCueIds: [],
  },
  {
    alt: 'The hero protects a wounded witness holding a sealed order.',
    caption: 'You have no title, no army, and no lord to protect you.',
    motion: 'push-in',
    sfxCueIds: [],
    haptic: 'minimal',
  },
  {
    alt: 'Armed riders search the road as evening approaches.',
    caption: 'You have one wounded witness, one sealed order, and a road that now leads straight to Greywatch.',
    motion: 'pan-right',
    sfxCueIds: [],
  },
  {
    alt: 'The hero carries the witness toward Greywatch at sunset.',
    caption: 'By nightfall, half the border will want what you carry.',
    motion: 'pull-back',
    sfxCueIds: [],
  },
  {
    alt: 'The road reaches Greywatch beneath the Black Banner title.',
    caption: 'This is where your chronicle begins.',
    motion: 'still',
    sfxCueIds: [],
    haptic: 'strong',
  },
]);

const shots = openingTimeline.shots.map((canonical, index): CinematicShot => {
  const direction = SHOT_DIRECTIONS[index];
  if (!direction) throw new Error(`Missing opening direction for ${canonical.id}.`);
  return Object.freeze({
    id: canonical.id,
    imageId: canonical.base,
    alt: direction.alt,
    caption: direction.caption,
    startMs: canonical.startMs,
    endMs: canonical.endMs,
    motion: direction.motion,
    sfxCueIds: Object.freeze([...direction.sfxCueIds]),
    ...(direction.haptic ? { haptic: direction.haptic } : {}),
  });
});

if (openingTimeline.id !== 'chronicle-1-opening' || shots.length !== SHOT_DIRECTIONS.length) {
  throw new Error('The Chronicle I opening timeline does not match its approved direction.');
}

export const OPENING_SEQUENCE: CinematicSequence = Object.freeze({
  id: 'chronicle-1-opening',
  durationMs: openingTimeline.durationMs,
  musicId: OPENING_MUSIC_ID,
  musicSrc: OPENING_MUSIC_SRC,
  musicLoop: false,
  voiceId: 'voice-opening-eldrin-en',
  shots: Object.freeze(shots),
});
