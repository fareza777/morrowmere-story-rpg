# MORROWMERE Living Encounters Implementation Plan

> **Execution:** Use subagent-driven development after this plan is accepted. Every production change follows a focused RED → GREEN cycle. Run only the focused tests named in each task, then one combined release check at the end.

**Goal:** Turn the existing 332-scene Chronicle I campaign into a connected text-RPG with working authored battles, real probability-based stat checks, choice-specific follow-ups, cinematic dialogue, tangible rewards, accurate art, and save-compatible procedural replay.

**Architecture:** Extend the immutable content schema with checked branch outcomes and dialogue beats. Keep deterministic resolution, queued narrative work, and combat activation in pure domain modules. Persist only IDs and results in a versioned runtime state. Let React display precomputed outcomes, never roll or choose story state itself. Upgrade Chapter 1 as the reference implementation, then apply the same contracts to Chapters 2–8 without replacing the existing main plot.

**Stack:** React 19, TypeScript 7, Vite 8, Vitest 4, Capacitor 8, Android Gradle, local WebP/audio assets.

**Design reference:** `docs/superpowers/specs/2026-09-01-morrowmere-living-encounters-design.md`

---

## Task 1: Restore all authored combat scenes

**Files:**

- Modify: `src/game/state/reducer.ts`
- Test: `tests/authored-combat-routing.test.ts`

**Step 1 — Write the failing real-content test**

Create a campaign and expedition, place it on `ch01-combat-arrows-at-the-cut-bank`, resolve one of that scene's setup choices, and assert:

- `flow.screen === 'combat'`;
- `expedition.currentCombat?.encounterId` equals the scene's `encounterId`;
- the setup choice effects are already present before combat begins.

Add a catalog loop asserting the same transition for every Chronicle scene with `type === 'combat'` and `encounterId`.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/authored-combat-routing.test.ts`

Expected: failure because resolving a combat-scene choice leaves the screen on story.

**Step 3 — Implement the metadata bridge**

After applying a choice's effects in `resolve-choice`, start `scene.encounterId` when:

- no direct combat effect already started another encounter;
- `scene.type === 'combat'`;
- the scene has a valid `encounterId`.

Keep direct choice combat effects authoritative for special branches.

**Step 4 — Run GREEN**

Run: `npm run test:run -- tests/authored-combat-routing.test.ts tests/core-integration.test.ts`

Expected: all focused tests pass.

**Step 5 — Commit**

Commit: `fix: activate authored chronicle battles`

## Task 2: Define deterministic stat checks and branch contracts

**Files:**

- Modify: `src/game/content/schema.ts`
- Add: `src/game/checks.ts`
- Test: `tests/check-resolution.test.ts`
- Modify: `tests/content-schema.test.ts`

**Step 1 — Write failing check-domain tests**

Cover:

- `55 + (stat - difficulty) * 10`, clamped to 15–95;
- positive and negative bounded modifiers;
- identical seed + scene + visit + choice produces the same roll;
- different choice or visit changes the deterministic stream;
- rolls 1–5 classify as critical success only when successful;
- rolls 96–100 classify as critical failure only when failed.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/check-resolution.test.ts tests/content-schema.test.ts`

Expected: imports and new schema assertions fail because the contract does not exist.

**Step 3 — Add schema types**

Add `ChronicleStat`, `ChronicleCheckModifier`, `ChronicleChoiceBranch`, and `ChronicleChoiceCheck`. A branch owns outcome text, effects, optional next scene, optional combat encounter, and optional contextual CTA. A choice can have either the current direct outcome/effects shape or a checked branch contract.

**Step 4 — Implement the pure resolver**

Export functions for chance calculation, deterministic roll seed construction, and result classification. Accept fully derived effective stat and modifier values so the module is independent of React and catalogs.

**Step 5 — Run GREEN**

Run: `npm run test:run -- tests/check-resolution.test.ts tests/content-schema.test.ts`

Expected: all focused tests pass.

**Step 6 — Commit**

Commit: `feat: add deterministic narrative checks`

## Task 3: Resolve checks, XP, items, and branches in game state

**Files:**

- Modify: `src/game/state/types.ts`
- Modify: `src/game/state/effects.ts`
- Modify: `src/game/state/reducer.ts`
- Modify: `src/game/progression.ts`
- Test: `tests/narrative-choice-resolution.test.ts`

