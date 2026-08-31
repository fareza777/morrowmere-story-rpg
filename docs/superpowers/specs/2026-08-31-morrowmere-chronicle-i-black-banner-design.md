# MORROWMERE — Chronicle I: The Black Banner

## Approved expansion design

**Status:** Approved for implementation planning on 2026-08-31.

This document supersedes `2026-08-30-morrowmere-design.md` wherever the two specifications conflict. The existing application is the playable vertical slice and visual foundation. This expansion turns it into the complete first chronicle requested for Android and Google Play.

The established bright, painterly MORROWMERE illustration theme must be preserved. The expansion must not return to the earlier dark, grainy, particle-heavy presentation.

## Product definition

MORROWMERE is an English-only, portrait-oriented medieval sword-and-sorcery text adventure RPG for Android. Chronicle I is a complete 10–12 hour campaign with a fixed authored story spine, procedural journeys between major scenes, tactical turn-based combat, difficult companion recruitment, equipment builds, merchants, faction consequences, multiple endings, and soft-roguelite replayability.

The public title remains **MORROWMERE**. The first campaign is presented as **Chronicle I — The Black Banner**. The Android application ID remains `com.morrowmere.game`.

Chronicles II–V are reserved as later expansions. Their titles and content are deliberately deferred. Chronicle I must have a satisfying ending while leaving one restrained continuation hook.

The game is offline-first. Story, combat, saves, art, music, sound effects, and downloaded voice assets work without a network connection. Advertising is optional and must never block play.

## Design pillars

1. **A clear epic adventure.** The story begins with an understandable escort job and becomes more complex chapter by chapter. Prose is concrete and direct, with occasional poetic or unusual moments rather than constant abstraction.
2. **Authored meaning, procedural journeys.** Major story beats are fixed and ordered. Routes, side quests, combat, companions, loot, merchants, and callbacks vary between runs.
3. **Demanding but fair play.** Combat rewards preparation and correct tactical decisions. Companions and advertising do not trivialize difficulty.
4. **Choices that return later.** Important decisions affect later scenes, alliances, companion loyalty, chapter outcomes, and epilogues.
5. **Premium mobile readability.** Art supports the text rather than competing with it. Titles, menus, story copy, inventory, and defeat actions remain legible on small Android screens.
6. **A consistent MORROWMERE identity.** New art extends the approved bright hand-painted medieval look. It does not imitate a named studio, film, franchise, or living artist.

## Narrative direction

The kingdom has survived eighteen years without a monarch. Border towns depend on strained truces, local soldiers, merchants, and competing institutions. Goblin attacks and banditry are common, but an organized faction is planting false evidence to provoke a human–orc war.

The player accepts a simple job escorting two wagons of medicine to Greywatch. A goblin ambush reveals royal-armory weapons and an orc banner placed too neatly beside a dead officer. The player carries a wounded witness and a sealed order into a conspiracy that reaches the Crownless Keep.

Marshal Severin Voss is Chronicle I's central antagonist. He is not a destructive madman. He believes only a manufactured border war and emergency coronation can force the fractured kingdom to unite. His methods are brutal, but his diagnosis of the kingdom's weakness is credible. The finale must therefore create a difficult political and moral decision rather than a simple good-versus-evil execution.

Fantasy remains grounded: goblins, orcs, mages, relics, old fortresses, curses, and monsters exist, but the main plot is driven by recognizable motives such as fear, ambition, loyalty, hunger, family, and political control. Strange supernatural events appear occasionally and become more important only in later chapters.

## Chronicle structure

| Chapter | Level band | Main purpose |
| --- | --- | --- |
| **1. The Greywatch Road** | 1–2 | Escort medicine, survive the goblin ambush, rescue the witness, and discover the first false evidence. |
| **2. Raiders at Dawn** | 2–4 | Defend Greywatch, investigate royal weapons, and decide which local leaders receive the evidence. |
| **3. The Drowned Road** | 4–6 | Carry evidence through flooded borderland, meet orc envoy Rukhar, and learn that both sides are being manipulated. |
| **4. Banners at Redwater** | 6–8 | Prevent or shape a human–orc battle while false attacks and divided loyalties escalate. |
| **5. The Embervault Conspiracy** | 8–10 | Enter the mines and hidden armory, trace the supply network, and prove Voss funded both sides. |
| **6. The Broken Oath** | 10–12 | Face a betrayal caused by a hostage threat and survive the siege of Greywatch. Caldus carries the core leak if present; an authored supporting character fills the role if he was never recruited. |
| **7. March on Crownless Keep** | 12–14 | Build a coalition from previous choices, cross hostile territory, and assault or infiltrate the keep. |
| **8. The False Coronation** | 14–15 | Confront Voss, expose or redirect the conspiracy, decide who controls the keep, and resolve the border war. |

