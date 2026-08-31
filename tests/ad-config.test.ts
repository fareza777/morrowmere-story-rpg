import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEMO_AD_IDS,
  getLastAdConfigDiagnostic,
  resolveAdConfig,
  resolveAdConfigFromEnvironment,
} from '../src/native/ads/config';

const VALID_LIVE_IDS = {
  bannerId: 'ca-app-pub-1234567890123456/1234567890',
  interstitialId: 'ca-app-pub-1234567890123456/2345678901',
  rewardedId: 'ca-app-pub-1234567890123456/3456789012',
};

describe('AdMob configuration', () => {
  beforeEach(() => {
    resolveAdConfig({ live: false, native: false });
  });

  it('uses the locked Android demo IDs in native test mode', () => {
    expect(resolveAdConfig({ live: false, native: true })).toEqual({
      enabled: true,
      testing: true,
      bannerId: 'ca-app-pub-3940256099942544/9214589741',
      interstitialId: 'ca-app-pub-3940256099942544/1033173712',
      rewardedId: 'ca-app-pub-3940256099942544/5224354917',
    });
    expect(DEMO_AD_IDS).toEqual({
      bannerId: 'ca-app-pub-3940256099942544/9214589741',
      interstitialId: 'ca-app-pub-3940256099942544/1033173712',
      rewardedId: 'ca-app-pub-3940256099942544/5224354917',
    });
  });

  it('never reads account IDs in test mode', () => {
    const ids = Object.defineProperties(
      {},
      {
        bannerId: { get: () => { throw new Error('must not read live banner ID'); } },
        interstitialId: { get: () => { throw new Error('must not read live interstitial ID'); } },
        rewardedId: { get: () => { throw new Error('must not read live rewarded ID'); } },
      },
    );

    expect(() => resolveAdConfig({ live: false, native: true, ids })).not.toThrow();
  });

  it('disables ads on web even when live IDs are valid', () => {
    expect(resolveAdConfig({ live: true, native: false, ids: VALID_LIVE_IDS })).toMatchObject({
      enabled: false,
      testing: false,
    });
  });

  it('accepts a complete, syntactically valid, non-demo live configuration', () => {
    expect(resolveAdConfig({ live: true, native: true, ids: VALID_LIVE_IDS })).toEqual({
      enabled: true,
      testing: false,
      ...VALID_LIVE_IDS,
    });
    expect(getLastAdConfigDiagnostic()).toBeNull();
  });

  it.each([
    undefined,
    { ...VALID_LIVE_IDS, bannerId: '' },
    { ...VALID_LIVE_IDS, interstitialId: 'not-an-ad-unit' },
    { ...VALID_LIVE_IDS, rewardedId: DEMO_AD_IDS.rewardedId },
    { ...VALID_LIVE_IDS, rewardedId: VALID_LIVE_IDS.bannerId },
  ])('disables invalid live configuration without exposing values (%s)', (ids) => {
    const diagnostic = vi.fn();

    expect(resolveAdConfig({ live: true, native: true, ids, recordDiagnostic: diagnostic })).toEqual({
      enabled: false,
      testing: false,
      bannerId: '',
      interstitialId: '',
      rewardedId: '',
    });
    expect(diagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: 'invalid-live-config' }));
    expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('ca-app-pub-1234567890123456');
  });

  it('still returns a disabled config if a diagnostic sink fails', () => {
    expect(resolveAdConfig({
      live: true,
      native: true,
      recordDiagnostic: () => { throw new Error('diagnostic sink failed'); },
    })).toMatchObject({ enabled: false, testing: false });
  });

  it('enables live mode only for the exact environment flag value "1"', () => {
    expect(resolveAdConfigFromEnvironment({
      VITE_ADMOB_LIVE: '1',
      VITE_ADMOB_BANNER_ID: VALID_LIVE_IDS.bannerId,
      VITE_ADMOB_INTERSTITIAL_ID: VALID_LIVE_IDS.interstitialId,
      VITE_ADMOB_REWARDED_ID: VALID_LIVE_IDS.rewardedId,
    }, true)).toMatchObject({ enabled: true, testing: false });

    expect(resolveAdConfigFromEnvironment({ VITE_ADMOB_LIVE: '0' }, true)).toEqual({
      enabled: true,
      testing: true,
      ...DEMO_AD_IDS,
    });
  });
});
