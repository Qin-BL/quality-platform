import type { QCFailureEntry } from './qc-report';

export interface FailureSummary {
  byCategory: Record<string, number>;
  byTest: QCFailureEntry[];
}

export function summarizeFailures(failures: QCFailureEntry[]): FailureSummary {
  const byCategory: Record<string, number> = {};

  for (const f of failures) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
  }

  return {
    byCategory,
    byTest: failures,
  };
}

export function formatFailureSummary(summary: FailureSummary): string {
  const lines: string[] = ['## Failure Category Breakdown', ''];

  if (Object.keys(summary.byCategory).length === 0) {
    lines.push('_(No failures to summarize)_');
    return lines.join('\n');
  }

  for (const [category, count] of Object.entries(summary.byCategory)) {
    lines.push(`- **${category}**: ${count}`);
  }

  lines.push('');
  lines.push('## Detailed Failures');

  for (const f of summary.byTest) {
    lines.push(`- **${f.testName}** (${f.category})`);
    lines.push(`  - Root cause: ${f.rootCause}`);
    lines.push(`  - Action: ${f.action}`);
  }

  return lines.join('\n');
}