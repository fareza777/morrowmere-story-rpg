import { expect, test, type Locator, type Page } from '@playwright/test';
import { enemyAttackProfile, heroAttackProfile, previewAttack } from '../../src/game/combat/preview';
import { CHRONICLE1_CONTENT } from '../../src/game/content/chronicle1';
import { decodeSaveState } from '../../src/game/persistence/codec';
import { saveActiveKey } from '../../src/game/persistence/repository';
import type { GameStateV2 } from '../../src/game/state/types';
import { MorrowmerePage } from './pages/MorrowmerePage';
import { createChapter5RunAtJunction, installSavedState } from './support/chronicle-dungeon-saves';
const CHECKPOINT_TIME = '2026-09-24T00:00:00.000Z';

async function isVisible(locator: Locator): Promise<boolean> {
  return locator.isVisible().catch(() => false);
}

async function expectLoadedArtwork(image: Locator, source: RegExp | string): Promise<void> {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute('src', source);
}

async function currentSavedState(page: Page, slot: 1 | 2 | 3 = 1): Promise<GameStateV2> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), saveActiveKey(slot));
  if (!raw) throw new Error(`Slot ${slot} has no active save.`);
  const envelope = JSON.parse(raw) as { readonly state?: unknown };
  const state = decodeSaveState(envelope.state, CHRONICLE1_CONTENT);
  if (!state) throw new Error(`Slot ${slot} no longer decodes through the production save codec.`);
  return state;
}

async function configureDeterministicFreshRun(page: Page): Promise<void> {
  await page.addInitScript((timestamp) => {
    Date.now = () => timestamp;
    localStorage.setItem('morrowmere.tutorials.v1', JSON.stringify({ skipped: true, seen: [] }));
  }, Date.parse(CHECKPOINT_TIME));
}

