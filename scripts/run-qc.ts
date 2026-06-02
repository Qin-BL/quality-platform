import { existsSync, readdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { config as dotenvConfig } from 'dotenv';
import { validateAiTaskContract } from '../packages/ai/ai-task-contract';
import {
  createMissingInput,
  createMissingInputState,
  formatMissingInputQuestions,
  writeMissingInputState,
  type MissingInput,
} from '../packages/ai/missing-inputs';
import { createAuditEntry, createAuditTrail, addToAuditTrail } from '../packages/reporting/audit-log';
import { prepareAuthBootstrap, bootstrapAuth } from '../packages/auth/auth-bootstrap';
import { resolveAuthConfig, validateAuthConfig } from '../packages/auth/auth-config';
import { checkAuthState } from '../packages/auth/auth-state';
import { isProductionSmoke } from '../packages/auth/auth-guards';
import { buildTagExpression } from '../packages/core/test-tags';
import { FAILURE_CATEGORIES } from '../packages/healing/failure-classifier';
import { runProjectOrchestration } from '../packages/fixtures/environment-orchestration';
import { createMCPExplorationRun, writeMCPExplorationManifest } from '../packages/mcp/runtime';
import { createQCReport, formatQCReport } from '../packages/reporting/qc-report';
import {
  discoverProjectConfig,
  formatProjectConfigDiscovery,
} from '../packages/project/project-config-loader';
import { buildAppMapCoverageSummary } from '../packages/project/app-map';
import {
  detectProjectKeyFromText,
  getContextLabelFromPath,
  projectExists,
  resolveContextPaths,
  resolveReviewedTestPlanDir,
  resolveTestsDir,
} from '../packages/project/project-discovery';
import { parseQCCommand } from '../packages/project/qc-command-parser';
import type { ProjectUnitTestGateConfig } from '../packages/project/project-config';
import {
  formatCoverageMetric,
  runUnitTestCoverageGate,
} from '../packages/project/unit-test-coverage';

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
    bootstrapAuth: bootstrap || /auth\s+bootstrap|\u672c\u5730 auth bootstrap/i.test(rawText),
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

function printMissingInputBlock(missingInputs: MissingInput[], statePath: string): void {
  console.log('Missing Required Inputs:');
  for (const line of formatMissingInputQuestions(missingInputs)) {
    console.log(`  ${line}`);
  }
  console.log(`Resume state written to: ${statePath}`);
}

function runUnitTestGate(gate: ProjectUnitTestGateConfig): {
  status: 'not_configured' | 'skipped' | 'passed' | 'failed' | 'blocked';
  workingDir: string;
  notes: string;
  exitCode?: number;
} {
  if (!gate.command || !gate.workingDir) {
    return {
      status: 'blocked',
      workingDir: gate.workingDir,
      notes: `Gate "${gate.name}" is missing command or workingDir.`,
    };
  }

  const resolvedWorkingDir = resolve(ROOT, gate.workingDir);
  if (!existsSync(resolvedWorkingDir)) {
    return {
      status: 'blocked',
      workingDir: resolvedWorkingDir,
      notes: `Gate "${gate.name}" working directory does not exist: ${resolvedWorkingDir}`,
    };
  }

  const result = spawnSync(gate.command, {
    cwd: resolvedWorkingDir,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status === 0) {
    return {
      status: 'passed',
      workingDir: resolvedWorkingDir,
      notes: `Gate "${gate.name}" passed.`,
      exitCode: 0,
    };
  }

  return {
    status: 'failed',
    workingDir: resolvedWorkingDir,
    notes: `Gate "${gate.name}" failed with exit code ${result.status ?? 1}.`,
    exitCode: result.status ?? 1,
  };
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
  const cli = parseCli();
  const parsedCommand = parseQCCommand(cli.rawText || `run ${cli.projectKey || ''} qc`);

  console.log('QC Runner');
  console.log('=========');

  if (!cli.projectKey) {
    const blockedState = createMissingInputState(
      parsedCommand.intent,
      cli.env,
      cli.rawText,
      'project-key-detection',
      [
        createMissingInput(
          'project_key',
          'Which project key should be used for this QC run?',
          'The request did not include a detectable project key.',
          'project-config-discovery',
          {
            label: 'Project key',
            suggestedSources: ['projects/<project-key>', 'PROJECT_KEY', 'user request text'],
          }
        ),
      ]
    );
    const statePath = writeMissingInputState(blockedState, ROOT);
    console.log('No project key detected.');
    console.log('Usage: npm run qc -- --project <project-key>');
    console.log('   or: "Run hiring QC according to AGENTS.md."');
    printMissingInputBlock(blockedState.missingInputs, statePath);
    process.exit(1);
  }

  if (!projectExists(cli.projectKey, ROOT)) {
    const blockedState = createMissingInputState(
      parsedCommand.intent,
      cli.env,
      cli.rawText,
      'project-space-check',
      [
        createMissingInput(
          'project_space',
          `Project '${cli.projectKey}' does not exist yet. Should the framework create the project space now?`,
          `No project directory was found for '${cli.projectKey}'.`,
          'project-space-create',
          {
            label: 'Project space',
            suggestedSources: ['npm run create:project -- --project <project-key>'],
          }
        ),
      ],
      cli.projectKey
    );
    const statePath = writeMissingInputState(blockedState, ROOT);
    console.log(`Project '${cli.projectKey}' does not exist.`);
    console.log(`Create it with: npm run create:project -- --project ${cli.projectKey}`);
    printMissingInputBlock(blockedState.missingInputs, statePath);
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
  const configuredUnitTestGates = getConfiguredUnitTestGates(discovery.config.unitTests);
  const authValidation = validateAuthConfig(authConfig);
  const orchestrationResult = await runProjectOrchestration(
    discovery.config.orchestration,
    ROOT
  );
  const appMapCoverage = buildAppMapCoverageSummary(
    discovery.config.appMap,
    discovery.config.tests.testDir,
    discovery.config.context.testPlansReviewedDir,
    ROOT
  );
  const mcpRun = discovery.config.mcp.enabled
    ? createMCPExplorationRun(
        cli.projectKey,
        cli.env,
        cli.rawText || `Run ${cli.projectKey} QC according to AGENTS.md.`,
        discovery.config.mcp,
        ROOT
      )
    : null;
  const testsDir = resolveTestsDir(cli.projectKey, ROOT);
  const grepExpression = buildTagExpression(selectedTags);
  const qcCommand = [
    'npx',
    'playwright',
    'test',
    testsDir,
    ...(grepExpression ? ['--grep', grepExpression] : []),
  ];
  const mcpManifestPath = mcpRun ? writeMCPExplorationManifest(mcpRun) : '';

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
    `Unit Test Gates: ${configuredUnitTestGates.length > 0 ? configuredUnitTestGates.length : 0}`
  );
  console.log(`Environment Orchestration: ${orchestrationResult.enabled ? orchestrationResult.status : 'not configured'}`);
  console.log(
    `App Map Coverage: ${appMapCoverage.enabled ? `${appMapCoverage.coveredModules}/${appMapCoverage.totalModules}` : 'not configured'}`
  );
  console.log(`MCP Runtime: ${mcpRun ? `prepared (${mcpManifestPath})` : 'not configured'}`);
  console.log(`AI Task State: ${contract.workflowState}`);
  console.log('');

  const report = createQCReport(cli.projectKey, cli.env);
  report.request = cli.rawText || `Run ${cli.projectKey} QC according to AGENTS.md.`;
  report.summary = 'QC framework prepared the governed execution context for this request.';
  report.scope = cli.release ? 'Release-oriented QC selection.' : 'Standard governed QC selection.';
  report.contextRead = existingContext.map((path) => getContextLabelFromPath(path));
  report.impactAnalysis =
    reviewedTestPlans.length > 0
      ? 'Reviewed test plan exists. Runner may execute the mapped test set.'
      : 'No reviewed test plan detected. Long-term executable generation remains blocked.';
  report.testPlanUsed = reviewedTestPlans[0] || 'No reviewed test plan found.';
  report.unitTestGates = configuredUnitTestGates.length
    ? configuredUnitTestGates.map((gate) => ({
        name: gate.name,
        enabled: true,
        requiredToProceed: discovery.config.unitTests.requiredToProceed,
        status: 'skipped',
        command: gate.command,
        workingDir: gate.workingDir,
        notes: 'Unit test gate is configured and pending execution.',
        coverage: gate.coverage?.enabled
          ? {
              enabled: true,
              requiredToProceed: gate.coverage.requiredToProceed ?? false,
              status: 'skipped',
              format: gate.coverage.format,
              command: gate.coverage.command,
              workingDir: gate.coverage.workingDir ?? gate.workingDir,
              reportPath: gate.coverage.reportPath,
              notes: 'Unit test coverage is configured and pending execution.',
              totals: {},
              modules: [],
              violations: [],
            }
          : undefined,
      }))
    : [
        {
          name: 'default',
          enabled: false,
          requiredToProceed: discovery.config.unitTests.requiredToProceed,
          status: 'not_configured',
          command: '',
          workingDir: '',
          notes: 'Project config did not enable unit test precheck.',
        },
      ];
  report.testsSelected = countSelectedTests(selectedTags);
  report.testsGenerated = {};
  report.testsExecuted = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
  report.appCoverage = {
    enabled: appMapCoverage.enabled,
    totalModules: appMapCoverage.totalModules,
    coveredModules: appMapCoverage.coveredModules,
    uncoveredModules: appMapCoverage.uncoveredModules,
    modules: appMapCoverage.modules.map((module) => ({
      key: module.key,
      displayName: module.displayName,
      kind: module.kind,
      critical: module.critical,
      covered: module.covered,
      matchingTests: module.matchingTests.length,
      matchingPlans: module.matchingPlans.length,
    })),
  };
  report.orchestration = {
    enabled: orchestrationResult.enabled,
    status: orchestrationResult.status,
    environmentChecks: orchestrationResult.environmentChecks,
    dataDependencies: orchestrationResult.dataDependencies,
  };
  report.mcpRun = {
    enabled: Boolean(mcpRun),
    status: mcpRun ? mcpRun.status : 'skipped',
    manifestPath: mcpManifestPath,
    artifactDir: mcpRun?.artifactDir || '',
    sessionName: mcpRun?.sessionName || '',
  };
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

  for (const issue of authValidation.issues) {
    report.risks.push(issue);
  }

  if (reviewedTestPlans.length === 0) {
    report.risks.push('No reviewed test plan exists yet.');
  }

  if (isProductionSmoke(cli.env)) {
    report.risks.push('production-smoke is readonly only. Only @readonly @smoke tags are permitted.');
  }

  if (orchestrationResult.status === 'failed') {
    report.risks.push('Environment orchestration detected missing readiness checks or data dependencies.');
  }

  if (appMapCoverage.enabled && appMapCoverage.uncoveredModules > 0) {
    report.risks.push(
      `${appMapCoverage.uncoveredModules} app-map module(s) have no detected test or reviewed-plan coverage.`
    );
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

  const missingInputs: MissingInput[] = [];

  if (existingContext.length === 0) {
    missingInputs.push(
      createMissingInput(
        'context',
        `Which context files or product notes should be used for project '${cli.projectKey}'?`,
        'No project context files were detected.',
        'context-read',
        {
          label: 'Project context',
          suggestedSources: contextPaths,
        }
      )
    );
  }

  if (
    discovery.config.safety.requireReviewedTestPlan &&
    reviewedTestPlans.length === 0
  ) {
    missingInputs.push(
      createMissingInput(
        'reviewed_test_plan',
        `Which reviewed test plan should govern QC for project '${cli.projectKey}'?`,
        'No reviewed test plan was found for a workflow that requires reviewed governance.',
        'reviewed-test-plan-check',
        {
          label: 'Reviewed test plan',
          suggestedSources: [reviewedDir],
        }
      )
    );
  }

  for (const issue of authValidation.issues) {
    if (issue.includes('loginUrl is not configured')) {
      missingInputs.push(
        createMissingInput(
          'auth_login_url',
          `What login URL should auth bootstrap use for project '${cli.projectKey}' in ${cli.env}?`,
          issue,
          'auth-config-resolution',
          {
            label: 'Auth login URL',
            suggestedSources: ['project config', '.env', authConfig.localConfigPath],
          }
        )
      );
    }
    if (issue.includes('TEST_USER_EMAIL') || issue.includes('TEST_USER_PASSWORD')) {
      missingInputs.push(
        createMissingInput(
          'auth_credentials',
          `Which local auth credentials should be stored for project '${cli.projectKey}' in ${cli.env}?`,
          issue,
          'auth-bootstrap',
          {
            label: 'Local auth credentials',
            sensitive: true,
            suggestedSources: [authConfig.localConfigPath],
          }
        )
      );
    }
  }

  if (orchestrationResult.status === 'failed') {
    const failingDependency = orchestrationResult.dataDependencies.find(
      (dependency) => dependency.status === 'missing' || dependency.status === 'failed'
    );
    if (failingDependency) {
      missingInputs.push(
        createMissingInput(
          'test_data',
          `What test data or provisioning command should satisfy '${failingDependency.name}' for project '${cli.projectKey}'?`,
          failingDependency.detail,
          'test-data-orchestration',
          {
            label: 'Test data dependency',
          }
        )
      );
    }
  }

  if (missingInputs.length > 0) {
    const blockedState = createMissingInputState(
      parsedCommand.intent,
      cli.env,
      cli.rawText,
      missingInputs[0].resumeStep,
      missingInputs,
      cli.projectKey
    );
    const statePath = writeMissingInputState(blockedState, ROOT);
    report.blockedState = blockedState;
    report.summary =
      'QC paused because required configuration or governed inputs are missing.';
    report.nextSteps =
      'Provide the missing inputs, keep them in local ignored files when sensitive, and resume the same QC request.';

    console.log('QC cannot continue yet because required inputs are missing.');
    printMissingInputBlock(missingInputs, statePath);
    console.log('');

    const blockedReportPath = writeReport(cli.projectKey, formatQCReport(report));
    console.log(`QC report written to: ${blockedReportPath}`);
    process.exit(1);
  }

  if (configuredUnitTestGates.length > 0) {
    console.log('Unit Test Precheck:');
    for (const gate of configuredUnitTestGates) {
      console.log(`  - ${gate.name}`);
      console.log(`    Command: ${gate.command || '(not configured)'}`);
      console.log(`    Working Dir: ${gate.workingDir || '(not configured)'}`);
      if (gate.coverage?.enabled) {
        console.log(`    Coverage Command: ${gate.coverage.command}`);
        console.log(`    Coverage Report: ${gate.coverage.reportPath}`);
      }
    }
    console.log('');

    let blockingExitCode: number | undefined;

    report.unitTestGates = configuredUnitTestGates.map((gate) => {
      const gateResult = runUnitTestGate(gate);

      addToAuditTrail(
        auditTrail,
        createAuditEntry(
          'unit_test_precheck',
          'runner',
          `${gate.name}: ${gateResult.status}: ${gateResult.notes}`,
          gateResult.status === 'passed' ? 'success' : 'warning',
          cli.projectKey
        )
      );

      if (
        (gateResult.status === 'failed' || gateResult.status === 'blocked') &&
        discovery.config.unitTests.requiredToProceed &&
        blockingExitCode === undefined
      ) {
        blockingExitCode = gateResult.exitCode ?? 1;
      }

      let coverage:
        | {
            enabled: true;
            requiredToProceed: boolean;
            status: 'not_configured' | 'skipped' | 'passed' | 'failed' | 'blocked';
            format: string;
            command: string;
            workingDir: string;
            reportPath: string;
            notes: string;
            totals: {
              lines?: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
              statements?: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
              functions?: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
              branches?: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
            };
            modules: Array<{
              name: string;
              fileCount: number;
              lines: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
              statements?: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
              functions?: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
              branches?: {
                covered: number;
                total: number;
                pct: number;
                threshold?: number;
                meetsThreshold?: boolean;
              };
            }>;
            violations: string[];
          }
        | undefined;

      if (gate.coverage?.enabled) {
        if (gateResult.status === 'passed') {
          const coverageResult = runUnitTestCoverageGate(gate, ROOT);
          coverage = {
            enabled: true,
            requiredToProceed: coverageResult.requiredToProceed,
            status: coverageResult.status,
            format: gate.coverage.format,
            command: coverageResult.command,
            workingDir: coverageResult.workingDir,
            reportPath: coverageResult.reportPath,
            notes: coverageResult.notes,
            totals: coverageResult.summary?.totals ?? {},
            modules: coverageResult.summary?.modules ?? [],
            violations: coverageResult.summary?.violations ?? [],
          };

          console.log(`Coverage Check: ${gate.name}`);
          console.log(`  Status: ${coverageResult.status}`);
          console.log(`  Report: ${coverageResult.reportPath}`);
          console.log(
            `  Lines: ${formatCoverageMetric(coverageResult.summary?.totals.lines)}`
          );
          if (coverageResult.summary?.violations.length) {
            for (const violation of coverageResult.summary.violations) {
              console.log(`  Violation: ${violation}`);
            }
          }
          console.log('');

          addToAuditTrail(
            auditTrail,
            createAuditEntry(
              'unit_test_coverage',
              'runner',
              `${gate.name}: ${coverageResult.status}: ${coverageResult.notes}`,
              coverageResult.status === 'passed' ? 'success' : 'warning',
              cli.projectKey
            )
          );

          if (
            (coverageResult.status === 'failed' || coverageResult.status === 'blocked') &&
            coverageResult.requiredToProceed &&
            blockingExitCode === undefined
          ) {
            blockingExitCode = coverageResult.exitCode ?? 1;
          }
        } else {
          coverage = {
            enabled: true,
            requiredToProceed: gate.coverage.requiredToProceed ?? false,
            status: 'skipped',
            format: gate.coverage.format,
            command: gate.coverage.command,
            workingDir: gate.coverage.workingDir ?? gate.workingDir,
            reportPath: gate.coverage.reportPath,
            notes: 'Coverage check skipped because the unit test gate did not pass.',
            totals: {},
            modules: [],
            violations: [],
          };
        }
      }

      return {
        name: gate.name,
        enabled: true,
        requiredToProceed: discovery.config.unitTests.requiredToProceed,
        status: gateResult.status,
        command: gate.command,
        workingDir: gateResult.workingDir || gate.workingDir,
        notes: gateResult.notes,
        coverage,
      };
    });

    if (blockingExitCode !== undefined) {
      report.summary =
        'QC stopped at the unit test gate because one or more configured upstream unit test gates did not pass.';
      for (const gate of report.unitTestGates) {
        if (gate.status === 'failed' || gate.status === 'blocked') {
          report.risks.push(`Unit test gate ${gate.name} ${gate.status}: ${gate.notes}`);
        }
        if (
          gate.coverage &&
          (gate.coverage.status === 'failed' || gate.coverage.status === 'blocked')
        ) {
          report.risks.push(
            `Unit test coverage ${gate.name} ${gate.coverage.status}: ${gate.coverage.notes}`
          );
        }
      }
      report.nextSteps =
        'Fix or rerun the upstream unit tests and required coverage checks first. QC execution remains blocked until every required gate passes.';

      console.log('At least one required unit test gate failed or is blocked. QC will not continue.');
      console.log('');

      const blockedReportPath = writeReport(cli.projectKey, formatQCReport(report));
      console.log(`QC report written to: ${blockedReportPath}`);
      process.exit(blockingExitCode);
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
