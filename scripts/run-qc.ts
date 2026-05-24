import { existsSync, readdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { config as dotenvConfig } from 'dotenv';
import { validateAiTaskContract } from '../packages/ai/ai-task-contract';
import { createAuditEntry, createAuditTrail, addToAuditTrail } from '../packages/reporting/audit-log';
import { prepareAuthBootstrap, bootstrapAuth } from '../packages/auth/auth-bootstrap';
import { resolveAuthConfig } from '../packages/auth/auth-config';
import { checkAuthState } from '../packages/auth/auth-state';
import { isProductionSmoke } from '../packages/auth/auth-guards';
import { buildTagExpression } from '../packages/core/test-tags';
import { FAILURE_CATEGORIES } from '../packages/healing/failure-classifier';
import { createQCReport, formatQCReport } from '../packages/reporting/qc-report';
import {
  discoverProjectConfig,
  formatProjectConfigDiscovery,
} from '../packages/project/project-config-loader';
import {
  detectProjectKeyFromText,
  getContextLabelFromPath,
  projectExists,
  resolveContextPaths,
  resolveReviewedTestPlanDir,
  resolveTestsDir,
} from '../packages/project/project-discovery';
import { parseQCCommand } from '../packages/project/qc-command-parser';

dotenvConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedCli {
  projectKey?: string;
  env: string;
  release: boolean;
  bootstrapAuth: boolean;
  rawText: string;
}

function parseCli(): ParsedCli {
  const args = process.argv.slice(2);
  let projectKey = process.env.PROJECT_KEY;
  let env = process.env.TEST_ENV || 'local';
  let release = false;
  let bootstrap = false;
  const freeText: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === '--project' || arg === '-p') {
      projectKey = args[index + 1];
      index++;
      continue;
    }

    if (arg === '--env' || arg === '-e') {
      env = args[index + 1] || env;
      index++;
      continue;
    }

    if (arg === '--release') {
      release = true;
      continue;
    }

    if (arg === '--bootstrap-auth') {
      bootstrap = true;
      continue;
    }

    freeText.push(arg);
  }

  const rawText = freeText.join(' ').trim();
  if (!projectKey && rawText) {
    projectKey = detectProjectKeyFromText(rawText);
  }

  return {
    projectKey,
    env,
    release,
    bootstrapAuth: bootstrap || /auth\s+bootstrap|本地 auth bootstrap/i.test(rawText),
    rawText,
  };
}

function selectTags(
  release: boolean,
  env: string,
  configTags: {
    defaultTags: string[];
    smokeTags: string[];
    releaseTags: string[];
    productionSmokeTags: string[];
  }
): string[] {
  if (isProductionSmoke(env)) {
    return configTags.productionSmokeTags;
  }

  if (release) {
    return configTags.releaseTags;
  }

  return configTags.defaultTags;
}

function countSelectedTests(tags: string[]): {
  smoke: number;
  e2e: number;
  api: number;
  external: number;
  visual: number;
} {
  return {
    smoke: tags.includes('@smoke') ? 1 : 0,
    e2e: tags.includes('@e2e') ? 1 : 0,
    api: tags.includes('@api') ? 1 : 0,
    external: tags.includes('@external') ? 1 : 0,
    visual: tags.includes('@visual') ? 1 : 0,
  };
}

