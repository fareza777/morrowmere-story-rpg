# Morrowmere Story Flow and Roguelike Dungeon Overhaul

**Status:** Draft for user review
**Date:** 2026-09-24

## Summary

Repair the stop-start pacing introduced by Road Tactics and turn the gaps between major story beats into a readable, player-directed roguelike journey. Small authored scenes and their aftermaths should play as a continuous story sequence. Every chapter gets at least one dungeon or dungeon-like sequence, from compact early-game delves to larger expeditions when the story earns them. Route choices are authored around each chapter's situation: there is no repeated “three choices, one is a dungeon” template and no forced route menu after every event. Chapter 5's Embervault mines provide the first long-form expedition.

The overhaul preserves the existing campaign and its choices while adding varied combat, meaningful route branches, recovery/extraction decisions, and a large art batch that follows Morrowmere's established bright, painterly storybook style.

## Problem and evidence

- The current travel transition interrupts after individual authored scenes and after rewards, so even a short setup/choice/aftermath chain repeatedly returns to Road Tactics.
- A recent local edit adds the same Verge Signalers encounter to both outcomes of one choice. The encounter is also reachable from earlier failure outcomes, which can cause the same fight to recur. That edit is user-owned and must be preserved while the encounter flow is corrected.
- The Road Tactics art brief calls for dark fantasy, contrary to the approved Chronicle I art direction: bright painterly gouache/storybook scenes with readable silhouettes and warm open shadows.
- Dungeon-tagged scenes and underground story material already exist in several chapters, but a dungeon tag alone does not create a sustained, varied multi-room run. Chapter coverage, room-to-room pacing, and player navigation need to be designed as a connected experience.

Relevant references: `2026-08-31-morrowmere-chronicle-i-black-banner-design.md` and `2026-09-17-morrowmere-road-tactics-design.md`.

## Player experience

The campaign follows this rhythm:

1. A main-quest landmark establishes the current story objective.
2. Related authored setup, choice, and aftermath scenes flow together without detouring to a tactics screen after each one.
3. At selected, story-motivated junctions—not after every event—the player makes a contextual decision. That may be a direct/hidden route, chase/hold position, rescue/pursue, or another chapter-specific choice. A dungeon entrance is one possible branch when it fits the scene, not a guaranteed slot in a standard menu.
4. The selected node resolves fully, including its outcome and rewards, before the next junction or main-quest landmark.
5. Combat is a purposeful part of the journey, not a mandatory interruption after every event. Winning, retreating, and losing each have clear consequences.

Road Tactics becomes a route-selection moment only where the story benefits from it, rather than a screen inserted between every scene. Junctions can offer two, three, or another appropriate number of options; some are unlocked by earlier decisions, and some choices can resolve directly into a scene or battle without opening a map. Main-quest landmarks remain authored and cannot be accidentally skipped by generated routes.

## Dungeon coverage across the campaign

All eight chapters contain a distinct dungeon or dungeon-like playable sequence. “Dungeon” describes a connected stretch of risky exploration, not necessarily a cave or a repeated room-card format. A chapter's sequence may be optional, a main-quest set piece, opened by a previous choice, or a shortcut that trades risk for time. Each chapter must have at least one meaningful decision associated with its delve, but there is no requirement to present a dungeon choice after each event—or even to show the same type of route board in every chapter.

Use existing chapter material as the source of truth and build from these candidate spaces and pacing ranges:

| Chapter | Grounded space | Intended shape |
| --- | --- | --- |
| 1 | Tollhouse cellar, sealed spaces, and culverts | 3–4 rooms; a compact first delve that teaches risk, approach, and a short battle without stalling the opening. |
| 2 | Underwall search, depot infiltration, or the basin works | 3–5 rooms; approach and stealth/confrontation choices, with a distinct encounter rather than a replay of Chapter 1. |
| 3 | Toll archive and its concealed records | 4–6 rooms; evidence, mechanisms, and guarded access matter as much as combat. |
| 4 | Mill drains and warehouse cellar | 4–6 rooms; pursuit, rescue, or infiltration changes the route and what evidence survives. |
| 5 | Embervault mines and hidden armory | 10–12 rooms for the long-form expedition; a sustained descent with recovery, multiple branches, elites, a boss, and extraction. |
| 6 | Chapel undercroft and siege-breach spaces | 3–5 rooms; a rescue/holdout variant with urgency and civilian stakes, not just another cave crawl. |
| 7 | Keep aqueduct and underground archive routes | 5–8 rooms; routes trade safety, time, and evidence as the campaign converges on the keep. |
| 8 | Engine-service galleries | 5–8 rooms; an endgame infiltration/escape sequence with a different rhythm and a campaign-scale payoff. |

