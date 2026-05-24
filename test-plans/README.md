# test-plans/ — Test Plan Lifecycle

This directory manages the lifecycle of AI-generated test plans at the platform level.

## Test Plan Lifecycle

```
generated/  →  reviewed/  →  archived/
```

| Stage | Location | Description |
|-------|----------|-------------|
| **Generated** | `generated/` | Draft test plan created by Planner Agent. Requires human review. |
| **Reviewed** | `reviewed/` | Human-reviewed test plan. THIS is the basis for test code generation. |
| **Archived** | `archived/` | Outdated or superseded test plans. Retained for audit trail. |

## How It Differs From Project-Level test-plans

- **Platform-level** (`test-plans/`): Organizes test plans **across** all projects, by lifecycle stage.
- **Project-level** (`projects/<project-key>/test-plans/`): Contains test plans **for that specific project**, organized by generated/reviewed.

In future phases, `promote-test-asset.ts` may link or sync between these levels.

## Review Rules

1. Generated test plans must be reviewed by a human before becoming the basis for test generation.
2. Review confirms: scope, assumptions, business rules, and open questions are correct.
3. Unreviewed test plans CANNOT be used for permanent test generation.
4. Archived plans remain available for audit and historical reference.

## Phase 1 Note

Currently (Phase 1), this is a skeleton. No test plans have been generated.
When the first business project QC request is processed, test plans will flow through this pipeline.