Each chapter contains several expeditions separated by camps or safe hubs. A first completion should take 10–12 hours without requiring repetitive grinding.

The final epilogue resolves the central conflict and then reveals one encrypted letter indicating that Voss had a higher patron. This is the only required expansion hook.

## Opening story cinematic

The premium cinematic treatment applies specifically to the opening story/prologue. Ordinary events use unique still illustrations with restrained motion, and chapter transitions use concise premium title cards rather than long cinematics.

The opening lasts approximately 90–120 seconds and uses 12–14 original hand-painted shots with layered 2.5D parallax, controlled camera moves, focus changes, moving cloth and banners, lighting transitions, impact cuts, music, sound effects, narration, and a small number of deliberate haptic cues. Its direction should feel theatrical and emotionally expressive while remaining recognizably MORROWMERE. It is an animated storybook sequence, not frame-by-frame feature animation.

The approved narration is:

> The job should have taken three days. Escort two wagons of medicine north to Greywatch, collect your pay, and leave before the border frost. In Morrowmere, that counts as honest work.
>
> The kingdom has lived eighteen years without a king. Its roads belong to toll collectors, deserters, and anything strong enough to hold a blade. Goblin raids are common. Orc patrols stay west of Redwater. Everyone knows where the danger lies.
>
> Until this morning.
>
> The first arrow kills the driver. The second carries the mark of the royal armory. When the attackers retreat, they leave an orc banner beside a dead officer—as if they want the truth found too quickly.
>
> Someone is preparing a war.
>
> You have no title, no army, and no lord to protect you. You have one wounded witness, one sealed order, and a road that now leads straight to Greywatch.
>
> By nightfall, half the border will want what you carry.
>
> This is where your chronicle begins.

The storyboard covers dawn over the fractured kingdom, the medicine caravan, the player introduction, distant Greywatch, an abandoned border checkpoint, the first arrow, the goblin attack, the player's response, the royal-armory mark, the false orc banner, the wounded witness and sealed order, enemy riders searching the road, the final approach to Greywatch, and the title reveal.

The sequence supports pause, skip, and replay. Text captions remain available even when voice is disabled.

## Authored content volume

Chronicle I targets 332 authored event scenes:

- 56 ordered main-story scenes.
- 64 companion, loyalty, faction, and consequence scenes.
- 140 travel, investigation, side-quest, dungeon, and moral-choice scenes.
- 48 random-combat encounter templates with variable enemy compositions.
- 24 merchant, camp, healing, and character-development scenes.

A first completion sees approximately 150–180 scenes. Alternate routes and repeat runs prioritize unseen material. All prose and choice outcomes are authored and edited in English; the runtime never generates free-form AI prose.

Narrative copy uses short paragraphs, explicit subjects, concrete actions, and understandable consequences. New proper nouns are introduced gradually. Occasional lyrical lines are reserved for chapter openings, relics, visions, and major emotional scenes.

## Epic spine and procedural journeys

Every chapter has immutable main-story anchors. Between anchors, the player chooses routes such as:

- **The King's Road:** lower immediate danger, tolls, soldiers, and better merchant access.
- **The Old Forest:** stronger companion and exploration opportunities with ambush risk.
- **The Ruined Pass:** difficult fights, relics, hidden evidence, and fewer recovery opportunities.

The procedural director selects from eligible authored events using chapter, region, level, route, faction standing, companion and loyalty state, inventory tags, prior decisions, unresolved hooks, tension, threat, and persistent seen-event history.

Director rules:

