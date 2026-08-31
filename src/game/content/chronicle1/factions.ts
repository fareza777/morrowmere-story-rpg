import type { ChronicleFactionDefinition } from '../schema';
import { deepFreeze } from './builders';

export const CHRONICLE1_FACTION_IDS = deepFreeze([
  'greywatch',
  'border-council',
  'free-host',
  'abbey',
  'conclave',
  'black-banner',
] as const);

export const CHRONICLE1_FACTIONS = deepFreeze([
  { id: 'greywatch', name: 'Greywatch', description: 'The northern fortress town and the soldiers sworn to protect its roads.' },
  { id: 'border-council', name: 'Border Council', description: 'Civilian reeves and delegates who keep trade and local law working between armies.' },
  { id: 'free-host', name: 'Free Host', description: 'An orc-led border coalition seeking security without submission to either crown.' },
  { id: 'abbey', name: 'Iron Abbey', description: 'A disciplined healing order whose authority reaches camps, hospitals, and old archives.' },
  { id: 'conclave', name: 'Pale Conclave', description: 'A cautious circle of mages who authenticate dangerous relics and royal seals.' },
  { id: 'black-banner', name: 'Black Banner', description: 'Severin Voss\'s covert false-flag network hidden inside military supply lines.' },
] as const) as unknown as readonly ChronicleFactionDefinition[];
