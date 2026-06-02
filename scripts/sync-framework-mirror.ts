import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { discoverDevWorkspace } from '../packages/devflow/index.ts';

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

function ensureParentDir(targetPath: string): void {
  mkdirSync(resolve(targetPath, '..'), { recursive: true });
}

async function main(): Promise<void> {
  const workspaceKey = parseWorkspaceKey();
  if (!workspaceKey) {
    console.error('Usage: npm run devflow:mirror -- --workspace <workspace-key>');
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  const mirror = discovery.config.frameworkMirror;
  const mirrorRoot = discovery.config.absoluteFrameworkMirrorPath;

  if (!mirror || !mirrorRoot) {
    console.error('No framework mirror is configured for this workspace.');
    process.exit(1);
  }

  console.log(`Mirroring framework files to: ${mirrorRoot}`);

  for (const relativePath of mirror.includePaths) {
    const sourcePath = resolve(ROOT, relativePath);
    const targetPath = resolve(mirrorRoot, relativePath);

    if (!existsSync(sourcePath)) {
      console.error(`Missing source path: ${sourcePath}`);
      process.exit(1);
    }

    ensureParentDir(targetPath);
    rmSync(targetPath, { recursive: true, force: true });
    cpSync(sourcePath, targetPath, { recursive: true });
    console.log(`  synced: ${relativePath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
