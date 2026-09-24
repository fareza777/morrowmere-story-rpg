# Morrowmere Journey and Battle Art Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a large, consistent set of scene-specific Morrowmere illustrations for all chapter delves, route choices, Road Tactics revisions, and every battle encounter.

**Architecture:** Build a canonical art inventory from authored scenes, dungeon nodes, and encounter IDs before generation. Use built-in ImageGen one distinct call per asset, review every image for subject/style/composition, convert approved outputs to the project's exact WebP contract, then validate that every content identity resolves to one unique packaged file.

**Tech Stack:** Built-in `image_gen` tool (one call per asset; no CLI fallback), generated raster art, existing `sharp` dependency for format/size preparation, WebP, Node media validation, Vite static assets, Android size gate.

**Spec:** `docs/superpowers/specs/2026-09-24-morrowmere-roguelike-dungeon-overhaul-design.md`

## Global Constraints

- Create at least 110 distinct, scene-specific images for the first overhaul wave, before counting battle scenes for newly added dungeon encounters (expected range: 110–124).
- All images follow the approved Morrowmere look: bright, readable painterly gouache/storybook fantasy; parchment, limestone, burgundy, dusty blue, forest green, and restrained brass; strong focal silhouettes and open shadows.
- Every unique encounter receives a dedicated generated battlefield illustration that shows its actual enemy group in a grounded, attractive location—not just floating/pasted enemy portraits, a blank arena, or the existing character portrait placed behind the UI.
- Study approved in-game art first and turn its palette, brushwork, and lighting into a concise written style anchor for new prompts; each new image must still depict its own scene rather than copy an existing composition.
- Follow each asset's existing aspect-ratio, crop, format, size, attribution, and manifest conventions; keep the Android package-size limit intact.
- Use built-in ImageGen one distinct call per image; never use `n` as a substitute for distinct prompts or switch to CLI/API.

## Review Focus

1. An encounter prompt must show every correct enemy species/role in a chapter-appropriate place, not a generic warrior or a mismatched boss; pin this in the inventory review before generation.
2. Repeated generated compositions must not turn into near-duplicate scenes across encounters; compare camera, focal point, action, and staging in the per-chapter review sheets.
3. Important enemy designs must remain identifiable when art is rendered as a mobile battle stage; inspect all battle plates at the app's crop and 360px display width.
4. Missing, wrong-dimension, malformed, too-small, or byte-identical WebP files must fail validation; pin each rule in `scripts/media/validate-scene-art.mjs` and its media test.
5. A complete media wave must not exceed the Android package-size cap; run the existing size checker after compression and reject over-budget output.

---

## File map

- Create: `docs/superpowers/art/2026-09-24-morrowmere-art-inventory.md` — exact ID, source scene/enemies, prompt brief, target path, review status, and integration status for every asset.
- Generate/copy to: `public/assets/chronicle1/battles/<encounterId>.webp` — one full battlefield composition for every registered encounter and each new dungeon encounter.
- Generate/replace only inventory-approved files in: `public/assets/chronicle1/scenes/ch01` … `ch08` — Road Tactics scene refreshes and chapter-dungeon room plates.
- Generate to: `public/assets/chronicle1/travel/route-node-<kind>.webp` — four distinct route-node illustrations for story/event, battle, rest/supply, and dungeon/elite.
- Create: `scripts/media/prepare-generated-art.mjs` — loss-aware conversion of reviewed ImageGen PNG outputs to the exact WebP size/quality contract, using the already-installed `sharp` dependency.
- Modify: `scripts/media/validate-scene-art.mjs` — validate every scene in the expanded content catalog, all battle paths, dungeon/route assets, dimensions, bytes, and unique hashes alongside the existing four travel-action checks.
- Modify/create: `tests/media/battle-art.test.ts` and the existing `tests/media/road-tactics-art.test.ts` — validate identity-to-path coverage and no duplicates.
- Read: `src/game/content/chronicle1/media-contract.ts`; its scene list is assembled from chapter scene catalogs, and the route/dungeon plan owns adding new scene definitions.
- Do not change `src/game` art references here; the tactical combat and route/dungeon plans own the content IDs and UI consumers.

## Interfaces shared with other plans

