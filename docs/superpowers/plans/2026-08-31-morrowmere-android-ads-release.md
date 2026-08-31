# MORROWMERE Android, Advertising, and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable Android lifecycle behavior, restrained haptics, consent-gated AdMob banner/rewarded/interstitial placements, offline media packaging, and reproducible debug APK plus guarded Play AAB delivery without weakening Chronicle I.

**Architecture:** Keep native concerns behind typed adapters so the React/web build remains fully playable when Capacitor or advertising is unavailable. The game reducer owns reward eligibility and idempotency; the AdMob adapter only reports native outcomes. Test builds use Google's demo application/ad-unit IDs, while a separate guarded live build path requires all account IDs and upload-signing variables before a Play-labeled AAB can be produced.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest 4, Capacitor 8.5, `@capacitor/app` 8.1.1, `@capacitor/haptics` 8.0.2, `@capacitor-community/admob` 8.1.0, Android Gradle Plugin 8.13, Gradle 8.14.3, Java 21, Android API 24–36.

**Spec:** `docs/superpowers/specs/2026-08-31-morrowmere-chronicle-i-black-banner-design.md`

## Global Constraints

- Android application ID remains `com.morrowmere.game`; public title remains `MORROWMERE`.
- Chronicle I Android handoff version is `1.2.0` with `versionCode 4`.
- All player-facing advertising, privacy, error, and settings copy is English.
- Core story, combat, saves, art, music, SFX, and downloaded voice assets remain playable offline; unavailable ads never block Continue, navigation, rewards already earned, or campaign completion.
- The opening story cinematic and onboarding never request or display an ad or consent form.
- Banner ads appear only on title, camp, journal, and merchant surfaces in reserved space; they never cover narrative, combat, cinematic, defeat, boss, or choice controls.
- Rewarded ads may double ordinary battle gold once for an eligible victory. They never grant XP, resurrection, companion progress, boss rewards, items, or exclusive power.
- Interstitials appear only at safe expedition breaks after at least three completed expeditions and at least 20 minutes since the previous interstitial; never directly after a rewarded ad.
- Save writes occur before React renders the next state and again when the app backgrounds; saved RNG, combat turn, and reward-claim ledgers prevent close/reopen rerolls or duplicate gold.
- Haptics, reduced haptics, music, SFX, voice, and reduced motion are independent settings. Unsupported devices and browser builds resolve haptic calls without failing gameplay.
- Development, automated checks, debug APKs, and QA AABs use Google's demo IDs. A Play build fails closed if any live ID or signing input is absent or still equals a Google demo ID.
- The provided ElevenLabs credential is unrelated to runtime Android configuration and must never enter Gradle, Vite environment files, source code, logs, APKs, or AABs.
- Do not add `google-services.json`, Firebase, or a second Google Mobile Ads/UMP dependency; AdMob plugin v8 already supplies Google Mobile Ads 25.4.x and UMP 4.0.0.
- Persistent AdMob app/ad-unit creation requires the exact action-time confirmation in Task 8 immediately before external submission.
- Keep the delivered base bundle below the local 180 MiB gate. Play Asset Delivery is not introduced unless that measured gate fails after asset optimization.

---

## File map

- `package.json`, `package-lock.json`: exact Capacitor plugin dependencies and separate test/live Android build scripts.
- `src/native/lifecycle.ts`: Capacitor App plus browser lifecycle subscription, cleanup, and Android-back bridge; extends the core plan's background-flush seam.
- `src/native/back-policy.ts`: pure priority policy for overlay, modal, game, and title hardware-back behavior.
- `src/native/haptics.ts`: typed cue-to-native mapping with off/reduced modes and a safe injected driver.
- `src/native/ads/types.ts`: consent, placement, native result, and service contracts.
- `src/native/ads/config.ts`: Google demo IDs, validated live Vite IDs, and native-platform gating.
- `src/native/ads/consent.ts`: launch refresh, deferred safe-moment form, and privacy-options entry point.
- `src/native/ads/service.ts`: one native AdMob facade for banner, rewarded, interstitial, listener cleanup, and fail-open errors.
- `src/native/ads/banner-controller.ts`: safe-placement visibility and measured WebView bottom inset.
- `src/native/ads/policy.ts`: pure rewarded eligibility and interstitial pacing rules.
- `src/game/state/*` and compatibility `src/game/state.ts`: persisted idempotent reward/pacing ledger and typed advertising commands.
- `src/App.tsx`: write-through save, lifecycle/audio coordination, back actions, consent safe moment, and placement synchronization.
- `src/game/audio.ts` or the media plan's replacement manager: `suspendAllAudio` and `resumeEnabledAudio` lifecycle hooks.
- `src/components/RewardPanel.tsx`: optional earned-gold multiplier action with loading/unavailable states.
- `src/components/SettingsSheet.tsx`: haptics and privacy-options controls.
- Title/camp/journal/merchant components produced by the interface plan: expose only the approved `AdPlacement` values.
- `src/styles/base.css`, `src/styles/game.css`: `--ad-banner-inset` reservation with Android safe-area composition.
- `src/env.d.ts`: exact live ad-unit environment typings.
- `scripts/verify-live-admob.mjs`: rejects missing, malformed, or Google demo live configuration.
- `scripts/check-android-size.mjs`: enforces the 180 MiB local AAB gate.
- `.gitignore`: local environment, upload keystore, and signed artifact exclusions.
- `vite.config.ts`: every `android*` mode excludes the PWA service worker; web offline cache includes media and manifests.
- `capacitor.config.ts`: typed App plugin back handling configuration.
- `android/app/src/main/AndroidManifest.xml`: Internet/network permissions and AdMob application-ID metadata.
- `android/app/build.gradle`: debug/sample application ID, optional QA release, live Play verification, and existing upload signing.
- `android/capacitor.settings.gradle`, `android/app/capacitor.build.gradle`: generated by `cap sync`; never edited manually.
- `android/app/src/androidTest/java/com/morrowmere/game/ExampleInstrumentedTest.java`: correct package identity assertion.
- `tests/lifecycle.test.ts`, `tests/back-policy.test.ts`, `tests/haptics.test.ts`: native adapter contract tests.
- `tests/ad-config.test.ts`, `tests/ad-consent.test.ts`, `tests/ad-service.test.ts`, `tests/ad-policy.test.ts`: deterministic ad/consent/pacing tests with fakes.
- `tests/ad-reward.test.ts`, `tests/app-lifecycle.test.tsx`: reducer idempotency and App integration checks.
- `tests/android-config.test.ts`, `tests/offline-media.test.ts`, `tests/native-package.test.ts`: native configuration, no-service-worker, media packaging, and size-script checks.
- `README.md`, `release/README.md`, `docs/PLAY-STORE-CHECKLIST.md`, `docs/PRIVACY_POLICY.md`, `docs/PLAYTEST.md`, `store-listing/README.md`: accurate advertising, privacy, signing, test, and artifact handoff documentation.

