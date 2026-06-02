import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { discoverProjectConfig } from '../packages/project/project-config-loader';
import {
  buildAppMapCoverageSummary,
} from '../packages/project/app-map';

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

  console.log('App Map Coverage');
  console.log('================');

  if (!projectKey) {
    console.log('Usage: npm run check:app-map -- --project <project-key>');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  const summary = buildAppMapCoverageSummary(
    discovery.config.appMap,
    discovery.config.tests.testDir,
    discovery.config.context.testPlansReviewedDir,
    ROOT
  );

  console.log(`Project: ${projectKey}`);
  console.log(`Enabled: ${summary.enabled}`);
  console.log(`Covered Modules: ${summary.coveredModules}/${summary.totalModules}`);

  for (const module of summary.modules) {
    console.log(
      `- ${module.displayName}: ${module.covered ? 'covered' : 'gap'} (tests=${module.matchingTests.length}, plans=${module.matchingPlans.length})`
    );
  }
}

await main();
