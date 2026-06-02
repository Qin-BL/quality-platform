import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildPatchDraftBundle,
  slugifyFeatureName,
  type DevWorkspaceImplementationPacketBundle,
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
  draftsDirName: string,
  bundle: ReturnType<typeof buildPatchDraftBundle>
): string {
  const lines: string[] = [];
  lines.push(`# ${bundle.workspaceName} Patch Drafts`);
  lines.push('');
  lines.push(`- Workspace key: \`${bundle.workspaceKey}\``);
  lines.push(`- Feature: \`${bundle.featureName}\``);
  lines.push(`- Generated at: \`${bundle.generatedAt}\``);
  if (bundle.objective) {
    lines.push(`- Objective: ${bundle.objective}`);
  }
  lines.push('');
  lines.push('## Draft Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  A["Implementation packets"] --> B["Patch draft bundle"]');
  lines.push('  B --> C["Repo draft markdown"]');
  lines.push('  C --> D["Agent fills concrete edits"]');
  lines.push('  D --> E["Apply patch / verify"]');
  lines.push('```');
  lines.push('');
  lines.push('| Repo | Ready | Draft Markdown | JSON |');
  lines.push('| --- | --- | --- | --- |');
  for (const repo of bundle.repos) {
    lines.push(
      `| ${repo.repoName} | ${repo.readyForDrafting ? 'yes' : 'manual review'} | \`${draftsDirName}/${repo.repoKey}.draft.md\` | \`${draftsDirName}/${repo.repoKey}.json\` |`
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: node --experimental-strip-types scripts/generate-dev-patch-drafts.ts --workspace <workspace-key> --feature <feature-name>'
    );
    process.exit(1);
  }

  const generatedDir = resolve(ROOT, 'workspaces', cli.workspaceKey, 'generated');
  const slug = slugifyFeatureName(cli.featureName);
  const packetsPath = resolve(
    generatedDir,
    `${slug}.implementation-packets`,
    'index.json'
  );
  const implementationPackets =
    loadJsonFile<DevWorkspaceImplementationPacketBundle>(packetsPath);
  const bundle = buildPatchDraftBundle(implementationPackets);

  const draftsDirName = `${slug}.patch-drafts`;
  const draftsDir = resolve(generatedDir, draftsDirName);
  mkdirSync(draftsDir, { recursive: true });

  for (const repo of bundle.repos) {
    writeFileSync(
      resolve(draftsDir, `${repo.repoKey}.json`),
      JSON.stringify(repo, null, 2)
    );
    writeFileSync(
      resolve(draftsDir, `${repo.repoKey}.draft.md`),
      repo.draftMarkdown
    );
  }

  writeFileSync(resolve(draftsDir, 'index.json'), JSON.stringify(bundle, null, 2));
  writeFileSync(
    resolve(draftsDir, 'index.md'),
    buildIndexMarkdown(draftsDirName, bundle)
  );

  console.log(`Patch drafts written to: ${draftsDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