**Step 1 — Write failing reducer tests**

Use small synthetic events to assert:

- the selected branch is deterministic;
- success and failure apply different effects;
- a checked choice can start different combat only on failure;
- a checked choice can grant noncombat XP;
- item rewards enter unbanked loot or the pack according to the authored effect;
- the stored scene resolution contains result kind, chance, roll, effect summary, and CTA;
- resolving the same event twice cannot reroll or double-grant rewards.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/narrative-choice-resolution.test.ts`

Expected: type/runtime failures because the richer resolution and XP effect do not exist.

**Step 3 — Extend atomic effects**

Add an XP effect and a safe narrative item-reward path. Reuse progression and inventory invariants; do not mutate catalog data or bypass pack capacity.

**Step 4 — Extend `SceneResolution`**

Store `resultKind`, `chance`, `roll`, `outcome`, `effectSummary`, `nextSceneId`, and `continueLabel`. Direct choices store `resultKind: 'direct'` with null chance/roll.

**Step 5 — Resolve checks in the reducer**

Derive Strength/Cunning/Will from hero class, level, talents, equipment tags, active companion, vitals, and authored modifiers. Resolve one branch, apply it once, queue its next scene, and start its branch combat when supplied.

**Step 6 — Run GREEN**

Run: `npm run test:run -- tests/narrative-choice-resolution.test.ts tests/progression.test.ts tests/inventory.test.ts`

Expected: all focused tests pass.

**Step 7 — Commit**

Commit: `feat: make narrative choices change the expedition`

## Task 4: Add authored scene queue and connected follow-ups

**Files:**

- Modify: `src/game/state/types.ts`
- Modify: `src/game/director/types.ts`
- Modify: `src/game/director/select.ts`
- Modify: `src/game/state/reducer.ts`
- Test: `tests/director-authored-followups.test.ts`

**Step 1 — Write failing sequence tests**

Assert:

- a choice-specific next scene is selected before random eligible content;
- a scene-level follow-up with satisfied requirements is selected in declared order;
- ineligible optional follow-ups are skipped without dead-ending;
- required invalid follow-ups create a diagnostic and fall back to the next valid anchor;
- combat victory and reward claim return to the queued aftermath;
- no flow emits `No eligible Chronicle scene` for the Chapter 1 route fixture.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/director-authored-followups.test.ts`

Expected: failures because follow-ups are not consumed.

**Step 3 — Add queue state**

Persist an ordered `authoredSceneQueue` in the expedition. Queue entries include scene ID, source scene ID, requirement mode, and optional reason for diagnostics.

**Step 4 — Consume queue before random selection**

On `select-next-scene`, choose the first valid queued scene, then callbacks, then ordered anchors, then procedural candidates. Remove invalid optional queue entries. Never advance the slot past a required anchor while it remains unresolved.

**Step 5 — Queue authored aftermaths**

Use checked branch `nextSceneId`, direct choice branch targets, and declared `followUps`. Preserve the queue while combat and rewards are active.

**Step 6 — Run GREEN**

Run: `npm run test:run -- tests/director-authored-followups.test.ts tests/director-travel-flow.test.ts tests/director-callbacks.test.ts`

Expected: all focused tests pass.

**Step 7 — Commit**

Commit: `feat: connect authored encounter followups`

## Task 5: Migrate existing saves without losing progress

**Files:**

- Modify: `src/game/state/types.ts`
- Modify: `src/game/persistence/schema.ts`
- Modify: `src/game/persistence/codec.ts`
- Modify: `src/game/persistence/migrate.ts`
- Modify: `src/game/state/create.ts`
- Test: `tests/migration-v2-living-encounters.test.ts`
- Modify: `tests/persistence.test.ts`

**Step 1 — Write failing v2 migration tests**

Load a valid v2 save fixture and assert the migrated state preserves hero, chapter, position, inventory, equipment, gold, companions, flags, evidence, combat, and rewards while defaulting the authored queue and check records safely.

