# Morrowmere Route Flow and Per-Chapter Dungeons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make travel feel like a coherent, player-directed roguelike journey and give each of the eight chapters a distinct dungeon or dungeon-like sequence.

**Architecture:** Keep main-story landmarks and authored continuations authoritative. Replace the fixed after-every-scene Road Tactics interruption with chapter-authored route junctions; persist an active dungeon path using IDs and a seed, and resolve its rooms through the existing story, combat, and reward screens.

**Tech Stack:** TypeScript 7, React 19, Vite 8, existing game reducer/director/content catalog, Vitest 4, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-24-morrowmere-roguelike-dungeon-overhaul-design.md`

## Global Constraints

- Authored sub-scenes and their aftermaths no longer force Road Tactics between each other; route selection appears only at intentional junctions.
- Main-quest landmarks remain reachable and are never skipped by route generation.
- A route presents meaningful alternatives and carries their consequences forward.
- Every one of the eight chapters contains a distinct dungeon/dungeon-like sequence with chapter-appropriate length, stakes, and activity; early chapters include compact mini-dungeons.
- A Chapter 5 dungeon run has roughly 10–12 rooms, 6–8 varied fights including elite/boss peaks, noncombat/recovery opportunities, branching route choices, and a clear extraction decision.
- Route/menu cadence and option count vary with story and prior decisions; the dungeon is not a repeated default option after each event.
- No encounter or reward resolves twice in one run, and battle transitions do not hide or erase choice outcomes.
- Saving/loading at all dungeon phases resumes safely, and pre-overhaul saves remain loadable.
- Preserve the user's current DialoguePanel and Living Departure edits and all in-progress visual-smoke screenshots.

## Review Focus

1. A v2/v3 save in story, combat, reward, travel, or merchant flow must resume without replaying a scene, fight, or reward; pin this in the persistence-migration task.
2. Required/optional authored aftermaths and dialogue beats must finish before the next route junction; pin this in the reducer-flow task.
3. Flag-gated routes must appear only when their exact prior choice permits them and must retain their consequences; pin this in route-graph and chapter-content tasks.
4. A fixed seed must produce a repeatable route while a completed node or encounter cannot appear twice in one run; pin this in graph and reducer tasks.
5. Retreat, defeat, and extraction must settle only the intended share of unsecured rewards and never strand a run; pin this in the reducer-flow task.

---

## File map

- `src/game/content/schema.ts` and `src/game/content/chronicle1/index.ts`: add authored chapter route junctions and dungeon catalogs to the immutable content index and validate references against scenes, dungeons, and encounters.
- New `src/game/dungeon/types.ts` and `src/game/dungeon/routes.ts`: define dungeon rooms/exits, deterministic seed-based encounter/reward variants, and eligible-route selection without changing the combat engine.
- `src/game/content/chronicle1/routes.ts` and new `src/game/content/chronicle1/dungeons.ts`: author story-motivated world junctions and chapter-specific dungeon graphs.
- `src/game/state/types.ts`, `src/game/state/reducer.ts`, and `src/game/state/road-tactics.ts`: persist an active run and pending authored junction, and decide when to continue scenes versus show a real junction.
- `src/game/persistence/schema.ts` and `src/game/persistence/codec.ts`: read v2/v3 and write v4 save data with safe defaults.
- `src/ui/types.ts`, `src/ui/selectors.ts`, `src/components/TravelPanel.tsx`, `src/components/GameShell.tsx`, and `src/styles/game.css`: show contextual route options using the current travel flow, without adding a redundant screen.
- `src/game/content/chronicle1/chapters/ch01` through `ch08`: author distinct connected dungeon routes using existing story, choice, and encounter content.
- `tests/road-tactics-reducer.test.ts`, `tests/road-tactics-persistence.test.ts`, `tests/road-tactics-ui.test.tsx`, `tests/content/chronicle1-routes.test.ts`, and focused new dungeon tests: cover transitions, saves, choice variation, and graph integrity.

The route panel submits `{ type: 'select-route', optionId, updatedAt }`. It does not overload the existing fixed `TravelAction` commands; reducer validation resolves the option against the currently active authored junction before changing state.

## Interfaces shared with other plans

- Produces an authored `DungeonDefinition` and persisted `DungeonRunState`; the combat plan consumes its encounter IDs without owning route generation.
- Produces exact new scene/encounter IDs for the art plan. Each scene uses `chapterId + illustrationId`; each encounter's battle plate is keyed by encounter ID.
- Does not add a new `flow.screen`; the current `travel`, `story`, `combat`, and `reward` screens remain the only journey screens.

The content interfaces below reuse the existing domain `ChapterId`, `EventId`, `EncounterId`, `ItemId`, `StoryPosition`, and `GameEffect` types. A dungeon node is exactly one authored scene, one encounter (fixed or seeded variants), or a terminal exit scene; content validation rejects incompatible combinations.

### Task 1: Define dungeon nodes, exits, and content validation

**Files:**
- Create: `src/game/dungeon/types.ts`
- Create: `src/game/dungeon/routes.ts`
- Create: `src/game/content/chronicle1/dungeons.ts`
- Create: `tests/dungeon-routes.test.ts`
- Modify: `src/game/content/schema.ts`
- Modify: `src/game/content/validate.ts`
- Modify: `src/game/content/chronicle1/index.ts`
- Modify: `src/game/content/chronicle1/routes.ts`
- Modify: `tests/fixtures/game.ts`
- Modify: `tests/content/chronicle1-routes.test.ts`

**Interfaces:**

```ts
export type DungeonNodeKind = 'scene' | 'combat' | 'hazard' | 'rest' | 'cache' | 'elite' | 'boss' | 'exit';
export type DungeonExitKind = 'complete' | 'extract' | 'retreat';
export interface DungeonExit {
  readonly id: string;
  readonly targetNodeId: string;
  readonly label: string;
  readonly detail: string;
  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
}
export interface DungeonNode {
  readonly id: string;
  readonly kind: DungeonNodeKind;
  readonly exitKind?: DungeonExitKind;
  readonly sceneId?: EventId;
  readonly encounterId?: EncounterId;
  /** When present, the run seed and node ID select one encounter without advancing campaign RNG. */
  readonly encounterVariants?: readonly EncounterId[];
  /** Cache/rest rewards use the same stable seed + node ID selection and normal effect application. */
  readonly rewardVariants?: readonly { readonly id: string; readonly effects: readonly GameEffect[] }[];
  readonly exits: readonly DungeonExit[];
}
export interface DungeonDefinition {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly startNodeId: string;
  readonly exitNodeIds: readonly string[];
  readonly nodes: readonly DungeonNode[];
}
export type RouteDestination =
  | { readonly kind: 'scene'; readonly sceneId: EventId }
  | { readonly kind: 'dungeon'; readonly dungeonId: string };
