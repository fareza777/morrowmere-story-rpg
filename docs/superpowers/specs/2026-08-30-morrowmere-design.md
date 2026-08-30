# Morrowmere: A Sword & Sorcery Chronicle — Game Design

## Product definition

Morrowmere is an English-only, offline-first, portrait-oriented text adventure RPG for Android. It combines a consequential authored narrative with replayable procedural routes, tactical turn-based combat, equipment builds, faction reputation, codex discovery, and multiple endings. The first release must be a complete 30–60 minute campaign that remains replayable after the first victory.

The public-facing title is **MORROWMERE** with the subtitle **A Sword & Sorcery Chronicle**. The Android application ID is `com.morrowmere.game`.

The game is premium-feeling and contains no advertising, accounts, network requirement, paid currency, or forced waiting. All progress is stored locally. Content is suitable for a Teen rating: fantasy violence, threatening themes, and implied death without gore or sexual content.

## Creative direction

The kingdom of Morrowmere is drowning beneath a black rain. Forty years after the Crown of Thorns was broken, its five iron teeth have begun ringing like bells from their hidden graves. The player is an oathless survivor carrying the final tooth and must decide whether to restore the Crown, destroy it, or place it in the hands of one of three rival powers.

The narrative tone is grim, intimate, and restrained. Prose uses short paragraphs, concrete sensory detail, and clear choices. Humor appears through gallows wit rather than parody. Proper nouns are introduced sparingly, and every lore term is understandable from context.

The visual language is an illuminated medieval field journal seen by firelight: charcoal-black panels, warm parchment text, tarnished brass controls, oxblood danger states, and cold witchlight accents. Artwork is painterly dark fantasy with readable silhouettes and no embedded text. Generated art will be used for project-bound environmental plates and enemy-family portraits, with disclosure retained for store preparation.

## Player promise

Every route presents decisions with mechanical and narrative consequences. A failed check changes the situation instead of merely stopping progress. Every combatant exposes enough intent for the player to make a tactical decision. No ending or mandatory boss requires a single predetermined build.

## Core loop

1. Begin at camp, choose Warrior, Mage, or Warden, then select one of three route cards.
2. Resolve an authored or procedural story scene with two to four choices.
3. Apply choice consequences to resources, traits, faction standing, flags, and the route deck.
4. When combat starts, spend one action per turn on Attack, Guard, Technique, Item, or Flee when permitted.
5. Claim one of three rewards, manage equipment, and continue toward the regional threat.
6. Defeat or negotiate with a boss, make a chapter-defining decision, and reach one of five endings.
7. Unlock codex entries and Chronicle memories that persist across runs without granting mandatory combat power.

## Campaign structure

The playable campaign contains four regions: Gloamwood Verge, The Drowned Road, Embervault, and The Crownless Keep. Each run contains 12 encounters: prologue, eight variable route encounters, two lieutenants, and one final confrontation. The order and available branches depend on class, faction reputation, inventory tags, prior flags, and seed.

The authored spine follows three questions:

- Who caused the Black Rain?
- Which faction deserves the Crown's power: the Iron Abbey, the Orcish Free Host, or the Pale Conclave?
- Is the player carrying a relic, a prisoner, or a piece of themselves?

Five endings cover restoration, destruction, faction victory for each of the three powers, and a hidden refusal ending. The ending resolver uses explicit world flags and faction values rather than a single last choice.

## Procedural narrative model

Events are authored templates with deterministic slots rather than unconstrained generated prose. Each template declares region, tone, prerequisites, exclusions, weight, cooldown, text fragments, choices, skill checks, consequences, and follow-up hooks. A seeded random generator makes a run reproducible.

The event director tracks tension, mercy, corruption, supplies, recent event families, factions, and unresolved hooks. It avoids repeating an event family within three nodes and prefers callbacks to earlier decisions. At least 36 authored templates combine with actors, locations, threats, weather, and consequence variants to produce more than 250 valid scenes while keeping grammar controlled.

## Combat and character systems

The three classes share Strength, Cunning, Will, Armor, Ward, maximum Health, and maximum Focus.

- Warrior: high Armor and reliable Guard; techniques are Cleave and Riposte.
- Mage: high Will and Focus; techniques are Witchfire and Sigil Ward.
- Warden: balanced stats; techniques are Marked Shot and Field Remedy.

Enemies telegraph one intent: Strike, Heavy, Guard, Hex, Recover, or Flee. Damage is deterministic within a narrow seeded variance. Armor mitigates physical damage, Ward mitigates sorcery, Guard halves the next incoming hit, and status durations are visible. Difficulty uses region threat, encounter number, and a budget system; mandatory encounters cap their budget relative to the player's effective power.

