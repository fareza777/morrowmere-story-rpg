# MORROWMERE Chronicle I Authored Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the twelve-scene vertical-slice narrative with the complete English-only eight-chapter **Chronicle I — The Black Banner** catalog: exactly 332 authored scenes, 100 new items, 200 ranked enemies plus 15 bosses, five difficult companion arcs, six merchants, four endings, and 24 epilogue fragments.

**Architecture:** Consume the stable schemas and validators produced by `2026-08-31-morrowmere-core-systems.md`. Keep content immutable and split by chapter and domain; assemble it through one Chronicle I barrel without putting prose into saves. All media is referenced by stable IDs exported as a machine-readable contract for the separate media plan.

**Tech Stack:** TypeScript 7, Vitest 4, Vite 8 server-side module loading for manifest export, immutable authored catalogs, seeded route simulation.

**Spec:** `docs/superpowers/specs/2026-08-31-morrowmere-chronicle-i-black-banner-design.md`

## Global Constraints

- Public title is `MORROWMERE`; campaign title is `Chronicle I — The Black Banner`.
- All player-facing prose, labels, item names, enemy names, merchant dialogue, and epilogues are English.
- Chronicle I has exactly eight ordered chapters and supports levels 1–15.
- The scene catalog contains exactly 56 main, 64 companion/faction, 140 journey, 48 combat-template, and 24 hub scenes: 332 total.
- Main anchors are fixed and ordered; procedural selection happens only between eligible anchors.
- Runtime prose is authored; no event contains a free-form AI-generation instruction.
- A first completion targets 150–180 selected scenes and 10–12 hours without repeated grinding.
- Companion recruitment requires several prior decisions, a personal quest, and a visible cost; no single choice recruits a companion.
- The item catalog adds exactly 100 items to the existing 60, producing exactly 160 items.
- Keep the 200 ranked enemy entries mechanically distinct and add exactly 15 authored boss definitions.
- Every scene, item, enemy portrait identity, boss, selected VO line, and ending has a stable lowercase kebab-case ID.
- Every scene references a unique illustration ID; media files are produced by the separate media plan.
- Prose is concrete and direct. Lyrical language is limited to chapter openings, relics, visions, and major emotional beats.
- Existing Crown/black-rain material may survive only as revised optional folklore or strange side content that does not contradict The Black Banner.

---

## File map

- `src/game/content/chronicle1/builders.ts`: narrow typed helpers that freeze authored records.
- `src/game/content/chronicle1/chronicle.ts`: Chronicle metadata, eight chapter definitions, level bands, and seven anchor IDs per chapter.
- `src/game/content/chronicle1/routes.ts`: King's Road, Old Forest, and Ruined Pass eligibility and risk text.
- `src/game/content/chronicle1/factions.ts`: Greywatch, border council, orc peace, Abbey, Conclave, and Black Banner content-facing definitions.
- `src/game/content/chronicle1/companions.ts`: Mara, Rukhar, Caldus, Lyra, and Talla definitions and multi-step recruitment contracts.
- `src/game/content/chronicle1/merchants.ts`: six merchant identities, stock pools, restock gates, and dialogue sets.
- `src/game/content/chronicle1/chapters/ch01` through `ch08`: each owns `main.ts`, `companion.ts`, `journey.ts`, `combat.ts`, and `hub.ts`.
- `src/game/content/chronicle1/items/{weapons,armor,charms,consumables,tools,artifacts}.ts`: exactly 100 new authored items.
- `src/game/content/chronicle1/items/index.ts`: legacy-plus-new item assembly and uniqueness assertions.
- `src/game/content/chronicle1/enemies/archetypes.ts`: role, compatibility, status, and portrait mapping for the existing 20 archetypes.
- `src/game/content/chronicle1/enemies/ranked.ts`: deterministic 200-entry ranked catalog.
- `src/game/content/chronicle1/enemies/bosses.ts`: exactly 15 authored phased bosses.
- `src/game/content/chronicle1/enemies/encounters.ts`: encounter definitions referenced by 48 combat scenes.
- `src/game/content/chronicle1/endings.ts`: four main endings and exactly 24 conditional epilogue fragments.
- `src/game/content/chronicle1/media-contract.ts`: stable scene, item-icon, portrait, boss-art, and VO IDs without file paths.
- `src/game/content/chronicle1/index.ts`: assembled `CHRONICLE1_CONTENT` and exported typed indexes.
- `scripts/content/export-chronicle1-manifest.mjs`: deterministic JSON export for media production.
- `content/manifests/chronicle1-media-contract.json`: generated, committed ID/title/chapter/type contract.
- `tests/content/chronicle1-metadata.test.ts`: chapter ordering, anchor ordering, and route contracts.
- `tests/content/chronicle1-scenes.test.ts`: exact category/chapter quotas and copy quality.
- `tests/content/chronicle1-companions.test.ts`: recruitment chains, personal quests, loyalty, and fallback paths.
- `tests/content/chronicle1-items.test.ts`: 100-new/160-total counts, identities, class access, and power gates.
- `tests/content/chronicle1-enemies.test.ts`: 200 ranked entries, 80 portrait identities, 15 bosses, roles, and legal groups.
- `tests/content/chronicle1-endings.test.ts`: four resolutions, 24 fragments, and accumulated-state selection.
- `tests/content/chronicle1-validation.test.ts`: full `validateContent` and media-contract export.
- `tests/content/chronicle1-routes.test.ts`: deterministic multi-seed anchor/callback/pacing simulation.

