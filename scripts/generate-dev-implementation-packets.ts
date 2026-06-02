import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildImplementationPackets,
  discoverDevWorkspace,
  slugifyFeatureName,
  type DevWorkspaceTaskBundle,
  type DevWorkspaceWorkOrderPacket,
  type RepoSurfaceDeclaration,
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

function surfaceMapFromWorkspace(
  workspace: Awaited<ReturnType<typeof discoverDevWorkspace>>['config']
): Record<string, RepoSurfaceDeclaration[]> {
  if (!workspace) {
    return {};
  }

  const entries = workspace.repos.map((repo) => [
    repo.key,
    (repo.changeSurfaces || []).map((surface) => ({
      surfaceKey: surface.key,
      surfaceLabel: surface.label,
      paths: surface.paths,
    })),
  ]);

  return Object.fromEntries(entries);
}

function buildIndexMarkdown(
  workspaceKey: string,
  featureName: string,
  objective: string | undefined,
  packetsDirName: string,
  packet: ReturnType<typeof buildImplementationPackets>
): string {
  const lines: string[] = [];
  lines.push(`# ${packet.workspaceName} Implementation Packets`);
  lines.push('');
  lines.push(`- Workspace key: \`${workspaceKey}\``);
  lines.push(`- Feature: \`${featureName}\``);
  if (objective) {
    lines.push(`- Objective: ${objective}`);
  }
  lines.push(`- Generated at: \`${packet.generatedAt}\``);
  lines.push('');
  lines.push('## Packet Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Work orders"] --> B["Candidate file discovery"]');
  lines.push('  B --> C["Implementation packets"]');
  lines.push('  C --> D["Patch plan templates"]');
  lines.push('  D --> E["Repo-local agent execution"]');
  lines.push('```');
  lines.push('');
  lines.push('| Repo | Ready | Packet JSON | Patch Plan | Prompt |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const repo of packet.repos) {
    lines.push(
      `| ${repo.repoName} | ${repo.readyForDrafting ? 'yes' : 'manual review'} | \`${packetsDirName}/${repo.repoKey}.json\` | \`${packetsDirName}/${repo.repoKey}.patch-plan.md\` | \`${packetsDirName}/${repo.repoKey}.prompt.txt\` |`
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: node --experimental-strip-types scripts/generate-dev-implementation-packets.ts --workspace <workspace-key> --feature <feature-name>'
    );
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(cli.workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  const generatedDir = resolve(ROOT, 'workspaces', cli.workspaceKey, 'generated');
  const slug = slugifyFeatureName(cli.featureName);
  const taskBundlePath = resolve(generatedDir, `${slug}.task-bundle.json`);
  const workOrderPath = resolve(generatedDir, `${slug}.work-orders`, 'index.json');

  const taskBundle = loadJsonFile<DevWorkspaceTaskBundle>(taskBundlePath);
  const workOrders = loadJsonFile<DevWorkspaceWorkOrderPacket>(workOrderPath);
  const surfaceMap = surfaceMapFromWorkspace(discovery.config);
  const packet = buildImplementationPackets(taskBundle, workOrders, surfaceMap);

  const packetsDirName = `${slug}.implementation-packets`;
  const packetsDir = resolve(generatedDir, packetsDirName);
  mkdirSync(packetsDir, { recursive: true });

  for (const repo of packet.repos) {
    writeFileSync(
      resolve(packetsDir, `${repo.repoKey}.json`),
      JSON.stringify(repo, null, 2)
    );
    writeFileSync(
      resolve(packetsDir, `${repo.repoKey}.prompt.txt`),
      `${repo.executionPrompt}\n`
    );
    writeFileSync(
      resolve(packetsDir, `${repo.repoKey}.patch-plan.md`),
      repo.patchPlanTemplate
    );
  }

  writeFileSync(
    resolve(packetsDir, 'index.json'),
    JSON.stringify(packet, null, 2)
  );
  writeFileSync(
    resolve(packetsDir, 'index.md'),
    buildIndexMarkdown(
      cli.workspaceKey,
      cli.featureName,
      taskBundle.objective,
      packetsDirName,
      packet
    )
  );

  console.log(`Implementation packets written to: ${packetsDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
