import { existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, relative, resolve, sep } from 'path';
import { spawnSync } from 'child_process';
import type {
  ProjectUnitTestCoverageConfig,
  ProjectUnitTestCoverageFormat,
  ProjectUnitTestCoverageModuleGroupConfig,
  ProjectUnitTestGateConfig,
} from './project-config';

export interface UnitTestCoverageMetricSummary {
  covered: number;
  total: number;
  pct: number;
  threshold?: number;
  meetsThreshold?: boolean;
}

export interface UnitTestCoverageModuleSummary {
  name: string;
  fileCount: number;
  lines: UnitTestCoverageMetricSummary;
  statements?: UnitTestCoverageMetricSummary;
  functions?: UnitTestCoverageMetricSummary;
  branches?: UnitTestCoverageMetricSummary;
}

export interface UnitTestCoverageSummary {
  format: ProjectUnitTestCoverageFormat;
  reportPath: string;
  totals: {
    lines?: UnitTestCoverageMetricSummary;
    statements?: UnitTestCoverageMetricSummary;
    functions?: UnitTestCoverageMetricSummary;
    branches?: UnitTestCoverageMetricSummary;
  };
  modules: UnitTestCoverageModuleSummary[];
  violations: string[];
}

export interface UnitTestCoverageRunResult {
  status: 'not_configured' | 'skipped' | 'passed' | 'failed' | 'blocked';
  workingDir: string;
  reportPath: string;
  notes: string;
  command: string;
  requiredToProceed: boolean;
  summary?: UnitTestCoverageSummary;
  exitCode?: number;
}

interface CoverageAccumulator {
  fileCount: number;
  lines: { covered: number; total: number };
  statements?: { covered: number; total: number };
  functions?: { covered: number; total: number };
  branches?: { covered: number; total: number };
}

interface IstanbulMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface IstanbulSummaryFile {
  lines: IstanbulMetric;
  functions: IstanbulMetric;
  statements: IstanbulMetric;
  branches: IstanbulMetric;
}

type IstanbulSummary = Record<string, IstanbulSummaryFile | IstanbulSummaryTotals>;

interface IstanbulSummaryTotals {
  lines: IstanbulMetric;
  functions: IstanbulMetric;
  statements: IstanbulMetric;
  branches: IstanbulMetric;
  branchesTrue?: IstanbulMetric;
}

interface CoveragePyFileSummary {
  covered_lines: number;
  num_statements: number;
  percent_covered: number;
}

interface CoveragePyFileEntry {
  summary: CoveragePyFileSummary;
}

interface CoveragePyJson {
  files: Record<string, CoveragePyFileEntry>;
  totals: CoveragePyFileSummary;
}

function normalizeRelativePath(path: string): string {
  return path.split(sep).join('/');
}

function percent(covered: number, total: number): number {
  if (total <= 0) return 100;
  return Number(((covered / total) * 100).toFixed(2));
}

function applyThreshold(
  covered: number,
  total: number,
  threshold?: number
): UnitTestCoverageMetricSummary {
  const pct = percent(covered, total);
  return {
    covered,
    total,
    pct,
    threshold,
    meetsThreshold: threshold === undefined ? undefined : pct >= threshold,
  };
}

function getModuleName(
  filePath: string,
  moduleGroups: ProjectUnitTestCoverageModuleGroupConfig[]
): string | undefined {
  for (const group of moduleGroups) {
    const root = normalizeRelativePath(group.rootDir).replace(/\/$/, '');
    if (filePath !== root && !filePath.startsWith(`${root}/`)) {
      continue;
    }

    const remainder = filePath === root ? '' : filePath.slice(root.length + 1);
    const segments = remainder ? remainder.split('/') : [];
    const segmentCount = group.segmentCount ?? 1;
    const label = group.label ?? root;
    const rootAlias = group.includeRootFilesAs ?? '(root)';

    if (segments.length <= 1) {
      return `${label}/${rootAlias}`;
    }

    const modulePath = segments.slice(0, Math.min(segmentCount, segments.length - 1)).join('/');
    return modulePath ? `${label}/${modulePath}` : `${label}/${rootAlias}`;
  }

  return undefined;
}

function getCoverageConfig(
  gate: ProjectUnitTestGateConfig
): ProjectUnitTestCoverageConfig | undefined {
  return gate.coverage?.enabled ? gate.coverage : undefined;
}

