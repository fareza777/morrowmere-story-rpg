import { CH05_COMBAT } from './combat';
import { CH05_COMPANION } from './companion';
import { CH05_HUB } from './hub';
import { CH05_JOURNEY } from './journey';
import { CH05_MAIN } from './main';
import { ROAD_TACTICS_SCENES } from './road-tactics';
import { withRoadSlots } from '../../road-slots';

export { ROAD_TACTICS_SCENES };

export { CH05_COMBAT, CH05_COMPANION, CH05_HUB, CH05_JOURNEY, CH05_MAIN };

export const CH05_SCENES = Object.freeze(
  [...CH05_MAIN, ...CH05_COMPANION, ...CH05_JOURNEY, ...CH05_COMBAT, ...CH05_HUB]
    .map(withRoadSlots)
    .concat(ROAD_TACTICS_SCENES)
    .sort((left, right) => left.slot - right.slot),
);
