import type { ContentIndex } from "./content/schema";
import type { CompanionId } from "./domain/ids";
import type { DomainResult } from "./domain/result";

export type CompanionStatus = "unknown" | "recruited" | "left" | "dead";
export type LoyaltyTier = "wary" | "respectful" | "loyal";

export interface CompanionProgressRecord {
  readonly companionId: CompanionId;
  readonly status: CompanionStatus;
  readonly questStage: 0 | 1 | 2 | 3;
  readonly loyalty: number;
  readonly injured: boolean;
}

export interface CompanionRoster {
  readonly records: readonly CompanionProgressRecord[];
  readonly activeCompanionId: CompanionId | null;
}

/** The small campaign surface recruitment needs; Task 6's CampaignState can satisfy it structurally. */
export interface CompanionCampaignContext {
  readonly flags: readonly string[];
  readonly companions: CompanionRoster;
}

export interface RecruitmentEvaluation {
  readonly eligible: boolean;
  readonly missingRequirements: readonly string[];
}

export interface CompanionCombatSnapshot {
  readonly companionId: CompanionId;
  readonly loyaltyTier: LoyaltyTier;
  readonly questStage: 0 | 1 | 2 | 3;
  readonly injured: boolean;
  readonly attack: number;
  readonly guard: number;
  readonly will: number;
  readonly actionId: string;
}

export type CompanionEffect =
  | { readonly type: "recruit"; readonly companionId: CompanionId }
  | { readonly type: "leave"; readonly companionId: CompanionId }
  | { readonly type: "activate"; readonly companionId: CompanionId }
  | {
      readonly type: "change-loyalty";
      readonly companionId: CompanionId;
      readonly amount: number;
    }
  | {
      readonly type: "set-quest-stage";
      readonly companionId: CompanionId;
      readonly questStage: 0 | 1 | 2 | 3;
    }
  | {
      readonly type: "set-injured";
      readonly companionId: CompanionId;
      readonly injured: boolean;
    };

export interface CompanionError {
  readonly code:
    | "already_recruited"
    | "companion_not_found"
    | "companion_not_recruited"
    | "invalid_loyalty_change";
  readonly message: string;
}

function failure<T>(
  code: CompanionError["code"],
  message: string
): DomainResult<T, CompanionError> {
  return { ok: false, error: { code, message } };
}

function recordFor(
  roster: CompanionRoster,
  companionId: CompanionId
): CompanionProgressRecord | undefined {
  return roster.records.find((record) => record.companionId === companionId);
}

function withRecord(
  roster: CompanionRoster,
  replacement: CompanionProgressRecord
): CompanionRoster {
  return {
    ...roster,
    records: roster.records.map((record) =>
      record.companionId === replacement.companionId ? replacement : record
    ),
  };
}

export function loyaltyTier(loyalty: number): LoyaltyTier {
  if (loyalty >= 70) return "loyal";
  if (loyalty >= 35) return "respectful";
  return "wary";
}

export function createCompanionRoster(content: ContentIndex): CompanionRoster {
  return {
    records: [...content.companions.keys()].map((companionId) => ({
      companionId,
      status: "unknown",
      questStage: 0,
      loyalty: 0,
      injured: false,
    })),
    activeCompanionId: null,
  };
}

export function evaluateRecruitment(
  companionId: CompanionId,
  campaign: CompanionCampaignContext,
  content: ContentIndex
): RecruitmentEvaluation {
  const definition = content.companions.get(companionId);
  const progress = recordFor(campaign.companions, companionId);
  if (!definition || !progress)
    return { eligible: false, missingRequirements: ["known-companion"] };

  const missingRequirements: string[] = [];
  for (const decisionId of definition.recruitment.requiredDecisionIds) {
    if (!campaign.flags.includes(decisionId))
      missingRequirements.push(decisionId);
  }
  for (const decisionId of definition.recruitment.blockingDecisionIds ?? []) {
    if (campaign.flags.includes(decisionId))
      missingRequirements.push(`not-${decisionId}`);
  }
  if (progress.questStage !== 3)
    missingRequirements.push("personal-quest-stage-3");
  if (progress.loyalty < 35) missingRequirements.push("loyalty-35");
  if (progress.status === "left" || progress.status === "dead")
    missingRequirements.push("companion-available");
  if (progress.status === "recruited")
    missingRequirements.push("not-already-recruited");
  return { eligible: missingRequirements.length === 0, missingRequirements };
}

export function applyCompanionEffect(
  roster: CompanionRoster,
  effect: CompanionEffect
): DomainResult<CompanionRoster, CompanionError> {
  const record = recordFor(roster, effect.companionId);
  if (!record)
    return failure("companion_not_found", "That companion is not known.");
  if (effect.type === "recruit") {
    if (record.status === "recruited")
      return failure(
        "already_recruited",
        "That companion has already joined you."
      );
    return {
      ok: true,
      value: withRecord(roster, { ...record, status: "recruited" }),
    };
  }
  if (effect.type === "leave") {
    if (record.status !== "recruited")
      return failure(
        "companion_not_recruited",
        "That companion has not joined you."
      );
    return {
      ok: true,
      value: {
        ...withRecord(roster, { ...record, status: "left" }),
        activeCompanionId:
          roster.activeCompanionId === record.companionId
            ? null
            : roster.activeCompanionId,
      },
    };
  }
  if (effect.type === "activate") {
    if (record.status !== "recruited")
      return failure(
        "companion_not_recruited",
        "That companion has not joined you."
      );
    return {
      ok: true,
      value: { ...roster, activeCompanionId: record.companionId },
    };
  }
  if (effect.type === "change-loyalty") {
    if (!Number.isInteger(effect.amount))
      return failure(
        "invalid_loyalty_change",
        "Loyalty changes must be whole numbers."
      );
    return {
      ok: true,
      value: withRecord(roster, {
        ...record,
        loyalty: Math.max(-100, Math.min(100, record.loyalty + effect.amount)),
      }),
    };
  }
  if (effect.type === "set-quest-stage")
    return {
      ok: true,
      value: withRecord(roster, { ...record, questStage: effect.questStage }),
    };
  return {
    ok: true,
    value: withRecord(roster, { ...record, injured: effect.injured }),
  };
}

export function activeCompanion(
  roster: CompanionRoster
): CompanionProgressRecord | null {
  return roster.activeCompanionId
    ? recordFor(roster, roster.activeCompanionId) ?? null
    : null;
}

export function buildCompanionCombatSnapshot(
  roster: CompanionRoster,
  content: ContentIndex
): CompanionCombatSnapshot | null {
  const record = activeCompanion(roster);
  if (!record || record.status !== "recruited") return null;
  const definition = content.companions.get(record.companionId);
  if (!definition) return null;
  const injuryPenalty = record.injured ? 1 : 0;
  return {
    companionId: record.companionId,
    loyaltyTier: loyaltyTier(record.loyalty),
    questStage: record.questStage,
    injured: record.injured,
    attack: Math.max(0, definition.combat.attack - injuryPenalty),
    guard: Math.max(0, definition.combat.guard - injuryPenalty),
    will: definition.combat.will,
    actionId: definition.combat.actionId,
  };
}
