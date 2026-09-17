# Morrowmere — Road Tactics Design

**Date:** 2026-09-17  
**Status:** Draft for user approval  
**Approved direction:** Option 2 — Road Tactics  
**Scope:** Chronicle I runtime loop, new authored road encounters, media, persistence, tests, and release hygiene

## 1. Problem and outcome

The current expedition often behaves like a chain of authored pages: the player reads an event, resolves a choice, and waits for the next event. Combat exists, but the journey between scenes does not give the player a meaningful tactical decision. The result is closer to a branching novella than a game loop.

This change adds a deliberate decision point before every next scene. The player chooses how the convoy travels, and that choice changes the immediate risk, recovery, companion value, and the director's next-scene bias. The player should feel that they are managing a dangerous road, not only consuming dialogue.

The completed feature must satisfy these player outcomes:

1. After choosing a route, the player sees a Road Tactics screen before the first event.
2. After resolving a story event or claiming battle rewards, the player returns to Road Tactics instead of being auto-delivered to another event.
3. Each action has a visible cost or trade-off and produces a deterministic, inspectable consequence.
4. Companions matter outside combat through a unique road action.
5. New road encounters have finished artwork and meaningful choices; there is no new text-only screen.
6. Existing saves, authored combat, route progression, and camp banking remain recoverable.

## 2. Architectural decisions

### 2.1 Canonical runtime

The modern Chronicle I `ContentIndex` and schema-version-3 runtime remain canonical. The legacy procedural event catalog remains only as a compatibility facade for older callers and tests; it is not expanded with a second copy of the new road content.

The uncommitted road-event ideas currently present in the legacy catalog are treated as source material. They will be ported into modern Chronicle I authored scenes, so the ideas are preserved in the live game while duplicate legacy IDs, stale artwork contracts, and two competing content systems are avoided.

The existing user changes are retained and integrated:

- the `Dialogue x/y` presentation in `DialoguePanel`;
- the authored combat effects in `living-departure.ts`;
- the narrative/event concepts already added to the working tree.

### 2.2 A dedicated travel phase

Add `travel` to `FlowState.screen`. Travel is a stable state, not a visual alias for story. It is entered when:

- an expedition starts;
- a story scene is fully resolved and its continuation is requested;
- a battle reward is claimed;
- a battle is fled and the expedition continues.

The current scene is cleared before entering travel. The next event is selected only after a travel action. This removes the current `GameShell` auto-select behavior for an empty story scene.

The existing `temporaryBoons` field is reused for one-shot road modifiers. Boons are persisted in saves, namespaced as `road:*`, and consumed atomically when the next scene is selected. The expedition also persists a nullable `lastTravelAction` receipt so the travel screen can report the latest choice without inferring it from an unconsumed boon. No unbounded or random client-only state is introduced.

### 2.3 One action per road leg

Each trip from Road Tactics to the next scene is one road leg. There is no second free road action before the same scene. This makes recovery choices meaningful and prevents an infinite healing loop.

The action is resolved in the reducer, then the existing deterministic director selects exactly one next scene. The same campaign seed and the same action sequence must reproduce the same result.

## 3. Player flow

```text
Camp
  -> Route selection
  -> Road Tactics
       -> Scout / Press On / Make Camp / Companion Move
       -> Director selects one authored scene
  -> Dialogue / choices / authored combat
  -> Reward (if battle victory)
  -> Road Tactics
  -> Hub scene can bank the expedition and return to Camp
```

### 3.1 Road Tactics screen

The screen contains:

- route name and current chapter;
- a leg indicator using the persisted story position;
- health and class-specific resource with the same labels used by the HUD (`Stamina`, `Mana`, or `Focus`);
- threat and tension meters with short plain-language explanations;
- active companion and its road capability;
- four action cards, each with a new illustration, label, cost, risk, and effect preview;
- a compact “last road choice” receipt after returning from a scene, so the player can see what their previous decision changed.

The action cards are keyboard reachable, have visible disabled reasons, and do not rely on color alone. The screen must work at the existing 360px mobile viewport without horizontal overflow.