## Shared interfaces

The tasks below use these exact contracts; do not rename them in individual implementations.

```ts
export type AdPlacement = 'none' | 'title' | 'camp' | 'journal' | 'merchant';

export type FullScreenAdResult = 'shown' | 'dismissed' | 'unavailable' | 'failed';
export type RewardedAdResult = 'earned' | 'dismissed' | 'unavailable' | 'failed';

export interface ConsentSnapshot {
  readonly status: 'unknown' | 'required' | 'obtained' | 'not-required' | 'unavailable';
  readonly canRequestAds: boolean;
  readonly privacyOptionsRequired: boolean;
}

export interface AdService {
  initialize(): Promise<ConsentSnapshot>;
  resolveConsentAtSafeMoment(): Promise<ConsentSnapshot>;
  showPrivacyOptions(): Promise<void>;
  setPlacement(placement: AdPlacement, onInsetChange: (heightPx: number) => void): Promise<void>;
  preloadRewarded(): Promise<void>;
  showRewardedBattleGold(): Promise<RewardedAdResult>;
  preloadInterstitial(): Promise<void>;
  showInterstitial(): Promise<FullScreenAdResult>;
  destroy(): Promise<void>;
}

export interface AdPacingState {
  readonly lastInterstitialAt: string | null;
  readonly expeditionBreaksSinceInterstitial: number;
  readonly rewardedShownAtCurrentBreak: boolean;
  readonly claimedRewardOfferIds: readonly string[];
}

export type HapticCue =
  | 'choice'
  | 'attack'
  | 'miss'
  | 'block'
  | 'critical'
  | 'heavy-damage'
  | 'magic'
  | 'victory'
  | 'level-up'
  | 'defeat';
```

### Task 1: Install Capacitor plugins and implement lifecycle/haptic adapters

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/native/lifecycle.ts`
- Create: `src/native/back-policy.ts`
- Create: `src/native/haptics.ts`
- Create: `tests/lifecycle.test.ts`
- Create: `tests/back-policy.test.ts`
- Create: `tests/haptics.test.ts`
- Generated: `android/capacitor.settings.gradle`
- Generated: `android/app/capacitor.build.gradle`

**Interfaces:**
- Consumes: core plan `subscribeToAppBackground`, current settings, and typed domain transition events.
- Produces: `subscribeToAppLifecycle`, `resolveBackAction`, `playHaptic`, `HapticCue`, and cleanup functions that App integration can safely call on web or Android.

- [ ] **Step 1: Add failing lifecycle, back-priority, and haptic-driver tests.**

```ts
it('flushes once when Android pauses and removes every listener on cleanup', async () => {
  const driver = fakeLifecycleDriver();
  const onPause = vi.fn();
  const cleanup = await subscribeToAppLifecycle({ onPause, onResume: vi.fn(), onBack: vi.fn() }, driver);
  driver.emitPause();
  expect(onPause).toHaveBeenCalledOnce();
  await cleanup();
  driver.emitPause();
  expect(onPause).toHaveBeenCalledOnce();
});

it.each([
  [{ overlayOpen: true, modalOpen: false, view: 'game' }, 'close-overlay'],
  [{ overlayOpen: false, modalOpen: true, view: 'game' }, 'close-modal'],
  [{ overlayOpen: false, modalOpen: false, view: 'game' }, 'open-exit-confirmation'],
  [{ overlayOpen: false, modalOpen: false, view: 'title' }, 'minimize-app'],
] as const)('resolves Android back priority', (context, expected) => {
  expect(resolveBackAction(context)).toBe(expected);
});

