# Morrowmere Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, English-only, offline Android-ready text RPG with a replayable 30 to 60 minute campaign, exactly 200 bestiary entries, tactical combat, persistent choices, and highly readable mobile UI.

**Architecture:** Pure TypeScript modules own deterministic game rules and generated catalogs; a React reducer exposes typed commands to a portrait-first interface. Vite emits the offline web application and Capacitor packages the same output for Android.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Playwright, axe-core, vite-plugin-pwa, Capacitor, CSS.

**Spec:** `docs/superpowers/specs/2026-08-30-morrowmere-design.md`

## Global Constraints

- Public title is `MORROWMERE`; subtitle is `A Sword & Sorcery Chronicle`.
- All player-facing text is English.
- Android application ID is `com.morrowmere.game`.
- Default target viewport is 360×800 CSS pixels in portrait orientation.
- Primary prose is at least 18 CSS pixels with 1.65 line height.
- The game contains exactly 200 stable, uniquely named enemy entries.
- The campaign is fully playable offline and makes no runtime network request.
- The release contains no advertising, accounts, paid currency, or forced waiting.
- Generated visual assets contain no embedded text.
- Mandatory fights are beatable by Warrior, Mage, and Warden without a predetermined build.

---

## File map

- `src/game/types.ts`: shared domain contracts and command/result unions.
- `src/game/rng.ts`: serializable seeded random generator.
- `src/game/content/enemies.ts`: 20 archetypes and deterministic 200-entry catalog.
- `src/game/content/items.ts`: base items, affixes, and reward selection.
- `src/game/content/events.ts`: authored event templates and narrative fragments.
- `src/game/content/story.ts`: prologue, bosses, factions, and ending copy.
- `src/game/director.ts`: procedural event selection and route construction.
- `src/game/combat.ts`: combat transition functions and enemy intent AI.
- `src/game/state.ts`: new-run construction and top-level reducer.
- `src/game/persistence.ts`: versioned saves, migrations, import, and export.
- `src/components/`: one focused component per screen or persistent HUD unit.
- `src/styles/`: tokens, layout, components, and accessibility rules.
- `public/assets/`: project-bound generated environment and enemy-family artwork.
- `tests/`: domain and component tests.
- `e2e/`: mobile user-journey and offline tests.

### Task 1: Project shell and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.setup.ts`
- Create: `index.html`, `src/main.tsx`, `src/App.tsx`
- Test: `tests/smoke.test.tsx`

**Interfaces:**
- Produces: Vite application mounting `<App />` into `#root`; `npm test`, `npm run build`, and `npm run test:e2e` commands.

- [ ] **Step 1: Write the failing smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../src/App';

