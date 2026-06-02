export type AllowedFixType =
  | 'selector_update'
  | 'wait_strategy'
  | 'test_data_fix'
  | 'fixture_fix'
  | 'client_fix'
  | 'assertion_message_improvement'
  | 'split_flaky_test';

export type ForbiddenFixType =
  | 'remove_assertion'
  | 'weaken_assertion'
  | 'skip_failed_test'
  | 'change_business_logic_to_pass';

export const ALLOWED_FIX_TYPES: AllowedFixType[] = [
  'selector_update',
  'wait_strategy',
  'test_data_fix',
  'fixture_fix',
  'client_fix',
  'assertion_message_improvement',
  'split_flaky_test',
];

export const FORBIDDEN_FIX_TYPES: ForbiddenFixType[] = [
  'remove_assertion',
  'weaken_assertion',
  'skip_failed_test',
  'change_business_logic_to_pass',
];

export interface HealingSuggestion {
  testName: string;
  suggestion: string;
  fixType: AllowedFixType;
  isAllowed: boolean;
  risk: 'low' | 'medium' | 'high';
  requiresHumanApproval: boolean;
}

export interface FailureLike {
  testName: string;
  type:
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
  rootCause: string;
}

export function createHealingSuggestion(
  testName: string,
  fixType: AllowedFixType,
  suggestion: string,
  risk: 'low' | 'medium' | 'high' = 'low'
): HealingSuggestion {
  return {
    testName,
    suggestion,
    fixType,
    isAllowed: true,
    risk,
    requiresHumanApproval: risk === 'high',
  };
}

export function isFixTypeAllowed(fixType: string): fixType is AllowedFixType {
  return ALLOWED_FIX_TYPES.includes(fixType as AllowedFixType);
}

export function isFixTypeForbidden(fixType: string): fixType is ForbiddenFixType {
  return FORBIDDEN_FIX_TYPES.includes(fixType as ForbiddenFixType);
}

export function suggestHealingForFailure(failure: FailureLike): HealingSuggestion {
  switch (failure.type) {
    case 'test_bug':
      return createHealingSuggestion(
        failure.testName,
        'fixture_fix',
        'Repair the fixture, helper, or client abstraction so the spec can remain orchestration-only.',
        'medium'
      );
    case 'selector_drift':
      return createHealingSuggestion(
        failure.testName,
        'selector_update',
        'Review page objects and move brittle inline selectors or actions into reusable page abstractions.',
        'medium'
      );
    case 'auth_issue':
      return createHealingSuggestion(
        failure.testName,
        'fixture_fix',
        'Refresh auth bootstrap inputs, validate storage state reuse, and keep secrets in local ignored config files.',
        'medium'
      );
    case 'unit_regression':
      return createHealingSuggestion(
        failure.testName,
        'client_fix',
        'Stop downstream QC, repair the upstream unit-test or coverage regression, and resume only after the gate passes.',
        'high'
      );
    case 'flaky':
      return createHealingSuggestion(
        failure.testName,
        'split_flaky_test',
        'Split the flow, tighten wait strategy, and add better evidence around unstable transitions.',
        'medium'
      );
    case 'data_issue':
      return createHealingSuggestion(
        failure.testName,
        'test_data_fix',
        'Move ad hoc setup into fixtures and make the data factory deterministic.',
        'medium'
      );
    case 'environment_issue':
      return createHealingSuggestion(
        failure.testName,
        'fixture_fix',
        'Verify environment readiness, auth bootstrap, and required config before retrying.',
        'low'
      );
    case 'external_dependency':
      return createHealingSuggestion(
        failure.testName,
        'client_fix',
        'Improve client error handling and narrow readonly smoke checks to stable external evidence.',
        'medium'
      );
    default:
      return createHealingSuggestion(
        failure.testName,
        'assertion_message_improvement',
        'Add clearer failure messages and collect more evidence before suggesting a stronger repair.',
        'low'
      );
  }
}
