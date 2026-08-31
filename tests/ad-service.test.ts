import {
  AdmobConsentStatus,
  type AdmobConsentInfo,
} from '@capacitor-community/admob';
import { describe, expect, it, vi } from 'vitest';

import { createAdService } from '../src/native/ads/service';
import type { AdConfig, AdMobPort } from '../src/native/ads/types';

const TEST_CONFIG: AdConfig = {
  enabled: true,
  testing: true,
  bannerId: 'ca-app-pub-3940256099942544/9214589741',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
};

const DISABLED_CONFIG: AdConfig = {
  enabled: false,
  testing: true,
  bannerId: '',
  interstitialId: '',
  rewardedId: '',
};

function createPlugin(canRequestAds = true): AdMobPort {
  const consent: AdmobConsentInfo = {
    status: canRequestAds ? AdmobConsentStatus.OBTAINED : AdmobConsentStatus.REQUIRED,
    canRequestAds,
    privacyOptionsRequirementStatus: 'NOT_REQUIRED' as AdmobConsentInfo['privacyOptionsRequirementStatus'],
    isConsentFormAvailable: false,
  };

  const rewardedListeners = new Set<(reward: { type: string; amount: number }) => void>();
  const rewardedDismissedListeners = new Set<() => void>();
  const rewardedFailedListeners = new Set<() => void>();
  const interstitialDismissedListeners = new Set<() => void>();
  const interstitialFailedListeners = new Set<() => void>();
  const handle = <Listener,>(listeners: Set<Listener>, listener: Listener) => {
    listeners.add(listener);
    return Promise.resolve({ remove: vi.fn(async () => { listeners.delete(listener); }) });
  };

  return {
    initialize: vi.fn(async () => undefined),
    requestConsentInfo: vi.fn(async () => consent),
    showConsentForm: vi.fn(async () => consent),
    showPrivacyOptionsForm: vi.fn(async () => undefined),
    showBanner: vi.fn(async () => undefined),
    removeBanner: vi.fn(async () => undefined),
    prepareRewardVideoAd: vi.fn(async ({ adId }) => ({ adUnitId: adId })),
    showRewardVideoAd: vi.fn(async () => {
      queueMicrotask(() => {
        rewardedListeners.forEach((listener) => listener({ type: 'gold', amount: 1 }));
        rewardedDismissedListeners.forEach((listener) => listener());
      });
      return { type: 'gold', amount: 1 };
    }),
    addRewardedListener: vi.fn((listener) => handle(rewardedListeners, listener)),
    addRewardedDismissedListener: vi.fn((listener) => handle(rewardedDismissedListeners, listener)),
    addRewardedFailedToShowListener: vi.fn((listener) => handle(rewardedFailedListeners, listener)),
    prepareInterstitial: vi.fn(async ({ adId }) => ({ adUnitId: adId })),
    showInterstitial: vi.fn(async () => {
      queueMicrotask(() => interstitialDismissedListeners.forEach((listener) => listener()));
    }),
    addInterstitialDismissedListener: vi.fn((listener) => handle(interstitialDismissedListeners, listener)),
    addInterstitialFailedToShowListener: vi.fn((listener) => handle(interstitialFailedListeners, listener)),
    removeAllListeners: vi.fn(async () => undefined),
  };
}

