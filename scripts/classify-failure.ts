import {
  analyzeFailureArtifacts,
  analyzeFailureContextFile,
  formatHealingLoopResult,
} from '../packages/healing/healing-loop';

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
  const contextFile = getArgValue('context-file');

  console.log('Failure Classification');
  console.log('======================');

  const result = contextFile
    ? analyzeFailureContextFile(testName, contextFile)
    : analyzeFailureArtifacts([{ testName, errorMessage }]);

  console.log(formatHealingLoopResult(result));
}

main();
