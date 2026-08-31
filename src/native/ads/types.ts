import type {
  AdLoadInfo,
  AdMobBannerSize,
  AdMobError,
  AdMobInitializationOptions,
  AdMobRewardItem,
  AdOptions,
  AdShowOptions,
  AdmobConsentInfo,
  AdmobConsentRequestOptions,
  BannerAdOptions,
  RewardAdOptions,
} from '@capacitor-community/admob';
import type { PluginListenerHandle } from '@capacitor/core';

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
  resolveConsentAtSafeMoment(canPresent?: () => boolean): Promise<ConsentSnapshot>;
  showPrivacyOptions(): Promise<void>;
  setPlacement(placement: AdPlacement, onInsetChange: (heightPx: number) => void): Promise<void>;
  preloadRewarded(): Promise<void>;
  showRewardedBattleGold(): Promise<RewardedAdResult>;
  preloadInterstitial(): Promise<void>;
  showInterstitial(): Promise<FullScreenAdResult>;
  destroy(): Promise<void>;
}

export interface AdUnitIds {
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
}

export interface AdConfig extends AdUnitIds {
  enabled: boolean;
  testing: boolean;
}

export type AdDiagnosticCode =
  | 'invalid-live-config'
  | 'sdk-initialize-failed'
  | 'consent-info-failed'
  | 'consent-form-failed'
  | 'privacy-options-failed'
  | 'banner-failed'
  | 'rewarded-prepare-failed'
  | 'rewarded-show-failed'
  | 'interstitial-prepare-failed'
  | 'interstitial-show-failed'
  | 'cleanup-failed';

export interface AdDiagnostic {
  readonly code: AdDiagnosticCode;
  readonly message: string;
}

export type AdDiagnosticRecorder = (diagnostic: AdDiagnostic) => void;

export interface ResolveAdConfigInput {
  live: boolean;
  native: boolean;
  ids?: Partial<AdUnitIds>;
  recordDiagnostic?: AdDiagnosticRecorder;
}

/**
 * The deliberately small plugin surface used by the game. Keeping the adapter
 * structural makes consent and ad behavior testable without invoking a native bridge.
 */
export interface AdMobPort {
  initialize(options?: AdMobInitializationOptions): Promise<void>;
  requestConsentInfo(options?: AdmobConsentRequestOptions): Promise<AdmobConsentInfo>;
  showConsentForm(): Promise<AdmobConsentInfo>;
  showPrivacyOptionsForm(): Promise<void>;
  showBanner(options: BannerAdOptions): Promise<void>;
  hideBanner?(): Promise<void>;
  resumeBanner?(): Promise<void>;
  removeBanner(): Promise<void>;
  addBannerSizeChangedListener?(
    listener: (size: AdMobBannerSize) => void,
  ): Promise<PluginListenerHandle>;
  addBannerFailedToLoadListener?(
    listener: (error: AdMobError) => void,
  ): Promise<PluginListenerHandle>;
  addBannerClosedListener?(listener: () => void): Promise<PluginListenerHandle>;
  prepareRewardVideoAd(options: RewardAdOptions): Promise<AdLoadInfo>;
  showRewardVideoAd(options?: AdShowOptions): Promise<AdMobRewardItem>;
  addRewardedListener(listener: (reward: AdMobRewardItem) => void): Promise<PluginListenerHandle>;
  addRewardedDismissedListener(listener: () => void): Promise<PluginListenerHandle>;
  addRewardedFailedToShowListener(listener: (error: AdMobError) => void): Promise<PluginListenerHandle>;
  prepareInterstitial(options: AdOptions): Promise<AdLoadInfo>;
  showInterstitial(options?: AdShowOptions): Promise<void>;
  addInterstitialDismissedListener(listener: () => void): Promise<PluginListenerHandle>;
  addInterstitialFailedToShowListener(listener: (error: AdMobError) => void): Promise<PluginListenerHandle>;
  removeAllListeners?(): Promise<void>;
}

export interface AdServiceDependencies {
  isOnline?: () => boolean;
  recordDiagnostic?: AdDiagnosticRecorder;
}
