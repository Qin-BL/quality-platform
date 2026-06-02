# AI Healing Strategy

## Overview

AI healing is the capability for AI (Healer Agent) to analyze test failures, classify root causes, and propose fixes. Healing is **suggestion-based** — never automatic.

---

## Healing Philosophy

1. **Suggest, don't apply** — AI proposes fixes; humans decide.
2. **Classify before suggesting** — Understand the root cause first.
3. **Enforce boundaries** — Some fix types are never allowed.
4. **Never compromise quality** — Healing must not degrade test effectiveness.

---

## Failure Classification

Every failure is classified into one of:

| Type | Description | AI Action |
|------|-------------|-----------|
| `product_bug` | Real application defect | Report to devs — do NOT fix test |
| `test_bug` | Error in test code | Suggest fix (selector, wait, data) |
| `environment_issue` | Infrastructure problem | Report env issue — do NOT fix test |
| `flaky` | Intermittent failure | Suggest stabilization |
| `data_issue` | Bad test data | Suggest data fix |
| `external_dependency` | External system failure | Report dependency — consider isolation |
| `unknown` | Cannot determine | Flag for human triage |

---

## Allowed Healing Actions

| Fix Type | Example |
|----------|---------|
| `selector_update` | Change CSS selector to data-testid |
| `wait_strategy` | Replace timeout with actual condition |
| `test_data_fix` | Fix factory producing invalid data |
| `fixture_fix` | Remove shared mutable state |
| `client_fix` | Update API request payload |
| `assertion_message_improvement` | Add context to error message |
| `split_flaky_test` | Split large test into focused tests |

---

## Forbidden Healing Actions

| Fix Type | Why Forbidden |
|----------|--------------|
| `remove_assertion` | Eliminates quality verification |
| `weaken_assertion` | Reduces test effectiveness |
| `skip_failed_test` | Hides problems |
| `change_business_logic_to_pass` | Mutable code to pass tests — fundamentally wrong |

---

## Human Approval

| Risk | Action |
|------|--------|
| Low | AI suggests, human reviews at convenience |
| Medium | AI suggests, human must review before applying |
| High | AI suggests, explicit human approval required |

---

## Flaky Test Handling

1. Detect flaky tests via inconsistent pass/fail pattern.
2. Suggest stabilization: better waits, data isolation, test splitting.
3. **Never skip** a flaky test — fix it or escalate.
4. Track flaky tests over time for trends.

---

## Closed Loop Runtime

The healing layer is now backed by framework code, not strategy text only.

Current runtime capabilities:

1. classify failures into governed categories
2. infer healing suggestions with allowed fix types
3. analyze Playwright error-context files
4. feed failure and healing information into QC reporting

Use:

`npm run classify:failure -- --test "<name>" --error "<message>"`

or

`npm run classify:failure -- --test "<name>" --context-file "<path>"`
