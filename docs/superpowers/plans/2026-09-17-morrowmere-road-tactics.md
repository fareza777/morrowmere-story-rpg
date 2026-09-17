# Road Tactics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Chronicle I expeditions from an event-to-event reading chain into a deterministic, art-backed tactical road loop while repairing the audited build, test, media, accessibility, and release regressions.

**Architecture:** Keep Chronicle I `ContentIndex` and schema-version-3 runtime canonical. Add a persisted `travel` flow screen and a reducer-owned `travel-action` command; each action applies bounded effects and invokes the existing director exactly once with a temporary road bias. Port the existing road-event ideas into 16 modern authored scenes and add four illustrated action cards, while leaving the legacy event facade at its compatibility boundary.

**Tech Stack:** TypeScript 7, React 19, Vite 8, Vitest 4, Playwright, Capacitor Android, built-in `image_gen`, WebP media validation.

**Spec:** `docs/superpowers/specs/2026-09-17-morrowmere-road-tactics-design.md`

## Global Constraints

- The modern Chronicle I `ContentIndex` and schema-version-3 runtime remain canonical; legacy procedural events are compatibility-only.
- One road action is allowed per road leg, and the accepted action selects exactly one next scene or a valid terminal transition.
- Road action effects are deterministic, bounded by existing hero/director limits, and persisted through existing runtime state.
- `flow.screen === 'travel'` requires an expedition with no current scene, combat, reward, or merchant.
- New content includes 16 authored scenes plus 4 action-card illustrations: 20 total new images.
- Every new scene image is a unique 1536x1024 WebP with no text, logo, or watermark and an exact chapter/illustration path.
- Existing user changes in `DialoguePanel.tsx`, `living-departure.ts`, and `events.ts` must be preserved or coherently migrated.
- Production changes follow red-green-refactor: each new behavior has a failing test observed before its implementation.
- Do not weaken strict save validation to make stale fixtures pass; update fixtures and write explicit migration behavior.
- Final verification must cover `npm run test:run`, `npm run build`, `npm run test:e2e`, `npm run content:validate`, `npm run art:validate`, `npm run audio:validate`, `npm run check:android-size`, and `git diff --check`.

---

## File map

| Area | Files | Responsibility |
| --- | --- | --- |
| Travel domain | `src/game/state/types.ts`, `src/game/state/road-tactics.ts`, `src/game/state/reducer.ts`, `src/game/director/types.ts`, `src/game/director/pacing.ts`, `src/game/director/select.ts` | Commands, bounded action effects, director bias, and state transitions |
| Travel UI | `src/ui/types.ts`, `src/ui/selectors.ts`, `src/components/TravelPanel.tsx`, `src/components/GameShell.tsx`, `src/styles/game.css` | View model, accessible action cards, art paths, and flow wiring |
| Authored content | `src/game/content/chronicle1/chapters/ch01/road-tactics.ts`, `ch02/road-tactics.ts`, `ch05/road-tactics.ts`, `ch08/road-tactics.ts`, chapter indexes, `src/game/content/chronicle1/index.ts` | 16 new live Chronicle scenes and their source validation |
| Persistence | `src/game/persistence/schema.ts`, `src/game/persistence/codec.ts`, `src/game/state/create.ts`, `tests/persistence-recovery.test.ts`, new travel persistence tests | Travel screen validation, round-trip encoding, and old-save recovery |
| Media | `public/assets/chronicle1/scenes/ch01`, `ch02`, `ch05`, `ch08`, `public/assets/road-tactics`, `src/game/content/chronicle1/media-contract.ts`, `content/manifests/chronicle1-media-contract.json`, media scripts | New art, contract, exporter, and validation |
| Existing regressions | `src/game/content/events.ts`, audio/export scripts, release docs, UI/cinematic files, stale tests/fixtures | Close the audited failures without hiding invalid data |

---

### Task 1: Add the travel state and reducer contract

