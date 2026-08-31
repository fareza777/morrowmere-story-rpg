# MORROWMERE Chronicle I Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the current MORROWMERE vertical slice into the complete, challenging, English-only 10–12 hour Chronicle I campaign and deliver an installable APK plus Play Store AAB.

**Architecture:** Keep React, TypeScript, Vite, and Capacitor 8, while replacing the monolithic single-run model with ID-based layered campaign state, lazy authored-procedural scene selection, typed domain events, and validated media/content manifests. Implement the work through five bounded subplans so core rules stabilize before hundreds of content and media assets are integrated.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest 4, Testing Library, Playwright, Capacitor 8, Android Gradle, Capacitor AdMob/Haptics/App plugins, WebP, file-backed web audio.

**Spec:** `docs/superpowers/specs/2026-08-31-morrowmere-chronicle-i-black-banner-design.md`

## Global Constraints

- Public title is `MORROWMERE`; campaign title is `Chronicle I — The Black Banner`.
- All player-facing story, menu, tutorial, item, combat, merchant, and advertising copy is English.
- Android application ID remains `com.morrowmere.game`.
- Chronicle I contains eight ordered chapters, levels 1–15, and 10–12 hours of intended first-completion play.
- Runtime story prose is authored; there is no runtime AI text or image generation.
- The default game remains challenging with or without a companion or rewarded-ad gold.
- Consumables work both in combat and in the field.
- Every state-changing action and app background transition autosaves without allowing RNG rerolls.
- Art retains the existing bright painterly MORROWMERE theme and excludes grain, speckles, streaks, crushed blacks, random particles, and embedded text.
- The premium 90–120 second cinematic treatment applies to the opening story only.
- Core gameplay works offline; ads fail open and never gate play.
- External AdMob resources are not submitted without action-time confirmation.
- Verification is focused: content validation, relevant domain tests, one compact mobile visual pass, one Android/media/ad smoke pass, and release builds.

---

## Executable subplans and order

- [ ] **Phase 1 — Core systems:** Execute `2026-08-31-morrowmere-core-systems.md` first. It establishes stable IDs, state-v2, inventory, progression, companions, merchants, combat, lazy direction, checkpoints, and safe persistence.
- [ ] **Phase 2A — Authored content:** Execute `2026-08-31-morrowmere-chronicle-content.md` after the Phase 1 schemas and validators are merged.
- [ ] **Phase 2B — Product interface:** Execute `2026-08-31-morrowmere-interface-cinematic.md` after the Phase 1 selectors and commands are stable. It may run in parallel with Phase 2A because it uses fixtures and interfaces rather than editing content files.
- [ ] **Phase 3 — Media production:** Execute `2026-08-31-morrowmere-media-production.md` after scene, character, item, and enemy IDs from Phase 2A are stable.
- [ ] **Phase 4 — Ads and release:** Execute `2026-08-31-morrowmere-android-ads-release.md` after the core UI and reward ledger are stable. Use test ad IDs until the external configuration step.
- [ ] **Phase 5 — Integration:** Run the exact final audit commands in the release plan, make only evidence-driven fixes, generate APK/AAB, update the release handoff, and request the single required action-time confirmation before creating persistent AdMob resources.

## Parallel work boundaries

- Core-system workers own `src/game/**` except `src/game/content/chronicle1/**` and must not generate media.
- Narrative workers own `src/game/content/chronicle1/**` and content tests; they do not change reducer or UI implementation.
- Interface workers own `src/components/**`, `src/styles/**`, App integration, and UI tests; they consume public game facades.
- Media workers own `public/assets/**`, `scripts/media/**`, and media manifests after IDs are locked.
- Android/ad workers own native adapters, Capacitor/Android configuration, privacy/release docs, and native-specific tests.
- A single integrator resolves shared barrel files, `package.json`, `package-lock.json`, and `src/App.tsx` changes to avoid parallel overwrite.

## Completion gate

- [ ] The spec coverage table in every subplan has no uncovered requirement.
- [ ] Exactly 56 main, 64 companion/faction, 140 journey, 48 combat-template, and 24 hub scenes validate.
- [ ] Exactly 160 items and at least 200 enemy definitions validate.
- [ ] Every event resolves to art and every referenced audio file exists.
- [ ] Save-v2 backup, migration, background flush, camp retry, and Restart Chapter pass focused checks.
- [ ] Opening cinematic, story, combat, inventory/equipment, merchant, journal, settings, reward, defeat, and title fit a 360×800 viewport; title actions also fit the narrow smoke viewport.
- [ ] Test-mode banner, rewarded, interstitial, and consent flows fail open.
- [ ] Release APK installs, a saved expedition resumes, and the Play Store AAB builds from the same commit.