## Locked content ledger

| Chapter | Main | Companion/faction | Journey | Combat | Hub | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ch01 | 7 | 5 | 20 | 6 | 3 | 41 |
| ch02 | 7 | 7 | 19 | 6 | 3 | 42 |
| ch03 | 7 | 8 | 18 | 6 | 3 | 42 |
| ch04 | 7 | 9 | 18 | 6 | 3 | 43 |
| ch05 | 7 | 10 | 17 | 6 | 3 | 43 |
| ch06 | 7 | 10 | 17 | 6 | 3 | 43 |
| ch07 | 7 | 8 | 16 | 6 | 3 | 40 |
| ch08 | 7 | 7 | 15 | 6 | 3 | 38 |
| **Total** | **56** | **64** | **140** | **48** | **24** | **332** |

The 140 journey scenes further contain exactly 48 travel, 28 investigation, 24 side-quest, 16 dungeon, and 24 moral-choice scenes. The 64 relationship scenes contain 10 Mara, 12 Rukhar, 12 Caldus, 12 Lyra, 12 Talla, and 6 cross-faction/consequence scenes.

### Mandatory main-anchor IDs

```ts
export const MAIN_ANCHOR_IDS = {
  ch01: ['three-days-to-greywatch', 'medicine-for-the-north', 'the-empty-tollhouse', 'the-first-arrow', 'the-bridge-in-smoke', 'a-banner-placed-too-neatly', 'before-the-gates-close'],
  ch02: ['warning-before-dawn', 'raiders-at-the-wall', 'hold-the-south-gate', 'the-royal-fletching', 'the-witness-speaks', 'greywatch-council', 'the-hidden-depot'],
  ch03: ['orders-for-redwater', 'the-flooded-mile', 'the-captured-courier', 'rukhar-at-the-crossing', 'evidence-on-both-sides', 'the-attack-with-two-banners', 'redwater-in-sight'],
  ch04: ['two-armies-one-field', 'parley-between-lines', 'the-murdered-scout', 'orders-written-to-be-found', 'before-the-first-charge', 'terms-at-redwater', 'what-the-river-carried-away'],
  ch05: ['the-mouth-of-embervault', 'the-missing-shift', 'forge-behind-the-wall', 'the-quartermasters-ledger', 'weapons-for-both-armies', 'the-name-severin-voss', 'escape-through-the-cinder-shaft'],
  ch06: ['smoke-over-greywatch', 'the-message-that-broke', 'the-leak-in-the-watch', 'hostages-under-the-chapel', 'the-siege-begins', 'the-last-open-breach', 'what-remains-of-greywatch'],
  ch07: ['council-before-the-march', 'banners-on-the-kingroad', 'the-outer-patrol', 'wall-or-hidden-way', 'the-crownless-gate', 'voss-last-champion', 'inside-the-keep'],
  ch08: ['guests-for-a-false-king', 'the-hall-of-seals', 'evidence-before-the-realm', 'voss-offers-order', 'the-marshal-and-the-banner', 'who-keeps-the-crownless-keep', 'the-letter-in-cipher'],
} as const;
```

---

### Task 1: Chronicle metadata, routes, factions, companions, and merchants

**Files:**
- Create: `src/game/content/chronicle1/builders.ts`
- Create: `src/game/content/chronicle1/chronicle.ts`
- Create: `src/game/content/chronicle1/routes.ts`
- Create: `src/game/content/chronicle1/factions.ts`
- Create: `src/game/content/chronicle1/companions.ts`
- Create: `src/game/content/chronicle1/merchants.ts`
- Create: `tests/content/chronicle1-metadata.test.ts`
- Create: `tests/content/chronicle1-companions.test.ts`

**Interfaces:**
- Consumes: `ChapterDefinition`, `CompanionDefinition`, `MerchantDefinition`, `ChronicleEvent`, and stable ID types from `src/game/content/schema.ts`.
- Produces: `CHRONICLE1`, `CHRONICLE1_ROUTES`, `CHRONICLE1_FACTIONS`, `CHRONICLE1_COMPANIONS`, `CHRONICLE1_MERCHANTS`, and `defineScene(scene: ChronicleEvent): ChronicleEvent`.

- [ ] **Step 1: Write failing metadata and recruitment-contract tests.**

