import { existsSync, rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import {
  discoverProjectConfig,
  formatProjectConfigDiscovery,
} from '../packages/project/project-config-loader';
import type { ProjectUnitTestGateConfig } from '../packages/project/project-config';

dotenvConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getArgValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === `--${name}` || arg === `-${name[0]}`) {
      return args[index + 1];
    }
    if (arg.startsWith(`--${name}=`)) {
      return arg.slice(name.length + 3);
    }
  }
  return undefined;
}

function getConfiguredUnitTestGates(unitTests: {
  enabled: boolean;
  workingDir: string;
  command: string;
  gates?: ProjectUnitTestGateConfig[];
}): ProjectUnitTestGateConfig[] {
  if (!unitTests.enabled) {
    return [];
  }

  if (Array.isArray(unitTests.gates) && unitTests.gates.length > 0) {
    return unitTests.gates;
  }

  if (!unitTests.command || !unitTests.workingDir) {
    return [];
  }

  return [
    {
      name: 'default',
      workingDir: unitTests.workingDir,
      command: unitTests.command,
    },
  ];
}

function removePath(targetPath: string, deleted: string[], missing: string[]): void {
  if (!existsSync(targetPath)) {
    missing.push(targetPath);
    return;
  }

  rmSync(targetPath, { recursive: true, force: true });
  deleted.push(targetPath);
}

async function main(): Promise<void> {
  const projectKey = getArgValue('project') || process.env.PROJECT_KEY;
  const env = process.env.TEST_ENV || 'local';
  const deleted: string[] = [];
  const missing: string[] = [];

  console.log('Cleanup Test Artifacts');
  console.log('======================');

  removePath(resolve(ROOT, 'playwright-report'), deleted, missing);
  removePath(resolve(ROOT, 'test-results'), deleted, missing);

  if (!projectKey) {
    console.log('No project key provided. Cleaned framework-local artifacts only.');
  } else {
    const discovery = await discoverProjectConfig(projectKey, env, ROOT);
    console.log(formatProjectConfigDiscovery(discovery));
    console.log('');

    if (!discovery.exists) {
      console.log(`Project '${projectKey}' does not exist. Skipping project-specific artifact cleanup.`);
    } else {
      const gates = getConfiguredUnitTestGates(discovery.config.unitTests);
      for (const gate of gates) {
        if (!gate.coverage?.enabled) {
          continue;
        }

        const coverageWorkingDir = resolve(ROOT, gate.coverage.workingDir ?? gate.workingDir);
        const reportPath = resolve(coverageWorkingDir, gate.coverage.reportPath);
        const coverageDir = resolve(coverageWorkingDir, 'coverage');

        removePath(reportPath, deleted, missing);
        removePath(coverageDir, deleted, missing);
      }
    }
  }

  console.log('Deleted:');
  if (deleted.length === 0) {
    console.log('  (none)');
  } else {
    for (const item of deleted) {
      console.log(`  - ${item}`);
    }
  }

  console.log('');
  console.log('Already Missing:');
  if (missing.length === 0) {
    console.log('  (none)');
  } else {
    for (const item of missing) {
      console.log(`  - ${item}`);
    }
  }
}

await main();
