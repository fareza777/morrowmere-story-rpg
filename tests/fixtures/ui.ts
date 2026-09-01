import { buildCompanionCombatSnapshot } from '../../src/game/companions';
import { createEncounter } from '../../src/game/combat/encounters';
import type { HeroCombatant } from '../../src/game/combat/types';
import type {
  ChronicleEvent,
  CompanionDefinition,
  ContentIndex,
  EncounterDefinition,
  MerchantDefinition,
} from '../../src/game/content/schema';
import type {
  ChoiceId,
  CompanionId,
  EncounterId,
  EnemyId,
  EventId,
  ItemId,
  MerchantId,
} from '../../src/game/domain/ids';
import { deriveHeroStats } from '../../src/game/progression';
import { createCampaign, initialDirector } from '../../src/game/state/create';
import type { FlowState, GameStateV2 } from '../../src/game/state/types';
import type { EnemyDefinition, ItemDefinition } from '../../src/game/types';

const eventId = (value: string) => value as EventId;
const choiceId = (value: string) => value as ChoiceId;
const itemId = (value: string) => value as ItemId;
const enemyId = (value: string) => value as EnemyId;
const encounterId = (value: string) => value as EncounterId;
const companionId = (value: string) => value as CompanionId;
const merchantId = (value: string) => value as MerchantId;

const STORY_EVENT: ChronicleEvent = {
  id: eventId('ui-story-event'),
  chapterId: 'ch01',
  type: 'main',
  family: 'orchard-ambush',
  anchorOrder: 1,
  illustrationId: 'ui-story-art',
  title: 'The Orchard Ambush',
  narrative: [
    'A broken medicine wagon blocks the orchard road. Three sets of boot prints leave the wreck, but only one trail carries blood.',
    'Greywatch is still a day north. Whoever staged the attack expects the road patrol to blame the nearest goblin camp.',
  ],
  eligibility: {},
  cooldownRuns: 0,
  oneShot: true,
  choices: [
    {
      id: choiceId('follow-blood'),
      label: 'Follow the blood trail',
      detail: 'Risk an ambush to reach the wounded witness before the patrol does.',
      effects: [],
      outcome: 'You leave the obvious tracks and follow the injured attacker into the trees.',
    },
  ],
};

const MERCHANT_EVENT: ChronicleEvent = {
  id: eventId('ui-merchant-event'),
  chapterId: 'ch01',
  type: 'hub',
  family: 'road-trader-camp',
  illustrationId: 'ui-merchant-art',
  title: 'Trader at the Milestone',
  narrative: ['A canvas awning shelters a careful trader and two locked chests.'],
  eligibility: {},
  cooldownRuns: 0,
  oneShot: false,
  merchantId: merchantId('road-trader'),
  merchantRestockKey: 'ch01-road-trader',
  choices: [],
};

const MARA_QUESTS: readonly ChronicleEvent[] = [1, 2, 3].map((stage) => ({
  id: eventId(`ui-mara-quest-${stage}`),
  chapterId: 'ch01',
  type: 'companion',
  family: `mara-quest-${stage}`,
  illustrationId: `ui-mara-quest-art-${stage}`,
  title: ['A Hunter\'s Debt', 'Tracks at Redwater', 'The Last Arrow'][stage - 1]!,
  narrative: [`Mara's personal quest reaches stage ${stage}.`],
  eligibility: {},
  cooldownRuns: 0,
  oneShot: true,
  choices: [],
}));

const ITEMS: readonly ItemDefinition[] = [
  {
    id: 'potion-red',
    name: 'Red Mercy',
    category: 'potion',
    description: 'A sharp-smelling tonic that restores health.',
    allowedClasses: ['warrior', 'mage', 'warden'],
    stats: { health: 12 },
    value: 12,
    tags: ['common', 'healing'],
  },
  {
    id: 'iron-sword',
    name: 'Greywatch Iron Sword',
    category: 'weapon',
    description: 'A plain border sword kept keen through regular use.',
    allowedClasses: ['warrior', 'warden'],
    stats: { attack: 3 },
    value: 28,
    tags: ['common'],
  },
  {
    id: 'traveler-cloak',
    name: 'Weathered Traveller\'s Cloak',
    category: 'armor',
    description: 'A patched wool cloak with hidden leather plates.',
    allowedClasses: ['warrior', 'mage', 'warden'],
    stats: { armor: 1, ward: 1 },
    value: 20,
    tags: ['common'],
  },
  {
    id: 'sealed-letter',
    name: 'Sealed Border Order',
    category: 'quest',
    description: 'An unsigned military order sealed with black wax.',
    allowedClasses: ['warrior', 'mage', 'warden'],
    stats: {},
    value: 0,
    tags: ['evidence'],
  },
];

