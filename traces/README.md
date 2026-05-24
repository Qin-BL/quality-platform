# traces/ — Playwright Trace Archives

This directory stores Playwright trace files generated during test execution.

## Purpose

Traces are collected:
- On test **failure** (always)
- On **retry** (configured in `playwright.config.ts`)
- On **demand** (debug mode)

## Trace Usage

Traces can be opened with Playwright Trace Viewer:

```bash
npx playwright show-trace traces/<trace-file>.zip
```

## Phase 1 Note

Currently (Phase 1), no traces exist because no tests have been executed.
When business project tests run, trace files will be stored here for failure analysis.