import type { ChapterId, Chronicle1Event, ChronicleEffect } from '../schema';
import { deepFreeze } from './builders';
import { ROAD_TACTICS_SCENES as CH01_ROAD } from './chapters/ch01/road-tactics';
import { ROAD_TACTICS_SCENES as CH02_ROAD } from './chapters/ch02/road-tactics';
import { ROAD_TACTICS_SCENES as CH05_ROAD } from './chapters/ch05/road-tactics';
import { ROAD_TACTICS_SCENES as CH08_ROAD } from './chapters/ch08/road-tactics';

const ROAD_SCENES = [...CH01_ROAD, ...CH02_ROAD, ...CH05_ROAD, ...CH08_ROAD];

/** Reserve the new scenes' final integer slots without reordering existing stories. */
function insertedSlot(chapterId: ChapterId, originalSlot: number): number {
  return ROAD_SCENES.filter((scene) => scene.chapterId === chapterId)
    .map((scene) => scene.slot)
    .sort((left, right) => left - right)
    .reduce((slot, reserved) => slot >= reserved ? slot + 1 : slot, originalSlot);
}

function insertedDeadline<Promise extends Chronicle1Event['callbackPromises'][number]>(promise: Promise): Promise {
  return { ...promise, deadline: {
    ...promise.deadline,
    slot: insertedSlot(promise.deadline.chapterId, promise.deadline.slot),
  } };
}

function insertedEffects(effects: readonly ChronicleEffect[]): readonly ChronicleEffect[] {
  return effects.map((effect) => effect.type === 'callback'
    ? { ...effect, promise: insertedDeadline(effect.promise) }
    : effect);
}

/** Apply once to pre-road source scenes, including cross-chapter callback deadlines. */
export function withRoadSlots(scene: Chronicle1Event): Chronicle1Event {
  return deepFreeze({
    ...scene,
    slot: insertedSlot(scene.chapterId, scene.slot),
    callbackPromises: scene.callbackPromises.map(insertedDeadline),
    choices: scene.choices.map((choice) => {
      if (!choice.check) return { ...choice, effects: insertedEffects(choice.effects) };
      const branch = (value: typeof choice.check.success) => ({ ...value, effects: insertedEffects(value.effects) });
      return { ...choice, check: {
        ...choice.check,
        success: branch(choice.check.success),
        failure: branch(choice.check.failure),
        ...(choice.check.criticalSuccess ? { criticalSuccess: branch(choice.check.criticalSuccess) } : {}),
        ...(choice.check.criticalFailure ? { criticalFailure: branch(choice.check.criticalFailure) } : {}),
      } };
    }),
  });
}
