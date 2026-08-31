import { describe, expect, it } from 'vitest';
import { evaluateRecruitment, type CompanionRoster } from '../../src/game/companions';
import { CHRONICLE1_SCENE_INDEX, CHRONICLE1_SCENES } from '../../src/game/content/chronicle1';
import { CHRONICLE1_COMPANIONS } from '../../src/game/content/chronicle1/companions';
import type { ContentIndex } from '../../src/game/content/schema';
import type { CompanionId } from '../../src/game/domain/ids';

const EXPECTED_REQUIREMENTS = {
  mara: ['mara-met', 'greywatch-civilians-protected', 'military-betrayal-exposed', 'mara-scouts-supplied'],
  rukhar: ['rukhar-met', 'orc-courier-spared', 'retaliation-prevented', 'peace-evidence-carried', 'political-cost-accepted'],
  caldus: ['caldus-met', 'refugees-protected', 'hostage-leverage-found', 'caldus-confidence-kept', 'hostages-rescued'],
  lyra: ['lyra-met', 'royal-seals-collected', 'evidence-shared-with-lyra', 'lyra-expertise-respected', 'dangerous-magic-refused'],
  talla: ['talla-met', 'goblin-courier-spared', 'secret-bargain-honored', 'goblin-refuge-hidden', 'profitable-betrayal-refused'],
} as const;

const EXPECTED_QUESTS = {
  mara: ['ch01-companion-mara-at-the-burning-bridge', 'ch02-companion-mara-the-broken-command', 'ch02-companion-mara-scouts-before-silver'],
  rukhar: ['ch03-companion-courier-testimony', 'ch03-companion-rukhar-keeps-watch', 'ch04-companion-the-cost-of-peace'],
  caldus: ['ch02-companion-caldus-among-the-refugees', 'ch05-companion-caldus-keeps-confidence', 'ch05-companion-caldus-the-first-hostages'],
  lyra: ['ch02-companion-lyra-reads-the-seal', 'ch03-companion-lyra-weighs-the-evidence', 'ch05-companion-lyra-and-the-embervault-ward'],
  talla: ['ch01-companion-talla-and-the-spared-courier', 'ch02-companion-talla-keeps-the-bargain', 'ch03-companion-talla-hides-the-refuge'],
} as const;

function contentWithCanonicalCompanions(): ContentIndex {
  return {
    events: new Map(),
    items: new Map(),
    enemies: new Map(),
    encounters: new Map(),
    companions: new Map(CHRONICLE1_COMPANIONS.map((entry) => [entry.id, entry] as const)),
    merchants: new Map(),
    artIds: new Set(),
    audioIds: new Set(),
  };
}

function readyRoster(companionId: CompanionId, questStage: 0 | 1 | 2 | 3 = 3, loyalty = 35): CompanionRoster {
  return {
    activeCompanionId: null,
    records: [{ companionId, status: 'unknown', questStage, loyalty, injured: false }],
  };
}