- No identical event appears twice in one run.
- Recently seen event families receive a multi-run cooldown.
- Unseen eligible events receive priority without overriding story coherence.
- Main-story anchors cannot be skipped by randomness.
- Important choices create typed callback promises with a due chapter or scene window. The director reserves space for them instead of hoping they appear randomly.
- Tension pacing prevents endless strings of battles, merchants, or quiet scenes while preserving dangerous stretches where narratively appropriate.
- A threat meter governs random encounters. Travel choices and event consequences raise or lower it; combat is not triggered by an unbounded coin flip.
- Main-story and relationship choices resolve deterministically. Tactical side events may use a visible skill check with the relevant stat and risk shown before confirmation.
- Seed and random-generator state are saved after every state change. Closing the application cannot reroll a choice, attack, reward, or merchant stock.
- A defeat restores the latest camp snapshot and creates a new expedition route seed. A deliberate Restart Chapter restores the chapter-entry snapshot and generates a new chapter route.

Each event definition declares a stable ID, chapter and region eligibility, family, type, illustration ID, title, narrative blocks, prerequisites, exclusions, weight, cooldown, choices, requirements, checks, effects, flags, callback promises, follow-ups, encounter reference, audio cues, optional voice clip, and one-shot behavior. A build-time validator rejects invalid references and unreachable mandatory content.

## Companions

Only one companion is active in combat at a time. A companion supplies one situational passive, one exploration capability, and one battle command with a meaningful cooldown. Companions create tactical options rather than acting as a second full-damage hero.

Each companion has qualitative loyalty states, three personal quests, camp conversations, explicit values, and authored outcomes. Exact loyalty numbers are not shown; the journal communicates states such as Wary, Respectful, and Loyal. A companion may leave, betray, reconcile, become injured, or die only because of visible player decisions, never from an unexplained random roll.

Recruitment requires a multi-step journey rather than a single button:

| Companion | Recruitment path |
| --- | --- |
| **Mara Vey** | Protect Greywatch civilians, expose a military betrayal, and surrender a valuable short-term reward to help her surviving scouts. |
| **Rukhar Stonehand** | Spare or rescue an orc courier, prevent retaliation, carry credible peace evidence, and demonstrate that the player will accept political cost for peace. |
| **Brother Caldus** | Protect refugees, uncover the hostage leverage used against him, keep his confidence, and complete a dangerous rescue. |
| **Lyra Arden** | Collect royal seals, share evidence, respect her expertise, and stop her from using dangerous magic as an easy solution. |
| **Talla Quickhand** | Spare a goblin courier, honor a secret bargain, locate her people without exposing them, and reject a profitable betrayal. |

A critical wrong decision can close recruitment for that run. Smaller mistakes may be repaired only through a harder or more costly event chain. Failure opens alternate scenes and rewards rather than blocking the main campaign.

## Branching and endings

The principal branch axes are conspiracy evidence, Greywatch's condition, human–orc peace or war, companion loyalty and survival, faction standing, and control of Crownless Keep.

The four main endings are:

- **The Banner Broken:** Voss is exposed and his war mechanism is dismantled, but the kingdom remains politically fragile.
- **The Iron Peace:** a forceful settlement stops immediate war at a lasting moral and political cost.
- **Council of the Road:** a difficult coalition creates shared rule between border powers.
- **The War Without End:** the conspiracy is only partly stopped and open war consumes the border.

Approximately 24 epilogue variants combine the main ending with Greywatch, each companion, faction relationships, evidence, and the keep's final custodian. Ending resolution uses accumulated state rather than only the last dialogue choice.

## Core loop and soft-roguelite structure

1. Return to camp, bank expedition rewards, heal or prepare, review quests, select equipment, and choose an active companion.
2. Select a route with readable risk and opportunity cues.
3. Resolve story events, investigation, skill checks, merchants, and combat.
4. Manage health, class resource, consumables, temporary boons, unbanked gold, and inventory capacity.
5. Reach the next camp or authored story anchor and secure the expedition's gains.
6. On defeat, return to the last camp with permanent growth intact but expedition losses applied.
7. Complete chapter decisions, advance the level band, and unlock new routes, items, enemies, and relationship content.

Permanent progression includes level, XP, banked equipment, codex discoveries, completed story state, and secured companion progression. Temporary boons, unbanked loot, and newly found expedition consumables are lost on defeat. The initial balance target removes 50% of unbanked gold; this number may be tuned within a narrow range without changing the design.

Repeated farming of the same encounter family gives diminishing XP and cannot over-level the player beyond the current chapter's soft band. Story and quest progress remain the primary progression source.

