import type { Chronicle1CompanionDefinition } from '../schema';
import { deepFreeze } from './builders';

export const COMPANION_IDS = deepFreeze(['mara', 'rukhar', 'caldus', 'lyra', 'talla'] as const);

export const RECRUITMENT_REQUIREMENTS = deepFreeze({
  mara: ['mara-met', 'greywatch-civilians-protected', 'military-betrayal-exposed', 'mara-scouts-supplied'],
  rukhar: ['rukhar-met', 'orc-courier-spared', 'retaliation-prevented', 'peace-evidence-carried', 'political-cost-accepted'],
  caldus: ['caldus-met', 'refugees-protected', 'hostage-leverage-found', 'caldus-confidence-kept', 'hostages-rescued'],
  lyra: ['lyra-met', 'royal-seals-collected', 'evidence-shared-with-lyra', 'lyra-expertise-respected', 'dangerous-magic-refused'],
  talla: ['talla-met', 'goblin-courier-spared', 'secret-bargain-honored', 'goblin-refuge-hidden', 'profitable-betrayal-refused'],
} as const);

export const PERSONAL_QUEST_IDS = deepFreeze({
  mara: [
    'ch01-companion-mara-at-the-burning-bridge',
    'ch02-companion-mara-the-broken-command',
    'ch02-companion-mara-scouts-before-silver',
  ],
  rukhar: [
    'ch03-companion-courier-testimony',
    'ch03-companion-rukhar-keeps-watch',
    'ch04-companion-the-cost-of-peace',
  ],
  caldus: [
    'ch02-companion-caldus-among-the-refugees',
    'ch05-companion-caldus-keeps-confidence',
    'ch05-companion-caldus-the-first-hostages',
  ],
  lyra: [
    'ch02-companion-lyra-reads-the-seal',
    'ch03-companion-lyra-weighs-the-evidence',
    'ch05-companion-lyra-and-the-embervault-ward',
  ],
  talla: [
    'ch01-companion-talla-and-the-spared-courier',
    'ch02-companion-talla-keeps-the-bargain',
    'ch03-companion-talla-hides-the-refuge',
  ],
} as const);

const LOYALTY_STATES = deepFreeze({
  wary: 'Wary — helps when interests align, but challenges costly or careless orders.',
  respectful: 'Respectful — trusts proven judgment and offers full field support.',
  loyal: 'Loyal — accepts personal risk for the party while retaining an independent conscience.',
} as const);