Also assert a migrated resolved scene cannot duplicate old rewards and an invalid queued scene is removed on decode.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/migration-v2-living-encounters.test.ts tests/persistence.test.ts`

Expected: failure because the current envelope has no new runtime fields/version.

**Step 3 — Introduce schema version 3**

Encode the richer expedition state as v3. Keep v2 validation for migration input. Convert v2 scene resolutions to safe direct resolutions and initialize an empty queue/check ledger.

**Step 4 — Sanitize content references**

During decode/migration, remove only queue entries whose scene IDs no longer exist. Preserve all valid state and return a recoverable diagnostic rather than rejecting the whole save.

**Step 5 — Run GREEN**

Run: `npm run test:run -- tests/migration-v2-living-encounters.test.ts tests/persistence.test.ts tests/persistence-recovery.test.ts`

Expected: all focused tests pass.

**Step 6 — Commit**

Commit: `feat: migrate saves for living encounters`

## Task 6: Show checks, consequences, and contextual progression

**Files:**

- Modify: `src/ui/selectors.ts`
- Modify: `src/components/ChoiceList.tsx`
- Modify: `src/components/StoryPanel.tsx`
- Modify: `src/components/GameShell.tsx`
- Modify: `src/styles/game.css`
- Test: `tests/living-choice-interface.test.tsx`

**Step 1 — Write failing UI tests**

Assert:

- check choices show stat, difficulty wording, and success percentage before selection;
- future rewards, fights, companions, and hidden scenes are not spoiled;
- result displays success/failure, concise state deltas, and branch outcome;
- contextual CTA comes from the resolution;
- text uses justified narrative layout without stretching short dialogue lines;
- buttons remain readable at 360×800 and 200% text scale.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/living-choice-interface.test.tsx`

Expected: component assertions fail because the current UI knows only generic outcomes.

**Step 3 — Add selector models**

Expose a display-only check percentage and effect summaries. Keep hidden branch details out of the pre-choice view model.

**Step 4 — Render outcome feedback**

Add result status, effect chips, and contextual CTA. Use semantic headings and live-region announcements for check and reward feedback.

**Step 5 — Run GREEN**

Run: `npm run test:run -- tests/living-choice-interface.test.tsx tests/accessibility.test.tsx tests/event-art-ui.test.tsx`

Expected: all focused tests pass.

**Step 6 — Commit**

Commit: `feat: show meaningful narrative outcomes`

## Task 7: Add cinematic dialogue data and UI

**Files:**

- Modify: `src/game/content/schema.ts`
- Modify: `src/game/state/types.ts`
- Modify: `src/game/state/reducer.ts`
- Add: `src/components/DialoguePanel.tsx`
- Modify: `src/components/StoryPanel.tsx`
- Modify: `src/components/GameShell.tsx`
- Modify: `src/components/SceneArt.tsx`
- Add: `src/styles/dialogue.css`
- Modify: `src/main.tsx`
- Test: `tests/dialogue-interface.test.tsx`
- Test: `tests/dialogue-state.test.ts`

**Step 1 — Write failing dialogue tests**

Cover:

- ordered beats with speaker and one-to-three-sentence text;
- advancing a beat never resolves the choice or changes campaign effects;
- leaving and loading restores the exact beat;
- final beat reveals player responses;
- reduced motion avoids character entrance animation;
- unrecruited companions do not render as active party members;
- a voiced milestone exposes tap-to-reveal skip, while ordinary dialogue does not.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/dialogue-state.test.ts tests/dialogue-interface.test.tsx`

Expected: missing schema, state command, and component failures.

**Step 3 — Add dialogue schema and state**

Add dialogue beats with speaker ID/name, text, optional portrait/full-body layer, expression, voice cue, and environment illustration. Store `dialogueBeatIndex` in the expedition and add `advance-dialogue`.

**Step 4 — Build the dialogue panel**

Render environment art, optional character layer, speaker plate, beat text, and final response choices. Preserve the current large scene-art treatment and readable safe-area layout.

**Step 5 — Run GREEN**

Run: `npm run test:run -- tests/dialogue-state.test.ts tests/dialogue-interface.test.tsx tests/accessibility.test.tsx`

Expected: all focused tests pass.

**Step 6 — Commit**

Commit: `feat: add cinematic story dialogue`

## Task 8: Strengthen content validation

**Files:**

- Modify: `src/game/content/validate.ts`
- Modify: `tests/content/chronicle1-validation.test.ts`
- Modify: `tests/content/chronicle1-effects.test.ts`
- Add: `tests/content/chronicle1-playability.test.ts`

**Step 1 — Write failing validator cases**

Reject catalogs containing:

- combat scene with missing/unknown encounter;
- checked choice missing success or failure branch;
- dangling next-scene ID;
- follow-up cycle with no exit;
- dialogue beat without speaker/text;
- choice with no tangible effect, branch, battle, relationship change, or follow-up;
- route copy containing spoiler phrases from hidden encounter metadata;
- active companion art metadata for an unavailable character.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/content/chronicle1-playability.test.ts tests/content/chronicle1-validation.test.ts`

