import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildAgentSessionBundle,
  slugifyFeatureName,
  type DevWorkspaceExecutionManifest,
  type DevWorkspaceImplementationPacketBundle,
  type DevWorkspacePatchDraftBundle,
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

function buildIndexMarkdown(
  sessionsDirName: string,
  bundle: ReturnType<typeof buildAgentSessionBundle>
): string {
  const lines: string[] = [];
  lines.push(`# ${bundle.workspaceName} Agent Sessions`);
  lines.push('');
  lines.push(`- Workspace key: \`${bundle.workspaceKey}\``);
  lines.push(`- Feature: \`${bundle.featureName}\``);
  lines.push(`- Generated at: \`${bundle.generatedAt}\``);
  if (bundle.objective) {
    lines.push(`- Objective: ${bundle.objective}`);
  }
  lines.push('');
  lines.push('## Session Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Work orders"] --> B["Implementation packets"]');
  lines.push('  B --> C["Patch drafts"]');
  lines.push('  C --> D["Agent session specs"]');
  lines.push('  D --> E["Agent implementation session"]');
  lines.push('  E --> F["Verification and handoff"]');
  lines.push('```');
  lines.push('');
  lines.push('| Repo | Ready | Session Markdown | Session JSON |');
  lines.push('| --- | --- | --- | --- |');
  for (const session of bundle.sessions) {
    lines.push(
      `| ${session.repoName} | ${session.readyForSessionLaunch ? 'yes' : 'manual review'} | \`${sessionsDirName}/${session.repoKey}.session.md\` | \`${sessionsDirName}/${session.repoKey}.json\` |`
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: node --experimental-strip-types scripts/generate-dev-agent-sessions.ts --workspace <workspace-key> --feature <feature-name>'
    );
    process.exit(1);
  }

  const generatedDir = resolve(ROOT, 'workspaces', cli.workspaceKey, 'generated');
  const slug = slugifyFeatureName(cli.featureName);

  const workOrders = loadJsonFile<DevWorkspaceWorkOrderPacket>(
    resolve(generatedDir, `${slug}.work-orders`, 'index.json')
  );
  const implementationPackets =
    loadJsonFile<DevWorkspaceImplementationPacketBundle>(
      resolve(generatedDir, `${slug}.implementation-packets`, 'index.json')
    );
  const patchDrafts = loadJsonFile<DevWorkspacePatchDraftBundle>(
    resolve(generatedDir, `${slug}.patch-drafts`, 'index.json')
  );
  const executionManifest = loadJsonFile<DevWorkspaceExecutionManifest>(
    resolve(generatedDir, `${slug}.execution.json`)
  );

  const bundle = buildAgentSessionBundle(
    workOrders,
    implementationPackets,
    patchDrafts,
    executionManifest
  );

  const sessionsDirName = `${slug}.agent-sessions`;
  const sessionsDir = resolve(generatedDir, sessionsDirName);
  mkdirSync(sessionsDir, { recursive: true });

  for (const session of bundle.sessions) {
    writeFileSync(
      resolve(sessionsDir, `${session.repoKey}.json`),
      JSON.stringify(session, null, 2)
    );
    writeFileSync(
      resolve(sessionsDir, `${session.repoKey}.session.md`),
      session.sessionMarkdown
    );
    writeFileSync(
      resolve(sessionsDir, `${session.repoKey}.prompt.txt`),
      session.sessionPrompt
    );
  }

  writeFileSync(resolve(sessionsDir, 'index.json'), JSON.stringify(bundle, null, 2));
  writeFileSync(
    resolve(sessionsDir, 'index.md'),
    buildIndexMarkdown(sessionsDirName, bundle)
  );

  console.log(`Agent sessions written to: ${sessionsDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
