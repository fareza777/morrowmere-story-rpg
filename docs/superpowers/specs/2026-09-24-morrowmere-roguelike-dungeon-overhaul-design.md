# Morrowmere Story Flow and Roguelike Dungeon Overhaul

**Status:** Draft for user review
**Date:** 2026-09-24

## Summary

Repair the stop-start pacing introduced by Road Tactics and turn the gaps between major story beats into a readable, player-directed roguelike journey. Small authored scenes and their aftermaths should play as a continuous story sequence. At intentional junctions, the player chooses a route, event, supply stop, or battle. The first substantial dungeon expedition will be a long optional delve tied to Chapter 5's Embervault mines and hidden armory.

The overhaul preserves the existing campaign and its choices while adding varied combat, meaningful route branches, recovery/extraction decisions, and a large art batch that follows Morrowmere's established bright, painterly storybook style.

## Problem and evidence

- The current travel transition interrupts after individual authored scenes and after rewards, so even a short setup/choice/aftermath chain repeatedly returns to Road Tactics.
- A recent local edit adds the same Verge Signalers encounter to both outcomes of one choice. The encounter is also reachable from earlier failure outcomes, which can cause the same fight to recur. That edit is user-owned and must be preserved while the encounter flow is corrected.
- The Road Tactics art brief calls for dark fantasy, contrary to the approved Chronicle I art direction: bright painterly gouache/storybook scenes with readable silhouettes and warm open shadows.
- Dungeon-tagged scenes and Embervault story material already exist, but there is no persistent multi-room dungeon run or route-map flow yet.

Relevant references: `2026-08-31-morrowmere-chronicle-i-black-banner-design.md` and `2026-09-17-morrowmere-road-tactics-design.md`.

## Player experience

The campaign follows this rhythm:

1. A main-quest landmark establishes the current story objective.
2. Related authored setup, choice, and aftermath scenes flow together without detouring to a tactics screen after each one.
3. At a deliberate junction, the player sees a small set of distinct next steps and chooses a branch: a story/event node, a battle, a supply/rest stop, or a dungeon entrance when available.
4. The selected node resolves fully, including its outcome and rewards, before the next junction or main-quest landmark.
5. Combat is a purposeful part of the journey, not a mandatory interruption after every event. Winning, retreating, and losing each have clear consequences.

Road Tactics becomes a junction/route-selection moment rather than a screen inserted between every scene. Main-quest landmarks remain authored and cannot be accidentally skipped by generated routes.

## Chapter 5 dungeon expedition

The first full dungeon is an optional deep-shaft expedition through the Embervault mines toward the hidden armory. It should feel like one continuous descent, not a chain of unrelated pop-up events.

- A run is approximately 10–12 rooms, with about 6–8 fights in total, including 1–2 elite encounters and one climactic boss. The remaining rooms provide exploration, hazards, supplies, rest, or loot. The entrance and extraction may be presented as transitions rather than counted as rooms.
- At meaningful junctions, offer two or more legible route choices with visible risk/reward hints. Branches may differ in room type, enemy family, resources, evidence, and later story consequences.
- Room composition and reward rolls are seeded for a run. Player choices still determine the path; the seed must not force a fixed linear sequence.
- Include a mid-run rest/supply opportunity and an explicit retreat/extraction option. Retreat banks only the portion of unsecured rewards explained to the player. A defeat follows the existing return-to-camp recovery rule unless that rule is deliberately revised in the implementation plan.
- The run should escalate through varied enemy roles and tactics. Avoid repeating the same encounter family back-to-back; a previously resolved encounter cannot be scheduled again in the same route unless an authored story beat explicitly calls for a rematch.
- Dungeon completion returns the player to the campaign at the intended Chapter 5 landmark, carrying forward only the choices, flags, evidence, and rewards defined by the authored story.

## Branching, combat, and pacing rules

- Every route choice changes at least one concrete thing: the next node/encounter, a resource or reward, a story flag, or a later choice. Purely cosmetic choices are acceptable only as occasional flavor.
- Do not schedule a battle on both outcomes by default. Encounters are attached to a specific route/result, are guarded against duplicate resolution, and cannot silently restart because a later aftermath scene re-enters travel.
- When a choice starts a battle, first show the choice's immediate consequence and make the transition to combat clear. Never hide the scene outcome behind the combat screen.
- After a battle, show its result and reward once, then continue to the route junction or story landmark. Claiming rewards must not force an extra, empty travel step.
- Vary standard encounters by enemy composition, intent patterns, arena context, and reward. Use elites and the boss as deliberate peaks, with recovery or a lower-intensity room between peaks where pacing allows.
- Keep authored main-quest outcomes authoritative. Generated route content can add opportunities and consequences but must not overwrite established campaign decisions.

