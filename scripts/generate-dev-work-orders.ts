import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildWorkOrderPacket,
  slugifyFeatureName,
  type DevWorkspaceTaskBundle,
  type DevWorkspaceWorkOrderPacket,
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

function loadJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function buildIndexMarkdown(packet: DevWorkspaceWorkOrderPacket): string {
  const lines: string[] = [];
  lines.push(`# ${packet.workspaceName} Work Orders`);
  lines.push('');
  lines.push(`- Workspace key: \`${packet.workspaceKey}\``);
  lines.push(`- Feature: \`${packet.featureName}\``);
  lines.push(`- Generated at: \`${packet.generatedAt}\``);
  if (packet.objective) {
    lines.push(`- Objective: ${packet.objective}`);
  }
  lines.push('');
  lines.push('## Work Order Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Task bundle"] --> B["Repo work orders"]');
  lines.push('  B --> C["Per-repo prompt artifacts"]');
  lines.push('  C --> D["Agent execution session"]');
  lines.push('  D --> E["Patch / validation / handoff"]');
  lines.push('```');
  lines.push('');
  lines.push('| Repo | Branch | Ready | Prompt Artifact | JSON Artifact |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const repo of packet.repos) {
    lines.push(
      `| ${repo.repoName} | \`${repo.branch}\` | ${repo.readyForAgentExecution ? 'yes' : 'manual review'} | \`${repo.promptPath}\` | \`${repo.jsonPath}\` |`
    );
  }
  lines.push('');
  for (const repo of packet.repos) {
    lines.push(`## ${repo.repoName}`);
    lines.push('');
    lines.push(`- Repo path: \`${repo.repoPath}\``);
    lines.push(`- Branch: \`${repo.branch}\``);
    lines.push(`- Summary: ${repo.summary}`);
    lines.push(`- Prompt artifact: \`${repo.promptPath}\``);
    lines.push(`- JSON artifact: \`${repo.jsonPath}\``);
    lines.push(`- Ready for agent execution: ${repo.readyForAgentExecution ? 'yes' : 'no'}`);
    if (repo.manualBlockers.length > 0) {
      lines.push(`- Manual blockers: ${repo.manualBlockers.join('; ')}`);
    }
    lines.push(`- Suggested outputs: ${repo.suggestedOutputs.join('; ')}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: node --experimental-strip-types scripts/generate-dev-work-orders.ts --workspace <workspace-key> --feature <feature-name>'
    );
    process.exit(1);
  }

  const generatedDir = resolve(ROOT, 'workspaces', cli.workspaceKey, 'generated');
  const slug = slugifyFeatureName(cli.featureName);
  const bundlePath = resolve(generatedDir, `${slug}.task-bundle.json`);
  const bundle = loadJsonFile<DevWorkspaceTaskBundle>(bundlePath);

  const outputDirectoryName = `${slug}.work-orders`;
  const outputDirectory = resolve(generatedDir, outputDirectoryName);
  mkdirSync(outputDirectory, { recursive: true });

  const { packet, repoArtifacts } = buildWorkOrderPacket(bundle, outputDirectoryName);

  for (const artifact of repoArtifacts) {
    writeFileSync(
      resolve(outputDirectory, `${artifact.repoKey}.prompt.txt`),
      `${artifact.prompt}\n`
    );
    writeFileSync(
      resolve(outputDirectory, `${artifact.repoKey}.json`),
      JSON.stringify(artifact, null, 2)
    );
  }

  const indexJsonPath = resolve(outputDirectory, 'index.json');
  const indexMarkdownPath = resolve(outputDirectory, 'index.md');
  writeFileSync(indexJsonPath, JSON.stringify(packet, null, 2));
  writeFileSync(indexMarkdownPath, buildIndexMarkdown(packet));

  console.log(`Work orders written to: ${outputDirectory}`);
  console.log(`Index JSON written to: ${indexJsonPath}`);
  console.log(`Index Markdown written to: ${indexMarkdownPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
