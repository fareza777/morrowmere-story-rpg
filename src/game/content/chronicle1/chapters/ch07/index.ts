import { CH07_COMBAT } from './combat';
import { CH07_COMPANION } from './companion';
import { CH07_HUB } from './hub';
import { CH07_JOURNEY } from './journey';
import { CH07_MAIN } from './main';

export { CH07_COMBAT, CH07_COMPANION, CH07_HUB, CH07_JOURNEY, CH07_MAIN };

export const CH07_SCENES = Object.freeze(
  [...CH07_MAIN, ...CH07_COMPANION, ...CH07_JOURNEY, ...CH07_COMBAT, ...CH07_HUB]
    .sort((left, right) => left.slot - right.slot),
);
