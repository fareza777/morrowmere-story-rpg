import { expect, test, type Locator } from '@playwright/test';
import { MorrowmerePage } from './pages/MorrowmerePage';

async function expectLoadedArtwork(artwork: Locator, source: string) {
  await expect(artwork).toBeVisible();
  await expect.poll(() => artwork.evaluate((image: HTMLImageElement) =>
    image.complete && image.naturalWidth > 0,
  )).toBe(true);
  await expect(artwork).toHaveAttribute('src', source);
}

test('takes one departure road action then continues directly into the next illustrated scene', async ({ page }) => {
  const game = new MorrowmerePage(page);
  await game.gotoFresh();
  await expect(game.title).toBeVisible();
  await game.beginMageChronicle();
  await page.getByRole('button', { name: 'Choose a Route', exact: true }).click();
  await page.getByRole('button', { name: /King's Road/i }).click();

  const travel = page.getByRole('region', { name: 'Road Tactics', exact: true });
  await expect(travel.getByRole('heading', { name: 'Road Tactics', exact: true })).toBeVisible();
  await expect(travel).toContainText("King's Road lies ahead");
  const scoutCard = travel.locator('article').filter({
    has: page.getByRole('button', { name: 'Scout', exact: true }),
  });
  await expectLoadedArtwork(scoutCard.locator('img'), '/assets/chronicle1/travel/travel-road-scout.webp');
  await expect(page.locator('.scene-art[data-illustration-id]')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Road Tactics', exact: true })).toBeVisible();

  await travel.getByRole('button', { name: 'Scout', exact: true }).click();
  await expect(travel).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Three Days to Greywatch', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Road Tactics', exact: true })).toBeHidden();
  const departureArt = page.locator('.scene-art[data-illustration-id="scene-ch01-main-three-days-to-greywatch"]');
  await expectLoadedArtwork(departureArt.locator('img'), '/assets/chronicle1/scenes/ch01/scene-ch01-main-three-days-to-greywatch.webp');

  await page.getByRole('button', { name: 'Leave before traffic', exact: true }).click();
  await expect(page.getByRole('status').filter({ has: page.locator('.outcome-copy') })).toContainText('The wagons clear Dunmere');
  await expect(page.getByRole('heading', { name: 'Road Tactics', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Take the north road', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Blades in the Drainage Ditch', exact: true })).toBeVisible();
  await expect(travel).toBeHidden();
  await expect(departureArt).toBeHidden();

  await page.reload();
  await expect(game.continueChronicle).toBeEnabled();
  await game.continueChronicle.click();
  await expect(page.getByRole('heading', { name: 'Blades in the Drainage Ditch', exact: true })).toBeVisible();
  await expect(travel).toBeHidden();
  await expect(page.locator('.story-panel h1')).toBeVisible();
  const nextArt = page.locator('.scene-art[data-illustration-id]');
  await expect(nextArt).toHaveAttribute('data-illustration-id', /^scene-ch01-/);
  await expect(nextArt).not.toHaveAttribute('data-illustration-id', 'scene-ch01-main-three-days-to-greywatch');
  const nextIllustration = await nextArt.getAttribute('data-illustration-id');
  await expectLoadedArtwork(nextArt.locator('img'), `/assets/chronicle1/scenes/ch01/${nextIllustration}.webp`);
});