**Files:**
- Create: `src/game/state/road-tactics.ts`
- Modify: `src/game/state/types.ts:160-225`
- Modify: `src/game/state/create.ts:55-76`
- Modify: `src/game/state/reducer.ts:602-742, 880-930`
- Modify: `src/game/domain/result.ts` for the travel domain event
- Test: `tests/road-tactics-reducer.test.ts`

**Interfaces:**
- Produces `TravelAction = 'scout' | 'press-on' | 'make-camp' | 'companion'`.
- Produces `resolveTravelAction(state: GameStateV2, action: TravelAction, content: ContentIndex, updatedAt: string): GameTransition`.
- Produces `enterTravel(state: GameStateV2, updatedAt: string): GameStateV2` for resolved scene/reward/fled transitions.
- Consumes existing fixture factories in `tests/fixtures/game.ts`, `derivedMaxima`, `beginDirectorRun`, `selectNextScene`, `temporaryBoons`, `lastTravelAction`, and `heroVitals`.

- [ ] **Step 1: Write the failing reducer tests**

```ts
it('starts a route in travel before selecting a scene', () => {
  const started = reduceGame(campState, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt }, content);
  expect(started.state.flow.screen).toBe('travel');
  expect(started.state.expedition?.currentSceneId).toBeNull();
});

it('scout spends one resource and selects exactly one next scene', () => {
  const travel = routeState();
  const before = travel.expedition!.heroVitals.resource;
  const result = reduceGame(travel, { type: 'travel-action', action: 'scout', updatedAt }, content);
  expect(result.state.expedition!.heroVitals.resource).toBe(before - 1);
  expect(result.state.flow.screen).toBe('story');
  expect(result.state.expedition!.currentSceneId).not.toBeNull();
  expect(result.events.some((event) => event.domain.type === 'travel_action_taken')).toBe(true);
});

it('rejects scout at zero resource without changing state', () => {
  const travel = routeState({ expedition: { heroVitals: { health: 30, resource: 0 } } });
  const result = reduceGame(travel, { type: 'travel-action', action: 'scout', updatedAt }, content);
  expect(result.state).toEqual(travel);
  expect(result.diagnostic?.code).toBe('insufficient_resource');
});
```

- [ ] **Step 2: Run the focused test and verify the expected red failure**

Run: `npx vitest run --pool=threads tests/road-tactics-reducer.test.ts`

Expected: FAIL because `travel` and `travel-action` do not exist yet.

- [ ] **Step 3: Implement the minimum travel transition**

Add the `travel` screen and command, initialize new expeditions in travel, and move resolved-scene/reward/fled transitions to travel. `travel-action` must validate the screen, apply the action effect, call the director once, and return story/combat/terminal state. Do not add UI behavior in this task.

- [ ] **Step 4: Run the focused test and verify green**

Run: `npx vitest run --pool=threads tests/road-tactics-reducer.test.ts`

Expected: all Task 1 tests pass with no TypeScript or runtime errors.

- [ ] **Step 5: Commit**

```text
git add src/game/state/road-tactics.ts src/game/state/types.ts src/game/state/create.ts src/game/state/reducer.ts src/game/domain/result.ts tests/road-tactics-reducer.test.ts
git commit -m "feat: add road tactics travel state"
```

### Task 2: Make the director and companions react to road actions

**Files:**
- Modify: `src/game/director/types.ts`
- Modify: `src/game/director/pacing.ts`
- Modify: `src/game/director/select.ts`
- Modify: `src/game/state/road-tactics.ts`
- Modify: `src/game/content/chronicle1/companions.ts` only if an existing capability lacks a stable presentation string
- Test: `tests/road-tactics-director.test.ts`
- Test: `tests/road-tactics-companions.test.ts`