```ts
import { CHRONICLE1 } from '../../src/game/content/chronicle1/chronicle';
import { CHRONICLE1_COMPANIONS } from '../../src/game/content/chronicle1/companions';
import { CHRONICLE1_MERCHANTS } from '../../src/game/content/chronicle1/merchants';

it('defines eight ordered chapters with seven immutable anchors each', () => {
  expect(CHRONICLE1.title).toBe('Chronicle I — The Black Banner');
  expect(CHRONICLE1.chapters.map((chapter) => chapter.id)).toEqual(
    ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'],
  );
  expect(CHRONICLE1.chapters.every((chapter) => chapter.anchorIds.length === 7)).toBe(true);
});

it('defines five difficult companions and six merchant identities', () => {
  expect(CHRONICLE1_COMPANIONS.map((entry) => entry.id)).toEqual(['mara', 'rukhar', 'caldus', 'lyra', 'talla']);
  expect(CHRONICLE1_COMPANIONS.every((entry) => entry.recruitment.requiredDecisionIds.length >= 3)).toBe(true);
  expect(CHRONICLE1_COMPANIONS.every((entry) => entry.personalQuestIds.length === 3)).toBe(true);
  expect(CHRONICLE1_MERCHANTS).toHaveLength(6);
});
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-metadata.test.ts tests/content/chronicle1-companions.test.ts`; expect module-not-found failures.**
- [ ] **Step 3: Implement the metadata with level bands `1–2`, `2–4`, `4–6`, `6–8`, `8–10`, `10–12`, `12–14`, `14–15`; the three route profiles; five explicit recruitment contracts; three personal-quest IDs per companion; and these merchants: `road-trader`, `blacksmith`, `apothecary`, `relic-dealer`, `quartermaster`, `goblin-broker`.**

```ts
export const CHRONICLE1_ROUTES = Object.freeze([
  { id: 'kings-road', label: "The King's Road", danger: 1, merchantWeight: 3, companionWeight: 1, relicWeight: 0 },
  { id: 'old-forest', label: 'The Old Forest', danger: 2, merchantWeight: 1, companionWeight: 3, relicWeight: 1 },
  { id: 'ruined-pass', label: 'The Ruined Pass', danger: 3, merchantWeight: 0, companionWeight: 1, relicWeight: 3 },
] as const);
```

- [ ] **Step 4: Run both focused tests and `npm run build`; expect PASS.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1 tests/content/chronicle1-metadata.test.ts tests/content/chronicle1-companions.test.ts
git commit -m "feat: define Black Banner campaign cast"
```

### Task 2: Chapters 1–2 authored scene catalogs

**Files:**
- Create: `src/game/content/chronicle1/chapters/ch01/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch02/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch01/index.ts`
- Create: `src/game/content/chronicle1/chapters/ch02/index.ts`
- Create: `tests/content/chronicle1-ch01-ch02.test.ts`

**Interfaces:**
- Consumes: `defineScene`, chapter/route/faction/companion IDs, and encounter-reference contracts.
- Produces: `CH01_SCENES` with 41 scenes and `CH02_SCENES` with 42 scenes.

- [ ] **Step 1: Write a failing quota/order/copy test.**

```ts
it.each([
  ['ch01', CH01_SCENES, { main: 7, companion: 5, journey: 20, combat: 6, hub: 3 }],
  ['ch02', CH02_SCENES, { main: 7, companion: 7, journey: 19, combat: 6, hub: 3 }],
] as const)('%s has its locked authored quota', (_, scenes, expected) => {
  expect(countSceneTypes(scenes)).toEqual(expected);
  expect(new Set(scenes.map((scene) => scene.id)).size).toBe(scenes.length);
  expect(scenes.every(hasConcreteEnglishCopy)).toBe(true);
  expect(scenes.every((scene) => scene.illustrationId === `scene-${scene.id}`)).toBe(true);
});
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-ch01-ch02.test.ts`; expect missing catalog failures.**
- [ ] **Step 3: Author Chapter 1 from caravan briefing through arrival at Greywatch, then Chapter 2 from the dawn raid through discovery of the hidden depot. Include the seven locked anchors in order, Talla's spared-courier start, Mara's civilian/scout decisions, six different combat premises per chapter, and one camp plus two merchant/healing scenes per chapter. Every choice states an action and concrete risk; no choice label reveals a hidden “correct” answer.**

```ts
export const CH01_MAIN = Object.freeze([
  defineScene({
    id: 'ch01-main-three-days-to-greywatch', chapterId: 'ch01', type: 'main', family: 'caravan-departure',
    anchorOrder: 1, illustrationId: 'scene-ch01-main-three-days-to-greywatch', title: 'Three Days to Greywatch',
    narrative: ['The medicine wagons leave before sunrise.', 'Your pay waits in Greywatch if the road stays open.'],
    eligibility: { routes: ['kings-road'], minLevel: 1, maxLevel: 2 }, cooldownRuns: 0, oneShot: true,
    choices: [{ id: 'inspect-wagons', label: 'Inspect the wagons', detail: 'Spend time now to reduce the risk of losing medicine later.', effects: [{ type: 'flag', operation: 'add', flagId: 'medicine-secured' }], outcome: 'You find a loose axle pin before it fails.' }],
  }),
  // The remaining six records use the exact ch01 anchor IDs in the locked ledger above.
]);
```

- [ ] **Step 4: Replace the explanatory comment in the implementation with all six complete records, run the focused test and `npm run build`, and confirm 41/42 scenes pass without duplicate IDs or broken encounter references.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/chapters/ch01 src/game/content/chronicle1/chapters/ch02 tests/content/chronicle1-ch01-ch02.test.ts
git commit -m "feat: author Greywatch opening chapters"
```