## Level and class progression

The level cap for Chronicle I is 15. Chapter level bands guide encounter budgets but do not hard-scale every enemy to the player. Equipment and good preparation must create a noticeable advantage.

Warrior, Mage, and Warden remain the playable classes. Their class resource may share one internal representation while using class-specific presentation:

- **Warrior:** Stamina, reliable Guard, physical control, Cleave, and Riposte.
- **Mage:** Mana, high sorcery damage, elemental status effects, Witchfire, and Sigil Ward.
- **Warden:** Focus, ranged precision, traps, marked targets, Field Remedy, and flexible survival.

Levels grant modest stats and ability upgrades. Levels 3, 6, 9, 12, and 15 provide a class talent choice. Talent branches offer offense, defense, and utility; no mandatory encounter requires one exact build.

## Tactical combat and difficulty

The default balance is intentionally challenging. A normal turn offers Attack, Guard, Technique, Consumable, Companion Command when available, and Flee where fiction permits.

Attack resolution supports Hit, Miss, Critical Hit, Glancing Hit, Blocked, and Parried outcomes. Accuracy, evasion, equipment, status, skills, and enemy intent affect the result. Normal-build accuracy generally remains between 75% and 95%; exceptional debuffs may push it lower. Critical chance has controlled caps. Near misses may become reduced-damage glancing hits. A small bad-luck guard prevents an unreasonable chain of ordinary misses while preserving real risk.

Regular enemies telegraph their primary intent. Elites and bosses may add a secondary condition or phase mechanic, but the player always receives enough information to make a meaningful decision. Enemy roles include defenders, assassins, archers, shamans, controllers, summoners, commanders, and specialist monsters. Bosses use authored phases, reaction rules, and anti-cheese mechanics instead of inflated health alone.

Encounter difficulty uses chapter budgets, region, route danger, enemy role synergy, recent resource pressure, and a bounded response to effective player power. It must not erase the value of upgrades, and it must not become easy merely because a companion is present. Mid- and late-game encounters assume the player may have one companion.

Consumables are usable inside and outside combat. Using one in combat spends the turn; using one outside combat does not. No rewarded advertisement grants resurrection, direct combat power, XP, companion access, or exclusive equipment.

Defeat always presents clear actions: Return to Last Camp, Restart Chapter, and Main Menu. No defeat state may leave the player without a visible way forward.

## Enemies

The bestiary retains at least 200 mechanically distinct enemies. The current 20-archetype-by-10-rank catalog is expanded with role behavior, encounter composition rules, status interactions, region eligibility, clearer descriptions, and more visual variety.

Approximately 80 distinct enemy portraits support the 200+ entries. Important elites and bosses receive an additional 15 dedicated illustrations. Rank presentation may vary armor, weapons, markings, pose crops, and frames, but an entry must not depend only on a dark tint or noisy overlay to look different.

Enemy composition is selected by a threat budget and authored compatibility tags. Combinations that create unavoidable turn-one defeat, permanent control loops, or impossible damage checks are rejected by validation.

## Items, inventory, and equipment

The current 60-item catalog grows by 100 authored items to a target of 160:

- 24 weapons.
- 20 armor pieces.
- 16 charms and relics.
- 24 potions and other consumables.
- 8 scrolls and field tools.
- 8 quest or faction artifacts.

The existing equipment model remains readable: one weapon, one armor, and two charm slots. The Equipment page shows equipped items, available alternatives, class restrictions, stat differences, and concise effect explanations. Equip and unequip actions must never silently discard an item.

The field inventory targets 24 slots. Stackable consumables share a slot, equipped items do not occupy field capacity, and quest items do not block ordinary loot. Camp provides a larger stash. Inventory actions are Compare, Equip, Unequip, Use, Move to Stash, Sell where available, and Discard with confirmation.

Powerful items are gated by some combination of chapter, level, reputation, quest completion, or specialist merchant access. Additional gold improves flexibility but cannot buy endgame equipment in Chapter 1.

## Merchants and economy

The game includes six merchant identities:

- Road Trader.
- Blacksmith.
- Apothecary.
- Relic Dealer.
- Quartermaster.
- Goblin Broker.

