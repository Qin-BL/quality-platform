import { spawnSync } from 'child_process';
import type {
  DevWorkspaceExecutionManifest,
  DevWorkspaceExecutionStep,
  DevWorkspaceExecutionStepKind,
  DevWorkspaceExecutionStepStage,
} from './execution-manifest.ts';

export interface ExecutionSelectionFilter {
  repoKey?: string;
  stage?: DevWorkspaceExecutionStepStage;
  stepId?: string;
}

export interface ExecutionStepResult {
  stepId: string;
  repoKey: string;
  stage: DevWorkspaceExecutionStepStage;
  kind: DevWorkspaceExecutionStepKind;
  status: 'skipped' | 'dry_run' | 'success' | 'failed' | 'manual_only';
  startedAt: string;
  finishedAt: string;
  notes: string[];
  error?: string;
}

export interface ExecutionRunOptions {
  apply: boolean;
  onLog?: (message: string) => void;
}

const AUTO_EXECUTABLE_KINDS: DevWorkspaceExecutionStepKind[] = [
  'inspect',
  'branch',
  'verify',
];

function log(message: string, onLog?: (message: string) => void): void {
  if (onLog) {
    onLog(message);
    return;
  }
  console.log(message);
}

function runShellCommand(repoPath: string, command: string): void {
  const result = spawnSync('zsh', ['-lc', command], {
    cwd: repoPath,
    stdio: 'inherit',
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed in ${repoPath}: ${command}`);
  }
}

function runGit(repoPath: string, args: string[]): void {
  const result = spawnSync('git', args, {
    cwd: repoPath,
    stdio: 'inherit',
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed in ${repoPath}`);
  }
}

