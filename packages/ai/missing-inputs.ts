import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import type { QCCommandIntent } from '../project/qc-command-parser';

export type MissingInputKey =
  | 'project_key'
  | 'project_space'
  | 'context'
  | 'reviewed_test_plan'
  | 'auth_login_url'
  | 'auth_credentials'
  | 'auth_state'
  | 'environment'
  | 'app_map'
  | 'test_data'
  | 'mcp_target'
  | 'unit_test_gate'
  | 'custom';

export interface MissingInput {
  key: MissingInputKey;
  label: string;
  question: string;
  reason: string;
  sensitive: boolean;
  resumeStep: string;
  suggestedSources: string[];
}

export interface MissingInputState {
  taskId: string;
  intent: QCCommandIntent | 'unknown';
  projectKey?: string;
  environment: string;
  rawRequest: string;
  nextStep: string;
  status: 'blocked' | 'resolved';
  missingInputs: MissingInput[];
  createdAt: string;
  updatedAt: string;
}

export function createMissingInput(
  key: MissingInputKey,
  question: string,
  reason: string,
  resumeStep: string,
  options?: {
    label?: string;
    sensitive?: boolean;
    suggestedSources?: string[];
  }
): MissingInput {
  return {
    key,
    label: options?.label || key,
    question,
    reason,
    sensitive: options?.sensitive ?? false,
    resumeStep,
    suggestedSources: options?.suggestedSources ?? [],
  };
}

export function createMissingInputState(
  intent: QCCommandIntent | 'unknown',
  environment: string,
  rawRequest: string,
  nextStep: string,
  missingInputs: MissingInput[],
  projectKey?: string
): MissingInputState {
  const timestamp = new Date().toISOString();
  return {
    taskId: `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    intent,
    projectKey,
    environment,
    rawRequest,
    nextStep,
    status: 'blocked',
    missingInputs,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getMissingInputStatePath(taskId: string, root?: string): string {
  const base = root ? resolve(root) : process.cwd();
  return resolve(base, 'requests', 'incoming', `${taskId}.missing-inputs.json`);
}

export function writeMissingInputState(
  state: MissingInputState,
  root?: string
): string {
  const outputPath = getMissingInputStatePath(state.taskId, root);
  const outputDir = dirname(outputPath);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  return outputPath;
}

export function formatMissingInputQuestions(missingInputs: MissingInput[]): string[] {
  return missingInputs.map((item, index) => {
    const sensitivity = item.sensitive
      ? 'Sensitive values will be saved only to a local Git-ignored file.'
      : 'Non-sensitive value.';
    return `${index + 1}. ${item.question} (${sensitivity})`;
  });
}