function writeReport(projectKey: string, report: string): string {
  const outputPath = resolve(
    ROOT,
    'reports',
    'qc',
    `${projectKey}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
  );
  writeFileSync(outputPath, report);
  return outputPath;
}

function runUnitTestGate(unitTests: {
  enabled: boolean;
  workingDir: string;
  command: string;
  requiredToProceed: boolean;
}): {
  status: 'not_configured' | 'skipped' | 'passed' | 'failed' | 'blocked';
  workingDir: string;
  notes: string;
  exitCode?: number;
} {
  if (!unitTests.enabled) {
    return {
      status: 'not_configured',
      workingDir: '',
      notes: 'Project config did not enable unit test precheck.',
    };
  }

  if (!unitTests.command || !unitTests.workingDir) {
    return {
      status: 'blocked',
      workingDir: unitTests.workingDir,
      notes: 'unitTests.enabled=true but command or workingDir is missing.',
    };
  }

  const resolvedWorkingDir = resolve(ROOT, unitTests.workingDir);
  if (!existsSync(resolvedWorkingDir)) {
    return {
      status: 'blocked',
      workingDir: resolvedWorkingDir,
      notes: `Configured unit test working directory does not exist: ${resolvedWorkingDir}`,
    };
  }

  const result = spawnSync(unitTests.command, {
    cwd: resolvedWorkingDir,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status === 0) {
    return {
      status: 'passed',
      workingDir: resolvedWorkingDir,
      notes: 'Configured unit test command passed.',
      exitCode: 0,
    };
  }

  return {
    status: 'failed',
    workingDir: resolvedWorkingDir,
    notes: `Configured unit test command failed with exit code ${result.status ?? 1}.`,
    exitCode: result.status ?? 1,
  };
}

async function main(): Promise<void> {
  const cli = parseCli();
  const parsedCommand = parseQCCommand(cli.rawText || `run ${cli.projectKey || ''} qc`);

  console.log('QC Runner');
  console.log('=========');

  if (!cli.projectKey) {
    console.log('No project key detected.');
    console.log('Usage: npm run qc -- --project <project-key>');
    console.log('   or: "按照 AGENTS.md 的规范，执行 hiring QC。"');
    process.exit(1);
  }

  if (!projectExists(cli.projectKey, ROOT)) {
    console.log(`Project '${cli.projectKey}' does not exist.`);
    console.log(`Create it with: npm run create:project -- --project ${cli.projectKey}`);
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(cli.projectKey, cli.env, ROOT);
  const authConfig = resolveAuthConfig(cli.projectKey, cli.env, discovery.config.auth, ROOT);
  const authStatus = checkAuthState(authConfig, ROOT);
  const bootstrap = prepareAuthBootstrap(cli.projectKey, authConfig, ROOT);
  const contextPaths = resolveContextPaths(cli.projectKey, ROOT);
  const existingContext = contextPaths.filter((contextPath) => existsSync(contextPath));
  const reviewedDir = resolveReviewedTestPlanDir(cli.projectKey, ROOT);
  const reviewedTestPlans = existsSync(reviewedDir)
    ? readdirSync(reviewedDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
        .map((entry) => resolve(reviewedDir, entry.name))
    : [];
  const selectedTags = selectTags(cli.release, cli.env, discovery.config.tests);
  const testsDir = resolveTestsDir(cli.projectKey, ROOT);
  const grepExpression = buildTagExpression(selectedTags);
  const qcCommand = [
    'npx',
    'playwright',
    'test',
    testsDir,
    ...(grepExpression ? ['--grep', grepExpression] : []),
  ];

  const contract = validateAiTaskContract({
    intent: parsedCommand.intent === 'generate_test_plan' ? 'generate-test-plan' : 'run-qc',
    requestSummary: cli.rawText || `Run QC for ${cli.projectKey}`,
    environment: cli.env,
    projectKey: cli.projectKey,
    projectExists: true,
    contextFilesPresent: existingContext.length,
    contextFilesRequired: contextPaths.length,
    reviewedTestPlanExists: reviewedTestPlans.length > 0,
    allowTemporaryExploratoryTests: parsedCommand.allowTemporaryExploratoryTests,
    requiresAuth: authConfig.mode !== 'preseeded' || authStatus.exists,
    authStateValid: authStatus.valid,
  });

  console.log(formatProjectConfigDiscovery(discovery));
  console.log('');
  console.log(`Detected Intent: ${parsedCommand.intent}`);
  console.log(`Project Key: ${cli.projectKey}`);
  console.log(`Environment: ${cli.env}`);
  console.log(`Reviewed Test Plans: ${reviewedTestPlans.length}`);
  console.log(`Auth Status: ${authStatus.valid ? 'ready' : authStatus.reason}`);
  console.log(`Local Secret Config: ${authConfig.localConfigExists ? 'configured' : 'not configured'}`);
  console.log(
    `Unit Test Gate: ${discovery.config.unitTests.enabled ? 'enabled' : 'not configured'}`
  );
  console.log(`AI Task State: ${contract.workflowState}`);
  console.log('');

  const report = createQCReport(cli.projectKey, cli.env);
  report.request = cli.rawText || `按照 AGENTS.md 的规范，执行 ${cli.projectKey} QC。`;
  report.summary = 'QC framework prepared the governed execution context for this request.';
  report.scope = cli.release ? 'Release-oriented QC selection.' : 'Standard governed QC selection.';
  report.contextRead = existingContext.map((path) => getContextLabelFromPath(path));
  report.impactAnalysis =
    reviewedTestPlans.length > 0
      ? 'Reviewed test plan exists. Runner may execute the mapped test set.'
      : 'No reviewed test plan detected. Long-term executable generation remains blocked.';
  report.testPlanUsed = reviewedTestPlans[0] || 'No reviewed test plan found.';
  report.unitTestGate = {
    enabled: discovery.config.unitTests.enabled,
    requiredToProceed: discovery.config.unitTests.requiredToProceed,
    status: discovery.config.unitTests.enabled ? 'skipped' : 'not_configured',
    command: discovery.config.unitTests.command,
    workingDir: discovery.config.unitTests.workingDir,
    notes: discovery.config.unitTests.enabled
      ? 'Unit test gate is configured and pending execution.'
      : 'Project config did not enable unit test precheck.',
  };
  report.testsSelected = countSelectedTests(selectedTags);
  report.testsGenerated = {};
  report.testsExecuted = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
  report.risks = [];
  report.healingSuggestions = [];
  report.externalSystems = [];
  report.failures = [];
  report.nextSteps =
    reviewedTestPlans.length > 0
      ? 'Run the selected tests or refine selection with a reviewed plan update.'
      : 'Generate and review a test plan before long-term test generation or execution.';

  if (!authStatus.valid) {
    report.risks.push(`Auth state not ready: ${authStatus.reason}`);
  }

  if (reviewedTestPlans.length === 0) {
    report.risks.push('No reviewed test plan exists yet.');
  }

  if (isProductionSmoke(cli.env)) {
    report.risks.push('production-smoke is readonly only. Only @readonly @smoke tags are permitted.');
  }

  const auditTrail = createAuditTrail('run-qc.ts');
  addToAuditTrail(
    auditTrail,
    createAuditEntry(
      'qc_request_analyzed',
      'runner',
      `Prepared QC request for ${cli.projectKey} with tags ${selectedTags.join(', ') || '(none)'}.`,
      'success',
      cli.projectKey
    )
  );
  if (!authStatus.valid) {
    addToAuditTrail(
      auditTrail,
      createAuditEntry(
        'production_guard_check',
        'governance',
        bootstrap.message,
        'warning',
        cli.projectKey
      )
    );
  }
  report.auditTrail = auditTrail;

  if (discovery.config.unitTests.enabled) {
    console.log('Unit Test Precheck:');
    console.log(`  Command: ${discovery.config.unitTests.command || '(not configured)'}`);
    console.log(`  Working Dir: ${discovery.config.unitTests.workingDir || '(not configured)'}`);
    console.log('');

    const unitTestGate = runUnitTestGate(discovery.config.unitTests);
    report.unitTestGate = {
      enabled: discovery.config.unitTests.enabled,
      requiredToProceed: discovery.config.unitTests.requiredToProceed,
      status: unitTestGate.status,
      command: discovery.config.unitTests.command,
      workingDir: unitTestGate.workingDir || discovery.config.unitTests.workingDir,
      notes: unitTestGate.notes,
    };

    addToAuditTrail(
      auditTrail,
      createAuditEntry(
        'unit_test_precheck',
        'runner',
        `${unitTestGate.status}: ${unitTestGate.notes}`,
        unitTestGate.status === 'passed' ? 'success' : 'warning',
        cli.projectKey
      )
    );

    if (
      (unitTestGate.status === 'failed' || unitTestGate.status === 'blocked') &&
      discovery.config.unitTests.requiredToProceed
    ) {
      report.summary =
        'QC stopped at the unit test gate because the configured upstream unit tests did not pass.';
      report.risks.push(`Unit test gate ${unitTestGate.status}: ${unitTestGate.notes}`);
      report.nextSteps =
        'Fix or rerun the upstream unit tests first. QC execution remains blocked until the unit test gate passes.';

      console.log(`Unit test gate ${unitTestGate.status}. QC will not continue.`);
      console.log('');

      const blockedReportPath = writeReport(cli.projectKey, formatQCReport(report));
      console.log(`QC report written to: ${blockedReportPath}`);
      process.exit(unitTestGate.exitCode ?? 1);
    }
  }

  if (!authStatus.valid && cli.bootstrapAuth && bootstrap.needsBootstrap) {
    await bootstrapAuth(authConfig);
  }

  console.log('Context Check:');
  for (const contextPath of contextPaths) {
    console.log(`  ${existsSync(contextPath) ? '✅' : '⚠️'} ${getContextLabelFromPath(contextPath)}`);
  }
  console.log('');
  console.log('Selected Playwright Command:');
  console.log(`  ${qcCommand.join(' ')}`);
  console.log('');

  if (reviewedTestPlans.length === 0) {
    console.log('No reviewed test plan found. QC execution stops at governed preparation.');
  } else {
    console.log('Reviewed test plan found. Framework is ready to execute the selected test set.');
  }

  if (report.failures.length > 0) {
    for (const failure of report.failures) {
      report.risks.push(FAILURE_CATEGORIES[failure.category].description);
    }
  }

  const reportPath = writeReport(cli.projectKey, formatQCReport(report));
  console.log('');
  console.log(`QC report written to: ${reportPath}`);
}

await main();