**Interfaces:**
- Produces `RoadBias = 'scout' | 'press-on' | 'make-camp' | 'mara' | 'rukhar' | 'caldus' | 'lyra' | 'talla'`.
- Extends `JourneyDirectorContext` with `roadBias?: RoadBias`.
- Produces `roadBiasWeight(event, bias): number` and keeps the existing callback/anchor/combat-limit selection order.
- Consumes the Task 1 `travel-action` command and existing companion `explorationCapability` definitions.

- [ ] **Step 1: Write the failing director and companion tests**

```ts
it('scout prefers an investigation candidate over a danger candidate when both are valid', () => {
  const selected = selectNextScene(director, { ...context, roadBias: 'scout' }, content, []);
  expect(selected.kind).toBe('selected');
  expect(selected.kind === 'selected' && selected.event.journeySubtype).toBe('investigation');
});

it('press-on never bypasses a required callback', () => {
  const selected = selectNextScene(withRequiredCallback(director), { ...context, roadBias: 'press-on' }, content, []);
  expect(selected.kind).toBe('selected');
  expect(selected.kind === 'selected' && selected.reason).toBe('callback');
});

it.each([
  ['mara', -2, 0, 'road:scouted'],
  ['rukhar', -1, -1, 'road:guarded'],
  ['caldus', 0, 0, 'road:triaged'],
  ['lyra', -1, 0, 'road:proof'],
  ['talla', -1, -1, 'road:hidden'],
] as const)('%s has a deterministic exploration effect', (companion, threatDelta, tensionDelta, boon) => {
  const before = routeStateWith(companion);
  const result = resolveCompanionRoadMove(before, content, updatedAt);
  expect(result.state.expedition!.director.threat).toBeGreaterThanOrEqual(0);
  expect(result.state.expedition!.director.threat).toBeLessThanOrEqual(10);
  expect(result.events.some((event) => event.domain.type === 'travel_action_taken')).toBe(true);
  expect(result.state.expedition!.temporaryBoons).toContain(boon);
  expect(result.state.expedition!.director.threat - before.expedition!.director.threat).toBe(threatDelta);
  expect(result.state.expedition!.director.tension - before.expedition!.director.tension).toBe(tensionDelta);
});
```

- [ ] **Step 2: Run both focused files and verify red**

Run: `npx vitest run --pool=threads tests/road-tactics-director.test.ts tests/road-tactics-companions.test.ts`

Expected: FAIL because `roadBias` and companion road moves are not implemented.

- [ ] **Step 3: Implement the minimum bias and capability mapping**

Apply the exact first-pass tuning from the spec: scout threat -2/resource -1, press-on threat +1/tension +1, make-camp health +6/resource +2/tension +1, and companion effects Mara -2 threat, Rukhar -1 threat/-1 tension, Caldus +8 health/+1 resource, Lyra -1 threat, Talla -1 threat/-1 tension. Clamp all vitals/director values. Use road bias only in the paced candidate weights; callbacks, anchors, eligibility, and combat streak rules remain authoritative.

- [ ] **Step 4: Run the focused files and verify green**

Run: `npx vitest run --pool=threads tests/road-tactics-director.test.ts tests/road-tactics-companions.test.ts tests/road-tactics-reducer.test.ts`

Expected: all travel domain tests pass.

- [ ] **Step 5: Commit**

```text
git add src/game/director/types.ts src/game/director/pacing.ts src/game/director/select.ts src/game/state/road-tactics.ts src/game/content/chronicle1/companions.ts tests/road-tactics-director.test.ts tests/road-tactics-companions.test.ts
git commit -m "feat: bias journey director with road tactics"
```

### Task 3: Build and wire the Road Tactics UI

**Files:**
- Create: `src/components/TravelPanel.tsx`
- Modify: `src/ui/types.ts`
- Modify: `src/ui/selectors.ts`
- Modify: `src/components/GameShell.tsx`
- Modify: `src/styles/game.css`
- Modify: `src/components/NewRunScreen.tsx`
- Modify: `src/components/cinematic/OpeningCinematic.tsx`
- Test: `tests/road-tactics-ui.test.tsx`
- Test: `tests/accessibility.test.tsx`

