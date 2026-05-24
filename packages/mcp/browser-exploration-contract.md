# Browser Exploration Contract

> **Phase 1: Contract definition — no actual exploration yet.**
> This document defines the contract Explorer Agent must follow.

---

## 1. Input Contract

Explorer Agent receives:

- **Target URL(s)** — staging/test only, NEVER production
- **Page(s) to explore** — route or page name
- **Exploration goals** — what to discover (locators, flows, states)
- **Context documents** — frontend-context.md for known routes and pages

---

## 2. Output Contract

Explorer Agent MUST produce:

```typescript
interface ExplorationResult {
  environment: string;
  url: string;
  timestamp: string;
  pages: ExploredPage[];
  warnings: string[];
}

interface ExploredPage {
  route: string;
  title: string;
  interactions: Interaction[];
  locators: LocatorSuggestion[];
  notes: string;
}

interface Interaction {
  step: number;
  action: 'click' | 'fill' | 'select' | 'navigate' | 'hover' | 'scroll';
  target: string;
  result: string;
}

interface LocatorSuggestion {
  element: string;
  suggestedLocator: string;
  locatorType: 'data-testid' | 'role' | 'label' | 'text' | 'placeholder' | 'css';
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}
```

---

## 3. Contract Rules

1. All exploration results are **candidate information** — not final assertions.
2. Results flow to **Planner** for test plan enrichment — NOT directly to Generator.
3. All locators must be reviewed by a human before use in permanent tests.
4. Unclear interactions must be flagged as `notes` or `warnings`.
5. Results must include the exact environment and browser version used.

---

## 4. What Exploration Results CANNOT Become

- **CANNOT** become final business assertions
- **CANNOT** bypass test plan review
- **CANNOT** become promoted test assets without review
- **CANNOT** replace context documents

---

## 5. Future Implementation

When MCP is implemented:

```typescript
// Example future usage (NOT executed in Phase 1)
// const explorer = new MCPExplorer({ headless: true });
// const result = await explorer.explore('https://staging.example.com/dashboard');
// await planner.enrichTestPlan(result);
```

---

*Phase 1: Contract definition. No actual exploration exists yet.*