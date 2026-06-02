import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildExecutionManifest,
  discoverDevWorkspace,
  slugifyFeatureName,
  type DevWorkspaceExecutionManifest,
  type DevWorkspaceExecutionStep,
  type DevWorkspaceExecutionStepStage,
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

const STEP_STAGE_ORDER: DevWorkspaceExecutionStepStage[] = [
  'preflight',
  'branching',
  'implementation',
  'verification',
  'promotion',
  'deployment',
];

function compareSteps(
  left: DevWorkspaceExecutionStep,
  right: DevWorkspaceExecutionStep
): number {
  return (
    STEP_STAGE_ORDER.indexOf(left.stage) - STEP_STAGE_ORDER.indexOf(right.stage)
  );
}

function formatStep(step: DevWorkspaceExecutionStep): string[] {
  const lines = [
    `- **${step.title}** (\`${step.id}\`)`,
    `  - Repo: \`${step.repoKey}\``,
    `  - Stage: \`${step.stage}\``,
    `  - Kind: \`${step.kind}\``,
    `  - Blocking: ${step.blocking ? 'yes' : 'no'}`,
    `  - Description: ${step.description}`,
  ];

  if (step.branch) {
    lines.push(`  - Branch: \`${step.branch}\``);
  }
  if (step.environment) {
    lines.push(`  - Environment: \`${step.environment}\``);
  }
  if (step.command) {
    lines.push(`  - Command: \`${step.command}\``);
  }
  if (step.dependsOn.length > 0) {
    lines.push(`  - Depends on: ${step.dependsOn.map((id) => `\`${id}\``).join(', ')}`);
  }
  if (step.notes.length > 0) {
    lines.push(`  - Notes: ${step.notes.join(' ')}`);
  }

  return lines;
}

function buildMarkdown(manifest: DevWorkspaceExecutionManifest): string {
  const lines: string[] = [];
  lines.push(`# ${manifest.workspaceName} Execution Manifest`);
  lines.push('');
  lines.push(`- Workspace key: \`${manifest.workspaceKey}\``);
  lines.push(`- Feature: \`${manifest.featureName}\``);
  lines.push(`- Generated at: \`${manifest.generatedAt}\``);
  lines.push(`- Workspace root: \`${manifest.workspaceRoot}\``);
  lines.push('');
  lines.push('## Repository Readiness');
  lines.push('');
  lines.push('| Repo | Current Branch | Feature Branch | Dirty | Auto Branch Prep | Direct Test Deploy |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const repo of manifest.repos) {
    lines.push(
      `| ${repo.repoName} | ${repo.currentBranch || '(unknown)'} | ${repo.featureBranch} | ${repo.dirty ? 'yes' : 'no'} | ${repo.canAutoPrepareBranch ? 'yes' : 'no'} | ${repo.directFeatureDeployTargets.length > 0 ? 'yes' : 'no'} |`
    );
  }

  lines.push('');
  lines.push('## Execution Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Resolve workspace"] --> B["Inspect repository state"]');
  lines.push('  B --> C["Prepare feature branches"]');
  lines.push('  C --> D["Implement repo-scoped changes"]');
  lines.push('  D --> E["Run quality gates"]');
  lines.push('  E --> F["Promote to integration/production branches as needed"]');
  lines.push('  F --> G["Deploy to matching environments"]');
  lines.push('```');
  lines.push('');

  const sortedSteps = [...manifest.steps].sort(compareSteps);
  for (const stage of STEP_STAGE_ORDER) {
    const stageSteps = sortedSteps.filter((step) => step.stage === stage);
    if (stageSteps.length === 0) {
      continue;
    }
    lines.push(`## ${stage[0].toUpperCase()}${stage.slice(1)} Steps`);
    lines.push('');
    for (const step of stageSteps) {
      lines.push(...formatStep(step));
      lines.push('');
    }
  }

  lines.push('## Repository Details');
  lines.push('');
  for (const repo of manifest.repos) {
    lines.push(`### ${repo.repoName}`);
    lines.push('');
    lines.push(`- Repo path: \`${repo.repoPath}\``);
    lines.push(`- Runtime: \`${repo.runtime}\``);
    lines.push(`- Language: \`${repo.language}\``);
    lines.push(`- Base branch: \`${repo.baseBranch}\``);
    lines.push(`- Feature branch: \`${repo.featureBranch}\``);
    if (repo.integrationBranch) {
      lines.push(`- Integration branch: \`${repo.integrationBranch}\``);
    }
    if (repo.productionBranch) {
      lines.push(`- Production branch: \`${repo.productionBranch}\``);
    }
    lines.push(
      `- Quality gates: ${
        repo.qualityGates.length > 0
          ? repo.qualityGates.map((gate) => `\`${gate.key}\``).join(', ')
          : 'none declared'
      }`
    );
    lines.push(
      `- Deploy pathway: ${
        repo.deployTargets.length > 0
          ? repo.deployTargets
              .map((target) => `${target.environment} (\`${target.branch}\`)`)
              .join(', ')
          : 'no checked-in deploy targets'
      }`
    );
    if (repo.diagnostics.length > 0) {
      lines.push(`- Diagnostics: ${repo.diagnostics.join(' | ')}`);
    }
    lines.push('');
  }

  if (manifest.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const warning of manifest.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: npm run devflow:manifest -- --workspace <workspace-key> --feature <feature-name>'
    );
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(cli.workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  const manifest = buildExecutionManifest(discovery.config, cli.featureName);
  const generatedDir = resolve(ROOT, 'workspaces', cli.workspaceKey, 'generated');
  mkdirSync(generatedDir, { recursive: true });

  const slug = slugifyFeatureName(cli.featureName);
  const markdownPath = resolve(generatedDir, `${slug}.execution.md`);
  const jsonPath = resolve(generatedDir, `${slug}.execution.json`);

  writeFileSync(markdownPath, buildMarkdown(manifest));
  writeFileSync(jsonPath, JSON.stringify(manifest, null, 2));

  console.log(`Execution manifest written to: ${markdownPath}`);
  console.log(`Machine-readable execution manifest written to: ${jsonPath}`);

  if (manifest.warnings.length > 0) {
    console.log('Warnings were emitted; review before any repo mutation.');
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
