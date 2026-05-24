import { resolve } from 'path';
import {
  DEFAULT_AUTH_CONFIG,
  getAuthStatePath,
  normalizeProjectEnvironment,
  type ProjectAuthConfig,
  type ProjectAuthMode,
} from '../project/project-config';
import {
  getLocalSecretConfigPath,
  loadLocalSecretConfig,
  localSecretConfigExists,
} from './local-secret-config';

export interface ResolvedAuthConfig {
  projectKey: string;
  environment: string;
  mode: ProjectAuthMode;
  authStatePath: string;
  loginUrl: string;
  successUrlPattern: string;
  authenticatedCheckUrl: string;
  readonly: boolean;
  allowProductionReadonly: boolean;
  allowProductionWrite: boolean;
  ci: boolean;
  headless: boolean;
  testUserEmail?: string;
  testUserPassword?: string;
  localConfigPath: string;
  localConfigExists: boolean;
  source: 'project-config' | 'local-secret-file' | 'env' | 'default';
}

export function resolveAuthConfig(
  projectKey: string,
  env: string,
  projectAuth?: Partial<ProjectAuthConfig>,
  root?: string
): ResolvedAuthConfig {
  const base = root ? resolve(root) : process.cwd();
  const environment = normalizeProjectEnvironment(env);
  const localConfigPath = getLocalSecretConfigPath(projectKey, environment, base);
  const localConfig = loadLocalSecretConfig(projectKey, environment, base);
  const localAuth = localConfig?.auth;

  const authStatePath =
    projectAuth?.authStatePath ||
    localAuth?.authStatePath ||
    process.env.AUTH_STATE_PATH ||
    resolve(base, getAuthStatePath(projectKey, environment));

  const loginUrl =
    projectAuth?.loginUrl || localAuth?.loginUrl || process.env.AUTH_LOGIN_URL || '';
  const authenticatedCheckUrl =
    projectAuth?.authenticatedCheckUrl ||
    localAuth?.authenticatedCheckUrl ||
    process.env.AUTHENTICATED_CHECK_URL ||
    process.env.AUTH_CHECK_URL ||
    '';
  const successUrlPattern =
    projectAuth?.successUrlPattern ||
    localAuth?.successUrlPattern ||
    process.env.AUTH_SUCCESS_URL_PATTERN ||
    DEFAULT_AUTH_CONFIG.successUrlPattern ||
    '/';
  const mode =
    projectAuth?.mode ||
    (process.env.AUTH_BOOTSTRAP_MODE as ProjectAuthMode) ||
    (process.env.AUTH_MODE as ProjectAuthMode) ||
    (environment === 'production-smoke' ? 'preseeded' : DEFAULT_AUTH_CONFIG.mode || 'manual');

  const readonly =
    projectAuth?.readonly ??
    (process.env.AUTH_READONLY !== undefined
      ? process.env.AUTH_READONLY === 'true'
      : environment === 'production-smoke');

  const allowProductionReadonly = process.env.ALLOW_PRODUCTION_READONLY === 'true';
  const allowProductionWrite =
    projectAuth?.allowProductionWrite ??
    (process.env.ALLOW_PRODUCTION_WRITE === 'true');

  let source: 'project-config' | 'local-secret-file' | 'env' | 'default' = 'default';
  if (projectAuth) {
    source = 'project-config';
  } else if (localAuth) {
    source = 'local-secret-file';
  } else if (process.env.AUTH_STATE_PATH || process.env.AUTH_LOGIN_URL) {
    source = 'env';
  }

  return {
    projectKey,
    environment,
    mode,
    authStatePath,
    loginUrl,
    successUrlPattern,
    authenticatedCheckUrl,
    readonly,
    allowProductionReadonly,
    allowProductionWrite,
    ci: process.env.CI === 'true',
    headless:
      process.env.PLAYWRIGHT_HEADLESS !== 'false' &&
      process.env.HEADLESS !== 'false',
    testUserEmail: localAuth?.testUserEmail || process.env.TEST_USER_EMAIL,
    testUserPassword: localAuth?.testUserPassword || process.env.TEST_USER_PASSWORD,
    localConfigPath,
    localConfigExists: localSecretConfigExists(projectKey, environment, base),
    source,
  };
}

export function validateAuthConfig(config: ResolvedAuthConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (config.mode === 'manual' && !config.loginUrl) {
    issues.push(
      'loginUrl is not configured. Set it in project config, .env, or the local secret config file.'
    );
  }

  if (config.mode === 'env' && (!config.testUserEmail || !config.testUserPassword)) {
    issues.push(
      'env auth mode requires TEST_USER_EMAIL and TEST_USER_PASSWORD from the local secret config, local env, or CI secrets.'
    );
  }

  if (config.allowProductionWrite) {
    issues.push(
      'allowProductionWrite is true — this is dangerous and requires explicit human approval.'
    );
  }

  if (config.environment === 'production-smoke' && !config.readonly) {
    issues.push('production-smoke auth must remain readonly.');
  }

  return { valid: issues.length === 0, issues };
}

export function formatAuthConfigReport(config: ResolvedAuthConfig): string {
  return [
    'Auth Config:',
    `  Project: ${config.projectKey}`,
    `  Environment: ${config.environment}`,
    `  Mode: ${config.mode}`,
    `  Auth State Path: ${config.authStatePath}`,
    `  Login URL: ${config.loginUrl ? '(configured)' : '(not configured)'}`,
    `  Check URL: ${config.authenticatedCheckUrl ? '(configured)' : '(not configured)'}`,
    `  Readonly: ${config.readonly}`,
    `  Allow Production Readonly: ${config.allowProductionReadonly}`,
    `  Allow Production Write: ${config.allowProductionWrite}`,
    `  Headless Default: ${config.headless}`,
    `  CI: ${config.ci}`,
    `  Local Secret Config: ${config.localConfigExists ? '(configured)' : '(not configured)'}`,
    `  Local Secret Config Path: ${config.localConfigPath}`,
    `  Source: ${config.source}`,
  ].join('\n');
}
