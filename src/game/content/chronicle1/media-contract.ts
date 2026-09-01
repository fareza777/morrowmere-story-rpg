import type {
  ChapterId,
  ChronicleEventType,
  ChronicleVoiceCue,
  EventId,
  IllustrationId,
  VoiceCueId,
} from '../schema';
import { deepFreeze } from './builders';
import { CH01_SCENES } from './chapters/ch01';
import { CH02_SCENES } from './chapters/ch02';
import { CH03_SCENES } from './chapters/ch03';
import { CH04_SCENES } from './chapters/ch04';
import { CH05_SCENES } from './chapters/ch05';
import { CH06_SCENES } from './chapters/ch06';
import { CH07_SCENES } from './chapters/ch07';
import { CH08_SCENES } from './chapters/ch08';
import { CHRONICLE1_ARCHETYPES, CHRONICLE1_BOSSES } from './enemies';
import { CHRONICLE1_NEW_ITEMS } from './items';
import type { ChronicleItemContentGroup, ChronicleItemTier } from './items';

export interface Chronicle1SceneArtContract {
  readonly id: IllustrationId;
  readonly sceneId: EventId;
  readonly title: string;
  readonly chapterId: ChapterId;
  readonly type: ChronicleEventType;
}

export interface Chronicle1ItemIconContract {
  readonly id: string;
  readonly itemId: string;
  readonly name: string;
  readonly group: ChronicleItemContentGroup;
  readonly tier: ChronicleItemTier;
}

export interface Chronicle1EnemyPortraitContract {
  readonly id: string;
  readonly archetypeId: string;
  readonly name: string;
  readonly rankBand: string;
}

export interface Chronicle1BossArtContract {
  readonly id: string;
  readonly enemyId: string;
  readonly name: string;
}

export interface Chronicle1VoiceContract {
  readonly id: VoiceCueId;
  readonly sceneId: EventId;
  readonly speaker: string;
  readonly text: string;
}

/** Character layers are explicit decorative poses, never scene-art fallbacks. */
export interface Chronicle1CharacterArtContract {
  readonly id: IllustrationId;
  readonly companionId?: string;
}

const SCENES = deepFreeze([
  ...CH01_SCENES,
  ...CH02_SCENES,
  ...CH03_SCENES,
  ...CH04_SCENES,
  ...CH05_SCENES,
  ...CH06_SCENES,
  ...CH07_SCENES,
  ...CH08_SCENES,
]);

interface VoiceSelection {
  readonly sceneId: string;
  readonly speaker: 'Eldrin' | 'Mara' | 'Rukhar' | 'Caldus' | 'Lyra' | 'Talla' | 'Voss';
  readonly text: string;
}