describe('ad service', () => {
  it('is a no-op on disabled web configuration', async () => {
    const plugin = createPlugin();
    const service = createAdService(DISABLED_CONFIG, plugin);
    const inset = vi.fn();

    await expect(service.initialize()).resolves.toMatchObject({ status: 'unavailable', canRequestAds: false });
    await service.setPlacement('title', inset);
    await service.preloadRewarded();
    await service.preloadInterstitial();
    await expect(service.showRewardedBattleGold()).resolves.toBe('unavailable');
    await expect(service.showInterstitial()).resolves.toBe('unavailable');
    await service.destroy();

    expect(inset).toHaveBeenLastCalledWith(0);
    expect(plugin.initialize).not.toHaveBeenCalled();
    expect(plugin.showBanner).not.toHaveBeenCalled();
    expect(plugin.removeBanner).not.toHaveBeenCalled();
    expect(plugin.removeAllListeners).not.toHaveBeenCalled();
  });

  it('fails open while offline without touching the plugin', async () => {
    const plugin = createPlugin();
    const service = createAdService(TEST_CONFIG, plugin, { isOnline: () => false });

    await expect(service.initialize()).resolves.toMatchObject({ status: 'unavailable' });
    await expect(service.resolveConsentAtSafeMoment()).resolves.toMatchObject({ status: 'unavailable' });
    await expect(service.showRewardedBattleGold()).resolves.toBe('unavailable');
    expect(plugin.initialize).not.toHaveBeenCalled();
  });

  it('recovers after a temporary offline state without discarding valid consent', async () => {
    let online = true;
    const plugin = createPlugin();
    const service = createAdService(TEST_CONFIG, plugin, { isOnline: () => online });

    await expect(service.initialize()).resolves.toMatchObject({ canRequestAds: true });
    online = false;
    await expect(service.initialize()).resolves.toMatchObject({ status: 'unavailable' });
    online = true;
    await expect(service.initialize()).resolves.toMatchObject({ canRequestAds: true });
    await service.preloadRewarded();

    expect(plugin.initialize).toHaveBeenCalledTimes(1);
    expect(plugin.requestConsentInfo).toHaveBeenCalledTimes(1);
    expect(plugin.prepareRewardVideoAd).toHaveBeenCalledTimes(1);
  });

  it('gates every ad request on canRequestAds', async () => {
    const plugin = createPlugin(false);
    const service = createAdService(TEST_CONFIG, plugin);
    await service.initialize();

    await service.setPlacement('camp', vi.fn());
    await service.preloadRewarded();
    await service.preloadInterstitial();
    await service.showRewardedBattleGold();
    await service.showInterstitial();

    expect(plugin.showBanner).not.toHaveBeenCalled();
    expect(plugin.prepareRewardVideoAd).not.toHaveBeenCalled();
    expect(plugin.prepareInterstitial).not.toHaveBeenCalled();
    expect(plugin.showRewardVideoAd).not.toHaveBeenCalled();
    expect(plugin.showInterstitial).not.toHaveBeenCalled();
  });

  it('uses the resolved IDs and testing flag after consent permits requests', async () => {
    const plugin = createPlugin(true);
    const service = createAdService(TEST_CONFIG, plugin);
    await service.initialize();

    await service.setPlacement('merchant', vi.fn());
    await expect(service.showRewardedBattleGold()).resolves.toBe('earned');
    await service.preloadInterstitial();
    await expect(service.showInterstitial()).resolves.toBe('shown');

    expect(plugin.showBanner).toHaveBeenCalledWith(expect.objectContaining({
      adId: TEST_CONFIG.bannerId,
      isTesting: true,
    }));
    expect(plugin.prepareRewardVideoAd).toHaveBeenCalledWith(expect.objectContaining({
      adId: TEST_CONFIG.rewardedId,
      isTesting: true,
    }));
    expect(plugin.prepareInterstitial).toHaveBeenCalledWith(expect.objectContaining({
      adId: TEST_CONFIG.interstitialId,
      isTesting: true,
    }));
  });

  it('returns contained failure results instead of rejecting gameplay actions', async () => {
    const plugin = createPlugin(true);
    vi.mocked(plugin.showRewardVideoAd).mockRejectedValueOnce(new Error('show failed'));
    vi.mocked(plugin.showInterstitial).mockRejectedValueOnce(new Error('show failed'));
    const service = createAdService(TEST_CONFIG, plugin);
    await service.initialize();

    await expect(service.showRewardedBattleGold()).resolves.toBe('failed');
    await service.preloadInterstitial();
    await expect(service.showInterstitial()).resolves.toBe('failed');
  });

  it('settles on exact full-screen lifecycle events and removes attempt listeners', async () => {
    const plugin = createPlugin(true);
    const rewardedRemovals: Array<ReturnType<typeof vi.fn>> = [];
    const interstitialRemovals: Array<ReturnType<typeof vi.fn>> = [];
    let dismissRewarded: () => void = () => undefined;
    let dismissInterstitial: () => void = () => undefined;
    vi.mocked(plugin.addRewardedListener).mockImplementation(async () => {
      const remove = vi.fn(async () => undefined); rewardedRemovals.push(remove); return { remove };
    });
    vi.mocked(plugin.addRewardedDismissedListener).mockImplementation(async (listener) => {
      dismissRewarded = listener; const remove = vi.fn(async () => undefined); rewardedRemovals.push(remove); return { remove };
    });
    vi.mocked(plugin.addRewardedFailedToShowListener).mockImplementation(async () => {
      const remove = vi.fn(async () => undefined); rewardedRemovals.push(remove); return { remove };
    });
    vi.mocked(plugin.showRewardVideoAd).mockImplementation(async () => new Promise(() => undefined));
    vi.mocked(plugin.addInterstitialDismissedListener).mockImplementation(async (listener) => {
      dismissInterstitial = listener; const remove = vi.fn(async () => undefined); interstitialRemovals.push(remove); return { remove };
    });
    vi.mocked(plugin.addInterstitialFailedToShowListener).mockImplementation(async () => {
      const remove = vi.fn(async () => undefined); interstitialRemovals.push(remove); return { remove };
    });
    const service = createAdService(TEST_CONFIG, plugin);
    await service.initialize();

    const rewarded = service.showRewardedBattleGold();
    await vi.waitFor(() => expect(plugin.showRewardVideoAd).toHaveBeenCalledOnce());
    dismissRewarded();
    await expect(rewarded).resolves.toBe('dismissed');
    expect(rewardedRemovals).toHaveLength(3);
    rewardedRemovals.forEach((remove) => expect(remove).toHaveBeenCalledOnce());

    await service.preloadInterstitial();
    const interstitial = service.showInterstitial();
    await vi.waitFor(() => expect(plugin.showInterstitial).toHaveBeenCalledOnce());
    dismissInterstitial();
    await expect(interstitial).resolves.toBe('shown');
    expect(interstitialRemovals).toHaveLength(2);
    interstitialRemovals.forEach((remove) => expect(remove).toHaveBeenCalledOnce());
  });

  it('records a reward event but keeps the fullscreen attempt pending until dismissal', async () => {
    const plugin = createPlugin(true);
    let emitReward: () => void = () => undefined;
    let dismissRewarded: () => void = () => undefined;
    vi.mocked(plugin.addRewardedListener).mockImplementation(async (listener) => {
      emitReward = () => listener({ type: 'gold', amount: 1 });
      return { remove: async () => undefined };
    });
    vi.mocked(plugin.addRewardedDismissedListener).mockImplementation(async (listener) => {
      dismissRewarded = listener;
      return { remove: async () => undefined };
    });
    vi.mocked(plugin.showRewardVideoAd).mockImplementation(async () => new Promise(() => undefined));
    const service = createAdService(TEST_CONFIG, plugin);
    await service.initialize();

    let settled = false;
    const attempt = service.showRewardedBattleGold().then((result) => {
      settled = true;
      return result;
    });
    await vi.waitFor(() => expect(plugin.showRewardVideoAd).toHaveBeenCalledOnce());
    emitReward();
    await Promise.resolve();
    expect(settled).toBe(false);
    dismissRewarded();
    await expect(attempt).resolves.toBe('earned');
  });

  it('rechecks caller eligibility after listener setup and before native fullscreen show', async () => {
    const plugin = createPlugin(true);
    const service = createAdService(TEST_CONFIG, plugin);
    await service.initialize();

    await expect(service.showRewardedBattleGold(() => false)).resolves.toBe('unavailable');
    await service.preloadInterstitial();
    await expect(service.showInterstitial(() => false)).resolves.toBe('unavailable');

    expect(plugin.showRewardVideoAd).not.toHaveBeenCalled();
    expect(plugin.showInterstitial).not.toHaveBeenCalled();
  });

  it('removes the banner and listeners exactly once on destroy', async () => {
    const plugin = createPlugin(true);
    const service = createAdService(TEST_CONFIG, plugin);
    await service.initialize();
    await service.setPlacement('title', vi.fn());

    await service.destroy();
    await service.destroy();
    await service.preloadRewarded();

    expect(plugin.removeBanner).toHaveBeenCalledTimes(1);
    expect(plugin.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(plugin.prepareRewardVideoAd).not.toHaveBeenCalled();
  });
});
