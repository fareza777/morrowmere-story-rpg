# MORROWMERE Chronicle I Media Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce, validate, compress, manifest, and integrate the complete Chronicle I media library while retaining the approved bright painterly MORROWMERE identity: 332 unique scene illustrations, 100 item icons, 80 enemy portraits, 15 boss illustrations, 14 opening-story shots with selected layers, 12 music themes, 84 clear SFX, and 32 selected English VO clips.

**Architecture:** Treat `content/manifests/chronicle1-media-contract.json` as the immutable ID queue. Raw generation stays outside the shipped tree; approved masters are normalized into task-specific WebP/audio formats, checked by deterministic validators and contact sheets, then indexed through generated manifests. Runtime consumers use stable media IDs and never provider URLs, secrets, or hand-written relative paths.

**Tech Stack:** OpenAI image generation through the `imagegen` skill, Node.js 26, Sharp for image inspection/encoding/contact sheets, FFmpeg/ffprobe for audio normalization and verification, ElevenLabs HTTPS production scripts for authorized VO and SFX, TypeScript 7, Vitest 4, Vite 8, WebP, AAC/M4A or MP3 where required by measured Android/WebView support.

**Spec:** `docs/superpowers/specs/2026-08-31-morrowmere-chronicle-i-black-banner-design.md`

## Global Constraints

- Preserve the existing approved MORROWMERE look: bright high-key medieval adventure, painterly gouache/storybook finish, large readable forms, expressive characters, clean silhouettes, warm open shadows, and restrained parchment, limestone, burgundy, dusty blue, forest green, and brass.
- Do not imitate Studio Ghibli, another named studio, a film, franchise, living artist, or copyrighted character design.
- No grain, speckles, scanlines, scratches, random streaks, heavy vignette, muddy blacks, crushed silhouettes, meaningless particles, signatures, watermarks, or generated lettering.
- Night/interior scenes require motivated readable light from moon, fire, magic, windows, or reflected surfaces.
- Scene art remains 1536×1024 WebP unless the measured bundle report records and justifies a different dimension for a whole asset class.
- Every one of the 332 scene IDs has one distinct illustration ID and one distinct shipped file.
- The premium 90–120 second layered treatment is only for the 14-shot opening story; ordinary scenes use restrained pan/zoom/focus/crossfade.
- Music, SFX, and VO are project-owned or commercially licensed for Google Play distribution; provenance is recorded for every file.
- The supplied ElevenLabs credential is a local production secret. It is never printed, committed, passed as a command-line argument, placed in a client environment variable, bundled, or shipped.
- Captions and story text remain complete when VO is absent or disabled; any audio failure fails open.
- The media plan does not create or submit external AdMob or Play Console resources.
- Before the first image-generation call, the executing main agent rereads the complete `imagegen` skill plus its required prompting references.

---

## File map

- `production/chronicle1/media/style-bible.md`: retained MORROWMERE palette, lighting, composition, character consistency, and rejection examples.
- `production/chronicle1/media/character-bible.json`: recurring character age, face, clothing, weapon, palette, and silhouette anchors.
- `production/chronicle1/media/visual-jobs.json`: exactly 541 logical visual jobs from the content contract.
- `production/chronicle1/media/audio-jobs.json`: 12 music, 84 SFX, and 32 VO briefs with durations and provenance requirements.
- `production/chronicle1/media/approvals.json`: contact-sheet approval state and justified luminance exceptions.
- `.media-work/chronicle1/`: ignored raw generations, intermediate WAV/PNG, temporary crops, and rejected variants.
- `public/assets/chronicle1/scenes/ch01` through `ch08`: 332 unique scene WebPs.
- `public/assets/chronicle1/items/`: 100 square item-icon WebPs.
- `public/assets/chronicle1/enemies/`: 80 portrait WebPs.
- `public/assets/chronicle1/bosses/`: 15 dedicated boss WebPs.
- `public/assets/chronicle1/opening/{shotId}/`: 14 base plates and 19 selected transparent depth layers.
- `public/audio/chronicle1/music/`: 12 loop-ready themes.
- `public/audio/chronicle1/sfx/`: 84 file-backed effects.
- `public/audio/chronicle1/voice/en/`: 8 opening narration clips plus 24 major-story/companion clips.
- `public/assets/chronicle1/media-manifest.json`: shipped non-secret image/audio manifest.
- `src/game/media/types.ts`: typed media records and runtime lookup contracts.
- `src/game/media/generated/chronicle1.ts`: generated static manifest index.
- `scripts/media/build-jobs.mjs`: expands the content contract into exact production queues.
- `scripts/media/prepare-image.mjs`: deterministic resize/crop/WebP encoder with safe-area metadata.
- `scripts/media/validate-images.mjs`: dimensions, bytes, alpha, luminance, duplicate hash, and missing/orphan checks.
- `scripts/media/build-contact-sheets.mjs`: labeled review sheets using real UI text outside artwork.
- `scripts/media/ingest-audio.mjs`: trim, normalize, transcode, and write provenance.
- `scripts/media/generate-elevenlabs-voice.mjs`: secret-safe TTS generation.
- `scripts/media/generate-elevenlabs-sfx.mjs`: secret-safe sound-effect generation.
- `scripts/media/validate-audio.mjs`: decode, duration, loudness, true-peak, silence, and loop checks.
- `scripts/media/build-manifest.mjs`: stable JSON/TypeScript manifest generation.
- `scripts/media/report-bundle.mjs`: per-class and total byte report with hard internal budgets.
- `tests/media/jobs.test.ts`: exact queue counts and stable IDs.
- `tests/media/images.test.ts`: file, dimension, uniqueness, brightness-report, and byte-budget checks.
- `tests/media/audio.test.ts`: exact cue counts, provenance, decode, duration, and secret-safety checks.
- `tests/media/manifest.test.ts`: complete references, no orphans, deterministic output, and pack groups.