**Interfaces:**
- Produces `TravelViewModel` with route, leg, hero vitals, threat/tension, companion card, four action cards, and optional receipt.
- `TravelPanel` accepts `view: TravelViewModel` and `onAction: (action: TravelAction) => void`.
- Consumes `selectTravelView`, `dispatch` from `GameShell`, `RESOURCE_LABELS`, and the four stable action-art paths.

- [ ] **Step 1: Write the failing UI tests**

```tsx
it('renders four road actions with art, costs, and effect previews', () => {
  render(<TravelPanel view={selectTravelView(routeState(), UI_CONTENT)} onAction={vi.fn()} />);
  expect(screen.getByRole('button', { name: /Scout/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Press On/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Make Camp/i })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /scout/i })).toBeInTheDocument();
  expect(screen.getByText(/Threat -2/i)).toBeInTheDocument();
});

it('explains why scout is disabled at zero resource', () => {
  render(<TravelPanel view={selectTravelView(routeState({ resource: 0 }), UI_CONTENT)} onAction={vi.fn()} />);
  expect(screen.getByRole('button', { name: /Scout/i })).toBeDisabled();
  expect(screen.getByText(/Need 1 .* resource/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the UI tests and verify red**

Run: `npx vitest run --pool=threads tests/road-tactics-ui.test.tsx`

Expected: FAIL because `TravelViewModel`, `selectTravelView`, and `TravelPanel` do not exist.

- [ ] **Step 3: Implement selectors, panel, and app wiring**

Render travel when `state.flow.screen === 'travel'`; remove the empty-story auto-select effect. Use one action dispatch per click, stable focus, accessible disabled explanations, the four new art paths, and the class-specific resource label. Keep combat, merchant, camp, and overlay behavior unchanged.

Also fix the audited polish items in this task: `NewRunScreen` must use Stamina/Mana/Focus consistently, HUD buttons must have a 48px minimum touch target, and opening cinematic controls must respond to keyboard input while respecting reduced motion/captions.

- [ ] **Step 4: Run the UI/accessibility tests and verify green**

Run: `npx vitest run --pool=threads tests/road-tactics-ui.test.tsx tests/accessibility.test.tsx tests/interface.test.tsx tests/game-screens.test.tsx`

Expected: all listed tests pass and no new jsdom accessibility assertion fails.

- [ ] **Step 5: Commit**

```text
git add src/components/TravelPanel.tsx src/ui/types.ts src/ui/selectors.ts src/components/GameShell.tsx src/styles/game.css src/components/NewRunScreen.tsx src/components/cinematic/OpeningCinematic.tsx tests/road-tactics-ui.test.tsx tests/accessibility.test.tsx
git commit -m "feat: add interactive road tactics screen"
```

### Task 4: Port the 16 art-backed road encounters into Chronicle I

**Files:**
- Create: `src/game/content/chronicle1/chapters/ch01/road-tactics.ts`
- Create: `src/game/content/chronicle1/chapters/ch02/road-tactics.ts`
- Create: `src/game/content/chronicle1/chapters/ch05/road-tactics.ts`
- Create: `src/game/content/chronicle1/chapters/ch08/road-tactics.ts`
- Modify: `src/game/content/chronicle1/chapters/ch01/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch02/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch05/index.ts`
- Modify: `src/game/content/chronicle1/chapters/ch08/index.ts`
- Modify: `src/game/content/chronicle1/index.ts`
- Modify: `src/game/content/chronicle1/media-contract.ts`
- Modify: `src/game/content/validate.ts` only if a new source invariant is required
- Test: `tests/content/road-tactics-scenes.test.ts`
- Modify: current count assertions only where the intentional source count changes

**Interfaces:**
- Produces `ROAD_TACTICS_SCENES` arrays assembled into `CH01_SCENES`, `CH02_SCENES`, `CH05_SCENES`, and `CH08_SCENES`.
- Each scene has a unique `chXX-road-*` ID, `journey` type, `journeySubtype`, stable slot, unique illustration ID, 3+ choices, and valid effects/next scenes.
- Consumes existing item, flag, evidence, and encounter IDs from the canonical content catalog.

- [ ] **Step 1: Write failing content tests for all 16 IDs and shape rules**

```ts
const ROAD_SCENE_IDS = [
  'ch01-road-gloamwood-needle-briar', 'ch01-road-gloamwood-riverless-altar',
  'ch01-road-gloamwood-hound-chant', 'ch01-road-gloamwood-hidden-beggar',
  'ch02-road-drowned-silent-oars', 'ch02-road-drowned-ink-warden',
  'ch02-road-drowned-watchtower-debt', 'ch02-road-drowned-corpse-lantern',
  'ch02-road-drowned-basin-warden', 'ch05-road-embervault-ash-priestess',
  'ch05-road-embervault-cinder-drill', 'ch05-road-embervault-scorch-festival',
  'ch05-road-embervault-ore-bone-road', 'ch08-road-crownless-sigil-court',
  'ch08-road-crownless-iron-chime', 'ch08-road-crownless-barnacle-pit',
] as const;

