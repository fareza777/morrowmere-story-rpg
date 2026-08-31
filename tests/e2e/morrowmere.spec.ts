import { expect, test } from '@playwright/test';
import { MorrowmerePage } from './pages/MorrowmerePage';

test('plays and resumes a portrait Mage chronicle', async ({ page }, testInfo) => {
  const game = new MorrowmerePage(page);
  await game.gotoFresh();
  await expect(game.title).toBeVisible();
  const titleBox = await game.title.boundingBox();
  const viewport = page.viewportSize();
  expect(titleBox?.x).toBeGreaterThanOrEqual(0);
  expect((titleBox?.x ?? 0) + (titleBox?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 360);

  await game.beginMageChronicle();
  await expect(page.getByRole('heading', { name: 'When the Black Rain Rings' })).toBeVisible();
  const shellBox = await page.locator('.game-shell').boundingBox();
  expect(shellBox?.height).toBeGreaterThanOrEqual(700);
  await page.screenshot({ path: testInfo.outputPath('morrowmere-mobile.png'), fullPage: true });

  await page.reload();
  await expect(game.continueChronicle).toBeEnabled();
  await game.continueChronicle.click();
  await expect(page.getByRole('heading', { name: 'When the Black Rain Rings' })).toBeVisible();
  await page.getByRole('button', { name: 'Pack' }).click();
  await expect(page.getByRole('dialog', { name: 'Inventory' })).toContainText('Red Mercy');
  await page.getByRole('tab', { name: 'Equipment' }).click();
  await expect(page.getByLabel('Equipped items')).toContainText('WeaponEmpty');
});

test('exposes an installable English manifest', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe('MORROWMERE: A Sword & Sorcery Chronicle');
  expect(manifest.lang).toBe('en');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});

test('returns to the title screen while fully offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  expect(await page.evaluate(() => caches.keys())).not.toHaveLength(0);
  await context.setOffline(true);
  await page.goto('/?offline-check=1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'MORROWMERE' })).toBeVisible();
  await context.setOffline(false);
});
