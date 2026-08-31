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
