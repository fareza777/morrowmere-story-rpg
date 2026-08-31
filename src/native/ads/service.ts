import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';

import { resolveAdConfigFromEnvironment } from './config';
import { mapConsentInfo, UNAVAILABLE_CONSENT, UNKNOWN_CONSENT } from './consent';
import type {
  AdConfig,
  AdDiagnosticCode,
  AdMobPort,
  AdPlacement,
  AdService,
  AdServiceDependencies,
  ConsentSnapshot,
  FullScreenAdResult,
  RewardedAdResult,
} from './types';

function cloneSnapshot(snapshot: Readonly<ConsentSnapshot>): ConsentSnapshot {
  return { ...snapshot };
}

function browserIsOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function createCapacitorAdMobPort(): AdMobPort {
  const pluginWithCleanup = AdMob as typeof AdMob & {
    removeAllListeners?: () => Promise<void>;
  };

  return {
    initialize: (options) => AdMob.initialize(options),
    requestConsentInfo: (options) => AdMob.requestConsentInfo(options),
    showConsentForm: () => AdMob.showConsentForm(),
    showPrivacyOptionsForm: () => AdMob.showPrivacyOptionsForm(),
    showBanner: (options) => AdMob.showBanner(options),
    hideBanner: () => AdMob.hideBanner(),
    resumeBanner: () => AdMob.resumeBanner(),
    removeBanner: () => AdMob.removeBanner(),
    prepareRewardVideoAd: (options) => AdMob.prepareRewardVideoAd(options),
    showRewardVideoAd: (options) => AdMob.showRewardVideoAd(options),
    prepareInterstitial: (options) => AdMob.prepareInterstitial(options),
    showInterstitial: (options) => AdMob.showInterstitial(options),
    removeAllListeners: pluginWithCleanup.removeAllListeners
      ? () => pluginWithCleanup.removeAllListeners!()
      : undefined,
  };
}

