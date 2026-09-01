# Task 10A report: authored choice requirements

## RED

- Added focused availability and conditional-modifier assertions.
- Ran `npm run test:run -- tests/check-resolution.test.ts tests/director-travel-flow.test.ts`: both files failed as expected because the active-modifier helper did not exist and choice availability accepted only flags rather than expedition resources.

## GREEN

- Added scoped banked/unbanked gold minimums and item-quantity requirements. Flag requirements alone retain the legacy `present: true` builder default.
- Shared full availability context and concrete disabled reasons across director eligibility, reducer validation, and UI selection. Source validation now checks authored requirement IDs and numeric minima/quantities.
- Added flag-gated check modifiers and one shared active-modifier helper, used by both displayed and resolved chance calculations.
- No scenes, catalogs, counts, or director pacing behavior were changed.
- Ran `npm run test:run -- tests/check-resolution.test.ts tests/director-travel-flow.test.ts`: 2 files passed, 16 tests passed.

## Changed files

- `src/game/checks.ts`
- `src/game/content/chronicle1/builders.ts`
- `src/game/content/schema.ts`
- `src/game/content/validate.ts`
- `src/game/director.ts`
- `src/game/director/eligibility.ts`
- `src/game/director/types.ts`
- `src/game/state/reducer.ts`
- `src/ui/selectors.ts`
- `tests/check-resolution.test.ts`
- `tests/director-travel-flow.test.ts`

## Commit

`feat: support authored choice requirements`

## Review fixes

- Guarded malformed checked-choice modifier inspection so `check: null`, primitives, and malformed modifier records produce deterministic structural diagnostics rather than throwing.
- Added explicit item requirement scope. `pack` matches consumable/removal gates; `owned` counts pack, stash, quest, and equipped instances, respecting the inventory's equip/remove semantics. Legacy omitted scope normalizes to `owned`.
- Gold minima now require positive safe integers.
- Expanded focused coverage for banked versus unbanked gold, pack versus owned item gates, legacy flag default/exclusion semantics, reducer rejection with unchanged state and concrete reason, and displayed-versus-recorded conditional check chances.
- Ran `npm run test:run -- tests/check-resolution.test.ts tests/director-travel-flow.test.ts`: 2 files passed, 17 tests passed.

### Commit

`fix: align authored choice availability`
