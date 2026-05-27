import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import {
  discoverProjectConfig,
  formatProjectConfigDiscovery,
} from '../packages/project/project-config-loader';
import type { ProjectUnitTestGateConfig } from '../packages/project/project-config';
import {
  formatCoverageMetric,
  getConfiguredCoverageGates,
  runUnitTestCoverageGate,
} from '../packages/project/unit-test-coverage';

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

  return [
    {
      name: 'default',
      workingDir: unitTests.workingDir,
      command: unitTests.command,
    },
  ];
}

async function main(): Promise<void> {
  const projectKey = getProjectKey();
  const env = process.env.TEST_ENV || 'local';

  console.log('Unit Test Coverage Check');
  console.log('========================');

  if (!projectKey) {
    console.log('Usage: npm run check:unit-coverage -- --project <project-key>');
    console.log('   or: PROJECT_KEY=<project-key> npm run check:unit-coverage');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  console.log(formatProjectConfigDiscovery(discovery));
  console.log('');

  if (!discovery.exists) {
    console.log(`Project '${projectKey}' does not exist.`);
    process.exit(1);
  }

  const unitTestGates = getConfiguredUnitTestGates(discovery.config.unitTests);
  const coverageGates = getConfiguredCoverageGates(unitTestGates);

  if (coverageGates.length === 0) {
    console.log('No unit test coverage gates are configured.');
    process.exit(0);
  }

  let exitCode = 0;

  for (const gate of coverageGates) {
    console.log(`Gate: ${gate.name}`);
    const result = runUnitTestCoverageGate(gate, ROOT);
    console.log(`  Status: ${result.status}`);
    console.log(`  Working Dir: ${result.workingDir}`);
    console.log(`  Report Path: ${result.reportPath}`);
    console.log(`  Command: ${result.command}`);
    console.log(`  Required To Proceed: ${result.requiredToProceed ? 'Yes' : 'No'}`);
    console.log(`  Notes: ${result.notes}`);
    console.log(`  Lines: ${formatCoverageMetric(result.summary?.totals.lines)}`);
    if (result.summary?.totals.statements) {
      console.log(`  Statements: ${formatCoverageMetric(result.summary.totals.statements)}`);
    }
    if (result.summary?.totals.functions) {
      console.log(`  Functions: ${formatCoverageMetric(result.summary.totals.functions)}`);
    }
    if (result.summary?.totals.branches) {
      console.log(`  Branches: ${formatCoverageMetric(result.summary.totals.branches)}`);
    }
    console.log(`  Modules: ${result.summary?.modules.length ?? 0}`);
    for (const module of result.summary?.modules ?? []) {
      console.log(
        `    - ${module.name}: ${module.lines.pct}% lines across ${module.fileCount} files`
      );
    }
    for (const violation of result.summary?.violations ?? []) {
      console.log(`  Violation: ${violation}`);
    }
    console.log('');

    if (
      (result.status === 'failed' || result.status === 'blocked') &&
      result.requiredToProceed
    ) {
      exitCode = result.exitCode ?? 1;
    }
  }

  process.exit(exitCode);
}

await main();