## Locked media ledger

| Logical class | Count | Output convention |
| --- | ---: | --- |
| Scene illustrations | 332 | 1536×1024 opaque WebP, one per scene |
| New item icons | 100 | 512×512 transparent WebP |
| Enemy portraits | 80 | 1024×1024 transparent or clean-background WebP |
| Boss illustrations | 15 | 1536×1024 opaque WebP |
| Opening shots | 14 | 1536×1024 base WebP plus selected alpha layers |
| Music themes | 12 | loop-ready, normalized file-backed tracks |
| SFX | 84 | short normalized file-backed effects |
| VO | 32 | 8 opening segments plus 24 selected story/companion excerpts |

The 14 opening shots use 33 physical WebPs: 14 base plates; midground layers for shots `01, 02, 04, 06, 07, 08, 10, 12, 13, 14`; and foreground layers for shots `02, 06, 07, 08, 10, 11, 12, 13, 14`.

### Opening shot IDs

```ts
export const OPENING_SHOT_IDS = [
  'opening-01-fractured-kingdom', 'opening-02-medicine-caravan', 'opening-03-player-on-the-road',
  'opening-04-distant-greywatch', 'opening-05-abandoned-checkpoint', 'opening-06-the-first-arrow',
  'opening-07-goblin-attack', 'opening-08-player-responds', 'opening-09-royal-armory-mark',
  'opening-10-false-orc-banner', 'opening-11-wounded-witness', 'opening-12-enemy-riders',
  'opening-13-final-approach', 'opening-14-title-reveal',
] as const;
```

### Music IDs

```ts
export const MUSIC_IDS = [
  'music-title', 'music-camp', 'music-merchant', 'music-kings-road', 'music-greywatch', 'music-old-forest',
  'music-redwater', 'music-embervault', 'music-greywatch-siege', 'music-crownless-keep',
  'music-false-coronation', 'music-ending-road',
] as const;
```

### SFX allocation

| Group | Count | Required identities |
| --- | ---: | --- |
| Weapons/projectiles | 12 | 3 light sword, 2 heavy sword, 2 axe, 2 mace, bow release, arrow hit, arrow miss |
| Defense | 8 | 3 shield blocks, 2 parries, 2 armor hits, guard set |
| Magic | 12 | cast/impact pairs for fire, ice, lightning, ward, heal, and curse |
| Status | 8 | poison, bleed, burn, freeze, stun, cleanse, buff, debuff |
| Enemy reaction | 12 | hit/death for goblin, orc, human, beast, undead; boss roar; boss phase |
| UI/economy | 14 | tap, confirm, back, page, inventory, equip, unequip, consume, loot, coins, buy, sell, level-up, quest update |
| Narrative/combat | 12 | choice, warning, reveal, chapter title, camp arrival, victory, defeat, miss, critical, flee, door, coronation bell |
| Ambience | 6 | rain, forest, flood, forge, siege, keep |
| **Total** | **84** | |

---

