import { CH02_COMBAT } from './combat';
import { CH02_COMPANION } from './companion';
import { CH02_HUB } from './hub';
import { CH02_JOURNEY } from './journey';
import { CH02_MAIN } from './main';

export { CH02_COMBAT, CH02_COMPANION, CH02_HUB, CH02_JOURNEY, CH02_MAIN };

export const CH02_SCENES = Object.freeze(
  [...CH02_MAIN, ...CH02_COMPANION, ...CH02_JOURNEY, ...CH02_COMBAT, ...CH02_HUB]
    .sort((left, right) => left.slot - right.slot),
);
