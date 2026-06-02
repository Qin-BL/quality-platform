import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildChangeProposal,
  discoverDevWorkspace,
  slugifyFeatureName,
  type DevWorkspaceChangeProposal,
  type DevWorkspaceRepoProposal,
} from '../packages/devflow/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedCli {
  workspaceKey?: string;
  featureName?: string;
  objective?: string;
  repoKeys: string[];
}

function parseCli(): ParsedCli {
  const args = process.argv.slice(2);
  const parsed: ParsedCli = { repoKeys: [] };

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
    if (arg === '--objective' || arg === '-o') {
      parsed.objective = args[index + 1];
      index++;
      continue;
    }
    if (arg.startsWith('--objective=')) {
      parsed.objective = arg.split('=').slice(1).join('=');
      continue;
    }
    if (arg === '--repo' || arg === '-r') {
      parsed.repoKeys.push(args[index + 1]);
      index++;
      continue;
    }
    if (arg.startsWith('--repo=')) {
      parsed.repoKeys.push(arg.split('=')[1]);
    }
  }

  return parsed;
}

function buildRepoMermaid(repo: DevWorkspaceRepoProposal): string[] {
  const lines: string[] = [];
  lines.push('```mermaid');
  lines.push('flowchart LR');
  lines.push(`  A["${repo.repoName}"] --> B["Feature branch: ${repo.featureBranch}"]`);
  lines.push('  B --> C["Implement repo tasks"]');
  lines.push('  C --> D["Run quality gates"]');
  if (repo.integrationBranch) {
    lines.push(`  D --> E["Promote to ${repo.integrationBranch}"]`);
  } else {
    lines.push(`  D --> E["Promote to ${repo.baseBranch}"]`);
  }
  lines.push('  E --> F["Follow deploy path"]');
  lines.push('```');
  return lines;
}

function formatRepoProposal(repo: DevWorkspaceRepoProposal): string[] {
  const lines: string[] = [];
  lines.push(`## ${repo.repoName}`);
  lines.push('');
  lines.push(`- Repo key: \`${repo.repoKey}\``);
  lines.push(`- Runtime: \`${repo.runtime}\``);
  lines.push(`- Language: \`${repo.language}\``);
  lines.push(`- Repo path: \`${repo.repoPath}\``);
  lines.push(`- Base branch: \`${repo.baseBranch}\``);
  lines.push(`- Feature branch: \`${repo.featureBranch}\``);
  if (repo.integrationBranch) {
    lines.push(`- Integration branch: \`${repo.integrationBranch}\``);
  }
  if (repo.productionBranch) {
    lines.push(`- Production branch: \`${repo.productionBranch}\``);
  }
  lines.push(`- Why this repo: ${repo.whyThisRepo}`);
  lines.push('');
  lines.push('### Repo Delivery Flow');
  lines.push('');
  lines.push(...buildRepoMermaid(repo));
  lines.push('');
  lines.push('### Suggested Change Surfaces');
  lines.push('');
  if (repo.changeSurfaces.length === 0) {
    lines.push('- No repo-specific change surfaces are declared yet.');
  } else {
    for (const surface of repo.changeSurfaces) {
      lines.push(`- **${surface.label}** (\`${surface.key}\`)`);
      lines.push(`  - Paths: ${surface.paths.map((path) => `\`${path}\``).join(', ')}`);
      if (surface.notes) {
        lines.push(`  - Notes: ${surface.notes}`);
      }
    }
  }
  lines.push('');
  lines.push('### Suggested Tasks');
  lines.push('');
  for (const task of repo.tasks) {
    lines.push(`- **${task.title}** (\`${task.type}\`)`);
    lines.push(`  - Description: ${task.description}`);
    lines.push(`  - Outputs: ${task.outputs.join('; ')}`);
  }
  lines.push('');
  lines.push('### Quality Gates');
  lines.push('');
  if (repo.qualityGates.length === 0) {
    lines.push('- No declared quality gates.');
  } else {
    for (const gate of repo.qualityGates) {
      lines.push(`- **${gate.label}**: \`${gate.command}\` (${gate.stage})`);
    }
  }
  lines.push('');
  lines.push('### Deployment Notes');
  lines.push('');
  for (const note of repo.deploymentNotes) {
    lines.push(`- ${note}`);
  }
  lines.push('');
  return lines;
}

function buildMarkdown(proposal: DevWorkspaceChangeProposal): string {
  const lines: string[] = [];
  lines.push(`# ${proposal.workspaceName} Change Proposal`);
  lines.push('');
  lines.push(`- Workspace key: \`${proposal.workspaceKey}\``);
  lines.push(`- Feature: \`${proposal.featureName}\``);
  lines.push(`- Generated at: \`${proposal.generatedAt}\``);
  if (proposal.objective) {
    lines.push(`- Objective: ${proposal.objective}`);
  }
  lines.push(`- Selected repos: ${proposal.selectedRepos.map((repo) => `\`${repo}\``).join(', ')}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(proposal.summary);
  lines.push('');
  lines.push('## Workspace Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Resolve workspace"] --> B["Select participating repos"]');
  lines.push('  B --> C["Map change surfaces and tasks"]');
  lines.push('  C --> D["Implement repo changes on feature branches"]');
  lines.push('  D --> E["Run repo quality gates"]');
  lines.push('  E --> F["Promote and deploy by repo pathway"]');
  lines.push('```');
  lines.push('');

  for (const repo of proposal.repos) {
    lines.push(...formatRepoProposal(repo));
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: node --experimental-strip-types scripts/generate-dev-proposal.ts --workspace <workspace-key> --feature <feature-name> [--objective "..."] [--repo repo-key]'
    );
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(cli.workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  const proposal = buildChangeProposal(discovery.config, cli.featureName, {
    objective: cli.objective,
    repoKeys: cli.repoKeys,
  });

  const generatedDir = resolve(ROOT, 'workspaces', cli.workspaceKey, 'generated');
  mkdirSync(generatedDir, { recursive: true });

  const slug = slugifyFeatureName(cli.featureName);
  const markdownPath = resolve(generatedDir, `${slug}.proposal.md`);
  const jsonPath = resolve(generatedDir, `${slug}.proposal.json`);

  writeFileSync(markdownPath, buildMarkdown(proposal));
  writeFileSync(jsonPath, JSON.stringify(proposal, null, 2));

  console.log(`Change proposal written to: ${markdownPath}`);
  console.log(`Machine-readable proposal written to: ${jsonPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
