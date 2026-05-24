import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object — encapsulates common Playwright Page interactions.
 *
 * All project-specific page objects should extend this class.
 * DO NOT add business-specific selectors or logic here.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ fullPage: true, path: `test-results/${name}.png` });
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async clickByTestId(testId: string): Promise<void> {
    await this.page.locator(`[data-testid="${testId}"]`).click();
  }

  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.page.locator(`[data-testid="${testId}"]`).fill(value);
  }

  async getByTestId(testId: string): Promise<Locator> {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async expectToast(message: string): Promise<void> {
    await expect(this.page.locator('.toast, [role="alert"]').filter({ hasText: message })).toBeVisible();
  }

  async expectUrl(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expected);
  }

  async expectVisible(testId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="${testId}"]`)).toBeVisible();
  }
}