import { CH03_COMBAT } from './combat';
import { CH03_COMPANION } from './companion';
import { CH03_HUB } from './hub';
import { CH03_JOURNEY } from './journey';
import { CH03_MAIN } from './main';

export const CH03_SCENES = Object.freeze([
  ...CH03_MAIN,
  ...CH03_COMPANION,
  ...CH03_JOURNEY,
  ...CH03_COMBAT,
  ...CH03_HUB,
].sort((left, right) => left.slot - right.slot));

export const RUKHAR_RECRUITMENT_CALLBACKS = Object.freeze([
  'ch03-companion-courier-testimony',
  'ch03-companion-rukhar-keeps-watch',
  'ch04-companion-stop-the-retaliation',
  'ch04-companion-the-cost-of-peace',
] as const);

export { CH03_COMBAT, CH03_COMPANION, CH03_HUB, CH03_JOURNEY, CH03_MAIN };
