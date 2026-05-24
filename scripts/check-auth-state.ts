import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { prepareAuthBootstrap, validateAuthState } from '../packages/auth/auth-bootstrap';
import { resolveAuthConfig } from '../packages/auth/auth-config';
import { checkAuthState, getAuthBootstrapCommand, maskAuthStatePath } from '../packages/auth/auth-state';
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

  console.log('Auth State Check');
  console.log('================');

  if (!projectKey) {
    console.log('Usage: npm run auth:check -- --project <project-key>');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  if (!discovery.exists) {
    console.log(`Project '${projectKey}' does not exist. Run create:project first.`);
    process.exit(1);
  }

  const authConfig = resolveAuthConfig(projectKey, env, discovery.config.auth, ROOT);
  const status = checkAuthState(authConfig, ROOT);
  const validated = await validateAuthState(authConfig);
  const bootstrap = prepareAuthBootstrap(projectKey, authConfig, ROOT);

  console.log(`Project: ${projectKey}`);
  console.log(`Environment: ${env}`);
  console.log(`Mode: ${authConfig.mode}`);
  console.log(`Auth State Path: ${maskAuthStatePath(authConfig.authStatePath)}`);
  console.log(`Local Secret Config Path: ${authConfig.localConfigPath}`);
  console.log(`Local Secret Config Exists: ${authConfig.localConfigExists ? 'Yes' : 'No'}`);
  console.log(`Exists: ${status.exists ? 'Yes' : 'No'}`);
  console.log(`Valid: ${validated ? 'Yes' : 'No'}`);
  console.log(`Authenticated Check URL: ${authConfig.authenticatedCheckUrl ? '(configured)' : '(not configured)'}`);
  console.log(`Detail: ${status.reason}`);
  console.log('');

  if (!validated) {
    console.log(`Bootstrap Mode: ${bootstrap.bootstrapMode}`);
    console.log(`Bootstrap Command: ${getAuthBootstrapCommand(projectKey, authConfig)}`);
  }
}

await main();
