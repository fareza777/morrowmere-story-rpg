import { devices, expect, test } from '@playwright/test';
import { MorrowmerePage } from './pages/MorrowmerePage';

test.use({
  ...devices['Pixel 5'],
  viewport: { width: 320, height: 568 },
  deviceScaleFactor: 2,
});

test('keeps the medieval story and labeled menus readable on a small phone', async ({ page }) => {
  const game = new MorrowmerePage(page);
  await game.gotoFresh();
  await expect(page.locator('.launch-splash')).toBeHidden();

  const titleFits = await game.title.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= window.innerWidth;
  });
  expect(titleFits).toBe(true);

  await game.beginMageChronicle();
  await expect(page.getByRole('heading', { name: 'Road Camp' })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByRole('button', { name: 'Choose a Route' }).click();
  await page.getByRole('button', { name: /King's Road/i }).click();
  await expect(page.locator('.story-panel h1')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Pack' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Journal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Companions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  const locationFits = await page.locator('.hud-location span').evaluate((element) => element.scrollWidth <= element.clientWidth);
  expect(locationFits).toBe(true);

  const proseStyle = await page.locator('.story-prose').evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { fontSize: Number.parseFloat(style.fontSize), overflowY: style.overflowY };
  });
  expect(proseStyle.fontSize).toBeGreaterThanOrEqual(18);
  expect(proseStyle.overflowY).toBe('visible');

  await page.getByRole('button', { name: 'Pack' }).click();
  await page.getByRole('tab', { name: 'Equipment' }).click();
  expect(await page.locator('.equipment-slots strong').first().evaluate((element) => window.getComputedStyle(element).whiteSpace)).toBe('normal');

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test.describe('200% story reflow', () => {
  test.use({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1 });

  test('keeps story choices within the viewport and usable', async ({ page }) => {
    const game = new MorrowmerePage(page);
    await game.gotoFresh();
    await expect(page.locator('.launch-splash')).toBeHidden();
    await game.beginMageChronicle();
    await page.getByRole('button', { name: 'Choose a Route' }).click();
    await page.getByRole('button', { name: /King's Road/i }).click();
    await expect(page.locator('.story-panel h1')).toBeVisible();
    await page.locator('.game-shell').evaluate((element) => element.style.setProperty('--text-scale', '2'));

    const choice = page.locator('.choice-button').first();
    await expect(choice).toBeVisible();
    await choice.scrollIntoViewIfNeeded();
    const boundsStayVisible = await page.evaluate(() => {
      const targets = [...document.querySelectorAll<HTMLElement>('.story-panel, .choice-button, .choice-button strong, .choice-button small')];
      return document.documentElement.scrollWidth <= window.innerWidth
        && targets.every((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= window.innerWidth;
        });
    });
    expect(boundsStayVisible).toBe(true);
    await expect(choice).toBeVisible();
    await choice.click();
  });
});