it('assembles all sixteen road scenes with unique live artwork', () => {
  for (const id of ROAD_SCENE_IDS) {
    const scene = CHRONICLE1_SCENES.find((candidate) => candidate.id === id);
    expect(scene, id).toBeDefined();
    expect(scene!.type, id).toBe('journey');
    expect(scene!.choices.length, id).toBeGreaterThanOrEqual(3);
    expect(CHRONICLE1_ART_IDS.has(scene!.illustrationId), id).toBe(true);
  }
});
```

- [ ] **Step 2: Run the content test and verify red**

Run: `npx vitest run --pool=threads tests/content/road-tactics-scenes.test.ts`

Expected: FAIL because the 16 modern road scene IDs are not assembled.

- [ ] **Step 3: Author and assemble the minimum complete scenes**

Port the approved briefs from the spec into modern `defineScene` source. Give each scene three meaningful choices, including a resource/check trade-off, an avoidance/conservation option, and a risk/reward option. Use only content IDs that exist in the current `ContentIndex`, and keep slots chronologically between the chapter's existing start and final anchor. Do not add duplicate legacy event entries.

- [ ] **Step 4: Run focused content validation and verify green**

Run: `npx vitest run --pool=threads tests/content/road-tactics-scenes.test.ts tests/content/chronicle1-validation.test.ts tests/content/chronicle1-effects.test.ts`

Expected: new scene tests and all content invariants pass after expected source counts are updated.

- [ ] **Step 5: Commit**

```text
git add src/game/content/chronicle1/chapters/ch01/road-tactics.ts src/game/content/chronicle1/chapters/ch02/road-tactics.ts src/game/content/chronicle1/chapters/ch05/road-tactics.ts src/game/content/chronicle1/chapters/ch08/road-tactics.ts src/game/content/chronicle1/chapters/ch01/index.ts src/game/content/chronicle1/chapters/ch02/index.ts src/game/content/chronicle1/chapters/ch05/index.ts src/game/content/chronicle1/chapters/ch08/index.ts src/game/content/chronicle1/index.ts src/game/content/chronicle1/media-contract.ts src/game/content/validate.ts tests/content/road-tactics-scenes.test.ts tests/content/chronicle1-validation.test.ts tests/content/chronicle1-effects.test.ts
git commit -m "feat: author art-backed road encounters"
```

### Task 5: Extend persistence and repair save/migration fixtures

**Files:**
- Modify: `src/game/persistence/schema.ts:49-70, 251`
- Modify: `src/game/persistence/codec.ts:300-340, 540-660`
- Modify: `tests/fixtures/game.ts` and `tests/fixtures/ui.ts` for current strict DTOs
- Create: `tests/road-tactics-persistence.test.ts`
- Modify: `tests/persistence-recovery.test.ts`
- Modify: `tests/migration-v2-living-encounters.test.ts` for intentional migration behavior

**Interfaces:**
- Produces schema acceptance for `flow.screen: 'travel'` without changing envelope version.
- Produces recovery normalization from empty v3 `story` state to `travel`.
- Consumes `encodeSaveState`, `decodeSaveStateWithDiagnostics`, and existing strict content-backed validation.

- [ ] **Step 1: Write failing round-trip and migration tests**

```ts
it('round-trips a travel screen without losing the expedition', () => {
  const state = routeStateInTravel();
  const encoded = encodeSaveState(state);
  const decoded = decodeSaveState(encoded, CHRONICLE1_CONTENT);
  expect(decoded).toMatchObject({ flow: { screen: 'travel' }, expedition: { currentSceneId: null } });
});

