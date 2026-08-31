import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { OpeningCinematic } from './components/cinematic/OpeningCinematic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameShell } from './components/GameShell';
import { LaunchSplash } from './components/LaunchSplash';
import { NewRunScreen } from './components/NewRunScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { TitleScreen } from './components/TitleScreen';
import {
  cinematicAudio,
  configureGameAudio,
  createFeedbackAudioPort,
  gameAudio,
  playSfx,
  resumeEnabledAudio,
  suspendAllAudio,
} from './game/audio';
import { CHRONICLE1_CONTENT } from './game/content/chronicle1';
import type { ContentIndex } from './game/content/schema';
import { createSaveRepository, type SaveRepository } from './game/persistence/repository';
import type { GameStateV2 } from './game/state/types';
import { placementForView, type AdSurface } from './native/ads/banner-controller';
import { isRewardedGoldEligible, MAX_INTERSTITIALS_PER_SESSION, shouldShowInterstitial } from './native/ads/policy';
import { createRuntimeAdService } from './native/ads/service';
import type { AdService, ConsentSnapshot } from './native/ads/types';
import { consumeFeedbackHaptics } from './native/haptics';
import { minimizeNativeApp, subscribeToAppLifecycle, type AppLifecycleCallbacks } from './native/lifecycle';
import { OPENING_SEQUENCE } from './ui/openingSequence';
import type { UiPorts, UiSettings } from './ui/types';
import { useGameSession } from './ui/useGameSession';
import type { RewardBonusStatus } from './components/RewardPanel';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';
import './styles/cinematic.css';
import './styles/screens.css';
import './styles/combat.css';
import './styles/sheets.css';

const DEFAULT_UI_SETTINGS: UiSettings = Object.freeze({
  textScale: 1,
  highContrast: false,
  reducedMotion: false,
  hapticsEnabled: true,
  reducedHaptics: false,
  sfxVolume: 0.8,
  musicVolume: 0.7,
  voiceVolume: 0.9,
  captions: true,
  voiceReplay: 'automatic',
  screenReaderAnnouncements: true,
});

const UI_SETTINGS_KEY = 'morrowmere.ui-settings.v2';

