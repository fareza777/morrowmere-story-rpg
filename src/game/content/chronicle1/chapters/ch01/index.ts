import { CH01_COMBAT } from './combat';
import { CH01_COMPANION } from './companion';
import { CH01_HUB } from './hub';
import { CH01_JOURNEY } from './journey';
import { CH01_MAIN } from './main';

export { CH01_COMBAT, CH01_COMPANION, CH01_HUB, CH01_JOURNEY, CH01_MAIN };

export const CH01_SCENES = Object.freeze(
  [...CH01_MAIN, ...CH01_COMPANION, ...CH01_JOURNEY, ...CH01_COMBAT, ...CH01_HUB]
    .sort((left, right) => left.slot - right.slot),
);
