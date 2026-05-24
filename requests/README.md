# requests/ — Natural Language QC Request Pipeline

This directory manages the lifecycle of natural language QC requests submitted by humans or CI systems.

## Request Lifecycle

```
incoming/  →  analyzed/  →  completed/
```

| Stage | Location | Description |
|-------|----------|-------------|
| **Incoming** | `incoming/` | Raw QC request submitted by human or CI. Initial, unprocessed. |
| **Analyzed** | `analyzed/` | Request has been read and analyzed. Impact analysis and test plan linked. |
| **Completed** | `completed/` | QC cycle complete. Report, artifacts, and audit trail linked. |

## Request Format

QC requests follow the `templates/qc-request.template.md` format:

```markdown
# QC Request — [Summary]

## Request Summary
## Target Project
## Change Type
## Source Links
## Risk Level
## Expected QC Output
## Constraints
## Open Questions
```

## Usage

1. Place a new QC request in `incoming/`.
2. AI (Planner Agent) reads the request, does impact analysis, and moves to `analyzed/`.
3. After QC execution completes, request is moved to `completed/`.

## Phase 1 Note

Currently (Phase 1), this directory is a skeleton. No real QC requests exist yet.
When the first business project space is created, QC requests can be submitted in this pipeline.