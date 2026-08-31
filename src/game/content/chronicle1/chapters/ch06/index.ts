import { CH06_COMBAT } from './combat';
import { CH06_COMPANION } from './companion';
import { CH06_HUB } from './hub';
import { CH06_JOURNEY } from './journey';
import { CH06_MAIN } from './main';

export { CH06_COMBAT, CH06_COMPANION, CH06_HUB, CH06_JOURNEY, CH06_MAIN };

export const GREYWATCH_OUTCOME_FLAGS = Object.freeze([
  'greywatch-held',
  'greywatch-damaged',
  'greywatch-fallen',
] as const);

export const LEAK_PATH_IDS = Object.freeze([
  'ch06-companion-caldus-confession',
  'ch06-faction-sergeant-hale-confession',
] as const);

export const CH06_SCENES = Object.freeze(
  [...CH06_MAIN, ...CH06_COMPANION, ...CH06_JOURNEY, ...CH06_COMBAT, ...CH06_HUB]
    .sort((left, right) => left.slot - right.slot),
);
