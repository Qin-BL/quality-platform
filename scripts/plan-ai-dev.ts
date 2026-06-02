import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  discoverDevWorkspace,
  getEffectiveBaseBranch,
  getFeatureBranchName,
  slugifyFeatureName,
} from '../packages/devflow/index.ts';
import { inspectGitRepoState } from '../packages/devflow/repo-state';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedCli {
  workspaceKey?: string;
  featureName?: string;
}

function parseCli(): ParsedCli {
  const args = process.argv.slice(2);
  const parsed: ParsedCli = {};

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
    }
  }

  return parsed;
}

function buildMarkdown(
  workspaceName: string,
  featureName: string,
  discovery: Awaited<ReturnType<typeof discoverDevWorkspace>>
): string {
  if (!discovery.config) {
    return `# ${workspaceName} bootstrap\n\nWorkspace config could not be loaded.\n`;
  }

  const lines: string[] = [];
  lines.push(`# ${discovery.config.displayName} Bootstrap`);
  lines.push('');
  lines.push(`- Workspace key: \`${discovery.config.workspaceKey}\``);
  lines.push(`- Feature: \`${featureName}\``);
  lines.push(`- Generated at: \`${new Date().toISOString()}\``);
  lines.push(`- Workspace root: \`${discovery.config.workspaceRoot}\``);
  if (discovery.config.absoluteSharedPlanPath) {
    lines.push(`- Shared plan: \`${discovery.config.absoluteSharedPlanPath}\``);
  }
  lines.push('');
  lines.push('## Repository Baseline');
  lines.push('');
  lines.push('| Repo | Current Branch | Working Tree | Suggested Base | Suggested Feature Branch |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const repo of discovery.config.repos) {
    const state = inspectGitRepoState(repo.absoluteRepoPath);
    lines.push(
      `| ${repo.displayName} | ${state.currentBranch || '(unknown)'} | ${state.dirty ? 'dirty' : 'clean'} | ${getEffectiveBaseBranch(repo)} | ${getFeatureBranchName(repo, featureName)} |`
    );
  }

  lines.push('');
  lines.push('## Branch Preparation Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Resolve workspace"] --> B["Inspect repository Git state"]');
  lines.push('  B --> C["Generate feature branch names"]');
  lines.push('  C --> D{"Working tree clean?"}');
  lines.push('  D -->|Yes| E["Create or switch to feature branch"]');
  lines.push('  D -->|No| F["Block auto-apply and require manual cleanup"]');
  lines.push('```');
  lines.push('');
  lines.push('## Deployment Topology');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart LR');
  for (const [index, repo] of discovery.config.repos.entries()) {
    const repoNode = `REPO_${index}`;
    lines.push(`  ${repoNode}["${repo.displayName}\\nbase: ${getEffectiveBaseBranch(repo)}"]`);
    for (const [targetIndex, target] of repo.deployTargets.entries()) {
      const envNode = `${repoNode}_ENV_${targetIndex}`;
      const targetLabel = `${target.environment}\\nbranch: ${target.branch}${target.pipeline ? `\\n${target.pipeline}` : ''}`;
      lines.push(`  ${repoNode} --> ${envNode}["${targetLabel}"]`);
    }
  }
  lines.push('```');
  lines.push('');
  lines.push('## Repository Actions');
  lines.push('');

  for (const repo of discovery.config.repos) {
    const state = inspectGitRepoState(repo.absoluteRepoPath);
    lines.push(`### ${repo.displayName}`);
    lines.push('');
    lines.push(`- Repo path: \`${repo.absoluteRepoPath}\``);
    lines.push(`- Runtime: \`${repo.runtime}\``);
    lines.push(`- Language: \`${repo.language}\``);
    lines.push(`- Base branch: \`${getEffectiveBaseBranch(repo)}\``);
    lines.push(
      `- Feature branch: \`${getFeatureBranchName(repo, featureName)}\``
    );
    lines.push(`- Working tree: ${state.dirty ? 'dirty (manual cleanup required)' : 'clean'}`);
    if (repo.commands.install) {
      lines.push(`- Install: \`${repo.commands.install}\``);
    }
    if (repo.commands.build) {
      lines.push(`- Build: \`${repo.commands.build}\``);
    }
    if (repo.commands.test) {
      lines.push(`- Test: \`${repo.commands.test}\``);
    }
    if (repo.commands.lint) {
      lines.push(`- Lint: \`${repo.commands.lint}\``);
    }
    if (repo.deployTargets.length > 0) {
      lines.push('- Deployment targets:');
      for (const target of repo.deployTargets) {
        const suffix = target.pipeline ? ` via \`${target.pipeline}\`` : '';
        lines.push(
          `  - ${target.environment}: branch \`${target.branch}\`${suffix}${target.notes ? ` — ${target.notes}` : ''}`
        );
      }
    }
    if (repo.notes) {
      lines.push(`- Notes: ${repo.notes}`);
    }
    if (state.diagnostics.length > 0) {
      lines.push('- Diagnostics:');
      for (const item of state.diagnostics) {
        lines.push(`  - ${item}`);
      }
    }
    lines.push('');
  }

  if (discovery.config.absoluteFrameworkMirrorPath) {
    lines.push('## Framework Mirror');
    lines.push('');
    lines.push(
      `- Mirror path: \`${discovery.config.absoluteFrameworkMirrorPath}\``
    );
    lines.push(
      `- Included paths: ${discovery.config.frameworkMirror?.includePaths.map((item) => `\`${item}\``).join(', ')}`
    );
    lines.push('');
  }

  if (discovery.diagnostics.length > 0) {
    lines.push('## Diagnostics');
    lines.push('');
    for (const item of discovery.diagnostics) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: npm run devflow:plan -- --workspace <workspace-key> --feature <feature-name>'
    );
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(cli.workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  const slug = slugifyFeatureName(cli.featureName);
  const generatedDir = resolve(
    ROOT,
    'workspaces',
    cli.workspaceKey,
    'generated'
  );
  mkdirSync(generatedDir, { recursive: true });

  const markdownPath = resolve(generatedDir, `${slug}.md`);
  const jsonPath = resolve(generatedDir, `${slug}.json`);
  const markdown = buildMarkdown(
    cli.workspaceKey,
    cli.featureName,
    discovery
  );

  const jsonPayload = {
    generatedAt: new Date().toISOString(),
    workspaceKey: cli.workspaceKey,
    featureName: cli.featureName,
    diagnostics: discovery.diagnostics,
    repos: discovery.config.repos.map((repo) => ({
      repo,
      state: inspectGitRepoState(repo.absoluteRepoPath),
      baseBranch: getEffectiveBaseBranch(repo),
      featureBranch: getFeatureBranchName(repo, cli.featureName as string),
    })),
  };

  writeFileSync(markdownPath, markdown);
  writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2));

  console.log(`AI dev workspace plan written to: ${markdownPath}`);
  console.log(`Machine-readable state written to: ${jsonPath}`);

  if (discovery.diagnostics.length > 0) {
    console.log('Diagnostics were found; review the generated plan before execution.');
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