### 3.2 Actions and exact first-pass tuning

All numeric changes are clamped to the existing hero maxima and director bounds.

| Action | Cost | Immediate effect | Next-scene bias |
| --- | --- | --- | --- |
| Scout | 1 class resource | Threat -2; add `road:scouted` | Investigation, quiet, and recovery candidates gain weight; danger candidates lose weight |
| Press On | none | Threat +1; tension +1; add `road:pressed` | Danger and combat candidates gain weight; recovery candidates lose weight |
| Make Camp | none | Health +6; resource +2; tension +1; add `road:rested` | Recovery and merchant candidates gain weight; repeated quiet-family selection is still prevented by the director |
| Companion Move | companion-specific | Uses the active companion's exploration capability | Adds the companion's matching bias/boon and may modify threat, tension, or vitals |

The current resource is intentionally class-specific in presentation but shared in the state as `heroVitals.resource`. Scout is unavailable when resource is 0. Make Camp can never exceed maximum vitals, and it remains a tactical trade-off because it advances the road and raises tension.

Companion road moves use the existing content definitions instead of creating a second companion system:

| Companion | Road move | Effect |
| --- | --- | --- |
| Mara | Read the road | Threat -2; add `road:scouted`; bias investigation |
| Rukhar | Read the warband | Threat -1; tension -1; add `road:guarded`; bias danger scenes toward information-bearing outcomes |
| Caldus | Triage the convoy | Health +8; resource +1; bias recovery |
| Lyra | Authenticate the route | Threat -1; add `road:proof`; bias evidence/investigation |
| Talla | Find the hidden way | Threat -1; tension -1; add `road:hidden`; bias quiet and hidden-route scenes |

If no companion is active, the fourth card is shown as a useful disabled slot with the explanation “Recruit and activate a companion at camp.”

## 4. Runtime and state changes

### 4.1 Commands

Add this command to `GameCommand`:

```ts
type TravelAction = 'scout' | 'press-on' | 'make-camp' | 'companion';

{ readonly type: 'travel-action'; readonly action: TravelAction; readonly updatedAt: string }
```

The reducer derives the companion from `campaign.companions.activeCompanionId`; the UI cannot submit an arbitrary companion ID. This prevents activating one companion in the UI and resolving another in the reducer.

The existing `select-next-scene` command remains useful for completing a resolved scene, but its resolved-scene branch now enters travel. The command must not silently select a new scene. Story auto-selection in `GameShell` is removed for the new travel state.

### 4.2 Director context

Extend `JourneyDirectorContext` with a small read-only road-bias input derived from the action, rather than making the director read React/UI state. The director applies the bias only to the current selection and returns the selected event plus the consumed boon list.

The selection order stays intact:

1. required authored queue;
2. required callback;
3. chapter anchor;
4. threat-forced danger;
5. weighted paced candidate with the road bias.

Road Tactics must not bypass required callbacks, anchor chronology, eligibility, exclusions, combat pacing, or chapter completion. If an action would leave no valid candidate, the director falls back to the existing valid route selection and emits a diagnostic rather than dead-ending the expedition.

### 4.3 State invariants

Add invariants to the reducer and persistence checks:

- `flow.screen === 'travel'` requires a non-null expedition, no current combat, no pending reward, no merchant, and `currentSceneId === null`;
- `flow.screen === 'story'` continues to represent an active or resolved current scene;
- `flow.screen === 'merchant'` keeps its existing hub-scene requirement;
- `road:*` boons are strings from the known action/capability set;
- `road:*` boons are consumed when a valid next scene is selected, while `lastTravelAction` remains as the latest travel receipt;
- a travel action can be accepted only while `flow.screen === 'travel'`;
- every accepted travel action produces one `travel_action_taken` domain event and either a scene or a valid terminal transition;
- the existing health/resource, threat, and tension bounds continue to be enforced.

### 4.4 Save compatibility

Schema version 3 is extended to accept `travel` as a flow screen. This is a compatible state-enum addition, not a new envelope version.

Recovery behavior:

- old v2 saves keep their existing migration path;
- old v3 saves with an empty expedition story state (`story` plus no current scene, no combat, no reward) normalize to `travel`;
- old v2 saves receive the same empty-story normalization after their v2-to-v3 migration;
- old saves with a live scene, combat, merchant, or reward keep their current screen;
- invalid or unknown `road:*` boons are dropped with a recovery diagnostic, following the existing authored-queue sanitization pattern;
- strict validation remains strict for malformed inventory and combat records; test fixtures are updated to current DTO shape rather than weakening the validator.

## 5. New authored road content

Create a modern Chronicle content module for 16 one-scene road challenges. Each scene is a real `journey` event with three or more choices, at least one meaningful resource/check trade-off, a direct consequence, and a route/action-sensitive hook. The scenes are distributed across the relevant chapter so the new loop has fresh content throughout the campaign.

The stable IDs and art briefs are:

| Chapter | Scene ID | Title | Art brief |
| --- | --- | --- | --- |
| ch01 | `ch01-road-gloamwood-needle-briar` | Needle Briar | Medicine wagons caught in a wall of black thorn vines under green forest light |
| ch01 | `ch01-road-gloamwood-riverless-altar` | The Riverless Altar | A dry riverbed altar with wet footprints and a hidden water sigil |
| ch01 | `ch01-road-gloamwood-hound-chant` | Hound Chant | Moonlit hounds circling a convoy while unseen voices echo between trees |
| ch01 | `ch01-road-gloamwood-hidden-beggar` | The Beggar Beneath the Root | A masked courier sheltering under colossal roots, watched by distant riders |
| ch02 | `ch02-road-drowned-silent-oars` | Silent Oars | Ghostly oars moving through a flooded road with no boatmen visible |
| ch02 | `ch02-road-drowned-ink-warden` | The Ink Warden | An ink-black armored sentinel standing in rain beside a drowned milestone |
| ch02 | `ch02-road-drowned-watchtower-debt` | Watchtower Debt | A broken watchtower, hanging ledger pages, and a convoy deciding who pays |
| ch02 | `ch02-road-drowned-corpse-lantern` | Corpse Lantern | A cold lantern carried through reeds by a figure made from river corpses |
| ch02 | `ch02-road-drowned-basin-warden` | The Basin Warden | A rusted floodgate chamber with a guardian blocking the only dry passage |
| ch05 | `ch05-road-embervault-ash-priestess` | Ash Priestess | An ember-lit shrine and a soot-covered priestess protecting a forbidden route |
| ch05 | `ch05-road-embervault-cinder-drill` | Cinder Drill | Soldiers drilling beside a forge while sparks reveal a second set of orders |
| ch05 | `ch05-road-embervault-scorch-festival` | Scorch Festival | A fire festival masking an ambush in a crowded forge district |
| ch05 | `ch05-road-embervault-ore-bone-road` | Ore on the Bone Road | Pale ore carts crossing a road lined with old ribs and warning stakes |
| ch08 | `ch08-road-crownless-sigil-court` | The Sigil Court | A ruined court where floating seals judge every banner brought before them |
| ch08 | `ch08-road-crownless-iron-chime` | Iron Chime | A giant iron bell in a windless keep corridor, vibrating without being struck |
| ch08 | `ch08-road-crownless-barnacle-pit` | The Barnacle Pit | A flooded prison pit beneath Crownless Keep with prisoners signaling from below |

These scenes are not text-only. Every scene gets a unique 1536x1024 WebP at the exact `public/assets/chronicle1/scenes/{chapter}/{illustrationId}.webp` path, an accurate alt text, and a media-contract entry. No image is reused to satisfy a new scene.

Road action art is separate from scene art and is used by the action cards:

- `travel-road-scout.webp` — scout reading tracks beside a guarded wagon;
- `travel-road-press-on.webp` — convoy pushing through rain and hostile terrain;
- `travel-road-make-camp.webp` — a guarded night camp under a wagon awning;
- `travel-road-companion.webp` — the active companion directing the convoy at a fork.