### Task 1: Media contracts, dependencies, and deterministic validators

**Files:**
- Create: `src/game/media/types.ts`
- Create: `scripts/media/build-jobs.mjs`
- Create: `scripts/media/prepare-image.mjs`
- Create: `scripts/media/validate-images.mjs`
- Create: `scripts/media/validate-audio.mjs`
- Create: `scripts/media/build-manifest.mjs`
- Create: `tests/media/jobs.test.ts`
- Create: `tests/media/manifest.test.ts`
- Modify: `.gitignore`
- Modify: `package.json` and `package-lock.json` through the designated integration owner only

**Interfaces:**
- Consumes: `content/manifests/chronicle1-media-contract.json` from the content plan.
- Produces: `VisualJob`, `AudioJob`, `MediaManifest`, `npm run media:jobs`, `npm run media:validate`, and deterministic generated indexes.

- [ ] **Step 1: Write failing queue and secret-safety tests.**

```ts
it('expands the approved contract into exact media queues', async () => {
  const jobs = await loadVisualJobs();
  expect(countKinds(jobs)).toEqual({ scene: 332, item: 100, enemy: 80, boss: 15, opening: 14 });
  expect(jobs).toHaveLength(541);
  expect(new Set(jobs.map((job) => job.id)).size).toBe(541);
});

it('never serializes secrets or provider authorization', async () => {
  const serialized = JSON.stringify(await loadMediaManifest());
  expect(serialized).not.toMatch(/xi-api-key|ELEVENLABS_API_KEY|\bsk_[A-Za-z0-9_-]+/i);
});
```

- [ ] **Step 2: Run `npm test -- tests/media/jobs.test.ts tests/media/manifest.test.ts`; expect missing-module failures.**
- [ ] **Step 3: Add pinned `sharp` and `music-metadata` development dependencies, ignore `.media-work/` and `.env*.local`, implement the typed contracts below, and build stable jobs by sorted content IDs. The scripts accept paths and IDs but never secret values as command-line arguments.**

```ts
export interface MediaAsset {
  readonly id: string;
  readonly kind: 'scene' | 'item' | 'enemy' | 'boss' | 'opening-layer' | 'music' | 'sfx' | 'voice';
  readonly src: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly width?: number;
  readonly height?: number;
  readonly durationMs?: number;
  readonly pack: 'base' | 'chronicle1-a' | 'chronicle1-b';
  readonly provenanceId: string;
}
```

- [ ] **Step 4: Run the focused tests, `npm run media:jobs`, and `npm run build`; expect the job queue to pass even though file validation reports all media as missing.**
- [ ] **Step 5: Commit.**

```bash
git add .gitignore package.json package-lock.json src/game/media scripts/media tests/media/jobs.test.ts tests/media/manifest.test.ts
git commit -m "build: add Chronicle I media pipeline"
```

### Task 2: Lock the MORROWMERE style bible and generation queue

**Files:**
- Create: `production/chronicle1/media/style-bible.md`
- Create: `production/chronicle1/media/character-bible.json`
- Create: `production/chronicle1/media/visual-jobs.json`
- Create: `production/chronicle1/media/audio-jobs.json`
- Create: `production/chronicle1/media/approvals.json`
- Create: `tests/media/style-contract.test.ts`

**Interfaces:**
- Consumes: 541 logical jobs and Chronicle I cast/event metadata.
- Produces: one complete prompt/brief row per logical asset and stable recurring-character references for Mara, Rukhar, Caldus, Lyra, Talla, Voss, the wounded witness, six merchants, and faction leaders.

- [ ] **Step 1: Write a failing style-contract test.**

```ts
expect(VISUAL_JOBS).toHaveLength(541);
expect(VISUAL_JOBS.every((job) => job.prompt.includes('bright high-key medieval adventure'))).toBe(true);
expect(VISUAL_JOBS.some((job) => /Studio Ghibli|in the style of|film grain|scanline/i.test(job.prompt))).toBe(false);
expect(new Set(VISUAL_JOBS.filter((job) => job.kind === 'scene').map((job) => job.composition.focalSummary)).size).toBeGreaterThan(250);
```

- [ ] **Step 2: Run `npm test -- tests/media/style-contract.test.ts`; expect missing production-contract failures.**
- [ ] **Step 3: Write the style bible from the approved existing event plates, not from a named external style. Give every job a unique subject/action/location/camera/lighting brief, mobile text-safe region, focal point, character-reference IDs, exclusions, and output path. Approved existing art may be retained only when it depicts the exact new scene; record its original file hash and never assign it to a second scene.**