function buildIstanbulSummary(
  reportPath: string,
  workingDir: string,
  coverageConfig: ProjectUnitTestCoverageConfig
): UnitTestCoverageSummary {
  const raw = readFileSync(reportPath, 'utf8');
  const summary = JSON.parse(raw) as IstanbulSummary;
  const totalsEntry = summary.total as IstanbulSummaryTotals;
  const moduleMap = new Map<string, CoverageAccumulator>();

  for (const [filePath, fileMetrics] of Object.entries(summary)) {
    if (filePath === 'total') {
      continue;
    }

    const relativePath = normalizeRelativePath(relative(workingDir, filePath));
    const moduleName = getModuleName(relativePath, coverageConfig.moduleGroups);
    if (!moduleName) {
      continue;
    }

    const typedMetrics = fileMetrics as IstanbulSummaryFile;
    const accumulator = moduleMap.get(moduleName) ?? {
      fileCount: 0,
      lines: { covered: 0, total: 0 },
      statements: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
    };

    accumulator.fileCount += 1;
    accumulator.lines.covered += typedMetrics.lines.covered;
    accumulator.lines.total += typedMetrics.lines.total;
    accumulator.statements!.covered += typedMetrics.statements.covered;
    accumulator.statements!.total += typedMetrics.statements.total;
    accumulator.functions!.covered += typedMetrics.functions.covered;
    accumulator.functions!.total += typedMetrics.functions.total;
    accumulator.branches!.covered += typedMetrics.branches.covered;
    accumulator.branches!.total += typedMetrics.branches.total;
    moduleMap.set(moduleName, accumulator);
  }

  const moduleThreshold = coverageConfig.minimumModuleLineCoverage;
  const thresholds = coverageConfig.thresholds;
  const violations: string[] = [];
  const modules = [...moduleMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, accumulator]) => {
      const moduleSummary: UnitTestCoverageModuleSummary = {
        name,
        fileCount: accumulator.fileCount,
        lines: applyThreshold(accumulator.lines.covered, accumulator.lines.total, moduleThreshold),
        statements: applyThreshold(
          accumulator.statements?.covered ?? 0,
          accumulator.statements?.total ?? 0
        ),
        functions: applyThreshold(
          accumulator.functions?.covered ?? 0,
          accumulator.functions?.total ?? 0
        ),
        branches: applyThreshold(
          accumulator.branches?.covered ?? 0,
          accumulator.branches?.total ?? 0
        ),
      };

      if (moduleThreshold !== undefined && moduleSummary.lines.pct < moduleThreshold) {
        violations.push(
          `Module ${name} line coverage ${moduleSummary.lines.pct}% is below ${moduleThreshold}%.`
        );
      }

      return moduleSummary;
    });

  const totals = {
    lines: applyThreshold(
      totalsEntry.lines.covered,
      totalsEntry.lines.total,
      thresholds?.lines
    ),
    statements: applyThreshold(
      totalsEntry.statements.covered,
      totalsEntry.statements.total,
      thresholds?.statements
    ),
    functions: applyThreshold(
      totalsEntry.functions.covered,
      totalsEntry.functions.total,
      thresholds?.functions
    ),
    branches: applyThreshold(
      totalsEntry.branches.covered,
      totalsEntry.branches.total,
      thresholds?.branches
    ),
  };

  for (const [name, metric] of Object.entries(totals)) {
    if (metric && metric.threshold !== undefined && metric.meetsThreshold === false) {
      violations.push(
        `Overall ${name} coverage ${metric.pct}% is below ${metric.threshold}%.`
      );
    }
  }

  return {
    format: coverageConfig.format,
    reportPath,
    totals,
    modules,
    violations,
  };
}

function buildCoveragePySummary(
  reportPath: string,
  coverageConfig: ProjectUnitTestCoverageConfig
): UnitTestCoverageSummary {
  const raw = readFileSync(reportPath, 'utf8');
  const summary = JSON.parse(raw) as CoveragePyJson;
  const moduleMap = new Map<string, CoverageAccumulator>();

  for (const [filePath, fileMetrics] of Object.entries(summary.files)) {
    const relativePath = normalizeRelativePath(filePath);
    const moduleName = getModuleName(relativePath, coverageConfig.moduleGroups);
    if (!moduleName) {
      continue;
    }

    const accumulator = moduleMap.get(moduleName) ?? {
      fileCount: 0,
      lines: { covered: 0, total: 0 },
    };
    accumulator.fileCount += 1;
    accumulator.lines.covered += fileMetrics.summary.covered_lines;
    accumulator.lines.total += fileMetrics.summary.num_statements;
    moduleMap.set(moduleName, accumulator);
  }

  const moduleThreshold = coverageConfig.minimumModuleLineCoverage;
  const thresholds = coverageConfig.thresholds;
  const violations: string[] = [];
  const modules = [...moduleMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, accumulator]) => {
      const moduleSummary: UnitTestCoverageModuleSummary = {
        name,
        fileCount: accumulator.fileCount,
        lines: applyThreshold(accumulator.lines.covered, accumulator.lines.total, moduleThreshold),
      };

      if (moduleThreshold !== undefined && moduleSummary.lines.pct < moduleThreshold) {
        violations.push(
          `Module ${name} line coverage ${moduleSummary.lines.pct}% is below ${moduleThreshold}%.`
        );
      }

      return moduleSummary;
    });

  const totals = {
    lines: applyThreshold(
      summary.totals.covered_lines,
      summary.totals.num_statements,
      thresholds?.lines
    ),
  };

  if (totals.lines.threshold !== undefined && totals.lines.meetsThreshold === false) {
    violations.push(
      `Overall lines coverage ${totals.lines.pct}% is below ${totals.lines.threshold}%.`
    );
  }

  return {
    format: coverageConfig.format,
    reportPath,
    totals,
    modules,
    violations,
  };
}

