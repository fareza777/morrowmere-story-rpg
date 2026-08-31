# MORROWMERE Chronicle I Core Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vertical slice's single prebuilt run with deterministic Chronicle I campaign, expedition, combat, companion, merchant, progression, checkpoint, and save-v2 systems that later content and UI can use safely.

**Architecture:** Introduce small pure domain modules and keep `state.ts`, `combat.ts`, `director.ts`, and `persistence.ts` as compatibility facades while consumers migrate. State stores only stable IDs and player progress; catalogs remain immutable indexes. Every reducer transition returns typed domain events so audio, haptics, saves, and ads never parse display prose.

**Tech Stack:** TypeScript 7, React 19 reducer integration, Vitest 4, browser Storage API, Capacitor lifecycle adapter.

**Spec:** `docs/superpowers/specs/2026-08-31-morrowmere-chronicle-i-black-banner-design.md`

## Global Constraints

- Preserve deterministic seeded behavior and store RNG state after every transition.
- Store IDs and progress only; never embed catalog prose, art, or nested snapshots in saves.
- Retain one weapon, one armor, and two charm slots; equipped and quest items do not consume field capacity.
- Field inventory is 24 slots, stackable consumables share a slot, and camp has a larger stash.
- Default balance remains challenging; upgrades matter and companions do not act as a second full-damage hero.
- Defeat returns to the latest camp; Restart Chapter restores the chapter-entry snapshot; neither can be rerolled by closing the app.
- Schema-v1 runs are archived; settings and eligible discoveries migrate without inventing story choices.
- Player-facing error text is English.

---

## File map

- `src/game/domain/ids.ts`: branded stable ID aliases and `StoryPosition`.
- `src/game/domain/result.ts`: `DomainResult`, `DomainEvent`, and typed diagnostics.
- `src/game/domain/effects.ts`: discriminated authored effects applied atomically.
- `src/game/content/schema.ts`: event, item, enemy, companion, merchant, encounter, and content-index contracts.
- `src/game/content/validate.ts`: count, reference, reachability, callback, stock, and encounter validation.
- `src/game/progression.ts`: XP curve, levels, talents, and derived hero stats.
- `src/game/inventory.ts`: pack, stash, equipment, quest partition, and context-aware item use.
- `src/game/companions.ts`: loyalty, recruitment, personal quests, active companion, and combat snapshots.
- `src/game/merchant.ts`: deterministic stock, quotes, buy/sell, and persisted restock keys.
- `src/game/combat/*`: combat types, attack outcomes, enemy AI, encounter construction, and turn resolution.
- `src/game/director/*`: eligibility, lazy selection, pacing, threat, anchors, cooldowns, and callback deadlines.
- `src/game/state/*`: layered state, creation, atomic effects, checkpoints, and reducer orchestration.
- `src/game/persistence/*`: envelope validation, checksum, migration, active/backup storage, import/export.
- Existing `src/game/{state,combat,director,persistence}.ts`: temporary public facades.
- `tests/fixtures/game.ts`: minimal deterministic content and state factories.

### Task 1: Stable domain contracts and content validation

**Files:**
- Create: `src/game/domain/ids.ts`
- Create: `src/game/domain/result.ts`
- Create: `src/game/domain/effects.ts`
- Create: `src/game/content/schema.ts`
- Create: `src/game/content/validate.ts`
- Create: `tests/content-schema.test.ts`
- Create: `tests/fixtures/game.ts`
- Modify: `src/game/types.ts`

**Interfaces:**
- Produces: `ContentIndex`, `ChronicleEvent`, `GameEffect`, `DomainEvent`, `validateContent(index: ContentIndex): ContentIssue[]`, and deterministic fixture builders.

- [ ] **Step 1: Add failing schema tests.**

```ts
import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/game/content/validate';
import { makeContentIndex } from './fixtures/game';

describe('Chronicle I content schema', () => {
  it('rejects duplicate IDs and broken references', () => {
    const content = makeContentIndex({ duplicateEventId: true, missingArtId: true });
    expect(validateContent(content).map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['duplicate_event_id', 'missing_art']),
    );
  });

  it('accepts the minimal deterministic fixture', () => {
    expect(validateContent(makeContentIndex())).toEqual([]);
  });
});
```

- [ ] **Step 2: Run `npm test -- content-schema.test.ts` and verify the imports fail.**
- [ ] **Step 3: Implement branded string ID aliases, the discriminated `GameEffect` union, typed `DomainEvent` records, immutable indexes, and validation issue codes used by the test.**

