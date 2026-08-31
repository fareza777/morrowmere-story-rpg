import { describe, expect, it } from "vitest";
import {
  applyCompanionEffect,
  buildCompanionCombatSnapshot,
  createCompanionRoster,
  evaluateRecruitment,
  loyaltyTier,
  type CompanionCampaignContext,
  type CompanionRoster,
} from "../src/game/companions";
import type {
  CompanionDefinition,
  ContentIndex,
} from "../src/game/content/schema";
import type { CompanionId, EventId } from "../src/game/domain/ids";

const companionId = (id: string) => id as CompanionId;
const REQUIREMENTS: Readonly<Record<string, readonly string[]>> = {
  mara: [
    "mara-met",
    "greywatch-civilians-protected",
    "military-betrayal-exposed",
    "mara-scouts-supplied",
  ],
  rukhar: [
    "rukhar-met",
    "orc-courier-spared",
    "retaliation-prevented",
    "peace-evidence-carried",
    "political-cost-accepted",
  ],
  caldus: [
    "caldus-met",
    "refugees-protected",
    "hostage-leverage-found",
    "caldus-confidence-kept",
    "hostages-rescued",
  ],
  lyra: [
    "lyra-met",
    "royal-seals-collected",
    "evidence-shared-with-lyra",
    "lyra-expertise-respected",
    "dangerous-magic-refused",
  ],
  talla: [
    "talla-met",
    "goblin-courier-spared",
    "secret-bargain-honored",
    "goblin-refuge-hidden",
    "profitable-betrayal-refused",
  ],
};

function contentFixture(): ContentIndex {
  const companions = new Map<CompanionId, CompanionDefinition>(
    Object.entries(REQUIREMENTS).map(([id, requiredDecisionIds]) => [
      companionId(id),
      {
        id: companionId(id),
        name: id,
        recruitment: {
          requiredDecisionIds,
          blockingDecisionIds: [`${id}-betrayed`],
        },
        personalQuestIds: [
          "quest-one",
          "quest-two",
          "quest-three",
        ] as EventId[],
        combat: { attack: 3, guard: 2, will: 1, actionId: `${id}-action` },
      },
    ])
  );
  return {
    events: new Map(),
    items: new Map(),
    enemies: new Map(),
    encounters: new Map(),
    companions,
    merchants: new Map(),
    artIds: new Set(),
    audioIds: new Set(),
  };
}

function rosterWithProgress(content: ContentIndex): CompanionRoster {
  return {
    ...createCompanionRoster(content),
    records: [...content.companions.keys()].map((id) => ({
      companionId: id,
      status: "unknown" as const,
      questStage: 3 as const,
      loyalty: 35,
      injured: false,
    })),
  };
}

function campaignWithFlags(
  flags: readonly string[],
  companions: CompanionRoster
): CompanionCampaignContext {
  return { flags, companions };
}

describe("companions", () => {
  it("does not recruit Rukhar from a single favorable choice", () => {
    const content = contentFixture();
    expect(
      evaluateRecruitment(
        companionId("rukhar"),
        campaignWithFlags(
          ["rukhar-met", "orc-courier-spared"],
          rosterWithProgress(content)
        ),
        content
      ).eligible
    ).toBe(false);
  });

  it.each(Object.keys(REQUIREMENTS))(
    "makes %s reachable only after all authored decisions and relationship progress",
    (id) => {
      const content = contentFixture();
      expect(
        evaluateRecruitment(
          companionId(id),
          campaignWithFlags(REQUIREMENTS[id]!, rosterWithProgress(content)),
          content
        ).eligible
      ).toBe(true);
      expect(
        evaluateRecruitment(
          companionId(id),
          campaignWithFlags([], rosterWithProgress(content)),
          content
        ).eligible
      ).toBe(false);
    }
  );

  it("rejects an otherwise-ready companion after their blocking betrayal decision", () => {
    const content = contentFixture();
    expect(
      evaluateRecruitment(
        companionId("mara"),
        campaignWithFlags(
          [...REQUIREMENTS.mara, "mara-betrayed"],
          rosterWithProgress(content)
        ),
        content
      ).eligible
    ).toBe(false);
  });

  it("keeps only one recruited companion active", () => {
    const content = contentFixture();
    const mara = applyCompanionEffect(createCompanionRoster(content), {
      type: "recruit",
      companionId: companionId("mara"),
    });
    const both = applyCompanionEffect(
      mara.ok ? mara.value : createCompanionRoster(content),
      { type: "recruit", companionId: companionId("rukhar") }
    );
    const maraActive = applyCompanionEffect(
      both.ok ? both.value : createCompanionRoster(content),
      { type: "activate", companionId: companionId("mara") }
    );
    const rukharActive = applyCompanionEffect(
      maraActive.ok ? maraActive.value : createCompanionRoster(content),
      { type: "activate", companionId: companionId("rukhar") }
    );

    expect(rukharActive.ok && rukharActive.value.activeCompanionId).toBe(
      companionId("rukhar")
    );
  });

  it("clamps loyalty and exposes the authoritative qualitative tiers in an active combat snapshot", () => {
    const content = contentFixture();
    const recruited = applyCompanionEffect(createCompanionRoster(content), {
      type: "recruit",
      companionId: companionId("rukhar"),
    });
    const active = applyCompanionEffect(
      recruited.ok ? recruited.value : createCompanionRoster(content),
      { type: "activate", companionId: companionId("rukhar") }
    );
    const loyal = applyCompanionEffect(
      active.ok ? active.value : createCompanionRoster(content),
      { type: "change-loyalty", companionId: companionId("rukhar"), amount: 99 }
    );
    const resolved = applyCompanionEffect(
      loyal.ok ? loyal.value : createCompanionRoster(content),
      {
        type: "set-quest-stage",
        companionId: companionId("rukhar"),
        questStage: 3,
      }
    );

    expect(loyaltyTier(34)).toBe("wary");
    expect(loyaltyTier(35)).toBe("respectful");
    expect(loyaltyTier(70)).toBe("loyal");
    expect(
      buildCompanionCombatSnapshot(
        resolved.ok ? resolved.value : createCompanionRoster(content),
        content
      )
    ).toMatchObject({
      companionId: companionId("rukhar"),
      loyaltyTier: "loyal",
      questStage: 3,
    });
  });
});
