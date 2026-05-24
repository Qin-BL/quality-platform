import type { ResolvedAuthConfig } from './auth-config';

export function isProductionSmoke(env: string): boolean {
  return env === 'production-smoke' || env === 'production';
}

export function assertReadonlyOnly(env: string): void {
  if (isProductionSmoke(env) && process.env.ALLOW_PRODUCTION_WRITE === 'true') {
    throw new Error(
      'PRODUCTION WRITE IS DANGEROUS. Remove ALLOW_PRODUCTION_WRITE=true unless explicitly approved.'
    );
  }
}

export function assertNoProductionWrite(env: string): void {
  if (isProductionSmoke(env)) {
    throw new Error(
      'Production environment does not allow write operations. Use local or staging for write-capable tests.'
    );
  }
}

export function assertAuthReady(
  projectKey: string,
  needsAuth: boolean,
  authStateExists: boolean
): void {
  if (needsAuth && !authStateExists) {
    throw new Error(
      `Auth state is required for project '${projectKey}' but not found. Run: npm run auth:login -- --project ${projectKey}`
    );
  }
}

export function assertManualModeAllowed(config: ResolvedAuthConfig): void {
  if (config.ci && config.mode === 'manual') {
    throw new Error('CI must not use manual auth bootstrap.');
  }
}

export function assertProductionAuthSafety(config: ResolvedAuthConfig): void {
  if (!isProductionSmoke(config.environment)) {
    return;
  }

  if (!config.readonly) {
    throw new Error('production-smoke auth must remain readonly.');
  }

  if (config.allowProductionWrite) {
    throw new Error(
      'ALLOW_PRODUCTION_WRITE=true is blocked for production-smoke unless a human explicitly approves it.'
    );
  }
}

export function assertCIAuthModeAllowed(config: ResolvedAuthConfig): void {
  if (config.ci && config.mode === 'manual') {
    throw new Error('Manual auth bootstrap is forbidden in CI.');
  }
}

export function assertNoSecretLeak(value: string): string {
  if (!value) {
    return '(not set)';
  }

  if (value.length <= 4) {
    return '****';
  }

  return `${value.slice(0, 2)}****${value.slice(-1)}`;
}

export function sanitizeForOutput(value: string | undefined): string {
  return value ? assertNoSecretLeak(value) : '(not set)';
}