```ts
export type EventId = string & { readonly __eventId: unique symbol };
export type ChapterId = 'ch01' | 'ch02' | 'ch03' | 'ch04' | 'ch05' | 'ch06' | 'ch07' | 'ch08';

export type GameEffect =
  | { readonly type: 'gold'; readonly scope: 'banked' | 'unbanked'; readonly amount: number }
  | { readonly type: 'item'; readonly operation: 'grant' | 'remove'; readonly itemId: ItemId; readonly quantity: number }
  | { readonly type: 'flag'; readonly operation: 'add' | 'remove'; readonly flagId: FlagId }
  | { readonly type: 'faction'; readonly factionId: FactionId; readonly amount: number }
  | { readonly type: 'companion'; readonly companionId: CompanionId; readonly operation: CompanionOperation }
  | { readonly type: 'vitals'; readonly health?: number; readonly resource?: number }
  | { readonly type: 'callback'; readonly promise: CallbackPromiseDefinition }
  | { readonly type: 'combat'; readonly encounterId: EncounterId };

export interface ContentIndex {
  readonly events: ReadonlyMap<EventId, ChronicleEvent>;
  readonly items: ReadonlyMap<ItemId, ItemDefinition>;
  readonly enemies: ReadonlyMap<EnemyId, EnemyDefinition>;
  readonly encounters: ReadonlyMap<EncounterId, EncounterDefinition>;
  readonly companions: ReadonlyMap<CompanionId, CompanionDefinition>;
  readonly merchants: ReadonlyMap<MerchantId, MerchantDefinition>;
  readonly artIds: ReadonlySet<string>;
  readonly audioIds: ReadonlySet<string>;
}
```

- [ ] **Step 4: Run `npm test -- content-schema.test.ts` and `npm run build`; both pass.**
- [ ] **Step 5: Commit `feat: add Chronicle I domain contracts`.**

### Task 2: Inventory and progression as derived state

**Files:**
- Create: `src/game/inventory.ts`
- Create: `src/game/progression.ts`
- Create: `tests/inventory.test.ts`
- Create: `tests/progression.test.ts`
- Modify: `src/game/content/schema.ts`

**Interfaces:**
- Consumes: `ItemDefinition`, stable IDs, and `DomainResult`.
- Produces: `InventoryState`, `HeroProgress`, `inventorySlotUsage`, `applyInventoryCommand`, `useItem`, `deriveHeroStats`, `grantExperience`, and `chooseTalent`.

- [ ] **Step 1: Write failing tests for stacking, equipment capacity, context-aware consumables, XP bands, and talent levels.**

```ts
it('uses a potion in combat and in the field from the same stack', () => {
  const inventory = inventoryWith('potion-red', 2);
  const combatUse = useItem(inventory, 'stack-potion-red', 'combat', ITEMS_FIXTURE);
  expect(combatUse.ok && combatUse.value.inventory.pack[0]?.quantity).toBe(1);
  expect(combatUse.ok && combatUse.value.turnSpent).toBe(true);
  const fieldUse = useItem(combatUse.ok ? combatUse.value.inventory : inventory, 'stack-potion-red', 'field', ITEMS_FIXTURE);
  expect(fieldUse.ok && fieldUse.value.turnSpent).toBe(false);
});

it.each([3, 6, 9, 12, 15])('offers a talent at level %i', (level) => {
  expect(levelReward(level).talentChoice).toBe(true);
});
```

- [ ] **Step 2: Run `npm test -- inventory.test.ts progression.test.ts` and confirm failures.**
- [ ] **Step 3: Implement a 24-slot pack, stacked consumables, equipment/stash/quest partitions, atomic inventory commands, the level 1–15 XP curve, chapter soft caps, diminishing repeated-encounter XP, and derived stats. Do not persist derived attack/armor bonuses.**

```ts
export interface InventoryState {
  readonly pack: readonly InventoryEntry[];
  readonly stash: readonly InventoryEntry[];
  readonly questItems: readonly ItemId[];
  readonly equipment: {
    readonly weapon: string | null;
    readonly armor: string | null;
    readonly charms: readonly string[];
  };
}

export function deriveHeroStats(
  hero: HeroProgress,
  inventory: InventoryState,
  items: ReadonlyMap<ItemId, ItemDefinition>,
  boons: readonly BoonState[] = [],
): DerivedHeroStats;
```

- [ ] **Step 4: Run both focused tests plus `npm run build`; all pass.**
- [ ] **Step 5: Commit `feat: add inventory and level progression`.**

### Task 3: Companion recruitment and merchant transactions

**Files:**
- Create: `src/game/companions.ts`
- Create: `src/game/merchant.ts`
- Create: `tests/companions.test.ts`
- Create: `tests/merchant.test.ts`

