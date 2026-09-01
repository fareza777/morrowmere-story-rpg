# Task 9 report: spoiler-free route choice

## RED

- Added the focused catalog and route-screen assertions.
- Ran `npm run test:run -- tests/content/chronicle1-routes.test.ts tests/game-screens.test.tsx`: both files failed as expected because the old descriptions differed from the locked copy and route buttons included their prose in the accessible name.

## GREEN

- Installed the three exact locked English route descriptions without changing route IDs, labels, private tuning metadata, or director behavior.
- Each route remains one native commitment button. Its accessible name is the route label only, while its prose is exposed as the accessible description through linked stable IDs.
- Predictive traits and disclosure copy remain absent.
- Ran `npm run test:run -- tests/content/chronicle1-routes.test.ts tests/game-screens.test.tsx`: 2 files passed, 11 tests passed.

## Changed files

- `src/game/content/chronicle1/routes.ts`
- `src/components/RouteScreen.tsx`
- `tests/content/chronicle1-routes.test.ts`
- `tests/game-screens.test.tsx`

## Commit

`fix: remove route selection spoilers`