it('shows the game title and new chronicle action', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'MORROWMERE' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'New Chronicle' })).toBeEnabled();
});
```

- [ ] **Step 2: Run `npm test -- smoke.test.tsx` and confirm the missing application fails.**
- [ ] **Step 3: Add the React/Vite/TypeScript configuration and a semantic title screen that satisfies the test.**
- [ ] **Step 4: Run `npm test -- smoke.test.tsx` and `npm run build`; both must pass.**
- [ ] **Step 5: Commit with `git commit -am "feat: scaffold Morrowmere application"` after adding the new files.**

### Task 2: Deterministic catalogs

**Files:**
- Create: `src/game/types.ts`, `src/game/rng.ts`
- Create: `src/game/content/enemies.ts`, `src/game/content/items.ts`
- Test: `tests/catalogs.test.ts`, `tests/rng.test.ts`

**Interfaces:**
- Produces: `createRng(seed: number): SeededRng`, `ENEMIES: readonly EnemyDefinition[]`, `ITEMS: readonly ItemDefinition[]`, `generateItemReward(context: RewardContext): ItemDefinition[]`.

- [ ] **Step 1: Write tests asserting two RNGs with seed `1337` produce the same sequence, enemy IDs/names are unique, `ENEMIES.length === 200`, and power never decreases within an archetype.**

```ts
expect(ENEMIES).toHaveLength(200);
expect(new Set(ENEMIES.map((enemy) => enemy.id))).toHaveLength(200);
expect(new Set(ENEMIES.map((enemy) => enemy.name))).toHaveLength(200);
```

- [ ] **Step 2: Run `npm test -- rng.test.ts catalogs.test.ts` and confirm missing exports fail.**
- [ ] **Step 3: Implement a Mulberry32-style serializable RNG, 20 enemy archetypes × ten ranks, 60 base items, legal affix pools, and class-aware reward selection.**
- [ ] **Step 4: Run the catalog tests and `npm run build`; both must pass with zero duplicate content IDs.**
- [ ] **Step 5: Commit with message `feat: add deterministic enemy and item catalogs`.**

### Task 3: Procedural story director

**Files:**
- Create: `src/game/content/events.ts`, `src/game/content/story.ts`
- Create: `src/game/director.ts`
- Test: `tests/director.test.ts`, `tests/endings.test.ts`

**Interfaces:**
- Consumes: `SeededRng`, shared `GameFlags`, `FactionStanding`, and `InventoryTag` contracts.
- Produces: `buildRoute(context: DirectorContext): RouteNode[]`, `chooseNextEvent(context: DirectorContext): StoryEvent`, `resolveEnding(state: GameState): Ending`.

- [ ] **Step 1: Write tests proving a seed reproduces the same 12-node route, no event family repeats within three nodes, unmet prerequisites never appear, earlier mercy creates a callback, and each of the six ending IDs is reachable.**
- [ ] **Step 2: Run the director and ending tests and verify they fail due to missing modules.**
- [ ] **Step 3: Add 36 typed event templates, four region definitions, story fragments, three factions, follow-up hooks, weighted tension rules, and the explicit ending resolver.**
- [ ] **Step 4: Add a combinatorial test that enumerates valid actor/location/weather slots and asserts at least 250 distinct rendered scene keys.**
- [ ] **Step 5: Run `npm test -- director.test.ts endings.test.ts`; all tests must pass.**
- [ ] **Step 6: Commit with message `feat: add procedural chronicle director`.**

### Task 4: Combat, run state, and persistence

**Files:**
- Create: `src/game/combat.ts`, `src/game/state.ts`, `src/game/persistence.ts`
- Test: `tests/combat.test.ts`, `tests/state.test.ts`, `tests/persistence.test.ts`

**Interfaces:**
- Produces: `startNewRun(options: NewRunOptions): GameState`, `gameReducer(state: GameState, command: GameCommand): GameState`, `resolveCombatAction(state: CombatState, action: CombatAction): CombatResult`, `saveGame(slot: SaveSlot, state: GameState): SaveResult`, `loadGame(slot: SaveSlot): LoadResult`.

- [ ] **Step 1: Write tests for physical/ward mitigation, guard halving damage, visible enemy intent, status expiry, flee rules, invalid-command immutability, autosave round trip, and corrupt-save recovery.**
- [ ] **Step 2: Run the three test files and confirm they fail because the functions do not exist.**
- [ ] **Step 3: Implement pure combat transitions, three class kits, budgeted encounter selection, route progression, rewards, game over, victory, and version-1 save serialization.**
- [ ] **Step 4: Simulate 300 seeded mandatory encounters per class and assert win-rate bounds remain between 35% and 90% under the baseline decision policy.**
- [ ] **Step 5: Run all domain tests and confirm no mutation, balance, or persistence failures.**
- [ ] **Step 6: Commit with message `feat: implement combat and persistent runs`.**

### Task 5: Portrait-first game interface

**Files:**
- Create: `src/components/TitleScreen.tsx`, `src/components/NewRunScreen.tsx`
- Create: `src/components/GameShell.tsx`, `src/components/TopHud.tsx`, `src/components/StoryPanel.tsx`
- Create: `src/components/CombatPanel.tsx`, `src/components/ChoiceList.tsx`, `src/components/RewardPanel.tsx`
- Create: `src/components/InventorySheet.tsx`, `src/components/ChronicleSheet.tsx`, `src/components/BestiarySheet.tsx`, `src/components/SettingsSheet.tsx`
- Create: `src/components/ErrorBoundary.tsx`, `src/components/icons.tsx`
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/game.css`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `tests/interface.test.tsx`, `tests/accessibility.test.tsx`

**Interfaces:**
- Consumes: `GameState`, `GameCommand`, and persistence functions.
- Produces: accessible screens and overlays; `App` owns reducer initialization and save-slot flow.

