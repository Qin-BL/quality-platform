# Architecture

`quality-platform` is an **AI-native QC Platform**, not a plain Playwright project.

It owns governed QC workflows such as E2E, API, visual, external verification, auth bootstrap, reporting, and AI-driven quality orchestration.
It does not own unit tests for internal product code. Unit tests remain the responsibility of each concrete application or service repository.
When a project config points to an existing upstream unit-test command, this platform treats that command as a pre-QC gate and stops before QC if the gate fails.

## Layers

1. AI Layer: planner, generator, explorer, runner, healer, reporter, governance.
2. Governance Layer: `AGENTS.md`, `SKILL.md`, AI contracts, lifecycle rules, guards.
3. Planning Layer: context, impact analysis, reviewed test plans.
4. Execution Layer: Playwright tests, auth bootstrap, config discovery, traces, reports.
5. Healing Layer: failure classification and governed repair suggestions.
6. Reporting Layer: QC report, audit trail, CI evidence.
