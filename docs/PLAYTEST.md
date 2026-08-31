# MORROWMERE playtest guide

## Fast smoke test

1. Open the title screen and confirm the generated keep artwork appears behind `MORROWMERE`.
2. Select `New Chronicle`, review Warrior, Mage, and Warden, then begin a run.
3. Confirm the prologue is fully readable at the default text size.
4. Open Inventory, Chronicle, Bestiary, and Settings from the top HUD.
5. Enable High contrast, Reduce motion, and Screen reader narration one at a time.
6. Make story choices until combat begins.
7. Confirm the enemy intent is shown before choosing Attack, Guard, Technique, Red Mercy, or Flee.
8. Win the encounter, choose one of the class-aware rewards, and confirm the next story node loads.
9. Close and reopen the app, select Continue, and confirm the current run resumes.
10. Disable the device network and relaunch. All text and artwork must still load.

## Complete chronicle test

A full run contains twelve nodes:

1. Prologue in Gloamwood Verge
2. Two procedural Gloamwood events
3. One Drowned Road event
4. Drowned Marshal lieutenant
5. One additional Drowned Road event
6. Two Embervault events
7. Furnace Confessor lieutenant
8. Two Crownless Keep events
9. Final throne decision and Crown Devil battle

At the throne, verify all three player-facing decisions appear: Break the Crown, Wear the Crown, and Refuse Every Throne.

## Ending matrix

- `Iron Rain`: break the Crown
- `The Crowned Wound`: restore and wear the Crown
- `The Road Without Kings`: refuse the Crown after learning the truth and maintaining high mercy
- `The Law of Iron`: let the Iron Abbey lead
- `The Red Dawn`: finish with the Free Host as the strongest faction
- `The Pale Star`: finish with the Pale Conclave as the strongest faction

## Class checks

- Warrior: highest Health and Strength; technique is Cleave.
- Mage: highest Focus and Will; technique is Witchfire.
- Warden: highest Cunning and balanced defenses; technique is Marked Shot.
- Reward choices must always include usable options for the active class.
- Inventory capacity must never exceed 12 carried items.

## Accessibility checks

- At 130% text size, story text and every choice remain reachable by scrolling.
- Every icon-only menu button has a spoken label.
- Screen reader narration announces new story scenes and enemy intent.
- High contrast strengthens borders and secondary text without hiding art.
- Reduce motion removes transitions.
- Keyboard focus remains visible and dialogs close with their labeled Close button.

Automated coverage includes unit, component, axe-core accessibility, persistence, visual catalog, mobile E2E, PWA manifest, and forced-offline tests.

## Offline Android release check

1. Install the QA APK, launch it once, and enter an active Chronicle I run.
2. Enable airplane mode, background the app, and resume the same saved combat turn.
3. Use one consumable in combat and confirm the inventory count, health, and turn state remain correct.
4. Confirm one local music loop, one attack SFX, and one captioned story voice cue can play offline.
5. Finish a story choice and confirm the next scene and its local artwork load.
6. Open a safe camp or merchant. Ad controls may report unavailable, but they must never block saving, shopping, combat, or story progress.
