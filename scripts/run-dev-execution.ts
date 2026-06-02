import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  discoverDevWorkspace,
  buildExecutionManifest,
  printSelectedExecutionSteps,
  runExecutionStep,
  selectExecutionSteps,
  type DevWorkspaceExecutionStepStage,
} from '../packages/devflow/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedCli {
  workspaceKey?: string;
  featureName?: string;
  repoKey?: string;
  stage?: DevWorkspaceExecutionStepStage;
  stepId?: string;
  apply: boolean;
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
    if (arg === '--repo') {
      parsed.repoKey = args[index + 1];
      index++;
      continue;
    }
    if (arg.startsWith('--repo=')) {
      parsed.repoKey = arg.split('=')[1];
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
    if (arg === '--step') {
      parsed.stepId = args[index + 1];
      index++;
      continue;
    }
    if (arg.startsWith('--step=')) {
      parsed.stepId = arg.split('=')[1];
      continue;
    }
    if (arg === '--apply') {
      parsed.apply = true;
    }
  }

  return parsed;
}

async function main(): Promise<void> {
  const cli = parseCli();
  if (!cli.workspaceKey || !cli.featureName) {
    console.error(
      'Usage: npm run devflow:run -- --workspace <workspace-key> --feature <feature-name> [--repo <repo-key>] [--stage <stage>] [--step <step-id>] [--apply]'
    );
    process.exit(1);
  }

  const discovery = await discoverDevWorkspace(cli.workspaceKey, ROOT);
  if (!discovery.exists || !discovery.config) {
    console.error('Workspace config not found or invalid.');
    process.exit(1);
  }

  const manifest = buildExecutionManifest(discovery.config, cli.featureName);
  const selectedSteps = selectExecutionSteps(manifest, {
    repoKey: cli.repoKey,
    stage: cli.stage,
    stepId: cli.stepId,
  });

  if (selectedSteps.length === 0) {
    console.error('No execution steps matched the provided filters.');
    process.exit(1);
  }

  printSelectedExecutionSteps(selectedSteps);

  for (const step of selectedSteps) {
    const result = runExecutionStep(manifest, step, {
      apply: cli.apply,
    });
    if (result.error && cli.apply && result.status !== 'manual_only') {
      throw new Error(result.error);
    }
    if (result.status === 'manual_only' && cli.apply && step.blocking) {
      throw new Error(
        `Blocking step ${step.id} is not auto-executable yet. Narrow your selection or extend the framework.`
      );
    }
  }

  console.log('');
  console.log(cli.apply ? 'Execution run completed.' : 'Dry-run completed.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