**Interfaces:**
- Consumes: `CampaignState`, `InventoryState`, `ContentIndex`, and seeded RNG.
- Produces: `evaluateRecruitment`, `applyCompanionEffect`, `buildCompanionCombatSnapshot`, `generateMerchantVisit`, `quoteTrade`, and `executeTrade`.

- [ ] **Step 1: Write failing reachability and atomic-trade tests.**

```ts
it('does not recruit Rukhar from a single favorable choice', () => {
  const campaign = campaignWithFlags(['rukhar-met', 'orc-courier-spared']);
  expect(evaluateRecruitment('rukhar', campaign, CONTENT_FIXTURE).eligible).toBe(false);
});

it('reopening a merchant preserves stock and prevents duplicate purchase', () => {
  const visit = generateMerchantVisit(MERCHANT_CONTEXT, ROAD_TRADER);
  const first = executeTrade(visit, INVENTORY_FIXTURE, 100, { type: 'buy', stockEntryId: visit.stock[0]!.id }, MERCHANT_CONTEXT);
  expect(first.ok).toBe(true);
  const second = first.ok
    ? executeTrade(first.value.visit, first.value.inventory, first.value.gold, { type: 'buy', stockEntryId: visit.stock[0]!.id }, MERCHANT_CONTEXT)
    : first;
  expect(second.ok).toBe(false);
});
```

- [ ] **Step 2: Run `npm test -- companions.test.ts merchant.test.ts` and confirm failures.**
- [ ] **Step 3: Implement the five companion progress records, qualitative loyalty tiers, three-stage personal quests, multi-condition recruitment, one active companion, seeded persisted merchant stock, reputation/scarcity price bounds, and atomic buy/sell results.**
- [ ] **Step 4: Add tests proving all five paths are reachable, none are automatic, sell quotes stay within configured limits, and powerful stock respects gates; run both test files and build.**
- [ ] **Step 5: Commit `feat: add companions and merchants`.**

### Task 4: Multi-role deterministic combat

**Files:**
- Create: `src/game/combat/types.ts`
- Create: `src/game/combat/attack.ts`
- Create: `src/game/combat/enemy-ai.ts`
- Create: `src/game/combat/encounters.ts`
- Create: `src/game/combat/resolve.ts`
- Modify: `src/game/combat.ts`
- Create: `tests/combat-attack.test.ts`
- Create: `tests/combat-groups.test.ts`
- Modify: `tests/combat.test.ts`

**Interfaces:**
- Consumes: derived hero stats, inventory item use, companion snapshots, enemy/encounter indexes.
- Produces: `createEncounter` and `resolveCombatTurn` returning combat, inventory, and typed domain events atomically.

- [ ] **Step 1: Write failing deterministic outcome and group-behavior tests.**

```ts
it.each(['miss', 'glancing', 'hit', 'critical', 'blocked', 'parried'] as const)(
  'serializes the %s attack outcome',
  (expected) => {
    const combat = combatFixtureForOutcome(expected);
    const result = resolveCombatTurn(combat, { type: 'attack', targetId: 'enemy-1' }, INVENTORY_FIXTURE, COMBAT_CONTENT);
    expect(result.events).toContainEqual(expect.objectContaining({ type: 'attack_resolved', outcome: expected }));
  },
);

it('never allows three ordinary misses in sequence without a blind status', () => {
  expect(runForcedLowRolls(3).map((turn) => turn.outcome)).toEqual(['miss', 'miss', 'glancing']);
});
```

- [ ] **Step 2: Run the combat tests and verify the new outcomes/actions fail.**
- [ ] **Step 3: Implement saved accuracy/crit rolls, 88–115% bounded power variation, glancing damage, block/parry, two-miss bad-luck state, target selection, class resources, status ticking, visible primary intent, enemy roles, companion commands with cooldown, flee rules, and boss phase transitions.**

```ts
export type CombatAction =
  | { readonly type: 'attack'; readonly targetId: string }
  | { readonly type: 'guard' }
  | { readonly type: 'technique'; readonly techniqueId: string; readonly targetId?: string }
  | { readonly type: 'consumable'; readonly instanceId: string; readonly targetId?: string }
  | { readonly type: 'companion'; readonly targetId?: string }
  | { readonly type: 'flee' };

export interface CombatTurnResult {
  readonly combat: CombatState;
  readonly inventory: InventoryState;
  readonly events: readonly DomainEvent[];
}
```

- [ ] **Step 4: Run combat tests and a deterministic no-companion/companion simulation fixture; mandatory baseline encounters remain winnable and companion damage does not exceed its configured support budget.**
- [ ] **Step 5: Commit `feat: expand deterministic tactical combat`.**

