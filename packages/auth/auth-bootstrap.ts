import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { ResolvedAuthConfig } from './auth-config';
import {
  assertAuthStateNotCommittedPath,
  checkAuthState,
  ensureAuthStateDir,
  getAuthStatePath,
} from './auth-state';
import {
  assertCIAuthModeAllowed,
  assertManualModeAllowed,
  assertProductionAuthSafety,
} from './auth-guards';

export class AuthBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthBootstrapError';
  }
}

export function prepareAuthBootstrap(
  projectKey: string,
  config: ResolvedAuthConfig,
  root?: string
): {
  ready: boolean;
  needsBootstrap: boolean;
  bootstrapMode: 'none' | 'manual' | 'env' | 'preseeded';
  message: string;
  command: string;
} {
  const status = checkAuthState(config, root);

  if (status.valid) {
    return {
      ready: true,
      needsBootstrap: false,
      bootstrapMode: 'none',
      message: 'Auth state is valid. Ready for authenticated tests.',
      command: '',
    };
  }

  if (config.mode === 'manual') {
    return {
      ready: false,
      needsBootstrap: true,
      bootstrapMode: 'manual',
      message:
        `Auth state is missing or invalid at ${config.authStatePath}. ` +
        `${config.loginUrl ? 'A headed browser can open the configured login page.' : `Configure AUTH_LOGIN_URL or save loginUrl in ${config.localConfigPath} first.`}`,
      command: `npm run auth:login -- --project ${projectKey}`,
    };
  }

  if (config.mode === 'env') {
    return {
      ready: false,
      needsBootstrap: true,
      bootstrapMode: 'env',
      message:
        `Auth state is missing at ${config.authStatePath}. ` +
        `env mode requires TEST_USER_EMAIL / TEST_USER_PASSWORD from ${config.localConfigPath}, local env, or CI secrets plus a project adapter.`,
      command: `npm run auth:login -- --project ${projectKey}`,
    };
  }

  return {
    ready: false,
    needsBootstrap: true,
    bootstrapMode: 'preseeded',
    message:
      `Auth state is missing at ${config.authStatePath}. ` +
      'preseeded mode requires CI secrets, a local secret config file, or a pre-provisioned storageState.',
    command: '',
  };
}

export async function validateAuthState(config: ResolvedAuthConfig): Promise<boolean> {
  return checkAuthState(config).valid;
}

async function waitForManualLogin(page: Page, config: ResolvedAuthConfig): Promise<void> {
  const timeoutMs = 5 * 60 * 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const currentUrl = page.url();
    if (config.successUrlPattern && currentUrl.includes(config.successUrlPattern)) {
      return;
    }
    await page.waitForTimeout(1000);
  }

  throw new AuthBootstrapError(
    `Manual login timed out after ${timeoutMs / 1000}s. Configure successUrlPattern or authenticatedCheckUrl for your project.`
  );
}

export async function manualLoginAndSaveAuthState(
  config: ResolvedAuthConfig
): Promise<void> {
  if (!config.loginUrl) {
    throw new AuthBootstrapError('Manual auth bootstrap requires loginUrl.');
  }

  const authStatePath = getAuthStatePath(config);
  assertAuthStateNotCommittedPath(authStatePath);
  ensureAuthStateDir(authStatePath);

  const browser = await chromium.launch({ headless: false });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
    await waitForManualLogin(page, config);
    await context.storageState({ path: authStatePath });
  } finally {
    await browser.close();
  }
}

export async function bootstrapAuth(
  config?: Partial<ResolvedAuthConfig>
): Promise<void> {
  assertResolvedAuthConfig(config);
  return bootstrapResolvedAuth(config);
}

function assertResolvedAuthConfig(
  config?: Partial<ResolvedAuthConfig>
): asserts config is ResolvedAuthConfig {
  if (
    !config ||
    !config.projectKey ||
    !config.environment ||
    !config.mode ||
    !config.authStatePath ||
    config.readonly === undefined ||
    config.allowProductionReadonly === undefined ||
    config.allowProductionWrite === undefined ||
    config.ci === undefined ||
    config.headless === undefined ||
    !config.localConfigPath ||
    config.localConfigExists === undefined ||
    !config.source
  ) {
    throw new AuthBootstrapError(
      'bootstrapAuth requires a resolved auth config. Resolve project and auth config before bootstrapping.'
    );
  }
}

async function bootstrapResolvedAuth(config: ResolvedAuthConfig): Promise<void> {
  assertManualModeAllowed(config);
  assertCIAuthModeAllowed(config);
  assertProductionAuthSafety(config);

  if (await validateAuthState(config)) {
    return;
  }

  if (config.mode === 'manual') {
    await manualLoginAndSaveAuthState(config);
    return;
  }

  if (config.mode === 'env') {
    throw new AuthBootstrapError(
      `env auth mode requires a project-specific adapter based on templates/auth/auth.setup.template.ts plus credentials from ${config.localConfigPath}, local env, or CI secrets. The framework does not invent selectors.`
    );
  }

  throw new AuthBootstrapError(
    `preseeded auth requires a valid storageState file at ${config.authStatePath}.`
  );
}
