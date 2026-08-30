import type { EventChoice, FactionStanding } from '../types';

export interface EndingContext {
  readonly flags: readonly string[];
  readonly factions: FactionStanding;
  readonly corruption: number;
  readonly mercy: number;
}

export interface Ending {
  readonly id: string;
  readonly title: string;
  readonly verdict: string;
  readonly epilogue: string;
}

export const ENDINGS: readonly Ending[] = Object.freeze([
  { id: 'the-road-without-kings', title: 'The Road Without Kings', verdict: 'You refuse every throne.', epilogue: 'You carry the final Iron Tooth beyond the last door and leave the Crown unfinished. Without its command, the black rain thins into ordinary weather. Abbey, Host, and Conclave must bargain like mortals. Years later, travelers still find an unmarked road whenever a ruler claims that obedience is the same as peace.' },
  { id: 'iron-rain', title: 'Iron Rain', verdict: 'You destroy the Crown.', epilogue: 'The Crown breaks beneath your hand, and every oath it enforced returns at once to the people who made it. Kingdoms fracture, old soldiers wake, and the black rain falls as harmless iron dust. Morrowmere becomes dangerous, disputatious, and free—an honest ruin where no dead king can answer for the living.' },
  { id: 'the-crowned-wound', title: 'The Crowned Wound', verdict: 'You restore the old power.', epilogue: 'Five iron teeth close around your brow. The rain stops before the first drop reaches the floor, and every bell in Morrowmere speaks with your voice. Roads become safe, harvests return, and rebellion becomes impossible. In the mirror, the child beneath the throne watches you practice a speech that never ends.' },
  { id: 'law-of-iron', title: 'The Law of Iron', verdict: 'The Iron Abbey inherits the Crown.', epilogue: 'The Abbey seals the Crown inside a walking reliquary and writes a law for every grief. Bandits vanish, bridges rise, and black rain is collected behind monastery walls. The realm survives with admirable efficiency. At each new moon, citizens queue to confess dreams that have not yet become crimes.' },
  { id: 'red-dawn', title: 'The Red Dawn', verdict: 'The Free Host takes the throne hall.', epilogue: 'The orcish Free Host melts the throne into a hundred oath-blades, one for every clan and none for a king. The realm becomes a loud confederation of camps, councils, feuds, and chosen loyalties. No road is entirely safe, but every traveler may ask who made the law and receive an answer from someone still alive.' },
  { id: 'pale-star', title: 'The Pale Star', verdict: 'The Conclave rewrites the Crown.', epilogue: 'The Pale Conclave turns the Crown inward and binds its command to memory instead of blood. The black rain rises into the night and becomes a fixed pale star. Magic flourishes, history can be visited, and secrets become currency. Some mornings you wake with another person’s childhood and wonder what the Conclave took in exchange.' },
]);

export function resolveEnding(context: EndingContext): Ending {
  const ending = (id: string) => ENDINGS.find((candidate) => candidate.id === id) as Ending;
  if (context.flags.includes('crown-refused') && context.flags.includes('truth-known') && context.mercy >= 4) {
    return ending('the-road-without-kings');
  }
  if (context.flags.includes('crown-destroyed')) return ending('iron-rain');
  if (context.flags.includes('crown-restored')) return ending('the-crowned-wound');

  const factions = Object.entries(context.factions) as [keyof FactionStanding, number][];
  const [leader] = factions.sort((left, right) => right[1] - left[1])[0] ?? ['abbey', 0];
  if (leader === 'freeHost') return ending('red-dawn');
  if (leader === 'conclave') return ending('pale-star');
  return ending('law-of-iron');
}

export const PROLOGUE = {
  title: 'When the Black Rain Rings',
  text: 'The rain begins at your burial. Each drop strikes the coffin lid like a tiny bell. You wake with an iron thorn beneath your heart and the name Morrowmere burning behind your teeth.',
};

export const LIEUTENANTS = {
  'drowned-road': { title: 'Marshal Below the Road', text: 'A drowned marshal rises with the kingroad draped across his shoulders like a chain.' },
  embervault: { title: 'The Furnace Confessor', text: 'The Iron Abbey’s confessor waits inside a suit of armor heated white from within.' },
};

export const FINALE = {
  title: 'The Throne That Kneels',
  text: 'At the heart of the Keep, the empty throne turns and kneels before the Iron Tooth in your chest. Three armies wait outside. Beneath the stone, something older waits for a command.',
};

export const FINALE_CHOICES: readonly EventChoice[] = Object.freeze([
  {
    id: 'destroy-crown',
    label: 'Break the Crown',
    detail: 'End its command, whatever order dies with it.',
    effect: { addFlags: ['crown-destroyed'], corruption: -1 },
    outcome: 'The throne screams as the first iron tooth cracks.',
  },
  {
    id: 'restore-crown',
    label: 'Wear the Crown',
    detail: 'Take its power and impose your answer on the realm.',
    effect: { addFlags: ['crown-restored'], corruption: 2 },
    outcome: 'The throne bows lower and the bells begin to learn your voice.',
  },
  {
    id: 'refuse-crown',
    label: 'Refuse Every Throne',
    detail: 'Leave its power unfinished and trust the living to choose.',
    effect: { addFlags: ['crown-refused'], mercy: 1 },
    outcome: 'For one breath, Morrowmere contains no command at all.',
  },
]);
