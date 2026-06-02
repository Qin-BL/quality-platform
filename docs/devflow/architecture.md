# AI Development Framework Architecture

Phase 1 of the AI development framework is intentionally lightweight and
non-invasive.

## Responsibilities

- `packages/devflow`
  - workspace config model
  - shared-workspace discovery
  - repository state inspection
  - branch naming and branch preparation logic
- `workspaces/<workspace-key>/workspace.config.ts`
  - repo inventory
  - branching rules
  - test/build commands
  - staged quality gates
  - deployment mapping
  - best-practices mirror definition
- `scripts/resolve-dev-workspace.ts`
  - print resolved workspace and current repo state
- `scripts/create-dev-workspace.ts`
  - scaffold a new multi-repository workspace from templates
- `scripts/plan-ai-dev.ts`
  - generate a deterministic feature execution plan without mutating business repos
- `scripts/generate-dev-proposal.ts`
  - emit repo-scoped change proposals and task templates for downstream AI/manual implementation
- `scripts/generate-dev-task-bundle.ts`
  - convert proposal + execution manifest into repo-local agent task bundles
- `scripts/generate-dev-work-orders.ts`
  - emit per-repo work-order packets and prompt artifacts for execution sessions
- `scripts/generate-dev-implementation-packets.ts`
  - emit repo-local implementation packets, candidate file targets, and patch-plan templates
- `scripts/generate-dev-patch-drafts.ts`
  - emit repo-local patch draft scaffolds from implementation packets
- `scripts/generate-dev-agent-sessions.ts`
  - emit repo-local agent session specs that combine work-order, draft, and verification context
- `scripts/emit-dev-execution-manifest.ts`
  - emit a machine-readable execution manifest and human-readable execution checklist
- `scripts/run-dev-execution.ts`
  - execute safe local steps from the manifest
  - keep implementation / promotion / deployment steps manual until adapters are added
- `scripts/orchestrate-dev-execution.ts`
  - run ordered batches of steps for a chosen stage
  - emit checkpoint files for recovery/resume
- `scripts/prepare-dev-branches.ts`
  - dry-run or apply feature-branch preparation for clean repositories
- `scripts/sync-framework-mirror.ts`
  - synchronize framework-level code into the configured best-practices mirror

## Phase 1 Operating Principle

1. discover workspace
2. verify real repository state
3. generate branch/test/deploy plan
4. generate a repo-scoped change proposal for implementation
5. generate repo-scoped task bundles and agent prompts
6. generate repo-scoped work orders and prompt artifacts
7. generate repo-scoped implementation packets and patch-plan templates
8. generate repo-scoped patch draft scaffolds
9. generate repo-scoped agent session specs
10. emit repo-scoped execution manifest for downstream AI workers
11. execute safe local steps from that manifest
12. orchestrate batches of executable steps with checkpoint output
13. implement framework changes inside the automation repo only
14. mirror framework code into best-practices

Business-repository auto-mutation is deliberately deferred to a later phase.

## Phase 1 Command Flow

1. `npm run devflow:resolve -- --workspace hiring-ai-dev`
2. `npm run devflow:plan -- --workspace hiring-ai-dev --feature <feature-name>`
3. `npm run devflow:proposal -- --workspace hiring-ai-dev --feature <feature-name> --objective "..."`
4. `npm run devflow:manifest -- --workspace hiring-ai-dev --feature <feature-name>`
5. `npm run devflow:task-bundle -- --workspace hiring-ai-dev --feature <feature-name>`
6. `npm run devflow:work-orders -- --workspace hiring-ai-dev --feature <feature-name>`
7. `npm run devflow:implementation-packets -- --workspace hiring-ai-dev --feature <feature-name>`
8. `npm run devflow:patch-drafts -- --workspace hiring-ai-dev --feature <feature-name>`
9. `npm run devflow:agent-sessions -- --workspace hiring-ai-dev --feature <feature-name>`
10. `npm run devflow:run -- --workspace hiring-ai-dev --feature <feature-name> --stage preflight`
11. `npm run devflow:run -- --workspace hiring-ai-dev --feature <feature-name> --stage branching --apply`
12. `npm run devflow:orchestrate -- --workspace hiring-ai-dev --feature <feature-name> --stage verification`
13. implement framework or business-repo work explicitly
14. `npm run devflow:mirror -- --workspace hiring-ai-dev`
