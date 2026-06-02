import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { resolveContextPaths, resolveGeneratedTestPlanDir } from '../packages/project/project-discovery';
import {
  createMissingInput,
  createMissingInputState,
  writeMissingInputState,
} from '../packages/ai/missing-inputs';

dotenvConfig();

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

function main(): void {
  const projectKey = getProjectKey();

  console.log('Generate Test Plan');
  console.log('==================');

  if (!projectKey) {
    console.log('Usage: npm run generate:test-plan -- --project <project-key>');
    const state = createMissingInputState(
      'generate_test_plan',
      process.env.TEST_ENV || 'local',
      '',
      'project-key-detection',
      [
        createMissingInput(
          'project_key',
          'Which project key should be used to generate the test plan?',
          'No project key was provided.',
          'project-space-check'
        ),
      ]
    );
    console.log(`Resume state written to: ${writeMissingInputState(state, ROOT)}`);
    process.exit(1);
  }

  const projectRoot = resolve(ROOT, 'projects', projectKey);
  if (!existsSync(projectRoot)) {
    console.log(`Project '${projectKey}' does not exist. Run create:project first.`);
    const state = createMissingInputState(
      'generate_test_plan',
      process.env.TEST_ENV || 'local',
      '',
      'project-space-create',
      [
        createMissingInput(
          'project_space',
          `Project '${projectKey}' does not exist yet. Should the framework create it now?`,
          'The target project space is missing.',
          'project-space-create'
        ),
      ],
      projectKey
    );
    console.log(`Resume state written to: ${writeMissingInputState(state, ROOT)}`);
    process.exit(1);
  }

  const targetDir = resolveGeneratedTestPlanDir(projectKey, ROOT);
  const targetPath = resolve(
    targetDir,
    `${projectKey}-draft-test-plan-${new Date().toISOString().slice(0, 10)}.md`
  );
  const templatePath = resolve(ROOT, 'templates', 'test-plan.template.md');
  const template = readFileSync(templatePath, 'utf-8').replace(/__PROJECT_KEY__/g, projectKey);
  const contextPaths = resolveContextPaths(projectKey, ROOT);
  const existingContextPaths = contextPaths.filter((contextPath) => existsSync(contextPath));

  mkdirSync(targetDir, { recursive: true });

  if (existingContextPaths.length === 0) {
    const state = createMissingInputState(
      'generate_test_plan',
      process.env.TEST_ENV || 'local',
      '',
      'context-read',
      [
        createMissingInput(
          'context',
          `Which context files or product notes should inform the test plan for '${projectKey}'?`,
          'No context files were found for the project.',
          'context-read',
          { suggestedSources: contextPaths }
        ),
      ],
      projectKey
    );
    console.log(`Resume state written to: ${writeMissingInputState(state, ROOT)}`);
  }

  const content = [
    template,
    '',
    '## Context Inputs',
    ...contextPaths.map((contextPath) => `- ${contextPath.replace(`${ROOT}/`, '')}`),
    '',
    '## Governance Notes',
    '- This is a generated draft test plan.',
    '- Human review is required before long-term tests can be generated.',
    '- Unclear business rules must remain open questions.',
  ].join('\n');

  writeFileSync(targetPath, content);

  console.log(`Generated test plan draft: ${targetPath}`);
}

main();