async function startFreshMageOnKingsRoad(page: Page): Promise<void> {
  const game = new MorrowmerePage(page);
  await configureDeterministicFreshRun(page);
  await game.gotoFresh();
  await game.beginMageChronicle();
  await page.getByRole('button', { name: 'Choose a Route', exact: true }).click();
  await page.getByRole('button', { name: /King's Road/i }).click();
}

async function clearBattleThroughVisibleActions(page: Page, maxTurns = 42, stopWhen?: (page: Page) => Promise<boolean>): Promise<void> {
  const combat = page.locator('.combat-panel');
  await expect(combat).toBeVisible();
  let lastAction = 'none';

  for (let turn = 0; turn < maxTurns; turn += 1) {
    if (stopWhen && await stopWhen(page)) return;
    if (await isVisible(page.locator('.reward-panel'))) return;
    if (!(await isVisible(combat))) {
      if (await isVisible(page.locator('.defeat-panel'))) {
        const defeated = await currentSavedState(page).catch(() => null);
        const encounterId = defeated?.expedition?.currentCombat?.encounterId ?? 'unknown encounter';
        const remainingHealth = defeated?.expedition?.currentCombat?.combat?.player.health ?? 0;
        throw new Error(`The test build lost ${encounterId} at ${remainingHealth} HP after ${lastAction}.`);
      }
      await expect(page.locator('.reward-panel')).toBeVisible();
      return;
    }

    const enemies = page.locator('.enemy-card');
    const stateBeforeAction = await currentSavedState(page);
    const liveBeforeAction = stateBeforeAction.expedition?.currentCombat?.combat;
    const encounterId = stateBeforeAction.expedition?.currentCombat?.encounterId ?? '';
    const regulatorFight = encounterId === 'enc-ch05-cinder-heart-regulator';
    const chapterOneFight = encounterId.startsWith('enc-ch01-');
    const cards = await enemies.all();
    const candidates: { readonly card: Locator; readonly rank: number; readonly hp: number }[] = [];
    for (const card of cards) {
      const bar = card.getByRole('progressbar');
      const hp = Number(await bar.getAttribute('aria-valuenow'));
      if (hp <= 0) continue;
      const role = (await card.locator('.enemy-card-top header span').innerText()).toLowerCase();
      const ordinaryRank = /boss/u.test(role) ? 7 : /controller|shaman|summoner/u.test(role) ? 6 : /assassin|archer/u.test(role) ? 5 : /commander/u.test(role) ? 3 : /specialist/u.test(role) ? 2 : /defender/u.test(role) ? 1 : 0;
      const rank = regulatorFight && /boss/u.test(role) ? 3 : ordinaryRank;
      candidates.push({ card, rank, hp });
    }
    if (candidates.length === 0) throw new Error('Combat remained active without a living enemy target.');
    candidates.sort((left, right) => right.rank - left.rank);
    let targetCard = candidates[0]!.card;
    const targetName = (await targetCard.locator('.enemy-card-top h2').innerText()).trim();

    const intents = await page.locator('.enemy-intent strong').allTextContents();
    const healthCopy = await page.locator('.top-hud .hud-vitals span').first().getAttribute('aria-label');
    const health = healthCopy?.match(/(\d+)\s+of\s+(\d+)\s+Health/u) ?? null;
    const dangerousIntents = intents.filter((intent) => /^(attack|heavy attack|casting hex)$/iu.test(intent)).length;
    const guard = page.getByRole('button', { name: 'Guard', exact: true });
    const technique = page.getByRole('button', { name: /^Technique/u });
    const companion = page.getByRole('button', { name: /.+: .+/u });
    const attack = page.getByRole('button', { name: 'Attack', exact: true });
    const consumable = page.getByRole('button', { name: 'Consumable', exact: true });
    const healthRatio = health ? Number(health[1]) / Number(health[2]) : 1;
    const recoveryItem = page.locator('.combat-consumables button').filter({ hasText: /(?:Ember Draught|Field Bandage|Tonic|Poultice|Paste|Frost Salve|March Ration)/iu }).first();
    const safeWindow = intents.every((intent) => /^(guarding ally|recovering|fleeing)$/iu.test(intent));
    const shouldRecover = healthRatio < 0.3 && dangerousIntents > 0 && await consumable.isEnabled();
    const selectedEnemy = liveBeforeAction?.enemies.find((enemy) => enemy.health > 0 && enemy.name === targetName);
    const attackForecast = liveBeforeAction && selectedEnemy
      ? previewAttack({ attacker: liveBeforeAction.player, target: selectedEnemy, ...heroAttackProfile(liveBeforeAction.player, { type: 'attack' }), missedAttacks: liveBeforeAction.missedAttacks })
      : null;
    const finishWithAttack = Boolean(selectedEnemy && attackForecast && (!chapterOneFight || attackForecast.chanceToDamage === 100) && selectedEnemy.health <= attackForecast.damageRange.min);
    const techniqueId = liveBeforeAction?.player.class === 'warrior' ? 'cleave' : liveBeforeAction?.player.class === 'mage' ? 'witchfire' : 'marked-shot';
    const techniqueForecast = liveBeforeAction && selectedEnemy
      ? previewAttack({ attacker: liveBeforeAction.player, target: selectedEnemy, ...heroAttackProfile(liveBeforeAction.player, { type: 'technique', techniqueId }), missedAttacks: liveBeforeAction.missedAttacks })
      : null;
    const minimumTechniqueDamage = techniqueForecast?.damageRange.min ?? 0;
    const expectedAttackDamage = attackForecast ? (attackForecast.damageRange.min + attackForecast.damageRange.max) / 2 * attackForecast.chanceToDamage / 100 : 0;
    const expectedTechniqueDamage = techniqueForecast ? (techniqueForecast.damageRange.min + techniqueForecast.damageRange.max) / 2 * techniqueForecast.chanceToDamage / 100 : 0;
    const expectedIncomingDamage = (guarding: boolean) => liveBeforeAction?.enemyIntents.reduce((total, enemyIntent) => {
      const enemy = liveBeforeAction.enemies.find((candidate) => candidate.id === enemyIntent.enemyId && candidate.health > 0);
      if (!enemy) return total;
      const profile = enemyAttackProfile(enemy, enemyIntent.intent);
      if (!profile) return total;
      const forecast = previewAttack({ attacker: enemy, target: { ...liveBeforeAction.player, guarding }, ...profile });
      return total + (forecast.damageRange.min + forecast.damageRange.max) / 2 * forecast.chanceToDamage / 100;
    }, 0) ?? 0;
    const unguardedIncoming = expectedIncomingDamage(false);
    const guardedIncoming = expectedIncomingDamage(true);
    const finishLowHealthTarget = candidates[0]!.hp <= Math.max(7, Math.floor(expectedAttackDamage * 0.7));
    const techniqueCanEnd = Boolean(selectedEnemy && selectedEnemy.health <= minimumTechniqueDamage);
    const canHealBeforeRiskyFinisher = healthRatio < 0.3 && dangerousIntents > 0 && await consumable.isEnabled();
    const safeFinisher = healthRatio > 0.45 || dangerousIntents === 0 || (techniqueCanEnd && !canHealBeforeRiskyFinisher);
    const finishWithTechnique = Boolean(safeFinisher && !finishWithAttack && selectedEnemy && (!chapterOneFight || techniqueForecast?.chanceToDamage === 100) && selectedEnemy.health <= minimumTechniqueDamage && await technique.isEnabled());
    const heavyIncoming = intents.some((intent) => /^heavy attack$/iu.test(intent));
    const currentHealth = Number(health?.[1] ?? 0);
    const guardForSurvival = await guard.isEnabled()
      && !finishLowHealthTarget
      && (chapterOneFight || heavyIncoming)
      && (regulatorFight
        ? unguardedIncoming >= currentHealth * 0.8 && guardedIncoming < unguardedIncoming * 0.75
        : chapterOneFight
          ? unguardedIncoming >= currentHealth * 0.8 && guardedIncoming < currentHealth
          : unguardedIncoming >= currentHealth && guardedIncoming < currentHealth);
    const targetButton = targetCard.locator('button');
    if ((await targetButton.getAttribute('aria-pressed')) !== 'true') await targetButton.click();
    let action = 'Attack';
    if (chapterOneFight && shouldRecover) {
      await consumable.click();
      if (await recoveryItem.count() > 0 && await recoveryItem.isVisible()) {
        action = 'Consumable';
        await recoveryItem.click();
        await expect(page.locator('.combat-consumables')).toHaveCount(0);
      } else if (await technique.isEnabled()) {
        action = 'Technique';
        await technique.click();
      } else {
        await attack.click();
      }
    } else if (chapterOneFight && guardForSurvival) {
      action = 'Guard';
      await guard.click();
    } else if (finishWithAttack) {
      action = 'Attack finisher';
      await attack.click();
    } else if (finishWithTechnique) {
      action = 'Technique finisher';
      await technique.click();
    } else if (finishLowHealthTarget && await attack.isEnabled()) {
      action = 'Attack';
      await attack.click();
    } else if (shouldRecover) {
      await consumable.click();
      if (await recoveryItem.count() > 0 && await recoveryItem.isVisible()) {
        action = 'Consumable';
        await recoveryItem.click();
        await expect(page.locator('.combat-consumables')).toHaveCount(0);
      } else if (await technique.isEnabled()) {
        action = 'Technique';
        await technique.click();
      } else {
        await attack.click();
      }
    } else if (guardForSurvival) {
      action = 'Guard';
      await guard.click();
    } else if (safeWindow && liveBeforeAction && liveBeforeAction.player.focus < 3 && await guard.isEnabled()) {
      action = 'Guard to recover Focus';
      await guard.click();
    } else if (await technique.isEnabled() && expectedTechniqueDamage > expectedAttackDamage) {
      action = 'Technique';
      await technique.click();
    } else if (await companion.count() > 0 && await companion.isEnabled()) {
      action = 'Companion';
      await companion.click();
    } else {
      await attack.click();
    }
    lastAction = action;
  }

  throw new Error(`The encounter did not resolve within ${maxTurns} visible combat actions.`);
}

async function claimVisibleReward(page: Page): Promise<void> {
  const reward = page.locator('.reward-panel');
  await expect(reward).toBeVisible();
  const withoutItem = reward.getByRole('button', { name: 'Continue without an item', exact: true });
  if (await isVisible(withoutItem)) {
    await withoutItem.click();
    return;
  }
  const continueButton = reward.getByRole('button', { name: 'Continue', exact: true });
  if (await isVisible(continueButton)) {
    await continueButton.click();
    return;
  }
  const item = reward.getByRole('button', { name: /^Choose /u }).first();
  if (await item.count() === 0) throw new Error('The visible reward offers no claim action.');
  await item.click();
}

async function useHealingItemInTheField(page: Page, threshold = 0.55): Promise<boolean> {
  const healthCopy = await page.locator('.top-hud .hud-vitals span').first().getAttribute('aria-label').catch(() => null);
  const health = healthCopy?.match(/(\d+)\s+of\s+(\d+)\s+Health/u);
  if (!health || Number(health[1]) / Number(health[2]) > threshold) return false;

  await page.getByRole('button', { name: 'Pack', exact: true }).click();
  const inventory = page.getByRole('dialog', { name: 'Inventory' });
  await expect(inventory).toBeVisible();
  const healingItem = inventory.getByRole('button', { name: /^Use (?:Field Bandage|Greywatch Tonic|Antivenom|Free Host Field Broth|Ember Draught|Frost Salve|Burn Paste|Hearty March Ration|Healing Poultice|Last Light Phial)/iu }).first();
  const available = await healingItem.count() > 0 && await healingItem.isEnabled();
  if (available) await healingItem.click();
  await inventory.getByRole('button', { name: 'Close Inventory', exact: true }).click();
  return available;
}

async function advanceUntil(page: Page, target: Locator, limit = 100): Promise<void> {
  for (let step = 0; step < limit; step += 1) {
    if (await isVisible(target)) return;

    const tutorialSkip = page.locator('.tutorial-callout').getByRole('button', { name: 'Skip tutorials', exact: true });
    if (await isVisible(tutorialSkip)) {
      await tutorialSkip.click();
      continue;
    }

    if (await isVisible(page.locator('.combat-panel'))) {
      await clearBattleThroughVisibleActions(page);
      continue;
    }
    if (await isVisible(page.locator('.reward-panel'))) {
      await claimVisibleReward(page);
      continue;
    }

    if (await useHealingItemInTheField(page)) continue;

    const travel = page.locator('.travel-panel');
    if (await isVisible(travel)) {
      const roadScout = travel.getByRole('button', { name: 'Scout', exact: true });
      if (await isVisible(roadScout)) {
        await roadScout.click();
        continue;
      }
      const options = travel.locator('.travel-options button');
      if (await options.count() > 0) {
        const ledgerRoute = travel.getByRole('button', { name: 'Protect the ledger gallery', exact: true });
        if (await isVisible(ledgerRoute)) await ledgerRoute.click();
        else await options.first().click();
        continue;
      }
      const emergencyRetreat = travel.getByRole('button', { name: 'Emergency Retreat', exact: true });
      if (await isVisible(emergencyRetreat)) throw new Error('The route was sealed and only emergency retreat remained.');
    }

    const dialogue = page.locator('.dialogue-panel');
    if (await isVisible(dialogue)) {
      const reveal = dialogue.getByRole('button', { name: 'Tap to reveal responses', exact: true });
      if (await isVisible(reveal)) {
        await reveal.click();
        continue;
      }
      const dialogueContinue = dialogue.getByRole('button', { name: 'Continue', exact: true });
      if (await isVisible(dialogueContinue)) {
        await dialogueContinue.click();
        continue;
      }
      const ringWatcher = dialogue.getByRole('button', { name: "Ring the watcher's answer", exact: true });
      if (await isVisible(ringWatcher)) {
        await ringWatcher.click();
        continue;
      }
      const dialogueChoice = dialogue.locator('.choice-list button:not(:disabled)').first();
      if (await dialogueChoice.count() > 0) {
        const protectConvoy = dialogue.getByRole('button', { name: 'Protect the convoy', exact: true });
        const tendHorses = dialogue.getByRole('button', { name: 'Tend the horses first', exact: true });
        const standDown = dialogue.getByRole('button', { name: 'Order the watcher to stand down', exact: true });
        if (await isVisible(protectConvoy)) await protectConvoy.click();
        else if (await isVisible(tendHorses)) await tendHorses.click();
        else if (await isVisible(standDown)) await standDown.click();
        else await dialogueChoice.click();
        continue;
      }
      const dialogueResponse = dialogue.locator('.dialogue-responses button:not(:disabled)').first();
      if (await dialogueResponse.count() > 0) {
        await dialogueResponse.click();
        continue;
      }
    }

    const story = page.locator('.story-panel');
    if (await isVisible(story)) {
      const choices = story.locator('.choice-list button');
      if (await choices.count() > 0) {
        const heading = (await story.locator('h1').textContent())?.trim();
        const inspectWagons = story.getByRole('button', { name: 'Inspect the wagons', exact: true });
        const unloadCases = story.getByRole('button', { name: 'Unload the rear cases', exact: true });
        const rebalanceCases = story.getByRole('button', { name: 'Rebalance by the manifest', exact: true });
        const takeVerge = story.getByRole('button', { name: 'Take the verge', exact: true });
        const deerTrack = story.getByRole('button', { name: 'Follow the deer track', exact: true });
        const leaveOptionalAmbush = story.getByRole('button', { name: 'Cut their return rope and leave', exact: true });
        const standDown = story.getByRole('button', { name: 'Order the watcher to stand down', exact: true });
        const rushArcher = story.getByRole('button', { name: 'Rush the culvert archer', exact: true });
        if (heading === 'Three Days to Greywatch' && await isVisible(inspectWagons)) await inspectWagons.click();
        else if (heading === 'The Rear Wheel Sags' && await isVisible(unloadCases)) await unloadCases.click();
        else if (heading === 'Weight on the Jack' && await isVisible(rebalanceCases)) await rebalanceCases.click();
        else if (heading === 'Punctures in the Leaf Mold' && await isVisible(leaveOptionalAmbush)) await leaveOptionalAmbush.click();
        else if (heading === "The Wagonwright's Mile" && await isVisible(takeVerge)) await takeVerge.click();
        else if (heading === 'Needle Briar' && await isVisible(deerTrack)) await deerTrack.click();
        else if (await isVisible(standDown)) await standDown.click();
        else if (heading === 'Blades in the Drainage Ditch' && await isVisible(rushArcher)) await rushArcher.click();
        else {
          const choice = story.locator('.choice-list button:not(:disabled)').first();
          await choice.click();
        }
        continue;
      }
      const outcomeContinue = story.locator('.outcome-panel button').first();
      if (await outcomeContinue.count() > 0) {
        await outcomeContinue.click();
        continue;
      }
      const continueStory = story.getByRole('button', { name: 'Continue', exact: true });
      if (await isVisible(continueStory)) {
        await continueStory.click();
        continue;
      }
    }

    const loading = page.locator('.loading-screen');
    if (await isVisible(loading)) {
      await expect(page.locator('.story-panel, .dialogue-panel, .combat-panel, .reward-panel, .travel-panel')).toBeVisible();
      continue;
    }

    throw new Error(`No visible game action advanced step ${step + 1}; current screen: ${(await page.locator('body').innerText()).slice(-500)}`);
  }

  throw new Error(`The requested screen did not appear within ${limit} visible game actions.`);
}

async function saveAndExitToTitle(page: Page, game: MorrowmerePage): Promise<void> {
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('heading', { name: 'Paused', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Save & Exit', exact: true }).click();
  await page.getByRole('heading', { name: 'Save and return to the title?', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Save & Exit', exact: true }).click();
  await expect(game.title).toBeVisible();
}

async function continueSlotOne(page: Page, game: MorrowmerePage): Promise<void> {
  await expect(game.continueChronicle).toBeEnabled();
  await game.continueChronicle.click();
}

test.describe('Chronicle dungeon journeys', () => {
  test('Chapter 1 cellar delve saves and resumes the exact live fight, then rejoins the main story once', async ({ page }) => {
    test.setTimeout(180_000);
    const game = new MorrowmerePage(page);
    await startFreshMageOnKingsRoad(page);

    await advanceUntil(page, page.getByRole('button', { name: 'Search the tollhouse', exact: true }));
    await expect(page.getByRole('heading', { name: 'The Empty Tollhouse', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search the tollhouse', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Search the tollhouse', exact: true }).click();
    await advanceUntil(page, page.getByRole('button', { name: 'Descend into the tollhouse cellar', exact: true }));
    await page.getByRole('button', { name: 'Descend into the tollhouse cellar', exact: true }).click();

    const cellarArt = page.locator('.scene-art img');
    const searchUniforms = page.locator('.dialogue-panel .choice-list button[aria-label="Search the uniform crates"]');
    await advanceUntil(page, searchUniforms);
    await expectLoadedArtwork(cellarArt, '/assets/chronicle1/scenes/ch01/scene-ch01-living-below-toll-desk-entry.webp');
    await searchUniforms.click();
    await expect(page.getByRole('heading', { name: 'Below the Toll Desk', exact: true })).toBeVisible();

    const battleArt = page.locator('.battlefield-art img');
    await advanceUntil(page, battleArt);
    await expectLoadedArtwork(battleArt, '/assets/chronicle1/battles/enc-ch01-tollhouse-lookouts.webp');
    await expect(page.getByRole('region', { name: 'Enemy party', exact: true }).locator('.enemy-card')).toHaveCount(2);
    await expect(page.getByRole('region', { name: 'Attack forecast', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Combat actions', exact: true }).getByRole('button', { name: 'Attack', exact: true })).toBeEnabled();
    await expect(page.getByRole('region', { name: 'Combat actions', exact: true }).getByRole('button', { name: 'Guard', exact: true })).toBeEnabled();
    await expect(page.getByRole('region', { name: 'Combat actions', exact: true }).getByRole('button', { name: 'Technique', exact: true })).toBeVisible();

    const tripwireTarget = page.locator('.enemy-card').filter({ has: page.getByRole('heading', { name: /Iron Deserter/u }) });
    await expect(tripwireTarget.locator('.enemy-intent strong')).toHaveText('Guarding ally');
    await page.getByRole('button', { name: 'Guard', exact: true }).click();
    await saveAndExitToTitle(page, game);
    const savedDuringCellarFight = await currentSavedState(page);
    expect(savedDuringCellarFight.expedition?.dungeonRun?.currentNodeId).toBe('ch01-tollhouse-lookouts');
    expect(savedDuringCellarFight.expedition?.currentCombat?.encounterId).toBe('enc-ch01-tollhouse-lookouts');
    expect(savedDuringCellarFight.expedition?.currentCombat?.combat?.turn).toBe(2);
    const savedEnemyHealth = savedDuringCellarFight.expedition?.currentCombat?.combat?.enemies.map((enemy) => enemy.health);

    await page.reload();
    await continueSlotOne(page, game);
    const resumed = await currentSavedState(page);
    expect(resumed.expedition?.dungeonRun?.currentNodeId).toBe('ch01-tollhouse-lookouts');
    expect(resumed.expedition?.currentCombat?.encounterId).toBe('enc-ch01-tollhouse-lookouts');
    expect(resumed.expedition?.currentCombat?.combat?.turn).toBe(2);
    expect(resumed.expedition?.currentCombat?.combat?.enemies.map((enemy) => enemy.health)).toEqual(savedEnemyHealth);
    await expectLoadedArtwork(page.locator('.battlefield-art img'), '/assets/chronicle1/battles/enc-ch01-tollhouse-lookouts.webp');

    await clearBattleThroughVisibleActions(page);
    await claimVisibleReward(page);
    await advanceUntil(page, page.getByRole('heading', { name: 'Tracks Beyond the Orchard', exact: true }));
    await expect(page.getByRole('button', { name: 'Shadow the boot trail', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Shadow the boot trail', exact: true }).click();
    await advanceUntil(page, page.getByRole('heading', { name: 'The First Arrow', exact: true }));
    await expect(page.getByRole('heading', { name: 'Road Tactics', exact: true })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Three Days to Greywatch', exact: true })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'The First Arrow', exact: true })).toBeVisible();
  });

  test('Chapter 5 offers a deliberate early retreat that secures the authored docket', async ({ page }) => {
    test.setTimeout(180_000);
    const game = new MorrowmerePage(page);
    await configureDeterministicFreshRun(page);
    await installSavedState(page, createChapter5RunAtJunction(29), 1);
    await continueSlotOne(page, game);

    await advanceUntil(page, page.getByRole('button', { name: 'Descend into the Embervault underworks', exact: true }));
    await page.getByRole('button', { name: 'Descend into the Embervault underworks', exact: true }).click();
    await expect(page.locator('.battlefield-art img')).toHaveAttribute('src', /enc-ch05-underworks-lift-watch-[ab]\.webp/u);
    await expect.poll(() => page.locator('.battlefield-art img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await clearBattleThroughVisibleActions(page);
    await claimVisibleReward(page);

    await advanceUntil(page, page.getByRole('button', { name: 'Withdraw through the ore lift', exact: true }));
    await page.getByRole('button', { name: 'Withdraw through the ore lift', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'A Controlled Retreat', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Secure the shift docket', exact: true }).click();
    await advanceUntil(page, page.getByRole('button', { name: 'Continue', exact: true }));
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    const settled = await currentSavedState(page);
    expect(settled.expedition?.dungeonRun).toBeNull();
    expect(settled.expedition?.unbankedGold).toBe(0);
    expect(settled.campaign.evidence).toContain('embervault-ledger-copy');
    await expect(page.locator('.enemy-party')).toBeHidden();
  });

  test('Chapter 5 long delve takes the ledger branch and resumes the regulator boss in phase one', async ({ page }) => {
    test.setTimeout(300_000);
    const game = new MorrowmerePage(page);
    await configureDeterministicFreshRun(page);
    await installSavedState(page, createChapter5RunAtJunction(41), 1);
    await continueSlotOne(page, game);

    await advanceUntil(page, page.getByRole('button', { name: 'Descend into the Embervault underworks', exact: true }));
    await page.getByRole('button', { name: 'Descend into the Embervault underworks', exact: true }).click();
    await clearBattleThroughVisibleActions(page);
    await claimVisibleReward(page);
    for (let fieldDose = 0; fieldDose < 2; fieldDose += 1) {
      if (!(await useHealingItemInTheField(page, 0.9))) break;
    }
    expect((await currentSavedState(page)).expedition?.heroVitals.health).toBeGreaterThan(60);

    await advanceUntil(page, page.getByRole('button', { name: 'Take the smelter rail', exact: true }));
    await page.getByRole('button', { name: 'Take the smelter rail', exact: true }).click();
    await clearBattleThroughVisibleActions(page);
    await claimVisibleReward(page);

    await advanceUntil(page, page.getByRole('button', { name: 'Reach the pressure alcove', exact: true }));
    await page.getByRole('button', { name: 'Reach the pressure alcove', exact: true }).click();
    await advanceUntil(page, page.getByRole('button', { name: 'Rest in the valve niche', exact: true }));
    await page.getByRole('button', { name: 'Rest in the valve niche', exact: true }).click();
    await clearBattleThroughVisibleActions(page);
    await claimVisibleReward(page);

    const ledgerRoute = page.getByRole('button', { name: 'Protect the ledger gallery', exact: true });
    await advanceUntil(page, ledgerRoute);
    for (let fieldDose = 0; fieldDose < 3; fieldDose += 1) {
      if (!(await useHealingItemInTheField(page, 0.9))) break;
    }
    await ledgerRoute.click();
    await clearBattleThroughVisibleActions(page);
    await claimVisibleReward(page);

    const bulkheadRest = page.getByRole('button', { name: 'Bind wounds at the bulkhead', exact: true });
    await advanceUntil(page, bulkheadRest);
    const healthBeforeRest = (await currentSavedState(page)).expedition?.heroVitals.health ?? 0;
    await bulkheadRest.click();
    const restedState = await currentSavedState(page);
    const healthAfterRest = restedState.expedition?.currentCombat?.combat?.player.health ?? restedState.expedition?.heroVitals.health ?? 0;
    expect(healthAfterRest).toBeGreaterThan(healthBeforeRest);
    await clearBattleThroughVisibleActions(page);
    await claimVisibleReward(page);

    const directVault = page.getByRole('button', { name: 'Enter the regulator vault', exact: true });
    const medicCache = page.getByRole('button', { name: 'Search the pressure medic’s cache', exact: true });
    await advanceUntil(page, medicCache);
    await expect(directVault).toBeVisible();
    await expect(page.getByRole('button', { name: 'Withdraw with the recovered evidence', exact: true })).toBeVisible();
    const healthBeforeCache = (await currentSavedState(page)).expedition?.heroVitals.health ?? 0;
    await medicCache.click();
    const bossArt = page.locator('.battlefield-art img');
    await expectLoadedArtwork(bossArt, '/assets/chronicle1/battles/enc-ch05-cinder-heart-regulator.webp');
    await expect(page.getByRole('heading', { name: 'Cinder-Heart Regulator', exact: true })).toBeVisible();
    await expect(page.locator('.enemy-card [aria-label="Boss phase 1"]')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Attack forecast', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flee', exact: true })).toBeDisabled();
    const bossEntry = await currentSavedState(page);
    expect(bossEntry.expedition?.currentCombat?.combat?.player.health).toBeGreaterThan(healthBeforeCache);
    expect(bossEntry.campaign.flags).toContain('underworks-pressure-medic-cache-opened');
    expect(bossEntry.campaign.inventory.pack.some((item) => item.itemId === 'consumable-burn-paste' && item.quantity === 2)).toBe(true);
    await page.getByRole('button', { name: 'Attack', exact: true }).click();
    await saveAndExitToTitle(page, game);

    const savedBoss = await currentSavedState(page);
    expect(savedBoss.expedition?.dungeonRun?.currentNodeId).toBe('ch05-cinder-heart-regulator');
    expect(savedBoss.expedition?.currentCombat?.encounterId).toBe('enc-ch05-cinder-heart-regulator');
    const expectedTurn = savedBoss.expedition?.currentCombat?.combat?.turn;
    const expectedHealth = savedBoss.expedition?.currentCombat?.combat?.enemies.map((enemy) => enemy.health);
    expect(expectedTurn).toBe(2);

    await page.reload();
    await continueSlotOne(page, game);
    const resumedBoss = await currentSavedState(page);
    expect(resumedBoss.expedition?.dungeonRun?.currentNodeId).toBe('ch05-cinder-heart-regulator');
    expect(resumedBoss.expedition?.currentCombat?.encounterId).toBe('enc-ch05-cinder-heart-regulator');
    expect(resumedBoss.expedition?.currentCombat?.combat?.turn).toBe(expectedTurn);
    expect(resumedBoss.expedition?.currentCombat?.combat?.enemies.map((enemy) => enemy.health)).toEqual(expectedHealth);
    await expectLoadedArtwork(page.locator('.battlefield-art img'), '/assets/chronicle1/battles/enc-ch05-cinder-heart-regulator.webp');
    await expect(page.locator('.enemy-card [aria-label="Boss phase 1"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flee', exact: true })).toBeDisabled();

    const bossPhaseTwo = page.locator('.enemy-card [aria-label="Boss phase 2"]');
    await clearBattleThroughVisibleActions(page, 42, async () => isVisible(bossPhaseTwo));
    await expect(bossPhaseTwo).toBeVisible();
    await expect(bossArt).toBeVisible();
    await expect(page.getByRole('region', { name: 'Enemy party', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Combat actions', exact: true }).getByRole('button', { name: 'Guard', exact: true })).toBeEnabled();
  });
});
