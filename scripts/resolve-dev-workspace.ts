import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { formatDevWorkspaceDiscovery, discoverDevWorkspace } from '../packages/devflow/index.ts';
import { inspectGitRepoState } from '../packages/devflow/repo-state';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function parseWorkspaceKey(): string | undefined {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--workspace' || arg === '-w') {
      return args[index + 1];
    }

    if (arg.startsWith('--workspace=')) {
      return arg.split('=')[1];
    }
  }

  return process.env.DEV_WORKSPACE_KEY;
}

async function main(): Promise<void> {
  const workspaceKey = parseWorkspaceKey();

  if (!workspaceKey) {
    console.error('Usage: npm run devflow:resolve -- --workspace <workspace-key>');
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(workspaceKey, ROOT);
  console.log(formatDevWorkspaceDiscovery(discovery));

  if (!discovery.exists || !discovery.config) {
    process.exit(1);
  }

  console.log('  Git State:');
  for (const repo of discovery.config.repos) {
    const state = inspectGitRepoState(repo.absoluteRepoPath);
    const branch = state.currentBranch || '(unknown)';
    const cleanliness = state.dirty ? 'dirty' : 'clean';
    console.log(`    - ${repo.key}: branch=${branch}, ${cleanliness}`);
    for (const diagnostic of state.diagnostics) {
      console.log(`      ! ${diagnostic}`);
    }
    if (state.statusLines.length > 0) {
      for (const line of state.statusLines.slice(0, 10)) {
        console.log(`      ${line}`);
      }
      if (state.statusLines.length > 10) {
        console.log(`      ... ${state.statusLines.length - 10} more`);
      }
    }
  }

  if (discovery.diagnostics.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