Expected: invalid fixtures are currently accepted.

**Step 3 — Implement validation and graph checks**

Validate every reference and traverse mandatory/required follow-up edges. Report scene and choice IDs in each error.

**Step 4 — Run GREEN**

Run: `npm run test:run -- tests/content/chronicle1-playability.test.ts tests/content/chronicle1-validation.test.ts tests/content/chronicle1-effects.test.ts`

Expected: all focused tests pass.

**Step 5 — Commit**

Commit: `test: enforce playable chronicle content`

## Task 9: Rewrite route choice copy without spoilers

**Files:**

- Modify: `src/game/content/chronicle1/routes.ts`
- Modify: `src/components/RouteScreen.tsx`
- Modify: `tests/content/chronicle1-routes.test.ts`
- Modify: `tests/game-screens.test.tsx`

**Step 1 — Write failing copy tests**

Assert each route has a short in-world description of terrain, history, and travel character, while the UI omits future merchant frequency, companion events, relic finds, recovery frequency, and explicit danger tiers.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/content/chronicle1-routes.test.ts tests/game-screens.test.tsx`

Expected: current route trait chips reveal encounter composition.

**Step 3 — Rewrite and simplify**

Replace spoiler chips with atmospheric but concrete route copy and one neutral commitment label such as `Take the King's Road`.

**Step 4 — Run GREEN**

Run the same focused command and confirm it passes.

**Step 5 — Commit**

Commit: `fix: remove route selection spoilers`

## Task 10: Author Chapter 1 connected living encounter packets

**Files:**

- Add: `src/game/content/chronicle1/chapters/ch01/living-departure.ts`
- Add: `src/game/content/chronicle1/chapters/ch01/living-mara.ts`
- Add: `src/game/content/chronicle1/chapters/ch01/living-tollhouse.ts`
- Add: `src/game/content/chronicle1/chapters/ch01/living-ambush.ts`
- Add: `src/game/content/chronicle1/chapters/ch01/living-bridge.ts`
- Add: `src/game/content/chronicle1/chapters/ch01/living-last-miles.ts`
- Add: `src/game/content/chronicle1/chapters/ch01/living-sorcery.ts`
- Modify: `src/game/content/chronicle1/chapters/ch01/index.ts`
- Modify: selected anchors in `src/game/content/chronicle1/chapters/ch01/main.ts`
- Modify: selected scenes in `src/game/content/chronicle1/chapters/ch01/companion.ts`
- Test: `tests/content/ch01-living-encounters.test.ts`
- Test: `tests/ch01-playthroughs.test.ts`

**Step 1 — Write failing content-count and graph tests**

Require 54 new scenes organized as 18 three-scene packets. Require:

- at least 18 real checks: six Strength, six Cunning, six Will;
- at least 12 battle branches, six of them avoidable;
- at least nine noncombat XP rewards;
- at least nine item or material rewards, including three encounter-specific rare items;
- at least four Mara trust reactions;
- at least six choice-specific follow-ups;
- at least three rare packet entry conditions;
- every packet has a setup, consequence, and exit to the ordered story.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/content/ch01-living-encounters.test.ts tests/ch01-playthroughs.test.ts`

Expected: required IDs and counts are absent.

**Step 3 — Author six departure/Mara packets**

Create:

1. The Bent Axle — repair, redistribute, or buy a fitting;
2. Hooves in the Chalk — calm, inspect, or force the horses onward;
3. The Cut Milestone — cinematic Mara introduction and trust response;
4. Birch Marks — accept, verify, or shadow Mara's path;
5. The Snared Scout — help a trapped Greywatch scout, preserve time, or investigate the trap;
6. Smoke Beyond the Verge — warn travelers, scout alone, or protect the convoy.

Each packet has distinct success/failure text and a connected exit.

**Step 4 — Author six tollhouse/ambush/bridge/last-mile packets**

Create:

7. The Bell Wire — disarm, break in, or lure the watcher;
8. Below the Toll Desk — evidence, trapped cache, and optional cellar fight;
9. The Split-Fletched Arrow — prepare the ambush battle through terrain choices;
10. The Miller's Cart — rescue objective that changes the burning bridge;
11. Ash on the Officer's Cuff — test the staged evidence through three stats;
12. Riders in the Valley — hide, bargain for time, or fight a pursuit encounter before Greywatch.

**Step 5 — Author six rare sword-and-sorcery packets**

Create:

13. The Warning Tree — investigate an ominously hanged goblin, cut it down, or prepare for whoever left it;
14. The Armor That Knelt — test, open, evade, or fight an occupied suit of battlefield armor;
15. The War Camp's Last Fire — cross the abandoned edge of a goblin war camp and decide what to do with a wounded survivor and stolen goods;
16. The Sword in Barrow Clay — leave, safely unbind, or take a valuable blade with a practical curse;
17. The Ward Beneath the Shrine — repair or break a failing ward before the trapped creature escapes;
18. Teeth Under the Siege Cart — distract, trap, bargain past, or fight a monster for encounter-specific loot.

Keep each packet concrete and readable. The unusual element is visible and actionable, its art composition is unique, and every resolution has a specific aftermath instead of returning directly to random travel.

**Step 6 — Connect existing anchors**

Queue packets from the seven Chapter 1 anchors and return each packet to the correct next phase. Preserve existing journey scenes as optional procedural content, but add tangible effects or contextual CTAs where a selected scene was previously flag-only.

**Step 7 — Run GREEN**

Run: `npm run test:run -- tests/content/ch01-living-encounters.test.ts tests/ch01-playthroughs.test.ts tests/director-travel-flow.test.ts`

Expected: all focused tests pass, including three seeded start-to-gate routes.

**Step 8 — Commit**

Commit: `feat: bring the Greywatch Road to life`

## Task 11: Convert Mara's Chapter 1 scenes to cinematic dialogue

**Files:**

- Modify: `src/game/content/chronicle1/chapters/ch01/companion.ts`
- Modify: `src/game/content/chronicle1/chapters/ch01/living-mara.ts`
- Modify: `src/game/content/chronicle1/chapters/ch01/living-bridge.ts`
- Test: `tests/content/ch01-mara-dialogue.test.ts`

**Step 1 — Write failing narrative tests**

Require Mara's milestone scenes to contain:

- an environmental establishing beat;
- Mara introducing one concrete observation;
- at least one optional player question;
- a response choice that changes trust or a later flag;
- later lines that vary for trusted, doubted, helped, or abandoned states;
- no recruitment instructions or future-event spoilers.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/content/ch01-mara-dialogue.test.ts`

Expected: current prose-only Mara scenes fail the dialogue contract.

**Step 3 — Author the conversations**

Convert `Mara Measures the Road`, the bridge reaction, and the Greywatch approach into short alternating dialogue. Add injured-scout and road-warning callbacks. Keep her direct, observant, and grounded; do not turn her into an exposition narrator.

**Step 4 — Run GREEN**

Run the same focused test plus `tests/dialogue-state.test.ts`.

**Step 5 — Commit**

Commit: `feat: give Mara a connected dialogue arc`

## Task 12: Apply playable branches to Chapters 2–8

**Files:**

- Modify: `src/game/content/chronicle1/chapters/ch02/*.ts`
- Modify: `src/game/content/chronicle1/chapters/ch03/*.ts`
- Modify: `src/game/content/chronicle1/chapters/ch04/*.ts`
- Modify: `src/game/content/chronicle1/chapters/ch05/*.ts`
- Modify: `src/game/content/chronicle1/chapters/ch06/*.ts`
- Modify: `src/game/content/chronicle1/chapters/ch07/*.ts`
- Modify: `src/game/content/chronicle1/chapters/ch08/*.ts`
- Test: `tests/content/chronicle1-playability.test.ts`
- Test: `tests/chronicle-seeded-playthroughs.test.ts`

