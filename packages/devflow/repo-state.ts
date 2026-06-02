import { existsSync } from 'fs';
import { spawnSync } from 'child_process';

export interface GitRepoState {
  repoPath: string;
  exists: boolean;
  isGitRepo: boolean;
  currentBranch?: string;
  dirty: boolean;
  statusLines: string[];
  diagnostics: string[];
}

function runGit(
  repoPath: string,
  args: string[]
): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync('git', args, {
    cwd: repoPath,
    encoding: 'utf-8',
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() || '',
    stderr: result.stderr?.trim() || '',
  };
}

export function inspectGitRepoState(repoPath: string): GitRepoState {
  const diagnostics: string[] = [];

  if (!existsSync(repoPath)) {
    diagnostics.push(`Repository path does not exist: ${repoPath}`);
    return {
      repoPath,
      exists: false,
      isGitRepo: false,
      dirty: false,
      statusLines: [],
      diagnostics,
    };
  }

  const gitCheck = runGit(repoPath, ['rev-parse', '--is-inside-work-tree']);
  if (!gitCheck.ok || gitCheck.stdout !== 'true') {
    diagnostics.push(`Path is not a Git work tree: ${repoPath}`);
    return {
      repoPath,
      exists: true,
      isGitRepo: false,
      dirty: false,
      statusLines: [],
      diagnostics,
    };
  }

  const branchResult = runGit(repoPath, ['branch', '--show-current']);
  if (!branchResult.ok) {
    diagnostics.push(branchResult.stderr || 'Unable to resolve current branch.');
  }

  const statusResult = runGit(repoPath, ['status', '--short']);
  if (!statusResult.ok) {
    diagnostics.push(statusResult.stderr || 'Unable to resolve working tree status.');
  }

  const statusLines = statusResult.stdout
    ? statusResult.stdout.split('\n').filter(Boolean)
    : [];

  return {
    repoPath,
    exists: true,
    isGitRepo: true,
    currentBranch: branchResult.stdout || undefined,
    dirty: statusLines.length > 0,
    statusLines,
    diagnostics,
  };
}

