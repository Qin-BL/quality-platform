# AI Healing Strategy

## Overview

AI healing is the capability for AI (Healer Agent) to analyze test failures, classify root causes, and propose fixes. Healing is **suggestion-based** — never automatic.

## Healing Loop

::: mermaid
graph TD
    A["Execution failure"] --> B["Failure classification"]
    B --> C["Healing suggestion"]
    C --> D["Human review"]
    D --> E["Approved fix or follow-up"]
    E --> F["Re-run QC"]
    F --> A
    classDef issue fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    classDef action fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef review fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    class A issue;
    class B,C,E,F action;
    class D review;
:::

The purpose of healing is not to hide failures.
The purpose is to turn failures into explicit, reviewable next actions.

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

## Classification Path

::: mermaid
graph TD
    A["Raw failure"] --> B{"Can classify confidently?"}
    B -->|yes| C["Assign governed category"]
    B -->|no| D["Flag for human triage"]
    C --> E{"Allowed healing path?"}
    E -->|yes| F["Generate healing suggestion"]
    E -->|no| G["Report only"]
    classDef issue fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef action fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    class A issue;
    class B,E decision;
    class C,D,F,G action;
:::

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

## Approval Model

::: mermaid
graph TD
    A["Healing suggestion"] --> B{"Risk level"}
    B -->|low| C["Human review at convenience"]
    B -->|medium| D["Review before applying"]
    B -->|high| E["Explicit approval required"]
    C --> F["Apply approved change"]
    D --> F
    E --> F
    classDef action fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    class A,C,D,E,F action;
    class B decision;
:::

---

## Flaky Test Handling

1. Detect flaky tests via inconsistent pass/fail pattern.
2. Suggest stabilization: better waits, data isolation, test splitting.
3. **Never skip** a flaky test — fix it or escalate.
4. Track flaky tests over time for trends.

## Healing Boundaries

::: mermaid
graph TD
    A["Suggested change"] --> B{"Allowed?"}
    B -->|yes| C["Keep as proposal"]
    B -->|no| D["Reject suggestion"]
    D --> E["Escalate or report"]
    classDef action fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    class A,C action;
    class B decision;
    class D,E warning;
:::

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

## Runtime Signals

- raw error text
- classified category
- healing suggestion type
- report integration
- resumable follow-up context