- [ ] **Step 1: Write component tests for class selection, full-width story choices, enemy intent text, inventory comparison, text scaling, overlay focus return, and keyboard activation.**
- [ ] **Step 2: Run the interface tests and verify the missing components fail.**
- [ ] **Step 3: Build the title, new-run, story, combat, rewards, inventory, chronicle, bestiary, settings, defeat, and ending views with semantic HTML and inline SVG icons.**
- [ ] **Step 4: Apply the charcoal/parchment/brass visual system, minimum 48-pixel targets, 18-pixel prose, independent story scrolling, safe-area padding, reduced motion, and high-contrast mode.**
- [ ] **Step 5: Run component and axe tests at 360×800; fix every serious violation.**
- [ ] **Step 6: Commit with message `feat: build readable portrait game interface`.**

### Task 6: Generated art and deterministic scene compositor

**Files:**
- Create: `public/assets/backgrounds/*.webp`, `public/assets/enemies/*.webp`, `public/assets/brand/*.webp`
- Create: `src/game/visuals.ts`, `src/components/SceneArt.tsx`
- Modify: `src/components/TitleScreen.tsx`, `src/components/GameShell.tsx`, `src/styles/game.css`
- Test: `tests/visuals.test.ts`

**Interfaces:**
- Produces: `composeSceneVisual(input: SceneVisualInput): SceneVisual`; every enemy resolves to a family art treatment and every scene resolves to an existing base plate.

- [ ] **Step 1: Write tests enumerating all enemies and route scenes, asserting valid art references and at least 300 unique background-composition keys.**
- [ ] **Step 2: Generate project-bound painterly title/camp/region plates and enemy-family portrait sheets without text; save final selected images under `public/assets`.**
- [ ] **Step 3: Implement CSS weather, lighting, particles, vignette, tint, enemy sigil, and elite-frame treatments driven only by the saved seed and scene metadata.**
- [ ] **Step 4: Run visual mapping tests and visually inspect title, story, combat, and ending states at phone resolution.**
- [ ] **Step 5: Commit with message `feat: add generated dark-fantasy art direction`.**

### Task 7: Offline PWA and Android package

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/*`, `capacitor.config.ts`
- Modify: `vite.config.ts`, `package.json`, `index.html`
- Generate: `android/` through Capacitor CLI
- Test: `e2e/mobile.spec.ts`, `e2e/offline.spec.ts`, `playwright.config.ts`

**Interfaces:**
- Produces: installable offline web build in `dist/`; synchronized Android project; mobile E2E coverage.

- [ ] **Step 1: Write an E2E flow that starts a Warrior run, resolves a story choice and combat turn, reloads, and verifies the same location and health.**
- [ ] **Step 2: Add the manifest, icons, PWA precache configuration, theme metadata, and service-worker update prompt.**
- [ ] **Step 3: Install Capacitor dependencies, add Android, lock portrait orientation, set the app ID/title, and synchronize `dist/`.**
- [ ] **Step 4: Run Playwright at Pixel 5 dimensions and run a second context offline after initial cache population.**
- [ ] **Step 5: Run `npx cap sync android`; when an SDK is present, run the Gradle debug assemble task and record the APK location.**
- [ ] **Step 6: Commit with message `build: package Morrowmere for offline Android`.**

### Task 8: Final verification and player handoff

**Files:**
- Create: `README.md`, `docs/PLAYTEST.md`, `docs/PLAY-STORE-CHECKLIST.md`
- Modify: only files required by failed verification.

**Interfaces:**
- Produces: reproducible setup/build/release commands and a verified playable artifact.

- [ ] **Step 1: Run `npm test -- --run`, `npm run build`, and `npm run test:e2e`; capture exact pass/fail counts.**
- [ ] **Step 2: Run the catalog/content audit and record counts for enemies, item bases, event templates, scene combinations, regions, classes, and endings.**
- [ ] **Step 3: Test the production build manually at 360×800 and 800×1280 for overflow, text contrast, back behavior, focus order, and save restoration.**
- [ ] **Step 4: Write setup, browser play, Android build, signing, generated-art disclosure, data-safety, and Play Store asset requirements.**
- [ ] **Step 5: Run `git diff --check`, inspect `git status --short`, and commit with message `docs: add playtest and release handoff`.**
