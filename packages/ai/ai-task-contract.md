# AI Task Contract

All AI agents adding QC code or QC governance in this repository must comply with this contract.

## Required Inputs

1. `PROJECT_KEY`
2. User request or change summary
3. Relevant code or documentation paths
4. Target environment
5. Whether project space exists
6. Whether context exists
7. Whether a reviewed test plan exists
8. Whether temporary exploratory tests were explicitly allowed

## Mandatory Read Order

1. `AGENTS.md`
2. `skills/qc/SKILL.md`
3. `packages/ai/ai-task-contract.md`
4. `projects/<PROJECT_KEY>/AGENTS.md` if the project exists
5. `projects/<PROJECT_KEY>/context/*.md`
6. Reviewed test plan when available

## Mandatory Workflow

1. Understand the request.
2. Detect `PROJECT_KEY`.
3. Resolve project space.
4. Resolve project config.
5. Resolve auth config.
6. Check auth state.
7. Read context.
8. Analyze impact.
9. Generate or locate a test plan.
10. Stop before long-term test generation unless the test plan is reviewed.
11. Generate long-term executable tests only from reviewed test plans.
12. Run `npm run typecheck`.
13. Run `npm run ai:check`.
14. Produce a QC report.

## Layering Rules

1. Specs only orchestrate.
2. UI logic belongs in `packages/pages/`.
3. API and external calls belong in `packages/clients/`.
4. Test data belongs in `packages/fixtures/`.
5. Assertions belong in `packages/assertions/`.
6. Healing logic belongs in `packages/healing/`.

## Forbidden Actions

1. Invent business rules.
2. Invent selectors.
3. Invent API endpoints.
4. Hardcode secrets.
5. Write to production.
6. Weaken assertions.
7. Skip failing tests without explicit approval.
8. Promote generated tests directly.
9. Treat exploration output as final business truth.

## Required Final Output

1. Rule files read
2. Context files read
3. Project key
4. Workflow state
5. Test plan used or generated
6. Files changed
7. Commands executed
8. Test results
9. Risks
10. Open questions
11. Recommended next step

## Simple Command Expansion Contract

For:

`按照 AGENTS.md 的规范，执行 hiring QC。`

AI must automatically expand the request into:

1. Project key detection
2. Project config discovery
3. Auth config discovery
4. Auth state check
5. Context check
6. Reviewed test plan check
7. Test selection
8. QC execution or governed preparation
9. QC report generation
