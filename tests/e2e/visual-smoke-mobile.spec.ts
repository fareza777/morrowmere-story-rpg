import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { devices, expect, test } from '@playwright/test';
import { MorrowmerePage } from './pages/MorrowmerePage';

test.use({
  ...devices['Pixel 5'],
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 2,
});

test('keeps the title, bright story, and defeat recovery readable on a small Android viewport', async ({ page }) => {
  const output = join(process.cwd(), 'release', 'visual-smoke');
  mkdirSync(output, { recursive: true });
  const game = new MorrowmerePage(page);

  await game.gotoFresh();
  await expect(page.locator('.launch-splash')).toBeHidden();
  await expect(game.title).toBeVisible();

  const titleBox = await game.title.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(titleBox!.x).toBeGreaterThanOrEqual(0);
  expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.screenshot({ path: join(output, '01-title-360x800.png') });

  await game.beginMageChronicle();
  await page.locator('.choice-button').first().click();
  await page.locator('.outcome-panel button').click();

  const scene = page.locator('.scene-art img');
  await expect(scene).toBeVisible();
  await expect(scene).toHaveJSProperty('complete', true);
  const sceneLuma = await scene.evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || image.naturalWidth === 0) return 0;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      sum += 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2];
    }
    return sum / (pixels.length / 4);
  });
  expect(sceneLuma).toBeGreaterThanOrEqual(95);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.screenshot({ path: join(output, '02-bright-story-360x800.png') });

  await page.evaluate(() => {
    const key = 'morrowmere:save:1';
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error('Expected an autosave before forcing the defeat screen.');
    const state = JSON.parse(raw);
    state.screen = 'defeat';
    state.hero.health = 0;
    state.combat = null;
    state.overlay = null;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('.launch-splash')).toBeHidden();
  await game.continueChronicle.click();

  const tryAgain = page.getByRole('button', { name: 'Try Again' });
  const mainMenu = page.getByRole('button', { name: 'Main Menu' });
  await expect(tryAgain).toBeVisible();
  await expect(mainMenu).toBeVisible();
  await expect(tryAgain.locator('svg')).toHaveCount(1);
  await expect(mainMenu.locator('svg')).toHaveCount(1);

  for (const action of [tryAgain, mainMenu]) {
    const box = await action.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(800);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.screenshot({ path: join(output, '03-defeat-actions-360x800.png') });
});