```json
{
  "id": "scene-ch01-main-the-first-arrow",
  "kind": "scene",
  "prompt": "MORROWMERE visual identity, bright high-key medieval adventure, painterly gouache storybook finish; a royal-fletched arrow strikes the medicine wagon driver at a stone bridge, shocked caravan guards turning toward a clear goblin ambush line, crisp readable silhouettes, open warm shadows, no letters or symbols rendered as text",
  "composition": { "aspect": "3:2", "focalPoint": [0.62, 0.42], "textSafeSide": "left", "focalSummary": "arrow impact and driver at right third" },
  "exclusions": ["grain", "speckles", "scanlines", "random streaks", "crushed blacks", "vignette", "embedded text", "watermark"]
}
```

- [ ] **Step 4: Run the style-contract test and `npm run media:jobs`; inspect the first, middle, and last 20 job briefs for repeated staging or contradictory character details.**
- [ ] **Step 5: Commit.**

```bash
git add production/chronicle1/media tests/media/style-contract.test.ts
git commit -m "docs: lock MORROWMERE media direction"
```

### Task 3: Produce scene art for Chapters 1–2

**Files:**
- Create: `public/assets/chronicle1/scenes/ch01/*.webp` (41 files)
- Create: `public/assets/chronicle1/scenes/ch02/*.webp` (42 files)
- Create: `production/chronicle1/media/contact-sheets/scenes-ch01-ch02-*.webp`
- Create: `tests/media/scenes-ch01-ch02.test.ts`

**Interfaces:**
- Consumes: the 83 approved chapter scene jobs and recurring-character references.
- Produces: 83 unique 1536×1024 WebPs with manifest metadata and approved contact sheets.

- [ ] **Step 1: Write a failing file/count/quality-report test for 41 Chapter 1 and 42 Chapter 2 IDs.**
- [ ] **Step 2: Run `npm test -- tests/media/scenes-ch01-ch02.test.ts`; expect 83 missing-file failures.**
- [ ] **Step 3: Generate each scene from its own job with the `imagegen` skill, normalize through `prepare-image.mjs`, and reject any output with unreadable focal action, repeated composition, wrong recurring-character identity, embedded marks, dots, streaks, or muddy lighting. Reuse an approved current MORROWMERE plate only when its exact subject matches and the manifest records a single retained source.**

```bash
node scripts/media/validate-images.mjs --kinds scene --chapters ch01,ch02
node scripts/media/build-contact-sheets.mjs --kinds scene --chapters ch01,ch02 --columns 4 --rows 5
```

- [ ] **Step 4: Review all generated contact sheets, mark every sheet approved in `approvals.json`, inspect every luminance exception at full resolution, then run the focused test and image validator. Expected: 83/83 present, unique SHA-256 and perceptual hashes, no unapproved exception.**
- [ ] **Step 5: Commit.**

```bash
git add public/assets/chronicle1/scenes/ch01 public/assets/chronicle1/scenes/ch02 production/chronicle1/media/contact-sheets production/chronicle1/media/approvals.json tests/media/scenes-ch01-ch02.test.ts
git commit -m "art: add Greywatch chapter illustrations"
```

### Task 4: Produce scene art for Chapters 3–4

**Files:**
- Create: `public/assets/chronicle1/scenes/ch03/*.webp` (42 files)
- Create: `public/assets/chronicle1/scenes/ch04/*.webp` (43 files)
- Create: `production/chronicle1/media/contact-sheets/scenes-ch03-ch04-*.webp`
- Create: `tests/media/scenes-ch03-ch04.test.ts`

**Interfaces:**
- Produces: 85 unique Drowned Road/Redwater scene WebPs and approvals.

- [ ] **Step 1: Write the failing 42/43 file and manifest test.**
- [ ] **Step 2: Run `npm test -- tests/media/scenes-ch03-ch04.test.ts`; expect 85 missing-file failures.**
- [ ] **Step 3: Generate the 85 exact jobs. Keep floodwater, cloudy weather, or night readable through reflected sky, lanterns, campfires, or pale dawn; distinguish human and orc individuals through faces, kit, posture, and heraldry without caricature. Process with the same deterministic encoder.**
- [ ] **Step 4: Build/review contact sheets and run `node scripts/media/validate-images.mjs --kinds scene --chapters ch03,ch04` plus the focused test. Expected: 85 unique approved files.**
- [ ] **Step 5: Commit `art: add Drowned Road and Redwater illustrations`.**

