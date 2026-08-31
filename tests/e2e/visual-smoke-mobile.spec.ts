import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { devices, expect, test } from '@playwright/test';
import { MorrowmerePage } from './pages/MorrowmerePage';

test.use({
  ...devices['Pixel 5'],
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 2,
});

test('keeps the title, opening, camp, route, story, and sheets readable on a small Android viewport', async ({ page }) => {
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

  await game.newChronicle.click();
  await page.getByRole('button', { name: 'Watch opening story' }).click();
  await expect(page.getByRole('region', { name: 'Opening story' })).toBeVisible();
  await expect(page.locator('.opening-caption')).toBeVisible();
  await page.screenshot({ path: join(output, '02-opening-caption-360x800.png') });
  await page.getByRole('button', { name: 'Skip opening' }).click();
  await page.getByRole('button', { name: /Mage/i }).click();
  await page.getByRole('button', { name: 'Begin Chronicle' }).click();
  await expect(page.getByRole('heading', { name: 'Road Camp' })).toBeVisible();
  await page.screenshot({ path: join(output, '03-camp-360x800.png') });
  await page.getByRole('button', { name: 'Choose a Route' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Your Road' })).toBeVisible();
  await page.screenshot({ path: join(output, '04-route-360x800.png') });
  await page.getByRole('button', { name: /King's Road/i }).click();
  await expect(page.locator('.story-panel')).toBeVisible();

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
  await page.screenshot({ path: join(output, '05-bright-story-360x800.png') });
  await page.getByRole('button', { name: 'Pack' }).click();
  await expect(page.getByRole('dialog', { name: 'Inventory' })).toBeVisible();
  await page.screenshot({ path: join(output, '06-inventory-360x800.png') });
  await page.getByRole('button', { name: 'Close Inventory' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await page.screenshot({ path: join(output, '07-settings-360x800.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
