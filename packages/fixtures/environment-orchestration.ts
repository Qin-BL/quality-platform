import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';
import type {
  ProjectDataDependencyConfig,
  ProjectEnvironmentCheckConfig,
  ProjectOrchestrationConfig,
} from '../project/project-config';

export interface EnvironmentCheckResult {
  name: string;
  kind: ProjectEnvironmentCheckConfig['kind'];
  status: 'passed' | 'failed' | 'blocked';
  detail: string;
}

export interface DataDependencyResult {
  name: string;
  status: 'present' | 'missing' | 'provisioned' | 'failed';
  detail: string;
}

export interface ProjectOrchestrationResult {
  enabled: boolean;
  requiredToProceed: boolean;
  status: 'skipped' | 'passed' | 'failed';
  environmentChecks: EnvironmentCheckResult[];
  dataDependencies: DataDependencyResult[];
}

function runShellCommand(
  command: string,
  cwd: string
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf-8',
  });

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function evaluateCommandCheck(
  check: ProjectEnvironmentCheckConfig,
  root: string
): EnvironmentCheckResult {
  const output = runShellCommand(check.target, root);
  const combined = `${output.stdout}\n${output.stderr}`.trim();
  const successPattern = check.successPattern
    ? new RegExp(check.successPattern, 'i')
    : undefined;
  const passed =
    output.status === 0 &&
    (!successPattern || successPattern.test(combined || 'command-executed'));

  return {
    name: check.name,
    kind: check.kind,
    status: passed ? 'passed' : 'failed',
    detail: passed
      ? 'Command check passed.'
      : `Command check failed${combined ? `: ${combined.slice(0, 240)}` : '.'}`,
  };
}

async function evaluateHttpCheck(
  check: ProjectEnvironmentCheckConfig
): Promise<EnvironmentCheckResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), check.timeoutMs ?? 10_000);
    const response = await fetch(check.target, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await response.text();
    const successPattern = check.successPattern
      ? new RegExp(check.successPattern, 'i')
      : undefined;
    const passed = response.ok && (!successPattern || successPattern.test(text));

    return {
      name: check.name,
      kind: check.kind,
      status: passed ? 'passed' : 'failed',
      detail: passed
        ? `HTTP ${response.status} check passed.`
        : `HTTP ${response.status} check failed.`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown HTTP error';
    return {
      name: check.name,
      kind: check.kind,
      status: 'failed',
      detail,
    };
  }
}

function evaluateFileCheck(
  check: ProjectEnvironmentCheckConfig,
  root: string
): EnvironmentCheckResult {
  const filePath = resolve(root, check.target);
  const passed = existsSync(filePath);
  return {
    name: check.name,
    kind: check.kind,
    status: passed ? 'passed' : 'failed',
    detail: passed ? `File exists: ${filePath}` : `Required file is missing: ${filePath}`,
  };
}

async function runEnvironmentCheck(
  check: ProjectEnvironmentCheckConfig,
  root: string
): Promise<EnvironmentCheckResult> {
  switch (check.kind) {
    case 'command':
      return evaluateCommandCheck(check, root);
    case 'file_exists':
      return evaluateFileCheck(check, root);
    case 'http_get':
      return evaluateHttpCheck(check);
    default:
      return {
        name: check.name,
        kind: check.kind,
        status: 'blocked',
        detail: `Unsupported environment check kind: ${check.kind}`,
      };
  }
}

function evaluateDataDependency(
  dependency: ProjectDataDependencyConfig,
  root: string
): DataDependencyResult {
  if (dependency.checkCommand) {
    const output = runShellCommand(dependency.checkCommand, root);
    if (output.status === 0) {
      return {
        name: dependency.name,
        status: 'present',
        detail: 'Data dependency check passed.',
      };
    }
  }

  if (dependency.provisionCommand) {
    const output = runShellCommand(dependency.provisionCommand, root);
    if (output.status === 0) {
      return {
        name: dependency.name,
        status: 'provisioned',
        detail: 'Provision command completed successfully.',
      };
    }
    return {
      name: dependency.name,
      status: 'failed',
      detail: `Provision command failed: ${(output.stderr || output.stdout || '').slice(0, 240)}`,
    };
  }

  return {
    name: dependency.name,
    status: dependency.required ? 'missing' : 'present',
    detail: dependency.required
      ? 'Required data dependency has no passing check or provision command.'
      : 'Optional dependency not configured.',
  };
}

export async function runProjectOrchestration(
  orchestration: ProjectOrchestrationConfig,
  root?: string
): Promise<ProjectOrchestrationResult> {
  const base = root ? resolve(root) : process.cwd();
  if (!orchestration.enabled) {
    return {
      enabled: false,
      requiredToProceed: orchestration.requiredToProceed,
      status: 'skipped',
      environmentChecks: [],
      dataDependencies: [],
    };
  }

  const environmentChecks: EnvironmentCheckResult[] = [];
  for (const check of orchestration.environmentChecks) {
    environmentChecks.push(await runEnvironmentCheck(check, base));
  }

  const dataDependencies = orchestration.dataDependencies.map((dependency) =>
    evaluateDataDependency(dependency, base)
  );

  const hasFailure =
    environmentChecks.some((item) => item.status !== 'passed') ||
    dataDependencies.some(
      (item) => item.status === 'failed' || item.status === 'missing'
    );

  return {
    enabled: true,
    requiredToProceed: orchestration.requiredToProceed,
    status: hasFailure ? 'failed' : 'passed',
    environmentChecks,
    dataDependencies,
  };
}