### Task 3: Chapters 3–4 authored scene catalogs

**Files:**
- Create: `src/game/content/chronicle1/chapters/ch03/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch04/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch03/index.ts`
- Create: `src/game/content/chronicle1/chapters/ch04/index.ts`
- Create: `tests/content/chronicle1-ch03-ch04.test.ts`

**Interfaces:**
- Consumes: the same scene builder and stable IDs as Task 2.
- Produces: `CH03_SCENES` with 42 scenes and `CH04_SCENES` with 43 scenes.

- [ ] **Step 1: Write the failing 42/43 quota test and assert both `rukhar-at-the-crossing` and `terms-at-redwater` remain mandatory ordered anchors.**

```ts
expect(countSceneTypes(CH03_SCENES)).toEqual({ main: 7, companion: 8, journey: 18, combat: 6, hub: 3 });
expect(countSceneTypes(CH04_SCENES)).toEqual({ main: 7, companion: 9, journey: 18, combat: 6, hub: 3 });
expect(anchorSuffixes(CH03_SCENES)).toContain('rukhar-at-the-crossing');
expect(anchorSuffixes(CH04_SCENES).at(-2)).toBe('terms-at-redwater');
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-ch03-ch04.test.ts`; expect missing catalog failures.**
- [ ] **Step 3: Author the Drowned Road evidence mission and Redwater crisis. Rukhar's chain must require the spared/rescued courier, blocked retaliation, credible evidence, and acceptance of political cost. Human and orc forces both receive named officers and civilian stakes; the false-flag reveal precedes the player's settlement choice. Include 12 unique combat premises across flooded roads, patrol lines, smugglers, beasts, and provocateurs.**

```ts
const RUKHAR_RECRUITMENT_CALLBACKS = [
  'ch03-companion-courier-testimony',
  'ch03-companion-rukhar-keeps-watch',
  'ch04-companion-stop-the-retaliation',
  'ch04-companion-the-cost-of-peace',
] as const;
```

- [ ] **Step 4: Run the focused test, companion test, and build; verify no Rukhar path becomes eligible before all four decisions resolve.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/chapters/ch03 src/game/content/chronicle1/chapters/ch04 tests/content/chronicle1-ch03-ch04.test.ts
git commit -m "feat: author Drowned Road and Redwater chapters"
```

### Task 4: Chapters 5–6 authored scene catalogs

**Files:**
- Create: `src/game/content/chronicle1/chapters/ch05/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch06/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch05/index.ts`
- Create: `src/game/content/chronicle1/chapters/ch06/index.ts`
- Create: `tests/content/chronicle1-ch05-ch06.test.ts`

**Interfaces:**
- Produces: `CH05_SCENES` and `CH06_SCENES`, each with 43 scenes.
- Guarantees: the Voss supply-network reveal precedes the siege; Caldus and non-Caldus leak paths converge without inventing recruitment.

- [ ] **Step 1: Write failing quota and convergence tests.**

```ts
expect(countSceneTypes(CH05_SCENES)).toEqual({ main: 7, companion: 10, journey: 17, combat: 6, hub: 3 });
expect(countSceneTypes(CH06_SCENES)).toEqual({ main: 7, companion: 10, journey: 17, combat: 6, hub: 3 });
expect(callbackTargets('ch06-main-the-leak-in-the-watch')).toEqual(
  expect.arrayContaining(['ch06-companion-caldus-confession', 'ch06-faction-sergeant-hale-confession']),
);
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-ch05-ch06.test.ts`; expect missing catalog failures.**
- [ ] **Step 3: Author Embervault as a grounded mines/armory investigation that proves Voss supplied both armies, then author the hostage-driven betrayal and Greywatch siege. If Caldus is recruited, his confidence and hostage chain drive the leak; otherwise Sergeant Hale provides a separate authored leak scene. The siege outcome must set one of `greywatch-held`, `greywatch-damaged`, or `greywatch-fallen`.**

```ts
export const GREYWATCH_OUTCOME_FLAGS = ['greywatch-held', 'greywatch-damaged', 'greywatch-fallen'] as const;
export const LEAK_PATH_IDS = ['ch06-companion-caldus-confession', 'ch06-faction-sergeant-hale-confession'] as const;
```

- [ ] **Step 4: Run the focused test, enumerate both leak paths, and run the build; each path reaches `ch06-main-the-siege-begins` exactly once.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/chapters/ch05 src/game/content/chronicle1/chapters/ch06 tests/content/chronicle1-ch05-ch06.test.ts
git commit -m "feat: author Embervault conspiracy and Greywatch siege"
```

### Task 5: Chapters 7–8 authored scene catalogs

**Files:**
- Create: `src/game/content/chronicle1/chapters/ch07/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch08/{main,companion,journey,combat,hub}.ts`
- Create: `src/game/content/chronicle1/chapters/ch07/index.ts`
- Create: `src/game/content/chronicle1/chapters/ch08/index.ts`
- Create: `tests/content/chronicle1-ch07-ch08.test.ts`