it('recovers an empty v3 story save into travel', () => {
  const state = routeStateInTravel();
  const legacy = encodeSaveState({ ...state, flow: { ...state.flow, screen: 'story' } });
  const recovered = decodeSaveStateWithDiagnostics(legacy, CHRONICLE1_CONTENT);
  expect(recovered?.state.flow.screen).toBe('travel');
  expect(recovered?.diagnostics.join(' ')).toMatch(/travel/i);
});
```

- [ ] **Step 2: Run the focused persistence tests and verify red**

Run: `npx vitest run --pool=threads tests/road-tactics-persistence.test.ts tests/persistence-recovery.test.ts`

Expected: FAIL because `travel` is rejected and current fixtures contain stale item DTOs.

- [ ] **Step 3: Implement enum validation and safe normalization**

Add `travel` to the DTO type/set and enforce the travel invariants in content-backed validation. Normalize only the explicitly described empty-story shape; leave active story/combat/reward/merchant states untouched. Update test factories to create valid current item records and keep malformed-record tests malformed.

- [ ] **Step 4: Run the focused persistence tests and verify green**

Run: `npx vitest run --pool=threads tests/road-tactics-persistence.test.ts tests/persistence-recovery.test.ts tests/migration-v2-living-encounters.test.ts`

Expected: all persistence/migration tests pass with strict validation intact.

- [ ] **Step 5: Commit**

```text
git add src/game/persistence/schema.ts src/game/persistence/codec.ts tests/fixtures/game.ts tests/fixtures/ui.ts tests/road-tactics-persistence.test.ts tests/persistence-recovery.test.ts tests/migration-v2-living-encounters.test.ts
git commit -m "fix: persist road tactics travel state safely"
```

### Task 6: Repair audited content, media, audio, and release contracts

**Files:**
- Modify: `src/game/content/events.ts`
- Modify: `scripts/content/export-chronicle1-manifest.mjs`
- Modify: `scripts/media/validate-audio.mjs`
- Modify: `content/manifests/chronicle1-media-contract.json`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/PLAY-STORE-CHECKLIST.md`
- Modify: `release/README.md`
- Modify: `tests/director.test.ts`, `tests/visuals.test.ts`, `tests/content/chronicle1-metadata.test.ts`, `tests/offline-media.test.ts`, `tests/android-config.test.ts`, and `tests/content/chronicle1-validation.test.ts` only for the documented source-of-truth contracts

**Interfaces:**
- Keeps legacy compatibility `EVENTS` coherent and maps all tone literals to the declared `EventTone` union.
- Manifest exporter writes the same sorted payload on repeat without exceeding the validation timeout.
- Audio validator validates shipped files with `ffprobe` when available and a safe built-in fallback when it is not.
- Release docs all describe package/Android version `1.4.1` and version code `9`.

- [ ] **Step 1: Add regression assertions for each audited failure**

