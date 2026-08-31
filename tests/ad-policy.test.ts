import { describe, expect, it } from 'vitest';
import type { AdPacingState, PendingBattleReward } from '../src/game/state/types';
import {
  isRewardedGoldEligible,
  MAX_INTERSTITIALS_PER_SESSION,
  MAX_REWARDED_GOLD_CLAIMS_PER_EXPEDITION,
  MIN_EXPEDITION_BREAKS,
  MIN_INTERSTITIAL_INTERVAL_MS,
  shouldShowInterstitial,
} from '../src/native/ads/policy';

const OFFER_ID = 'reward:73:991:4:road-patrol';

function offer(
  overrides: Partial<Pick<PendingBattleReward, 'rewardOfferId' | 'baseGold' | 'adEligible' | 'rewardedGoldSettlement'>> = {},
) {
  return {
    rewardOfferId: OFFER_ID,
    baseGold: 8,
    adEligible: true,
    rewardedGoldSettlement: 'available' as const,
    ...overrides,
  };
}

function pacing(overrides: Partial<AdPacingState> = {}): AdPacingState {
  return {
    lastInterstitialAt: null,
    expeditionBreaksSinceInterstitial: 0,
    rewardedShownAtCurrentBreak: false,
    claimedRewardOfferIds: [],
    rewardedClaimsThisExpedition: 0,
    ...overrides,
  };
}

describe('ad policy', () => {
  it('locks the exact rewarded and interstitial release limits', () => {
    expect(MIN_EXPEDITION_BREAKS).toBe(3);
    expect(MIN_INTERSTITIAL_INTERVAL_MS).toBe(1_200_000);
    expect(MAX_INTERSTITIALS_PER_SESSION).toBe(3);
    expect(MAX_REWARDED_GOLD_CLAIMS_PER_EXPEDITION).toBe(3);
  });

  it('allows only one available positive-gold offer from an ordinary battle', () => {
    expect(isRewardedGoldEligible(offer())).toBe(true);
    expect(isRewardedGoldEligible(null)).toBe(false);
    expect(isRewardedGoldEligible(offer({ adEligible: false }))).toBe(false);
    expect(isRewardedGoldEligible(offer({ baseGold: 0 }))).toBe(false);
    expect(isRewardedGoldEligible(offer({ rewardedGoldSettlement: 'ineligible' }))).toBe(false);
    expect(isRewardedGoldEligible(offer({ rewardedGoldSettlement: 'claimed' }))).toBe(false);
    expect(isRewardedGoldEligible(offer(), pacing({ claimedRewardOfferIds: [OFFER_ID] }))).toBe(false);
  });

  it('allows the third expedition claim but never a fourth', () => {
    expect(isRewardedGoldEligible(offer(), pacing({ rewardedClaimsThisExpedition: 2 }))).toBe(true);
    expect(isRewardedGoldEligible(offer(), pacing({ rewardedClaimsThisExpedition: 3 }))).toBe(false);
  });

  it('requires three breaks, twenty full minutes, and no rewarded ad at the current break', () => {
    const now = Date.parse('2026-08-31T12:30:00.000Z');

    expect(shouldShowInterstitial(pacing({
      expeditionBreaksSinceInterstitial: 3,
      lastInterstitialAt: '2026-08-31T12:10:00.000Z',
    }), now)).toBe(true);
    expect(shouldShowInterstitial(pacing({
      expeditionBreaksSinceInterstitial: 3,
      lastInterstitialAt: '2026-08-31T12:10:00.001Z',
    }), now)).toBe(false);
    expect(shouldShowInterstitial(pacing({ expeditionBreaksSinceInterstitial: 2 }), now)).toBe(false);
    expect(shouldShowInterstitial(pacing({
      expeditionBreaksSinceInterstitial: 3,
      rewardedShownAtCurrentBreak: true,
    }), now)).toBe(false);
    expect(shouldShowInterstitial(pacing({ expeditionBreaksSinceInterstitial: 3 }), now)).toBe(true);
    expect(shouldShowInterstitial(pacing({
      expeditionBreaksSinceInterstitial: 3,
      lastInterstitialAt: 'not-a-date',
    }), now)).toBe(false);
    expect(shouldShowInterstitial(pacing({ expeditionBreaksSinceInterstitial: 3 }), Number.NaN)).toBe(false);
  });
});
