import {
  BannerAdPosition,
  BannerAdSize,
  type AdMobBannerSize,
  type AdMobError,
  type BannerAdOptions,
} from '@capacitor-community/admob';
import type { PluginListenerHandle } from '@capacitor/core';

import type {
  AdConfig,
  AdDiagnosticRecorder,
  AdPlacement,
} from './types';

export type AdSurface =
  | 'title'
  | 'camp'
  | 'journal'
  | 'merchant'
  | 'opening'
  | 'onboarding'
  | 'new-run'
  | 'story'
  | 'combat'
  | 'boss'
  | 'reward'
  | 'defeat'
  | 'ending';

export interface BannerControllerPlugin {
  showBanner(options: BannerAdOptions): Promise<void>;
  hideBanner(): Promise<void>;
  resumeBanner(): Promise<void>;
  removeBanner(): Promise<void>;
  addBannerSizeChangedListener(
    listener: (size: AdMobBannerSize) => void,
  ): Promise<PluginListenerHandle>;
  addBannerFailedToLoadListener(
    listener: (error: AdMobError) => void,
  ): Promise<PluginListenerHandle>;
  addBannerClosedListener(listener: () => void): Promise<PluginListenerHandle>;
}

export interface BannerController {
  setPlacement(
    placement: AdPlacement,
    canRequestAds: boolean,
    onInsetChange: (heightPx: number) => void,
  ): Promise<void>;
  destroy(): Promise<void>;
}

type BannerState = 'absent' | 'showing' | 'visible' | 'hidden';

export function placementForView(surface: AdSurface): AdPlacement {
  switch (surface) {
    case 'title':
      return 'title';
    case 'camp':
      return 'camp';
    case 'merchant':
      return 'merchant';
    case 'journal':
    case 'opening':
    case 'onboarding':
    case 'new-run':
    case 'story':
    case 'combat':
    case 'boss':
    case 'reward':
    case 'defeat':
    case 'ending':
    default:
      return 'none';
  }
}