const ENEMIES: readonly EnemyDefinition[] = [
  {
    id: 'ash-goblin',
    archetypeId: 'goblin-guard',
    name: 'Ash Goblin Guard',
    rank: 1,
    level: 1,
    species: 'goblin',
    region: 'gloamwood',
    maxHealth: 18,
    attack: 3,
    armor: 1,
    ward: 0,
    intentWeights: { guard: 1 },
    traits: ['Shield Wall'],
    rewardTags: ['road-loot'],
    description: 'A disciplined goblin carrying a stolen watch shield.',
    artFamily: 'enemy-ash-goblin-guard',
  },
  {
    id: 'ditch-raider',
    archetypeId: 'human-raider',
    name: 'Ditch Raider',
    rank: 1,
    level: 1,
    species: 'human',
    region: 'gloamwood',
    maxHealth: 22,
    attack: 4,
    armor: 0,
    ward: 0,
    intentWeights: { strike: 1 },
    traits: ['Heavy Blade'],
    rewardTags: ['road-loot'],
    description: 'A deserter using goblin raids as cover for robbery.',
    artFamily: 'enemy-ditch-raider',
  },
  {
    id: 'hedge-archer',
    archetypeId: 'human-archer',
    name: 'Hedge Archer',
    rank: 1,
    level: 1,
    species: 'human',
    region: 'gloamwood',
    maxHealth: 16,
    attack: 3,
    armor: 0,
    ward: 1,
    intentWeights: { heavy: 1 },
    traits: ['Stone Wings'],
    rewardTags: ['road-loot'],
    description: 'A bowman hidden behind a cut hedge.',
    artFamily: 'enemy-hedge-archer',
  },
];

const ROAD_AMBUSH: EncounterDefinition = {
  id: encounterId('ui-road-ambush'),
  family: 'road-ambush',
  kind: 'regular',
  enemyIds: ENEMIES.map((enemy) => enemyId(enemy.id)),
  reward: { xp: 18, gold: 9, itemChoices: [itemId('potion-red')] },
};

const MARA: CompanionDefinition = {
  id: companionId('mara'),
  name: 'Mara Venn',
  recruitment: { requiredDecisionIds: ['spared-mara'] },
  personalQuestIds: MARA_QUESTS.map((event) => event.id),
  combat: { attack: 3, guard: 1, will: 2, actionId: 'covering-shot' },
};

const ROAD_TRADER: MerchantDefinition = {
  id: merchantId('road-trader'),
  name: 'Harlan the Road Trader',
  stockItemIds: [itemId('traveler-cloak'), itemId('potion-red')],
};

export const UI_CONTENT: ContentIndex = {
  events: new Map([STORY_EVENT, MERCHANT_EVENT, ...MARA_QUESTS].map((event) => [event.id, event])),
  items: new Map(ITEMS.map((item) => [itemId(item.id), item])),
  enemies: new Map(ENEMIES.map((enemy) => [enemyId(enemy.id), enemy])),
  encounters: new Map([[ROAD_AMBUSH.id, ROAD_AMBUSH]]),
  companions: new Map([[MARA.id, MARA]]),
  merchants: new Map([[ROAD_TRADER.id, ROAD_TRADER]]),
  artIds: new Set([
    'ui-story-art',
    'ui-merchant-art',
    ...MARA_QUESTS.map((event) => event.illustrationId),
    ...ENEMIES.map((enemy) => enemy.artFamily),
  ]),
  audioIds: new Set(),
};

export interface UiGameOptions {
  readonly screen?: FlowState['screen'];
  readonly enemyCount?: number;
  readonly stackedPotions?: number;
  readonly equippedWeapon?: boolean;
  readonly questItem?: boolean;
  readonly companionId?: 'mara';
  readonly loyalty?: number;
}

