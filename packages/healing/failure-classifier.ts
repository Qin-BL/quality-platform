export type FailureType =
  | 'product_bug'
  | 'test_bug'
  | 'environment_issue'
  | 'auth_issue'
  | 'selector_drift'
  | 'unit_regression'
  | 'flaky'
  | 'data_issue'
  | 'external_dependency'
  | 'unknown';

export interface FailureCategory {
  type: FailureType;
  description: string;
  action: string;
}

export const FAILURE_CATEGORIES: Record<FailureType, FailureCategory> = {
  product_bug: {
    type: 'product_bug',
    description: 'A real defect in the application under test.',
    action: 'Report to the product team. Do not weaken the test to force a pass.',
  },
  test_bug: {
    type: 'test_bug',
    description: 'A defect in the test code, fixture, client, or selector layer.',
    action: 'Fix the test code. Prefer page/client/fixture repairs over spec-level hacks.',
  },
  environment_issue: {
    type: 'environment_issue',
    description: 'Environment configuration or service readiness problem.',
    action: 'Fix environment readiness, auth bootstrap, or config.',
  },
  auth_issue: {
    type: 'auth_issue',
    description: 'Auth bootstrap, session reuse, or credential flow is invalid.',
    action: 'Repair auth bootstrap inputs, refresh auth state, or re-validate session guards.',
  },
  selector_drift: {
    type: 'selector_drift',
    description: 'The product surface changed and locator abstractions are stale.',
    action: 'Update page-object selectors using reviewed UI evidence. Do not weaken assertions.',
  },
  unit_regression: {
    type: 'unit_regression',
    description: 'Upstream unit-test gate failed before QC or indicates a code regression.',
    action: 'Stop QC, fix the upstream code or unit tests first, then rerun governed QC.',
  },
  flaky: {
    type: 'flaky',
    description: 'The test is unstable without a clear product regression.',
    action: 'Improve synchronization, isolation, and failure messaging.',
  },
  data_issue: {
    type: 'data_issue',
    description: 'The seeded or expected data is missing, stale, or malformed.',
    action: 'Repair data setup and move brittle inline data to fixtures.',
  },
  external_dependency: {
    type: 'external_dependency',
    description: 'An external dependency prevented stable verification.',
    action: 'Verify dependency readiness and keep production smoke readonly.',
  },
  unknown: {
    type: 'unknown',
    description: 'There is not enough evidence for a trustworthy classification.',
    action: 'Escalate for human triage and collect more evidence.',
  },
};

export interface ClassifiedFailure {
  testName: string;
  type: FailureType;
  evidence: string[];
  rootCause: string;
  confidence: 'low' | 'medium' | 'high';
}

export function classifyFailure(
  testName: string,
  errorMessage: string,
  artifacts: string[] = []
): ClassifiedFailure {
  const lower = errorMessage.toLowerCase();

  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('auth state') ||
    lower.includes('storage state')
  ) {
    return {
      testName,
      type: 'auth_issue',
      evidence: artifacts,
      rootCause: 'The failure points to invalid auth state, auth bootstrap, or restricted session scope.',
      confidence: 'high',
    };
  }

  if (
    lower.includes('timeout') ||
    lower.includes('retry') ||
    lower.includes('networkidle')
  ) {
    return {
      testName,
      type: 'flaky',
      evidence: artifacts,
      rootCause: 'The failure pattern looks timing-sensitive or intermittently unstable.',
      confidence: 'medium',
    };
  }

  if (
    lower.includes('locator') ||
    lower.includes('selector') ||
    lower.includes('strict mode violation') ||
    lower.includes('element is not attached') ||
    lower.includes('to be visible')
  ) {
    return {
      testName,
      type: 'selector_drift',
      evidence: artifacts,
      rootCause: 'The locator or UI contract has drifted away from the current rendered surface.',
      confidence: 'high',
    };
  }

  if (
    lower.includes('vitest') ||
    lower.includes('jest') ||
    lower.includes('pytest') ||
    lower.includes('unit test gate') ||
    lower.includes('coverage threshold')
  ) {
    return {
      testName,
      type: 'unit_regression',
      evidence: artifacts,
      rootCause: 'The failure originates in the configured upstream unit gate or coverage gate.',
      confidence: 'high',
    };
  }

  if (
    lower.includes('fixture') ||
    lower.includes('page object') ||
    lower.includes('test helper')
  ) {
    return {
      testName,
      type: 'test_bug',
      evidence: artifacts,
      rootCause: 'The fixture, helper, or test abstraction is inconsistent with the intended flow.',
      confidence: 'high',
    };
  }

  if (lower.includes('expect') || lower.includes('assert')) {
    return {
      testName,
      type: 'product_bug',
      evidence: artifacts,
      rootCause: 'The assertion failed against the observed application behavior.',
      confidence: 'medium',
    };
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('connection refused') ||
    lower.includes('service unavailable') ||
    lower.includes('not set')
  ) {
    return {
      testName,
      type: 'environment_issue',
      evidence: artifacts,
      rootCause: 'The environment or required configuration is unavailable.',
      confidence: 'high',
    };
  }

  if (lower.includes('test data') || lower.includes('seed') || lower.includes('fixture')) {
    return {
      testName,
      type: 'data_issue',
      evidence: artifacts,
      rootCause: 'The failure points to missing or invalid seeded data.',
      confidence: 'medium',
    };
  }

  if (
    lower.includes('dns') ||
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('external')
  ) {
    return {
      testName,
      type: 'external_dependency',
      evidence: artifacts,
      rootCause: 'An external dependency appears unavailable or inconsistent.',
      confidence: 'medium',
    };
  }

  return {
    testName,
    type: 'unknown',
    evidence: artifacts,
    rootCause: 'Not enough evidence to classify automatically.',
    confidence: 'low',
  };
}