## Save and recovery behavior

Persist the dungeon seed, selected/visited route nodes, current room and combat, resolved encounter IDs, dungeon depth, pending choice/outcome, and unsecured rewards. Saving and loading in a room, in combat, or at a junction must resume at that exact point without replaying a fight or awarding loot twice.

Existing saves must continue to load without losing their current campaign position. If a save has no dungeon fields, decode it as having no active dungeon run; if it contains an obsolete travel state, map only that state to the nearest valid junction without replaying the scene. Migration must never fabricate completed nodes, duplicate rewards, or strand the player in a flow screen that no longer exists. Existing defeat, retreat, and unbanked-gold semantics remain in force unless a separately reviewed design changes them.

## Art batch and art direction

Create **32 distinct, scene-specific images** for the first overhaul wave:

- 16 replacements for the Road Tactics event illustrations that currently clash with Chronicle I's art direction.
- 12 new Embervault dungeon room illustrations, covering the entrance/deep-shaft descent, distinct room and hazard scenes, elite moments, boss confrontation, and extraction. Each used scene receives the image that actually depicts it; do not reuse one room image for unrelated events.
- 4 route-node illustrations to make story/event, battle, rest/supply, and dungeon/elite choices visually distinct on the route board.

All images follow the approved Morrowmere look: bright, readable painterly gouache/storybook fantasy; parchment, limestone, burgundy, dusty blue, forest green, and restrained brass; strong focal silhouettes and open shadows. Dungeon scenes may use forge, lantern, or magical light, but remain readable and stylistically consistent with the rest of the game. Prompts must depict the actual scene and vary camera, composition, characters, and focal point. Do not use generic dark-fantasy grading, crushed blacks, noisy/grainy overlays, embedded text/UI, or literal crystal/glass motifs unless the source scene specifically calls for them.

Use approved in-game art as visual references when generating the batch. Review the complete set together for consistency and accidental near-duplicates before integration. Follow each asset's existing aspect-ratio, crop, format, size, attribution, and manifest conventions; keep the Android package-size limit intact. The initial 32-image scope does not imply replacing every illustration in the campaign.

## Protecting in-progress user changes

Retain the user's current DialoguePanel progress and the user-authored Living Departure branch edits. Correct the repeated Verge Signalers path by changing its encounter eligibility/branch wiring, not by discarding the user's story choice. Preserve and improve the existing battle/result work where it fits this flow.

## Acceptance criteria

1. Authored sub-scenes and their aftermaths no longer force Road Tactics between each other; route selection appears only at intentional junctions.
2. Main-quest landmarks remain reachable and are never skipped by route generation.
3. A route presents meaningful alternatives and carries their consequences forward.
4. A Chapter 5 dungeon run has roughly 10–12 rooms, 6–8 varied fights including elite/boss peaks, noncombat/recovery opportunities, branching route choices, and a clear extraction decision.
5. No encounter or reward resolves twice in one run, and battle transitions do not hide or erase choice outcomes.
6. Saving/loading at all dungeon phases resumes safely, and pre-overhaul saves remain loadable.
7. The initial art wave contains 32 unique mapped assets in the established bright painterly style, with no accidental duplicate composition and no violation of the project's package-size limit.

## Out of scope for this first overhaul

- Rewriting every existing chapter or converting every story scene into generated content.
- Replacing the turn-based combat system wholesale.
- Generating arbitrary infinite dungeons; the first expedition is authored around Chapter 5 with seeded variation and branching.
- Publishing a new APK or pushing a release branch. Those can follow once the overhaul is implemented and reviewed.

## Review notes

- The Chapter 5 Embervault delve is the proposed first full dungeon because its existing mine/hidden-armory story provides a natural setting. If the user wants the first dungeon in a different chapter, change this before implementation.
- The 32-image batch is intentionally focused on the mismatched Road Tactics assets plus one complete dungeon and route-node set; it does not attempt to redraw the whole game.