**Interfaces:**
- Produces: `CH07_SCENES` with 40 scenes and `CH08_SCENES` with 38 scenes.
- Guarantees: coalition state affects approach options, Voss receives a coherent argument scene, and the encrypted-patron letter appears only after the central conflict resolves.

- [ ] **Step 1: Write failing quota, coalition, and finale-order tests.**

```ts
expect(countSceneTypes(CH07_SCENES)).toEqual({ main: 7, companion: 8, journey: 16, combat: 6, hub: 3 });
expect(countSceneTypes(CH08_SCENES)).toEqual({ main: 7, companion: 7, journey: 15, combat: 6, hub: 3 });
expect(anchorIndex(CH08_SCENES, 'the-letter-in-cipher')).toBeGreaterThan(anchorIndex(CH08_SCENES, 'who-keeps-the-crownless-keep'));
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-ch07-ch08.test.ts`; expect missing catalog failures.**
- [ ] **Step 3: Author the coalition march, assault/infiltration branches, False Coronation, Voss confrontation, keep-custodian decision, and restrained patron hook. Voss must offer safety through forced unity before combat or surrender. Prior evidence, Greywatch, orc-peace, companion, and faction state must alter available arguments and epilogue flags without skipping the confrontation.**

```ts
export const KEEP_CUSTODIAN_FLAGS = ['keep-border-council', 'keep-greywatch', 'keep-free-host', 'keep-neutral-wardens'] as const;
export const ENDING_AXIS_FLAGS = ['voss-exposed', 'border-peace', 'coalition-formed', 'open-war', ...KEEP_CUSTODIAN_FLAGS] as const;
```

- [ ] **Step 4: Run the focused test and build; enumerate peaceful, forceful, coalition, and failed-conspiracy states and verify all resolve the campaign before the cipher letter.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/chapters/ch07 src/game/content/chronicle1/chapters/ch08 tests/content/chronicle1-ch07-ch08.test.ts
git commit -m "feat: author Crownless Keep finale chapters"
```

### Task 6: Assemble and validate exactly 332 scenes

**Files:**
- Create: `src/game/content/chronicle1/index.ts`
- Create: `src/game/content/chronicle1/media-contract.ts`
- Create: `tests/content/chronicle1-scenes.test.ts`
- Modify: `tests/content/chronicle1-companions.test.ts`

**Interfaces:**
- Consumes: `CH01_SCENES` through `CH08_SCENES` and core `validateContent`.
- Produces: `CHRONICLE1_SCENES`, `CHRONICLE1_SCENE_INDEX`, `CHRONICLE1_MEDIA_CONTRACT`, and the scene portion of `CHRONICLE1_CONTENT`.

- [ ] **Step 1: Write the failing global ledger test.**

```ts
it('ships the exact approved authored scene ledger', () => {
  expect(CHRONICLE1_SCENES).toHaveLength(332);
  expect(countSceneTypes(CHRONICLE1_SCENES)).toEqual({ main: 56, companion: 64, journey: 140, combat: 48, hub: 24 });
  expect(countJourneySubtypes(CHRONICLE1_SCENES)).toEqual({ travel: 48, investigation: 28, sideQuest: 24, dungeon: 16, moral: 24 });
  expect(countRelationshipArcs(CHRONICLE1_SCENES)).toEqual({ mara: 10, rukhar: 12, caldus: 12, lyra: 12, talla: 12, faction: 6 });
  expect(new Set(CHRONICLE1_SCENES.map((scene) => scene.illustrationId)).size).toBe(332);
});
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-scenes.test.ts`; expect missing assembled exports or quota differences.**
- [ ] **Step 3: Assemble in chapter and within-chapter story order. Reject duplicate IDs, duplicate illustration IDs, invalid eligibility, missing outcomes, callbacks without deadlines, and main anchors without an `anchorOrder`. Add a copy check requiring titles, all narrative blocks, labels, details, and outcomes to contain ordinary English letters and prohibiting prompt-like phrases such as `generate`, `continue the story`, and `AI response`.**

```ts
export const CHRONICLE1_SCENES = Object.freeze([
  ...CH01_SCENES, ...CH02_SCENES, ...CH03_SCENES, ...CH04_SCENES,
  ...CH05_SCENES, ...CH06_SCENES, ...CH07_SCENES, ...CH08_SCENES,
]);
export const CHRONICLE1_SCENE_INDEX = new Map(CHRONICLE1_SCENES.map((scene) => [scene.id, scene]));
```

- [ ] **Step 4: Run scene and companion tests; manually read the 56 main scenes in order and correct chronology, unclear antecedents, premature proper nouns, and duplicate revelations. Run `npm run build`.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/index.ts src/game/content/chronicle1/media-contract.ts tests/content/chronicle1-scenes.test.ts tests/content/chronicle1-companions.test.ts
git commit -m "feat: assemble 332 Black Banner scenes"
```

### Task 7: Add exactly 100 authored items

