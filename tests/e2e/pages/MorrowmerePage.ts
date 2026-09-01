import type { Locator, Page } from '@playwright/test';

export class MorrowmerePage {
  readonly page: Page;
  readonly title: Locator;
  readonly newChronicle: Locator;
  readonly continueChronicle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: 'MORROWMERE' });
    this.newChronicle = page.getByRole('button', { name: 'Begin slot 1' });
    this.continueChronicle = page.getByRole('button', { name: 'Continue slot 1' });
  }

  async gotoFresh() {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
  }

  async beginMageChronicle() {
    await this.newChronicle.click();
    await this.page.getByRole('button', { name: 'Watch opening story' }).click();
    await this.page.getByRole('region', { name: 'Opening story' }).click();
    await this.page.getByRole('button', { name: 'Skip opening' }).click();
    await this.page.getByRole('button', { name: /Mage/i }).click();
    await this.page.getByRole('button', { name: 'Begin Chronicle' }).click();
  }
}