The bestiary exposes exactly 200 uniquely named entries from 20 hand-authored archetypes and ten ranked variants per archetype. Each entry has stable stats, traits, intent weights, reward tables, description, region eligibility, and an art-family reference. Species include goblins, orcs, human warriors, mages, beasts, trolls, constructs, undead, cultists, and demons. Variant generation is deterministic at build time and validated for unique IDs, names, and acceptable power curves.

## Equipment, rewards, and economy

There are at least 60 base items across weapon, armor, charm, potion, scroll, and quest categories. Equipment supports one weapon, one armor, and two charms. Curated prefixes and suffixes create more than 300 legal item variants, but every displayed item retains a short human-readable name and effect summary.

Gold purchases supplies and equipment at merchants. Supplies power camp healing and selected event choices. Corruption unlocks risky options and increases hostile event weight; it is never a simple morality score.

Reward selection avoids presenting three unusable items. Bosses always drop one class-relevant option, one defensive option, and one flexible relic. Inventory capacity is 12, with explicit compare, equip, use, and discard actions.

## Art and background system

The project contains generated painterly environment plates for the four regions plus camp and title scenes, and generated portrait sheets for major enemy families. Art never carries text. The interface places an opaque-to-transparent black scrim between art and copy.

The runtime scene compositor combines base plates with region palettes, weather layers, time-of-day lighting, particles, vignette shapes, and encounter-specific foreground treatments. At least 12 base plates multiplied by five weather states and five lighting states provide at least 300 visually distinct, deterministic background combinations without shipping hundreds of near-duplicate large files.

Enemy art uses family portraits with deterministic crop, mirrored stance, tint, rim-light, sigil, and elite-frame treatments. All 200 bestiary entries receive a distinct presentation while sharing a compact set of high-quality source plates.

## Interface and readability

The default layout targets a 360×800 CSS-pixel viewport and scales through tablets. It respects Android safe areas. Primary prose is at least 18 CSS pixels with a 1.65 line height and a maximum line length of 42 characters on phones. Decorative serif type is restricted to titles; body copy and controls use a highly legible humanist sans serif.

The main play screen keeps health, focus, location, and menu access fixed in the top HUD; the current illustration occupies no more than 34% of the viewport; story text scrolls independently; choices are full-width buttons with at least 48-pixel touch height. Combat displays enemy intent beside the enemy name and never depends on color alone.

Menus are Title, New Chronicle, Continue, Chronicle, Bestiary, Inventory, Settings, Credits, and Quit/Return. Settings include text size from 90% to 130%, high contrast, reduced motion, sound, music, and screen-reader narration. All controls have accessible names, focus states, and logical reading order.

## Persistence and offline behavior

The game has three local save slots. A versioned save schema stores campaign state, RNG state, player state, route state, discoveries, settings, and timestamps. Every state-changing action autosaves. Loading validates and migrates data; corrupt saves are copied to a recovery key and replaced only after the player confirms.

The web build is installable as a PWA and has no runtime network calls. Capacitor packages the same build for Android. Back-button behavior closes the active overlay first, then opens pause confirmation; it never discards progress.

## Technical architecture

The game uses React, TypeScript, Vite, and Capacitor. Pure TypeScript domain modules own seeded randomness, content generation, event selection, combat, loot, endings, and persistence. React components render immutable game state and dispatch typed commands. A small reducer/store coordinates screens and autosave. CSS variables define the visual system; no heavyweight UI component framework is used.

Static content and generated catalogs live in TypeScript modules so builds remain offline and type-checked. Artwork and fonts live under `public/assets`. The service worker precaches the complete game shell.

## Error handling

Invalid generated content fails tests and the production build. Runtime commands that violate state preconditions return typed errors and leave state unchanged. React catches rendering failures and offers Reload and Reset Current Run actions. Storage failures show a persistent warning and allow export of the current save as JSON.

## Verification and acceptance

- Unit tests prove seeded reproducibility, event prerequisite enforcement, repetition avoidance, combat invariants, reward usability, ending resolution, save migration, and exactly 200 valid enemies.
- Component tests cover readable choice rendering, combat intent, inventory comparison, settings, and keyboard interaction.
- End-to-end tests complete a new run at a mobile viewport, reload from autosave, exercise a defeat, and reach a victory ending.
- Automated accessibility checks report no serious violations on title, story, combat, inventory, and settings screens.
- Production build succeeds, contains no runtime network dependency, and loads offline after first install.
- Android project synchronizes successfully. If a local Android SDK is unavailable, the repository still contains the complete Capacitor project and exact signed-release instructions; unsigned APK creation remains environment-dependent.

## Deliberate exclusions for the first release

Cloud saves, multiplayer, daily challenges, server-authored events, analytics, advertisements, in-app purchases, voice acting, animated character rigs, and free-form AI story generation are excluded. They are not required for the core promise and would weaken offline reliability or readability.