Stock, price, rarity, art, and dialogue are seeded by region, chapter, level, faction reputation, and prior deals. Merchants support buy, sell, compare, use, and equip flows. Sell value begins around 40% of base value and is modified within clear limits by reputation and scarcity. Merchant restocks happen at authored transitions, not every reopen.

Approximately 24 merchant and camp illustrations are included in the event-art count. A merchant never appears as a generic dark silhouette.

## Advertising and balance

Advertising is optional and separated from progression gates.

**Rewarded:** Normal battle rewards are granted immediately. After an eligible victory, the player may choose **Watch Ad — Double Battle Gold**. Only ordinary battle gold is doubled; XP, boss rewards, story rewards, items, and faction gains are excluded. There is one claim opportunity per eligible victory and a limited number of offers per expedition. Declining or failing to load an ad never reduces the base reward.

**Interstitial:** May appear only after returning safely to camp, after several completed encounters, with at least approximately 20 minutes since the previous interstitial. It never appears during the opening, narration, a story choice, battle, defeat, boss sequence, directly after rewarded video, or at an emotionally important reveal.

**Banner:** Uses reserved layout space only on Home, Camp, Journal, and Merchant. It never covers prose, art focal points, navigation, inventory actions, or choice buttons.

Development and automated checks use Google's test ad IDs. Live IDs are release configuration. The Android integration uses the Capacitor community AdMob plugin compatible with the project's Capacitor generation, together with the required consent/privacy flow. No relevant ad request is made before consent resolution. Offline state, consent refusal, or ad errors leave the complete game playable.

The intended persistent AdMob resources are:

- App: `MORROWMERE`, package `com.morrowmere.game`.
- Banner: `morrowmere_android_banner_safehub`.
- Rewarded: `morrowmere_android_rewarded_battle_gold`.
- Interstitial: `morrowmere_android_interstitial_expedition_break`.

Creating these external resources requires a final action-time confirmation immediately before submitting the AdMob forms.

## Illustration direction and asset volume

The approved MORROWMERE theme is the source of truth: bright high-key medieval adventure illustration, painterly gouache or storybook finish, large readable forms, expressive characters, clean silhouettes, warm open shadows, and restrained parchment, limestone, burgundy, dusty blue, forest green, and brass accents.

Target deliverable visuals:

- Approximately 332 event illustrations, one mapped to each event scene.
- 100 new item icons.
- Approximately 80 enemy portraits.
- 15 dedicated elite and boss illustrations.
- Reference art for recurring companions, Voss, faction leaders, the witness, and recurring merchants.
- More than 500 final visual assets in total.

Existing approved MORROWMERE art may remain when it fits the exact event. Unrelated events must not reuse one generic plate. Recurring characters use reference sheets so faces, age, clothing, weapons, and color accents remain consistent.

Production constraints:

- No film grain, speckles, scanlines, scratches, random streaks, heavy vignette, muddy blacks, crushed silhouettes, meaningless particles, embedded lettering, signatures, or watermarks.
- No generated text inside artwork. Titles and labels are real UI text.
- Night, cave, and dungeon scenes use motivated moonlight, firelight, magic, or reflected light so subjects and routes remain clear.
- Composition reserves safe areas for the portrait mobile interface and does not place every focal face beneath the text panel.
- Event art uses the existing 1536×1024 WebP convention unless a measured device or bundle-size constraint justifies a documented change.
- Contact sheets, luminance reports, and representative full-resolution review reject dark or noisy output. A mean-luminance target near or above 120/255 is the default, while visual focal clarity remains the deciding criterion.
- Runtime animation uses restrained pan, zoom, parallax, focus, and crossfade. Ambient particle layers are excluded.

An asset manifest maps every event, item, enemy, portrait, cinematic shot, sound, and voice clip to an existing file. Missing or duplicate mappings fail the content build.

## Music, sound effects, voice, and haptics

The release targets 12 original or commercially licensed music themes covering title, camp, merchant, road, Greywatch, forest, Redwater, Embervault, siege, Crownless Keep, final confrontation, and ending. Exploration, tension, combat, and boss states crossfade cleanly instead of restarting a track for every event.

The oscillator-tone implementation is replaced with approximately 70–90 file-backed SFX. Categories include weapon families, arrows, shields, blocks, parries, misses, critical impacts, armor, elemental magic, healing, curses, enemy vocal reactions, loot, gold, merchant actions, equipment, consumables, level-up, victory, defeat, pages, buttons, confirmations, warnings, and transitions. Repeated actions rotate through variants.