These are design targets, not permission to contradict chapter canon. The room counts may flex where an existing authored branch already supplies the same dramatic beat. Compact chapter delves generally use 1–3 fights and one or more exploration, hazard, rescue, or traversal beats; their exact cadence must vary. Not every dungeon needs a boss, shop, rest room, or extraction screen.

### Long-form Embervault expedition

The Chapter 5 mine/armory delve is the first full roguelike expedition. It should feel like one continuous descent, not a chain of unrelated pop-up events.

- A run is approximately 10–12 rooms, with about 6–8 fights in total, including 1–2 elite encounters and one climactic boss. The remaining rooms provide exploration, hazards, supplies, rest, or loot. The entrance and extraction may be presented as transitions rather than counted as rooms.
- At meaningful junctions, offer two or more legible route choices with visible risk/reward hints. Branches may differ in room type, enemy family, resources, evidence, and later story consequences.
- Room composition and reward rolls are seeded for a run. Player choices still determine the path; the seed must not force a fixed linear sequence.
- Include a mid-run rest/supply opportunity and an explicit retreat/extraction option. Retreat banks only the portion of unsecured rewards explained to the player. A defeat follows the existing return-to-camp recovery rule unless that rule is deliberately revised in the implementation plan.
- The run should escalate through varied enemy roles and tactics. Avoid repeating the same encounter family back-to-back; a previously resolved encounter cannot be scheduled again in the same route unless an authored story beat explicitly calls for a rematch.
- Dungeon completion returns the player to the campaign at the intended Chapter 5 landmark, carrying forward only the choices, flags, evidence, and rewards defined by the authored story.

Later chapters may have longer delves too if their own story and pacing warrant them; Chapter 5 is not a universal template for every dungeon.

## Branching, combat, and pacing rules

- Every substantial route choice changes at least one concrete thing: the next scene/encounter, a resource or reward, a story flag, or a later choice. Purely cosmetic choices are acceptable only as occasional flavor.
- Vary the navigation grammar: sometimes offer two routes, sometimes an authored three-way decision, sometimes a map with only the known paths, sometimes a direct action that commits to a route. Do not always show three cards, do not always include a dungeon card, and do not surface a fresh route menu after every event.
- Let chapter context and player history change which choices appear. A discovered culvert, rescued guide, exposed depot, or raised alarm can reveal or close a route; communicate why an option is present or absent.
- Give dungeon rooms different verbs and pressures—scout, sneak, traverse, rescue, investigate, defend, fight, or escape. Avoid making every room a prose panel that ends in another identical choice.
- Do not schedule a battle on both outcomes by default. Encounters are attached to a specific route/result, are guarded against duplicate resolution, and cannot silently restart because a later aftermath scene re-enters travel.
- When a choice starts a battle, first show the choice's immediate consequence and make the transition to combat clear. Never hide the scene outcome behind the combat screen.
- After a battle, show its result and reward once, then continue to the route junction or story landmark. Claiming rewards must not force an extra, empty travel step.
- Vary standard encounters by enemy composition, intent patterns, arena context, and reward. Use elites and the boss as deliberate peaks, with recovery or a lower-intensity room between peaks where pacing allows.
- Keep authored main-quest outcomes authoritative. Generated route content can add opportunities and consequences but must not overwrite established campaign decisions.

## Save and recovery behavior

Persist the dungeon seed, selected/visited route nodes, current room and combat, resolved encounter IDs, dungeon depth, pending choice/outcome, and unsecured rewards. Saving and loading in a room, in combat, or at a junction must resume at that exact point without replaying a fight or awarding loot twice.

Existing saves must continue to load without losing their current campaign position. If a save has no dungeon fields, decode it as having no active dungeon run; if it contains an obsolete travel state, map only that state to the nearest valid junction without replaying the scene. Migration must never fabricate completed nodes, duplicate rewards, or strand the player in a flow screen that no longer exists. Existing defeat, retreat, and unbanked-gold semantics remain in force unless a separately reviewed design changes them.

## Art batch and art direction