```ts
it('keeps the compatibility event catalog at its declared contract', () => {
  expect(EVENTS).toHaveLength(48);
  expect(EVENTS.every((event) => ['ominous', 'violent', 'mournful', 'mystic', 'hopeful'].includes(event.tone))).toBe(true);
});

it('uses the current resource label in all authored class cards', () => {
  expect(renderedNewRunText()).not.toMatch(/Spend Focus/);
  expect(renderedNewRunText()).toMatch(/Stamina|Mana|Focus/);
});
```

- [ ] **Step 2: Run the affected tests and verify the expected red failures**

Run: `npx vitest run --pool=threads tests/director.test.ts tests/visuals.test.ts tests/content/chronicle1-metadata.test.ts tests/offline-media.test.ts tests/android-config.test.ts`

Expected: failures identify the duplicate legacy additions, missing art contract entries, stale metadata, or unavailable `ffprobe` behavior.

- [ ] **Step 3: Implement source-of-truth repairs**

Keep the legacy event facade at 48 shipped entries, port the user-added ideas into modern Chronicle scenes, map `mysterious` to canonical `mystic`, update count/description assertions from assembled source, optimize the exporter to avoid a second full Vite startup, add the audio fallback only for tool absence, and align release metadata. Do not remove historical APK files solely to make a count assertion pass.

- [ ] **Step 4: Run the affected tests and validation scripts**

Run: `npx vitest run --pool=threads tests/director.test.ts tests/visuals.test.ts tests/content/chronicle1-metadata.test.ts tests/offline-media.test.ts tests/android-config.test.ts tests/content/chronicle1-validation.test.ts`

Expected: all affected tests pass; the exporter repeat test completes within its timeout.

- [ ] **Step 5: Commit**

```text
git add src/game/content/events.ts scripts/content/export-chronicle1-manifest.mjs scripts/media/validate-audio.mjs content/manifests/chronicle1-media-contract.json package.json README.md docs/PLAY-STORE-CHECKLIST.md release/README.md tests/director.test.ts tests/visuals.test.ts tests/content/chronicle1-metadata.test.ts tests/offline-media.test.ts tests/android-config.test.ts tests/content/chronicle1-validation.test.ts
git commit -m "fix: restore content media and release contracts"
```

### Task 7: Generate, install, and validate the 20 new art assets

**Files:**
- Create: `public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-needle-briar.webp`
- Create: `public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-riverless-altar.webp`
- Create: `public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-hound-chant.webp`
- Create: `public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-hidden-beggar.webp`
- Create: `public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-silent-oars.webp`
- Create: `public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-ink-warden.webp`
- Create: `public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-watchtower-debt.webp`
- Create: `public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-corpse-lantern.webp`
- Create: `public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-basin-warden.webp`
- Create: `public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-ash-priestess.webp`
- Create: `public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-cinder-drill.webp`
- Create: `public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-scorch-festival.webp`
- Create: `public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-ore-bone-road.webp`
- Create: `public/assets/chronicle1/scenes/ch08/scene-ch08-road-crownless-sigil-court.webp`
- Create: `public/assets/chronicle1/scenes/ch08/scene-ch08-road-crownless-iron-chime.webp`
- Create: `public/assets/chronicle1/scenes/ch08/scene-ch08-road-crownless-barnacle-pit.webp`
- Create: `public/assets/road-tactics/travel-road-scout.webp`
- Create: `public/assets/road-tactics/travel-road-press-on.webp`
- Create: `public/assets/road-tactics/travel-road-make-camp.webp`
- Create: `public/assets/road-tactics/travel-road-companion.webp`
- Modify: `scripts/media/validate-scene-art.mjs` or add a focused action-art validator for the four UI images

**Interfaces:**
- Produces 20 project-bound, non-duplicate WebP assets.
- Consumes the built-in `image_gen` tool in one call per distinct asset; no CLI fallback unless explicitly approved by the user.

- [ ] **Step 1: Add the failing media test for required new paths**

```ts
it('requires every road scene and action-card asset', () => {
  for (const assetPath of ROAD_TACTICS_ASSET_PATHS) expect(existsSync(assetPath), assetPath).toBe(true);
});
```