export function createBannerController(
  config: Readonly<AdConfig>,
  plugin: BannerControllerPlugin,
  recordDiagnostic?: AdDiagnosticRecorder,
): BannerController {
  let desiredPlacement: AdPlacement = 'none';
  let consentAllowsRequests = false;
  let activeInsetCallback: ((heightPx: number) => void) | null = null;
  let lastMeasuredHeight = 0;
  let bannerState: BannerState = 'absent';
  let eventGeneration = 0;
  let destroyed = false;
  let listenerSetup: Promise<boolean> | null = null;
  const listenerHandles: PluginListenerHandle[] = [];
  let synchronization: Promise<void> = Promise.resolve();
  let destroyPromise: Promise<void> | null = null;

  const report = (code: 'banner-failed' | 'cleanup-failed', message: string): void => {
    try {
      recordDiagnostic?.({ code, message });
    } catch {
      // Diagnostics are observational and cannot block the game shell.
    }
  };

  const writeInset = (heightPx: number): void => {
    try {
      activeInsetCallback?.(heightPx);
    } catch {
      // A host callback cannot be allowed to break native-ad cleanup.
    }
  };

  const clearInset = (): void => {
    writeInset(0);
  };

  const isApprovedPlacement = (): boolean =>
    desiredPlacement === 'title'
    || desiredPlacement === 'camp'
    || desiredPlacement === 'merchant';

  const shouldDisplay = (): boolean =>
    config.enabled
    && !destroyed
    && consentAllowsRequests
    && isApprovedPlacement();

  const onSizeChanged = (size: AdMobBannerSize): void => {
    if (
      destroyed
      || !shouldDisplay()
      || (bannerState !== 'showing' && bannerState !== 'visible')
    ) {
      return;
    }

    const nextHeight = Number.isFinite(size.height) && size.height >= 0
      ? size.height
      : 0;
    lastMeasuredHeight = nextHeight;
    writeInset(nextHeight);
  };

  const onFailedToLoad = (_error: AdMobError): void => {
    if (destroyed) {
      return;
    }
    eventGeneration += 1;
    bannerState = 'absent';
    lastMeasuredHeight = 0;
    clearInset();
  };

  const onClosed = (): void => {
    if (destroyed) {
      return;
    }
    eventGeneration += 1;
    bannerState = 'hidden';
    lastMeasuredHeight = 0;
    clearInset();
  };

  const registerHandle = async (
    registration: () => Promise<PluginListenerHandle>,
  ): Promise<boolean> => {
    if (destroyed) {
      return false;
    }

    try {
      const handle = await registration();
      if (destroyed) {
        try {
          await handle.remove();
        } catch {
          report('cleanup-failed', 'A late banner listener could not be removed.');
        }
        return false;
      }
      listenerHandles.push(handle);
      return true;
    } catch {
      report('banner-failed', 'A native banner listener could not be registered.');
      return false;
    }
  };

  const ensureListeners = (): Promise<boolean> => {
    if (!listenerSetup) {
      listenerSetup = (async () => {
        const sizeReady = await registerHandle(
          () => plugin.addBannerSizeChangedListener(onSizeChanged),
        );
        const failureReady = await registerHandle(
          () => plugin.addBannerFailedToLoadListener(onFailedToLoad),
        );
        const closeReady = await registerHandle(
          () => plugin.addBannerClosedListener(onClosed),
        );
        return sizeReady && failureReady && closeReady;
      })();
    }
    return listenerSetup;
  };

  const hideBanner = async (): Promise<void> => {
    clearInset();
    if (bannerState === 'absent' || bannerState === 'hidden') {
      return;
    }

    const generation = ++eventGeneration;
    try {
      await plugin.hideBanner();
    } catch {
      report('banner-failed', 'The native banner could not be hidden.');
    }
    if (eventGeneration === generation) {
      bannerState = 'hidden';
    }
  };

  const showBanner = async (): Promise<void> => {
    const generation = ++eventGeneration;
    bannerState = 'showing';
    try {
      await plugin.showBanner({
        adId: config.bannerId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: config.testing,
      });
    } catch {
      if (eventGeneration === generation) {
        bannerState = 'absent';
      }
      lastMeasuredHeight = 0;
      clearInset();
      report('banner-failed', 'The native banner was unavailable for this placement.');
      return;
    }

    if (eventGeneration !== generation) {
      return;
    }
    bannerState = 'visible';
    if (!shouldDisplay()) {
      await hideBanner();
      return;
    }
    writeInset(lastMeasuredHeight);
  };

  const resumeBanner = async (): Promise<void> => {
    const generation = ++eventGeneration;
    bannerState = 'showing';
    try {
      await plugin.resumeBanner();
    } catch {
      if (eventGeneration === generation) {
        bannerState = 'hidden';
      }
      clearInset();
      report('banner-failed', 'The native banner could not be resumed.');
      return;
    }

    if (eventGeneration !== generation) {
      return;
    }
    bannerState = 'visible';
    if (!shouldDisplay()) {
      await hideBanner();
      return;
    }
    writeInset(lastMeasuredHeight);
  };

  const synchronize = async (): Promise<void> => {
    if (!shouldDisplay()) {
      await hideBanner();
      return;
    }

    const listenersReady = await ensureListeners();
    if (!listenersReady || !shouldDisplay()) {
      await hideBanner();
      return;
    }

    if (bannerState === 'visible') {
      writeInset(lastMeasuredHeight);
      return;
    }
    if (bannerState === 'hidden') {
      await resumeBanner();
      return;
    }
    if (bannerState === 'absent') {
      await showBanner();
    }
  };

  const scheduleSynchronization = (): Promise<void> => {
    const next = synchronization.then(synchronize, synchronize).catch(() => {
      lastMeasuredHeight = 0;
      clearInset();
      report('banner-failed', 'Banner placement synchronization failed safely.');
    });
    synchronization = next;
    return next;
  };

  return {
    setPlacement(placement, canRequestAds, onInsetChange) {
      writeInset(0);
      activeInsetCallback = onInsetChange;
      desiredPlacement = placement;
      consentAllowsRequests = canRequestAds === true;
      clearInset();

      if (destroyed) {
        activeInsetCallback = null;
        return Promise.resolve();
      }
      return scheduleSynchronization();
    },

    destroy() {
      if (destroyPromise) {
        return destroyPromise;
      }

      destroyed = true;
      desiredPlacement = 'none';
      consentAllowsRequests = false;
      clearInset();
      activeInsetCallback = null;

      destroyPromise = (async () => {
        await synchronization;
        if (listenerSetup) {
          await listenerSetup;
        }

        for (const handle of listenerHandles.splice(0)) {
          try {
            await handle.remove();
          } catch {
            report('cleanup-failed', 'A banner listener could not be removed during cleanup.');
          }
        }

        if (config.enabled) {
          try {
            await plugin.removeBanner();
          } catch {
            report('cleanup-failed', 'The final native banner could not be removed during cleanup.');
          }
        }
        bannerState = 'absent';
        lastMeasuredHeight = 0;
      })();

      return destroyPromise;
    },
  };
}
