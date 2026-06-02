import type { HealingSuggestion } from '../healing/healing-suggestion';
import type { AuditTrail } from './audit-log';
import type { MissingInputState } from '../ai/missing-inputs';

export interface QCTestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface QCSelectedTests {
  smoke: number;
  e2e: number;
  api: number;
  external: number;
  visual: number;
}

export interface QCExternalSystemEntry {
  system: string;
  checked: boolean;
  passed: boolean;
  notes: string;
}

export interface QCAppMapCoverageEntry {
  key: string;
  displayName: string;
  kind: string;
  critical: boolean;
  covered: boolean;
  matchingTests: number;
  matchingPlans: number;
}

export interface QCOrchestrationEntry {
  enabled: boolean;
  status: 'skipped' | 'passed' | 'failed';
  environmentChecks: Array<{
    name: string;
    kind: string;
    status: 'passed' | 'failed' | 'blocked';
    detail: string;
  }>;
  dataDependencies: Array<{
    name: string;
    status: 'present' | 'missing' | 'provisioned' | 'failed';
    detail: string;
  }>;
}

export interface QCMCPEntry {
  enabled: boolean;
  status: 'prepared' | 'running' | 'completed' | 'skipped';
  manifestPath: string;
  artifactDir: string;
  sessionName: string;
}

export interface QCFailureEntry {
  testName: string;
  category:
    | 'product_bug'
    | 'test_bug'
    | 'environment_issue'
    | 'auth_issue'
    | 'selector_drift'
    | 'unit_regression'
    | 'flaky'
    | 'data_issue'
    | 'external_dependency'
    | 'unknown';
  rootCause: string;
  action: string;
}

export interface QCUnitTestGate {
  name: string;
  enabled: boolean;
  requiredToProceed: boolean;
  status: 'not_configured' | 'skipped' | 'passed' | 'failed' | 'blocked';
  command: string;
  workingDir: string;
  notes: string;
  coverage?: {
    enabled: boolean;
    requiredToProceed: boolean;
    status: 'not_configured' | 'skipped' | 'passed' | 'failed' | 'blocked';
    format: string;
    command: string;
    workingDir: string;
    reportPath: string;
    notes: string;
    totals: {
      lines?: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
      statements?: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
      functions?: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
      branches?: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
    };
    modules: Array<{
      name: string;
      fileCount: number;
      lines: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
      statements?: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
      functions?: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
      branches?: { covered: number; total: number; pct: number; threshold?: number; meetsThreshold?: boolean };
    }>;
    violations: string[];
  };
}

export interface QCReport {
  projectKey: string;
  environment: string;
  date: string;
  summary: string;
  request: string;
  scope: string;
  contextRead: string[];
  impactAnalysis: string;
  testPlanUsed: string;
  unitTestGates: QCUnitTestGate[];
  testsSelected: QCSelectedTests;
  testsGenerated: Record<string, number>;
  testsExecuted: QCTestSummary;
  appCoverage: {
    enabled: boolean;
    totalModules: number;
    coveredModules: number;
    uncoveredModules: number;
    modules: QCAppMapCoverageEntry[];
  };
  orchestration: QCOrchestrationEntry;
  mcpRun: QCMCPEntry;
  blockedState?: MissingInputState;
  externalSystems: QCExternalSystemEntry[];
  failures: QCFailureEntry[];
  healingSuggestions: HealingSuggestion[];
  risks: string[];
  auditTrail: AuditTrail;
  nextSteps: string;
}

export function createQCReport(projectKey: string, environment: string): QCReport {
  return {
    projectKey,
    environment,
    date: new Date().toISOString(),
    summary: '',
    request: '',
    scope: '',
    contextRead: [],
    impactAnalysis: '',
    testPlanUsed: '',
    unitTestGates: [],
    testsSelected: { smoke: 0, e2e: 0, api: 0, external: 0, visual: 0 },
    testsGenerated: {},
    testsExecuted: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
    appCoverage: {
      enabled: false,
      totalModules: 0,
      coveredModules: 0,
      uncoveredModules: 0,
      modules: [],
    },
    orchestration: {
      enabled: false,
      status: 'skipped',
      environmentChecks: [],
      dataDependencies: [],
    },
    mcpRun: {
      enabled: false,
      status: 'skipped',
      manifestPath: '',
      artifactDir: '',
      sessionName: '',
    },
    externalSystems: [],
    failures: [],
    healingSuggestions: [],
    risks: [],
    auditTrail: {
      entries: [],
      generatedAt: new Date().toISOString(),
      generatedBy: 'quality-platform',
    },
    nextSteps: '',
  };
}