it('reduces critical feedback and suppresses disabled feedback', async () => {
  const driver = fakeHapticDriver();
  await playHaptic('critical', { enabled: true, reduced: true }, driver);
  expect(driver.impact).toHaveBeenCalledWith('light');
  await playHaptic('critical', { enabled: false, reduced: false }, driver);
  expect(driver.impact).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run `npm test -- lifecycle.test.ts back-policy.test.ts haptics.test.ts` and confirm missing-module failures.**
- [ ] **Step 3: Install compatible plugins with `npm install @capacitor/app@8.1.1 @capacitor/haptics@8.0.2 @capacitor-community/admob@8.1.0`, then run `npx cap sync android`. Review generated Gradle changes and do not hand-edit generated files.**
- [ ] **Step 4: Implement the adapters with injected drivers. Use Capacitor `App` listeners on native, `visibilitychange` plus `pagehide` on web, and return one async cleanup that removes every registered listener. Unsupported haptics resolve after a caught native error.**

```ts
export interface AppLifecycleCallbacks {
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onBack: () => void;
}

export async function subscribeToAppLifecycle(
  callbacks: AppLifecycleCallbacks,
  driver: LifecycleDriver = capacitorLifecycleDriver,
): Promise<() => Promise<void>>;

export type BackAction = 'close-overlay' | 'close-modal' | 'open-exit-confirmation' | 'minimize-app';

export async function playHaptic(
  cue: HapticCue,
  settings: { readonly enabled: boolean; readonly reduced: boolean },
  driver: HapticDriver = capacitorHapticDriver,
): Promise<void>;
```

- [ ] **Step 5: Map choice/miss to light impact, attack/block/magic to medium, critical/heavy damage to heavy, victory/level-up to success notification, and defeat to error notification. Reduced mode maps all enabled cues to a single light impact. Run the three focused tests and `npm run build`.**
- [ ] **Step 6: Commit `feat: add Capacitor lifecycle and haptic adapters`.**

### Task 2: Make save, back, and audio behavior lifecycle-safe

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/game/persistence/repository.ts`
- Modify: `src/game/persistence.ts`
- Modify: `src/game/audio.ts` or the media manager file that replaces it
- Modify: `src/game/state/types.ts`
- Modify: `src/game/state/reducer.ts`
- Modify: `src/components/SettingsSheet.tsx`
- Create: `tests/app-lifecycle.test.tsx`
- Modify: `tests/persistence-recovery.test.ts`
- Modify: `tests/interface.test.tsx`

**Interfaces:**
- Consumes: `SaveRepository.saveSlot`, `subscribeToAppLifecycle`, `resolveBackAction`, active slot/state refs, and audio manager buses from earlier plans.
- Produces: write-through reducer dispatch, `suspendAllAudio`, `resumeEnabledAudio`, explicit `Save & Exit`, persisted haptic settings, and deterministic Android-back behavior.

- [ ] **Step 1: Add a failing App integration test proving a reducer result is saved before it is rendered and backgrounding flushes the latest ref.**

```tsx
it('writes the exact next state before render and repeats it on pause', async () => {
  const saveSlot = vi.fn(() => ({ ok: true as const }));
  const lifecycle = fakeAppLifecycle();
  render(<App dependencies={{ saveRepository: repositoryWith(saveSlot), lifecycle }} />);
  await beginFixtureChronicle();
  await chooseFixtureOption();
  expect(saveSlot.mock.calls.at(-1)?.[1].flow.lastCommandId).toBe('choice-fixture-1');
  lifecycle.pause();
  expect(saveSlot.mock.calls.at(-1)?.[1]).toEqual(currentRenderedGameState());
});
```

- [ ] **Step 2: Add failing tests that pause audio on background, restore only enabled buses on resume, close an overlay before opening exit confirmation, and save before `Save & Exit`. Run `npm test -- app-lifecycle.test.tsx persistence-recovery.test.ts interface.test.tsx`.**
- [ ] **Step 3: Change dispatch ordering to reduce, save, update `gameRef`, emit audio/haptics, then render. Do not wait for a React effect to persist the command. Preserve the core plan's backup-before-active write behavior.**

```ts
const dispatch = useCallback((command: GameCommand) => {
  const current = gameRef.current;
  if (!current) return;
  const transition = reduceGame(current, command, content);
  saveRepository.saveSlot(activeSlotRef.current, transition.state);
  gameRef.current = transition.state;
  playTransitionFeedback(transition.events, transition.state.profile.settings);
  setGame(transition.state);
}, [content, saveRepository]);
```

- [ ] **Step 4: Subscribe once after App mounts. On pause, save `gameRef.current` synchronously and call `suspendAllAudio`; on resume, call `resumeEnabledAudio(settings)` without restarting the current track; on Back, execute the pure priority action. Cleanup all handles on unmount.**
- [ ] **Step 5: Extend save-v2 settings and its migration defaults with `haptics: true` and `reducedHaptics: false`; expose both English toggles in Settings. Ensure updating either setting write-through saves immediately.**
- [ ] **Step 6: Run the focused tests, `npm run build`, and `git diff --check`.**
- [ ] **Step 7: Commit `feat: make Android resume and saves reliable`.**

### Task 3: Add validated ad configuration and deferred UMP consent

**Files:**
- Create: `src/native/ads/types.ts`
- Create: `src/native/ads/config.ts`
- Create: `src/native/ads/consent.ts`
- Create: `src/native/ads/service.ts`
- Create: `src/env.d.ts`
- Create: `tests/ad-config.test.ts`
- Create: `tests/ad-consent.test.ts`
- Create: `tests/ad-service.test.ts`

**Interfaces:**
- Consumes: Capacitor platform detection and AdMob plugin v8.
- Produces: the shared `AdService`, `ConsentSnapshot`, `RewardedAdResult`, `FullScreenAdResult`, demo/live `AdConfig`, and a no-op web/offline implementation.

- [ ] **Step 1: Write failing configuration tests using Google's Android demo identifiers.**

```ts
it('uses only Google demo IDs when live mode is off', () => {
  expect(resolveAdConfig({ live: false, native: true })).toEqual({
    enabled: true,
    testing: true,
    bannerId: 'ca-app-pub-3940256099942544/9214589741',
    interstitialId: 'ca-app-pub-3940256099942544/1033173712',
    rewardedId: 'ca-app-pub-3940256099942544/5224354917',
  });
});

it('disables web ads even when live IDs exist', () => {
  expect(resolveAdConfig({ live: true, native: false, ids: VALID_LIVE_IDS }).enabled).toBe(false);
});
```

- [ ] **Step 2: Write failing consent tests proving `initialize()` refreshes consent information but does not show a form, `resolveConsentAtSafeMoment()` shows a required available form, and ads stay disabled after refusal/error/offline.**

```ts
it('does not interrupt opening with a consent form', async () => {
  const plugin = fakeAdMob({ status: 'REQUIRED', canRequestAds: false, formAvailable: true });
  const service = createAdService(TEST_CONFIG, plugin);
  await service.initialize();
  expect(plugin.requestConsentInfo).toHaveBeenCalledOnce();
  expect(plugin.showConsentForm).not.toHaveBeenCalled();
  await service.resolveConsentAtSafeMoment();
  expect(plugin.showConsentForm).toHaveBeenCalledOnce();
});
```

- [ ] **Step 3: Run `npm test -- ad-config.test.ts ad-consent.test.ts ad-service.test.ts` and verify failures.**
- [ ] **Step 4: Implement strict ID validation and environment typing. Live mode is `VITE_ADMOB_LIVE === '1'`; test mode never reads account IDs. Invalid live runtime configuration returns `enabled: false` and records a non-player-facing diagnostic rather than crashing the game.**

```ts
interface ImportMetaEnv {
  readonly VITE_ADMOB_LIVE?: '0' | '1';
  readonly VITE_ADMOB_BANNER_ID?: string;
  readonly VITE_ADMOB_REWARDED_ID?: string;
  readonly VITE_ADMOB_INTERSTITIAL_ID?: string;
}
```

- [ ] **Step 5: Implement consent in this order: `AdMob.initialize()` once, `requestConsentInfo({ tagForUnderAgeOfConsent: false })` on every launch, deferred `showConsentForm()` only at a UI-declared safe moment, and requests only when returned `canRequestAds` is true. Map UMP status and `privacyOptionsRequirementStatus` to `ConsentSnapshot`. Catch every plugin failure as `unavailable`.**
- [ ] **Step 6: Implement `showPrivacyOptions()` and expose it only when the last snapshot says privacy options are required. Do not call `resetConsentInfo()` outside tests. Make `destroy()` remove every AdMob listener and banner.**
- [ ] **Step 7: Run the three focused tests and `npm run build`.**
- [ ] **Step 8: Commit `feat: add consent-gated AdMob service`.**

### Task 4: Reserve safe banner space and synchronize approved placements

**Files:**
- Create: `src/native/ads/banner-controller.ts`
- Modify: `src/native/ads/service.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/SettingsSheet.tsx`
- Modify: title/camp/journal/merchant components from the interface plan
- Modify: `src/styles/base.css`
- Modify: `src/styles/game.css`
- Create: `tests/ad-banner.test.tsx`
- Modify: `tests/e2e/readable-layout.spec.ts`

**Interfaces:**
- Consumes: `AdPlacement`, consent snapshot, current App view/flow, and `BannerAdPluginEvents.SizeChanged`.
- Produces: `placementForView`, measured `--ad-banner-inset`, banner show/hide synchronization, and a Settings privacy-options action.

- [ ] **Step 1: Add failing placement tests that enumerate every game surface.**

```ts
it.each([
  ['title', 'title'],
  ['camp', 'camp'],
  ['journal', 'journal'],
  ['merchant', 'merchant'],
  ['opening', 'none'],
  ['onboarding', 'none'],
  ['story', 'none'],
  ['combat', 'none'],
  ['boss', 'none'],
  ['reward', 'none'],
  ['defeat', 'none'],
] as const)('maps %s to %s placement', (surface, placement) => {
  expect(placementForView(surface)).toBe(placement);
});
```

- [ ] **Step 2: Add a failing component test where a `54` px size event produces `--ad-banner-inset: 54px`, a failure/hide event restores `0px`, and the final button remains visible and clickable. Run `npm test -- ad-banner.test.tsx`.**
- [ ] **Step 3: Implement one adaptive bottom banner with `{ adSize: ADAPTIVE_BANNER, position: BOTTOM_CENTER, margin: 0, isTesting: config.testing }`. Subscribe to size, load-failure, and close events once; never register listeners on every React render.**
- [ ] **Step 4: Synchronize placement only after consent allows requests and the opening/onboarding safe-moment gate is complete. Use `hideBanner()` outside approved surfaces and `removeBanner()` on service destroy. Do not render a fake web banner.**
- [ ] **Step 5: Reserve native overlay space with a single root custom property.**

```css
:root { --ad-banner-inset: 0px; }

.app-root,
.game-shell {
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--ad-banner-inset));
}
```

- [ ] **Step 6: Add `Privacy choices` to Settings only when required; clicking it calls `showPrivacyOptions()` and returns focus to the invoking control when the native form closes. Run the component test and the narrow mobile layout spec.**
- [ ] **Step 7: Commit `feat: add safe-hub AdMob banners`.**

### Task 5: Add idempotent rewarded gold and restrained interstitial pacing

**Files:**
- Create: `src/native/ads/policy.ts`
- Modify: `src/native/ads/service.ts`
- Modify: `src/game/state/types.ts`
- Modify: `src/game/state/reducer.ts`
- Modify: `src/game/state.ts`
- Modify: `src/components/RewardPanel.tsx`
- Create: `tests/ad-policy.test.ts`
- Create: `tests/ad-reward.test.ts`
- Modify: `tests/state.test.ts`
- Modify: `tests/interface.test.tsx`

**Interfaces:**
- Consumes: core reward ledger, ordinary battle reward ID/base gold, expedition break state, clock, and `AdService` full-screen methods.
- Produces: persisted `AdPacingState`, `isRewardedGoldEligible`, `shouldShowInterstitial`, `CLAIM_REWARDED_GOLD`, and `RECORD_INTERSTITIAL_SHOWN`.

- [ ] **Step 1: Write failing pure policy tests for the exact limits.**

```ts
it('allows one ordinary battle-gold multiplier and excludes boss rewards', () => {
  expect(isRewardedGoldEligible(ordinaryVictoryOffer())).toBe(true);
  expect(isRewardedGoldEligible(bossVictoryOffer())).toBe(false);
  expect(isRewardedGoldEligible(alreadyClaimedOffer())).toBe(false);
});

