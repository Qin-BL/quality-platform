# Devflow Package

This package owns the first-phase AI-driven development workspace model for
multi-repository delivery.

The current focus is intentionally narrow:

1. Resolve a shared development workspace from checked-in config
2. Inspect real repository state across frontend/backend/llm/automation repos
3. Generate a branch/deploy/test execution plan for a feature
4. Generate a repo-scoped change proposal for AI/manual implementation
5. Generate repo-scoped task bundles and agent prompts
6. Generate per-repo work orders and execution-session prompt artifacts
7. Generate implementation packets with candidate file targets and patch-plan templates
8. Generate patch-draft scaffolds per repo
9. Generate repo-local agent session specs for downstream execution
10. Generate a machine-readable execution manifest for AI workers
11. Execute safe local steps from that manifest
12. Orchestrate batches of steps with dependency-aware checkpoints
13. Mirror framework-level changes into a best-practices repository

Phase 1 is **non-invasive by default**:

- no automatic business-repo code edits
- no automatic deploys
- no automatic PR creation

Instead, the framework produces a deterministic workspace plan from the current
repo realities so later AI workers can act inside clear boundaries.

The execution manifest layer adds:

- repo-scoped readiness status
- branch preparation eligibility
- quality gates grouped by stage
- promotion and deployment pathway steps
- stable step IDs and dependencies for downstream automation

The proposal layer adds:

- repo-scoped change rationale
- explicit change-surface mapping
- suggested implementation/verification/promotion/deployment tasks
- machine-readable proposal output for downstream agents

The task-bundle layer adds:

- repo-local task bundles derived from proposal + execution manifest
- explicit agent prompts with branch/path/gate/deploy context
- stable IDs tying proposal tasks to execution steps

The work-order layer adds:

- per-repo prompt artifacts on disk
- execution-session-ready JSON packets
- repo readiness and manual blocker summaries

The implementation-packet layer adds:

- candidate file discovery per change surface
- patch-plan markdown templates
- repo-local implementation packets ready for patch-draft work

The patch-draft layer adds:

- per-repo draft markdown scaffolds
- acceptance checklists derived from quality gates
- candidate file edit placeholders for downstream agents

The agent-session layer adds:

- repo-local session packets that combine work order, patch draft, and verification context
- `.prompt.txt` artifacts ready to hand to an implementation agent
- readiness summaries showing whether a repo can enter execution immediately

The execution runner adds:

- filtered step selection by repo/stage/step id
- safe dry-run mode by default
- `inspect`, `branch`, and `verify` execution support
- explicit blocking for unsupported `implement`, `promote`, and `deploy` steps

The orchestration layer adds:

- dependency-ordered stage execution
- checkpoint JSON output after each run
- explicit blocked-step and failed-step reporting
- a natural resume point for later automation phases