**Files:**
- Create: `src/game/content/chronicle1/items/weapons.ts`
- Create: `src/game/content/chronicle1/items/armor.ts`
- Create: `src/game/content/chronicle1/items/charms.ts`
- Create: `src/game/content/chronicle1/items/consumables.ts`
- Create: `src/game/content/chronicle1/items/tools.ts`
- Create: `src/game/content/chronicle1/items/artifacts.ts`
- Create: `src/game/content/chronicle1/items/index.ts`
- Create: `tests/content/chronicle1-items.test.ts`
- Modify: `src/game/content/chronicle1/index.ts`

**Interfaces:**
- Consumes: core `ItemDefinition`, legacy `ITEMS`, and chapter/reputation/quest gate contracts.
- Produces: `CHRONICLE1_NEW_ITEMS` (100), `CHRONICLE1_ITEMS` (160), and `NEW_ITEM_ICON_IDS` (100).

- [ ] **Step 1: Write failing exact-count, identity, usability, and gating tests.**

```ts
expect(countNewItemGroups(CHRONICLE1_NEW_ITEMS)).toEqual({ weapons: 24, armor: 20, charms: 16, consumables: 24, tools: 8, artifacts: 8 });
expect(CHRONICLE1_NEW_ITEMS).toHaveLength(100);
expect(CHRONICLE1_ITEMS).toHaveLength(160);
expect(new Set(CHRONICLE1_ITEMS.map((item) => item.id)).size).toBe(160);
expect(CHRONICLE1_NEW_ITEMS.filter(isConsumable).every((item) => item.useContexts.includes('field') && item.useContexts.includes('combat'))).toBe(true);
expect(CHRONICLE1_NEW_ITEMS.filter((item) => item.tier >= 4).every((item) => item.gates.minChapter >= 4 || item.gates.questId || item.gates.minReputation)).toBe(true);
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-items.test.ts`; expect module/count failures.**
- [ ] **Step 3: Author readable descriptions, stats, values, tiers, gates, tags, and icon IDs for the following locked new IDs.**

```ts
export const NEW_ITEM_IDS = {
  weapons: ['weapon-greywatch-sabre','weapon-border-pike','weapon-caravan-hatchet','weapon-scout-longbow','weapon-black-banner-cleaver','weapon-redwater-lance','weapon-orc-peaceblade','weapon-drowned-road-trident','weapon-ferryman-hook','weapon-embervault-maul','weapon-cinderpick','weapon-royal-armory-sword','weapon-conclave-focus-staff','weapon-sealbreak-wand','weapon-ashglass-dagger','weapon-crownless-halberd','weapon-voss-officer-blade','weapon-kingroad-crossbow','weapon-goblin-foldknife','weapon-talla-slingblade','weapon-mara-scout-knife','weapon-rukhar-oath-axe','weapon-lyra-seal-rod','weapon-caldus-pilgrim-mace'],
  armor: ['armor-greywatch-guard-coat','armor-caravan-leathers','armor-scout-halfmail','armor-black-banner-cuirass','armor-redwater-scale','armor-orc-peace-lamellar','armor-flooded-chain','armor-ferryman-oilskin','armor-embervault-apron','armor-cinderplate','armor-conclave-sealcoat','armor-abbey-field-vestment','armor-crownless-sentinel-mail','armor-voss-command-plate','armor-goblin-patchcloak','armor-stonehand-harness','armor-mara-raincloak','armor-caldus-healer-mail','armor-lyra-warded-mantle','armor-road-council-coat'],
  charms: ['charm-greywatch-key','charm-medicine-wagon-token','charm-witness-ring','charm-royal-fletching','charm-goblin-brass-button','charm-redwater-peace-knot','charm-rukhar-name-bead','charm-drowned-compass','charm-ember-ledger-seal','charm-forgemasters-mark','charm-mara-scout-badge','charm-caldus-prayer-cord','charm-lyra-cipher-lens','charm-talla-bell-coin','charm-crownless-door-key','charm-voss-broken-signet'],
  consumables: ['consumable-field-bandage','consumable-greywatch-tonic','consumable-bitterroot-tea','consumable-smoke-bomb','consumable-caltrop-pouch','consumable-lamp-oil','consumable-antivenom','consumable-marsh-salts','consumable-orc-field-broth','consumable-redwater-stimulant','consumable-warding-chalk','consumable-magefire-flask','consumable-frost-salve','consumable-ember-draught','consumable-burn-paste','consumable-focus-incense','consumable-armor-pitch','consumable-whetstone-kit','consumable-hearty-ration','consumable-blackroot-brew','consumable-healing-poultice','consumable-cleansing-herbs','consumable-courage-cordial','consumable-last-light-phial'],
  tools: ['scroll-counterseal','scroll-hushed-step','scroll-breaking-ward','scroll-roadward','tool-lockpick-roll','tool-field-repair-kit','tool-surveyors-kit','tool-signal-whistle'],
  artifacts: ['quest-voss-sealed-order','quest-greywatch-witness-statement','quest-royal-arrowhead','quest-redwater-truce-copy','quest-embervault-ledger','quest-hostage-list','quest-crownless-access-seal','quest-patron-cipher-letter'],
} as const;
```

