import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildTaskBundle,
  slugifyFeatureName,
  type DevWorkspaceChangeProposal,
  type DevWorkspaceExecutionManifest,
  type DevWorkspaceTaskBundle,
} from '../packages/devflow/index.ts';

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

function buildMarkdown(bundle: DevWorkspaceTaskBundle): string {
  const lines: string[] = [];
  lines.push(`# ${bundle.workspaceName} Repo Task Bundles`);
  lines.push('');
  lines.push(`- Workspace key: \`${bundle.workspaceKey}\``);
  lines.push(`- Feature: \`${bundle.featureName}\``);
  lines.push(`- Generated at: \`${bundle.generatedAt}\``);
  if (bundle.objective) {
    lines.push(`- Objective: ${bundle.objective}`);
  }
  lines.push('');
  lines.push('## Bundle Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Workspace proposal"] --> B["Execution manifest"]');
  lines.push('  B --> C["Repo task bundles"]');
  lines.push('  C --> D["Agent-specific prompts"]');
  lines.push('  D --> E["Repo-local implementation and verification"]');
  lines.push('```');
  lines.push('');

  for (const repo of bundle.repos) {
    lines.push(`## ${repo.repoName}`);
    lines.push('');
    lines.push(`- Repo key: \`${repo.repoKey}\``);
    lines.push(`- Repo path: \`${repo.repoPath}\``);
    lines.push(`- Branch: \`${repo.branch}\``);
    lines.push(`- Runtime: \`${repo.runtime}\``);
    lines.push(`- Language: \`${repo.language}\``);
    lines.push(`- Summary: ${repo.summary}`);
    lines.push(`- Why this repo: ${repo.whyThisRepo}`);
    lines.push(`- Change surfaces: ${repo.changeSurfaceKeys.map((key) => `\`${key}\``).join(', ') || 'none'}`);
    lines.push(`- Task ids: ${repo.taskIds.map((id) => `\`${id}\``).join(', ')}`);
    lines.push(`- Execution step ids: ${repo.executionStepIds.map((id) => `\`${id}\``).join(', ')}`);
    lines.push('');
    lines.push('### Quality Gates');
    lines.push('');
    if (repo.qualityGateCommands.length === 0) {
      lines.push('- No declared quality gate commands.');
    } else {
      for (const command of repo.qualityGateCommands) {
        lines.push(`- \`${command}\``);
      }
    }
    lines.push('');
    lines.push('### Deployment Notes');
    lines.push('');
    for (const note of repo.deployNotes) {
      lines.push(`- ${note}`);
    }
    lines.push('');
    lines.push('### Agent Prompt');
    lines.push('');
    lines.push('```text');
    lines.push(repo.agentPrompt);
    lines.push('```');
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function loadJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: node --experimental-strip-types scripts/generate-dev-task-bundle.ts --workspace <workspace-key> --feature <feature-name>'
    );
    process.exit(1);
  }

  const generatedDir = resolve(ROOT, 'workspaces', cli.workspaceKey, 'generated');
  const slug = slugifyFeatureName(cli.featureName);
  const proposalPath = resolve(generatedDir, `${slug}.proposal.json`);
  const executionPath = resolve(generatedDir, `${slug}.execution.json`);

  const proposal = loadJsonFile<DevWorkspaceChangeProposal>(proposalPath);
  const manifest = loadJsonFile<DevWorkspaceExecutionManifest>(executionPath);
  const bundle = buildTaskBundle(proposal, manifest);

  mkdirSync(generatedDir, { recursive: true });
  const markdownPath = resolve(generatedDir, `${slug}.task-bundle.md`);
  const jsonPath = resolve(generatedDir, `${slug}.task-bundle.json`);

  writeFileSync(markdownPath, buildMarkdown(bundle));
  writeFileSync(jsonPath, JSON.stringify(bundle, null, 2));

  console.log(`Task bundle written to: ${markdownPath}`);
  console.log(`Machine-readable task bundle written to: ${jsonPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