export const CHRONICLE1_COMPANIONS = deepFreeze([
  {
    id: 'mara',
    name: 'Mara Vey',
    recruitment: { requiredDecisionIds: RECRUITMENT_REQUIREMENTS.mara, blockingDecisionIds: ['mara-betrayed'] },
    personalQuestIds: PERSONAL_QUEST_IDS.mara,
    values: ['Protect civilians', 'Expose corrupt command', 'Plan before committing lives'],
    explorationCapability: { id: 'mara-scout-route', label: 'Scout Route', description: 'Reveals safer approaches and signs of an ambush before the party commits.' },
    passive: { id: 'mara-fieldcraft', label: 'Fieldcraft', description: 'Improves the party\'s defense during the opening exchange of a battle.' },
    combat: { attack: 3, guard: 3, will: 1, actionId: 'mara-covering-shot', commandCooldown: 2 },
    commandCooldown: 2,
    loyaltyStates: LOYALTY_STATES,
    visibleCost: 'Surrender valuable short-term supplies and reward to provision Mara\'s scouts.',
    visibleRecruitmentCost: 'Surrender valuable short-term supplies and reward to provision Mara\'s scouts.',
    outcomeSceneIds: ['ch02-companion-mara-takes-the-road'],
  },
  {
    id: 'rukhar',
    name: 'Rukhar Stonehand',
    recruitment: { requiredDecisionIds: RECRUITMENT_REQUIREMENTS.rukhar, blockingDecisionIds: ['rukhar-betrayed'] },
    personalQuestIds: PERSONAL_QUEST_IDS.rukhar,
    values: ['Keep sworn terms', 'Protect civilians on both sides', 'Make peace carry a real cost'],
    explorationCapability: { id: 'rukhar-read-warband', label: 'Read the Warband', description: 'Identifies military discipline, false colors, and the safest way through an armed line.' },
    passive: { id: 'rukhar-shield-line', label: 'Shield Line', description: 'Reduces damage when enemies focus their attacks on the hero.' },
    combat: { attack: 4, guard: 4, will: 1, actionId: 'rukhar-shield-break', commandCooldown: 2 },
    commandCooldown: 2,
    loyaltyStates: LOYALTY_STATES,
    visibleCost: 'Accept a real human political and reputation cost to make the peace evidence public.',
    visibleRecruitmentCost: 'Accept a real human political and reputation cost to make the peace evidence public.',
    outcomeSceneIds: ['ch04-companion-stonehand-joins-the-road'],
  },
  {
    id: 'caldus',
    name: 'Brother Caldus',
    recruitment: { requiredDecisionIds: RECRUITMENT_REQUIREMENTS.caldus, blockingDecisionIds: ['caldus-betrayed'] },
    personalQuestIds: PERSONAL_QUEST_IDS.caldus,
    values: ['Protect the displaced', 'Keep vulnerable witnesses safe', 'Put lives ahead of institutions'],
    explorationCapability: { id: 'caldus-triage', label: 'Field Triage', description: 'Finds treatment, shelter, and the people most likely to survive with immediate help.' },
    passive: { id: 'caldus-steady-hands', label: 'Steady Hands', description: 'Preserves a small amount of health after a difficult encounter.' },
    combat: { attack: 1, guard: 3, will: 4, actionId: 'caldus-restorative-prayer', commandCooldown: 2 },
    commandCooldown: 2,
    loyaltyStates: LOYALTY_STATES,
    visibleCost: 'Attempt the dangerous hostage rescue instead of taking the safer route to the evidence.',
    visibleRecruitmentCost: 'Attempt the dangerous hostage rescue instead of taking the safer route to the evidence.',
    outcomeSceneIds: ['ch05-companion-caldus-answers-the-road'],
  },
  {
    id: 'lyra',
    name: 'Lyra Arden',
    recruitment: { requiredDecisionIds: RECRUITMENT_REQUIREMENTS.lyra, blockingDecisionIds: ['lyra-betrayed'] },
    personalQuestIds: PERSONAL_QUEST_IDS.lyra,
    values: ['Prove claims with evidence', 'Respect dangerous knowledge', 'Reject reckless shortcuts'],
    explorationCapability: { id: 'lyra-authenticate', label: 'Authenticate', description: 'Distinguishes genuine seals, wards, and relic work from convincing forgeries.' },
    passive: { id: 'lyra-ward-reading', label: 'Ward Reading', description: 'Raises resistance against hostile magic and exposes unstable enchantments.' },
    combat: { attack: 2, guard: 1, will: 5, actionId: 'lyra-unravel-ward', commandCooldown: 2 },
    commandCooldown: 2,
    loyaltyStates: LOYALTY_STATES,
    visibleCost: 'Reject the faster reckless-magic solution and accept the slower, exposed approach.',
    visibleRecruitmentCost: 'Reject the faster reckless-magic solution and accept the slower, exposed approach.',
    outcomeSceneIds: ['ch05-companion-lyra-chooses-the-slower-truth'],
  },
  {
    id: 'talla',
    name: 'Talla Quickhand',
    recruitment: { requiredDecisionIds: RECRUITMENT_REQUIREMENTS.talla, blockingDecisionIds: ['talla-betrayed'] },
    personalQuestIds: PERSONAL_QUEST_IDS.talla,
    values: ['Honor secret bargains', 'Protect people hidden between borders', 'Refuse profit bought with betrayal'],
    explorationCapability: { id: 'talla-hidden-ways', label: 'Hidden Ways', description: 'Finds smuggler paths, overlooked entrances, and discreet routes around a blockade.' },
    passive: { id: 'talla-first-move', label: 'First Move', description: 'Improves the party\'s chance to act before an unprepared enemy.' },
    combat: { attack: 3, guard: 1, will: 3, actionId: 'talla-pocket-sand', commandCooldown: 2 },
    commandCooldown: 2,
    loyaltyStates: LOYALTY_STATES,
    visibleCost: 'Reject a profitable betrayal and protect the hidden refuge even when coin is scarce.',
    visibleRecruitmentCost: 'Reject a profitable betrayal and protect the hidden refuge even when coin is scarce.',
    outcomeSceneIds: ['ch07-companion-talla-refuses-the-stewards-price'],
  },
] as const) as unknown as readonly Chronicle1CompanionDefinition[];
