# Task 7 report: cinematic story dialogue

## RED

- Added only `tests/dialogue-state.test.ts` and `tests/dialogue-interface.test.tsx`.
- Confirmed RED with dialogue advancement rejected as unsupported, exact v3 dialogue state rejected by persistence, and the dialogue component missing.

## GREEN

- Added ordered, optional dialogue beat schema, a scene-local persisted beat index, and the `advance-dialogue` command.
- Added exact v3 persistence, v2 defaulting, and narrow pre-dialogue-v3 normalization without changing the save envelope version.
- Added a presentational dialogue panel in the existing story flow. It uses explicit environment and decorative character layers, keeps choices until the final beat, honors reduced motion, and has a local voiced reveal hook.
- Added direct cue lookup and local completion callback support. No media was generated and no network audio is used.
- Verified once with `npm run test:run -- tests/dialogue-state.test.ts tests/dialogue-interface.test.tsx tests/persistence.test.ts tests/accessibility.test.tsx` (4 files, 16 tests passing). The test environment logs its known `window.scrollTo` limitation.

## Changed files

- `src/game/content/schema.ts`
- `src/game/state/types.ts`
- `src/game/state/reducer.ts`
- `src/game/persistence/schema.ts`
- `src/game/persistence/codec.ts`
- `src/game/persistence/migrate.ts`
- `src/ui/types.ts`
- `src/ui/selectors.ts`
- `src/components/DialoguePanel.tsx`
- `src/components/GameShell.tsx`
- `src/components/SceneArt.tsx`
- `src/styles/dialogue.css`
- `src/App.tsx`
- `src/game/audio/catalog.ts`
- `src/game/audio/service.ts`
- `src/game/content/chronicle1/media-contract.ts`
- `src/game/content/chronicle1/index.ts`
- `tests/dialogue-state.test.ts`
- `tests/dialogue-interface.test.tsx`

## Commit

`feat: add cinematic story dialogue`

## Risks

- No authored Mara dialogue or character assets were added. Future content must register character pose IDs in the media contract before use.
- Final voice media integration remains a Task 14 concern; the current cue hook deliberately keeps playback state out of saves.
