import type { HealingSuggestion } from '../healing/healing-suggestion';
import type { AuditTrail } from './audit-log';

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

export interface QCFailureEntry {
  testName: string;
  category:
    | 'product_bug'
    | 'test_bug'
    | 'environment_issue'
    | 'flaky'
    | 'data_issue'
    | 'external_dependency'
    | 'unknown';
  rootCause: string;
  action: string;
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
  testsSelected: QCSelectedTests;
  testsGenerated: Record<string, number>;
  testsExecuted: QCTestSummary;
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
    testsSelected: { smoke: 0, e2e: 0, api: 0, external: 0, visual: 0 },
    testsGenerated: {},
    testsExecuted: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
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