it('requires three breaks, twenty minutes, and no rewarded ad at this break', () => {
  const now = Date.parse('2026-08-31T12:30:00.000Z');
  expect(shouldShowInterstitial(pacing({ breaks: 3, lastShownAt: '2026-08-31T12:09:59.000Z' }), now)).toBe(true);
  expect(shouldShowInterstitial(pacing({ breaks: 2, lastShownAt: null }), now)).toBe(false);
  expect(shouldShowInterstitial(pacing({ breaks: 3, rewardedHere: true }), now)).toBe(false);
});
```

- [ ] **Step 2: Add failing reducer tests proving the base gold is already present, `CLAIM_REWARDED_GOLD` adds exactly the original ordinary battle-gold amount once, duplicate commands are referential no-ops, and XP/items/companion loyalty never change.**

```ts
it('cannot duplicate rewarded gold after process resume', () => {
  const first = reduceGame(REWARD_STATE, { type: 'CLAIM_REWARDED_GOLD', rewardOfferId: 'reward-battle-17' }, CONTENT);
  const resumed = roundTripSave(first.state);
  const duplicate = reduceGame(resumed, { type: 'CLAIM_REWARDED_GOLD', rewardOfferId: 'reward-battle-17' }, CONTENT);
  expect(first.state.campaign.bankedGold - REWARD_STATE.campaign.bankedGold).toBe(REWARD_STATE.flow.rewardOffer?.baseGold);
  expect(duplicate.state).toEqual(resumed);
  expect(duplicate.events).toEqual([]);
});
```

- [ ] **Step 3: Run `npm test -- ad-policy.test.ts ad-reward.test.ts state.test.ts` and confirm failures.**
- [ ] **Step 4: Persist the ledger below in save-v2 and add migration defaults. Generate each `rewardOfferId` deterministically from campaign ID plus encounter resolution ordinal, never from wall-clock time.**

```ts
export interface AdPacingState {
  readonly lastInterstitialAt: string | null;
  readonly expeditionBreaksSinceInterstitial: number;
  readonly rewardedShownAtCurrentBreak: boolean;
  readonly claimedRewardOfferIds: readonly string[];
}
```

- [ ] **Step 5: In RewardPanel, label the optional action `Watch Ad — Double Battle Gold`. Disable it while loading, remove it for boss/story/ineligible rewards, and dispatch only when `showRewardedBattleGold()` returns `earned`. Dismissed/unavailable/failed restores the normal Continue path and never removes base gold. Preload the next rewarded ad only after consent.**
- [ ] **Step 6: Implement interstitial policy with constants `MIN_EXPEDITION_BREAKS = 3` and `MIN_INTERSTITIAL_INTERVAL_MS = 1_200_000`. At an eligible camp transition, hide the banner, suspend audio, show once, record time only when actually shown, then restore eligible audio/banner after dismiss/failure. Never call it from cinematic, story, combat, boss, reward, or defeat reducers.**
- [ ] **Step 7: Run the focused tests, interface reward tests, and `npm run build`.**
- [ ] **Step 8: Commit `feat: add fair rewarded and interstitial ads`.**

### Task 6: Configure Android manifests, live guards, and package identity

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `vite.config.ts`
- Create: `scripts/verify-live-admob.mjs`
- Modify: `capacitor.config.ts`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/build.gradle`
- Delete: `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`
- Create: `android/app/src/androidTest/java/com/morrowmere/game/ExampleInstrumentedTest.java`
- Create: `tests/android-config.test.ts`
- Modify: `tests/native-package.test.ts`

