# Task 3 report — companion recruitment and merchant transactions

## Scope

Implemented the requested pure companion and merchant domains. No GameStateV2,
reducer/UI integration, authored Chronicle content, or combat-v2 behavior was
introduced.

## RED / GREEN evidence

1. Initial companion and merchant tests were written before either domain module
   existed. `npm test -- companions.test.ts merchant.test.ts` failed at the
   expected unresolved module imports.
2. The initial brief did not contain the authoritative companion roster, gates,
   tiers, or price bounds, so work paused before commit rather than retaining
   invented values. Once the domain rulings were supplied, the test fixtures
   were replaced with Mara, Rukhar, Caldus, Lyra, and Talla plus their authored
   decision paths and merchant tag gates.
3. The authoritative test run was RED: `npm test -- companions.test.ts
   merchant.test.ts` produced 10 expected behavior failures. These covered
   unreachable authored companion paths, incorrect active-companion behavior,
   incorrect loyalty tiers, unbounded merchant pricing, a five-item stock cap,
   and missing explicit tag gates.
4. Implemented the minimal content-driven contracts and pure transitions. The
   focused GREEN run passed: **2 files, 13 tests**.
5. Added the atomic failure-state regression after GREEN. The isolated merchant
   test was RED because failed trades had no preserved state payload. It passed
   after `executeTrade` began attaching the exact input visit, inventory, and
   gold to every failed transaction diagnostic.
6. After mechanical formatting, the focused suite was rerun: **2 files, 13
   tests passed**.

## Implementation

- `src/game/companions.ts`: a narrow structural
  `CompanionCampaignContext`, generic roster creation from `ContentIndex`,
  -100..100 loyalty, authoritative UI tiers, recruitment evaluation using only
  content requirements and progress state, one active companion selector and
  transition, and combat snapshots from content definitions.
- `src/game/merchant.ts`: deterministic seeded/restock-key stock visits,
  persisted-visit reopening, explicit `min-level:N`, `min-chapter:N`, and
  `min-reputation:N` gates, stock selection without replacement, bounded price
  quotes, and atomic buy/sell results with typed English diagnostics.
- `src/game/content/schema.ts`: minimal companion content additions for blocking
  decisions and content-defined combat values. No actual Chronicle entries were
  authored.
- `tests/companions.test.ts`: required Rukhar non-automatic recruitment, all
  five reachable/non-automatic paths, blocking decisions, the single-active
  invariant, and tier/combat behavior.
- `tests/merchant.test.ts`: persisted reopening/duplicate-purchase prevention,
  bounded buy/sell values, six-entry no-replacement stock, explicit gates, and
  atomic full-pack failure references.

## Final verification

- `npm test -- companions.test.ts merchant.test.ts` — **2 files, 13 tests
  passed**.
- `npm run test:run` — **17 files, 92 tests passed**.
- `npm run build` — passed (`tsc -b` and Vite production build).
- `git diff --check` — passed with no whitespace errors.

## Self-review

- Recruitment is generic: companion identities, required and blocking decisions,
  and combat values live in `ContentIndex`; the domain does not hardcode
  Chronicle companion data.
- The roster starts with `unknown`, quest stage `0`, loyalty `0`, and
  `injured: false`; recruitment enforces stage 3, loyalty 35, all required
  decisions, and left/dead/blocking exclusion.
- Stock is deterministic for the same seed, merchant, and restock key; reopening
  returns an exact persisted visit rather than rerolling it.
- Failed `executeTrade` results retain references to the original visit and
  inventory plus the original gold, ensuring the caller can safely preserve its
  campaign state.

## Concerns

- The full suite emits its pre-existing jsdom `Window.scrollTo()` notices in
  unrelated UI tests. They do not cause failures.
## Fix round 1/5 — recruitment boundary and duplicate sales

### RED / GREEN evidence

1. Added a companion regression that invokes the intended state-changing
   recruitment boundary with an unknown, zero-loyalty Rukhar and no decisions,
   plus an eligible counterpart. Before implementation,
   `npm test -- companions.test.ts merchant.test.ts` failed because
   `recruitCompanion` did not exist; the previous generic effect could recruit
   without any campaign/content evaluation.
2. Added a merchant regression with one Kingbreaker equipped and a second,
   distinct Kingbreaker pack entry. The same RED run failed because the sale was
   rejected solely by matching item IDs.
3. GREEN: removed `recruit` from the generic `CompanionEffect` union and added
   `recruitCompanion(roster, companionId, campaign, content)`. It evaluates the
   supplied roster against the campaign and content before changing status, and
   returns an English `recruitment_ineligible` diagnostic otherwise. Merchant
   sales now operate on the selected pack entry; equipped entries are absent
   from the pack under the InventoryState contract.

### Verification

- `npm test -- companions.test.ts merchant.test.ts` — **2 files, 16 tests
  passed**.
- `npm run build` — passed (`tsc -b` and Vite production build).

### Updated self-review

- Recruitment can no longer be performed via the generic companion effect;
  callers must use the pure campaign/content-aware transition.
- A duplicate item remains sellable when it is a valid pack entry even if a
  different copy is equipped. The earlier duplicate-sale concern is resolved.
