import type { Page } from '@playwright/test';
import { CHRONICLE1_CONTENT } from '../../../src/game/content/chronicle1';
import type { ChoiceId, EventId } from '../../../src/game/domain/ids';
import type { ItemId } from '../../../src/game/domain/ids';
import { applyInventoryCommand } from '../../../src/game/inventory';
import { chooseTalent, grantExperience } from '../../../src/game/progression';
import { campaignPayload, createCampaign } from '../../../src/game/state/create';
import { reduceGame } from '../../../src/game/state/reducer';
import type { GameStateV2 } from '../../../src/game/state/types';
import { decodeSaveState, encodeSaveState } from '../../../src/game/persistence/codec';
import { saveActiveKey } from '../../../src/game/persistence/repository';
import { createSaveEnvelope, isSaveEnvelope, type SaveSlot } from '../../../src/game/persistence/schema';

const TIMESTAMP = '2026-09-24T00:00:00.000Z';
const MISSING_SHIFT_ID = 'ch05-main-the-missing-shift' as EventId;

export function createChapter5RunAtJunction(seed: number): GameStateV2 {
  const created = createCampaign({ heroClass: 'warden', seed, chapterId: 'ch05', updatedAt: TIMESTAMP }, CHRONICLE1_CONTENT);
  const experience = grantExperience(created.campaign.hero, { amount: 2700, chapterId: 'ch05', source: 'quest' });
  if (!experience.ok || experience.value.hero.level !== 10) throw new Error('Could not prepare the Chapter 5 level-ten checkpoint.');
  const firstTalent = chooseTalent(experience.value.hero, 'warden-aim');
  if (!firstTalent.ok) throw new Error('Could not prepare the first Chapter 5 talent.');
  const secondTalent = chooseTalent(firstTalent.value, 'warden-traps');
  if (!secondTalent.ok) throw new Error('Could not prepare the second Chapter 5 talent.');
  const thirdTalent = chooseTalent(secondTalent.value, 'warden-remedy');
  if (!thirdTalent.ok) throw new Error('Could not prepare the third Chapter 5 talent.');
  let inventory = created.campaign.inventory;
  for (const itemId of ['weapon-cinderpick', 'armor-embervault-apron'] as const) {
    const added = applyInventoryCommand(inventory, { type: 'add', itemId: itemId as ItemId }, CHRONICLE1_CONTENT.items);
    if (!added.ok) throw new Error(`Could not prepare Chapter 5 gear ${itemId}: ${added.error.message}`);
    const entry = added.value.pack.at(-1);
    if (!entry) throw new Error(`Chapter 5 gear ${itemId} did not enter the pack.`);
    const equipped = applyInventoryCommand(added.value, { type: 'equip', entryId: entry.id, heroClass: 'warden' }, CHRONICLE1_CONTENT.items);
    if (!equipped.ok) throw new Error(`Could not equip Chapter 5 gear ${itemId}: ${equipped.error.message}`);
    inventory = equipped.value;
  }
  for (const itemId of [
    'consumable-ember-draught',
    'consumable-burn-paste',
    'consumable-frost-salve',
    'consumable-hearty-ration',
  ] as const) {
    const quantity = 3;
    const supplies = applyInventoryCommand(inventory, { type: 'add', itemId: itemId as ItemId, quantity }, CHRONICLE1_CONTENT.items);
    if (!supplies.ok) throw new Error(`Could not prepare Chapter 5 recovery supplies: ${supplies.error.message}`);
    inventory = supplies.value;
  }
  const campaign = { ...created.campaign, hero: thirdTalent.value, inventory };
  const payload = campaignPayload(campaign);
  const prepared: GameStateV2 = {
    ...created,
    campaign,
    checkpoints: {
      chapter: { campaign: payload, enteredAt: TIMESTAMP },
      camp: { campaign: payload, campSceneId: null, savedAt: TIMESTAMP },
    },
  };
  const started = reduceGame(prepared, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt: TIMESTAMP }, CHRONICLE1_CONTENT);
  if (started.diagnostic || !started.state.expedition) throw new Error('Could not start the Chapter 5 expedition.');

  const atMissingShift: GameStateV2 = {
    ...started.state,
    expedition: {
      ...started.state.expedition,
      position: { chapterId: 'ch05', slot: 7 },
      currentSceneId: MISSING_SHIFT_ID,
      dialogueBeatIndex: 0,
      sceneResolution: null,
      authoredSceneQueue: [],
      sceneVisitCounts: { ...started.state.expedition.sceneVisitCounts, [MISSING_SHIFT_ID]: 1 },
      director: {
        ...started.state.expedition.director,
        usedSceneIds: [...started.state.expedition.director.usedSceneIds, MISSING_SHIFT_ID],
        seenEventIds: [...started.state.expedition.director.seenEventIds, MISSING_SHIFT_ID],
      },
    },
    flow: { ...started.state.flow, screen: 'story' },
  };
  const resolved = reduceGame(atMissingShift, {
    type: 'resolve-choice',
    eventId: MISSING_SHIFT_ID,
    choiceId: 'ch05-choice-follow-the-hidden-shift' as ChoiceId,
    updatedAt: TIMESTAMP,
  }, CHRONICLE1_CONTENT);
  if (resolved.diagnostic) throw new Error(`Could not resolve the authored Missing Shift choice: ${resolved.diagnostic.message}`);
  const activated = reduceGame(resolved.state, { type: 'select-next-scene', updatedAt: TIMESTAMP }, CHRONICLE1_CONTENT);
  if (activated.diagnostic || activated.state.expedition?.pendingRouteJunctionId !== 'ch05-embervault-descent') {
    throw new Error('The Chapter 5 Embervault route junction was not activated.');
  }
  return activated.state;
}

export async function installSavedState(page: Page, state: GameStateV2, slot: SaveSlot): Promise<void> {
  const dto = encodeSaveState(state, CHRONICLE1_CONTENT);
  if (!dto) throw new Error(`The production save encoder rejected the supplied slot ${slot} checkpoint.`);
  const envelope = createSaveEnvelope(slot, dto, TIMESTAMP);
  const raw = JSON.stringify(envelope);
  if (!isSaveEnvelope(JSON.parse(raw))) throw new Error(`The production save envelope rejected the supplied slot ${slot} checkpoint.`);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: saveActiveKey(slot),
    raw,
  });
  const installed = await page.evaluate((key) => localStorage.getItem(key), saveActiveKey(slot));
  if (installed !== raw) throw new Error(`Slot ${slot} checkpoint was not written to browser storage.`);
  await page.reload();
  const reloaded = await page.evaluate((key) => localStorage.getItem(key), saveActiveKey(slot));
  if (reloaded !== raw) throw new Error(`Slot ${slot} checkpoint changed during the browser reload.`);
  const storedState = decodeSaveState((JSON.parse(reloaded) as { readonly state?: unknown }).state, CHRONICLE1_CONTENT);
  if (!storedState) throw new Error(`Slot ${slot} checkpoint no longer decodes after reload.`);
}