export interface RouteOptionDefinition {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly consequence: string;
  readonly kind: 'story' | 'combat' | 'dungeon' | 'rest' | 'supply' | 'shortcut';
  readonly destination: RouteDestination;
  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
  readonly effects?: readonly GameEffect[];
}
export interface RouteJunctionDefinition {
  readonly id: string;
  readonly chapterId: ChapterId;
  /** The saved campaign position used to recover an obsolete legacy travel screen safely. */
  readonly position: StoryPosition;
  /** The junction becomes active only after this scene and its authored aftermath queue finish. */
  readonly afterEventId: EventId;
  readonly options: readonly RouteOptionDefinition[];
}
export interface DungeonRunState {
  readonly dungeonId: string;
  readonly seed: number;
  readonly currentNodeId: string;
  readonly depth: number;
  readonly visitedNodeIds: readonly string[];
  readonly resolvedNodeIds: readonly string[];
}
export function availableRouteOptions(
  junction: RouteJunctionDefinition,
  flags: ReadonlySet<string>,
): readonly RouteOptionDefinition[];
export function resolveDungeonEncounter(
  node: DungeonNode,
  runSeed: number,
): EncounterId | null;
export function resolveDungeonReward(
  node: DungeonNode,
  runSeed: number,
): { readonly id: string; readonly effects: readonly GameEffect[] } | null;
export function availableDungeonExits(
  definition: DungeonDefinition,
  nodeId: string,
  flags: ReadonlySet<string>,
  visitedNodeIds: readonly string[],
): readonly DungeonExit[];
```

- [ ] **Step 1: Write failing graph, seed, and choice tests** in `tests/dungeon-routes.test.ts`: assert a two-exit node returns both exits when eligible, excludes a flag-gated exit when its flag is absent, omits a previously visited target, rejects an unknown destination, rejects a reachable path that can schedule the same encounter ID twice even through variant pools, and resolves encounter/reward variants identically for the same seed and node without mutating campaign RNG.
- [ ] **Step 2: Run `npm run test:run -- tests/dungeon-routes.test.ts tests/content/chronicle1-routes.test.ts`;** confirm the new imports/expectations fail before implementation.
- [ ] **Step 3: Implement the exact interfaces above** in `src/game/dungeon/types.ts` and the route catalog types in `src/game/content/schema.ts`; implement `availableDungeonExits` and `availableRouteOptions` in `src/game/dungeon/routes.ts`; add `dungeons` and `routeJunctions` maps to `ContentIndex`; assemble both catalogs in `src/game/content/chronicle1/index.ts`.
- [ ] **Step 4: Add graph/junction validation** to `src/game/content/validate.ts`: unique dungeon/node/exit/junction/option/reward-variant IDs, valid chapter and scene/dungeon/encounter/item references, correct scene/encounter/exit node shapes, `exitKind` only on terminal exit nodes, no missing destinations, no duplicate encounter ID on any reachable dungeon path across all variant combinations, every declared exit reachable from its start, and at least one terminal exit per dungeon. Each junction must have at least two materially distinct destinations across valid flag profiles and must never have zero eligible choices; a one-option state resolves directly without a board. Add invalid-graph/junction fixtures to `tests/content/chronicle1-routes.test.ts` and update `tests/fixtures/game.ts` with empty route-junction and dungeon maps.
- [ ] **Step 5: Run the two focused commands from Step 2** and confirm eligible exits, terminal reachability, and the existing chapter routes are valid.
- [ ] **Step 6: Commit** the domain and content contract as `feat: define authored dungeon routes`.

### Task 2: Persist dungeon progress without breaking existing saves

**Files:**
- Modify: `src/game/state/types.ts`
- Modify: `src/game/state/create.ts`
- Modify: `src/game/persistence/schema.ts`
- Modify: `src/game/persistence/codec.ts`
- Modify: `tests/road-tactics-persistence.test.ts`
- Modify: `tests/persistence-recovery.test.ts`

**Interfaces:**
- `ExpeditionState.dungeonRun` is `DungeonRunState | null`; `pendingRouteJunctionId` is a route-junction ID or `null`.
- Save schema v4 serializes every `DungeonRunState` field as JSON IDs/numbers/arrays only. It does not serialize immutable room definitions.
- Migrating v2/v3 adds `dungeonRun: null` and retains position, current scene, combat, reward receipt, unbanked gold, and inventory exactly.

- [ ] **Step 1: Add failing v4 migration cases** to `tests/road-tactics-persistence.test.ts`: preserve a fresh v3 departure travel save as departure, map a post-event v3 travel save to the nearest valid authored junction using its saved position without replaying/clearing `sceneResolution` or the authored queue, and load v3 story/combat/reward/merchant screens unchanged. Assert legacy saves gain `dungeonRun: null`; add a v4 active-run round trip asserting `currentNodeId`, seed, depth, visited/resolved IDs, and a pending junction ID survive.
- [ ] **Step 2: Run `npm run test:run -- tests/road-tactics-persistence.test.ts tests/persistence-recovery.test.ts`;** confirm the migration and v4 round-trip cases fail.
- [ ] **Step 3: Add nullable `dungeonRun` and `pendingRouteJunctionId` to expedition state and v4 DTOs;** update save version dispatch in `src/game/persistence/schema.ts` and hydration/serialization in `src/game/persistence/codec.ts`. Preserve legacy story/combat/reward/merchant screens and current campaign position. With `ContentIndex` available during decode, keep a fresh departure screen when there is no completed travel receipt; map only obsolete post-event travel to the nearest valid junction by chapter/slot, retaining scene receipts and queued aftermaths so no content replays.
- [ ] **Step 4: Reject malformed runs** whose dungeon/node IDs are invalid, depth is negative, or visited/resolved IDs are not string arrays; keep legacy recovery behavior for malformed old saves.
- [ ] **Step 5: Run the focused persistence tests** and the existing `tests/persistence.test.ts`; confirm old saves load and a run resumes without rerolling its path.
- [ ] **Step 6: Commit** as `feat: persist seeded dungeon progress`.

### Task 3: Make authored story flow continuous and junctions intentional

**Files:**
- Modify: `src/game/state/road-tactics.ts`
- Modify: `src/game/state/reducer.ts`
- Modify: `src/game/state/types.ts`
- Modify: `tests/road-tactics-reducer.test.ts`
- Modify: `tests/authored-combat-routing.test.ts`

- [ ] **Step 1: Write failing reducer cases** asserting a setup → choice → required aftermath sequence resolves without entering `travel` between its scenes; a battle choice shows its outcome before `combat`; claiming a reward advances to the next authored dungeon node/junction exactly once; and extraction/defeat settles only the documented unsecured-reward share.
- [ ] **Step 2: Run `npm run test:run -- tests/road-tactics-reducer.test.ts tests/authored-combat-routing.test.ts`;** confirm the current forced-`enterTravel` path violates the new cases.
- [ ] **Step 3: Add the `select-route` command and change `select-next-scene` handling** so a resolved scene first drains eligible required/optional authored continuations; once an authored `afterEventId` has fully resolved, set its pending junction ID and enter `travel`; if there is one eligible option, resolve it directly without rendering an empty route board. Keep each resolution visible until the player advances it.
- [ ] **Step 4: Validate `select-route` against `pendingRouteJunctionId`**; apply its authored effects once, clear the pending ID, then enter its scene or start the chosen dungeon. A victory reward advances to its exact next dungeon node; an authored extraction/retreat exit settles only its explained unsecured-reward share and enters its exit scene; defeat retains the existing return-to-camp recovery plus half-unbanked-gold settlement. Clear the active run only after terminal resolution; never select a random scene automatically or repeat a resolved encounter ID.
- [ ] **Step 5: Add reducer guards** for stale route choices, completed nodes, and duplicate reward claims; each rejected command leaves the state unchanged and returns a diagnostic.
- [ ] **Step 6: Run both focused reducer tests** plus `tests/road-tactics-director.test.ts`; confirm normal random travel still selects eligible content when no authored junction is pending.
- [ ] **Step 7: Commit** as `fix: keep authored journeys between meaningful junctions`.

### Task 4: Render contextual route options rather than the fixed tactics grid

**Files:**
- Modify: `src/ui/types.ts`
- Modify: `src/ui/selectors.ts`
- Modify: `src/components/TravelPanel.tsx`
- Modify: `src/components/GameShell.tsx`
- Modify: `src/styles/game.css`
- Modify: `tests/road-tactics-ui.test.tsx`
- Modify: `tests/ui-selectors.test.ts`

**Interfaces:**

```ts
export interface RouteOptionViewModel {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly consequence: string;
  readonly kind: 'story' | 'combat' | 'dungeon' | 'rest' | 'supply' | 'shortcut';
  readonly artSrc: string;
  readonly artAlt: string;
}
```

`TravelViewModel` distinguishes `departure`, `junction`, and `dungeon` modes. Its authored `options` list comes from `pendingRouteJunctionId` outside a dungeon or the active dungeon node inside it; the departure mode retains the existing four opening travel preparations once at expedition start. After the first `travel-action` selects a scene, authored scenes continue directly and the opening grid is not shown again unless a deliberate chapter junction calls for it. The route panel dispatches `select-route`; companion/scout/rest modifiers appear only when the current junction authorizes them.

- [ ] **Step 1: Add failing UI/selector cases** for a two-option chapter junction, a flag-unlocked third option, and a direct continuation with zero options (which must skip the panel rather than render an empty map).
- [ ] **Step 2: Run `npm run test:run -- tests/road-tactics-ui.test.tsx tests/ui-selectors.test.ts`;** confirm the current fixed four-action panel cannot represent these states.
- [ ] **Step 3: Build route options in `selectTravelView`** from `pendingRouteJunctionId` and `availableRouteOptions`, or from the active dungeon node and `availableDungeonExits`; preserve hero/resource/threat/tension display and explain each real cost/risk in the option itself.
- [ ] **Step 4: Update `TravelPanel`** to retain the four existing preparations only in `departure` mode and render authored option counts/art in `junction` and `dungeon` modes, with no forced three-card layout; auto-continue only when a node has one unambiguous exit.
- [ ] **Step 5: Update mobile styles** so contextual 1–4 option layouts remain readable at 360×800, with accessible labels, touch targets, and focus order.
- [ ] **Step 6: Run the focused UI tests** and the existing route E2E test `tests/e2e/road-tactics.spec.ts`; confirm the opening departure prep still works once, legacy camp-to-travel entry remains operable, and authored travel never reopens the four-action grid between scenes.
- [ ] **Step 7: Commit** as `feat: show story-driven route junctions`.

### Task 5: Author varied dungeon journeys for Chapters 1–4

**Files:**
- Modify: `src/game/content/chronicle1/chapters/ch01/journey.ts` and `ch01/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch02/journey.ts` and `ch02/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch03/journey.ts` and `ch03/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch04/journey.ts` and `ch04/index.ts`
- Modify: `src/game/content/chronicle1/dungeons.ts`
- Modify: `src/game/content/chronicle1/routes.ts`
- Modify: `tests/content/chronicle1-ch01-ch02.test.ts`, `tests/content/chronicle1-ch03-ch04.test.ts`, `tests/content/chronicle1-playability.test.ts`

- [ ] **Step 1: Add failing content assertions** that Chapters 1–4 each have a connected, reachable 3–6 room dungeon sequence, chapter-appropriate consequences, and no repeated three-choice/dungeon-card template.
- [ ] **Step 2: Run the three focused content suites** and confirm the new chapter coverage assertions fail.
- [ ] **Step 3: Author each chapter from its existing canon:** Ch01 tollhouse cellar/culvert as a short first delve; Ch02 underwall/depot/basin approach with an infiltration-vs-confrontation branch; Ch03 toll archive where evidence and mechanisms matter; Ch04 mill drains/warehouse cellar where pursuit or rescue changes evidence and risk. Add contextual route junctions only at story-motivated anchors. Each delve has 1–3 fights at varied points, noncombat play, one or more consequential decisions, and a clear authored exit to the next main landmark.
- [ ] **Step 4: Wire optional/required flags** so earlier chapter decisions open or close their specific routes; make the reason legible in the route choice. Preserve all current authored outcomes and the user's uncommitted Living Departure changes.
- [ ] **Step 5: Run the three focused content suites** and confirm every route reaches a valid anchor or exit without duplicate event/encounter IDs.
- [ ] **Step 6: Commit** as `feat: add early chronicle mini-dungeons`.

### Task 6: Author Embervault's long-form expedition

**Files:**
- Modify: `src/game/content/chronicle1/chapters/ch05/journey.ts`, `ch05/main.ts`, and `ch05/index.ts`
- Modify: `src/game/content/chronicle1/dungeons.ts`
- Modify: `src/game/content/chronicle1/routes.ts`
- Modify: `src/game/content/chronicle1/enemies/encounters.ts` only for encounters introduced by this expedition
- Modify: `tests/content/chronicle1-ch05-ch06.test.ts`
- Create: `tests/content/chronicle1-ch05-dungeon.test.ts`

- [ ] **Step 1: Add failing graph/count tests** requiring each full entrance-to-boss completion path to contain about 10–12 rooms and 6–8 fights including 1–2 elites and one boss, at least two materially different branches, a middle recovery/supply opportunity, and early retreat exits that settle safely (not counted as full-run completion paths). Assert counts per playable path, not just totals across mutually exclusive branches.
- [ ] **Step 2: Run `npm run test:run -- tests/content/chronicle1-ch05-dungeon.test.ts tests/content/chronicle1-ch05-ch06.test.ts`;** confirm current Chapter 5 content does not satisfy the long-form run contract.
- [ ] **Step 3: Author the continuous deep-shaft route** from the mine mouth through the hidden armory. Ensure route branches vary enemies, evidence/rewards, and resource pressure; use `resolveDungeonEncounter` and `resolveDungeonReward` so the run seed selects stable authored variants while player choice selects the route. Any optional entrance route appears only at its story-motivated chapter junction, not after each preceding scene.
- [ ] **Step 4: Add explicit rest/supply, retreat, defeat, and extraction resolutions** using the existing `unbankedGold`, `unbankedLoot`, and recovery rules. Only the boss/exit path reaches the designated Chapter 5 story landmark.
- [ ] **Step 5: Run the focused Chapter 5 suites** and confirm exact room/fight counts, reachability, no repeated encounter IDs, and no path that can strand a save.
- [ ] **Step 6: Commit** as `feat: add the Embervault roguelike delve`.

### Task 7: Author distinct dungeon sequences for Chapters 6–8 and campaign-wide coverage

**Files:**
- Modify: `src/game/content/chronicle1/chapters/ch06/journey.ts`, `ch06/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch07/journey.ts`, `ch07/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch08/journey.ts`, `ch08/index.ts`
- Modify: `src/game/content/chronicle1/dungeons.ts`
- Modify: `src/game/content/chronicle1/routes.ts`
- Modify: `tests/content/chronicle1-ch07-ch08.test.ts`, `tests/content/chronicle1-playability.test.ts`

- [ ] **Step 1: Add failing chapter coverage tests** asserting distinct 3–8 room structures and mechanics for Chapel undercroft/siege breach, Keep aqueduct/archive, and Engine-service galleries.
- [ ] **Step 2: Run the focused Ch07/08 and playability suites** and confirm the distinct dungeon graph checks fail.
- [ ] **Step 3: Author Ch06 as a rescue/holdout sequence, Ch07 as a route trading safety/time/evidence, and Ch08 as an endgame infiltration/escape.** Vary path geometry, node verbs, option count, and battle cadence; do not copy Embervault's room sequence.
- [ ] **Step 4: Add one campaign-wide validation** that all eight chapter IDs have a playable dungeon definition with a reachable exit and at least one consequential decision.
- [ ] **Step 5: Run focused chapter, route, and playability suites** and confirm every dungeon exits into its intended main story state.
- [ ] **Step 6: Commit** as `feat: complete chapter dungeon routes`.

### Task 8: Verify complete route/save flow and hand off

**Files:**
- Modify: `tests/e2e/road-tactics.spec.ts`
- Create: `tests/e2e/chronicle-dungeon-flow.spec.ts`
- If implementation reveals a material divergence from the approved design, stop and ask the user to update the spec before changing the implementation scope.

- [ ] **Step 1: Add one end-to-end run** that starts at camp, completes a multi-scene chain without an intervening route menu, chooses a branch into a Chapter 1 mini-dungeon, saves mid-run, reloads at the same node, completes a battle/reward, and reaches the next main-quest anchor without replaying content.
- [ ] **Step 2: Add a separate Chapter 5 smoke path** asserting the player can choose between different dungeon branches, rest/extract, and resume a saved boss fight.
- [ ] **Step 3: Run the two E2E paths and all focused tests named above.** Record any failures and correct them before handoff.
- [ ] **Step 4: Commit** the final regression coverage as `test: cover chapter dungeon journeys`.

## Dependencies and order

Run Tasks 1–4 first. Tasks 5, 6, and 7 can then be authored independently by chapter groups; Task 8 follows them. The tactical-combat plan can proceed after Task 1's encounter IDs are stable. The art plan starts its final inventory after Tasks 5–7 settle the new scene/encounter IDs.
