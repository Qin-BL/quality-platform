import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { classifyFailure, FAILURE_CATEGORIES, type ClassifiedFailure } from './failure-classifier';
import {
  suggestHealingForFailure,
  type HealingSuggestion,
} from './healing-suggestion';

export interface FailureArtifactInput {
  testName: string;
  errorMessage: string;
  artifacts?: string[];
}

export interface HealingLoopResult {
  failures: ClassifiedFailure[];
  suggestions: HealingSuggestion[];
}

function readErrorContext(path: string): string {
  if (!existsSync(path)) {
    return '';
  }
  return readFileSync(path, 'utf-8');
}

export function analyzeFailureArtifacts(
  inputs: FailureArtifactInput[]
): HealingLoopResult {
  const failures = inputs.map((input) =>
    classifyFailure(input.testName, input.errorMessage, input.artifacts || [])
  );
  const suggestions = failures.map((failure) => suggestHealingForFailure(failure));

  return { failures, suggestions };
}

export function analyzeFailureContextFile(
  testName: string,
  contextFilePath: string,
  root?: string
): HealingLoopResult {
  const base = root ? resolve(root) : process.cwd();
  const path = resolve(base, contextFilePath);
  const contents = readErrorContext(path);

  return analyzeFailureArtifacts([
    {
      testName,
      errorMessage: contents || `No error context found at ${path}`,
      artifacts: [path],
    },
  ]);
}

export function formatHealingLoopResult(result: HealingLoopResult): string {
  const lines: string[] = ['Healing Loop Analysis', '====================', ''];

  if (result.failures.length === 0) {
    lines.push('No failures were provided.');
    return lines.join('\n');
  }

  for (const failure of result.failures) {
    const category = FAILURE_CATEGORIES[failure.type];
    const suggestion = result.suggestions.find((item) => item.testName === failure.testName);
    lines.push(`Test: ${failure.testName}`);
    lines.push(`  Category: ${failure.type}`);
    lines.push(`  Confidence: ${failure.confidence}`);
    lines.push(`  Description: ${category.description}`);
    lines.push(`  Root Cause: ${failure.rootCause}`);
    lines.push(`  Recommended Action: ${category.action}`);
    if (suggestion) {
      lines.push(`  Healing Fix Type: ${suggestion.fixType}`);
      lines.push(`  Healing Risk: ${suggestion.risk}`);
      lines.push(`  Healing Suggestion: ${suggestion.suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
