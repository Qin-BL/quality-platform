import { resolve } from 'path';
import {
  DEFAULT_AUTH_CONFIG,
  getAuthStatePath,
  normalizeProjectEnvironment,
  type ProjectAuthConfig,
  type ProjectAuthMode,
} from '../project/project-config';

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
  source: 'project-config' | 'env' | 'default';
}

export function resolveAuthConfig(
  projectKey: string,
  env: string,
  projectAuth?: Partial<ProjectAuthConfig>,
  root?: string
): ResolvedAuthConfig {
  const base = root ? resolve(root) : process.cwd();
  const environment = normalizeProjectEnvironment(env);

  const authStatePath =
    projectAuth?.authStatePath ||
    process.env.AUTH_STATE_PATH ||
    resolve(base, getAuthStatePath(projectKey, environment));

  const loginUrl = projectAuth?.loginUrl || process.env.AUTH_LOGIN_URL || '';
  const authenticatedCheckUrl =
    projectAuth?.authenticatedCheckUrl ||
    process.env.AUTHENTICATED_CHECK_URL ||
    process.env.AUTH_CHECK_URL ||
    '';
  const successUrlPattern =
    projectAuth?.successUrlPattern ||
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

  let source: 'project-config' | 'env' | 'default' = 'default';
  if (projectAuth) {
    source = 'project-config';
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
    testUserEmail: process.env.TEST_USER_EMAIL,
    testUserPassword: process.env.TEST_USER_PASSWORD,
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
      'loginUrl is not configured. Set AUTH_LOGIN_URL in .env or the project config.'
    );
  }

  if (config.mode === 'env' && (!config.testUserEmail || !config.testUserPassword)) {
    issues.push(
      'env auth mode requires TEST_USER_EMAIL and TEST_USER_PASSWORD from local env or CI secrets.'
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
    `  Source: ${config.source}`,
  ].join('\n');
}
