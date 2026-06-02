import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import {
  createMissingInput,
  createMissingInputState,
  writeMissingInputState,
} from '../packages/ai/missing-inputs';
import {
  AuthBootstrapError,
  bootstrapAuth,
  prepareAuthBootstrap,
} from '../packages/auth/auth-bootstrap';
import { resolveAuthConfig, validateAuthConfig } from '../packages/auth/auth-config';
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
    const state = createMissingInputState(
      'auth_bootstrap',
      env,
      '',
      'project-key-detection',
      [
        createMissingInput(
          'project_key',
          'Which project key should auth bootstrap use?',
          'No project key was provided.',
          'project-config-discovery'
        ),
      ]
    );
    console.log(`Resume state written to: ${writeMissingInputState(state, ROOT)}`);
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  if (!discovery.exists) {
    console.log(`Project '${projectKey}' does not exist. Run create:project first.`);
    process.exit(1);
  }

  const authConfig = resolveAuthConfig(projectKey, env, discovery.config.auth, ROOT);
  const authValidation = validateAuthConfig(authConfig);
  const status = checkAuthState(authConfig, ROOT);
  const bootstrap = prepareAuthBootstrap(projectKey, authConfig, ROOT);

  console.log(`Project: ${projectKey}`);
  console.log(`Environment: ${env}`);
  console.log(`Mode: ${authConfig.mode}`);
  console.log(`Local Secret Config: ${authConfig.localConfigExists ? 'configured' : 'not configured'}`);
  console.log(`Local Secret Config Path: ${authConfig.localConfigPath}`);
  console.log(`Auth State: ${status.valid ? 'valid' : status.reason}`);
  console.log('');

  if (!authValidation.valid) {
    const missingInputs = authValidation.issues.map((issue) => {
      if (issue.includes('loginUrl is not configured')) {
        return createMissingInput(
          'auth_login_url',
          `What login URL should auth bootstrap use for '${projectKey}' in ${env}?`,
          issue,
          'auth-config-resolution'
        );
      }
      if (issue.includes('TEST_USER_EMAIL') || issue.includes('TEST_USER_PASSWORD')) {
        return createMissingInput(
          'auth_credentials',
          `Which local auth credentials should be stored for '${projectKey}' in ${env}?`,
          issue,
          'auth-bootstrap',
          { sensitive: true }
        );
      }
      return createMissingInput(
        'custom',
        `Please resolve this auth configuration issue for '${projectKey}': ${issue}`,
        issue,
        'auth-bootstrap'
      );
    });

    const state = createMissingInputState(
      'auth_bootstrap',
      env,
      '',
      missingInputs[0].resumeStep,
      missingInputs,
      projectKey
    );
    console.log(`Resume state written to: ${writeMissingInputState(state, ROOT)}`);
    process.exit(1);
  }

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