### Task 5: Produce scene art for Chapters 5–6

**Files:**
- Create: `public/assets/chronicle1/scenes/ch05/*.webp` (43 files)
- Create: `public/assets/chronicle1/scenes/ch06/*.webp` (43 files)
- Create: `production/chronicle1/media/contact-sheets/scenes-ch05-ch06-*.webp`
- Create: `tests/media/scenes-ch05-ch06.test.ts`

**Interfaces:**
- Produces: 86 unique Embervault/siege scene WebPs and approvals.

- [ ] **Step 1: Write the failing 43/43 file and manifest test.**
- [ ] **Step 2: Run `npm test -- tests/media/scenes-ch05-ch06.test.ts`; expect 86 missing-file failures.**
- [ ] **Step 3: Generate all 86 jobs. Embervault uses bright furnace bounce, sparks only where physically motivated, and clean silhouettes; the siege uses smoke as large readable masses rather than noisy particle overlays. Caldus and Sergeant Hale paths receive distinct illustrations.**
- [ ] **Step 4: Build/review contact sheets, inspect all underground/night exceptions full-size, and run the image validator plus focused test. Expected: 86 unique approved files.**
- [ ] **Step 5: Commit `art: add Embervault and siege illustrations`.**

### Task 6: Produce scene art for Chapters 7–8

**Files:**
- Create: `public/assets/chronicle1/scenes/ch07/*.webp` (40 files)
- Create: `public/assets/chronicle1/scenes/ch08/*.webp` (38 files)
- Create: `production/chronicle1/media/contact-sheets/scenes-ch07-ch08-*.webp`
- Create: `tests/media/scenes-ch07-ch08.test.ts`

**Interfaces:**
- Produces: 78 unique Crownless Keep/finale scene WebPs and approvals, completing all 332 scene files.

- [ ] **Step 1: Write the failing 40/38 test and a global assertion for exactly 332 distinct scene files.**
- [ ] **Step 2: Run `npm test -- tests/media/scenes-ch07-ch08.test.ts`; expect 78 missing-file failures.**
- [ ] **Step 3: Generate all 78 jobs. Crownless Keep remains luminous through pale windows, torches, brass reflection, and coronation light; Voss looks disciplined and credible rather than monstrous. Ending illustrations visibly distinguish peace, force, coalition, and continuing war.**
- [ ] **Step 4: Build/review contact sheets, run the validator and global test, and confirm 332 files map one-to-one to 332 scene IDs with no shared perceptual duplicate.**
- [ ] **Step 5: Commit `art: complete Black Banner scene illustrations`.**

### Task 7: Produce 100 item icons, 80 portraits, and 15 boss illustrations

**Files:**
- Create: `public/assets/chronicle1/items/*.webp` (100 files)
- Create: `public/assets/chronicle1/enemies/*.webp` (80 files)
- Create: `public/assets/chronicle1/bosses/*.webp` (15 files)
- Create: `production/chronicle1/media/contact-sheets/{items,enemies,bosses}-*.webp`
- Create: `tests/media/catalog-art.test.ts`

**Interfaces:**
- Consumes: exact item, portrait, and boss IDs from the content contract.
- Produces: 195 catalog visuals and manifest rows.

- [ ] **Step 1: Write failing exact-count/dimension/identity tests.**

```ts
expect(await assetsOfKind('item')).toHaveLength(100);
expect(await assetsOfKind('enemy')).toHaveLength(80);
expect(await assetsOfKind('boss')).toHaveLength(15);
expect((await assetsOfKind('item')).every((entry) => entry.width === 512 && entry.height === 512)).toBe(true);
expect((await assetsOfKind('enemy')).every((entry) => entry.width === 1024 && entry.height === 1024)).toBe(true);
```

- [ ] **Step 2: Run `npm test -- tests/media/catalog-art.test.ts`; expect 195 missing-file failures.**
- [ ] **Step 3: Generate clean, large item silhouettes with transparent backgrounds; four visibly distinct pose/equipment/marking portraits for each of 20 archetypes; and 15 full boss compositions matching the locked boss IDs. No portrait variant may differ only by crop, frame, tint, noise, or darkness.**
- [ ] **Step 4: Build/review 5 item sheets, 4 enemy sheets, and 1 boss sheet. Run catalog-art tests and the validator; expect 195 unique IDs and no unapproved visual duplicate.**
- [ ] **Step 5: Commit `art: add Chronicle I items enemies and bosses`.**

