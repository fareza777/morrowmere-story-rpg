# Morrowmere Tactical Combat and Battlefield Staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn battles into readable tactical decisions with honest hit/critical/damage forecasts, meaningful defense/item choices, stronger encounter pacing, and one generated battlefield scene per encounter.

**Architecture:** Preserve the seeded combat resolver and its existing target, guard, technique, item, companion, role, and boss-phase actions. Extract shared probability math for the preview and resolver, expose target/intent forecasts through the UI model, and replace the story-scene backdrop during combat with an encounter-keyed full battle illustration.

**Tech Stack:** TypeScript 7, React 19, Vitest 4, React Testing Library, existing seeded RNG and content catalog, WebP assets served from `public/assets/chronicle1`.

**Spec:** `docs/superpowers/specs/2026-09-24-morrowmere-roguelike-dungeon-overhaul-design.md`

## Global Constraints

- Preserve deterministic seeded resolution and clear telegraphs. The probability preview is descriptive; the seed still decides the actual roll when the action is taken.
- Before an attack is committed, show the selected target's actual estimated hit chance, critical chance, likely damage range, and meaningful risks such as parry, block, or a graze.
- Enemy intent remains visible before the player's turn. Show a concise incoming-threat forecast and how guarding or the selected defense changes expected damage.
- Encounters should reward target priority, guarding against telegraphed heavy attacks, using class techniques/items at the right time, and reacting to enemy roles. Tune regular encounters to take several meaningful decisions (normally about 4–7 player actions for a developed party), elites longer, and bosses through distinct phases/mechanics.
- Every unique encounter receives a dedicated generated battlefield illustration that shows its actual enemy group in a grounded, attractive location—not just floating/pasted enemy portraits, a blank arena, or the existing character portrait placed behind the UI.
- Retain the user's current DialoguePanel progress and the user-authored Living Departure branch edits. Correct the repeated Verge Signalers path by changing its encounter eligibility/branch wiring, not by discarding the user's story choice. Preserve and improve the existing battle/result work where it fits this flow.
- Preserve all in-progress visual-smoke screenshots.

## Review Focus

1. Odds with blind, two prior misses, target parry/block/evasion, guarding, status, and technique power must equal the resolver's actual distribution; pin each case in attack-preview tests.
2. Selecting a different enemy must immediately update odds and damage; pin this in combat-interface tests.
3. A revealed heavy/hex/strike forecast must match the exact enemy role bonus, damage kind, and archer guard bypass; pin this in intent-preview tests.
4. A missing or incorrectly named battle illustration must fail asset validation rather than silently show unrelated chapter art; pin this in media/content validation.
5. Combat duration must increase through enemy roles, telegraphs, and target decisions rather than raw HP padding; pin representative deterministic encounter simulations and review per chapter.

---

## File map

- `src/game/combat/attack.ts`: current seeded hit/parry/block/evasion/critical resolution and shared probability primitives.
- New `src/game/combat/preview.ts`: pure exact outcome and damage-range preview shared by view selectors and UI.
- `src/game/combat/types.ts`, `src/game/combat/resolve.ts`, `src/game/combat/enemy-ai.ts`, `src/game/combat/encounters.ts`: combat phase and role behavior; only change if calibration exposes a concrete missing tactical rule.
- `src/game/content/chronicle1/enemies/encounters.ts`, `ranked.ts`, and `bosses.ts`: encounter composition/counterplay and enemy tuning.
- `src/ui/types.ts` and `src/ui/selectors.ts`: selected-target attack preview, incoming threat forecast, tactical copy, and encounter art identity.
- New `src/components/BattlefieldArt.tsx`, plus `src/components/CombatPanel.tsx`, `CombatActionBar.tsx`, `EnemyParty.tsx`, `GameShell.tsx`, and `src/styles/game.css`: full scene stage, concise probability choices, and accessible mobile presentation.
- `tests/combat-attack.test.ts`, `tests/combat-interface.test.tsx`, `tests/combat-groups.test.ts`, `tests/ui-selectors.test.ts`, and `tests/content/chronicle1-enemies.test.ts`: deterministic mechanics, selector, UI, and balance coverage.
- `scripts/media/validate-scene-art.mjs`: asset plan owns full media validation; this plan defines the battle paths the validator must require.

## Interfaces shared with other plans