export function formatQCReport(report: QCReport): string {
  const lines: string[] = [
    `# QC Report — ${report.projectKey} — ${report.date}`,
    '',
    '## Summary',
    report.summary || '_(No summary provided)_',
    '',
    '## Request',
    report.request || '_(No request captured)_',
    '',
    '## Scope',
    report.scope || '_(No scope defined)_',
    '',
    '## Context Read',
  ];

  if (report.contextRead.length > 0) {
    for (const item of report.contextRead) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push('_(No context recorded)_');
  }

  lines.push('', '## Impact Analysis', report.impactAnalysis || '_(No impact analysis recorded)_');
  lines.push('', '## Test Plan Used', report.testPlanUsed || '_(No test plan referenced)_');
  lines.push('', '## Unit Test Gates');
  if (report.unitTestGates.length > 0) {
    lines.push('| Gate | Enabled | Required | Status | Working Dir | Command | Notes |');
    lines.push('|------|---------|----------|--------|-------------|---------|-------|');
    for (const gate of report.unitTestGates) {
      lines.push(
        `| ${gate.name} | ${gate.enabled ? 'Yes' : 'No'} | ${gate.requiredToProceed ? 'Yes' : 'No'} | ${gate.status} | ${gate.workingDir || '_(Not configured)_'} | ${gate.command || '_(Not configured)_'} | ${gate.notes || '_(No notes)_'} |`
      );
    }
  } else {
    lines.push('_(No unit test gates configured)_');
  }
  lines.push('', '## Unit Test Coverage');
  const coverageGates = report.unitTestGates.filter((gate) => gate.coverage?.enabled);
  if (coverageGates.length > 0) {
    for (const gate of coverageGates) {
      const coverage = gate.coverage!;
      lines.push(`### ${gate.name}`);
      lines.push(`- Status: ${coverage.status}`);
      lines.push(`- Required To Proceed: ${coverage.requiredToProceed ? 'Yes' : 'No'}`);
      lines.push(`- Format: ${coverage.format}`);
      lines.push(`- Working Dir: ${coverage.workingDir}`);
      lines.push(`- Report Path: ${coverage.reportPath}`);
      lines.push(`- Command: ${coverage.command}`);
      lines.push(`- Notes: ${coverage.notes}`);
      if (coverage.totals.lines) {
        lines.push(
          `- Lines: ${coverage.totals.lines.pct}% (${coverage.totals.lines.covered}/${coverage.totals.lines.total})`
        );
      }
      if (coverage.totals.statements) {
        lines.push(
          `- Statements: ${coverage.totals.statements.pct}% (${coverage.totals.statements.covered}/${coverage.totals.statements.total})`
        );
      }
      if (coverage.totals.functions) {
        lines.push(
          `- Functions: ${coverage.totals.functions.pct}% (${coverage.totals.functions.covered}/${coverage.totals.functions.total})`
        );
      }
      if (coverage.totals.branches) {
        lines.push(
          `- Branches: ${coverage.totals.branches.pct}% (${coverage.totals.branches.covered}/${coverage.totals.branches.total})`
        );
      }

      if (coverage.modules.length > 0) {
        lines.push('');
        lines.push('| Module | Files | Lines | Statements | Functions | Branches |');
        lines.push('|--------|-------|-------|------------|-----------|----------|');
        for (const module of coverage.modules) {
          lines.push(
            `| ${module.name} | ${module.fileCount} | ${module.lines.pct}% (${module.lines.covered}/${module.lines.total}) | ${module.statements ? `${module.statements.pct}% (${module.statements.covered}/${module.statements.total})` : 'n/a'} | ${module.functions ? `${module.functions.pct}% (${module.functions.covered}/${module.functions.total})` : 'n/a'} | ${module.branches ? `${module.branches.pct}% (${module.branches.covered}/${module.branches.total})` : 'n/a'} |`
          );
        }
      } else {
        lines.push('- No module coverage data was aggregated.');
      }

      if (coverage.violations.length > 0) {
        lines.push('');
        lines.push('Violations:');
        for (const violation of coverage.violations) {
          lines.push(`- ${violation}`);
        }
      }

      lines.push('');
    }
  } else {
    lines.push('_(No unit test coverage configured)_');
  }
  lines.push('', '## Tests Selected');
  lines.push(`- Smoke: ${report.testsSelected.smoke}`);
  lines.push(`- E2E: ${report.testsSelected.e2e}`);
  lines.push(`- API: ${report.testsSelected.api}`);
  lines.push(`- External: ${report.testsSelected.external}`);
  lines.push(`- Visual: ${report.testsSelected.visual}`);
  lines.push('', '## Tests Generated');

  if (Object.keys(report.testsGenerated).length > 0) {
    lines.push('| Category | Count |');
    lines.push('|----------|-------|');
    for (const [category, count] of Object.entries(report.testsGenerated)) {
      lines.push(`| ${category} | ${count} |`);
    }
  } else {
    lines.push('_(No tests generated)_');
  }

  const { total, passed, failed, skipped, duration } = report.testsExecuted;
  lines.push('', '## Tests Executed');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Passed | ${passed} |`);
  lines.push(`| Failed | ${failed} |`);
  lines.push(`| Skipped | ${skipped} |`);
  lines.push(`| Total | ${total} |`);
  lines.push(`| Duration | ${duration}ms |`);

  lines.push('', '## App Coverage');
  if (report.appCoverage.enabled) {
    lines.push(`- Covered Modules: ${report.appCoverage.coveredModules}/${report.appCoverage.totalModules}`);
    lines.push(`- Uncovered Modules: ${report.appCoverage.uncoveredModules}`);
    if (report.appCoverage.modules.length > 0) {
      lines.push('');
      lines.push('| Module | Kind | Critical | Covered | Matching Tests | Matching Plans |');
      lines.push('|--------|------|----------|---------|----------------|----------------|');
      for (const module of report.appCoverage.modules) {
        lines.push(
          `| ${module.displayName} | ${module.kind} | ${module.critical ? 'Yes' : 'No'} | ${module.covered ? 'Yes' : 'No'} | ${module.matchingTests} | ${module.matchingPlans} |`
        );
      }
    }
  } else {
    lines.push('_(App map coverage not configured)_');
  }

  lines.push('', '## Environment Orchestration');
  lines.push(`- Enabled: ${report.orchestration.enabled ? 'Yes' : 'No'}`);
  lines.push(`- Status: ${report.orchestration.status}`);
  if (report.orchestration.environmentChecks.length > 0) {
    lines.push('');
    lines.push('| Check | Kind | Status | Detail |');
    lines.push('|-------|------|--------|--------|');
    for (const check of report.orchestration.environmentChecks) {
      lines.push(`| ${check.name} | ${check.kind} | ${check.status} | ${check.detail} |`);
    }
  }
  if (report.orchestration.dataDependencies.length > 0) {
    lines.push('');
    lines.push('| Data Dependency | Status | Detail |');
    lines.push('|-----------------|--------|--------|');
    for (const dependency of report.orchestration.dataDependencies) {
      lines.push(`| ${dependency.name} | ${dependency.status} | ${dependency.detail} |`);
    }
  }

  lines.push('', '## MCP Exploration');
  lines.push(`- Enabled: ${report.mcpRun.enabled ? 'Yes' : 'No'}`);
  lines.push(`- Status: ${report.mcpRun.status}`);
  lines.push(`- Session Name: ${report.mcpRun.sessionName || '_(Not configured)_'}`);
  lines.push(`- Manifest Path: ${report.mcpRun.manifestPath || '_(Not generated)_'}`);
  lines.push(`- Artifact Dir: ${report.mcpRun.artifactDir || '_(Not generated)_'}`);

  lines.push('', '## Missing Inputs');
  if (report.blockedState) {
    lines.push(`- Task ID: ${report.blockedState.taskId}`);
    lines.push(`- Next Step: ${report.blockedState.nextStep}`);
    for (const item of report.blockedState.missingInputs) {
      lines.push(`- ${item.label}: ${item.reason}`);
      lines.push(`  Question: ${item.question}`);
    }
  } else {
    lines.push('_(No blocked input state recorded)_');
  }

  lines.push('', '## External Systems Verified');
  if (report.externalSystems.length > 0) {
    lines.push('| System | Checked | Passed | Notes |');
    lines.push('|--------|---------|--------|-------|');
    for (const entry of report.externalSystems) {
      lines.push(
        `| ${entry.system} | ${entry.checked ? 'Yes' : 'No'} | ${entry.passed ? 'Yes' : 'No'} | ${entry.notes} |`
      );
    }
  } else {
    lines.push('_(No external systems verified)_');
  }

  lines.push('', '## Failures');
  if (report.failures.length > 0) {
    lines.push('| Test | Category | Root Cause | Action |');
    lines.push('|------|----------|------------|--------|');
    for (const failure of report.failures) {
      lines.push(
        `| ${failure.testName} | ${failure.category} | ${failure.rootCause} | ${failure.action} |`
      );
    }
  } else {
    lines.push('_(No failures)_');
  }

  lines.push('', '## Healing Suggestions');
  if (report.healingSuggestions.length > 0) {
    lines.push('| Test | Fix Type | Risk | Human Approval | Suggestion |');
    lines.push('|------|----------|------|----------------|------------|');
    for (const suggestion of report.healingSuggestions) {
      lines.push(
        `| ${suggestion.testName} | ${suggestion.fixType} | ${suggestion.risk} | ${suggestion.requiresHumanApproval ? 'Yes' : 'No'} | ${suggestion.suggestion} |`
      );
    }
  } else {
    lines.push('_(No healing suggestions)_');
  }

  lines.push('', '## Risks');
  if (report.risks.length > 0) {
    for (const risk of report.risks) {
      lines.push(`- ${risk}`);
    }
  } else {
    lines.push('_(No risks identified)_');
  }

  lines.push('', '## Audit Trail');
  if (report.auditTrail.entries.length > 0) {
    lines.push('| Timestamp | Agent | Action | Status | Detail |');
    lines.push('|-----------|-------|--------|--------|--------|');
    for (const entry of report.auditTrail.entries) {
      lines.push(
        `| ${entry.timestamp} | ${entry.agent} | ${entry.action} | ${entry.status} | ${entry.detail} |`
      );
    }
  } else {
    lines.push('_(No audit entries)_');
  }

  lines.push('', '## Recommended Next Steps', report.nextSteps || '_(No recommendations)_');

  return lines.join('\n');
}