### Task 8: Produce the 14-shot opening-story cinematic art package

**Files:**
- Create: `public/assets/chronicle1/opening/{shotId}/base.webp` (14 files)
- Create: the 10 locked `midground.webp` layers
- Create: the 9 locked `foreground.webp` layers
- Create: `production/chronicle1/media/opening-timeline.json`
- Create: `production/chronicle1/media/contact-sheets/opening.webp`
- Create: `tests/media/opening-art.test.ts`

**Interfaces:**
- Consumes: approved opening narration and character bible.
- Produces: 14 ordered shots, 33 physical WebPs, focal/depth metadata, and a 90–120 second timing contract used by the interface-cinematic plan.

- [ ] **Step 1: Write a failing storyboard/layer/timing test.**

```ts
expect(OPENING_TIMELINE.map((shot) => shot.id)).toEqual(OPENING_SHOT_IDS);
expect(OPENING_TIMELINE.reduce((sum, shot) => sum + shot.durationMs, 0)).toBeGreaterThanOrEqual(90_000);
expect(OPENING_TIMELINE.reduce((sum, shot) => sum + shot.durationMs, 0)).toBeLessThanOrEqual(120_000);
expect(countOpeningFiles()).toEqual({ base: 14, midground: 10, foreground: 9 });
```

- [ ] **Step 2: Run `npm test -- tests/media/opening-art.test.ts`; expect missing timeline/files.**
- [ ] **Step 3: Generate the 14 exact storyboard shots in one coherent visual sequence. Generate depth layers as transparent isolated elements, not duplicated full plates. Set timeline camera start/end transforms, caption segment IDs, impact cuts on the first arrow and title reveal, and a static-base fallback for every shot.**
- [ ] **Step 4: Review the opening sheet and each composite at full resolution; run the focused test and image validator. Confirm the 14 base images alone tell the complete opening if all parallax layers fail.**
- [ ] **Step 5: Commit `art: add Black Banner opening story cinematic`.**

### Task 9: Produce 12 loop-ready music themes

**Files:**
- Create: `public/audio/chronicle1/music/*` (12 files)
- Create: `production/chronicle1/media/music-briefs.json`
- Create: `production/chronicle1/media/audio-provenance.json`
- Create: `tests/media/music.test.ts`

**Interfaces:**
- Produces: the 12 locked music IDs with duration, loop-start/end, mood, intensity, loudness, and provenance metadata.

- [ ] **Step 1: Write a failing 12-track/decode/provenance test.**

```ts
expect(MUSIC_ASSETS.map((track) => track.id)).toEqual(MUSIC_IDS);
expect(MUSIC_ASSETS.every((track) => track.durationMs >= 75_000 && track.durationMs <= 240_000)).toBe(true);
expect(MUSIC_ASSETS.every((track) => track.loopEndMs > track.loopStartMs + 30_000)).toBe(true);
expect(MUSIC_ASSETS.every((track) => track.provenance.commercialDistribution === true)).toBe(true);
```

- [ ] **Step 2: Run `npm test -- tests/media/music.test.ts`; expect 12 missing-track failures.**
- [ ] **Step 3: Produce twelve original or commercially licensed tracks from the locked IDs. Use restrained cello, wooden flute, frame drum, low strings, hammered dulcimer, and region-specific accents; keep title/opening thematic continuity, make battle tension rhythmic rather than bombastic, and provide clean loop boundaries. Record generator/composer, creation date, license basis, and source-master hash for every track.**
- [ ] **Step 4: Normalize masters through `ingest-audio.mjs` to integrated loudness −18 LUFS ±1 and true peak no higher than −1 dBTP, audition every loop boundary, then run music and audio-validator tests.**
- [ ] **Step 5: Commit `audio: add Chronicle I music score`.**

### Task 10: Produce 84 clear SFX

**Files:**
- Create: `public/audio/chronicle1/sfx/*` (84 files)
- Create: `scripts/media/generate-elevenlabs-sfx.mjs`
- Create: `tests/media/sfx.test.ts`
- Modify: `production/chronicle1/media/audio-provenance.json`

**Interfaces:**
- Consumes: the locked eight-group SFX allocation and local `ELEVENLABS_API_KEY` when generation is authorized.
- Produces: exactly 84 cue files, variant groups, durations, loudness metadata, and provenance.