### Task 5: Lazy procedural director with anchors and callbacks

**Files:**
- Create: `src/game/director/types.ts`
- Create: `src/game/director/eligibility.ts`
- Create: `src/game/director/pacing.ts`
- Create: `src/game/director/select.ts`
- Modify: `src/game/director.ts`
- Create: `tests/director-callbacks.test.ts`
- Create: `tests/director-pacing.test.ts`
- Modify: `tests/director.test.ts`

**Interfaces:**
- Consumes: `ContentIndex`, campaign/expedition context, saved `DirectorState`.
- Produces: `selectNextScene(state, context, content): DirectorStep` and `chooseRouteOptions(...)`.

- [ ] **Step 1: Write failing tests for fixed anchors, callback deadlines, anti-repeat, threat encounters, unseen priority, and saved RNG.**

```ts
it('schedules a promised callback before its deadline', () => {
  const state = directorWithPromise({ targetEventId: 'rukhar-callback-03', deadline: { chapterId: 'ch03', slot: 6 } });
  const step = selectNextScene(state, directorContext({ position: { chapterId: 'ch03', slot: 6 } }), CONTENT_FIXTURE);
  expect(step.sceneId).toBe('rukhar-callback-03');
  expect(step.state.pendingCallbacks[0]?.status).toBe('fulfilled');
});

it('resumes from the saved RNG state instead of rerolling', () => {
  const first = selectNextScene(SAVED_DIRECTOR, CONTEXT, CONTENT_FIXTURE);
  const second = selectNextScene(SAVED_DIRECTOR, CONTEXT, CONTENT_FIXTURE);
  expect(second).toEqual(first);
});
```

- [ ] **Step 2: Run director tests and verify failures against the current prebuilt route.**
- [ ] **Step 3: Implement lazy selection with priority `overdue callback → due main anchor → threat encounter → paced eligible event`, three route risk profiles, persistent multi-run cooldowns, current-run uniqueness, threat/tension changes, and exact RNG state updates.**
- [ ] **Step 4: Enumerate 1,000 fixture routes and assert no skipped anchors, duplicate event within a run, expired required callback, or impossible merchant/recovery drought; run director tests.**
- [ ] **Step 5: Commit `feat: add Chronicle I journey director`.**

### Task 6: Layered state, camp defeat, and chapter restart

**Files:**
- Create: `src/game/state/types.ts`
- Create: `src/game/state/create.ts`
- Create: `src/game/state/effects.ts`
- Create: `src/game/state/reducer.ts`
- Modify: `src/game/state.ts`
- Create: `tests/checkpoints.test.ts`
- Modify: `tests/state.test.ts`

**Interfaces:**
- Consumes: every pure domain module from Tasks 1–5.
- Produces: `GameStateV2`, `createCampaign`, `reduceGame`, `returnToCampAfterDefeat`, `restartChapter`, and the compatibility `gameReducer`.

- [ ] **Step 1: Write failing state and snapshot tests.**

```ts
it('loses expedition gains but keeps permanent progression on defeat', () => {
  const state = gameWithCampCheckpoint({ unbankedGold: 40, temporaryBoons: ['road-blessing'], xpGained: 60 });
  const next = returnToCampAfterDefeat(state, CONTENT_FIXTURE);
  expect(next.expedition?.temporaryBoons).toEqual([]);
  expect(next.campaign.hero.xp).toBe(state.campaign.hero.xp);
  expect(next.campaign.bankedGold).toBe(state.checkpoints.camp?.campaign.bankedGold);
  expect(next.campaign.attemptCounters.ch01).toBeGreaterThan(state.campaign.attemptCounters.ch01);
});

it('restores the chapter snapshot without rewinding its seed nonce', () => {
  const next = restartChapter(GAME_AFTER_CHOICE, CONTENT_FIXTURE);
  expect(next.campaign.flags).toEqual(GAME_AFTER_CHOICE.checkpoints.chapter.campaign.flags);
  expect(next.campaign.attemptCounters.ch01).toBe(GAME_AFTER_CHOICE.campaign.attemptCounters.ch01 + 1);
});
```

- [ ] **Step 2: Run `npm test -- checkpoints.test.ts state.test.ts` and confirm failures.**
- [ ] **Step 3: Implement the layered state below, atomic effect application, typed commands, current-scene selectors, camp banking, 50% unbanked-gold defeat loss, chapter snapshots, and attempt counters outside restored payloads.**