Create **at least 53 distinct, scene-specific images** for the first overhaul wave, with a final inventory sized to the actual room count (expected range: 53–67):

- 16 replacements for the Road Tactics event illustrations that currently clash with Chronicle I's art direction.
- 3–5 unique illustrations for each of the seven compact dungeon sequences in Chapters 1–4 and 6–8 (21–35 total), covering their actual entrance, signature exploration/hazard, and combat or payoff moments. Add images for additional visually distinct rooms where the scene inventory calls for them.
- 12 new Embervault dungeon room illustrations, covering the entrance/deep-shaft descent, distinct room and hazard scenes, elite moments, boss confrontation, and extraction.
- 4 route-node illustrations to make story/event, battle, rest/supply, and dungeon/elite choices visually distinct on the route board.

The count assumes 3–5 unique images per compact chapter delve, 12 for the long Chapter 5 expedition, 16 Road Tactics replacements, and 4 shared route-node illustrations. Each used scene receives art that depicts that scene; do not reuse one room image for unrelated events. Chapter-specific environments and composition must vary so the illustrations reinforce—not flatten—the distinct pacing and identity of each delve.

All images follow the approved Morrowmere look: bright, readable painterly gouache/storybook fantasy; parchment, limestone, burgundy, dusty blue, forest green, and restrained brass; strong focal silhouettes and open shadows. Dungeon scenes may use forge, lantern, or magical light, but remain readable and stylistically consistent with the rest of the game. Prompts must depict the actual scene and vary camera, composition, characters, and focal point. Do not use generic dark-fantasy grading, crushed blacks, noisy/grainy overlays, embedded text/UI, or literal crystal/glass motifs unless the source scene specifically calls for them.

Use approved in-game art as visual references when generating the batch. Review the complete set together for consistency and accidental near-duplicates before integration. Follow each asset's existing aspect-ratio, crop, format, size, attribution, and manifest conventions; keep the Android package-size limit intact. This batch does not imply replacing every illustration in the campaign.

## Protecting in-progress user changes

Retain the user's current DialoguePanel progress and the user-authored Living Departure branch edits. Correct the repeated Verge Signalers path by changing its encounter eligibility/branch wiring, not by discarding the user's story choice. Preserve and improve the existing battle/result work where it fits this flow.

## Acceptance criteria

1. Authored sub-scenes and their aftermaths no longer force Road Tactics between each other; route selection appears only at intentional junctions.
2. Main-quest landmarks remain reachable and are never skipped by route generation.
3. A route presents meaningful alternatives and carries their consequences forward.
4. Every one of the eight chapters contains a distinct dungeon/dungeon-like sequence with chapter-appropriate length, stakes, and activity; early chapters include compact mini-dungeons.
5. A Chapter 5 dungeon run has roughly 10–12 rooms, 6–8 varied fights including elite/boss peaks, noncombat/recovery opportunities, branching route choices, and a clear extraction decision.
6. Route/menu cadence and option count vary with story and prior decisions; the dungeon is not a repeated default option after each event.
7. No encounter or reward resolves twice in one run, and battle transitions do not hide or erase choice outcomes.
8. Saving/loading at all dungeon phases resumes safely, and pre-overhaul saves remain loadable.
9. The initial art wave contains at least 53 unique mapped assets (expected 53–67) in the established bright painterly style, with no accidental duplicate composition and no violation of the project's package-size limit.

## Out of scope for this first overhaul

- Rewriting every existing chapter or converting every story scene into generated content.
- Replacing the turn-based combat system wholesale.
- Generating arbitrary infinite dungeons; the first expedition is authored around Chapter 5 with seeded variation and branching.
- Publishing a new APK or pushing a release branch. Those can follow once the overhaul is implemented and reviewed.

## Review notes

- Existing chapter content already points to distinct spaces—such as the sealed cellar, underwall/depot, toll archive, mill drains, chapel undercroft, keep aqueduct, and engine galleries. The design must inventory exact scenes and honor their current branches before implementation.
- The initial art wave is intentionally focused on the mismatched Road Tactics assets and dungeon/route art across all eight chapters; it does not attempt to redraw every illustration in the campaign.
- Dungeon presence is guaranteed per chapter, but its exact route position and whether it is optional, a shortcut, or a main-story set piece are decided chapter by chapter. Repetition avoidance is a core acceptance criterion, not polish.