- Consumes stable `EncounterDefinition.id` values and chapter dungeon encounter IDs from the route/dungeon plan.
- Produces `battlefieldArtId = encounterId`, mapped to `public/assets/chronicle1/battles/<encounterId>.webp`; art production must use this exact naming contract.
- Exposes `AttackPreview` to the route-independent UI without adding derived probabilities to save files.

### Task 1: Share exact attack math with a pure odds preview

**Files:**
- Create: `src/game/combat/preview.ts`
- Modify: `src/game/combat/attack.ts`
- Modify: `src/game/combat/types.ts`
- Modify: `tests/combat-attack.test.ts`

**Interfaces:**

```ts
export interface AttackPreview {
  /** Effective accuracy before target parry/block/evasion, including blind and miss-streak rules. */
  readonly accuracyChance: number;
  /** Chance that this action produces any nonzero damage after all defensive checks. */
  readonly chanceToDamage: number;
  /** Absolute per-action probability of the critical outcome, not the conditional crit stat. */
  readonly criticalChance: number;
  readonly outcomeChances: Readonly<Record<AttackOutcome, number>>;
  readonly damageRange: { readonly min: number; readonly max: number };
}
export function previewAttack(input: {
  readonly attacker: HeroCombatant | EnemyCombatant;
  readonly target: HeroCombatant | EnemyCombatant;
  readonly power: number;
  readonly kind: 'physical' | 'sorcery';
  readonly missedAttacks?: number;
  readonly ignoreGuard?: boolean;
}): AttackPreview;
export function heroAttackProfile(
  player: HeroCombatant,
  action: { readonly type: 'attack' } | { readonly type: 'technique'; readonly techniqueId: string },
): { readonly power: number; readonly kind: 'physical' | 'sorcery' };
export function enemyAttackProfile(
  enemy: EnemyCombatant,
  intent: EnemyIntent,
): { readonly power: number; readonly kind: 'physical' | 'sorcery'; readonly ignoreGuard: boolean } | null;
```

`accuracyChance` is the effective pre-defense accuracy; `chanceToDamage` includes normal hit, critical, block-reduced, and glancing damage; `criticalChance` is the unconditional per-action critical outcome probability; `outcomeChances` is the mutually exclusive 100% distribution. A guarded enemy's `blocked` outcome still deals reduced damage in the current resolver; only `miss` and `parried` deal zero under current rules. A non-boss `flee` intent resolves as escape and forecasts zero damage; if a boss ever receives that intent, forecast its current resolver behavior (bosses cannot flee and currently still attack) rather than claiming zero.

- [ ] **Step 1: Add failing tests** to `tests/combat-attack.test.ts` for exact 100%-accuracy hit, blind miss, miss-streak forced graze, 100% parry, guarded 100% block, 100% evasion graze, crit chance, and outcome sum. Assert preview min/max equal `calculateDamage` bounds for physical and sorcery cases.
- [ ] **Step 2: Run `npm run test:run -- tests/combat-attack.test.ts`;** confirm the preview export/tests fail.
- [ ] **Step 3: Implement `previewAttack`** in `src/game/combat/preview.ts`; export and reuse one `attackAccuracy`/`critChance` rule from `src/game/combat/attack.ts` so the preview and `resolveAttack` cannot drift. Account for conditional order (accuracy → parry → block → evasion/graze → crit), blind, forced glances, target guarding, armor/ward, and damage variation.
- [ ] **Step 4: Keep RNG untouched:** `previewAttack` must not instantiate or advance `createRng`; `resolveAttack` remains the only code that consumes the saved seeded rolls.
- [ ] **Step 5: Run the focused attack suite** and confirm every probability set totals 100 and seeded results still follow the existing tests. Keep fractional percentages internally; round display values for UI without changing the underlying distribution.
- [ ] **Step 6: Commit** as `feat: calculate truthful combat attack previews`.

### Task 2: Add target-specific attack and incoming-threat forecasts to selectors

**Files:**
- Modify: `src/ui/types.ts`
- Modify: `src/ui/selectors.ts`
- Modify: `tests/ui-selectors.test.ts`
- Modify: `tests/combat-groups.test.ts`

**Interfaces:**

```ts
export interface EnemyCombatViewModel {
  readonly id: string;
  readonly attackPreview: { readonly attack: AttackPreview; readonly technique: AttackPreview };
  readonly incomingForecast: {
    readonly damageMin: number;
    readonly damageMax: number;
    readonly guardedDamageMin: number;
    readonly guardedDamageMax: number;
  };
  readonly phaseTelegraph: string | null;
  readonly phaseCounterplay: string | null;
}
export interface CombatBattlefieldViewModel {
  readonly artId: string;
  readonly alt: string;
  readonly chapterLabel: string;
  readonly counterplay: string;
}
```