export function createAdService(
  config: Readonly<AdConfig>,
  plugin: AdMobPort,
  dependencies: AdServiceDependencies = {},
): AdService {
  const isOnline = dependencies.isOnline ?? browserIsOnline;
  const recordDiagnostic = (code: AdDiagnosticCode, message: string): void => {
    try {
      dependencies.recordDiagnostic?.({ code, message });
    } catch {
      // A telemetry/diagnostic sink is never allowed to affect gameplay.
    }
  };

  let consentSnapshot = cloneSnapshot(UNKNOWN_CONSENT);
  let consentFormAvailable = false;
  let sdkInitialization: Promise<boolean> | null = null;
  let consentRefresh: Promise<void> | null = null;
  let consentFormResolution: Promise<ConsentSnapshot> | null = null;
  let consentFormAttempted = false;
  let privacyOptionsResolution: Promise<void> | null = null;
  let rewardedPrepared = false;
  let rewardedPreparation: Promise<void> | null = null;
  let rewardedShowing = false;
  let interstitialPrepared = false;
  let interstitialPreparation: Promise<void> | null = null;
  let interstitialShowing = false;
  let bannerVisible = false;
  let activeInsetCallback: ((heightPx: number) => void) | null = null;
  let destroyed = false;
  let destroyPromise: Promise<void> | null = null;

  const unavailableSnapshot = (): ConsentSnapshot => cloneSnapshot(UNAVAILABLE_CONSENT);

  const markUnavailable = (): ConsentSnapshot => {
    consentSnapshot = cloneSnapshot(UNAVAILABLE_CONSENT);
    consentFormAvailable = false;
    return cloneSnapshot(consentSnapshot);
  };

  const runtimeAvailable = (): boolean => {
    if (!config.enabled || destroyed) {
      return false;
    }
    try {
      return isOnline();
    } catch {
      return false;
    }
  };

  const ensureSdkInitialized = async (): Promise<boolean> => {
    if (!runtimeAvailable()) {
      return false;
    }
    if (sdkInitialization) {
      return sdkInitialization;
    }

    sdkInitialization = (async () => {
      try {
        await plugin.initialize({ initializeForTesting: config.testing });
        return true;
      } catch {
        recordDiagnostic('sdk-initialize-failed', 'The native ads SDK was unavailable during initialization.');
        markUnavailable();
        return false;
      }
    })();

    return sdkInitialization;
  };

  const refreshConsentOnce = async (): Promise<ConsentSnapshot> => {
    if (!consentRefresh) {
      consentRefresh = (async () => {
        try {
          const info = await plugin.requestConsentInfo({ tagForUnderAgeOfConsent: false });
          consentFormAvailable = info.isConsentFormAvailable === true;
          consentSnapshot = mapConsentInfo(info);
        } catch {
          recordDiagnostic('consent-info-failed', 'Consent information could not be refreshed for this launch.');
          markUnavailable();
        }
      })();
    }

    await consentRefresh;
    return cloneSnapshot(consentSnapshot);
  };

  const initialize = async (): Promise<ConsentSnapshot> => {
    if (!runtimeAvailable()) {
      return unavailableSnapshot();
    }
    if (!await ensureSdkInitialized() || !runtimeAvailable()) {
      return unavailableSnapshot();
    }
    return refreshConsentOnce();
  };

  const adsMayBeRequested = (): boolean =>
    runtimeAvailable() && consentSnapshot.canRequestAds;

  const removeBanner = async (): Promise<void> => {
    activeInsetCallback?.(0);
    activeInsetCallback = null;
    if (!bannerVisible) {
      return;
    }
    bannerVisible = false;
    try {
      await plugin.removeBanner();
    } catch {
      recordDiagnostic('cleanup-failed', 'The native banner could not be removed cleanly.');
    }
  };

  const service: AdService = {
    initialize,

    async resolveConsentAtSafeMoment(): Promise<ConsentSnapshot> {
      const current = await initialize();
      if (consentFormResolution) {
        return consentFormResolution;
      }
      if (
        current.status !== 'required'
        || !consentFormAvailable
        || consentFormAttempted
        || !runtimeAvailable()
      ) {
        return current;
      }

      if (!consentFormResolution) {
        consentFormAttempted = true;
        consentFormResolution = (async () => {
          try {
            const info = await plugin.showConsentForm();
            if (!runtimeAvailable()) {
              return unavailableSnapshot();
            }
            consentFormAvailable = info.isConsentFormAvailable === true;
            consentSnapshot = mapConsentInfo(info);
            return cloneSnapshot(consentSnapshot);
          } catch {
            recordDiagnostic('consent-form-failed', 'The consent form was unavailable at the requested safe moment.');
            return markUnavailable();
          }
        })();
      }

      const resolution = consentFormResolution;
      try {
        return await resolution;
      } finally {
        if (consentFormResolution === resolution) {
          consentFormResolution = null;
        }
      }
    },

    async showPrivacyOptions(): Promise<void> {
      if (!runtimeAvailable() || !consentSnapshot.privacyOptionsRequired) {
        return;
      }

      if (!privacyOptionsResolution) {
        privacyOptionsResolution = (async () => {
          try {
            await plugin.showPrivacyOptionsForm();
            if (!runtimeAvailable()) {
              return;
            }
            const info = await plugin.requestConsentInfo({ tagForUnderAgeOfConsent: false });
            consentFormAvailable = info.isConsentFormAvailable === true;
            consentSnapshot = mapConsentInfo(info);
          } catch {
            recordDiagnostic('privacy-options-failed', 'The privacy options form could not be displayed or refreshed.');
            markUnavailable();
          }
        })();
      }

      const resolution = privacyOptionsResolution;
      try {
        await resolution;
      } finally {
        if (privacyOptionsResolution === resolution) {
          privacyOptionsResolution = null;
        }
      }
    },

    async setPlacement(
      placement: AdPlacement,
      onInsetChange: (heightPx: number) => void,
    ): Promise<void> {
      activeInsetCallback?.(0);
      activeInsetCallback = onInsetChange;
      onInsetChange(0);

      if (placement === 'none' || !adsMayBeRequested()) {
        await removeBanner();
        return;
      }

      if (bannerVisible) {
        return;
      }

      try {
        await plugin.showBanner({
          adId: config.bannerId,
          isTesting: config.testing,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
        });
        if (!runtimeAvailable()) {
          try {
            await plugin.removeBanner();
          } catch {
            recordDiagnostic('cleanup-failed', 'A late native banner could not be removed during cleanup.');
          }
          return;
        }
        bannerVisible = true;
      } catch {
        bannerVisible = false;
        onInsetChange(0);
        recordDiagnostic('banner-failed', 'The native banner was unavailable for this placement.');
      }
    },

    async preloadRewarded(): Promise<void> {
      if (!adsMayBeRequested() || rewardedPrepared) {
        return;
      }

      if (!rewardedPreparation) {
        rewardedPreparation = (async () => {
          try {
            await plugin.prepareRewardVideoAd({
              adId: config.rewardedId,
              isTesting: config.testing,
            });
            rewardedPrepared = adsMayBeRequested();
          } catch {
            rewardedPrepared = false;
            recordDiagnostic('rewarded-prepare-failed', 'A rewarded ad could not be prepared.');
          }
        })();
      }

      const preparation = rewardedPreparation;
      try {
        await preparation;
      } finally {
        if (rewardedPreparation === preparation) {
          rewardedPreparation = null;
        }
      }
    },

    async showRewardedBattleGold(): Promise<RewardedAdResult> {
      if (!adsMayBeRequested() || rewardedShowing) {
        return 'unavailable';
      }

      rewardedShowing = true;
      try {
        if (!rewardedPrepared) {
          await service.preloadRewarded();
        }
        if (!rewardedPrepared || !adsMayBeRequested()) {
          return 'unavailable';
        }

        rewardedPrepared = false;
        const reward = await plugin.showRewardVideoAd({ adId: config.rewardedId });
        return Number.isFinite(reward.amount) && reward.amount > 0 ? 'earned' : 'failed';
      } catch {
        recordDiagnostic('rewarded-show-failed', 'The prepared rewarded ad could not be shown.');
        return 'failed';
      } finally {
        rewardedShowing = false;
      }
    },

    async preloadInterstitial(): Promise<void> {
      if (!adsMayBeRequested() || interstitialPrepared) {
        return;
      }

      if (!interstitialPreparation) {
        interstitialPreparation = (async () => {
          try {
            await plugin.prepareInterstitial({
              adId: config.interstitialId,
              isTesting: config.testing,
            });
            interstitialPrepared = adsMayBeRequested();
          } catch {
            interstitialPrepared = false;
            recordDiagnostic('interstitial-prepare-failed', 'An interstitial ad could not be prepared.');
          }
        })();
      }

      const preparation = interstitialPreparation;
      try {
        await preparation;
      } finally {
        if (interstitialPreparation === preparation) {
          interstitialPreparation = null;
        }
      }
    },

    async showInterstitial(): Promise<FullScreenAdResult> {
      if (!adsMayBeRequested() || interstitialShowing) {
        return 'unavailable';
      }

      interstitialShowing = true;
      try {
        if (!interstitialPrepared) {
          await service.preloadInterstitial();
        }
        if (!interstitialPrepared || !adsMayBeRequested()) {
          return 'unavailable';
        }

        interstitialPrepared = false;
        await plugin.showInterstitial({ adId: config.interstitialId });
        return 'shown';
      } catch {
        recordDiagnostic('interstitial-show-failed', 'The prepared interstitial ad could not be shown.');
        return 'failed';
      } finally {
        interstitialShowing = false;
      }
    },

    async destroy(): Promise<void> {
      if (destroyPromise) {
        return destroyPromise;
      }
      if (destroyed) {
        return;
      }

      destroyed = true;
      rewardedPrepared = false;
      rewardedShowing = false;
      interstitialPrepared = false;
      interstitialShowing = false;
      activeInsetCallback?.(0);
      activeInsetCallback = null;

      if (!config.enabled) {
        return;
      }

      destroyPromise = (async () => {
        try {
          await plugin.removeBanner();
        } catch {
          recordDiagnostic('cleanup-failed', 'The native banner could not be removed during cleanup.');
        }
        try {
          await plugin.removeAllListeners?.();
        } catch {
          recordDiagnostic('cleanup-failed', 'Native ad listeners could not be removed during cleanup.');
        }
        bannerVisible = false;
      })();

      return destroyPromise;
    },
  };

  return service;
}

export function createRuntimeAdService(
  dependencies: AdServiceDependencies = {},
): AdService {
  const config = resolveAdConfigFromEnvironment(
    import.meta.env,
    undefined,
    dependencies.recordDiagnostic,
  );
  return createAdService(config, createCapacitorAdMobPort(), dependencies);
}
