import {
  AdmobConsentStatus,
  PrivacyOptionsRequirementStatus,
  type AdmobConsentInfo,
} from '@capacitor-community/admob';
import { describe, expect, it, vi } from 'vitest';

import { mapConsentInfo, UNAVAILABLE_CONSENT } from '../src/native/ads/consent';
import { createAdService } from '../src/native/ads/service';
import type { AdConfig, AdMobPort } from '../src/native/ads/types';

const TEST_CONFIG: AdConfig = {
  enabled: true,
  testing: true,
  bannerId: 'ca-app-pub-3940256099942544/9214589741',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
};

function consentInfo(
  status: AdmobConsentStatus,
  canRequestAds: boolean,
  privacyOptionsRequirementStatus = PrivacyOptionsRequirementStatus.NOT_REQUIRED,
  isConsentFormAvailable = false,
): AdmobConsentInfo {
  return { status, canRequestAds, privacyOptionsRequirementStatus, isConsentFormAvailable };
}

function createPlugin(
  initial: AdmobConsentInfo,
  afterForm: AdmobConsentInfo = initial,
): AdMobPort {
  return {
    initialize: vi.fn(async () => undefined),
    requestConsentInfo: vi.fn(async () => initial),
    showConsentForm: vi.fn(async () => afterForm),
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

describe('consent mapping', () => {
  it.each([
    [AdmobConsentStatus.UNKNOWN, 'unknown'],
    [AdmobConsentStatus.REQUIRED, 'required'],
    [AdmobConsentStatus.OBTAINED, 'obtained'],
    [AdmobConsentStatus.NOT_REQUIRED, 'not-required'],
  ] as const)('maps %s to %s', (pluginStatus, expectedStatus) => {
    expect(mapConsentInfo(consentInfo(pluginStatus, false)).status).toBe(expectedStatus);
  });

  it('maps request permission and privacy-option requirements independently', () => {
    expect(mapConsentInfo(consentInfo(
      AdmobConsentStatus.OBTAINED,
      true,
      PrivacyOptionsRequirementStatus.REQUIRED,
    ))).toEqual({
      status: 'obtained',
      canRequestAds: true,
      privacyOptionsRequired: true,
    });
  });

  it('fails closed for malformed plugin consent data', () => {
    expect(mapConsentInfo({
      status: 'BROKEN',
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'BROKEN',
    } as unknown as AdmobConsentInfo)).toEqual({
      status: 'unknown',
      canRequestAds: false,
      privacyOptionsRequired: false,
    });
  });
});

describe('consent lifecycle', () => {
  it('initializes once and refreshes consent once for the launch without opening a form', async () => {
    const required = consentInfo(AdmobConsentStatus.REQUIRED, false, undefined, true);
    const plugin = createPlugin(required);
    const service = createAdService(TEST_CONFIG, plugin);

    await expect(service.initialize()).resolves.toEqual({
      status: 'required',
      canRequestAds: false,
      privacyOptionsRequired: false,
    });
    await service.initialize();

    expect(plugin.initialize).toHaveBeenCalledTimes(1);
    expect(plugin.requestConsentInfo).toHaveBeenCalledTimes(1);
    expect(plugin.requestConsentInfo).toHaveBeenCalledWith({ tagForUnderAgeOfConsent: false });
    expect(plugin.showConsentForm).not.toHaveBeenCalled();
  });

  it('defers a required available consent form until the explicit safe moment', async () => {
    const required = consentInfo(AdmobConsentStatus.REQUIRED, false, undefined, true);
    const obtained = consentInfo(AdmobConsentStatus.OBTAINED, true);
    const plugin = createPlugin(required, obtained);
    const service = createAdService(TEST_CONFIG, plugin);

    await service.initialize();
    expect(plugin.showConsentForm).not.toHaveBeenCalled();
    await expect(service.resolveConsentAtSafeMoment()).resolves.toEqual({
      status: 'obtained',
      canRequestAds: true,
      privacyOptionsRequired: false,
    });
    expect(plugin.showConsentForm).toHaveBeenCalledTimes(1);
    await expect(service.initialize()).resolves.toMatchObject({ status: 'obtained', canRequestAds: true });
  });

  it('keeps ads unavailable after refusal or consent failure', async () => {
    const required = consentInfo(AdmobConsentStatus.REQUIRED, false, undefined, true);
    const refusingPlugin = createPlugin(required, required);
    const refusingService = createAdService(TEST_CONFIG, refusingPlugin);

    await refusingService.initialize();
    await expect(refusingService.resolveConsentAtSafeMoment()).resolves.toMatchObject({ canRequestAds: false });
    await refusingService.resolveConsentAtSafeMoment();
    await refusingService.preloadRewarded();
    expect(refusingPlugin.showConsentForm).toHaveBeenCalledTimes(1);
    expect(refusingPlugin.prepareRewardVideoAd).not.toHaveBeenCalled();

    const failingPlugin = createPlugin(required);
    vi.mocked(failingPlugin.requestConsentInfo).mockRejectedValueOnce(new Error('offline'));
    const failingService = createAdService(TEST_CONFIG, failingPlugin);
    await expect(failingService.initialize()).resolves.toEqual(UNAVAILABLE_CONSENT);
    await failingService.preloadInterstitial();
    expect(failingPlugin.prepareInterstitial).not.toHaveBeenCalled();
  });

  it('opens privacy options only when the last snapshot requires them', async () => {
    const required = consentInfo(
      AdmobConsentStatus.OBTAINED,
      true,
      PrivacyOptionsRequirementStatus.REQUIRED,
    );
    const plugin = createPlugin(required);
    const service = createAdService(TEST_CONFIG, plugin);

    await service.initialize();
    await service.showPrivacyOptions();
    expect(plugin.showPrivacyOptionsForm).toHaveBeenCalledTimes(1);
    expect(plugin.requestConsentInfo).toHaveBeenCalledTimes(2);

    const ordinaryPlugin = createPlugin(consentInfo(AdmobConsentStatus.OBTAINED, true));
    const ordinaryService = createAdService(TEST_CONFIG, ordinaryPlugin);
    await ordinaryService.initialize();
    await ordinaryService.showPrivacyOptions();
    expect(ordinaryPlugin.showPrivacyOptionsForm).not.toHaveBeenCalled();
  });
});