**Interfaces:**
- Consumes: four live ad environment variables, four existing upload-signing variables, Vite native modes, and Capacitor plugin sync.
- Produces: repeatable `android:sync` test mode, `android:sync:live`, guarded `bundlePlayRelease`, correct merged manifest, and accurate native package test.

- [ ] **Step 1: Add failing configuration tests that parse committed files and enforce the application-ID metadata, Internet/network permissions, sample debug ID, live validation script, native-mode PWA exclusion, package assertion, and keystore ignores.**

```ts
it('declares AdMob metadata and network access without a Firebase config', () => {
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  expect(manifest).toContain('android.permission.INTERNET');
  expect(manifest).toContain('android.permission.ACCESS_NETWORK_STATE');
  expect(manifest).toContain('com.google.android.gms.ads.APPLICATION_ID');
  expect(manifest).toContain('@string/admob_app_id');
  expect(existsSync('android/app/google-services.json')).toBe(false);
});

it('keeps all android modes free of a service worker', async () => {
  const config = await loadViteConfigForMode('android-live');
  expect(config.plugins.map(pluginName)).not.toContain('vite-plugin-pwa');
});
```

- [ ] **Step 2: Run `npm test -- android-config.test.ts native-package.test.ts` and confirm failures.**
- [ ] **Step 3: Add scripts that keep test and live web bundles distinct. Treat every mode whose name starts with `android` as native in `vite.config.ts`.**

