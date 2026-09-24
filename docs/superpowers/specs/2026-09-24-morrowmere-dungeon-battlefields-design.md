# Dungeon Battlefields and Tactical Forecasts

**Status:** Draft for user review
**Date:** 2026-09-24
**Scope:** Encounter-specific art and attack forecasting for Chronicle I dungeon combat.

## Intent and constraints

The user wants dungeon runs to feel like playable, dangerous places rather than story text followed by generic enemy cards. Combat should invite a real choice between attacking, defending, using a technique, or spending an item, with the likely outcome legible before the turn is committed.

The existing combat resolver already has seeded accuracy and damage rolls, miss-streak protection, glancing hits, critical hits, enemy evasion, block and parry, telegraphed intents, guarding, class techniques, companion actions, consumables, and boss phases. The pure `previewAttack` calculation already derives the actual outcome percentages and damage range without advancing RNG. The missing piece is presenting that forecast alongside a battle scene.

Visual constraints: use the game's grounded, painterly dark-fantasy look; depict the actual encounter composition within a chapter-appropriate environment; keep materials, lighting, and scale coherent with existing Chronicle I art. Battle images contain no text, interface, logos, or watermarks. They must not replace or overwrite existing scene art.

## Chosen design

### Art identity and rendering

Add immutable battlefield-art metadata to encounter definitions. Every distinct encounter referenced by a dungeon combat node, including encounter-variant IDs, receives its own generated art mapping. The current dungeon catalog contains 24 unique encounter IDs, so the scope is 24 new landscape arena illustrations. The images show the relevant enemy group in context (not just a portrait on a decorative card), with enough readable environment to establish the tactical space.

Store final assets under `public/assets/chronicle1/battles/` using stable encounter-derived filenames. The encounter catalog owns the image ID and descriptive alt text; saves do not serialize artwork metadata and need no schema migration. The combat screen resolves art from the active encounter and renders it as a dedicated battlefield figure before the combat controls. If a non-dungeon encounter has no battlefield mapping, preserve the existing chapter-scene art fallback. Do not fabricate a missing dungeon image through semantic fallback: validation should fail if one of the 24 authored mappings is absent or points to a missing/invalid file.

### Tactical forecast

When the player selects an enemy, calculate the basic-attack forecast for that target using the existing canonical attack profile and `previewAttack`, including the current missed-attack streak and target defenses. Show readable percentages for applicable outcomes (miss, glancing, hit, critical, block, parry) and the resulting damage range. Keep the selected enemy's intent visible at the same time so the forecast supports attack-versus-guard/item decisions. The forecast is informational only: it must not advance or consume RNG, and the existing resolver remains the sole authority for the action result. Existing technique, companion, consumable, and flee behavior is preserved.

The 24 dungeon compositions remain varied and use the existing encounter-specific enemy roles, intent weights, boss phases, and counterplay text. Do not add artificial RNG or inflate HP merely to make battles longer. If focused play verification exposes a dungeon battle that is trivially solved by repeating basic attack, tune its authored encounter composition/intent mix within the existing validated threat budget, and document the concrete reason for each adjustment.

### User journey and persistence

End-to-end coverage follows the previously approved route/save plan:

1. Start the Chronicle, proceed through a multi-scene authored chain without a false road menu, choose the Chapter 1 cellar branch, and reach its dungeon.
2. Save during the run, reload, and verify the same node/encounter/art and actionable battle resume; complete the battle and reward, then reach the next main-story anchor without replay.
3. In a Chapter 5 smoke journey, select distinct dungeon branches, use a rest or safe extraction, then save/reload a boss fight and resume it.

No persistence shape change is expected; tests must confirm static art lookup is independent of saved state and the existing dungeon cursor/RNG resume behavior remains stable.

## Acceptance criteria

- All 24 unique dungeon encounter IDs resolve to distinct, non-placeholder generated battlefield files and accurate alt text.
- Art uses a consistent Morrowmere palette/material/rendering language while showing each encounter's enemies in a relevant space; it contains no UI or lettering.
- The current encounter's battlefield is shown during combat, including when the dungeon battle begins without a separate scene illustration; unmapped non-dungeon combat keeps the existing scene art.
- Selecting another target updates the displayed attack forecast. Displayed outcomes and damage range agree with `previewAttack` for representative normal, blinded, guarded, evasive, parrying, and forced-glance states.
- Showing the forecast does not mutate the combat state or RNG.
- Enemy telegraphs and all existing player action choices remain clear and usable at 360×800.
- E2E journeys verify Chapter 1 dungeon entry, save/reload/resume, reward/exit, and a Chapter 5 boss resume.
- Focused tests, full unit suite, TypeScript, image validation, E2E, and `git diff --check` pass before handoff.

## Files likely to change

- `src/game/content/schema.ts` and Chronicle I encounter definitions for optional static battlefield-art metadata.
- `src/components/GameShell.tsx` and a small battlefield-art component (or the combat presentation boundary) to resolve and show the current encounter's image.
- `src/ui/types.ts` and combat selectors/components for target-specific forecast data and accessible display.
- `src/styles/game.css` for responsive art/forecast hierarchy.
- `tests/combat-interface.test.tsx`, combat forecast/content/media tests, and the existing/new dungeon E2E specs.
- `public/assets/chronicle1/battles/` for the 24 generated images.

This work is limited to dungeon encounter battlefield art plus visible tactical forecasts and authored balancing when needed. Ordinary non-dungeon fights retain existing scene art unless they share one of the 24 dungeon encounter definitions. Probability formulas, save schema, and unrelated story content remain unchanged.
