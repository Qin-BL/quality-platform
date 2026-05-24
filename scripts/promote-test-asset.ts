import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

type LifecycleStage = 'generated' | 'reviewed' | 'promoted' | 'deprecated';

const VALID_TRANSITIONS: Record<LifecycleStage, LifecycleStage[]> = {
  generated: ['reviewed'],
  reviewed: ['promoted', 'deprecated'],
  promoted: ['deprecated'],
  deprecated: [],
};

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
  const source = getArgValue('source');
  const target = getArgValue('target');
  const reviewedSource = getArgValue('reviewed-source');

  console.log('Promote Test Asset');
  console.log('==================');

  if (!source || !target) {
    console.log('Usage: npm run promote:test-asset -- --source generated/<name> --target reviewed');
    process.exit(1);
  }

  const sourceStage = source.split('/')[0] as LifecycleStage;
  const targetStage = target as LifecycleStage;

  if (!VALID_TRANSITIONS[sourceStage]?.includes(targetStage)) {
    console.log(`Invalid lifecycle transition: ${sourceStage} -> ${targetStage}`);
    process.exit(1);
  }

  if (sourceStage === 'generated' && targetStage === 'promoted') {
    console.log('Generated assets cannot be promoted directly.');
    process.exit(1);
  }

  if (targetStage === 'promoted' && !reviewedSource) {
    console.log('Promoted assets must reference a reviewed source via --reviewed-source.');
    process.exit(1);
  }

  const sourcePath = resolve(ROOT, 'test-assets', source);
  if (!existsSync(sourcePath)) {
    console.log(`Source asset not found: ${sourcePath}`);
    process.exit(1);
  }

  console.log(`Lifecycle transition validated: ${sourceStage} -> ${targetStage}`);
  if (reviewedSource) {
    console.log(`Reviewed source reference: ${reviewedSource}`);
  }
  console.log('Phase 1 note: the framework validates promotion intent and governance, not file moves.');
}

main();
