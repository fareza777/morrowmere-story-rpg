# Task 5 — Chronicle I journey director

## Delivered

- Added a modular lazy director at `src/game/director/{types,eligibility,pacing,select}.ts`.
- Exposed `selectNextScene` and `chooseRouteOptions` through the compatibility facade while retaining the legacy eager-route helpers for existing callers.
- Added persisted director state for exact RNG continuation, current-run uniqueness, seen history, family cooldowns, tension, threat, and required callbacks.
- Enforced selection priority: due/overdue required callback, due main anchor, threat encounter, then paced eligible event.
- Reserved required callback targets before their deadline, kept future anchors out of the random pool, and applied profile-dependent risk, merchant, and recovery weighting.
- Added director callback/pacing tests, including deterministic enumeration of 1,000 fixture routes for anchors, callbacks, uniqueness, and support-drought invariants.

## TDD evidence

- RED: `npm run test:run -- tests/director-callbacks.test.ts tests/director-pacing.test.ts` initially failed all 8 tests because the new public API did not exist.
- RED: the first 1,000-route pacing run found a six-scene support drought; the expanded route fixture then found a five-scene drought around fixed priorities; the callback-reservation test failed by selecting `reserved-callback` early.
- GREEN: focused director tests pass after the modular implementation, pacing reservation, due-anchor isolation, and callback reservation.

## Final verification

Run immediately before commit:

- `npm run test:run -- tests/content-schema.test.ts tests/director-callbacks.test.ts tests/director-pacing.test.ts tests/director.test.ts`
- `npm run build`
- `npm run test:run`
- `git diff --check`
