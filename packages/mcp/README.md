# packages/mcp/ — Playwright MCP & Browser Exploration

> **Phase 1: Rules and contracts only. No actual MCP integration yet.**

---

## What is MCP in this context?

**MCP (Model Context Protocol)** enables AI agents to interact with Playwright for browser exploration — discovering UI paths, identifying locators, and recording interaction workflows.

This directory defines:
1. **Guidelines** for how AI uses Playwright MCP
2. **Contracts** for browser exploration
3. **Safety rules** for production isolation

---

## Current Status (Phase 1)

- The `playwright-mcp-guidelines.md` file defines how AI should use browser exploration.
- The `browser-exploration-contract.md` file defines the contract between Explorer Agent and its outputs.
- **No actual MCP integration exists yet.** These are rule documents for future AI usage.

---

## Future Integration

When MCP is enabled:
1. Explorer Agent will use `@anthropic/mcp` or equivalent to launch Playwright browsers
2. Exploration results will flow to Planner for test plan enrichment
3. Final tests will always come from reviewed test plans — NOT exploration results directly