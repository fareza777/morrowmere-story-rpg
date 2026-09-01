import { expect, test } from '@playwright/test';
import { MorrowmerePage } from './pages/MorrowmerePage';

async function expectThreeByTwo(page: import('@playwright/test').Page, expectedWidth: number) {
  const bounds = await page.locator('.scene-art').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeCloseTo(expectedWidth, 0);
  expect(bounds!.height).toBeCloseTo(expectedWidth * 2 / 3, 0);
  return bounds!;
}

test('sizes story art full-bleed on phones and caps it at 720 pixels on wide screens', async ({ page }) => {
  const game = new MorrowmerePage(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await game.gotoFresh();
  await expect(page.locator('.launch-splash')).toBeHidden();
  await game.beginMageChronicle();
  await page.getByRole('button', { name: 'Choose a Route' }).click();
  await page.getByRole('button', { name: /King's Road/i }).click();

  const narrow = await expectThreeByTwo(page, 320);
  expect(narrow.x).toBeCloseTo(0, 0);

  await page.setViewportSize({ width: 360, height: 800 });
  const phone = await expectThreeByTwo(page, 360);
  expect(phone.x).toBeCloseTo(0, 0);

  await page.setViewportSize({ width: 900, height: 900 });
  const wide = await expectThreeByTwo(page, 720);
  expect(wide.x).toBeCloseTo(90, 0);
});

test('keeps merchant art centered inside phone page padding', async ({ page }) => {
  const game = new MorrowmerePage(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await game.gotoFresh();
  await expect(page.locator('.launch-splash')).toBeHidden();
  await game.beginMageChronicle();
  await page.getByRole('button', { name: 'Choose a Route' }).click();
  await page.getByRole('button', { name: /King's Road/i }).click();

  await page.locator('.game-shell').evaluate((shell) => shell.classList.add('merchant-screen', 'screen-page'));
  const narrow = await expectThreeByTwo(page, 288);
  expect(narrow.x).toBeCloseTo(16, 0);

  await page.setViewportSize({ width: 360, height: 800 });
  const phone = await expectThreeByTwo(page, 328);
  expect(phone.x).toBeCloseTo(16, 0);
});

test('shows the class-selection road art without clipping narrow-screen controls', async ({ page }) => {
  const game = new MorrowmerePage(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await game.gotoFresh();
  await expect(page.locator('.launch-splash')).toBeHidden();
  await game.newChronicle.click();
  await page.getByRole('button', { name: 'Watch opening story' }).click();
  await page.getByRole('region', { name: 'Opening story' }).click();
  await page.getByRole('button', { name: 'Skip opening' }).click();

  const artwork = page.locator('.new-run-hero');
  const bounds = await artwork.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeCloseTo(288, 0);
  expect(bounds!.height).toBeCloseTo(192, 0);
  await expect(artwork.locator('img')).toHaveAttribute('src', '/assets/chronicle1/onboarding/class-selection-road.webp');
  await expect(page.getByRole('heading', { name: 'Choose your path' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Warden/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('adds bright hero art to camp and route planning and animates readable story entry', async ({ page }) => {
  const game = new MorrowmerePage(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await game.gotoFresh();
  await expect(page.locator('.launch-splash')).toBeHidden();
  await game.beginMageChronicle();

  const campArt = page.locator('.camp-screen .screen-hero');
  await expect(campArt.locator('img')).toHaveAttribute('src', '/assets/chronicle1/hubs/road-camp-morning.webp');
  const campBounds = await campArt.boundingBox();
  expect(campBounds).not.toBeNull();
  expect(campBounds!.width).toBeCloseTo(288, 0);
  expect(campBounds!.width / campBounds!.height).toBeCloseTo(1.5, 1);

  await page.setViewportSize({ width: 900, height: 900 });
  const wideCampBounds = await campArt.boundingBox();
  expect(wideCampBounds).not.toBeNull();
  expect(wideCampBounds!.width).toBeCloseTo(720, 0);
  await page.setViewportSize({ width: 320, height: 800 });

  await page.getByRole('button', { name: 'Choose a Route' }).click();
  const routeArt = page.locator('.route-screen .screen-hero');
  await expect(routeArt.locator('img')).toHaveAttribute('src', '/assets/chronicle1/hubs/three-roads-crossroads.webp');
  const routeBounds = await routeArt.boundingBox();
  expect(routeBounds).not.toBeNull();
  expect(routeBounds!.width).toBeCloseTo(288, 0);
  expect(routeBounds!.width / routeBounds!.height).toBeCloseTo(1.5, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: /King's Road/i }).click();

  const proseStyle = await page.locator('.story-prose p').first().evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { textAlign: style.textAlign, hyphens: style.hyphens };
  });
  expect(proseStyle).toEqual({ textAlign: 'justify', hyphens: 'auto' });
  expect(await page.locator('.scene-art').evaluate((element) => window.getComputedStyle(element).animationName)).toContain('scene-art-enter');
  expect(await page.locator('.story-panel').evaluate((element) => window.getComputedStyle(element).animationName)).toContain('scene-content-enter');
});
