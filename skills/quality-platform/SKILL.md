# Quality Platform Skill — AI-native QC Operating Workflow

This skill is the canonical entry point for `quality-platform`.

It defines how AI should operate the platform across:

- request parsing
- project discovery
- missing-input recovery
- auth bootstrap
- environment orchestration
- MCP exploration runtime
- app-map and coverage-map awareness
- test governance
- QC execution
- failure classification
- healing suggestion
- audit and reporting

This repository is not a product repository and does not authorize authoring unit tests for internal business-repository code.

## Canonical Read Order

1. `AGENTS.md`
2. `skills/quality-platform/SKILL.md`
3. `packages/ai/ai-task-contract.md`
4. `projects/<PROJECT_KEY>/AGENTS.md` when the project exists
5. `projects/<PROJECT_KEY>/context/*.md`
6. Reviewed test plan when available

## Canonical Workflow

For:

`Run hiring QC according to AGENTS.md.`

The AI must:

1. Parse the command intent.
2. Detect `PROJECT_KEY`.
3. Resolve the project space.
4. Resolve project config and environment config.
5. Resolve auth config.
6. Detect missing inputs and ask only for the minimum missing item when needed.
7. Persist resumable missing-input state when execution is blocked.
8. Run configured upstream unit-test gates first when they exist.
9. Stop QC if a required upstream unit-test gate fails.
10. Run test-environment orchestration checks and data-dependency checks.
11. Prepare MCP runtime exploration artifacts when the workflow requires exploration.
12. Read context.
13. Locate the reviewed test plan.
14. Build or inspect app-map and coverage-map status.
15. Select tests according to project config and environment.
16. Execute QC or prepare the governed command.
17. Classify failures when execution fails.
18. Produce healing suggestions without weakening assertions.
19. Produce a QC report and audit trail.

## Missing Input Recovery Workflow

If execution cannot safely continue:

1. Identify the exact missing item.
2. Ask only for that item.
3. Save resumable blocked state to `requests/incoming/*.missing-inputs.json`.
4. If the user provides a sensitive value, store it only in a local Git-ignored secret config file.
5. Do not echo the sensitive value.
6. Resume the interrupted workflow step after the missing input is provided.

## Auth Handling Workflow

1. `local`: manual auth bootstrap allowed.
2. `CI`: manual auth forbidden.
3. `staging`: env or preseeded auth.
4. `production-smoke`: readonly only.
5. Local sensitive values may be accepted only for Git-ignored local config storage.

## Governance Workflow

1. Context first.
2. Impact analysis before test planning.
3. Reviewed test plan before long-term executable test generation.
4. Generated assets must flow through `generated -> reviewed -> promoted -> deprecated`.
5. Generated tests must not be promoted directly.

## Layering Workflow

1. Specs orchestrate only.
2. UI logic belongs in `packages/pages/`.
3. API and external calls belong in `packages/clients/`.
4. Test data belongs in `packages/fixtures/`.
5. Assertions belong in `packages/assertions/`.
6. Healing belongs in `packages/healing/`.
7. Reports belong in `packages/reporting/`.

## Healer Rules

Allowed:

- `selector_update`
- `wait_strategy`
- `test_data_fix`
- `fixture_fix`
- `client_fix`
- `assertion_message_improvement`
- `split_flaky_test`

Forbidden:

- `remove_assertion`
- `weaken_assertion`
- `skip_failed_test`
- `change_business_logic_to_pass`
