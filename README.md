# quality-platform

`quality-platform` is an **AI-native Autonomous QC Platform** for governed Playwright-based quality operations.

It is:

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

It is not:

- A generic Playwright starter
- A place for unit tests owned by concrete product or service repositories
- A repo for changing or backfilling business-project internal unit-test suites
- A home for real business selectors, endpoints, or production write workflows in tracked files

## One-line Usage

Future users should be able to say:

`按照 AGENTS.md 的规范，执行 hiring QC。`

The framework and AI workflow will expand that into:

1. Detect `PROJECT_KEY=hiring`
2. Read governance files
3. Resolve project config
4. Run the configured unit-test gate first when the target system exposes an existing unit-test command
5. Stop immediately if that required unit-test gate fails
6. Resolve auth config
7. Check auth state
8. Bootstrap local auth when needed
9. Read context
10. Read reviewed test plan
11. Select tests
12. Execute or prepare QC
13. Generate a standard QC report

If required configuration is missing during the workflow, the AI should ask only for that missing configuration, save sensitive values only to local Git-ignored secret config files, and then continue the unfinished task.

## Core Commands

```bash
npm run typecheck
npm run validate:structure
npm run ai:check
npm run guard:all

npm run project:resolve -- --project hiring
npm run auth:check -- --project hiring
npm run auth:login -- --project hiring
npm run qc -- --project hiring
```

## Minimal Setup

```bash
npm install
cp .env.example .env
```

Windows users can use a shell that supports inline env vars or add `cross-env` later if the team decides it is worth the extra dependency. Phase 1 keeps dependencies minimal.

For local secret reuse, the framework also supports `.secrets/<project-key>/<TEST_ENV>.local.json`. That file is ignored by Git and can store local-only auth URLs, usernames, passwords, tokens, or MFA-related values when a user explicitly provides them.

## Current Status

This repository currently contains **framework only**:

- No real business project
- No real business test
- No business-repository unit tests
- No real selector
- No real endpoint
- No real credential or token in tracked files

## Docs

Start with:

- [Architecture](./docs/qa/architecture.md)
- [Simple QC Command](./docs/qa/simple-qc-command.md)
- [Project Config Discovery](./docs/qa/project-config-discovery.md)
- [Auth Bootstrap](./docs/qa/auth-bootstrap.md)
- [Playwright MCP Strategy](./docs/qa/playwright-mcp-strategy.md)
- [Playwright Test Agents Strategy](./docs/qa/playwright-test-agents-strategy.md)
- [Autonomous QC Roadmap](./docs/qa/autonomous-qc-roadmap.md)