`CombatViewModel.battlefield` is a `CombatBattlefieldViewModel`; intent forecasts for guard/recover and a non-boss flee return zero direct damage. A boss flee intent, if content ever authors one, must forecast the resolver's actual non-flee attack behavior or be excluded by boss intent validation.

- [ ] **Step 1: Add selector tests** with two enemies (one defender and one assassin) that assert each target has different odds, the assassin's parry/evasion is represented, heavy/hex role bonuses are reflected, and an archer's intent forecast correctly ignores guard.
- [ ] **Step 2: Run `npm run test:run -- tests/ui-selectors.test.ts tests/combat-groups.test.ts`;** confirm the new forecast fields are missing.
- [ ] **Step 3: In `selectCombatView`, resolve the active `encounterId` to its content definition** and derive battle art ID from that ID; for each living enemy call `heroAttackProfile` and `previewAttack` for Attack and the exact class technique, then use `enemyAttackProfile` and `previewAttack` for the currently revealed intent. Reuse those same profile helpers inside `resolveCombatTurn` so forecast and execution share power, damage kind, role bonuses, and guard bypass. Match the resolver's special case where a boss cannot flee and still attacks if given a `flee` intent; alternatively reject such an intent in content validation and prove that invariant with a test.
- [ ] **Step 4: Return the encounter's authored `counterplay` and per-target forecast** without persisting them; use the active hero status, missed-attacks counter, armor, ward, enemy status, guard, and role when calculating.
- [ ] **Step 5: Run the selector and group suites** and confirm all target-specific predictions are stable and do not mutate state/RNG.
- [ ] **Step 6: Commit** as `feat: expose target and intent combat forecasts`.

### Task 3: Replace portrait-only battle staging with encounter art

**Files:**
- Create: `src/components/BattlefieldArt.tsx`
- Modify: `src/components/GameShell.tsx`
- Modify: `src/components/CombatPanel.tsx`
- Modify: `src/components/EnemyParty.tsx`
- Modify: `src/styles/game.css`
- Create: `tests/battlefield-art.test.tsx`
- Modify: `tests/combat-interface.test.tsx`

- [ ] **Step 1: Add failing component tests** asserting `BattlefieldArt` requests `/assets/chronicle1/battles/<encounterId>.webp`, includes descriptive alt text, and does not fall back to another enemy or chapter's scene when missing.
- [ ] **Step 2: Run `npm run test:run -- tests/battlefield-art.test.tsx tests/combat-interface.test.tsx`;** confirm the current combat screen still shows only the originating story scene plus portrait cards.
- [ ] **Step 3: Implement `BattlefieldArt`** as a full-width 3:2 scene stage using the battle model; render the actual scene image above the tactical panels so enemy models and environment remain unobscured by text controls.
- [ ] **Step 4: Change only the combat branch in `GameShell`** to render `BattlefieldArt`; keep SceneArt for story, reward, and defeat. Keep `EnemyParty` portraits for individual targeting/HP/status.
- [ ] **Step 5: Add responsive combat styles** for the image stage, intent strip, target previews, and action forecasts at 360px, 768px, and desktop widths; respect reduced motion/high-contrast settings and never encode intent by color alone.
- [ ] **Step 6: Run both interface suites** and confirm image identity, alt text, target focus, and item/guard actions remain operable by keyboard and touch.
- [ ] **Step 7: Commit** as `feat: stage encounters in illustrated battlefields`.

### Task 4: Put odds, guard value, and item tradeoffs beside the action

**Files:**
- Modify: `src/components/CombatPanel.tsx`
- Modify: `src/components/CombatActionBar.tsx`
- Modify: `src/components/EnemyParty.tsx`
- Modify: `src/components/TutorialCallout.tsx`
- Modify: `src/styles/game.css`
- Modify: `tests/combat-interface.test.tsx`

