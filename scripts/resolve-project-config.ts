import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { resolveAuthConfig, formatAuthConfigReport } from '../packages/auth/auth-config';
import { checkAuthState, maskAuthStatePath } from '../packages/auth/auth-state';
import {
  discoverProjectConfig,
  formatProjectConfigDiscovery,
} from '../packages/project/project-config-loader';
import {
  getContextLabelFromPath,
  resolveContextPaths,
  resolveGeneratedTestPlanDir,
  resolveReviewedTestPlanDir,
  resolveTestsDir,
} from '../packages/project/project-discovery';

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

  console.log('Project Config Resolution');
  console.log('=========================');

  if (!projectKey) {
    console.log('Usage: npm run project:resolve -- --project <project-key>');
    console.log('   or: PROJECT_KEY=<project-key> npm run project:resolve');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  console.log(formatProjectConfigDiscovery(discovery));
  console.log('');

  if (!discovery.exists) {
    console.log(`Project root does not exist yet: ${discovery.projectRoot}`);
    console.log(`Create it with: npm run create:project -- --project ${projectKey}`);
    process.exit(1);
  }

  const authConfig = resolveAuthConfig(projectKey, env, discovery.config.auth, ROOT);
  const authStatus = checkAuthState(authConfig, ROOT);
  const contextPaths = resolveContextPaths(projectKey, ROOT);

  console.log('Resolved Paths:');
  console.log(`  Project Root: ${discovery.projectRoot}`);
  console.log(`  Config Dir: ${discovery.configDir}`);
  console.log(`  Tests Dir: ${resolveTestsDir(projectKey, ROOT)}`);
  console.log(`  Generated Test Plans: ${resolveGeneratedTestPlanDir(projectKey, ROOT)}`);
  console.log(`  Reviewed Test Plans: ${resolveReviewedTestPlanDir(projectKey, ROOT)}`);
  console.log('');

  console.log('Context Files:');
  for (const contextPath of contextPaths) {
    console.log(
      `  ${existsSync(contextPath) ? '✅' : '⚠️'} ${getContextLabelFromPath(contextPath)}`
    );
  }
  console.log('');

  console.log(formatAuthConfigReport(authConfig));
  console.log(`  Auth State Status: ${authStatus.valid ? 'valid' : authStatus.reason}`);
  console.log(`  Auth State Path: ${maskAuthStatePath(authConfig.authStatePath)}`);
  console.log('');

  console.log('Safety:');
  console.log(`  Readonly: ${discovery.config.safety.readonly}`);
  console.log(`  Allow Production Write: ${discovery.config.safety.allowProductionWrite}`);
  console.log(`  Allow External Write: ${discovery.config.safety.allowExternalWrite}`);
  console.log(`  Require Reviewed Test Plan: ${discovery.config.safety.requireReviewedTestPlan}`);
}

await main();
