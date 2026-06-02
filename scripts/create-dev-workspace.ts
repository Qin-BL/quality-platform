import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedCli {
  workspaceKey?: string;
  displayName?: string;
  description?: string;
}

function parseCli(): ParsedCli {
  const args = process.argv.slice(2);
  const parsed: ParsedCli = {};

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === '--workspace' || arg === '--key') {
      parsed.workspaceKey = args[index + 1];
      index++;
      continue;
    }

    if (arg.startsWith('--workspace=')) {
      parsed.workspaceKey = arg.split('=')[1];
      continue;
    }

    if (arg === '--display-name') {
      parsed.displayName = args[index + 1];
      index++;
      continue;
    }

    if (arg.startsWith('--display-name=')) {
      parsed.displayName = arg.split('=')[1];
      continue;
    }

    if (arg === '--description') {
      parsed.description = args[index + 1];
      index++;
      continue;
    }

    if (arg.startsWith('--description=')) {
      parsed.description = arg.split('=')[1];
    }
  }

  return parsed;
}

function replacePlaceholdersInTree(
  dir: string,
  placeholders: Record<string, string>
): void {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      replacePlaceholdersInTree(fullPath, placeholders);
      continue;
    }

    if (entry.name.startsWith('.')) {
      continue;
    }

    let content = readFileSync(fullPath, 'utf-8');
    for (const [key, value] of Object.entries(placeholders)) {
      content = content.replaceAll(key, value);
    }
    writeFileSync(fullPath, content);

    if (entry.name.includes('.template.')) {
      renameSync(fullPath, fullPath.replace('.template.', '.'));
    }
  }
}

function slugToTitle(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function main(): void {
  const cli = parseCli();
  const workspaceKey = cli.workspaceKey;

  if (!workspaceKey) {
    console.error(
      'Usage: npm run create:workspace -- --workspace <workspace-key> [--display-name "..."] [--description "..."]'
    );
    process.exit(1);
  }

  const displayName = cli.displayName || slugToTitle(workspaceKey);
  const description =
    cli.description || `${displayName} AI development workspace`;

  const templateDir = resolve(ROOT, 'templates', 'workspace');
  const targetDir = resolve(ROOT, 'workspaces', workspaceKey);

  if (!existsSync(templateDir)) {
    console.error(`Workspace template directory not found: ${templateDir}`);
    process.exit(1);
  }

  if (existsSync(targetDir)) {
    console.error(`Workspace already exists at: ${targetDir}`);
    process.exit(1);
  }

  mkdirSync(targetDir, { recursive: true });
  cpSync(templateDir, targetDir, { recursive: true });
  mkdirSync(resolve(targetDir, 'generated'), { recursive: true });
  writeFileSync(resolve(targetDir, 'generated', '.gitkeep'), '');

  replacePlaceholdersInTree(targetDir, {
    '__WORKSPACE_KEY__': workspaceKey,
    '__WORKSPACE_DISPLAY_NAME__': displayName,
    '__WORKSPACE_DESCRIPTION__': description,
  });

  console.log(`Workspace created at: ${targetDir}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Fill in workspaces/${workspaceKey}/workspace.config.ts`);
  console.log(`  2. Add repo-specific context under workspaces/${workspaceKey}/context/`);
  console.log(`  3. Add repo-specific qualityGates and deployTargets in workspace.config.ts`);
  console.log(`  4. Run: npm run devflow:resolve -- --workspace ${workspaceKey}`);
  console.log(`  5. Run: npm run devflow:plan -- --workspace ${workspaceKey} --feature <feature-name>`);
  console.log(`  6. Run: npm run devflow:manifest -- --workspace ${workspaceKey} --feature <feature-name>`);
  console.log(`  7. Run: npm run devflow:run -- --workspace ${workspaceKey} --feature <feature-name> --stage preflight`);
}

main();
