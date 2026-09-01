# Task 10B report

## Delivered

- Added the four Chapter 1 living-packet modules: departure (6 scenes), Mara (6), tollhouse (9), and ambush (6), for 27 scenes.
- Wired the authored departure, medicine, tollhouse search/bypass, smoke, first-arrow, orchard aftermath, and bridge seams.
- Added `enc-ch01-verge-signalers` and `enc-ch01-tollhouse-cellar` with the specified Chapter 1 rewards. Chronicle encounter count is now 50.
- Updated the Chapter 1 and Chronicle assembly checkpoints to 68 and 359 scenes respectively. Items and enemies are unchanged.
- Kept Mara unrecruited and did not add media binaries or Packet 10-18 IDs.

## Verification

`npm run test:run -- tests/content/ch01-living-encounters.test.ts tests/ch01-playthroughs.test.ts`

Result: 2 files passed, 4 tests passed.

## Reconciliation

The current content runtime represents combat with branch `combatEncounterId` or a combat effect plus an authored post-victory `nextSceneId`; the new packets use that existing adapter. Scene illustration IDs are registered through the existing scene-derived media contract, so no fallback art or binary asset was introduced in this task.
