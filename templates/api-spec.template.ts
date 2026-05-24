import { test } from '@playwright/test';

test.describe('[Feature] API', () => {
  test('uses reviewed test plan and client abstractions @api', async ({ request }) => {
    void request;
    // Spec only orchestrates.
    // Do not invent endpoints.
    // Use packages/clients/ for API calls.
    // Use packages/assertions/ for assertions.
  });
});
