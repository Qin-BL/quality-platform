# AGENTS.md — Quality Platform Constitution

`quality-platform` is an **AI-native Autonomous QC Platform**. It is not a normal Playwright repo. Playwright is the stable execution layer inside a larger operating system made of:

- AI QC Agent Runtime
- Test Governance Platform
- Playwright Execution Layer
- Playwright MCP Exploration Layer
- Auth Bootstrap Layer
- Project Discovery Layer
- Failure Classification Layer
- Healing Suggestion Layer
- CI Quality Gate Layer
- Audit and Reporting Layer

## Phase Boundary

Current scope is **framework only**.

- Do build runtime, governance, templates, scripts, docs, CI guards, and auth/bootstrap skeletons.
- Do not add any concrete business project.
- Do not add any real business test.
- Do not add any real selector, endpoint, or login URL to tracked templates, docs, or source files.
- If the user explicitly provides sensitive values, save them only to local Git-ignored secret config files.
- Do not access any real external system.
- Do not write to production.

## Non-negotiable AI Rules

1. Do not write long-term executable tests without a reviewed test plan.
2. Do not invent business rules.
3. Do not invent selectors.
4. Do not invent API endpoints.
5. Do not hardcode secrets in tracked files.
6. Do not write to production.
7. Do not weaken assertions.
8. Do not skip failing tests without explicit approval.
9. Do not promote generated tests directly.
10. Do not place business logic inside spec files.
11. Do not modify unrelated business code.
12. Do not use MCP exploration results as final business assertions.
13. Do not treat AI-generated output as reviewed unless a human explicitly reviewed it.
14. Always record what context was read.
15. Always record what test plan was used.
16. Always output risks and open questions.

## Test Governance Rules

1. Context first.
2. Impact analysis before test planning.
3. Test plan before long-term test generation.
4. Reviewed test plan is the only basis for long-term executable tests.
5. Generated tests must flow through `generated -> reviewed -> promoted -> deprecated`.
6. Generated tests cannot be promoted directly.
7. Production smoke is readonly only.

## Layering Rules

1. Specs orchestrate only.
2. UI flows belong in `packages/pages/`.
3. API and external calls belong in `packages/clients/`.
4. Test data belongs in `packages/fixtures/`.
5. Assertions belong in `packages/assertions/`.
6. Reporting belongs in `packages/reporting/`.
7. Healing belongs in `packages/healing/`.

## Simple QC Command Rule

When the user says:

`按照 AGENTS.md 的规范，执行 <project-key> QC。`

The AI must treat it as a complete QC workflow request and automatically:

1. Detect `PROJECT_KEY`.
2. Load `AGENTS.md`.
3. Load `skills/qc/SKILL.md`.
4. Load `packages/ai/ai-task-contract.md`.
5. Resolve `projects/<PROJECT_KEY>`.
6. Resolve project config according to `TEST_ENV`.
7. Resolve auth config from project config and environment variables.
8. Check auth state if authenticated access is required.
9. Bootstrap local manual auth if allowed and needed.
10. Read project context.
11. Locate reviewed test plans.
12. Select tests according to project config and environment.
13. Run or prepare the QC command.
14. Produce a QC report.

The AI must not ask the user where login config is located.

## Project Config Discovery Rule

Discovery order:

1. `projects/<PROJECT_KEY>/config/<TEST_ENV>.ts`
2. `projects/<PROJECT_KEY>/config/project.config.ts`
3. Environment variables
4. Safe defaults

## Missing Configuration Dialogue Rule

If a task cannot safely continue because required configuration is missing before or during execution, the AI must:

1. Ask only for the minimum missing configuration needed to continue.
2. Prefer a short, direct question over a broad questionnaire.
3. If the missing item is sensitive and the user chooses to provide it in chat, save it only to a local Git-ignored secret config file.
4. Never echo secrets back in logs or final output.
5. Accept configuration as a path, URL, mode choice, secret value, or confirmation, depending on what is actually missing.
6. Resume the unfinished task immediately after the missing configuration is provided.
7. Avoid making the user repeat already provided context.

## Auth Bootstrap Rule

AI may request sensitive auth values only when strictly necessary to continue the user's task. When the user provides them, the AI must save them only to local Git-ignored secret config files, must not repeat them back verbatim, and must not commit them.

For local, debug, and exploratory workflows:

1. Check `AUTH_STATE_PATH` first.
2. If auth state exists, validate it when possible.
3. If auth state is valid, reuse it.
4. If auth state is missing or expired, open `AUTH_LOGIN_URL`.
5. Wait for the user to complete login manually in the browser.
6. Save `storageState` to `AUTH_STATE_PATH`.
7. `AUTH_STATE_PATH` must be ignored by Git.
8. Auth state files must never be committed.
9. Local secret config files are allowed for local workflows only and must stay ignored by Git.
10. CI must use CI secrets, service accounts, or pre-provisioned auth state.
11. Production must remain readonly by default.

## Required Pre-change Plan

Before modifying files, the AI must output a short execution plan including:

1. Rule files to read
2. Context files to read
3. Detected `PROJECT_KEY`
4. Whether project space exists
5. Whether reviewed test plan exists
6. Files expected to be changed
7. Safety risks
8. Commands to run
