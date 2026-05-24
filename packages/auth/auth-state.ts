import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import type { ResolvedAuthConfig } from './auth-config';

export interface AuthStateStatus {
  exists: boolean;
  valid: boolean;
  path: string;
  reason: string;
}

export function authStateExists(path: string): boolean {
  return existsSync(resolve(process.cwd(), path));
}

export function ensureAuthStateDir(path: string): void {
  const targetDir = dirname(resolve(process.cwd(), path));
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
}

export function getAuthStatePath(config: ResolvedAuthConfig): string {
  return config.authStatePath;
}

export function assertAuthStateNotCommittedPath(path: string): void {
  if (
    !path.includes('.auth/') &&
    !path.includes('\\.auth\\') &&
    !path.includes('playwright/.auth/')
  ) {
    throw new Error(
      `Auth state path must live under .auth/ or playwright/.auth/. Received: ${path}`
    );
  }
}

export function maskAuthStatePath(path: string): string {
  return `.../${basename(path)}`;
}

export function checkAuthState(config: ResolvedAuthConfig, root?: string): AuthStateStatus {
  const base = root ? resolve(root) : process.cwd();
  const statePath = resolve(base, config.authStatePath);

  if (!existsSync(statePath)) {
    return {
      exists: false,
      valid: false,
      path: statePath,
      reason: `Auth state file does not exist at ${maskAuthStatePath(statePath)}.`,
    };
  }

  try {
    const content = JSON.parse(readFileSync(statePath, 'utf-8')) as {
      cookies?: unknown[];
      origins?: unknown[];
    };
    const hasCookies = Array.isArray(content.cookies) && content.cookies.length > 0;
    const hasOrigins = Array.isArray(content.origins) && content.origins.length > 0;

    if (!hasCookies && !hasOrigins) {
      return {
        exists: true,
        valid: false,
        path: statePath,
        reason: 'Auth state exists but has no cookies or origins.',
      };
    }

    return {
      exists: true,
      valid: true,
      path: statePath,
      reason: 'Auth state exists with session data.',
    };
  } catch {
    return {
      exists: true,
      valid: false,
      path: statePath,
      reason: 'Auth state exists but is not valid JSON storageState.',
    };
  }
}

export function getAuthBootstrapCommand(
  projectKey: string,
  config: ResolvedAuthConfig
): string {
  if (config.mode === 'manual') {
    return `npm run auth:login -- --project ${projectKey}`;
  }
  if (config.mode === 'env') {
    return `Set TEST_USER_EMAIL / TEST_USER_PASSWORD, then run: npm run auth:login -- --project ${projectKey}`;
  }
  return `Provide a preseeded storageState file at ${config.authStatePath}`;
}

export function ensureAuthDirectory(statePath: string, root?: string): string {
  const base = root ? resolve(root) : process.cwd();
  const resolvedStatePath = resolve(base, statePath);
  const directory = dirname(resolvedStatePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  return directory;
}