- The tactical combat plan consumes battle files named exactly by current `EncounterDefinition.id` under `public/assets/chronicle1/battles/`.
- The route/dungeon plan consumes scene art by exact `chapterId/illustrationId` paths and may add more battle encounter IDs; add every such ID to this inventory before producing that encounter's art.
- All art IDs/paths must be present in one inventory before final validation; art cannot be referenced solely from the default generated-image folder.

### Task 1: Build the canonical scene/enemy art inventory

**Files:**
- Create: `docs/superpowers/art/2026-09-24-morrowmere-art-inventory.md`
- Read: `src/game/content/chronicle1/media-contract.ts`
- Read: `src/game/content/chronicle1/enemies/encounters.ts`
- Read: `src/game/content/chronicle1/enemies/ranked.ts`
- Read: `src/game/content/chronicle1/enemies/bosses.ts`
- Read: `src/game/content/chronicle1/chapters/ch01` through `ch08`

- [ ] **Step 1: List all 57 current encounter IDs** in chapter order, along with their exact enemy IDs, roles, species, encounter `counterplay`, and story/dungeon location. Include future encounter IDs only after the dungeon plan authors them.
- [ ] **Step 2: List the 16 currently mismatched Road Tactics illustration IDs** from the chapter road-tactics catalogs and identify each scene's actual title/narrative so replacements cannot drift from canon.
- [ ] **Step 3: List every new chapter-dungeon room illustration** by exact `chapterId`, event/room ID, room action, and any enemy/encounter IDs; budget 3–5 room images for compact chapters and 12 for Embervault, adding images when authored room count requires them.
- [ ] **Step 4: Add the four route-node IDs** `route-node-story`, `route-node-battle`, `route-node-supply`, and `route-node-dungeon` with a distinct focal shape/composition for each.
- [ ] **Step 5: For every inventory row, record target path, full prompt text, 1536×1024 landscape framing, scene-specific subject, palette/lighting cue, and avoid list.** Derive enemy anatomy/clothing/gear from the exact enemy content; do not invent a second visual identity.
- [ ] **Step 6: Review the inventory against the approved design spec** and commit as `docs: inventory overhaul art assets` before large-scale generation.

### Task 2: Generate chapter journey and road illustrations

**Files:**
- Generate: exactly the 16 inventory-listed Road Tactics replacement files under their existing `scenes/chXX` IDs.
- Generate: at least 3–5 unique room illustrations per compact dungeon in Chapters 1–4 and 6–8.
- Generate: 12 distinct Chapter 5 Embervault room illustrations.
- Generate: four route-node illustrations under `public/assets/chronicle1/travel/`.
- Update: the art inventory statuses and output locations.

- [ ] **Step 1: Use one built-in ImageGen call per listed asset**, with a separate scene-specific prompt. Use one slug per prompt (`illustration-story` for authored story scenes; `stylized-concept` for environment, route, and battle-stage art). Keep the order: actual backdrop → actual story subject → painterly medium → camera/focal point → motivated readable light → approved palette → no text/UI/watermark.
- [ ] **Step 2: Group generation by chapter** so style and environmental logic can be reviewed together; keep all distinct room images distinct in setting geometry, focal point, camera distance, and action.
- [ ] **Step 3: Inspect every returned image** for correct scene, era, enemy/character count, readable mobile crop, color/style match, and no hallucinated text. Regenerate only failed assets with a narrowly targeted prompt change; retain the approved selected output and record its path.
- [ ] **Step 4: Do not replace any Road Tactics file until its exact row is marked approved** and its new illustration is visually confirmed against that scene's source copy.
- [ ] **Step 5: Commit each complete chapter group** (or the 16-road refresh group) separately so asset review can reject one group without losing unrelated assets.

### Task 3: Generate one integrated battlefield scene for each encounter

**Files:**
- Generate: `public/assets/chronicle1/battles/<encounterId>.webp` for each of the 57 registered encounters.
- Generate: one additional file at the same path convention for each new encounter created by the dungeon plan.
- Update: `docs/superpowers/art/2026-09-24-morrowmere-art-inventory.md`.

