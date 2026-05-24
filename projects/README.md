# projects/ — Business Project Test Spaces

This directory will contain test spaces for individual business projects.

## Structure

Each project gets its own directory under `projects/<project-key>/`, created from `templates/project/`.

```
projects/<project-key>/
├── AGENTS.md                 (copied from template)
├── context/
│   ├── product-context.md
│   ├── frontend-context.md
│   ├── backend-context.md
│   ├── api-context.md
│   ├── external-systems-context.md
│   └── test-scope.md
├── tests/
│   ├── smoke/
│   ├── e2e/
│   ├── api/
│   ├── external/
│   └── visual/
├── test-plans/
│   ├── generated/
│   └── reviewed/
└── config/
    ├── local.ts
    ├── staging.ts
    └── production-smoke.ts
```

## Current Phase

**Phase 1 — Framework Only.** No business project directories have been created yet.

## Creating a New Project Space

Run: `npm run create:project -- --key=<project-key>`

This will initialize a new project space under `projects/<project-key>/` using the templates.