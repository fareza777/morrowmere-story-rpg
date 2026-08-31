import { CH05_COMBAT } from './combat';
import { CH05_COMPANION } from './companion';
import { CH05_HUB } from './hub';
import { CH05_JOURNEY } from './journey';
import { CH05_MAIN } from './main';

export { CH05_COMBAT, CH05_COMPANION, CH05_HUB, CH05_JOURNEY, CH05_MAIN };

export const CH05_SCENES = Object.freeze(
  [...CH05_MAIN, ...CH05_COMPANION, ...CH05_JOURNEY, ...CH05_COMBAT, ...CH05_HUB]
    .sort((left, right) => left.slot - right.slot),
);
