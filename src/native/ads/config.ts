import { Capacitor } from '@capacitor/core';

import type {
  AdConfig,
  AdDiagnostic,
  AdDiagnosticRecorder,
  AdUnitIds,
  ResolveAdConfigInput,
} from './types';

export const DEMO_AD_IDS: Readonly<AdUnitIds> = Object.freeze({
  bannerId: 'ca-app-pub-3940256099942544/9214589741',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
});

const AD_UNIT_PATTERN = /^ca-app-pub-\d{16}\/\d{10}$/;
const GOOGLE_SAMPLE_PUBLISHER_PREFIX = 'ca-app-pub-3940256099942544';

let lastDiagnostic: AdDiagnostic | null = null;

function disabledConfig(testing: boolean): AdConfig {
  return {
    enabled: false,
    testing,
    bannerId: '',
    interstitialId: '',
    rewardedId: '',
  };
}

function recordInvalidLiveConfig(recordDiagnostic?: AdDiagnosticRecorder): void {
  const diagnostic: AdDiagnostic = {
    code: 'invalid-live-config',
    message: 'Live AdMob is disabled because its ad-unit configuration is incomplete or invalid.',
  };
  lastDiagnostic = { ...diagnostic };
  try {
    recordDiagnostic?.({ ...diagnostic });
  } catch {
    // Diagnostics are observational and must never disable the game shell.
  }
}

function isValidLiveId(value: unknown): value is string {
  return typeof value === 'string'
    && AD_UNIT_PATTERN.test(value)
    && !value.startsWith(GOOGLE_SAMPLE_PUBLISHER_PREFIX);
}

export function getLastAdConfigDiagnostic(): AdDiagnostic | null {
  return lastDiagnostic ? { ...lastDiagnostic } : null;
}

export function resolveAdConfig({
  live,
  native,
  ids,
  recordDiagnostic,
}: ResolveAdConfigInput): AdConfig {
  lastDiagnostic = null;

  // Web must never touch native account configuration, even when live mode is set.
  if (!native) {
    return disabledConfig(!live);
  }

  // Test mode is intentionally self-contained and must not inspect account IDs.
  if (!live) {
    return {
      enabled: true,
      testing: true,
      ...DEMO_AD_IDS,
    };
  }

  let bannerId: string | undefined;
  let interstitialId: string | undefined;
  let rewardedId: string | undefined;
  try {
    bannerId = ids?.bannerId;
    interstitialId = ids?.interstitialId;
    rewardedId = ids?.rewardedId;
  } catch {
    recordInvalidLiveConfig(recordDiagnostic);
    return disabledConfig(false);
  }
  const liveIds = [bannerId, interstitialId, rewardedId];

  if (
    !isValidLiveId(bannerId)
    || !isValidLiveId(interstitialId)
    || !isValidLiveId(rewardedId)
    || new Set(liveIds).size !== liveIds.length
  ) {
    recordInvalidLiveConfig(recordDiagnostic);
    return disabledConfig(false);
  }

  return {
    enabled: true,
    testing: false,
    bannerId,
    interstitialId,
    rewardedId,
  };
}

type AdEnvironment = Pick<
  ImportMetaEnv,
  | 'VITE_ADMOB_LIVE'
  | 'VITE_ADMOB_BANNER_ID'
  | 'VITE_ADMOB_INTERSTITIAL_ID'
  | 'VITE_ADMOB_REWARDED_ID'
>;

export function resolveAdConfigFromEnvironment(
  environment: AdEnvironment = import.meta.env,
  native = Capacitor.isNativePlatform(),
  recordDiagnostic?: AdDiagnosticRecorder,
): AdConfig {
  const live = environment.VITE_ADMOB_LIVE === '1';

  if (!live || !native) {
    return resolveAdConfig({ live, native, recordDiagnostic });
  }

  return resolveAdConfig({
    live,
    native,
    ids: {
      bannerId: environment.VITE_ADMOB_BANNER_ID,
      interstitialId: environment.VITE_ADMOB_INTERSTITIAL_ID,
      rewardedId: environment.VITE_ADMOB_REWARDED_ID,
    },
    recordDiagnostic,
  });
}