- [ ] **Step 1: Write the failing exact allocation and variant test.**

```ts
expect(SFX_ASSETS).toHaveLength(84);
expect(countSfxGroups(SFX_ASSETS)).toEqual({ weapons: 12, defense: 8, magic: 12, status: 8, enemy: 12, ui: 14, narrative: 12, ambience: 6 });
expect(variantIds('sfx-sword-light')).toHaveLength(3);
expect(SFX_ASSETS.every((cue) => cue.durationMs >= 40 && cue.durationMs <= 20_000)).toBe(true);
```

- [ ] **Step 2: Run `npm test -- tests/media/sfx.test.ts`; expect 84 missing-cue failures.**
- [ ] **Step 3: Generate or layer every cue from its concrete brief. The generation script reads `ELEVENLABS_API_KEY` from the process environment, sends it only in the `xi-api-key` header, writes response audio directly to `.media-work`, and logs only cue ID/status/bytes. Rotate through variants at runtime; do not encode critical, miss, or block as simple pitch-shifted copies of the same source.**

```js
const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('ELEVENLABS_API_KEY is required in the local process environment');
const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
  body: JSON.stringify({ text: job.prompt, duration_seconds: job.durationSeconds, prompt_influence: 0.35 }),
});
```

- [ ] **Step 4: Trim and normalize short cues, preserve ambience loops, audition attack/miss/critical/block at phone-speaker volume, and run SFX/audio-validator tests. Run `git grep -n -E "xi-api-key.*sk_|sk_[A-Za-z0-9_-]{20,}" -- . ':!package-lock.json'`; expect no output.**
- [ ] **Step 5: Commit `audio: replace oscillator cues with clear effects`.**

### Task 11: Produce secret-safe English VO

**Files:**
- Create: `public/audio/chronicle1/voice/en/*` (32 files)
- Create: `production/chronicle1/media/voice-script.json`
- Create: `production/chronicle1/media/voice-profiles.json`
- Create: `scripts/media/generate-elevenlabs-voice.mjs`
- Create: `tests/media/voice.test.ts`
- Modify: `production/chronicle1/media/audio-provenance.json`

**Interfaces:**
- Consumes: approved eight-part opening narration, 16 selected main-story excerpts, 8 companion turning-point excerpts, and local `ELEVENLABS_API_KEY`.
- Produces: 32 caption-matched clips and stable non-secret profiles for Eldrin, Mara, Rukhar, Caldus, Lyra, Talla, and Voss.

- [ ] **Step 1: Write failing VO count, script identity, and secret-safety tests.**

```ts
expect(VOICE_SCRIPT.filter((clip) => clip.group === 'opening')).toHaveLength(8);
expect(VOICE_SCRIPT.filter((clip) => clip.group === 'main')).toHaveLength(16);
expect(VOICE_SCRIPT.filter((clip) => clip.group === 'companion')).toHaveLength(8);
expect(VOICE_SCRIPT.every((clip) => clip.captionText === clip.spokenText)).toBe(true);
expect(JSON.stringify(VOICE_PROFILES)).not.toMatch(/xi-api-key|\bsk_/i);
```

- [ ] **Step 2: Run `npm test -- tests/media/voice.test.ts`; expect missing script/profile/audio failures.**
- [ ] **Step 3: Select a stable ElevenLabs voice matching **Eldrin — Crisp British Baritone** through an audition scorecard for clarity, restraint, authority, and natural pacing. Record only the non-secret provider voice ID/model ID. Generate the exact approved opening text with Eleven v3 or the current approved equivalent, then 16 two-per-chapter main excerpts and 8 companion turning points (Mara 1, Rukhar 2, Caldus 2, Lyra 2, Talla 1). Voss uses his own disciplined bass profile in the Chapter 8 main excerpts.**

