import type { PendingBattleReward, AdPacingState } from '../../game/state/types';

export const MIN_EXPEDITION_BREAKS = 3;
export const MIN_INTERSTITIAL_INTERVAL_MS = 1_200_000;
export const MAX_INTERSTITIALS_PER_SESSION = 3;
export const MAX_REWARDED_GOLD_CLAIMS_PER_EXPEDITION = 3;

type RewardPacing = Pick<AdPacingState, 'claimedRewardOfferIds' | 'rewardedClaimsThisExpedition'>;
type InterstitialPacing = Pick<AdPacingState, 'lastInterstitialAt' | 'expeditionBreaksSinceInterstitial' | 'rewardedShownAtCurrentBreak'>;

/** Ads can only add one copy of gold already authored for an ordinary victory. */
export function isRewardedGoldEligible(
  offer: Pick<PendingBattleReward, 'rewardOfferId' | 'baseGold' | 'adEligible' | 'rewardedGoldSettlement'> | null,
  pacing?: RewardPacing,
): boolean {
  if (!offer || !offer.adEligible || offer.baseGold <= 0 || offer.rewardedGoldSettlement !== 'available') return false;
  if (!pacing) return true;
  return pacing.rewardedClaimsThisExpedition < MAX_REWARDED_GOLD_CLAIMS_PER_EXPEDITION
    && !pacing.claimedRewardOfferIds.includes(offer.rewardOfferId);
}

/** Interstitials are limited to safe expedition breaks; callers also enforce the per-session cap. */
export function shouldShowInterstitial(pacing: InterstitialPacing, now: number): boolean {
  if (!Number.isFinite(now)
    || pacing.expeditionBreaksSinceInterstitial < MIN_EXPEDITION_BREAKS
    || pacing.rewardedShownAtCurrentBreak) return false;
  if (pacing.lastInterstitialAt === null) return true;
  const lastShownAt = Date.parse(pacing.lastInterstitialAt);
  return Number.isFinite(lastShownAt) && now - lastShownAt >= MIN_INTERSTITIAL_INTERVAL_MS;
}