```json
{
  "build:android": "tsc -b && vite build --mode android-test",
  "build:android:live": "node scripts/verify-live-admob.mjs && tsc -b && vite build --mode android-live",
  "android:sync": "npm run build:android && cap sync android",
  "android:sync:live": "npm run build:android:live && cap sync android"
}
```

- [ ] **Step 4: Implement `scripts/verify-live-admob.mjs` to require and validate `MORROWMERE_ADMOB_APP_ID`, `VITE_ADMOB_BANNER_ID`, `VITE_ADMOB_REWARDED_ID`, and `VITE_ADMOB_INTERSTITIAL_ID`. Accept application IDs matching `^ca-app-pub-\\d{16}~\\d{10}$`, unit IDs matching `^ca-app-pub-\\d{16}/\\d{10}$`, and reject every value beginning `ca-app-pub-3940256099942544`. Print variable names only, never values.**
- [ ] **Step 5: Add `.env*.local`, `*.jks`, and `*.keystore` to `.gitignore`. Keep all account IDs and signing passwords outside Git.**
- [ ] **Step 6: Add explicit network permissions before `<application>` and this metadata under `<application>`.**

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="@string/admob_app_id" />
```

- [ ] **Step 7: In `android/app/build.gradle`, set debug and unguarded QA release `admob_app_id` to Google's sample app ID. When `MORROWMERE_ADMOB_APP_ID` exists, release uses it. Add `verifyPlayReleaseConfiguration` that rejects missing/malformed/demo ad IDs and missing `MORROWMERE_KEYSTORE_FILE`, `MORROWMERE_KEYSTORE_PASSWORD`, `MORROWMERE_KEY_ALIAS`, or `MORROWMERE_KEY_PASSWORD`. Register `bundlePlayRelease` to depend on verification and `bundleRelease`; leave ordinary `bundleRelease` available only as a clearly documented test-ID unsigned QA artifact.**

```groovy
def googleSampleAdMobAppId = 'ca-app-pub-3940256099942544~3347511713'
def liveAdMobAppId = System.getenv('MORROWMERE_ADMOB_APP_ID')

