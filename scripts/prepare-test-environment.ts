import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { discoverProjectConfig } from '../packages/project/project-config-loader';
import { runProjectOrchestration } from '../packages/fixtures/environment-orchestration';

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

  console.log('Prepare Test Environment');
  console.log('========================');

  if (!projectKey) {
    console.log('Usage: npm run orchestrate:test-env -- --project <project-key>');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  const result = await runProjectOrchestration(discovery.config.orchestration, ROOT);

  console.log(`Project: ${projectKey}`);
  console.log(`Environment: ${env}`);
  console.log(`Enabled: ${result.enabled}`);
  console.log(`Status: ${result.status}`);
  console.log('');

  for (const check of result.environmentChecks) {
    console.log(`[env] ${check.name}: ${check.status} — ${check.detail}`);
  }

  for (const dependency of result.dataDependencies) {
    console.log(`[data] ${dependency.name}: ${dependency.status} — ${dependency.detail}`);
  }

  if (result.status === 'failed' && result.requiredToProceed) {
    process.exit(1);
  }
}

await main();
