import { test } from '@playwright/test';

test.describe('[Feature] E2E', () => {
  test('uses reviewed test plan and reusable layers @e2e', async ({ page }) => {
    void page;
    // Spec only orchestrates.
    // Do not invent selectors.
    // Do not invent endpoints.
    // Use pages / clients / fixtures / assertions.
    // Reference the reviewed test plan in the final implementation comment or report.
  });
});
