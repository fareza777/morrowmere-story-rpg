# Task 8 report: playable Chronicle validation

## RED

- Added the focused `tests/content/chronicle1-playability.test.ts` fixture.
- Confirmed RED with `npm run test:run -- tests/content/chronicle1-playability.test.ts`: a dangling required continuation produced no `missing_next_scene` diagnostic.

## GREEN

- Added catalog-aware Chronicle playability validation for encounter ownership, checked-choice shape, required scene targets, required-edge cycles, tangibility, route spoilers, and dialogue media contracts.
- Strict interaction applies only to dialogue, checked, connected, combat-continuation, or follow-up scenes. Legacy flag-only scenes remain exempt.
- Scene-level `followUps` remain optional and are excluded from required-cycle edges. Neutral zero-choice and `continueOnly` dialogue paths remain legal.
- Generic runtime validation still uses only `ContentIndex` art and audio IDs. Chronicle-local cue text and media classes are checked only at assembly.
- Extended the shared sentence counter for closing quotes/brackets and terminal abbreviation boundaries.
- Focused GREEN command: `npm run test:run -- tests/content/chronicle1-playability.test.ts tests/content/chronicle1-validation.test.ts tests/content/chronicle1-effects.test.ts`.

## Changed files

- `src/game/content/dialogue.ts`
- `src/game/content/validate.ts`
- `src/game/content/chronicle1/index.ts`
- `tests/content/chronicle1-playability.test.ts`
- `tests/content/chronicle1-validation.test.ts`

## Commit

`test: enforce playable chronicle content`

## Risks

- The strict legacy exemption is intentionally retained until Tasks 10 and 12 convert older flag-only scenes.
- The sentence counter handles the documented English abbreviation set; unusual editorial punctuation may still require author review.

## Fix round 1

### GREEN

- Checked branch effects are now validated entry by entry before traversal. Null, incomplete, and unknown discriminants emit ID-rich structural diagnostics without throwing.
- Graph analysis preserves an explicit null exit for every malformed required or present critical branch, preventing uncertain authored data from creating a false required cycle.
- Abbreviations now distinguish in-sentence use from a following new sentence. Cue text uses normalized Unicode word boundaries, so punctuation-adjacent words match without accepting embedded substrings.
- Expanded focused fixtures cover malformed success/failure effects, unknown branch encounters, self-loop exits, later-consumed flags and tangible effects, typed media mismatch, index-local generic audio, and the abbreviation boundaries.
- Ran `npm run test:run -- tests/content/chronicle1-playability.test.ts tests/content/chronicle1-validation.test.ts tests/content/chronicle1-effects.test.ts`: 16 of 17 tests passed. The sole failure exposed an empty direct fixture response beside a strict checked choice; that fixture was corrected, but no rerun was made under the one-command limit.

### Commit

`fix: harden chronicle validation`
