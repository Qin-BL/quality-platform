import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  buildExecutionManifest,
  discoverDevWorkspace,
  orderExecutionSteps,
  printSelectedExecutionSteps,
  runExecutionStep,
  selectExecutionSteps,
  type DevWorkspaceExecutionStepStage,
  type ExecutionStepResult,
} from '../packages/devflow/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedCli {
  workspaceKey?: string;
  featureName?: string;
  stage?: DevWorkspaceExecutionStepStage;
  repoKey?: string;
  apply: boolean;
}

interface ExecutionCheckpoint {
  generatedAt: string;
  workspaceKey: string;
  featureName: string;
  stageFilter?: DevWorkspaceExecutionStepStage;
  repoFilter?: string;
  apply: boolean;
  results: ExecutionStepResult[];
  blockedSteps: string[];
  failedSteps: string[];
}

const VALID_STAGES: DevWorkspaceExecutionStepStage[] = [
  'preflight',
  'branching',
  'implementation',
  'verification',
  'promotion',
  'deployment',
];

function parseCli(): ParsedCli {
  const args = process.argv.slice(2);
  const parsed: ParsedCli = { apply: false };

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
      continue;
    }
    if (arg === '--stage') {
      const value = args[index + 1] as DevWorkspaceExecutionStepStage;
      if (VALID_STAGES.includes(value)) {
        parsed.stage = value;
      }
      index++;
      continue;
    }
    if (arg.startsWith('--stage=')) {
      const value = arg.split('=')[1] as DevWorkspaceExecutionStepStage;
      if (VALID_STAGES.includes(value)) {
        parsed.stage = value;
      }
      continue;
    }
    if (arg === '--repo') {
      parsed.repoKey = args[index + 1];
      index++;
      continue;
    }
    if (arg.startsWith('--repo=')) {
      parsed.repoKey = arg.split('=')[1];
      continue;
    }
    if (arg === '--apply') {
      parsed.apply = true;
    }
  }

  return parsed;
}

function writeCheckpoint(
  workspaceKey: string,
  featureName: string,
  checkpoint: ExecutionCheckpoint
): string {
  const generatedDir = resolve(ROOT, 'workspaces', workspaceKey, 'generated');
  mkdirSync(generatedDir, { recursive: true });
  const checkpointPath = resolve(
    generatedDir,
    `${featureName}.checkpoint.json`
  );
  writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
  return checkpointPath;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName || !cli.stage) {
    console.error(
      'Usage: npm run devflow:orchestrate -- --workspace <workspace-key> --feature <feature-name> --stage <stage> [--repo <repo-key>] [--apply]'
    );
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(cli.workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  const manifest = buildExecutionManifest(discovery.config, cli.featureName);
  const selected = selectExecutionSteps(manifest, {
    stage: cli.stage,
    repoKey: cli.repoKey,
  });

  if (selected.length === 0) {
    console.error('No execution steps matched the requested orchestration scope.');
    process.exit(1);
  }

  const ordered = orderExecutionSteps(manifest, selected);
  printSelectedExecutionSteps(ordered);

  const completed = new Set<string>();
  const results: ExecutionStepResult[] = [];
  const blockedSteps: string[] = [];
  const failedSteps: string[] = [];

  for (const step of ordered) {
    const unmetDependencies = step.dependsOn.filter(
      (dependency) =>
        ordered.some((candidate) => candidate.id === dependency) &&
        !completed.has(dependency)
    );

    if (unmetDependencies.length > 0) {
      console.log('');
      console.log(
        `[${step.repoKey}] ${step.title} blocked by unmet dependencies: ${unmetDependencies.join(', ')}`
      );
      blockedSteps.push(step.id);
      results.push({
        stepId: step.id,
        repoKey: step.repoKey,
        stage: step.stage,
        kind: step.kind,
        status: 'skipped',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        notes: [`Skipped because dependencies were not completed: ${unmetDependencies.join(', ')}`],
      });
      continue;
    }

    const result = runExecutionStep(manifest, step, {
      apply: cli.apply,
    });
    results.push(result);

    if (result.status === 'success' || result.status === 'dry_run') {
      completed.add(step.id);
      continue;
    }

    if (result.status === 'manual_only') {
      blockedSteps.push(step.id);
      if (cli.apply && step.blocking) {
        break;
      }
      continue;
    }

    if (result.status === 'failed') {
      failedSteps.push(step.id);
      break;
    }
  }

  const checkpoint: ExecutionCheckpoint = {
    generatedAt: new Date().toISOString(),
    workspaceKey: cli.workspaceKey,
    featureName: cli.featureName,
    stageFilter: cli.stage,
    repoFilter: cli.repoKey,
    apply: cli.apply,
    results,
    blockedSteps,
    failedSteps,
  };

  const checkpointPath = writeCheckpoint(
    cli.workspaceKey,
    cli.featureName,
    checkpoint
  );

  console.log('');
  console.log(`Checkpoint written to: ${checkpointPath}`);

  if (failedSteps.length > 0) {
    console.error(`Execution failed at step(s): ${failedSteps.join(', ')}`);
    process.exit(1);
  }

  if (blockedSteps.length > 0 && cli.apply) {
    console.error(`Execution stopped at manual/blocking step(s): ${blockedSteps.join(', ')}`);
    process.exit(1);
  }

  console.log(cli.apply ? 'Orchestration completed.' : 'Orchestration dry-run completed.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