describe('Chronicle I companion contracts', () => {
  it('freezes five difficult recruitment chains, 15 unique quests, and two-turn command cooldowns', () => {
    expect(CHRONICLE1_COMPANIONS.map(({ id, name }) => [id, name])).toEqual([
      ['mara', 'Mara Vey'],
      ['rukhar', 'Rukhar Stonehand'],
      ['caldus', 'Brother Caldus'],
      ['lyra', 'Lyra Arden'],
      ['talla', 'Talla Quickhand'],
    ]);

    for (const companion of CHRONICLE1_COMPANIONS) {
      const id = companion.id as keyof typeof EXPECTED_REQUIREMENTS;
      expect(companion.recruitment.requiredDecisionIds).toEqual(EXPECTED_REQUIREMENTS[id]);
      expect(companion.recruitment.blockingDecisionIds).toEqual([`${id}-betrayed`]);
      expect(companion.personalQuestIds).toEqual(EXPECTED_QUESTS[id]);
      expect(companion.combat.commandCooldown).toBe(2);
      expect(companion.visibleRecruitmentCost.length).toBeGreaterThan(20);
      expect(companion.outcomeSceneIds.length).toBeGreaterThan(0);
      expect(Object.isFrozen(companion)).toBe(true);
      expect(Object.isFrozen(companion.personalQuestIds)).toBe(true);
    }

    expect(new Set(CHRONICLE1_COMPANIONS.flatMap(({ personalQuestIds }) => personalQuestIds)).size).toBe(15);
  });

  it('requires every authored decision and rejects every betrayal blocker', () => {
    const content = contentWithCanonicalCompanions();

    for (const companion of CHRONICLE1_COMPANIONS) {
      const flags = [...companion.recruitment.requiredDecisionIds];
      expect(evaluateRecruitment(companion.id, { flags, companions: readyRoster(companion.id) }, content).eligible).toBe(true);

      for (const removed of flags) {
        const incomplete = flags.filter((flag) => flag !== removed);
        expect(evaluateRecruitment(companion.id, { flags: incomplete, companions: readyRoster(companion.id) }, content)).toMatchObject({
          eligible: false,
          missingRequirements: expect.arrayContaining([removed]),
        });
      }

      const blocker = companion.recruitment.blockingDecisionIds?.[0];
      expect(blocker).toBeDefined();
      expect(evaluateRecruitment(companion.id, { flags: [...flags, blocker!], companions: readyRoster(companion.id) }, content).eligible).toBe(false);
    }
  });

  it('keeps quest stage and loyalty mandatory after all decision flags are earned', () => {
    const content = contentWithCanonicalCompanions();

    for (const companion of CHRONICLE1_COMPANIONS) {
      const flags = companion.recruitment.requiredDecisionIds;
      expect(evaluateRecruitment(companion.id, { flags, companions: readyRoster(companion.id, 2, 35) }, content).missingRequirements).toContain('personal-quest-stage-3');
      expect(evaluateRecruitment(companion.id, { flags, companions: readyRoster(companion.id, 3, 34) }, content).missingRequirements).toContain('loyalty-35');
    }
  });

  it('resolves every personal quest and outcome scene in chronological order', () => {
    for (const companion of CHRONICLE1_COMPANIONS) {
      const personalQuests = companion.personalQuestIds.map((eventId) => {
        const scene = CHRONICLE1_SCENE_INDEX.get(eventId);
        expect(scene, `${companion.id}/${eventId}`).toBeDefined();
        expect(scene?.relationship).toEqual({ kind: 'companion', companionId: companion.id });
        return scene!;
      });
      const outcomes = companion.outcomeSceneIds.map((eventId) => {
        const scene = CHRONICLE1_SCENE_INDEX.get(eventId);
        expect(scene, `${companion.id}/${eventId}`).toBeDefined();
        expect(scene?.relationship).toEqual({ kind: 'companion', companionId: companion.id });
        return scene!;
      });

      const positions = [...personalQuests, ...outcomes].map((scene) => (
        CHRONICLE1_SCENES.findIndex((candidate) => candidate.id === scene.id)
      ));
      expect(positions, companion.id).toEqual([...positions].sort((left, right) => left - right));
    }
  });

  it('offers each earned recruitment in a later authored scene with a decline path', () => {
    for (const companion of CHRONICLE1_COMPANIONS) {
      const recruitmentScenes = CHRONICLE1_SCENES.filter((scene) => scene.choices.some((choice) => (
        choice.effects.some((effect) => (
          effect.type === 'companion'
          && effect.companionId === companion.id
          && effect.operation === 'recruit'
        ))
      )));

      expect(recruitmentScenes, companion.id).toHaveLength(1);
      const recruitmentScene = recruitmentScenes[0]!;
      expect(companion.personalQuestIds).not.toContain(recruitmentScene.id);
      expect(recruitmentScene.eligibility.requiredFlags).toEqual(
        expect.arrayContaining(companion.recruitment.requiredDecisionIds),
      );
      expect(recruitmentScene.eligibility.excludedFlags).toEqual(
        expect.arrayContaining(companion.recruitment.blockingDecisionIds ?? []),
      );
      expect(recruitmentScene.choices.some((choice) => choice.effects.every((effect) => (
        effect.type !== 'companion' || effect.operation !== 'recruit'
      ))), companion.id).toBe(true);

      const recruitmentPosition = CHRONICLE1_SCENES.findIndex((scene) => scene.id === recruitmentScene.id);
      for (const questId of companion.personalQuestIds) {
        const questPosition = CHRONICLE1_SCENES.findIndex((scene) => scene.id === questId);
        expect(recruitmentPosition, `${companion.id}/${questId}`).toBeGreaterThan(questPosition);
      }
    }
  });

});