The opening uses the approved narrator profile **Eldrin — Crisp British Baritone**, replacing the old George direction. The intended delivery is natural, controlled, grounded, and appropriate for a medieval thriller. Approximately 24 major story moments and selected companion turning points receive voice excerpts. Important recurring characters may use distinct stable voice profiles. All dialogue remains readable as text, and voice can be paused, skipped, replayed, or disabled. Music ducks under speech.

Voice generation uses the provided ElevenLabs credential only as a local production secret. The key must never be echoed into logs, committed, placed in a client environment variable, embedded in the web bundle, or shipped in the APK. Generated audio and a non-secret manifest are the only deliverables added to the project.

Haptic patterns are deliberate:

- Light touch for ordinary UI and event confirmation.
- Medium impact for a normal attack.
- Minimal feedback for a miss.
- Two short taps for block or parry.
- One strong short impact for a critical hit.
- Heavy pulse for major player damage.
- Distinct restrained patterns for magic, major story decisions, level-up, and defeat.

Haptics, music, SFX, and voice have independent settings. Reduced Haptics and Reduced Motion are supported. Application backgrounding pauses or fades active audio safely.

All music, SFX, and voice files must be original, project-owned, or licensed for commercial distribution and Google Play use.

## Splash, onboarding, and interface

First-launch flow:

1. A short bright MORROWMERE splash with a fully visible responsive title.
2. Concise audio and haptic preference controls.
3. The narrated opening story cinematic.
4. Class selection with readable ability previews.
5. Choice guidance embedded in the first road event.
6. Combat guidance embedded in the goblin ambush.
7. Loot, consumable, inventory, and equipment guidance after victory.
8. Immediate continuation into Chapter 1 without a long manual.

Tutorial prompts are skippable and replayable from Journal. Ad consent must not interrupt the dramatic opening; no ad is requested during onboarding.

The interface targets 360×800 CSS pixels and must remain functional at narrower supported Android widths. It respects display cutouts, status bars, navigation bars, font scaling, and safe-area insets.

- Main body text defaults to approximately 17–18 CSS pixels with generous line height.
- Story text sits on a strong solid or controlled gradient panel; readability never depends on the background image being dark.
- Choice and action targets are at least 48 CSS pixels high.
- Decorative type is limited to titles; body text and controls use a highly legible face.
- Long choices, item names, and localized system messages wrap or scroll rather than clipping controls.
- Health, resource, enemy intent, status, and currency do not depend on color alone.
- Title, Home, Inventory, Equipment, Merchant, Journal, Settings, Reward, and Defeat layouts must not crop their headings.

Settings include text scale, high contrast, reduced motion, reduced haptics, haptics on/off, SFX level, music level, voice level, voice replay behavior, and captions.

## Persistence, restart, and recovery

The application retains three campaign slots. Each slot is a continuously saved campaign, not a set of quick-load snapshots for rerolling choices.

State is separated conceptually into:

- **Profile/meta:** settings, codex, seen-event history, achievements, and expansion availability.
- **Campaign:** chronicle, chapter, level, XP, banked gold, equipment, stash, companions, loyalty, factions, evidence, and story flags.
- **Expedition:** current route, HP and resources, temporary boons, unbanked gold and loot, merchant stock, encounter state, and RNG state.
- **Chapter snapshot:** the exact campaign state at chapter entry for deliberate Restart Chapter.

Every choice, combat turn, item use, reward, transaction, equipment change, camp action, and transition autosaves. The app also saves on backgrounding. **Save & Exit** flushes the latest state and returns to the title screen.

Each active save has a rolling backup and checksum or equivalent integrity metadata. Loading validates and migrates schema versions. A corrupt active save attempts recovery from the backup and preserves the bad payload under a recovery key.

The current schema-v1 vertical-slice campaign cannot be mapped safely to the new story. Migration preserves settings and eligible discoveries, archives the old payload for recovery, and starts Chronicle I at Chapter 1 after a clear one-time message. It does not silently invent story decisions.

## Technical architecture

The current React, TypeScript, Vite, and Capacitor 8 foundation remains. Pure domain modules own seeded randomness, the narrative director, combat, progression, loot, merchants, companions, endings, chapter snapshots, and save migration. React renders state and dispatches typed commands.

