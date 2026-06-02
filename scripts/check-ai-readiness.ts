import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { AI_TASK_REQUIRED_OUTPUTS, AI_TASK_REQUIRED_READ_ORDER } from '../packages/ai/ai-task-contract';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const REQUIRED_PATHS = [
  'AGENTS.md',
  'skills/qc/SKILL.md',
  'packages/ai/ai-task-contract.md',
  'packages/ai/ai-task-contract.ts',
  'packages/ai/missing-inputs.ts',
  'packages/ai/ai-task-state-machine.md',
  'packages/ai/simple-usage-guide.md',
  'templates/project',
  'packages/project',
  'packages/auth',
  'packages/mcp/runtime.ts',
  'packages/healing/healing-loop.ts',
];

function main(): void {
  console.log('AI Readiness Check');
  console.log('===================');

  let ok = true;

  for (const relativePath of REQUIRED_PATHS) {
    const exists = existsSync(resolve(ROOT, relativePath));
    console.log(`  ${exists ? '✅' : '❌'} ${relativePath}`);
    if (!exists) {
      ok = false;
    }
  }

  console.log('');
  console.log(`  ✅ ai-task read order: ${AI_TASK_REQUIRED_READ_ORDER.length} entries`);
  console.log(`  ✅ ai-task outputs: ${AI_TASK_REQUIRED_OUTPUTS.length} entries`);
  console.log('');

  if (!ok) {
    console.log('❌ AI readiness check FAILED.');
    process.exit(1);
  }

  console.log(
    '✅ AI readiness check PASSED — governance, discovery, auth, missing-input handling, and runtime foundations are present.'
  );
}

main();
