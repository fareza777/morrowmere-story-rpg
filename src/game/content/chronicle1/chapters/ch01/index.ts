import { CH01_COMBAT } from './combat';
import { CH01_COMPANION } from './companion';
import { CH01_HUB } from './hub';
import { CH01_JOURNEY } from './journey';
import { CH01_MAIN } from './main';
import { CH01_LIVING_AMBUSH } from './living-ambush';
import { CH01_LIVING_DEPARTURE } from './living-departure';
import { CH01_LIVING_MARA } from './living-mara';
import { CH01_LIVING_TOLLHOUSE } from './living-tollhouse';

export { CH01_COMBAT, CH01_COMPANION, CH01_HUB, CH01_JOURNEY, CH01_MAIN, CH01_LIVING_AMBUSH, CH01_LIVING_DEPARTURE, CH01_LIVING_MARA, CH01_LIVING_TOLLHOUSE };

export const CH01_SCENES = Object.freeze(
  [...CH01_MAIN, ...CH01_COMPANION, ...CH01_JOURNEY, ...CH01_COMBAT, ...CH01_HUB, ...CH01_LIVING_DEPARTURE, ...CH01_LIVING_MARA, ...CH01_LIVING_TOLLHOUSE, ...CH01_LIVING_AMBUSH]
    .sort((left, right) => left.slot - right.slot),
);
