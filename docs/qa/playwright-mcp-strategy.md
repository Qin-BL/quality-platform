# Playwright MCP Strategy

Playwright MCP is the **AI Explorer** browser exploration layer.

Rules:

1. Exploration helps AI understand UI paths.
2. Exploration results are candidate evidence, not final business truth.
3. Useful findings must flow into context or planning.
4. Production write remains forbidden.

## Runtime Manifest

The framework now supports MCP exploration manifests as runtime artifacts.

Project config can declare:

- whether MCP exploration is enabled
- the readonly base URL
- allowed domains
- the artifact directory
- the default session name

Use:

`npm run mcp:explore -- --project <project-key> --request "<goal>"`

This generates a governed exploration manifest that AI browser tooling can execute against while keeping evidence and scope explicit.
