import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getProjectKey(): string | undefined {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--project' || args[index] === '--key') {
      return args[index + 1];
    }

    if (args[index].startsWith('--project=')) {
      return args[index].split('=')[1];
    }

    if (args[index].startsWith('--key=')) {
      return args[index].split('=')[1];
    }
  }

  return process.env.PROJECT_KEY;
}

function replacePlaceholdersInTree(dir: string, projectKey: string): void {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      replacePlaceholdersInTree(fullPath, projectKey);
      continue;
    }

    if (entry.name.startsWith('.')) {
      continue;
    }

    const content = readFileSync(fullPath, 'utf-8')
      .replace(/__PROJECT_KEY__/g, projectKey)
      .replace(/__PROJECT_DISPLAY_NAME__/g, projectKey)
      .replace(/\{\{PROJECT_KEY\}\}/g, projectKey);

    writeFileSync(fullPath, content);

    if (entry.name.includes('.template.')) {
      const renamed = fullPath.replace('.template.', '.');
      renameSync(fullPath, renamed);
    }
  }
}

function main(): void {
  const projectKey = getProjectKey();

  if (!projectKey) {
    console.error('Usage: npm run create:project -- --project <project-key>');
    console.error('   or: PROJECT_KEY=<project-key> npm run create:project');
    process.exit(1);
  }

  const templateDir = resolve(ROOT, 'templates', 'project');
  const targetDir = resolve(ROOT, 'projects', projectKey);

  if (!existsSync(templateDir)) {
    console.error(`Template directory not found: ${templateDir}`);
    process.exit(1);
  }

  if (existsSync(targetDir)) {
    console.error(`Project space "${projectKey}" already exists at: ${targetDir}`);
    console.error('Cowardly refusing to overwrite. Delete it first if you want to recreate.');
    process.exit(1);
  }

  cpSync(templateDir, targetDir, { recursive: true });
  replacePlaceholdersInTree(targetDir, projectKey);

  console.log(`Project space created at: ${targetDir}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Fill in context documents under projects/${projectKey}/context/`);
  console.log(`  2. Run: npm run project:resolve -- --project ${projectKey}`);
  console.log(`  3. Run: npm run generate:test-plan -- --project ${projectKey}`);
  console.log('  4. Review the generated test plan before generating long-term tests.');
}

main();
