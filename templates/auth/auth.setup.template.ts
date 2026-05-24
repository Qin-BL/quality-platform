import type { Page } from '@playwright/test';

export async function performProjectLogin(page: Page): Promise<void> {
  void page;
  // Project-level adapter extension point.
  // Do not invent selectors.
  // Do not hardcode URLs.
  // Do not hardcode usernames, passwords, or tokens.
}
