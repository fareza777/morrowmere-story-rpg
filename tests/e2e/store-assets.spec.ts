import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { devices, expect, test } from '@playwright/test';
import { MorrowmerePage } from './pages/MorrowmerePage';

test.use({
  ...devices['Pixel 5'],
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
});

test.skip(!process.env.CAPTURE_STORE_ASSETS, 'Run only when regenerating Play Store screenshots.');

test('captures actual 9:16 game screens', async ({ page }) => {
  const output = join(process.cwd(), 'store-listing', 'screenshots');
  mkdirSync(output, { recursive: true });
  const game = new MorrowmerePage(page);
  await game.gotoFresh();
  await expect(game.title).toBeVisible();
  await page.screenshot({ path: join(output, '01-title.png') });

  await game.newChronicle.click();
  await page.getByRole('button', { name: 'Begin Chronicle' }).click();
  await expect(page.getByRole('heading', { name: 'When the Black Rain Rings' })).toBeVisible();
  await page.screenshot({ path: join(output, '02-story.png') });

  for (let step = 0; step < 14; step += 1) {
    if (await page.getByRole('button', { name: 'Attack' }).isVisible().catch(() => false)) break;
    const outcomeContinue = page.locator('.outcome-panel button:visible');
    if (await outcomeContinue.count()) {
      await outcomeContinue.click();
    } else {
      await page.locator('.choice-button:visible').first().click();
    }
  }

  await expect(page.getByRole('button', { name: 'Attack' })).toBeVisible();
  await page.screenshot({ path: join(output, '03-combat.png') });
});
