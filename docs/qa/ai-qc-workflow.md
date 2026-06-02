# AI QC Workflow

One sentence expands into a governed pipeline:

1. Read governance
2. Detect `PROJECT_KEY`
3. Resolve project config
4. Run the configured upstream unit-test gate when available
5. Stop immediately if that required unit-test gate fails
6. Resolve auth config and auth state
7. Read context
8. Analyze impact
9. Generate or locate a test plan
10. Require review before long-term generation
11. Generate or execute tests with governed boundaries
12. Classify failures
13. Suggest healing
14. Produce audit-ready reporting

## Workflow Overview

::: mermaid
graph TD
    A["User request"] --> B["Read governance"]
    B --> C["Detect PROJECT_KEY"]
    C --> D["Resolve project config"]
    D --> E["Run upstream unit-test gate"]
    E -->|fail| F["Stop before QC"]
    E -->|pass| G["Resolve auth config and auth state"]
    G --> H["Read context"]
    H --> I["Analyze impact"]
    I --> J["Generate or locate test plan"]
    J --> K["Require reviewed plan for long-term generation"]
    K --> L["Generate or execute governed tests"]
    L --> M["Classify failures"]
    M --> N["Suggest healing"]
    N --> O["Produce QC report and audit trail"]
:::

This is the canonical AI-native QC path.
The platform intentionally expands a short natural-language request into a larger governed sequence so that safety, traceability, and reuse stay consistent.

## Runtime Decision Points

::: mermaid
graph TD
    A["Resolve project"] --> B{"Project exists?"}
    B -->|no| C["Block and request project setup"]
    B -->|yes| D{"Missing required input?"}
    D -->|yes| E["Write blocked-state file"]
    E --> F["Ask only for the missing item"]
    F --> G["Resume interrupted step"]
    G --> D
    D -->|no| H{"Reviewed plan required?"}
    H -->|yes, missing| I["Stop before long-term generation"]
    H -->|no or present| J["Proceed to execution"]
:::

The workflow is not just linear.
It contains governed decision points that prevent unsafe execution and reduce prompt back-and-forth.

## Missing Input and Resume Loop

::: mermaid
graph LR
    A["Missing input detected"] --> B["Persist blocked-state file"]
    B --> C["Ask minimal question"]
    C --> D["Receive answer"]
    D --> E["Store local config if needed"]
    E --> F["Resume unfinished workflow step"]
:::

This loop is how the platform avoids making users repeat the full request.
The blocked state preserves where execution stopped and what exact input is required next.

## Test Generation Governance

::: mermaid
graph TD
    A["Context"] --> B["Impact analysis"]
    B --> C["Generated test plan"]
    C --> D["Reviewed test plan"]
    D --> E["Long-term test generation"]
    E --> F["Reviewed tests"]
    F --> G["Promoted tests"]
    C -. "review required" .-> E
    E -. "cannot promote directly" .-> G
:::

This is the core guardrail for long-term maintainability.
The platform allows exploration and draft planning, but durable executable assets must flow through review.

## Failure and Healing Loop

::: mermaid
graph LR
    A["Execution failure"] --> B["Failure classification"]
    B --> C["Healing suggestion"]
    C --> D["Approved fix or follow-up"]
    D --> E["Re-run governed QC"]
    E --> A
:::

Failures are not treated as raw logs only.
They are turned into categorized next actions so the platform can support repeatable maintenance instead of ad-hoc debugging.

Core principles:

- Context first
- Test plan first
- Reviewed test plan for long-term tests
- Generated tests follow lifecycle governance
- Product-repository internal unit tests stay outside this platform's scope

## Practical Reading Order

When learning or operating this workflow, start with:

1. `AGENTS.md`
2. `skills/quality-platform/SKILL.md`
3. `packages/ai/ai-task-contract.md`
4. `docs/qa/project-config-discovery.md`
5. `docs/qa/auth-bootstrap.md`
6. `docs/qa/healing-strategy.md`
