import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import {
  AuthBootstrapError,
  bootstrapAuth,
  prepareAuthBootstrap,
} from '../packages/auth/auth-bootstrap';
import { resolveAuthConfig } from '../packages/auth/auth-config';
import { checkAuthState } from '../packages/auth/auth-state';
import { discoverProjectConfig } from '../packages/project/project-config-loader';

dotenvConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getProjectKey(): string | undefined {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--project' || args[index] === '-p') {
      return args[index + 1];
    }
  }

  return process.env.PROJECT_KEY;
}

async function main(): Promise<void> {
  const projectKey = getProjectKey();
  const env = process.env.TEST_ENV || 'local';

  console.log('Auth Login');
  console.log('==========');

  if (!projectKey) {
    console.log('Usage: npm run auth:login -- --project <project-key>');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  if (!discovery.exists) {
    console.log(`Project '${projectKey}' does not exist. Run create:project first.`);
    process.exit(1);
  }

  const authConfig = resolveAuthConfig(projectKey, env, discovery.config.auth, ROOT);
  const status = checkAuthState(authConfig, ROOT);
  const bootstrap = prepareAuthBootstrap(projectKey, authConfig, ROOT);

  console.log(`Project: ${projectKey}`);
  console.log(`Environment: ${env}`);
  console.log(`Mode: ${authConfig.mode}`);
  console.log(`Local Secret Config: ${authConfig.localConfigExists ? 'configured' : 'not configured'}`);
  console.log(`Local Secret Config Path: ${authConfig.localConfigPath}`);
  console.log(`Auth State: ${status.valid ? 'valid' : status.reason}`);
  console.log('');

  if (status.valid) {
    console.log('Auth state already valid. No login required.');
    return;
  }

  console.log(bootstrap.message);

  try {
    await bootstrapAuth(authConfig);
    console.log('Auth bootstrap finished successfully.');
  } catch (error) {
    if (error instanceof AuthBootstrapError) {
      console.log(`Auth bootstrap blocked: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

await main();
