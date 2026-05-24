import { classifyFailure, FAILURE_CATEGORIES } from '../packages/healing/failure-classifier';
import { suggestHealingForFailure } from '../packages/healing/healing-suggestion';

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
  const testName = getArgValue('test') || 'unknown.spec.ts';
  const errorMessage = getArgValue('error') || 'Unknown failure';

  console.log('Failure Classification');
  console.log('======================');

  const failure = classifyFailure(testName, errorMessage);
  const category = FAILURE_CATEGORIES[failure.type];
  const suggestion = suggestHealingForFailure(failure);

  console.log(`Test: ${failure.testName}`);
  console.log(`Type: ${failure.type}`);
  console.log(`Confidence: ${failure.confidence}`);
  console.log(`Description: ${category.description}`);
  console.log(`Root Cause: ${failure.rootCause}`);
  console.log(`Recommended Action: ${category.action}`);
  console.log('');
  console.log('Healing Suggestion');
  console.log(`  Fix Type: ${suggestion.fixType}`);
  console.log(`  Risk: ${suggestion.risk}`);
  console.log(`  Suggestion: ${suggestion.suggestion}`);
}

main();