- [ ] **Step 4: Run item tests, the core inventory tests, and build. Check that one rewarded-gold purchase cannot bypass chapter/reputation/quest gates and that no item requires watching an ad.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/items src/game/content/chronicle1/index.ts tests/content/chronicle1-items.test.ts
git commit -m "feat: add one hundred Black Banner items"
```

### Task 8: Expand enemy roles, portraits, encounters, and 15 bosses

**Files:**
- Create: `src/game/content/chronicle1/enemies/archetypes.ts`
- Create: `src/game/content/chronicle1/enemies/ranked.ts`
- Create: `src/game/content/chronicle1/enemies/bosses.ts`
- Create: `src/game/content/chronicle1/enemies/encounters.ts`
- Create: `tests/content/chronicle1-enemies.test.ts`
- Modify: `src/game/content/chronicle1/index.ts`

**Interfaces:**
- Consumes: core enemy-role, status, encounter-budget, phase, and compatibility schemas.
- Produces: `CHRONICLE1_RANKED_ENEMIES` (200), `CHRONICLE1_BOSSES` (15), `CHRONICLE1_ENEMIES` (215), `ENEMY_PORTRAIT_IDS` (80), and encounter IDs referenced by all 48 combat scenes.

- [ ] **Step 1: Write failing catalog and compatibility tests.**

```ts
expect(CHRONICLE1_RANKED_ENEMIES).toHaveLength(200);
expect(new Set(CHRONICLE1_RANKED_ENEMIES.map((enemy) => enemy.portraitId)).size).toBe(80);
expect(CHRONICLE1_BOSSES).toHaveLength(15);
expect(new Set(CHRONICLE1_ENEMIES.map((enemy) => enemy.id)).size).toBe(215);
expect(new Set(COMBAT_SCENES.map((scene) => scene.encounterId)).size).toBe(48);
expect(validateEncounterGroups(CHRONICLE1_ENCOUNTERS, CHRONICLE1_ENEMIES)).toEqual([]);
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-enemies.test.ts`; expect missing exports/count failures.**
- [ ] **Step 3: Retain 20 archetypes × 10 ranks while adding role, compatibility tags, status interactions, and four genuine portrait identities per archetype. Map ranks 1–2 to portrait `01`, 3–5 to `02`, 6–8 to `03`, and 9–10 to `04`; the media plan supplies visibly different pose/equipment/marking art, not tint variants. Author these exact bosses with phases and counterplay:**

```ts
export const BOSS_IDS = [
  'boss-rattlehook-bridge-chief', 'boss-captain-oren-dusk', 'boss-black-banner-gatebreaker',
  'boss-osra-mire-witch', 'boss-harrow-ferry-reaver', 'boss-redwater-provocateur',
  'boss-kargan-war-chief', 'boss-embervault-forgemaster', 'boss-royal-armory-golem',
  'boss-siege-engineer-malrec', 'boss-black-banner-commander', 'boss-crownless-gate-warden',
  'boss-voss-champion-elian-roake', 'boss-marshal-severin-voss', 'boss-coronation-engine',
] as const;
```

- [ ] **Step 4: Build 48 encounter definitions around chapter threat budgets and authored compatibility tags. Run enemy tests plus `npm test -- tests/combat-groups.test.ts`; confirm no group has unavoidable turn-one lethal damage, duplicate unique bosses, or permanent-control loops. Run build.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/enemies src/game/content/chronicle1/index.ts tests/content/chronicle1-enemies.test.ts
git commit -m "feat: expand Black Banner bestiary and bosses"
```

### Task 9: Four endings and 24 epilogue fragments

**Files:**
- Create: `src/game/content/chronicle1/endings.ts`
- Create: `tests/content/chronicle1-endings.test.ts`
- Modify: `src/game/content/chronicle1/index.ts`

**Interfaces:**
- Consumes: `CampaignState` ending axes and core ending-resolution contract.
- Produces: `CHRONICLE1_ENDINGS`, `CHRONICLE1_EPILOGUE_FRAGMENTS`, and `resolveChronicle1Ending(state): ChronicleResolution`.

- [ ] **Step 1: Write failing state-accumulation tests.**

```ts
expect(CHRONICLE1_ENDINGS.map((ending) => ending.id)).toEqual([
  'the-banner-broken', 'the-iron-peace', 'council-of-the-road', 'the-war-without-end',
]);
expect(CHRONICLE1_EPILOGUE_FRAGMENTS).toHaveLength(24);
expect(resolveChronicle1Ending(campaignWith({ evidence: 5, borderPeace: true, coalition: true })).endingId).toBe('council-of-the-road');
expect(resolveChronicle1Ending(campaignWith({ evidence: 1, borderPeace: false, coalition: false })).endingId).toBe('the-war-without-end');
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-endings.test.ts`; expect missing module failures.**
- [ ] **Step 3: Author four full ending resolutions and exactly 24 conditional fragments: 4 Greywatch states, 10 companion outcomes (loyal and lost/estranged for each companion), 3 faction settlements, 4 keep-custodian outcomes, 1 evidence/truth outcome, 1 civilian medicine outcome, and 1 encrypted-patron hook. Resolve the main ending from accumulated evidence, peace/war, coalition, and use of force; the final dialogue choice may influence but never overwrite all earlier state.**

