import { test } from '@playwright/test';

test.describe('[Feature] External Verification', () => {
  test('stays readonly and uses client wrappers @external', async () => {
    // Spec only orchestrates.
    // Use readonly checks only unless explicit non-production approval exists.
    // Use packages/clients/external-system-client.base.ts extensions.
  });
});
