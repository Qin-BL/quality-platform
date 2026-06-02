import { spawnSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  discoverDevWorkspace,
  getEffectiveBaseBranch,
  getFeatureBranchName,
} from '../packages/devflow/index.ts';
import { inspectGitRepoState } from '../packages/devflow/repo-state';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedCli {
  workspaceKey?: string;
  featureName?: string;
  apply: boolean;
}

function parseCli(): ParsedCli {
  const args = process.argv.slice(2);
  const parsed: ParsedCli = { apply: false };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === '--workspace' || arg === '-w') {
      parsed.workspaceKey = args[index + 1];
      index++;
      continue;
    }

    if (arg.startsWith('--workspace=')) {
      parsed.workspaceKey = arg.split('=')[1];
      continue;
    }

    if (arg === '--feature' || arg === '-f') {
      parsed.featureName = args[index + 1];
      index++;
      continue;
    }

    if (arg.startsWith('--feature=')) {
      parsed.featureName = arg.split('=')[1];
      continue;
    }

    if (arg === '--apply') {
      parsed.apply = true;
    }
  }

  return parsed;
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

async function main(): Promise<void> {
  const cli = parseCli();

  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: npm run devflow:prepare-branches -- --workspace <workspace-key> --feature <feature-name> [--apply]'
    );
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(cli.workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  console.log(
    cli.apply
      ? 'Preparing development branches...'
      : 'Dry run: branch preparation preview'
  );

  let blocked = false;

  for (const repo of discovery.config.repos) {
    const state = inspectGitRepoState(repo.absoluteRepoPath);
    const featureBranch = getFeatureBranchName(repo, cli.featureName);
    const baseBranch = getEffectiveBaseBranch(repo);
    const exists = branchExists(repo.absoluteRepoPath, featureBranch);

    console.log('');
    console.log(`[${repo.key}] ${repo.displayName}`);
    console.log(`  path: ${repo.absoluteRepoPath}`);
    console.log(`  current: ${state.currentBranch || '(unknown)'}`);
    console.log(`  base: ${baseBranch}`);
    console.log(`  target: ${featureBranch}`);

    if (!state.exists || !state.isGitRepo) {
      blocked = true;
      console.log('  status: blocked (not a valid git repository)');
      continue;
    }

    if (state.dirty) {
      blocked = true;
      console.log('  status: blocked (working tree is dirty)');
      continue;
    }

    if (!cli.apply) {
      console.log(
        exists
          ? '  action: would switch to existing feature branch'
          : '  action: would create and switch to new feature branch'
      );
      continue;
    }

    if (exists) {
      runGit(repo.absoluteRepoPath, ['checkout', featureBranch]);
      console.log('  action: switched to existing feature branch');
      continue;
    }

    runGit(repo.absoluteRepoPath, ['checkout', baseBranch]);
    runGit(repo.absoluteRepoPath, ['checkout', '-b', featureBranch]);
    console.log('  action: created and switched to new feature branch');
  }

  if (blocked) {
    console.log('');
    console.log(
      'One or more repositories were blocked. Review the output before rerunning with --apply.'
    );
    if (cli.apply) {
      process.exit(1);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