export function makeUiGame(options: UiGameOptions = {}): GameStateV2 {
  const screen = options.screen ?? 'story';
  const base = createCampaign(
    { heroClass: 'warden', seed: 41, name: 'Rowan', updatedAt: '2026-08-31T10:00:00.000Z' },
    UI_CONTENT,
  );
  const pack = options.stackedPotions
    ? [{ id: 'stack-red-mercy', itemId: itemId('potion-red'), quantity: options.stackedPotions }]
    : [];
  const inventory = {
    pack,
    stash: [],
    questItems: options.questItem ? [itemId('sealed-letter')] : [],
    equipment: {
      weapon: options.equippedWeapon ? itemId('iron-sword') : null,
      armor: null,
      charms: [],
    },
  } as const;
  const companionRecords = base.campaign.companions.records.map((record) =>
    record.companionId === companionId('mara')
      ? {
          ...record,
          status: options.companionId ? 'recruited' as const : record.status,
          loyalty: options.loyalty ?? record.loyalty,
          questStage: options.companionId ? 1 as const : record.questStage,
        }
      : record,
  );
  const companions = {
    records: companionRecords,
    activeCompanionId: options.companionId ? companionId(options.companionId) : null,
  };
  const campaign = {
    ...base.campaign,
    inventory,
    evidence: ['royal-armory-arrow'],
    flags: ['followed-blood-trail'],
    companions,
  };
  const stats = deriveHeroStats(campaign.hero, inventory, UI_CONTENT.items);
  const hero: HeroCombatant = {
    class: stats.heroClass,
    name: campaign.heroName,
    level: stats.level,
    xp: stats.xp,
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    focus: stats.maxFocus,
    maxFocus: stats.maxFocus,
    strength: stats.strength,
    cunning: stats.cunning,
    will: stats.will,
    armor: stats.armor,
    ward: stats.ward,
    attackBonus: stats.attack,
    guarding: false,
    statuses: [],
    inventory: pack.map((entry) => entry.id),
    equipment: {
      weapon: inventory.equipment.weapon,
      armor: inventory.equipment.armor,
      charms: inventory.equipment.charms,
    },
  };
  const companion = buildCompanionCombatSnapshot(companions, UI_CONTENT);
  const generatedCombat = createEncounter(hero, ROAD_AMBUSH, UI_CONTENT, 91, false, companion);
  const enemyCount = Math.max(1, Math.min(3, options.enemyCount ?? 3));
  const enemies = generatedCombat.enemies.slice(0, enemyCount);
  const enemyIntents = generatedCombat.enemyIntents.filter((intent) =>
    enemies.some((enemy) => enemy.id === intent.enemyId),
  );
  const combat = {
    ...generatedCombat,
    enemy: enemies[0]!,
    enemies,
    enemyIntent: enemyIntents[0]!.intent,
    enemyIntents,
    intentText: enemyIntents[0]!.text,
  };
  const currentSceneId = screen === 'merchant' ? MERCHANT_EVENT.id : STORY_EVENT.id;
  const visit = {
    merchantId: ROAD_TRADER.id,
    restockKey: 'ch01-road-trader',
    restockSeed: 411,
    generatedAtLevel: 1,
    stock: [
      { id: 'stock-cloak-1', itemId: itemId('traveler-cloak') },
      { id: 'stock-potion-1', itemId: itemId('potion-red') },
    ],
  } as const;
  const expedition = screen === 'camp'
    ? null
    : {
        routeProfile: 'old-forest' as const,
        routeSeed: 77,
        director: initialDirector(77),
        position: { chapterId: 'ch01' as const, slot: 1 },
        currentSceneId,
        authoredSceneQueue: [],
        sceneVisitCounts: currentSceneId ? { [currentSceneId]: 1 } : {},
        checkedAttempts: [],
        sceneResolution: screen === 'story'
          ? {
              eventId: STORY_EVENT.id, choiceId: null, resultKind: 'direct' as const, chance: null, roll: null,
              outcome: 'The story fixture is ready.', effectSummary: [], nextSceneId: null, continueLabel: null,
            }
          : null,
        heroVitals: { health: stats.maxHealth, resource: stats.maxFocus },
        currentCombat: screen === 'combat'
          ? { encounterId: ROAD_AMBUSH.id, combat }
          : null,
        pendingReward: null,
        unbankedGold: 7,
        unbankedLoot: [],
        temporaryBoons: [],
        merchantVisits: [visit],
      };
  return {
    ...base,
    campaign,
    profile: {
      ...base.profile,
      discoveries: {
        events: [STORY_EVENT.id],
        enemies: ['ash-goblin'],
        codex: ['ui-story-event', 'ash-goblin'],
      },
    },
    expedition,
    flow: {
      screen,
      overlay: null,
      merchant: screen === 'merchant'
        ? { merchantId: ROAD_TRADER.id, restockKey: visit.restockKey, returnScreen: 'story' }
        : null,
    },
  };
}