/** Two main-story excerpts per chapter, followed by eight companion turning points. */
const VOICE_SELECTIONS: readonly VoiceSelection[] = deepFreeze([
  { sceneId: 'ch01-main-the-first-arrow', speaker: 'Eldrin', text: 'The first arrow strikes the medicine wagon, and the quiet road becomes a battlefield before anyone can name the enemy.' },
  { sceneId: 'ch01-main-a-banner-placed-too-neatly', speaker: 'Eldrin', text: 'The torn orc banner is convincing at a distance. Up close, every knot looks tied for someone to find.' },
  { sceneId: 'ch02-main-raiders-at-the-wall', speaker: 'Eldrin', text: 'Greywatch closes its gates as raiders test the north wall. Inside, frightened families wait for orders that may already be compromised.' },
  { sceneId: 'ch02-main-the-witness-speaks', speaker: 'Eldrin', text: 'The wounded witness names a human paymaster and a false banner. His testimony turns a border raid into a deliberate conspiracy.' },
  { sceneId: 'ch03-main-the-captured-courier', speaker: 'Eldrin', text: 'A captured courier carries two sets of orders: one meant for human patrols, and one written to provoke the Free Host.' },
  { sceneId: 'ch03-main-the-attack-with-two-banners', speaker: 'Eldrin', text: 'The attackers raise opposing banners on the same road. The lie survives only if both armies answer before they look closely.' },
  { sceneId: 'ch04-main-parley-between-lines', speaker: 'Eldrin', text: 'Human and orc commanders meet between their lines while hidden hands prepare the violence that will make negotiation impossible.' },
  { sceneId: 'ch04-main-terms-at-redwater', speaker: 'Eldrin', text: 'Redwater can become a truce, a withdrawal, or the first open battle of a war someone else designed.' },
  { sceneId: 'ch05-main-forge-behind-the-wall', speaker: 'Eldrin', text: 'One hidden forge stamps weapons for both armies. The same steel has been sharpened into two different accusations.' },
  { sceneId: 'ch05-main-the-name-severin-voss', speaker: 'Eldrin', text: 'The seals, payments, and witness accounts agree on one name: Marshal Severin Voss.' },
  { sceneId: 'ch06-main-smoke-over-greywatch', speaker: 'Eldrin', text: 'Smoke rises over Greywatch before the evidence can reach its council. The conspiracy has returned to destroy its own record.' },
  { sceneId: 'ch06-main-what-remains-of-greywatch', speaker: 'Eldrin', text: 'When the siege bell falls silent, survivors count more than walls. They count witnesses, families, and the truth still in their hands.' },
  { sceneId: 'ch07-main-council-before-the-march', speaker: 'Eldrin', text: 'The march on Crownless Keep begins with a council, because a coalition that cannot agree on limits will become another occupying army.' },
  { sceneId: 'ch07-main-inside-the-keep', speaker: 'Eldrin', text: 'Beyond the inner gate, the keep is not a throne room. It is a machine of orders, cells, archives, and controlled fear.' },
  { sceneId: 'ch08-main-voss-offers-order', speaker: 'Voss', text: 'I did not create their hatred. I built the only command strong enough to keep that hatred from consuming the border.' },
  { sceneId: 'ch08-main-the-marshal-and-the-banner', speaker: 'Voss', text: 'Break my command today, and tomorrow every frightened captain will raise a banner of his own.' },

  { sceneId: 'ch02-companion-mara-takes-the-road', speaker: 'Mara', text: 'I will take the road with you, but civilians do not become expendable when the evidence gets difficult.' },
  { sceneId: 'ch04-companion-stonehand-joins-the-road', speaker: 'Rukhar', text: 'I join as an equal voice for the Free Host, not as a trophy taken from a peace table.' },
  { sceneId: 'ch07-companion-rukhar-holds-the-gate-line', speaker: 'Rukhar', text: 'Protect the witnesses first. A victory that loses the truth only prepares the next war.' },
  { sceneId: 'ch05-companion-caldus-answers-the-road', speaker: 'Caldus', text: 'The abbey knows my name. My duty belongs to the people its locked doors failed.' },
  { sceneId: 'ch06-companion-caldus-after-the-siege-bell', speaker: 'Caldus', text: 'The wounded need a healer, and the evidence needs a witness. We cannot pretend either duty is painless.' },
  { sceneId: 'ch05-companion-lyra-chooses-the-slower-truth', speaker: 'Lyra', text: 'Careful proof travels slowly, but it survives the moment when a powerful man calls every witness a liar.' },
  { sceneId: 'ch08-companion-lyra-closes-the-emergency-compact', speaker: 'Lyra', text: 'Count every seal before we close the hall. No one will inherit authority from a vote that never lawfully ended.' },
  { sceneId: 'ch08-companion-talla-takes-the-hidden-road', speaker: 'Talla', text: 'I will share the hidden road, but no council owns it. The people who need escape come first.' },
]);

const SCENE_BY_ID = new Map(SCENES.map((scene) => [scene.id, scene] as const));

export const CHRONICLE1_VOICE_CUES: readonly Chronicle1VoiceContract[] = deepFreeze(
  VOICE_SELECTIONS.map((selection): Chronicle1VoiceContract => {
    if (!SCENE_BY_ID.has(selection.sceneId as EventId)) {
      throw new Error(`Chronicle I voice cue references missing scene ${selection.sceneId}.`);
    }
    return {
      id: `voice-${selection.sceneId}` as VoiceCueId,
      sceneId: selection.sceneId as EventId,
      speaker: selection.speaker,
      text: selection.text,
    };
  }),
);

const VOICE_CUES_BY_SCENE = new Map<EventId, readonly ChronicleVoiceCue[]>();
for (const cue of CHRONICLE1_VOICE_CUES) {
  VOICE_CUES_BY_SCENE.set(cue.sceneId, deepFreeze([{
    id: cue.id,
    speaker: cue.speaker,
    text: cue.text,
  }]));
}

export function voiceCuesForScene(sceneId: EventId): readonly ChronicleVoiceCue[] {
  return VOICE_CUES_BY_SCENE.get(sceneId) ?? [];
}

const RANK_BANDS = ['1-2', '3-5', '6-8', '9-10'] as const;

/** Stable, non-secret media queue. Shipped paths and generation prompts live elsewhere. */
export const CHRONICLE1_MEDIA_CONTRACT = deepFreeze({
  scenes: SCENES.map((scene): Chronicle1SceneArtContract => ({
    id: scene.illustrationId,
    sceneId: scene.id,
    title: scene.title,
    chapterId: scene.chapterId,
    type: scene.type,
  })),
  itemIcons: CHRONICLE1_NEW_ITEMS.map((item): Chronicle1ItemIconContract => ({
    id: item.iconId,
    itemId: item.id,
    name: item.name,
    group: item.contentGroup,
    tier: item.tier,
  })),
  enemyPortraits: CHRONICLE1_ARCHETYPES.flatMap((archetype) =>
    archetype.portraitIds.map((id, index): Chronicle1EnemyPortraitContract => ({
      id,
      archetypeId: archetype.id,
      name: archetype.baseName,
      rankBand: RANK_BANDS[index]!,
    }))),
  bosses: CHRONICLE1_BOSSES.map((boss): Chronicle1BossArtContract => ({
    id: boss.portraitId,
    enemyId: boss.id,
    name: boss.name,
  })),
  characters: [] as readonly Chronicle1CharacterArtContract[],
  voiceCues: CHRONICLE1_VOICE_CUES,
});
