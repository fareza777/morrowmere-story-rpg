import { loyaltyTier } from '../../companions';
import type { CampaignState } from '../../state/types';

export type Chronicle1EndingId =
  | 'the-banner-broken'
  | 'the-iron-peace'
  | 'council-of-the-road'
  | 'the-war-without-end';

export type Chronicle1EpilogueCategory =
  | 'greywatch'
  | 'companion'
  | 'faction'
  | 'custodian'
  | 'truth'
  | 'medicine'
  | 'patron';

export interface Chronicle1EndingDefinition {
  readonly id: Chronicle1EndingId;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export interface Chronicle1EpilogueFragment {
  readonly id: string;
  readonly category: Chronicle1EpilogueCategory;
  readonly title: string;
  readonly paragraph: string;
}

export interface ChronicleResolution {
  readonly endingId: Chronicle1EndingId;
  readonly epilogueFragmentIds: readonly string[];
  readonly title: string;
  readonly paragraphs: readonly string[];
}

function ending(
  id: Chronicle1EndingId,
  title: string,
  paragraphs: readonly string[],
): Chronicle1EndingDefinition {
  return Object.freeze({ id, title, paragraphs: Object.freeze([...paragraphs]) });
}

function fragment(
  id: string,
  category: Chronicle1EpilogueCategory,
  title: string,
  paragraph: string,
): Chronicle1EpilogueFragment {
  return Object.freeze({ id, category, title, paragraph });
}

export const CHRONICLE1_ENDINGS: readonly Chronicle1EndingDefinition[] = Object.freeze([
  ending('the-banner-broken', 'The Banner Broken', [
    'The public record survives the fight at Crownless Keep. Voss can no longer hide the payments, false orders, and weapons that kept both sides afraid. His command network is dismantled before another manufactured attack can begin.',
    'No single authority is ready to replace it. Greywatch, the border towns, and the Free Host return to separate councils with new reasons to cooperate and old reasons to hesitate. The immediate war ends, but every agreement still depends on people choosing to keep it.',
    'You leave the keep without a crown or a permanent command. The Black Banner is broken, and the road ahead belongs to those willing to defend the truth in public.',
  ]),
  ending('the-iron-peace', 'The Iron Peace', [
    'The command platform falls under a direct assault. Voss loses the machinery, officers, and sealed orders that allowed him to direct the border from one guarded hall. The armies stand down because the force behind the false coronation has been defeated.',
    'Peace arrives under armed patrols, fixed curfews, and emergency checkpoints. Families can travel again, but the settlement teaches every governor how quickly fear can make exceptional power seem reasonable.',
    'You stopped the war Voss prepared. You also leave the border with a harder question: whether order imposed for the right reason can remain limited once soldiers learn that it works.',
  ]),
  ending('council-of-the-road', 'Council of the Road', [
    'The evidence against Voss is read beside the Redwater terms and the coalition charter. Human towns, Free Host delegates, Greywatch survivors, and civilian wardens accept one set of limits on command, reprisals, supplies, and custody.',
    'They establish a Council of the Road with rotating seats and public records. No faction receives a crown. Each keeps the right to leave, but none can close a shared road or move an army without answering the others.',
    'The arrangement is slow, difficult, and openly disputed. That is its strength. Morrowmere gains peace through rules people chose together, not through an enemy someone ordered them to fear.',
  ]),
  ending('the-war-without-end', 'The War Without End', [
    'The Coronation Engine is stopped, but the case against Voss does not hold the border together. Loyal officers escape with copied orders, frightened commanders return to their armies, and every side claims that the other planned the violence first.',
    'Redwater closes its crossings. Refugees fill the roads around Greywatch while raiding companies adopt the Black Banner without waiting for Voss to command them. The conspiracy becomes a war that can sustain itself.',
    'You save who you can and carry the surviving evidence from camp to camp. There is no clean victory, only a record of how the war began and people still willing to end it.',
  ]),
]);

export const CHRONICLE1_EPILOGUE_FRAGMENTS: readonly Chronicle1EpilogueFragment[] = Object.freeze([
  fragment(
    'greywatch-held-the-bells-return',
    'greywatch',
    'The Bells Return',
    'Greywatch keeps its walls and council. The siege bell returns to ordinary work: opening the market, warning of winter roads, and marking the funerals of defenders whose names are entered beside the people they saved.',
  ),
  fragment(
    'greywatch-damaged-stone-by-stone',
    'greywatch',
    'Stone by Stone',
    'Greywatch survives with burned wards and a broken western wall. Soldiers and families rebuild the same streets together, while every repaired storehouse carries a public list of what was lost and who supplied the work.',
  ),
  fragment(
    'greywatch-fallen-survivors-on-the-road',
    'greywatch',
    'Survivors on the Road',
    'Greywatch falls, but its organized survivor column remains a town in motion. Ward rolls, infirmary records, and gate keys travel in three guarded carts until the families choose ground for a new settlement.',
  ),
  fragment(
    'greywatch-scattered-no-wall-to-return-to',
    'greywatch',
    'No Wall to Return To',
    'Greywatch has no functioning wall or council left to receive its people. Scattered households settle along safer roads, carrying street names and family registers so the town is not erased with its stone.',
  ),

  fragment(
    'mara-loyal-a-watch-of-her-own',
    'companion',
    'A Watch of Her Own',
    'Mara Vey forms a mixed road watch from Greywatch scouts and civilian runners. She remains beside you long enough to train every patrol to count the people behind a tactical decision, not only the ground it gains.',
  ),
  fragment(
    'mara-estranged-the-empty-watch',
    'companion',
    'The Empty Watch',
    'Mara\'s place at the evening watch remains empty. Her route marks still guide patrols away from exposed farms, but the company never regains the trust needed to keep her on the road beside you.',
  ),
  fragment(
    'rukhar-loyal-the-shared-patrol',
    'companion',
    'The Shared Patrol',
    'Rukhar Stonehand leads the first patrol whose orders carry both human and Free Host seals. He treats every crossing as a promise that must be renewed in person, especially when old soldiers expect the truce to fail.',
  ),
  fragment(
    'rukhar-estranged-an-oath-unfinished',
    'companion',
    'An Oath Unfinished',
    'Rukhar does not take a place in the new patrols. The Free Host keeps its own side of Redwater, and each exchanged prisoner proves that useful terms can survive even when personal trust did not.',
  ),
  fragment(
    'caldus-loyal-the-open-infirmary',
    'companion',
    'The Open Infirmary',
    'Brother Caldus establishes an infirmary that records wounds without recording banners. He stays with the company on dangerous roads, then returns to teach local healers how to protect patients when commanders demand names.',
  ),
  fragment(
    'caldus-lost-the-unfilled-cot',
    'companion',
    'The Unfilled Cot',
    'One cot remains unclaimed wherever the field ward is raised. Caldus is not there to fill it, but the treatment lists he defended still require healers to receive refugees, prisoners, and soldiers in the order of need.',
  ),
  fragment(
    'lyra-loyal-the-public-archive',
    'companion',
    'The Public Archive',
    'Lyra Arden turns the conspiracy files into a public archive with plain summaries beside every technical record. She continues the road with you whenever a disputed seal or dangerous shortcut threatens to make truth private again.',
  ),
  fragment(
    'lyra-estranged-the-closed-ledger',
    'companion',
    'The Closed Ledger',
    'Lyra does not remain to organize the final archive. The evidence survives in numbered cases, but arguments over seals and custody take longer without the expert who once made those details understandable.',
  ),
  fragment(
    'talla-loyal-keys-to-the-hidden-roads',
    'companion',
    'Keys to the Hidden Roads',
    'Talla Quickhand keeps the keys to passages no council is allowed to own outright. She shares a route when families need it, closes it when soldiers become curious, and joins you whenever the official road becomes the dangerous one.',
  ),
  fragment(
    'talla-estranged-a-road-kept-secret',
    'companion',
    'A Road Kept Secret',
    'The goblin refuge keeps its hidden roads beyond the reach of the new authorities. Talla\'s signs vanish from the company map, leaving only the knowledge that some people survived because their path was never made public.',
  ),

  fragment(
    'faction-border-council-charter',
    'faction',
    'The Civil Charter',
    'The Border Council earns the strongest public mandate. Its reeves standardize tolls, witness prisoner exchanges, and require military supply orders to be copied into civilian books before any convoy can move.',
  ),
  fragment(
    'faction-greywatch-road-command',
    'faction',
    'Greywatch Road Command',
    'Greywatch holds the greatest influence after the crisis. Its veterans reopen the main roads under civilian audit, carrying strict orders that a secure checkpoint must never become another private border.',
  ),
  fragment(
    'faction-free-host-equal-crossings',
    'faction',
    'Equal Crossings',
    'The Free Host leaves Crownless Keep with recognized standing on the border. Its patrols enforce the same crossing rules on orc and human companies, turning restraint during the crisis into lasting authority.',
  ),

  fragment(
    'custodian-border-council',
    'custodian',
    'A Keep Without a Commander',
    'The Border Council holds Crownless Keep through a rotating civilian charter. Seal cases, cells, and armories receive separate custodians, preventing any one office from rebuilding Voss\'s hidden command.',
  ),
  fragment(
    'custodian-greywatch',
    'custodian',
    'Greywatch Holds the Keys',
    'Greywatch accepts custody of the keep under a published inventory and fixed review date. Its council treats the fortress as a road archive and prison, not as the beginning of a new territorial claim.',
  ),
  fragment(
    'custodian-free-host',
    'custodian',
    'The Free Host at Crownless Keep',
    'The Free Host takes custody with human clerks remaining at every record table. The arrangement is watched closely, but equal access to the archive makes the old accusations harder to restore.',
  ),
  fragment(
    'custodian-neutral-wardens',
    'custodian',
    'The Warden Charter',
    'Neutral road wardens receive the keep for one year and no longer. They seal the armory, reopen the guest rooms, and schedule the next custody hearing before accepting the keys.',
  ),

  fragment(
    'truth-the-complete-public-record',
    'truth',
    'The Complete Record',
    'Copies of the ledgers, testimony, siege orders, and seal audit reach every major border archive. Voss can still be defended as a man who feared disorder, but no serious account can deny what he did to create it.',
  ),
  fragment(
    'medicine-the-wagons-finish-the-road',
    'medicine',
    'The Wagons Finish the Road',
    'The medicine that began the journey finally reaches civilian wards beyond Greywatch and Crownless Keep. Its empty cases return south marked with the names of patients treated, completing the honest work the first ambush tried to stop.',
  ),
  fragment(
    'patron-the-first-fracture-letter',
    'patron',
    'The First Fracture',
    'After the settlements are recorded, the new custodian opens Voss\'s cipher letter under witnesses. One phrase can be read with confidence: the border war was “the first fracture.” The sender is not named, and the letter is sealed as evidence for another day.',
  ),
]);

const ENDING_BY_ID = new Map(CHRONICLE1_ENDINGS.map((candidate) => [candidate.id, candidate] as const));
const FRAGMENT_BY_ID = new Map(CHRONICLE1_EPILOGUE_FRAGMENTS.map((candidate) => [candidate.id, candidate] as const));

function hasFlag(campaign: CampaignState, flag: string): boolean {
  return campaign.flags.includes(flag);
}

function evidenceStrength(campaign: CampaignState): number {
  return new Set(campaign.evidence).size;
}

function mainEndingId(campaign: CampaignState): Chronicle1EndingId {
  const evidence = evidenceStrength(campaign);
  const stableVictory = hasFlag(campaign, 'voss-exposed')
    && hasFlag(campaign, 'war-mechanism-dismantled')
    && hasFlag(campaign, 'border-war-stopped')
    && !hasFlag(campaign, 'open-war')
    && !hasFlag(campaign, 'failed-accountability');

  if (
    stableVictory
    && evidence >= 5
    && hasFlag(campaign, 'border-peace')
    && hasFlag(campaign, 'coalition-formed')
  ) return 'council-of-the-road';
  if (stableVictory && evidence >= 3 && hasFlag(campaign, 'forceful-settlement')) return 'the-iron-peace';
  if (stableVictory && evidence >= 3) return 'the-banner-broken';
  return 'the-war-without-end';
}

function greywatchFragmentId(campaign: CampaignState): string {
  if (hasFlag(campaign, 'greywatch-held')) return 'greywatch-held-the-bells-return';
  if (hasFlag(campaign, 'greywatch-damaged')) return 'greywatch-damaged-stone-by-stone';
  if (hasFlag(campaign, 'greywatch-fallen') && hasFlag(campaign, 'greywatch-survivors-organized')) {
    return 'greywatch-fallen-survivors-on-the-road';
  }
  return 'greywatch-scattered-no-wall-to-return-to';
}

const COMPANION_FRAGMENT_IDS = Object.freeze({
  mara: {
    loyal: 'mara-loyal-a-watch-of-her-own',
    estranged: 'mara-estranged-the-empty-watch',
  },
  rukhar: {
    loyal: 'rukhar-loyal-the-shared-patrol',
    estranged: 'rukhar-estranged-an-oath-unfinished',
  },
  caldus: {
    loyal: 'caldus-loyal-the-open-infirmary',
    estranged: 'caldus-lost-the-unfilled-cot',
  },
  lyra: {
    loyal: 'lyra-loyal-the-public-archive',
    estranged: 'lyra-estranged-the-closed-ledger',
  },
  talla: {
    loyal: 'talla-loyal-keys-to-the-hidden-roads',
    estranged: 'talla-estranged-a-road-kept-secret',
  },
} as const);

function companionFragmentIds(campaign: CampaignState): readonly string[] {
  return (Object.keys(COMPANION_FRAGMENT_IDS) as readonly (keyof typeof COMPANION_FRAGMENT_IDS)[])
    .map((companionId) => {
      const progress = campaign.companions.records.find((record) => record.companionId === companionId);
      const loyal = progress?.status === 'recruited' && loyaltyTier(progress.loyalty) === 'loyal';
      return COMPANION_FRAGMENT_IDS[companionId][loyal ? 'loyal' : 'estranged'];
    });
}

function factionFragmentId(campaign: CampaignState): string {
  const borderCouncil = campaign.factions['border-council'] ?? 0;
  const greywatch = campaign.factions.greywatch ?? 0;
  const freeHost = campaign.factions['free-host'] ?? 0;
  if (borderCouncil >= greywatch && borderCouncil >= freeHost) return 'faction-border-council-charter';
  if (greywatch >= freeHost) return 'faction-greywatch-road-command';
  return 'faction-free-host-equal-crossings';
}

function custodianFragmentId(campaign: CampaignState): string {
  if (hasFlag(campaign, 'keep-border-council')) return 'custodian-border-council';
  if (hasFlag(campaign, 'keep-greywatch')) return 'custodian-greywatch';
  if (hasFlag(campaign, 'keep-free-host')) return 'custodian-free-host';
  return 'custodian-neutral-wardens';
}

function selectedFragmentIds(campaign: CampaignState): readonly string[] {
  const selected = [
    greywatchFragmentId(campaign),
    ...companionFragmentIds(campaign),
    factionFragmentId(campaign),
    custodianFragmentId(campaign),
  ];
  if (evidenceStrength(campaign) >= 5 && hasFlag(campaign, 'voss-exposed')) {
    selected.push('truth-the-complete-public-record');
  }
  if (hasFlag(campaign, 'civilian-medicine-delivered')) {
    selected.push('medicine-the-wagons-finish-the-road');
  }
  selected.push('patron-the-first-fracture-letter');
  return Object.freeze(selected);
}

export function resolveChronicle1Ending(campaign: CampaignState): ChronicleResolution {
  const endingId = mainEndingId(campaign);
  const selectedEnding = ENDING_BY_ID.get(endingId)!;
  const epilogueFragmentIds = selectedFragmentIds(campaign);
  const epilogueParagraphs = epilogueFragmentIds.map((id) => FRAGMENT_BY_ID.get(id)!.paragraph);
  return Object.freeze({
    endingId,
    epilogueFragmentIds,
    title: selectedEnding.title,
    paragraphs: Object.freeze([...selectedEnding.paragraphs, ...epilogueParagraphs]),
  });
}
