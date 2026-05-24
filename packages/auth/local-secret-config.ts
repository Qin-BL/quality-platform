import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

export interface LocalAuthSecretConfig {
  authStatePath?: string;
  loginUrl?: string;
  successUrlPattern?: string;
  authenticatedCheckUrl?: string;
  testUserEmail?: string;
  testUserPassword?: string;
  mfaCode?: string;
  apiToken?: string;
}

export interface LocalSecretConfig {
  auth?: LocalAuthSecretConfig;
}

const DEFAULT_SECRET_DIR = '.secrets';

export function getLocalSecretConfigPath(
  projectKey: string,
  env: string,
  root?: string
): string {
  const base = root ? resolve(root) : process.cwd();
  const configuredPath = process.env.LOCAL_SECRET_CONFIG_PATH;

  if (configuredPath) {
    return resolve(base, configuredPath);
  }

  return resolve(base, DEFAULT_SECRET_DIR, projectKey, `${env}.local.json`);
}

export function localSecretConfigExists(
  projectKey: string,
  env: string,
  root?: string
): boolean {
  return existsSync(getLocalSecretConfigPath(projectKey, env, root));
}

export function loadLocalSecretConfig(
  projectKey: string,
  env: string,
  root?: string
): LocalSecretConfig | undefined {
  const configPath = getLocalSecretConfigPath(projectKey, env, root);
  if (!existsSync(configPath)) {
    return undefined;
  }

  const raw = readFileSync(configPath, 'utf-8');

  try {
    return JSON.parse(raw) as LocalSecretConfig;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(
      `Local secret config is not valid JSON: ${configPath}. ${detail}`
    );
  }
}

export function ensureLocalSecretConfigDir(configPath: string): void {
  const targetDir = dirname(configPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
}

export function writeLocalSecretConfig(
  projectKey: string,
  env: string,
  update: LocalSecretConfig,
  root?: string
): string {
  const configPath = getLocalSecretConfigPath(projectKey, env, root);
  const current = loadLocalSecretConfig(projectKey, env, root);

  const merged: LocalSecretConfig = {
    ...current,
    ...update,
    auth: {
      ...(current?.auth || {}),
      ...(update.auth || {}),
    },
  };

  ensureLocalSecretConfigDir(configPath);
  writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
  return configPath;
}
