import type { ChronicleEventType } from '../schema';
import type { ChapterId, EventId, IllustrationId, VoiceCueId } from '../../domain/ids';
import { deepFreeze } from './builders';
import { CH01_SCENES } from './chapters/ch01';
import { CH02_SCENES } from './chapters/ch02';
import { CH03_SCENES } from './chapters/ch03';
import { CH04_SCENES } from './chapters/ch04';
import { CH05_SCENES } from './chapters/ch05';
import { CH06_SCENES } from './chapters/ch06';
import { CH07_SCENES } from './chapters/ch07';
import { CH08_SCENES } from './chapters/ch08';

export interface Chronicle1SceneArtContract {
  readonly id: IllustrationId;
  readonly sceneId: EventId;
  readonly title: string;
  readonly chapterId: ChapterId;
  readonly type: ChronicleEventType;
}

export interface Chronicle1VoiceContract {
  readonly id: VoiceCueId;
  readonly sceneId: EventId;
  readonly speaker: string;
  readonly text: string;
}

const SCENES = [
  ...CH01_SCENES,
  ...CH02_SCENES,
  ...CH03_SCENES,
  ...CH04_SCENES,
  ...CH05_SCENES,
  ...CH06_SCENES,
  ...CH07_SCENES,
  ...CH08_SCENES,
];

/** Stable, non-secret media queue. Shipped paths and generation prompts live elsewhere. */
export const CHRONICLE1_MEDIA_CONTRACT = deepFreeze({
  scenes: SCENES.map((scene): Chronicle1SceneArtContract => ({
    id: scene.illustrationId,
    sceneId: scene.id,
    title: scene.title,
    chapterId: scene.chapterId,
    type: scene.type,
  })),
  voiceCues: SCENES.flatMap((scene) => (scene.voiceCues ?? []).map((cue): Chronicle1VoiceContract => ({
    id: cue.id,
    sceneId: scene.id,
    speaker: cue.speaker,
    text: cue.text,
  }))),
});