```ts
export interface ChronicleResolution {
  readonly endingId: 'the-banner-broken' | 'the-iron-peace' | 'council-of-the-road' | 'the-war-without-end';
  readonly epilogueFragmentIds: readonly string[];
  readonly title: string;
  readonly paragraphs: readonly string[];
}
```

- [ ] **Step 4: Run ending tests and enumerate a pairwise matrix of Greywatch × peace × coalition × companion outcomes; every state selects one main ending, deterministic ordered fragments, and exactly one patron-hook fragment. Run build.**
- [ ] **Step 5: Commit.**

```bash
git add src/game/content/chronicle1/endings.ts src/game/content/chronicle1/index.ts tests/content/chronicle1-endings.test.ts
git commit -m "feat: add Black Banner endings and epilogues"
```

### Task 10: Full validation, route simulation, and media-contract export

**Files:**
- Create: `scripts/content/export-chronicle1-manifest.mjs`
- Create: `content/manifests/chronicle1-media-contract.json`
- Create: `tests/content/chronicle1-validation.test.ts`
- Create: `tests/content/chronicle1-routes.test.ts`
- Modify: `src/game/content/chronicle1/media-contract.ts`
- Modify: `src/game/content/chronicle1/index.ts`
- Modify: `package.json` through the designated integration owner only

**Interfaces:**
- Consumes: the complete Chronicle I index, `validateContent`, and core route director.
- Produces: `npm run content:validate`, `npm run content:export`, and a deterministic media contract consumed by `2026-08-31-morrowmere-media-production.md`.

- [ ] **Step 1: Write failing full-index and 1,000-seed route tests.**

```ts
it('passes the complete production validator', () => {
  expect(validateContent(CHRONICLE1_CONTENT)).toEqual([]);
  expect(CHRONICLE1_CONTENT.events.size).toBe(332);
  expect(CHRONICLE1_CONTENT.items.size).toBe(160);
  expect(CHRONICLE1_CONTENT.enemies.size).toBe(215);
});

it('keeps anchors, callbacks, variety, and recovery opportunities coherent', () => {
  for (let seed = 1; seed <= 1_000; seed += 1) {
    const audit = simulateChronicle1(seed, CHRONICLE1_CONTENT);
    expect(audit.skippedAnchorIds).toEqual([]);
    expect(audit.duplicateSceneIds).toEqual([]);
    expect(audit.expiredCallbackIds).toEqual([]);
    expect(audit.longestCombatRun).toBeLessThanOrEqual(3);
    expect(audit.longestNoRecoveryRun).toBeLessThanOrEqual(12);
  }
});
```

- [ ] **Step 2: Run `npm test -- tests/content/chronicle1-validation.test.ts tests/content/chronicle1-routes.test.ts`; expect validation and export failures until the final index is wired.**
- [ ] **Step 3: Implement the exporter with Vite's server-side module loader so TypeScript catalogs remain the single source of truth. Sort every JSON array by stable ID and serialize only non-secret production fields. Add scripts `content:validate` and `content:export`; generated output must contain 332 scene-art rows, 100 new item-icon rows, 80 portrait rows, 15 boss-art rows, and all referenced VO cue IDs.**

```js
const payload = {
  version: 1,
  scenes: contract.scenes.toSorted((a, b) => a.id.localeCompare(b.id)),
  itemIcons: contract.itemIcons.toSorted((a, b) => a.id.localeCompare(b.id)),
  enemyPortraits: contract.enemyPortraits.toSorted((a, b) => a.id.localeCompare(b.id)),
  bosses: contract.bosses.toSorted((a, b) => a.id.localeCompare(b.id)),
  voiceCues: contract.voiceCues.toSorted((a, b) => a.id.localeCompare(b.id)),
};
```

- [ ] **Step 4: Run `npm run content:validate`, `npm run content:export`, rerun the export and verify `git diff --exit-code content/manifests/chronicle1-media-contract.json`, then run `npm test -- tests/content` and `npm run build`. Expected: all commands pass and the second export is byte-identical.**
- [ ] **Step 5: Commit.**

```bash
git add scripts/content content/manifests/chronicle1-media-contract.json src/game/content/chronicle1 tests/content package.json package-lock.json
git commit -m "test: lock Chronicle I content ledger"
```

## Self-review checklist

- [ ] Every checkbox step names its concrete deliverable, command, and expected result.
- [ ] The chapter ledger sums to 332 and the five category totals equal 56/64/140/48/24.
- [ ] Journey subtype totals sum to 140; relationship-arc totals sum to 64.
- [ ] The 100 new item IDs are unique and their six group counts sum to 100.
- [ ] The enemy plan produces 200 ranked enemies, 80 portrait identities, and 15 bosses.
- [ ] Every later interface name matches the producer task that defines it.
- [ ] The media contract contains IDs only and no API key, provider secret, raw prompt response, or local absolute path.
- [ ] The spec's story, companion, merchant, item, enemy, branching, ending, procedural, readability, and English-copy requirements each map to a task above.