- [ ] **Step 1: Add failing UI tests** asserting that changing the selected target updates hit/crit/risk/damage text; Guard shows the announced damage range before acting; and a healing item shows its turn cost and actual capped recovery.
- [ ] **Step 2: Run `npm run test:run -- tests/combat-interface.test.tsx`;** confirm current labels do not expose the tactical tradeoffs.
- [ ] **Step 3: Render compact probability copy** such as “Accuracy 78% · Damage chance 70% · Critical 9% · 12–18 damage” with distinct miss/graze/parry/block risk when material; derive every number from the selector preview, and label conditional versus per-action probability accurately.
- [ ] **Step 4: Render incoming intent damage for each enemy** and show the guarded range next to Guard; distinguish non-damaging intents and archer guard bypass. Keep focus cost and “item spends this turn” visible before confirmation.
- [ ] **Step 5: Update combat tutorial copy** to teach target selection, visible odds, enemy intent, Guard, class Technique, companion cooldown, and item turn cost in that order; do not add a mandatory tutorial stop to returning saves.
- [ ] **Step 6: Run the interface suite** and confirm a 360×800 viewport can see the target, intent, forecast, and action without horizontal scrolling.
- [ ] **Step 7: Commit** as `feat: show combat odds and action tradeoffs`.

### Task 5: Rebalance regular, elite, and boss fights around decisions

**Files:**
- Modify: `src/game/content/chronicle1/enemies/encounters.ts`
- Modify: `src/game/content/chronicle1/enemies/ranked.ts`
- Modify: `src/game/content/chronicle1/enemies/bosses.ts`
- Modify: `src/game/combat/types.ts`
- Modify: `src/game/combat/encounters.ts`
- Modify: `src/game/combat/enemy-ai.ts`
- Modify: `src/game/combat/resolve.ts`
- Modify: `src/ui/selectors.ts`
- Modify: `tests/content/chronicle1-enemies.test.ts`
- Modify: `tests/combat-groups.test.ts`

- [ ] **Step 1: Add deterministic balance simulations** for each hero class at the chapter's recommended level using fixed seeds; record player actions to victory, incoming damage, technique/item/guard usage, and whether each authored counterplay is mechanically relevant.
- [ ] **Step 2: Run `npm run test:run -- tests/content/chronicle1-enemies.test.ts tests/combat-groups.test.ts`;** confirm the new duration and counterplay assertions expose overly short encounters.
- [ ] **Step 3: Tune composition/intent weights before health values:** ensure regular packs require target priority or defense decisions and elites have one telegraphed signature move. Wire the existing `Chronicle1BossDefinition.phases` into runtime combat: attach the current phase's `intentWeights`, show that phase's authored `telegraph`/`counterplay` in `EnemyCombatViewModel`, and switch the intent pool when `resolveCombatTurn` crosses `startsAtHealthPercent`. Keep opening damage within the chapter's existing `CHAPTER_THREAT_BUDGETS` caps.
- [ ] **Step 4: Keep target pacing** around 4–7 player actions for ordinary developed-party encounters, 6–9 for lieutenants/elites, and at least two mechanically distinct boss phases; use HP changes only after composition/intent/counterplay is exhausted.
- [ ] **Step 5: Run deterministic simulations across the fixed seed set** and the chapter encounter/content suites; reject tuning that creates a one-turn unavoidable defeat, infinite summon/control loop, a phase that cannot trigger, or a trivial three-action regular fight.
- [ ] **Step 6: Commit** as `balance: make chronicle battles reward tactical choices`.

### Task 6: Integrate encounter identity with the generated art batch

**Files:**
- Modify: `scripts/media/validate-scene-art.mjs`
- Create: `tests/media/battle-art.test.ts`
- Modify: `tests/e2e/event-art-layout.spec.ts`

- [ ] **Step 1: Add a failing asset contract test** requiring exactly one file path for every currently registered encounter ID and rejecting missing, shared, or mismatched battle-art identity.
- [ ] **Step 2: Run the focused media test** and confirm no current encounter battle-stage files satisfy the contract.
- [ ] **Step 3: Extend the validator** to enumerate `CHRONICLE1_ENCOUNTERS` and require one valid WebP at `public/assets/chronicle1/battles/<encounterId>.webp`; new dungeon encounters are included automatically by the same catalog.
- [ ] **Step 4: Run media validation** after the art plan supplies assets; verify dimensions, format, minimum bytes, exact paths, and distinct SHA-256 hashes.
- [ ] **Step 5: Run the combat-stage E2E viewport check** and confirm image focal points remain visible at mobile and desktop widths.
- [ ] **Step 6: Commit** as `feat: validate unique battle stage art`.

## Dependencies and order

Tasks 1–2 define the pure math and view contract. Tasks 3–4 can proceed while the art plan generates assets, using stable encounter IDs. Task 5 depends on the preview/UI so pacing can be judged from real decisions. Task 6 completes after the art plan's asset paths are populated.