- [ ] **Step 1: Generate one distinct image per encounter ID** with a unique prompt assembled from its exact chapter region, location/story scene, enemy party, enemy roles, and counterplay text. For example, `enc-ch05-black-banner-forgemaster` must show its exact forgemaster and listed guards contesting a readable Embervault forge, with the counterplay moment visible in the staging; do not substitute a generic armored villain. The full enemy group must inhabit the location with coherent scale, perspective, light, and contact shadows.
- [ ] **Step 2: Stage action rather than a lineup:** depict the moment of the encounter (for example, a clearly telegraphed attack, defenders holding a passage, or the party's foes contesting a scene-specific objective) while keeping the actual enemies recognizable. Do not add unrelated heroes, props, text, or mechanics absent from the source.
- [ ] **Step 3: Review in encounter order** and reject any art that shows the wrong faction/species, duplicate boss, mismatched setting, portrait pasted over scenery, or near-identical composition to another encounter.
- [ ] **Step 4: Regenerate failed battle plates** with only the identified issue corrected; keep each approved file mapped to one encounter identity and record the final output path.
- [ ] **Step 5: Commit battle art by chapter** after each chapter's full encounter set is reviewed; include newly authored dungeon encounters after their IDs are stable.

### Task 4: Convert approved images and place project-bound assets

**Files:**
- Create: `scripts/media/prepare-generated-art.mjs`
- Write: only final inventory-approved `.webp` files under `public/assets/chronicle1/`.
- Modify: `docs/superpowers/art/2026-09-24-morrowmere-art-inventory.md`.

- [ ] **Step 1: Add a conversion script using the repository's installed `sharp` dependency** with explicit `--source <png> --out <project-relative.webp>` arguments. Validate that the destination stays under `public/assets/chronicle1/`, preserve/crop the focal subject into 1536×1024 without stretching, encode WebP at quality 88 (matching the existing enemy-art conversion convention), refuse to overwrite an existing file unless its exact replacement path is marked approved in the art inventory, and require every new output path to be inventoried.
- [ ] **Step 2: Convert each reviewed ImageGen output** and copy it into the exact project path; never leave a referenced image only under the generated-image output location.
- [ ] **Step 3: Record the generated asset's final project path and SHA-256** in the inventory; inspect converted WebP files at full size and the combat-stage crop before integration.
- [ ] **Step 4: Commit** conversion code and the approved asset group as `art: add chapter journey illustrations` or `art: add chapter battle stages`.

### Task 5: Extend art validation and package-size enforcement

**Files:**
- Modify: `scripts/media/validate-scene-art.mjs`
- Modify: `tests/media/road-tactics-art.test.ts`
- Create: `tests/media/battle-art.test.ts`

- [ ] **Step 1: Add failing media tests** for missing battle ID, wrong path, duplicate battle-art hash, wrong 1536×1024 dimensions, invalid WebP, under-32-KiB file, missing room art, and missing route-node art.
- [ ] **Step 2: Run `npm run test:run -- tests/media/road-tactics-art.test.ts tests/media/battle-art.test.ts`;** confirm the new coverage fails until assets and validator checks exist.
- [ ] **Step 3: Extend `validate-scene-art.mjs`** to load `CHRONICLE1_ENCOUNTERS` and the dungeon/route art inventory; remove the stale hard-coded 402 scene count and compare every scene catalog ID against `CHRONICLE1_MEDIA_CONTRACT.scenes`; retain the existing four travel action-card assets; include all new files in the duplicate SHA-256 scan.
- [ ] **Step 4: Run `npm run art:validate`** and require all content-referenced assets to exist at exact paths, be valid 1536×1024 WebP, exceed 32 KiB, and have unique hashes.
- [ ] **Step 5: Run `npm run check:android-size`** after all art groups are integrated; if over budget, lower WebP quality only through the conversion script and visually re-review affected assets before accepting.
- [ ] **Step 6: Commit** as `art: validate unique scene and battle assets`.

## Dependencies and order

Task 1 is first. Tasks 2 and 3 may be produced chapter-by-chapter after their exact content inventory is stable. Task 3's 57 existing battle plates can proceed while route/dungeon code is built; new dungeon battle plates wait for their encounter IDs. Task 4 follows visual approval. Task 5 and the combat plan's battlefield UI must land before final integrated media validation and the Android size gate.