Large content catalogs are data-driven and validated at build time. Event definitions, chapters, dialogue, choices, enemies, items, merchants, companions, voice references, and asset manifests are split by domain and chapter so they remain reviewable. Generated indexes provide efficient runtime lookup without a network request.

The audio manager uses separate music, SFX, and voice buses, pools frequently used battle sounds, and persists volume settings. Native lifecycle and haptic integrations are isolated behind adapters with safe browser fallbacks. AdMob is similarly isolated so web preview and offline gameplay do not depend on a native plugin.

Artwork is lazy-loaded and limited to the current scene plus a small look-ahead cache. Old large images are released. The cinematic loads its shot bundle before playback and falls back to a readable static prologue if an asset fails. Audio failure never blocks text progression.

All core Chronicle I assets are bundled for offline use. If measured Android bundle size becomes impractical, Play Asset Delivery may download the Chronicle I media pack once while keeping the initial app and first-launch fallback functional. This decision must be based on the measured release bundle, not assumed in advance.

## Error handling

- Invalid content, missing asset references, duplicate IDs, impossible mandatory prerequisites, invalid callback windows, and illegal encounter groups fail the content validation command.
- Invalid reducer commands leave state unchanged and return a typed diagnostic in development.
- Rendering failures display Reload, Return to Title, and safe recovery actions without deleting saves.
- Save failures remain visible until resolved and offer export where supported.
- Missing art uses a branded bright parchment fallback and is treated as a release blocker.
- Missing SFX or voice continues silently with text and is reported during development.
- Ad load, consent, or network failures dismiss cleanly without removing earned rewards or trapping navigation.
- Defeat, cinematic skip, Android back, and application backgrounding always have explicit deterministic behavior.

## Focused verification and acceptance

Verification is deliberately targeted rather than an exhaustive 10–12 hour automated playthrough.

1. Production web and Android builds complete successfully.
2. A content validator confirms the required event counts, 160 items, at least 200 enemies, unique stable IDs, reachable main anchors, valid callbacks, valid merchant stock, and complete asset mappings.
3. Focused domain checks cover seeded reproducibility, hit/miss/critical/glancing/block/parry outcomes, consumables in and out of combat, companion command cooldowns, defeat loss, rewarded-gold isolation, chapter restart, and save migration.
4. One compact mobile visual smoke pass covers Title, opening, Story, Combat, Inventory, Equipment, Merchant, Reward, Defeat, and Settings at 360×800, plus a narrow-width title and action check.
5. Representative art contact sheets and luminance reports confirm the retained MORROWMERE theme and reject grain, dots, streaks, crushed shadows, embedded text, and unclear subjects.
6. A short device or emulator pass confirms music/SFX mixing, voice ducking, haptic cues, background save, Android back behavior, consent flow, and Google test ads.
7. The opening cinematic is watched once end to end and checked for readable captions, clean shot transitions, synchronized narration, music, SFX, skip, pause, and replay.
8. A release APK installs and resumes a saved expedition. The Play Store AAB is generated from the same approved content.

## Delivery target

Implementation handoff includes:

- An installable Android APK for direct review.
- A Play Store AAB.
- The complete source and versioned content catalogs.
- Chronicle I with eight chapters and 10–12 hours of intended first-run play.
- Approximately 332 event illustrations and more than 500 total visual assets while preserving the approved MORROWMERE theme.
- 160 items, 200+ enemies, companions, merchants, combat expansion, music, SFX, haptics, selected voice-over, save/restart behavior, and restrained AdMob placements.
- Asset, audio, voice, and content manifests.
- A concise release checklist identifying any external Play Console, privacy-policy hosting, signing, or final AdMob actions that still require the account owner's confirmation.

## Deliberate exclusions

- Chronicles II–V content.
- Runtime AI prose or image generation.
- Accounts, multiplayer, cloud saves, live-service quests, and server-authoritative progression.
- Paid currency, energy timers, loot boxes, rewarded resurrection, or ad-exclusive power.
- Full frame-by-frame character animation for every event.
- Direct imitation of Studio Ghibli, another studio, a franchise, or a living artist.
- Automatic creation or submission of irreversible Play Console or AdMob resources without action-time confirmation.