buildTypes {
    debug {
        resValue 'string', 'admob_app_id', googleSampleAdMobAppId
    }
    release {
        resValue 'string', 'admob_app_id', liveAdMobAppId ?: googleSampleAdMobAppId
    }
}
```

- [ ] **Step 8: Set `plugins.App.disableBackButtonHandler` only when the custom listener is active. Replace the stale instrumentation test with package `com.morrowmere.game` and assertion `assertEquals("com.morrowmere.game", appContext.getPackageName())`.**
- [ ] **Step 9: Run `npm run android:sync`, the focused tests, and from `android` run `.\gradlew.bat assembleDebug bundleRelease`. Inspect the merged debug manifest with `rg "INTERNET|ACCESS_NETWORK_STATE|AD_ID|APPLICATION_ID" app/build/intermediates/merged_manifests`; confirm GMA's current SDK contributes `com.google.android.gms.permission.AD_ID`.**
- [ ] **Step 10: Commit `build: configure guarded Android advertising`.**

### Task 7: Preserve offline media and enforce the release size gate

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `scripts/check-android-size.mjs`
- Create: `tests/offline-media.test.ts`
- Modify: `tests/native-package.test.ts`
- Modify: `docs/PLAYTEST.md`
- Modify: `release/README.md`

**Interfaces:**
- Consumes: media plan asset manifest, final `public/assets` files, Android test build, and release AAB path.
- Produces: complete web precache manifest, native no-service-worker guarantee, lazy local media checks, and a hard `check:android-size` release gate.

- [ ] **Step 1: Add failing tests that every audio/art/voice manifest path is relative under `/assets/`, exists in `public`, contains no remote URL, and is included by the web Workbox glob.**

```ts
it('keeps gameplay media local and cacheable', () => {
  const manifest = loadAssetManifest();
  for (const entry of Object.values(manifest)) {
    expect(entry.path).toMatch(/^\/assets\//);
    expect(entry.path).not.toMatch(/^https?:/);
    expect(existsSync(resolve('public', entry.path.slice(1)))).toBe(true);
  }
  expect(readFileSync('vite.config.ts', 'utf8')).toContain('ogg,m4a,mp3,json');
});
```

- [ ] **Step 2: Run `npm test -- offline-media.test.ts native-package.test.ts` and confirm the cache/size checks fail.**
- [ ] **Step 3: Extend the web Workbox glob to `**/*.{js,css,html,png,webp,ogg,m4a,mp3,json}` while retaining no PWA plugin for every `android*` mode. Android continues to package `public/assets` into Capacitor's local HTTPS origin and must not register `sw.js` or `registerSW.js`.**
- [ ] **Step 4: Implement `scripts/check-android-size.mjs` to stat `android/app/build/outputs/bundle/release/app-release.aab`, fail if absent, print bytes and MiB, and exit nonzero above `188743680` bytes (180 MiB). Add `"check:android-size": "node scripts/check-android-size.mjs"` to `package.json`.**
- [ ] **Step 5: Run `npm run android:sync`, `.\gradlew.bat bundleRelease` from `android`, then `npm run check:android-size`. Record the measured AAB size in `release/README.md`.**
- [ ] **Step 6: If the gate fails, first lower event-art dimensions/quality within the media plan's visual acceptance thresholds, deduplicate source-identical files, encode music/voice with the approved compressed format, rebuild, and rerun the gate. If the optimized bundle still exceeds 180 MiB, stop the Play artifact and create a dedicated install-time Play Asset Delivery bridge plan; do not silently ship an oversized base or switch required Chronicle I assets to network-only delivery.**
- [ ] **Step 7: Add offline device instructions: launch once, enter a run, enable airplane mode, resume a saved combat turn, use a consumable, play one local music/SFX/voice cue, and complete a story transition while ad controls report unavailable without blocking.**
- [ ] **Step 8: Run the two focused tests, `npm run build`, and `git diff --check`.**
- [ ] **Step 9: Commit `build: enforce offline Android media budget`.**

### Task 8: Update privacy/release documentation, configure external AdMob resources, and deliver artifacts

**Files:**
- Modify: `README.md`
- Modify: `release/README.md`
- Modify: `docs/PLAY-STORE-CHECKLIST.md`
- Modify: `docs/PRIVACY_POLICY.md`
- Modify: `docs/PLAYTEST.md`
- Modify: `store-listing/README.md`
- Modify: `package.json`
- Modify: `android/app/build.gradle`
- Output: `release/MORROWMERE-v1.2.0-debug.apk`
- Output when live IDs are unavailable: `release/MORROWMERE-v1.2.0-test-unsigned.aab`
- Output only when live IDs and signing exist: `release/MORROWMERE-v1.2.0-play-signed.aab`

**Interfaces:**
- Consumes: finished app commit, AdMob account, live app/unit IDs, UMP message, publisher identity/privacy URL, upload keystore, Android SDK 36, and device/emulator.
- Produces: truthful Play declarations, one testable APK, one correctly labeled AAB tier, final smoke evidence, and an exact external-owner blocker list.

- [ ] **Step 1: Add a failing documentation test in `tests/android-config.test.ts` that rejects the stale claims `No ads`, `contains no advertising`, `No sensitive, runtime, or Internet permission`, and `declare no ads` from shipping documents. Run `npm test -- android-config.test.ts` and confirm failure.**
- [ ] **Step 2: Update privacy and release documents in plain English. State that gameplay saves stay local; optional Google Mobile Ads and UMP require network access and may process advertising identifiers, IP/device information, consent state, diagnostics, impressions, and ad interactions under Google's policies. Add publisher legal name, support email, and stable HTTPS privacy-policy URL when supplied; otherwise mark the Play upload gate blocked in `release/README.md` without inserting fabricated identity data.**
- [ ] **Step 3: Update Play checklist declarations to `Contains ads`, revise Data safety from the Google Mobile Ads/UMP SDK disclosure, retain “not designed for children,” publish a GDPR/privacy message in AdMob, expose privacy options in Settings when required, verify `AD_ID`, and recheck current Play policies immediately before upload. Update store copy to describe optional rewarded gold and restrained ads without claiming ad-free play.**
- [ ] **Step 4: Immediately before any persistent external submission, send exactly:**

> I’m ready to create MORROWMERE (`com.morrowmere.game`) in your AdMob account, create these three persistent ad units—`morrowmere_android_banner_safehub`, `morrowmere_android_rewarded_battle_gold`, and `morrowmere_android_interstitial_expedition_break`—and publish MORROWMERE’s GDPR Privacy & messaging consent message. This will change your AdMob account. Confirm?

- [ ] **Step 5: Only after explicit action-time confirmation, create the unpublished Android AdMob app `MORROWMERE` with package `com.morrowmere.game`, then create exactly those three banner, rewarded, and interstitial units. Publish the required Privacy & messaging consent message. Do not expose account email, revenue, or unrelated apps in logs or handoff. If confirmation is unavailable, skip all external mutation and continue with test IDs.**
- [ ] **Step 6: Put the resulting identifiers only into the current shell environment: `MORROWMERE_ADMOB_APP_ID`, `VITE_ADMOB_BANNER_ID`, `VITE_ADMOB_REWARDED_ID`, `VITE_ADMOB_INTERSTITIAL_ID`. Never print their values. Run `node scripts/verify-live-admob.mjs`; it must report only `Live AdMob configuration valid.`**
- [ ] **Step 7: Set `package.json` and Android `versionName` to `1.2.0` and `versionCode` to `4` once for the final artifact set. Run `npm ci`, focused tests, `npm run test:run`, `npm run build`, and `npm run android:sync`.**
- [ ] **Step 8: Build the installable test APK and QA bundle:**

```powershell
Set-Location android
.\gradlew.bat clean assembleDebug bundleRelease
Set-Location ..
npm run check:android-size
```

Copy `android/app/build/outputs/apk/debug/app-debug.apk` to the versioned debug filename and copy the unsigned/test-ID bundle only to the versioned `test-unsigned.aab` filename. Never label this QA bundle Play-ready.

- [ ] **Step 9: Build a Play-signed AAB only when the four existing signing variables and four live AdMob variables are present. Run `npm run android:sync:live`, then from `android` run `.\gradlew.bat bundlePlayRelease`. Confirm the output certificate is the intended upload certificate and copy it to the `play-signed.aab` filename. If signing is absent, report the signed AAB as externally blocked; do not generate or commit a keystore.**
- [ ] **Step 10: On one Android device or emulator, perform one compact smoke pass: fresh launch; complete/skip opening with no ad interruption; consent test flow; title banner with clear bottom inset; start/continue; combat haptic/SFX; background and resume exact turn; earn normal victory gold; earn one rewarded multiplier; prove repeat claim is absent; return through three expedition breaks with clock eligibility and show one interstitial; reject/offline ad path; hardware Back overlay priority; defeat recovery; airplane-mode local story/audio/media.**
- [ ] **Step 11: Inspect the final merged manifest and artifact identities, then run `git status --short`, `git diff --check`, and `git log -1 --oneline`. Update `release/README.md` with version, SHA-256 hashes, exact signed/unsigned status, AAB size, smoke device/API, live/test ad mode, and every remaining Play-owner action.**
- [ ] **Step 12: Run `npm test -- android-config.test.ts native-package.test.ts offline-media.test.ts ad-policy.test.ts ad-reward.test.ts app-lifecycle.test.tsx`, then commit `release: prepare monetized Android Chronicle I`.**

## Focused final verification

- [ ] `npm ci` completes with Capacitor 8-compatible App, Haptics, and AdMob v8 packages.
- [ ] `npm run test:run` and `npm run build` pass on the exact release commit.
- [ ] `npm run android:sync` creates a native bundle without `registerSW.js` or `sw.js`.
- [ ] Debug and QA artifacts contain only Google demo IDs; live verification rejects those IDs.
- [ ] Consent refusal, offline state, load failure, dismissal, and plugin absence all leave gameplay navigable.
- [ ] Rewarded gold is idempotent across save/reload and does not change XP, items, bosses, companions, or base difficulty.
- [ ] Interstitial policy enforces three expedition breaks, 20 minutes, safe camp-only placement, and no same-break rewarded/interstitial chain.
- [ ] Banner size events reserve real bottom space on a 360×800 viewport and clear the inset when hidden or failed.
- [ ] Backgrounding saves before audio pause; resuming restores the exact RNG/combat state and only enabled audio buses.
- [ ] Merged manifest contains `INTERNET`, `ACCESS_NETWORK_STATE`, `APPLICATION_ID`, and the current GMA `AD_ID` contribution; package identity is `com.morrowmere.game`.
- [ ] Final AAB passes the 180 MiB local gate; otherwise Play delivery remains blocked pending the explicit PAD bridge plan.
- [ ] Debug APK installs. QA AAB is explicitly test/unsigned. Play AAB exists only with live IDs, upload signing, truthful privacy/Data safety declarations, and confirmed external AdMob resources.

## Self-review checklist

- [ ] Re-read every advertising, save/lifecycle, haptic, offline, and Android-release requirement in the spec and point it to Tasks 1–8.
- [ ] Search this plan for unfinished markers or vague implementation language and replace every occurrence with an executable instruction.
- [ ] Verify shared names remain exact: `AdService`, `ConsentSnapshot`, `AdPacingState`, `AdPlacement`, `RewardedAdResult`, `CLAIM_REWARDED_GOLD`, `RECORD_INTERSTITIAL_SHOWN`, `subscribeToAppLifecycle`, `playHaptic`.
- [ ] Confirm no task commits account IDs, signing values, keystores, the ElevenLabs credential, copied native web assets, APKs, or AABs.
- [ ] Confirm every task ends in focused tests plus a discrete commit and that no Play-ready claim is made without signed evidence.