All 20 new images are generated as project-bound assets, converted to the project's required format and dimensions, checked for unique hashes, and included in the final media report. Generation prompts must request painterly dark-fantasy game key art, strong focal silhouettes, readable mobile composition, no text, no logos, and no watermark.

## 6. UI and accessibility polish included in the same pass

The following small defects found during the audit are part of this change because they affect the new loop and make the product feel inconsistent:

- use the class resource label consistently in `NewRunScreen`, HUD, effect summaries, and Road Tactics;
- raise HUD navigation controls to the 48px touch target while retaining the current compact layout;
- allow opening cinematic controls and advancing/skipping with keyboard input, including Space and Escape where appropriate;
- keep reduced-motion and captions behavior intact;
- add a visible action receipt after each road action;
- give every disabled action an accessible reason and keep focus order stable after the next scene loads.

## 7. Existing audit failures to repair

The implementation pass also closes the currently observed repository failures without hiding them:

1. Fix the legacy `mysterious`/`mystic` tone mismatch and keep the compatibility event contract internally consistent.
2. Repair persistence-recovery fixtures and migration behavior against the current strict item/save schema.
3. Update stale playthrough and director expectations only where the intentional Road Tactics or immediate-combat contract changes behavior; add regression assertions for the new contract.
4. Keep route descriptions, living-encounter counts, voice-cue counts, and media contracts generated from one source of truth.
5. Make the Chronicle manifest exporter deterministic and fast enough for the validation timeout; avoid starting a full dev server twice for a pure contract export.
6. Make audio validation work without a system `ffprobe` by using a safe header/duration fallback, while using `ffprobe` when available and still failing on corrupt or missing shipped audio.
7. Align package, Android, README, Play Store checklist, and release metadata to the current version/code, removing stale release claims without deleting historical artifacts.
8. Preserve the existing art and Android-size gates and add the 20 new asset checks.

## 8. Test-first implementation plan

Implementation follows red-green-refactor. Production code is not written before a failing test exists for the behavior being added.

### Red tests to add first

- `tests/road-tactics-reducer.test.ts`: start expedition enters travel; each action changes the expected bounded values; invalid actions are rejected; same seed/action sequence is deterministic;
- `tests/road-tactics-director.test.ts`: action bias changes candidate selection without bypassing callbacks, anchors, exclusions, or the combat streak cap;
- `tests/road-tactics-companions.test.ts`: all five companion capabilities map to the expected road effects and no active companion cannot execute the move;
- `tests/road-tactics-persistence.test.ts`: travel state round-trips and old empty-story saves recover to travel;
- `tests/road-tactics-ui.test.tsx`: all cards render with costs/effects/art, disabled reasons are announced, and action dispatch uses the expected command;
- content validation assertions for 16 scene IDs, 20 unique media assets, and no duplicate legacy IDs;
- regression tests for the existing authored combat and `Dialogue x/y` behavior.

### Focused and full verification

The final pass must make these commands succeed from a clean working tree state, subject only to the documented pre-existing user changes being incorporated:

```text
npm run test:run
npm run build
npm run test:e2e
npm run content:validate
npm run art:validate
npm run audio:validate
npm run check:android-size
git diff --check
```

Manual smoke coverage must include all three classes, all three routes, every Road Tactics action, an active companion move, one new illustrated road scene, a road scene leading to combat, save/load while in travel, a hub bank, defeat recovery, and the 360x800 viewport.

## 9. Acceptance criteria

The feature is complete when:

- the player makes a meaningful road decision before every next event;
- action choices visibly and deterministically alter the run;
- at least one new art-backed road encounter is reachable in each of ch01, ch02, ch05, and ch08;
- no new screen or content path is missing its artwork;
- saves made before the change still recover safely;
- no known build, test, media, or release-metadata failure remains;
- the new behavior is covered by reducer, director, persistence, UI, content, media, and browser checks.

## 10. Approval gate

This document is the design boundary for implementation. After approval, write the executable implementation plan, then implement in small TDD slices and generate the art assets as part of the same feature. Any material change to the action economy, canonical content source, save migration, or asset count requires updating this document before code changes continue.
