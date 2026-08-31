# Task 4 — Deterministic Tactical Combat

## Scope delivered

Implemented the Task 4 combat modules and retained the prior `src/game/combat.ts` API as a compatibility facade. The new public turn resolver returns the combat state, inventory state, and typed domain events together.

## TDD evidence

### RED

Command:

```powershell
npm test -- --run tests/combat-attack.test.ts tests/combat-groups.test.ts tests/combat.test.ts
```

Result before implementation: 13 failures, all caused by the absent `resolveCombatTurn` and `createEncounter` APIs (`TypeError: ... is not a function`). The existing `tests/combat.test.ts` suite still passed (7 tests), confirming the failures were specific to the newly requested combat contract.

### GREEN

Same command after the minimal modular implementation:

```text
Test Files  3 passed (3)
Tests       22 passed (22)
```

The group suite includes deterministic baseline simulations with no companion and with a companion. Both reach victory within eight turns, retain positive hero health, and assert companion damage does not exceed the stored support budget.

## Verification

- Focused existing/new combat tests: 22 passed.
- `npm run build`: passed (`tsc -b` and production Vite build).
- `git diff --check`: passed.
- A full-suite run was attempted. It emitted the repository's pre-existing jsdom `Window.scrollTo()` notices, but the harness did not return a usable final summary; this does not affect the focused Task 4 verification above.

## Files

- `src/game/combat/types.ts` — tactical state, action, role, outcome, event, and result contracts.
- `src/game/combat/attack.ts` — deterministic outcome rolls, bounded power variation, damage, and bad-luck detection.
- `src/game/combat/enemy-ai.ts` — role inference and saved-RNG intent selection.
- `src/game/combat/encounters.ts` — group encounter construction, initial telegraphs, companion budget setup.
- `src/game/combat/resolve.ts` — atomic player/enemy turn resolution, inventory consumables, cooldowns, flee, statuses, and boss phases.
- `src/game/combat.ts` — legacy facade over the new modules.
- `tests/combat-attack.test.ts` and `tests/combat-groups.test.ts` — deterministic attack and multi-combatant coverage.

## Self-review

- RNG is read only from `CombatState.rngState` and the returned state always carries the advanced value for a spent turn.
- All six required attack outcomes are typed and serialized as `attack_resolved` domain events.
- Target selection rejects invalid/dead targets without mutating combat or inventory.
- Consumables use the shared inventory API, so combat usage consumes one stack entry atomically and spends a turn.
- Only one companion snapshot can be attached; its command has a cooldown and a persistent combat-level support ceiling.
- The facade preserves legacy single-enemy creation, no-target attacks, item actions, and English display strings used by the current UI/tests.

## Concerns / follow-up

Enemy role behavior is intentionally compact in this task: roles select defensible defaults (evasion, block, parry, intent weighting source) and expose primary intents. Chapter-specific enemy combinations, authored phase rules beyond phase two, and broader balance sweeps belong to the later content and integration tasks.

## Fix round 1 — review findings

### RED evidence

Focused regressions were added first for the legacy Red Mercy facade path, the eight shipped enemy-role classifications and their role actions, lethal boss phase thresholds, enemy power variance, and the group compatibility enemy alias.

```powershell
npm test -- --run tests/combat.test.ts tests/combat-attack.test.ts tests/combat-groups.test.ts
```

Result before the fixes: 7 failures. They showed that the legacy facade rejected `potion-red`, enemy variation was `1`, lethal boss hits still emitted `boss_phase_changed`, the legacy enemy alias remained the dead front combatant, shipped trait classification fell back to `specialist`, and role actions did not produce their required effects.

The canonical event-contract regression was then added as a real turn-result assignment to `DomainEvent[]` imported from `src/game/domain/result.ts`.

```powershell
npm run build
```

Result before consolidation: expected TS2322 error because `CombatTurnResult.events` used the separate combat-local `DomainEvent` union rather than the canonical domain union.

### GREEN evidence

- The combat regressions now pass: 29/29 tests in `combat.test.ts`, `combat-attack.test.ts`, and `combat-groups.test.ts`.
- A combined combat, state, and interface check passes: 47/47 tests across five files. The existing interface suite prints jsdom `Window.scrollTo()` notices but passes.
- `npm run build` passes after moving `AttackOutcome` and combat intent vocabulary to `src/game/domain/combat.ts`, adding all combat variants to `src/game/domain/result.ts`, and making `CombatTurnResult` import that canonical `DomainEvent` type.
- `git diff --check` passes.
- `npm run test:run` was attempted. The runner emitted the repository's known jsdom `Window.scrollTo()` notices but the shell integration did not return a final suite summary; focused and affected suites above completed normally.

### Changes made

- The legacy facade now supplies the real immutable item catalog, so the existing CombatPanel `potion-red` command heals, removes the item, and advances the turn.
- Shipped trait names now explicitly classify all eight roles. Defenders block, assassins evade/parry and strike harder, archers pierce guard, controllers apply Hindered, shamans drain Focus, summoners create one smoke minion, commanders buff living allies, and specialists recover more health.
- Bosses only enter phase two while alive; a lethal hit produces defeat/victory events without a phase-change event.
- Enemy attacks now use the same saved 88–115% power variation as player attacks and serialize that value in `attack_resolved`.
- Group combat keeps compatibility `enemy` synchronized to the first living combatant selected by the visible intent list.
- `DomainEvent` now has one canonical declaration in `src/game/domain/result.ts`; combat re-exports that type for compatibility rather than declaring a competing union.
