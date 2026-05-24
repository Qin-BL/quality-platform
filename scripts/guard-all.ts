import { spawnSync } from 'child_process';

const STEPS = [
  {
    name: 'typecheck',
    command: 'npm',
    args: ['run', 'typecheck'],
  },
  {
    name: 'ai:check',
    command: 'npm',
    args: ['run', 'ai:check'],
  },
  {
    name: 'guard:production',
    command: 'npm',
    args: ['run', 'guard:production'],
  },
] as const;

function runStep(
  name: string,
  command: string,
  args: readonly string[]
): void {
  console.log('');
  console.log(`>>> ${name}`);
  console.log('');

  const result = spawnSync(command, [...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main(): void {
  console.log('Guard All');
  console.log('=========');
  console.log('Running the full Phase 1 verification chain.');

  for (const step of STEPS) {
    runStep(step.name, step.command, step.args);
  }

  console.log('');
  console.log('All guards PASSED.');
}

main();