```ts
export interface GameStateV2 {
  readonly schemaVersion: 2;
  readonly profile: ProfileState;
  readonly campaign: CampaignState;
  readonly expedition: ExpeditionState | null;
  readonly checkpoints: {
    readonly chapter: ChapterSnapshot;
    readonly camp: CampSnapshot | null;
  };
  readonly flow: FlowState;
  readonly updatedAt: string;
}

export interface GameTransition {
  readonly state: GameStateV2;
  readonly events: readonly DomainEvent[];
  readonly diagnostic?: CommandDiagnostic;
}

export function reduceGame(state: GameStateV2, command: GameCommand, content: ContentIndex): GameTransition;
```

- [ ] **Step 4: Run checkpoint/state tests and build, then update only compatibility call sites required for compilation.**
- [ ] **Step 5: Commit `feat: add campaign checkpoints and reducer v2`.**

### Task 7: Safe persistence, migration, and lifecycle flush

**Files:**
- Create: `src/game/persistence/schema.ts`
- Create: `src/game/persistence/checksum.ts`
- Create: `src/game/persistence/migrate.ts`
- Create: `src/game/persistence/repository.ts`
- Modify: `src/game/persistence.ts`
- Create: `src/native/lifecycle.ts`
- Create: `tests/migration-v1.test.ts`
- Create: `tests/persistence-recovery.test.ts`
- Modify: `tests/persistence.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GameStateV2` and injected Storage/clock.
- Produces: `createSaveRepository`, three slot envelopes, active/backup safety, v1 migration, and `subscribeToAppBackground`.

- [ ] **Step 1: Write failing tests for backup-before-active, checksum rejection, recovery, v1 archive, and background flush.**

```ts
it('recovers the previous valid backup when active data is corrupt', () => {
  const storage = memoryStorage();
  const repo = createSaveRepository(storage, () => '2026-08-31T00:00:00.000Z');
  repo.saveSlot(1, GAME_FIXTURE);
  storage.setItem('morrowmere:save:v2:1:active', '{broken');
  const loaded = repo.loadSlot(1);
  expect(loaded.ok && loaded.source).toBe('backup');
});

it('archives v1 and migrates settings without story flags', () => {
  const migrated = migrateSave(LEGACY_V1_FIXTURE);
  expect(migrated.profile.settings.textScale).toBe(LEGACY_V1_FIXTURE.settings.textScale);
  expect(migrated.campaign.flags).toEqual([]);
  expect(migrated.campaign.chapterId).toBe('ch01');
});
```

- [ ] **Step 2: Run persistence tests and confirm failures.**
- [ ] **Step 3: Implement stable envelope serialization, checksum, backup-first writes, raw corrupt archive, three slots, profile/settings preservation, legacy archive, import/export validation, and injected lifecycle/background subscription.**

```ts
export interface SaveRepository {
  loadProfile(): ProfileLoadResult;
  saveProfile(profile: ProfileState): SaveResult;
  loadSlot(slot: 1 | 2 | 3): SlotLoadResult;
  saveSlot(slot: 1 | 2 | 3, state: GameStateV2): SaveResult;
  exportSlot(slot: 1 | 2 | 3): string | null;
  importSlot(slot: 1 | 2 | 3, raw: string): SlotLoadResult;
}
```

- [ ] **Step 4: Update `App.tsx` to hold the active slot, save every state transition, flush the latest ref on native/browser backgrounding, and expose Save & Exit without creating rewindable manual snapshots; run tests and build.**
- [ ] **Step 5: Commit `feat: add resilient Chronicle I saves`.**

### Task 8: Core integration and focused balance gate

**Files:**
- Create: `tests/core-integration.test.ts`
- Create: `tests/balance-smoke.test.ts`
- Modify: only core files required by observed failures

**Interfaces:**
- Consumes: public facades from Tasks 1–7.
- Produces: a stable core API for content, UI, media, and advertising plans.

- [ ] **Step 1: Add one integration test that creates a campaign, selects a route, resolves a choice, enters group combat, uses a consumable, calls a companion, wins, banks loot, buys one item, saves, reloads, loses the next expedition, and restarts the chapter.**
- [ ] **Step 2: Add a seeded smoke simulation for all three classes at chapter bands 1, 4, and 8, with no companion and with one companion. Assert deterministic completion, no invalid numeric state, and companion contribution below the configured support ceiling; do not use the simulation to auto-nerf the game.**
- [ ] **Step 3: Run `npm test -- core-integration.test.ts balance-smoke.test.ts` followed by the existing domain suite. Fix only reproduced contract regressions.**
- [ ] **Step 4: Run `npm run build` and `git diff --check`. Export the stable interfaces through the four compatibility facades.**
- [ ] **Step 5: Commit `test: lock Chronicle I core integration`.**