```js
const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('ELEVENLABS_API_KEY is required in the local process environment');
const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(job.voiceId)}?output_format=mp3_44100_128`;
const response = await fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
  body: JSON.stringify({ text: job.spokenText, model_id: job.modelId, voice_settings: job.voiceSettings }),
});
```

- [ ] **Step 4: Listen to all 32 clips, correct pronunciations in the script dictionary without changing visible spelling, normalize to −19 LUFS ±1 with true peak ≤−1 dBTP, and run voice/audio-validator tests. Confirm no secret exists in Git history, source maps, `dist`, Android assets, logs, or manifests.**
- [ ] **Step 5: Commit `audio: add Black Banner narration and story voices`.**

### Task 12: Final manifest, contact-sheet audit, and bundle gate

**Files:**
- Create: `scripts/media/build-contact-sheets.mjs`
- Create: `scripts/media/ingest-audio.mjs`
- Create: `scripts/media/report-bundle.mjs`
- Create: `public/assets/chronicle1/media-manifest.json`
- Create: `src/game/media/generated/chronicle1.ts`
- Create: `production/chronicle1/media/media-report.json`
- Create: `tests/media/images.test.ts`
- Create: `tests/media/audio.test.ts`
- Modify: `tests/media/manifest.test.ts`
- Modify: `vite.config.ts` through the designated integration owner only
- Modify: `package.json` and `package-lock.json` through the designated integration owner only

**Interfaces:**
- Consumes: all approved image/audio files and provenance records.
- Produces: deterministic runtime manifest, approved contact sheets, bundle report, and focused release gates.

- [ ] **Step 1: Write failing completeness and byte-budget tests.**

```ts
expect(countManifestKinds(MEDIA_MANIFEST)).toEqual({
  scene: 332, item: 100, enemy: 80, boss: 15, openingLayer: 33, music: 12, sfx: 84, voice: 32,
});
expect(MEDIA_REPORT.visualBytes).toBeLessThanOrEqual(125 * 1024 * 1024);
expect(MEDIA_REPORT.audioBytes).toBeLessThanOrEqual(55 * 1024 * 1024);
expect(MEDIA_REPORT.totalBytes).toBeLessThanOrEqual(180 * 1024 * 1024);
expect(MEDIA_REPORT.orphanPaths).toEqual([]);
expect(MEDIA_REPORT.missingIds).toEqual([]);
```

- [ ] **Step 2: Run `npm test -- tests/media`; expect manifest/report failures until final generation completes.**
- [ ] **Step 3: Generate the manifest with SHA-256, dimensions/duration, focal data, provenance IDs, and delivery packs. Put opening, title, shared UI, and Chapter 1 in `base`; Chapters 2–4 in `chronicle1-a`; Chapters 5–8 in `chronicle1-b`. Update Workbox so the web shell precaches, while Chronicle media uses bounded runtime caching rather than precaching every PNG/WebP/audio file.**

```ts
const IMAGE_LIMITS = {
  scene: { medianBytes: 240_000, p95Bytes: 360_000 },
  item: { medianBytes: 30_000, p95Bytes: 45_000 },
  enemy: { medianBytes: 130_000, p95Bytes: 180_000 },
  boss: { medianBytes: 300_000, p95Bytes: 420_000 },
  openingLayer: { medianBytes: 260_000, p95Bytes: 420_000 },
} as const;
```

- [ ] **Step 4: Run `npm run media:validate`, `npm run media:manifest`, `npm run media:report`, rerun manifest generation and verify byte-identical output, then run `npm test -- tests/media`, `npm run build`, and `npm run build:android`. Review all contact-sheet approvals and every luminance exception. If a budget fails, re-encode or replace the measured outliers; delivery-pack wiring is activated by the Android release plan based on this report.**
- [ ] **Step 5: Commit.**

```bash
git add public/assets/chronicle1 public/audio/chronicle1 production/chronicle1/media scripts/media src/game/media tests/media vite.config.ts package.json package-lock.json
git commit -m "build: finalize Chronicle I media library"
```

## Self-review checklist

- [ ] The logical visual ledger equals 541: 332 + 100 + 80 + 15 + 14.
- [ ] The opening physical-file ledger equals 33: 14 base + 10 midground + 9 foreground.
- [ ] Audio counts are exactly 12 music, 84 SFX, and 32 VO.
- [ ] Every image job has a unique subject/action/location brief and a mobile safe area.
- [ ] Existing MORROWMERE art is retained only for an exact scene and never mapped twice.
- [ ] Contact sheets and luminance reports cover every image; exceptions require a written lighting reason and full-resolution approval.
- [ ] Music/SFX/VO provenance permits commercial Google Play distribution.
- [ ] Secret scans cover source, manifests, build output, native assets, and logs; no key value is ever printed.
- [ ] Runtime manifests contain stable IDs and relative packaged paths only.
- [ ] The final media report enforces 125 MiB visuals, 55 MiB audio, and 180 MiB combined internal budgets.
- [ ] The spec's art style, asset counts, cinematic, music, SFX, VO, offline, lazy-loading, and bundle-risk requirements each map to a task above.

