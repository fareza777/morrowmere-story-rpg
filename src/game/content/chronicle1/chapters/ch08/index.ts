import { CH08_COMBAT } from './combat';
import { CH08_COMPANION } from './companion';
import { CH08_HUB } from './hub';
import { CH08_JOURNEY } from './journey';
import { CH08_MAIN } from './main';
import { ROAD_TACTICS_SCENES } from './road-tactics';
import { withRoadSlots } from '../../road-slots';

export { ROAD_TACTICS_SCENES };

export { CH08_COMBAT, CH08_COMPANION, CH08_HUB, CH08_JOURNEY, CH08_MAIN };

export const KEEP_CUSTODIAN_FLAGS = Object.freeze([
  'keep-border-council',
  'keep-greywatch',
  'keep-free-host',
  'keep-neutral-wardens',
] as const);

export const ENDING_AXIS_FLAGS = Object.freeze([
  'voss-exposed',
  'border-peace',
  'coalition-formed',
  'open-war',
  ...KEEP_CUSTODIAN_FLAGS,
] as const);

export const CH08_SCENES = Object.freeze(
  [...CH08_MAIN, ...CH08_COMPANION, ...CH08_JOURNEY, ...CH08_COMBAT, ...CH08_HUB]
    .map(withRoadSlots)
    .concat(ROAD_TACTICS_SCENES)
    .sort((left, right) => left.slot - right.slot),
);
