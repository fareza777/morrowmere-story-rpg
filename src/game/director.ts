import { EVENTS, type StoryEvent } from './content/events';
import { FINALE, LIEUTENANTS, PROLOGUE } from './content/story';
import { createRng } from './rng';
import type { EventChoice, FactionStanding, HeroClass, RegionId } from './types';

export interface DirectorContext {
  readonly seed: number;
  readonly heroClass: HeroClass;
  readonly flags: readonly string[];
  readonly inventoryTags: readonly string[];
  readonly factions: FactionStanding;
  readonly recentFamilies: readonly string[];
  readonly encounteredEventIds: readonly string[];
  readonly tension: number;
  readonly mercy: number;
  readonly corruption: number;
  readonly region: RegionId;
}

export type RouteNodeKind = 'prologue' | 'story' | 'lieutenant' | 'finale';

export interface RouteNode {
  readonly id: string;
  readonly index: number;
  readonly kind: RouteNodeKind;
  readonly region: RegionId;
  readonly family: string;
  readonly title: string;
  readonly text: string;
  readonly sceneKey: string;
  readonly choices: readonly EventChoice[];
  readonly enemyArchetypeId?: string;
}

export function getEligibleEvents(context: DirectorContext): StoryEvent[] {
  return EVENTS.filter(
    (event) =>
      event.region === context.region &&
      event.requiredFlags.every((flag) => context.flags.includes(flag)) &&
      event.excludedFlags.every((flag) => !context.flags.includes(flag)),
  );
}

export function chooseNextEvent(context: DirectorContext): StoryEvent {
  const recent = new Set(context.recentFamilies.slice(-3));
  const encountered = new Set(context.encounteredEventIds);
  const eligible = getEligibleEvents(context);
  const fresh = eligible.filter((event) => !encountered.has(event.id) && !recent.has(event.family));
  const pool = fresh.length > 0 ? fresh : eligible.filter((event) => !encountered.has(event.id));
  const fallback = pool.length > 0 ? pool : eligible;
  if (fallback.length === 0) {
    throw new Error(`No eligible story events for ${context.region}`);
  }

  const callback = fallback
    .filter((event) => event.requiredFlags.length > 0)
    .sort((left, right) => right.weight - left.weight)[0];
  if (callback) return callback;

  const rng = createRng(context.seed);
  const weighted = fallback.flatMap((event) =>
    Array.from({ length: Math.max(1, Math.ceil(event.weight / 5)) }, () => event),
  );
  return rng.pick(weighted);
}

function renderEventNode(event: StoryEvent, index: number, seed: number): RouteNode {
  const rng = createRng(seed);
  const actor = rng.pick(event.actors);
  const location = rng.pick(event.locations);
  const weather = rng.pick(event.weathers);
  const body = rng.pick(event.bodyVariants);
  return {
    id: `route-${index}-${event.id}`,
    index,
    kind: 'story',
    region: event.region,
    family: event.family,
    title: event.title,
    text: `${event.opening} ${body} You meet ${actor} ${location}, ${weather}.`,
    sceneKey: `${event.id}|${actor}|${location}|${weather}`,
    choices: event.choices,
  };
}

const CONTINUE_CHOICE: readonly EventChoice[] = [
  {
    id: 'continue',
    label: 'Continue',
    detail: 'Walk deeper into Morrowmere.',
    effect: {},
    outcome: 'The road waits for no coronation.',
  },
];

export function buildRoute(context: DirectorContext): RouteNode[] {
  const rng = createRng(context.seed);
  const nodes: RouteNode[] = [
    {
      id: 'route-0-prologue',
      index: 0,
      kind: 'prologue',
      region: 'gloamwood',
      family: 'prologue',
      title: PROLOGUE.title,
      text: PROLOGUE.text,
      sceneKey: 'prologue|grave|black-rain|night',
      choices: CONTINUE_CHOICE,
    },
  ];
  const encountered: string[] = [...context.encounteredEventIds];
  const recent: string[] = [...context.recentFamilies];

  const addStory = (region: RegionId) => {
    const event = chooseNextEvent({
      ...context,
      region,
      seed: rng.int(1, 2_147_483_647),
      encounteredEventIds: encountered,
      recentFamilies: recent,
    });
    nodes.push(renderEventNode(event, nodes.length, rng.int(1, 2_147_483_647)));
    encountered.push(event.id);
    recent.push(event.family);
  };

  addStory('gloamwood');
  addStory('gloamwood');
  addStory('drowned-road');
  nodes.push({ id: 'route-4-drowned-marshal', index: 4, kind: 'lieutenant', region: 'drowned-road', family: 'drowned-marshal', title: LIEUTENANTS['drowned-road'].title, text: LIEUTENANTS['drowned-road'].text, sceneKey: 'drowned-road|marshal|black-rain|dusk', choices: CONTINUE_CHOICE, enemyArchetypeId: 'barrow-soldier' });
  addStory('drowned-road');
  addStory('embervault');
  addStory('embervault');
  nodes.push({ id: 'route-8-furnace-confessor', index: 8, kind: 'lieutenant', region: 'embervault', family: 'furnace-confessor', title: LIEUTENANTS.embervault.title, text: LIEUTENANTS.embervault.text, sceneKey: 'embervault|confessor|cinders|furnace', choices: CONTINUE_CHOICE, enemyArchetypeId: 'abbey-golem' });
  addStory('crownless-keep');
  addStory('crownless-keep');
  nodes.push({ id: 'route-11-finale', index: 11, kind: 'finale', region: 'crownless-keep', family: 'finale', title: FINALE.title, text: FINALE.text, sceneKey: 'crownless-keep|throne|black-rain|night', choices: CONTINUE_CHOICE, enemyArchetypeId: 'crown-devil' });
  return nodes;
}
