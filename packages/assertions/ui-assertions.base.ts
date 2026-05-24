import { expect, Page, Locator } from '@playwright/test';

/**
 * Base UI assertions — generic page and element verification helpers.
 *
 * TODO: Extend with business-specific UI assertions in project spaces.
 */
export class UiAssertionsBase {
  static async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  static async expectHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  static async expectEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  static async expectDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }

  static async expectText(locator: Locator, expected: string | RegExp): Promise<void> {
    await expect(locator).toHaveText(expected);
  }

  static async expectContainsText(locator: Locator, expected: string | RegExp): Promise<void> {
    await expect(locator).toContainText(expected);
  }

  static async expectValue(locator: Locator, expected: string | RegExp): Promise<void> {
    await expect(locator).toHaveValue(expected);
  }

  static async expectUrl(page: Page, expected: string | RegExp): Promise<void> {
    await expect(page).toHaveURL(expected);
  }

  static async expectTitle(page: Page, expected: string | RegExp): Promise<void> {
    await expect(page).toHaveTitle(expected);
  }

  static async expectCount(locator: Locator, expected: number): Promise<void> {
    await expect(locator).toHaveCount(expected);
  }

  static async expectAttribute(
    locator: Locator,
    attribute: string,
    expected: string | RegExp
  ): Promise<void> {
    await expect(locator).toHaveAttribute(attribute, expected);
  }
}