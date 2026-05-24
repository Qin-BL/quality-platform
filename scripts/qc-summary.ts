import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';
import { createAuditTrail } from '../packages/reporting/audit-log';
import { createQCReport, formatQCReport } from '../packages/reporting/qc-report';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getArgValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    if (args[index] === `--${name}`) {
      return args[index + 1];
    }
    if (args[index].startsWith(`--${name}=`)) {
      return args[index].split('=')[1];
    }
  }
  return undefined;
}

function main(): void {
  const projectKey = getArgValue('project') || process.env.PROJECT_KEY || 'framework-only';
  const environment = process.env.TEST_ENV || 'local';
  const report = createQCReport(projectKey, environment);

  report.summary = 'Framework-generated QC report skeleton.';
  report.request = `QC summary requested for ${projectKey}.`;
  report.scope = 'Phase 1 framework verification only.';
  report.impactAnalysis = 'No business project execution was performed in this summary run.';
  report.testPlanUsed = 'N/A';
  report.risks = ['This report is a skeleton until a real project and reviewed test plan are connected.'];
  report.auditTrail = createAuditTrail('qc-summary.ts');
  report.nextSteps = 'Connect a project space, reviewed test plan, and executable tests.';

  const outputPath = resolve(
    ROOT,
    'reports',
    'qc',
    `${projectKey}-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
  );

  writeFileSync(outputPath, formatQCReport(report));

  console.log(`QC summary written to: ${outputPath}`);
}

main();
