# Architecture

`quality-platform` is an **AI-native QC Platform**, not a plain Playwright project.

## Layers

1. AI Layer: planner, generator, explorer, runner, healer, reporter, governance.
2. Governance Layer: `AGENTS.md`, `SKILL.md`, AI contracts, lifecycle rules, guards.
3. Planning Layer: context, impact analysis, reviewed test plans.
4. Execution Layer: Playwright tests, auth bootstrap, config discovery, traces, reports.
5. Healing Layer: failure classification and governed repair suggestions.
6. Reporting Layer: QC report, audit trail, CI evidence.