function parseCoverageSummary(
  reportPath: string,
  workingDir: string,
  coverageConfig: ProjectUnitTestCoverageConfig
): UnitTestCoverageSummary {
  switch (coverageConfig.format) {
    case 'istanbul-summary':
      return buildIstanbulSummary(reportPath, workingDir, coverageConfig);
    case 'coverage.py-json':
      return buildCoveragePySummary(reportPath, coverageConfig);
  }
}

export function getConfiguredCoverageGates(
  unitTestGates: ProjectUnitTestGateConfig[]
): ProjectUnitTestGateConfig[] {
  return unitTestGates.filter((gate) => gate.coverage?.enabled);
}

export function runUnitTestCoverageGate(
  gate: ProjectUnitTestGateConfig,
  root: string
): UnitTestCoverageRunResult {
  const coverageConfig = getCoverageConfig(gate);
  if (!coverageConfig) {
    return {
      status: 'not_configured',
      workingDir: gate.workingDir,
      reportPath: '',
      notes: `Gate "${gate.name}" does not declare unit test coverage config.`,
      command: '',
      requiredToProceed: false,
    };
  }

  const resolvedWorkingDir = resolve(root, coverageConfig.workingDir ?? gate.workingDir);
  if (!existsSync(resolvedWorkingDir)) {
    return {
      status: 'blocked',
      workingDir: resolvedWorkingDir,
      reportPath: resolve(resolvedWorkingDir, coverageConfig.reportPath),
      notes: `Coverage working directory does not exist for gate "${gate.name}": ${resolvedWorkingDir}`,
      command: coverageConfig.command,
      requiredToProceed: coverageConfig.requiredToProceed ?? false,
    };
  }

  const resolvedReportPath = resolve(resolvedWorkingDir, coverageConfig.reportPath);
  mkdirSync(dirname(resolvedReportPath), { recursive: true });

  const result = spawnSync(coverageConfig.command, {
    cwd: resolvedWorkingDir,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    return {
      status: 'failed',
      workingDir: resolvedWorkingDir,
      reportPath: resolvedReportPath,
      notes: `Coverage command failed for gate "${gate.name}" with exit code ${result.status ?? 1}.`,
      command: coverageConfig.command,
      requiredToProceed: coverageConfig.requiredToProceed ?? false,
      exitCode: result.status ?? 1,
    };
  }

  if (!existsSync(resolvedReportPath)) {
    return {
      status: 'blocked',
      workingDir: resolvedWorkingDir,
      reportPath: resolvedReportPath,
      notes: `Coverage report was not created for gate "${gate.name}": ${resolvedReportPath}`,
      command: coverageConfig.command,
      requiredToProceed: coverageConfig.requiredToProceed ?? false,
    };
  }

  const summary = parseCoverageSummary(resolvedReportPath, resolvedWorkingDir, coverageConfig);
  const status = summary.violations.length > 0 ? 'failed' : 'passed';

  return {
    status,
    workingDir: resolvedWorkingDir,
    reportPath: resolvedReportPath,
    notes:
      status === 'passed'
        ? `Coverage detected for gate "${gate.name}".`
        : `Coverage detected for gate "${gate.name}" with ${summary.violations.length} violation(s).`,
    command: coverageConfig.command,
    requiredToProceed: coverageConfig.requiredToProceed ?? false,
    summary,
    exitCode: status === 'failed' ? 1 : 0,
  };
}

export function formatCoverageMetric(metric?: UnitTestCoverageMetricSummary): string {
  if (!metric) {
    return 'n/a';
  }

  const thresholdSuffix =
    metric.threshold !== undefined ? ` (threshold ${metric.threshold}%)` : '';
  return `${metric.pct}% (${metric.covered}/${metric.total})${thresholdSuffix}`;
}
