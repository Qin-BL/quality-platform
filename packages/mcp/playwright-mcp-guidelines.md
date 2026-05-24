# Playwright MCP Guidelines

> **Phase 1: Rule document — no actual MCP integration yet.**

---

## 1. Purpose

Playwright MCP enables AI (Explorer Agent) to interact with browsers programmatically for UI exploration, locator discovery, and interaction path recording.

---

## 2. When to Use

Use Playwright MCP when:

1. A new feature's UI is unknown and needs exploration
2. Existing locators have changed and need rediscovery
3. A complex multi-step workflow needs path recording
4. Accessibility testing needs to be performed

---

## 3. Exploration Rules

### DO
- Use staging/test environments only
- Record stable locators: `role`, `label`, `text`, `data-testid`
- Document interaction sequences step by step
- Note dynamic content, loading states, and transitions
- Flag unclear or ambiguous interactions

### DO NOT
- **DO NOT** explore production environments
- **DO NOT** perform write operations during exploration
- **DO NOT** use fragile locators (CSS classes, nth-child, xpath)
- **DO NOT** treat exploration results as final test code
- **DO NOT** use exploration results to bypass test plan review

---

## 4. Locator Priority

When discovering locators, prefer:

1. `data-testid` — Most stable, purpose-built for testing
2. `role` + `name` — Accessibility-friendly, stable
3. `label` — Form elements, accessible
4. `text` content — When unique and stable
5. `placeholder` — For input fields
6. CSS selectors — Last resort (fragile)

---

## 5. Safety Rules

1. Exploration is READONLY — no form submissions, no data mutations
2. NEVER explore production
3. All observed data is candidate information — not final assertions
4. Record the exact environment (URL, date, browser version)
5. Exploration sessions should be short and targeted

---

## 6. Future Integration

When MCP is enabled in the platform:

1. Explorer Agent will receive exploration requests from Planner
2. MCP will provide browser control for AI
3. Exploration results will be stored as structured logs
4. Planner will incorporate results into test plan drafts

---

*Phase 1: Guidelines only. No MCP integration exists yet.*