- [ ] **Step 2: Run the media test and verify red**

Run: `npx vitest run --pool=threads tests/media/road-tactics-art.test.ts`

Expected: FAIL because the 20 new files do not exist.

- [ ] **Step 3: Generate each asset with the built-in image tool**

Use the style brief from the spec: painterly dark-fantasy game key art, strong focal silhouette, readable mobile composition, no text, logo, or watermark. Generate one distinct 1536x1024 landscape image per scene and action card, inspect each result, then copy/convert the selected output into the exact project path. Never leave a referenced file only in the generated-images cache.

- [ ] **Step 4: Run art and media tests**

Run: `npx vitest run --pool=threads tests/media/road-tactics-art.test.ts tests/content/road-tactics-scenes.test.ts`; then `npm run art:validate`; then `npm run content:export`.

Expected: all 402 scene assets are unique valid 1536x1024 WebP files, all four action-card assets exist, and the exported contract is byte-stable.

- [ ] **Step 5: Commit the assets and contract**

```text
git add public/assets/chronicle1/scenes/ch01 public/assets/chronicle1/scenes/ch02 public/assets/chronicle1/scenes/ch05 public/assets/chronicle1/scenes/ch08 public/assets/road-tactics scripts/media/validate-scene-art.mjs tests/media/road-tactics-art.test.ts content/manifests/chronicle1-media-contract.json
git commit -m "art: add road tactics encounter illustrations"
```

### Task 8: Integrate browser flow and complete verification

**Files:**
- Create: `tests/e2e/road-tactics.spec.ts`
- Modify: `tests/core-integration.test.ts`
- Modify: `tests/interface-integration.test.tsx`
- Modify: `README.md` with a short Road Tactics player-facing explanation

**Interfaces:**
- Produces a browser regression covering title → route → travel → action → illustrated scene → combat/reward → travel.
- Consumes all prior tasks without changing the domain contract.

- [ ] **Step 1: Write the failing browser regression**

```ts
test('player takes a road action before the next scene', async ({ page }) => {
  await startNewRun(page, { heroClass: 'warrior' });
  await chooseRoute(page, "King's Road");
  await expect(page.getByRole('heading', { name: /Road Tactics/i })).toBeVisible();
  await page.getByRole('button', { name: /Scout/i }).click();
  await expect(page.getByRole('heading', { name: /Road Tactics/i })).not.toBeVisible();
  await expect(page.locator('img[alt]')).toHaveCount(1);
});
```

- [ ] **Step 2: Run the browser test and verify red**

Run: `npx playwright test tests/e2e/road-tactics.spec.ts`

Expected: FAIL because the route currently enters story directly and no Road Tactics screen is rendered.

- [ ] **Step 3: Stabilize browser fixtures and documentation**

Update only selectors and intentional flow expectations, preserve the existing authored-combat and save-slot coverage, and document the new player loop in plain language.

- [ ] **Step 4: Run the focused browser test and then the full verification matrix**

Run: `npx playwright test tests/e2e/road-tactics.spec.ts`; then run all commands in Global Constraints from the repository root.

Expected: focused flow passes, full Vitest/build/E2E/content/art/audio/Android/diff checks exit successfully.

- [ ] **Step 5: Commit integration and documentation**

```text
git add tests/e2e/road-tactics.spec.ts tests/core-integration.test.ts tests/interface-integration.test.tsx README.md
git commit -m "test: verify road tactics journey loop"
```

## Completion checklist

- [ ] Every task has a passing focused test after its red-green cycle.
- [ ] The 16 new scene IDs and 4 action-card art paths are reachable/loaded from the live app.
- [ ] No empty story auto-selection bypasses Road Tactics.
- [ ] Save/recovery strictness and old-save normalization are covered.
- [ ] Full verification commands have fresh exit-zero evidence.
- [ ] Final branch review and finishing workflow are completed before claiming completion.
