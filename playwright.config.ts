import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';
import { loadLocalSecretConfig } from './packages/auth/local-secret-config';

const TEST_ENV = process.env.TEST_ENV || 'local';
const PROJECT_KEY = process.env.PROJECT_KEY || '';
const localSecrets = PROJECT_KEY ? loadLocalSecretConfig(PROJECT_KEY, TEST_ENV, process.cwd()) : undefined;
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ||
  localSecrets?.runtime?.playwrightBaseUrl ||
  localSecrets?.auth?.loginUrl ||
  process.env.APP_BASE_URL ||
  'http://127.0.0.1:3000';

function resolveAuthStatePath(): string | undefined {
  if (process.env.AUTH_STATE_PATH) {
    return process.env.AUTH_STATE_PATH;
  }

  if (!PROJECT_KEY) {
    return undefined;
  }

  const derived = `.auth/${PROJECT_KEY}-${TEST_ENV}.json`;
  const absolute = resolve(process.cwd(), derived);
  return existsSync(absolute) ? derived : undefined;
}

const authStatePath = resolveAuthStatePath();
const require = createRequire(import.meta.url);

function resolveReporters(): ReporterDescription[] {
  const reporters: ReporterDescription[] = [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ];

  try {
    require.resolve('allure-playwright');
    reporters.push(['allure-playwright', { outputFolder: 'allure-results' }]);
  } catch {
    // Allure is optional in phase 1. Skip it when the reporter package is not installed.
  }

  return reporters;
}

export default defineConfig({
  testDir: './projects',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: process.env.CI === 'true',
  retries: process.env.CI === 'true' ? 2 : 0,
  workers: process.env.CI === 'true' ? 2 : undefined,
  reporter: resolveReporters(),
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    ...(authStatePath ? { storageState: authStatePath } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer:
    process.env.WEB_SERVER_DISABLED === 'true'
      ? undefined
      : {
          command:
            process.env.WEB_SERVER_COMMAND ||
            'echo "No web server configured. Set WEB_SERVER_COMMAND when a real app is connected."',
          url: process.env.WEB_SERVER_URL || BASE_URL,
          reuseExistingServer: process.env.CI !== 'true',
          timeout: 30_000,
        },
});
