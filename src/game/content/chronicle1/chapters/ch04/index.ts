import { CH04_COMBAT } from './combat';
import { CH04_COMPANION } from './companion';
import { CH04_HUB } from './hub';
import { CH04_JOURNEY } from './journey';
import { CH04_MAIN } from './main';

export const CH04_SCENES = Object.freeze([
  ...CH04_MAIN,
  ...CH04_COMPANION,
  ...CH04_JOURNEY,
  ...CH04_COMBAT,
  ...CH04_HUB,
].sort((left, right) => left.slot - right.slot));

export { CH04_COMBAT, CH04_COMPANION, CH04_HUB, CH04_JOURNEY, CH04_MAIN };