function branchExists(repoPath: string, branchName: string): boolean {
  const result = spawnSync(
    'git',
    ['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`],
    {
      cwd: repoPath,
      encoding: 'utf-8',
    }
  );

  return result.status === 0;
}

export function selectExecutionSteps(
  manifest: DevWorkspaceExecutionManifest,
  filter: ExecutionSelectionFilter
): DevWorkspaceExecutionStep[] {
  return manifest.steps.filter((step) => {
    if (filter.repoKey && step.repoKey !== filter.repoKey) {
      return false;
    }
    if (filter.stage && step.stage !== filter.stage) {
      return false;
    }
    if (filter.stepId && step.id !== filter.stepId) {
      return false;
    }
    return true;
  });
}

export function printSelectedExecutionSteps(
  steps: DevWorkspaceExecutionStep[],
  onLog?: (message: string) => void
): void {
  log('Selected execution steps:', onLog);
  for (const step of steps) {
    log(
      `- ${step.id} [${step.repoKey}] (${step.stage}/${step.kind})${step.command ? ` -> ${step.command}` : ''}`,
      onLog
    );
  }
}

function executeInspect(
  step: DevWorkspaceExecutionStep,
  onLog?: (message: string) => void
): string[] {
  const notes = [`inspect: ${step.notes.join(' ')}`];
  for (const note of notes) {
    log(`  ${note}`, onLog);
  }
  return notes;
}

function executeBranch(step: DevWorkspaceExecutionStep, repoPath: string): string[] {
  if (!step.branch) {
    throw new Error(`Branch step ${step.id} is missing branch.`);
  }

  const branchName = step.branch;
  const baseNote = step.notes.find((note) => note.startsWith('Base branch: '));
  const baseBranch = baseNote?.replace('Base branch: ', '').trim();
  if (!baseBranch) {
    throw new Error(`Branch step ${step.id} is missing base branch note.`);
  }

  if (branchExists(repoPath, branchName)) {
    runGit(repoPath, ['checkout', branchName]);
    return [`switched to existing branch ${branchName}`];
  }

  runGit(repoPath, ['checkout', baseBranch]);
  runGit(repoPath, ['checkout', '-b', branchName]);
  return [`created branch ${branchName} from ${baseBranch}`];
}

function executeVerify(step: DevWorkspaceExecutionStep, repoPath: string): string[] {
  if (!step.command) {
    throw new Error(`Verify step ${step.id} is missing command.`);
  }
  runShellCommand(repoPath, step.command);
  return [`executed command: ${step.command}`];
}

export function runExecutionStep(
  manifest: DevWorkspaceExecutionManifest,
  step: DevWorkspaceExecutionStep,
  options: ExecutionRunOptions
): ExecutionStepResult {
  const repo = manifest.repos.find((item) => item.repoKey === step.repoKey);
  if (!repo) {
    throw new Error(`Step ${step.id} references unknown repo ${step.repoKey}.`);
  }

  const startedAt = new Date().toISOString();
  log('', options.onLog);
  log(`[${step.repoKey}] ${step.title}`, options.onLog);
  log(`  step: ${step.id}`, options.onLog);
  log(`  stage: ${step.stage}`, options.onLog);
  log(`  kind: ${step.kind}`, options.onLog);
  if (step.branch) {
    log(`  branch: ${step.branch}`, options.onLog);
  }
  if (step.command) {
    log(`  command: ${step.command}`, options.onLog);
  }
  if (step.dependsOn.length > 0) {
    log(`  depends on: ${step.dependsOn.join(', ')}`, options.onLog);
  }

  if (!AUTO_EXECUTABLE_KINDS.includes(step.kind)) {
    const notes = [
      'manual-only step (implementation/promotion/deploy automation is intentionally not enabled yet)',
    ];
    log(`  action: ${notes[0]}`, options.onLog);
    return {
      stepId: step.id,
      repoKey: step.repoKey,
      stage: step.stage,
      kind: step.kind,
      status: 'manual_only',
      startedAt,
      finishedAt: new Date().toISOString(),
      notes,
      error:
        options.apply && step.blocking
          ? `Blocking step ${step.id} is not auto-executable yet.`
          : undefined,
    };
  }

  if (!options.apply) {
    log('  action: dry-run only', options.onLog);
    return {
      stepId: step.id,
      repoKey: step.repoKey,
      stage: step.stage,
      kind: step.kind,
      status: 'dry_run',
      startedAt,
      finishedAt: new Date().toISOString(),
      notes: ['dry-run only'],
    };
  }

  try {
    let notes: string[] = [];
    switch (step.kind) {
      case 'inspect':
        notes = executeInspect(step, options.onLog);
        break;
      case 'branch':
        notes = executeBranch(step, repo.repoPath);
        break;
      case 'verify':
        notes = executeVerify(step, repo.repoPath);
        break;
      default:
        throw new Error(`Unsupported execution kind: ${step.kind}`);
    }

    return {
      stepId: step.id,
      repoKey: step.repoKey,
      stage: step.stage,
      kind: step.kind,
      status: 'success',
      startedAt,
      finishedAt: new Date().toISOString(),
      notes,
    };
  } catch (error) {
    return {
      stepId: step.id,
      repoKey: step.repoKey,
      stage: step.stage,
      kind: step.kind,
      status: 'failed',
      startedAt,
      finishedAt: new Date().toISOString(),
      notes: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function orderExecutionSteps(
  manifest: DevWorkspaceExecutionManifest,
  selectedSteps: DevWorkspaceExecutionStep[]
): DevWorkspaceExecutionStep[] {
  const selectedIds = new Set(selectedSteps.map((step) => step.id));
  const byId = new Map(manifest.steps.map((step) => [step.id, step]));
  const ordered: DevWorkspaceExecutionStep[] = [];
  const temp = new Set<string>();
  const perm = new Set<string>();

  function visit(stepId: string): void {
    if (perm.has(stepId)) {
      return;
    }
    if (temp.has(stepId)) {
      throw new Error(`Execution dependency cycle detected at step ${stepId}.`);
    }
    const step = byId.get(stepId);
    if (!step || !selectedIds.has(stepId)) {
      return;
    }
    temp.add(stepId);
    for (const dependency of step.dependsOn) {
      if (selectedIds.has(dependency)) {
        visit(dependency);
      }
    }
    temp.delete(stepId);
    perm.add(stepId);
    ordered.push(step);
  }

  for (const step of selectedSteps) {
    visit(step.id);
  }

  return ordered;
}
