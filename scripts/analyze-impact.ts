import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { resolveContextPaths } from '../packages/project/project-discovery';

dotenvConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getArgValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    if (args[index] === `--${name}`) {
      return args[index + 1];
    }
    if (args[index].startsWith(`--${name}=`)) {
      return args[index].split('=')[1];
    }
  }
  return undefined;
}

function main(): void {
  const projectKey = getArgValue('project') || getArgValue('key') || process.env.PROJECT_KEY;
  const requestId = getArgValue('request') || process.env.REQUEST_ID || 'manual-request';

  console.log('Impact Analysis');
  console.log('===============');

  if (!projectKey) {
    console.log('Usage: npm run analyze:impact -- --project <project-key> [--request <request-id>]');
    process.exit(1);
  }

  const projectRoot = resolve(ROOT, 'projects', projectKey);
  if (!existsSync(projectRoot)) {
    console.log(`Project '${projectKey}' does not exist. Run create:project first.`);
    process.exit(1);
  }

  const contextPaths = resolveContextPaths(projectKey, ROOT);
  const templatePath = resolve(ROOT, 'templates', 'impact-analysis.template.md');
  const targetDir = resolve(ROOT, 'requests', 'analyzed');
  const targetPath = resolve(targetDir, `${projectKey}-${requestId}-impact-analysis.md`);

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const template = readFileSync(templatePath, 'utf-8')
    .replace(/__PROJECT_KEY__/g, projectKey)
    .replace(/__REQUEST_ID__/g, requestId);

  const content = [
    template,
    '',
    '## Context Files Considered',
    ...contextPaths.map((contextPath) => `- ${contextPath.replace(`${ROOT}/`, '')}`),
    '',
    '## Notes',
    '- Framework-generated draft. Human review is still required.',
    '- No business assertions, selectors, endpoints, or secrets are invented here.',
  ].join('\n');

  writeFileSync(targetPath, content);

  console.log(`Impact analysis draft created: ${targetPath}`);
}

main();
