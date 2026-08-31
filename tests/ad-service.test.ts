import {
  AdmobConsentStatus,
  PrivacyOptionsRequirementStatus,
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
    privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.NOT_REQUIRED,
    isConsentFormAvailable: false,
  };

  return {
    initialize: vi.fn(async () => undefined),
    requestConsentInfo: vi.fn(async () => consent),
    showConsentForm: vi.fn(async () => consent),
    showPrivacyOptionsForm: vi.fn(async () => undefined),
    showBanner: vi.fn(async () => undefined),
    removeBanner: vi.fn(async () => undefined),
    prepareRewardVideoAd: vi.fn(async ({ adId }) => ({ adUnitId: adId })),
    showRewardVideoAd: vi.fn(async () => ({ type: 'gold', amount: 1 })),
    prepareInterstitial: vi.fn(async ({ adId }) => ({ adUnitId: adId })),
    showInterstitial: vi.fn(async () => undefined),
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
    await expect(service.showInterstitial()).resolves.toBe('failed');
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
