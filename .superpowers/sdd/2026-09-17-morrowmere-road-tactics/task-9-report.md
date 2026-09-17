# Follow-up Task 9 report — combat, reward, and legacy fixtures

## Scope

- Updated only `tests/ad-reward.test.ts`, `tests/authored-combat-routing.test.ts`, `tests/chapter-transitions.test.ts`, and `tests/narrative-choice-resolution.test.ts`.
- Preserved unrelated user-dirty source, test, and visual-smoke files.

## Repair

- Stale helpers now follow `start-expedition` → `travel` → real `travel-action` (`press-on`) → `story` before they select or resolve an authored scene.
- Reward claims and combat exits assert the current `travel` continuation state, including the preserved resolution receipt.
- Chapter-terminal fixtures use a selectable anchor, continue the resolved scene to travel, and perform the next real travel action that completes the chapter.
- The checked combat branch now asserts its current immediate combat handoff and continues to cover save encoding, flee cleanup, reward cleanup, authored follow-up queuing, and all existing checked-roll, inventory, and reward outcomes.

## Red/green evidence

Red command:

```text
npx vitest run --pool=threads tests/ad-reward.test.ts tests/authored-combat-routing.test.ts tests/chapter-transitions.test.ts tests/narrative-choice-resolution.test.ts
```

Initial result: 4 failed files, 16 failed tests. Every failure was caused by attempting to select or resolve a scene while the real flow was `travel`.

Green command:

```text
npx vitest run --pool=threads tests/ad-reward.test.ts tests/authored-combat-routing.test.ts tests/chapter-transitions.test.ts tests/narrative-choice-resolution.test.ts
```

Final result: 4 passed files, 16 passed tests.