function loadUiSettings(): UiSettings {
  try {
    const saved = window.localStorage.getItem(UI_SETTINGS_KEY);
    if (!saved) return DEFAULT_UI_SETTINGS;
    const parsed = JSON.parse(saved) as Partial<UiSettings>;
    return { ...DEFAULT_UI_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
}

const partialContent = CHRONICLE1_CONTENT as Partial<ContentIndex>;
const CONTENT: ContentIndex = Object.freeze({
  events: partialContent.events ?? new Map(),
  items: partialContent.items ?? new Map(),
  enemies: partialContent.enemies ?? new Map(),
  encounters: partialContent.encounters ?? new Map(),
  companions: partialContent.companions ?? new Map(),
  merchants: partialContent.merchants ?? new Map(),
  artIds: partialContent.artIds ?? new Set(),
  audioIds: partialContent.audioIds ?? new Set(),
});

const audioFeedback = createFeedbackAudioPort(gameAudio);
const BASE_PORTS: UiPorts = {
  feedback: {
    consume(cues): void {
      audioFeedback.consume(cues);
      consumeFeedbackHaptics(cues);
    },
  },
  cinematicAudio,
  now: () => Date.now(),
};

type LifecycleSubscription = (callbacks: AppLifecycleCallbacks) => Promise<() => Promise<void>>;

export interface AppDependencies {
  readonly saveRepository?: SaveRepository;
  readonly adService?: AdService;
  readonly lifecycle?: LifecycleSubscription;
  readonly suspendAudio?: () => void;
  readonly resumeAudio?: (settings: UiSettings) => void;
  readonly minimizeApp?: () => Promise<void>;
  readonly now?: () => number;
}

interface AppProps { readonly dependencies?: AppDependencies; }

function persistedProfileSettings(settings: UiSettings): GameStateV2['profile']['settings'] {
  return {
    textScale: settings.textScale,
    highContrast: settings.highContrast,
    reducedMotion: settings.reducedMotion,
    sound: settings.sfxVolume > 0,
    music: settings.musicVolume > 0,
    narration: settings.voiceVolume > 0,
    haptics: settings.hapticsEnabled,
    reducedHaptics: settings.reducedHaptics,
  };
}

function surfaceFor(view: ReturnType<typeof useGameSession>['view'], game: GameStateV2 | null, replayingOpening: boolean): AdSurface {
  if (replayingOpening) return 'opening';
  if (view === 'title') return 'title';
  if (view === 'preferences') return 'onboarding';
  if (view === 'opening') return 'opening';
  if (view === 'new-run') return 'new-run';
  if (!game) return 'opening';
  if (game.flow.screen === 'camp') return 'camp';
  if (game.flow.screen === 'merchant') return 'merchant';
  return game.flow.screen;
}

function closeTopDialog(): boolean {
  const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')]
    .filter((dialog) => dialog.closest('[hidden]') === null);
  const topDialog = dialogs.at(-1);
  if (!topDialog) return false;
  topDialog.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  return true;
}

const INITIAL_CONSENT: ConsentSnapshot = Object.freeze({ status: 'unknown', canRequestAds: false, privacyOptionsRequired: false });

export default function App({ dependencies }: AppProps = {}) {
  const [settings, setSettings] = useState<UiSettings>(loadUiSettings);
  const [replayingOpening, setReplayingOpening] = useState(false);
  const [safeMomentReady, setSafeMomentReady] = useState(false);
  const [consent, setConsent] = useState<ConsentSnapshot>(INITIAL_CONSENT);
  const [rewardAttempt, setRewardAttempt] = useState<{ readonly offerId: string; readonly status: RewardBonusStatus } | null>(null);
  const [adOverlayOpen, setAdOverlayOpen] = useState(false);
  const now = dependencies?.now ?? BASE_PORTS.now;
  const ports = useMemo<UiPorts>(() => ({ ...BASE_PORTS, now }), [now]);
  const repository = useMemo(
    () => dependencies?.saveRepository ?? createSaveRepository(window.localStorage, () => new Date(now()).toISOString(), CONTENT),
    [dependencies?.saveRepository, now],
  );
  const adService = useMemo(() => dependencies?.adService ?? createRuntimeAdService(), [dependencies?.adService]);
  const session = useGameSession(repository, CONTENT, ports, settings);
  const sessionRef = useRef(session);
  const settingsRef = useRef(settings);
  const replayingOpeningRef = useRef(replayingOpening);
  const adOverlayOpenRef = useRef(adOverlayOpen);
  const gameBackHandlerRef = useRef<(() => void) | null>(null);
  const appActiveRef = useRef(true);
  const rewardRequestInFlightRef = useRef<string | null>(null);
  const interstitialAttemptRef = useRef<number | null>(null);
  const interstitialsShownRef = useRef(0);
  sessionRef.current = session;
  settingsRef.current = settings;
  replayingOpeningRef.current = replayingOpening;
  adOverlayOpenRef.current = adOverlayOpen;

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
  }, [session.view]);

  useEffect(() => {
    try { window.localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Preferences remain active for this session. */ }
  }, [settings]);

  useEffect(() => {
    configureGameAudio({
      sound: settings.sfxVolume > 0,
      music: settings.musicVolume > 0,
      narration: settings.voiceVolume > 0,
      sfxVolume: settings.sfxVolume,
      musicVolume: settings.musicVolume,
      voiceVolume: settings.voiceVolume,
    });
  }, [settings.musicVolume, settings.sfxVolume, settings.voiceVolume]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSafeMomentReady(true), 1_400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void adService.initialize().then((snapshot) => { if (active) setConsent(snapshot); });
    return () => {
      active = false;
      document.documentElement.style.setProperty('--ad-banner-inset', '0px');
      void adService.destroy();
    };
  }, [adService]);

  const currentSurface = surfaceFor(session.view, session.game, replayingOpening);
  const currentPlacement = adOverlayOpen ? 'none' : placementForView(currentSurface);
  const consentSafeMoment = !adOverlayOpen && (currentSurface === 'title' || currentSurface === 'camp');
  const writeBannerInset = useCallback((heightPx: number) => {
    const safeHeight = Number.isFinite(heightPx) && heightPx > 0 ? heightPx : 0;
    document.documentElement.style.setProperty('--ad-banner-inset', `${safeHeight}px`);
  }, []);

  useEffect(() => {
    if (!safeMomentReady || !consentSafeMoment) return;
    let active = true;
    void adService.resolveConsentAtSafeMoment(() => {
      const latest = sessionRef.current;
      const latestSurface = surfaceFor(latest.view, latest.game, replayingOpeningRef.current);
      return !adOverlayOpenRef.current && (latestSurface === 'title' || latestSurface === 'camp');
    }).then((snapshot) => { if (active) setConsent(snapshot); });
    return () => { active = false; };
  }, [adService, consentSafeMoment, safeMomentReady]);

  useEffect(() => {
    void adService.setPlacement(currentPlacement, writeBannerInset);
  }, [adService, consent, currentPlacement, writeBannerInset]);

  useEffect(() => {
    if (!session.game || !session.activeSlot) return;
    const profile = session.game.profile.settings;
    setSettings((current) => ({
      ...current,
      textScale: profile.textScale,
      highContrast: profile.highContrast,
      reducedMotion: profile.reducedMotion,
      hapticsEnabled: profile.haptics,
      reducedHaptics: profile.reducedHaptics,
      sfxVolume: profile.sound ? (current.sfxVolume > 0 ? current.sfxVolume : DEFAULT_UI_SETTINGS.sfxVolume) : 0,
      musicVolume: profile.music ? (current.musicVolume > 0 ? current.musicVolume : DEFAULT_UI_SETTINGS.musicVolume) : 0,
      voiceVolume: profile.narration ? (current.voiceVolume > 0 ? current.voiceVolume : DEFAULT_UI_SETTINGS.voiceVolume) : 0,
    }));
  }, [session.activeSlot, session.game?.campaign.seed]);

  const changeSettings = useCallback((nextSettings: UiSettings) => {
    if (sessionRef.current.game) {
      sessionRef.current.dispatch({ type: 'update-profile-settings', settings: persistedProfileSettings(nextSettings), updatedAt: new Date(now()).toISOString() });
    }
    setSettings(nextSettings);
  }, [now]);

  const registerBackHandler = useCallback((handler: (() => void) | null) => {
    gameBackHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    const subscribe = dependencies?.lifecycle ?? subscribeToAppLifecycle;
    const pauseAudio = dependencies?.suspendAudio ?? suspendAllAudio;
    const resumeAudio = dependencies?.resumeAudio ?? resumeEnabledAudio;
    const minimize = dependencies?.minimizeApp ?? minimizeNativeApp;
    let cleanup: (() => Promise<void>) | null = null;
    let disposed = false;
    void subscribe({
      onPause: () => {
        appActiveRef.current = false;
        sessionRef.current.flushLatest();
        pauseAudio();
      },
      onResume: () => {
        appActiveRef.current = true;
        resumeAudio(settingsRef.current);
      },
      onBack: () => {
        if (replayingOpeningRef.current) setReplayingOpening(false);
        else if (closeTopDialog()) return;
        else if (sessionRef.current.view === 'game') gameBackHandlerRef.current?.();
        else if (sessionRef.current.view === 'title') void minimize();
        else sessionRef.current.returnToTitle();
      },
    }).then((remove) => {
      if (disposed) void remove();
      else cleanup = remove;
    }).catch(() => undefined);
    return () => {
      disposed = true;
      if (cleanup) void cleanup();
    };
  }, [dependencies?.lifecycle, dependencies?.minimizeApp, dependencies?.resumeAudio, dependencies?.suspendAudio]);

  const pendingReward = session.game?.expedition?.pendingReward ?? null;
  const rewardBonusStatus: RewardBonusStatus | undefined = pendingReward
    ? pendingReward.rewardedGoldSettlement === 'claimed' ? 'claimed'
      : pendingReward.rewardedGoldSettlement === 'ineligible' ? 'ineligible'
        : rewardAttempt?.offerId === pendingReward.rewardOfferId ? rewardAttempt.status
          : consent.canRequestAds ? 'available' : 'unavailable'
    : undefined;

  useEffect(() => {
    if (!pendingReward || !session.game || !consent.canRequestAds || !isRewardedGoldEligible(pendingReward, session.game.adPacing)) return;
    void adService.preloadRewarded();
  }, [adService, consent.canRequestAds, pendingReward?.rewardOfferId, session.game?.adPacing]);

  const requestRewardedGold = useCallback(async (rewardOfferId: string) => {
    if (rewardRequestInFlightRef.current !== null) return;
    const current = sessionRef.current.game;
    const reward = current?.expedition?.pendingReward;
    if (!current || !reward || reward.rewardOfferId !== rewardOfferId || !isRewardedGoldEligible(reward, current.adPacing)) return;
    rewardRequestInFlightRef.current = rewardOfferId;
    setRewardAttempt({ offerId: rewardOfferId, status: 'pending' });
    await adService.setPlacement('none', writeBannerInset);
    (dependencies?.suspendAudio ?? suspendAllAudio)();
    try {
      const result = await adService.showRewardedBattleGold();
      if (result === 'earned') {
        const latest = sessionRef.current.game;
        const latestReward = latest?.expedition?.pendingReward;
        const claimed = Boolean(
          latest
          && latestReward?.rewardOfferId === rewardOfferId
          && isRewardedGoldEligible(latestReward, latest.adPacing)
          && sessionRef.current.dispatch({ type: 'CLAIM_REWARDED_GOLD', rewardOfferId, updatedAt: new Date(now()).toISOString() }),
        );
        setRewardAttempt({ offerId: rewardOfferId, status: claimed ? 'claimed' : 'failed' });
      } else if (sessionRef.current.game?.expedition?.pendingReward?.rewardOfferId === rewardOfferId) {
        setRewardAttempt({ offerId: rewardOfferId, status: result });
      }
    } finally {
      if (rewardRequestInFlightRef.current === rewardOfferId) rewardRequestInFlightRef.current = null;
      if (appActiveRef.current) (dependencies?.resumeAudio ?? resumeEnabledAudio)(settingsRef.current);
      const latest = sessionRef.current;
      const latestPlacement = adOverlayOpenRef.current ? 'none' : placementForView(surfaceFor(latest.view, latest.game, replayingOpeningRef.current));
      await adService.setPlacement(latestPlacement, writeBannerInset);
    }
  }, [adService, dependencies?.resumeAudio, dependencies?.suspendAudio, now, writeBannerInset]);

  useEffect(() => {
    const game = session.game;
    if (!game || !session.transitionEvents.some((event) => event.type === 'camp_banked') || game.flow.screen !== 'camp' || game.expedition || !consent.canRequestAds) return;
    const transition = game.campaign.transitionCounter;
    if (interstitialAttemptRef.current === transition || interstitialsShownRef.current >= MAX_INTERSTITIALS_PER_SESSION || !shouldShowInterstitial(game.adPacing, now())) return;
    interstitialAttemptRef.current = transition;
    void (async () => {
      await adService.setPlacement('none', writeBannerInset);
      (dependencies?.suspendAudio ?? suspendAllAudio)();
      try {
        const latest = sessionRef.current.game;
        if (
          !latest
          || latest.campaign.transitionCounter !== transition
          || latest.flow.screen !== 'camp'
          || latest.expedition
          || !shouldShowInterstitial(latest.adPacing, now())
        ) return;
        if (await adService.showInterstitial() === 'shown') {
          const shownAt = new Date(now()).toISOString();
          if (sessionRef.current.dispatch({ type: 'RECORD_INTERSTITIAL_SHOWN', shownAt, updatedAt: shownAt })) interstitialsShownRef.current += 1;
        }
      } finally {
        if (appActiveRef.current) (dependencies?.resumeAudio ?? resumeEnabledAudio)(settingsRef.current);
        const latest = sessionRef.current;
        const latestPlacement = adOverlayOpenRef.current ? 'none' : placementForView(surfaceFor(latest.view, latest.game, replayingOpeningRef.current));
        void adService.setPlacement(latestPlacement, writeBannerInset);
      }
    })();
  }, [adService, consent.canRequestAds, dependencies?.resumeAudio, dependencies?.suspendAudio, now, session.game, session.transitionEvents, writeBannerInset]);

  useEffect(() => {
    if (consent.canRequestAds && session.game?.flow.screen === 'camp') void adService.preloadInterstitial();
  }, [adService, consent.canRequestAds, session.game?.flow.screen]);

  const showPrivacyOptions = useCallback(async () => {
    await adService.setPlacement('none', writeBannerInset);
    (dependencies?.suspendAudio ?? suspendAllAudio)();
    try {
      await adService.showPrivacyOptions();
      setConsent(await adService.initialize());
    } finally {
      if (appActiveRef.current) (dependencies?.resumeAudio ?? resumeEnabledAudio)(settingsRef.current);
      const latest = sessionRef.current;
      const latestPlacement = adOverlayOpenRef.current ? 'none' : placementForView(surfaceFor(latest.view, latest.game, replayingOpeningRef.current));
      await adService.setPlacement(latestPlacement, writeBannerInset);
    }
  }, [adService, dependencies?.resumeAudio, dependencies?.suspendAudio, writeBannerInset]);

  return (
    <div className="app-root">
      <LaunchSplash />
      <ErrorBoundary onReset={() => { setReplayingOpening(false); session.returnToTitle(); }}>
        <>
          {!replayingOpening && session.view === 'title' && <TitleScreen slots={session.slots} onContinue={(slot) => { playSfx('ui'); session.continueSlot(slot); }} onRecover={(slot) => { playSfx('ui'); session.continueSlot(slot); }} onNew={(slot) => { playSfx('ui'); session.beginSlot(slot); }} onOverlayChange={setAdOverlayOpen} />}
          {!replayingOpening && session.view === 'preferences' && <OnboardingScreen initialSettings={settings} onBack={session.returnToTitle} onComplete={(nextSettings) => { setSettings(nextSettings); session.showOpening(); }} />}
          {!replayingOpening && session.view === 'opening' && <OpeningCinematic sequence={OPENING_SEQUENCE} settings={settings} audio={ports.cinematicAudio} onComplete={session.showNewRun} />}
          {!replayingOpening && session.view === 'new-run' && <NewRunScreen onBack={session.showOpening} onBegin={session.startCampaign} />}
          {session.view === 'game' && session.game && <div hidden={replayingOpening}>
            {session.notice && <p className="session-notice" role="status">{session.notice}</p>}
            <GameShell state={session.game} content={CONTENT} transitionEvents={session.transitionEvents} dispatch={session.dispatch} onSaveAndExit={session.saveAndExit} onMainMenu={session.returnToTitle} onReplayOpening={() => setReplayingOpening(true)} settings={settings} onSettingsChange={changeSettings} rewardBonusStatus={rewardBonusStatus} onRequestRewardedGold={(offerId) => { void requestRewardedGold(offerId); }} onDismissRewardedGold={(offerId) => setRewardAttempt({ offerId, status: 'dismissed' })} registerBackHandler={registerBackHandler} onAdOverlayChange={setAdOverlayOpen} privacyOptionsRequired={consent.privacyOptionsRequired} onPrivacyOptions={showPrivacyOptions} now={() => new Date(ports.now()).toISOString()} />
          </div>}
          {replayingOpening && <OpeningCinematic sequence={OPENING_SEQUENCE} settings={settings} audio={ports.cinematicAudio} completionLabel="Return to Chronicle" onComplete={() => setReplayingOpening(false)} />}
        </>
      </ErrorBoundary>
    </div>
  );
}
