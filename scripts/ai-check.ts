import { spawnSync } from 'child_process';

interface CheckStep {
  name: string;
  command: string;
  args: string[];
}

const STEPS: CheckStep[] = [
  {
    name: 'validate:structure',
    command: 'npm',
    args: ['run', 'validate:structure'],
  },
  {
    name: 'check:ai-readiness',
    command: 'tsx',
    args: ['scripts/check-ai-readiness.ts'],
  },
  {
    name: 'check:test-plan',
    command: 'npm',
    args: ['run', 'check:test-plan'],
  },
  {
    name: 'check:safety',
    command: 'npm',
    args: ['run', 'check:safety'],
  },
  {
    name: 'check:lifecycle',
    command: 'npm',
    args: ['run', 'check:lifecycle'],
  },
  {
    name: 'check:layering',
    command: 'npm',
    args: ['run', 'check:layering'],
  },
];

function runStep(step: CheckStep): void {
  console.log('');
  console.log(`>>> ${step.name}`);
  console.log('');

  const result = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main(): void {
  console.log('AI Check');
  console.log('========');
  console.log('Running framework governance, lifecycle, and safety checks.');

  for (const step of STEPS) {
    runStep(step);
  }

  console.log('');
  console.log('AI check PASSED.');
}

main();