**Step 1 — Extend the failing playability thresholds**

For each chapter require:

- all combat scenes activate;
- at least six checked choices across at least two stats;
- at least four direct item/gold/XP consequences;
- at least four choice-specific or required follow-ups;
- at least two companion dialogue milestones where the chapter includes that companion;
- no three consecutive resolved scenes with only a generic CTA;
- every seeded route reaches the next chapter or an authored ending.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/content/chronicle1-playability.test.ts tests/chronicle-seeded-playthroughs.test.ts`

Expected: Chapters 2–8 fail the new interaction thresholds.

**Step 3 — Upgrade one chapter batch at a time**

For each chapter:

1. convert six to ten existing choices into real checks;
2. attach battles to combat setups and failure branches;
3. add immediate XP/item/gold/vitals consequences;
4. connect four or more current scenes using authored follow-ups;
5. convert two major companion meetings into dialogue beats;
6. add explicit aftermath copy that references the chosen action;
7. run that chapter's existing content test plus the playability test before moving on.

**Step 4 — Run GREEN**

Run: `npm run test:run -- tests/content/chronicle1-playability.test.ts tests/chronicle-seeded-playthroughs.test.ts tests/content/chronicle1-ch01-ch02.test.ts tests/content/chronicle1-ch03-ch04.test.ts tests/content/chronicle1-ch05-ch06.test.ts tests/content/chronicle1-ch07-ch08.test.ts`

Expected: all focused catalog and seeded-route tests pass.

**Step 5 — Commit by chapter pair**

Commits:

- `feat: deepen Greywatch and Redwater choices`
- `feat: deepen Ashes and Hollow Crown choices`
- `feat: deepen siege and final road choices`
- `feat: connect the Black Banner finale`

## Task 13: Produce accurate event and dialogue art

**Files:**

- Add/Modify: `scripts/media/prompts/living-encounters.json`
- Modify: `src/game/content/chronicle1/media-contract.ts`
- Add: `public/assets/scenes/living/*.webp`
- Add: `public/assets/characters/*.webp`
- Modify: `tests/scene-art-semantic.test.ts`
- Modify: `scripts/media/validate-scene-art.mjs`

**Step 1 — Write failing manifest tests**

Require one unique scene composition for every new scene and canonical character layers for Mara, Talla, Rukhar, Caldus, and Lyra. Validate dimensions, format, duplicate hashes, scene IDs, declared present characters, party size, brightness range, and forbidden prompt tokens for grain, dots, scan lines, text, and watermark.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/scene-art-semantic.test.ts`

Expected: new illustration IDs have no mappings or files.

**Step 3 — Build accurate prompt records**

For each new scene record the exact location, time, weather, action, named characters, recruitment state, injuries, equipment, camera distance, lighting, UI safe area, and negative constraints. Use the existing Morrowmere visual references.

**Step 4 — Generate and optimize in reviewable batches**

Generate Chapter 1 living scenes first, then dialogue character variants, then Chapters 2–8 replacements whose current art conflicts with narration. Inspect the contact sheet after each batch. Regenerate inaccurate or artifacted images. Convert accepted images to high-quality WebP while preserving readable brightness.

**Step 5 — Run GREEN**

Run: `npm run art:validate`

Expected: all scene IDs resolve, hashes are unique, semantic metadata agrees, and size budgets pass.

**Step 6 — Commit by media batch**

Commits:

- `art: add Greywatch Road living encounters`
- `art: add consistent companion dialogue portraits`
- `art: align chronicle scenes with narrative state`

## Task 14: Add encounter audio and haptic feedback

**Files:**

- Modify: `src/game/audio/catalog.ts`
- Modify: `src/game/audio/service.ts`
- Modify: `src/components/GameShell.tsx`
- Modify: `src/components/cinematic/OpeningCinematic.tsx`
- Modify: `src/components/cinematic/useCinematicPlayer.ts`
- Modify: `scripts/media/generate-elevenlabs-voice.mjs`
- Add: `scripts/media/cue-sheets/opening.json`
- Add/Modify: `public/assets/audio/sfx/*`
- Add/Modify: `public/assets/audio/music/*`
- Add/Modify: `public/assets/audio/voice/opening/*`
- Add/Modify: `public/assets/audio/voice/main/*`
- Add/Modify: `public/assets/audio/voice/rare/*`
- Modify: `docs/AUDIO-CREDITS.md`
- Modify: `tests/feedback.test.ts`
- Modify: `tests/haptics.test.ts`
- Modify: `tests/media/audio.test.ts`

**Step 1 — Write failing cue tests**

Assert distinct cues for normal/critical check success, failure, ambush, battle start, hit, miss, critical, block, item reward, companion approval, and companion disapproval. Assert settings independently gate music, SFX, narration, and haptics. Require voice mappings for every opening panel, all main-story anchors, and all 54 Chapter 1 rare-encounter scenes. Validate that the opening cue sheet aligns narration and image intervals, ducks music during speech, and never overlaps a nonessential high-impact SFX with narration.

**Step 2 — Run RED**

Run: `npm run test:run -- tests/feedback.test.ts tests/haptics.test.ts tests/media/audio.test.ts`

Expected: the new cue IDs and transitions are missing.

**Step 3 — Integrate licensed/original clean assets**

Use cohesive medieval acoustic textures, avoid abrupt cinematic music edits, and normalize perceived loudness. Replace the current odd/contextless opening cues with restrained natural ambience and story-motivated impacts. Record source/license in `docs/AUDIO-CREDITS.md`. No secret or provider API key enters source control.

Generate final English voice through the existing ElevenLabs production script using only `ELEVENLABS_API_KEY` from the local process environment. Select one grounded adult narrator suitable for medieval adventure and stable character voices only where dialogue requires them. The script must redact provider errors, never echo credentials, and skip network generation with a clear diagnostic when the environment secret is absent.

**Step 4 — Trigger feedback from domain events**

Map check result, dialogue response, combat result, reward, and companion relationship events to sound and haptics. Keep service calls outside the pure reducer. Drive the opening's image transitions, narration playback, music ducking, ambience, and permitted SFX from `scripts/media/cue-sheets/opening.json` rather than independent timers.

**Step 5 — Run GREEN**

Run: `npm run audio:validate && npm run test:run -- tests/feedback.test.ts tests/haptics.test.ts`

Expected: all focused checks pass.

**Step 6 — Commit**

Commit: `feat: add expressive encounter feedback`

## Task 15: Release acceptance, Android build, and delivery

**Files:**

- Modify: `package.json`
- Modify: `android/app/build.gradle`
- Modify: `release/README.md`
- Add: `release/MORROWMERE-v1.4.0-debug.apk`

**Step 1 — Run the focused acceptance set**

Run:

`npm run test:run -- tests/authored-combat-routing.test.ts tests/check-resolution.test.ts tests/narrative-choice-resolution.test.ts tests/director-authored-followups.test.ts tests/living-choice-interface.test.tsx tests/dialogue-state.test.ts tests/dialogue-interface.test.tsx tests/content/ch01-living-encounters.test.ts tests/ch01-playthroughs.test.ts tests/content/chronicle1-playability.test.ts tests/chronicle-seeded-playthroughs.test.ts tests/migration-v2-living-encounters.test.ts`

Expected: pass.

**Step 2 — Validate media and content**

Run: `npm run content:validate && npm run art:validate && npm run audio:validate`

Expected: pass with no missing/duplicate assets or dangling story references.

**Step 3 — Build once for Android**

Bump app version to `1.4.0`, Android version code to `8`, then run: `npm run android:sync` followed by `android\gradlew.bat assembleDebug` from the project root using the existing Gradle configuration.

Expected: a successful debug APK build.

**Step 4 — Inspect output and package size**

Copy the APK to `release/MORROWMERE-v1.4.0-debug.apk`, calculate SHA-256, run the existing Android size check where applicable, and update `release/README.md` with version, byte size, checksum, and major changes.

**Step 5 — Commit and push**

Review `git status --short` and `git diff --check`, commit with `release: ship Morrowmere 1.4.0 living encounters`, then push the completed commit to `origin/main` as requested.

**Step 6 — Handoff**

Report the APK absolute path, size, checksum, commit hash, push status, restored battle count, new scene/art count, checked-choice count, and focused verification performed.
