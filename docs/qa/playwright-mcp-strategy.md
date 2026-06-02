# Playwright MCP Strategy

Playwright MCP is the **AI Explorer** browser exploration layer.

Rules:

1. Exploration helps AI understand UI paths.
2. Exploration results are candidate evidence, not final business truth.
3. Useful findings must flow into context or planning.
4. Production write remains forbidden.

## MCP Role In The Platform

::: mermaid
graph TD
    A["User or AI goal"] --> B["MCP exploration request"]
    B --> C["Governed exploration manifest"]
    C --> D["Browser exploration run"]
    D --> E["Captured findings"]
    E --> F["Context, planning, or follow-up input"]
    classDef input fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef output fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A input;
    class B,C,D,E runtime;
    class F output;
:::

MCP belongs to the exploration layer.
It helps AI see and navigate the system, but it does not replace governed context, reviewed plans, or durable executable assertions.

## Exploration Boundary

::: mermaid
graph TD
    A["Exploration result"] --> B{"Is it stable business truth?"}
    B -->|no| C["Treat as candidate evidence"]
    C --> D["Move into context or planning"]
    B -->|yes, after review| E["Convert into governed test intent"]
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef output fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A,C,D runtime;
    class B decision;
    class E output;
:::

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

## Manifest Flow

::: mermaid
graph TD
    A["Project config"] --> B["MCP runtime config"]
    B --> C["Exploration request"]
    C --> D["Manifest file"]
    D --> E["Artifact directory"]
    E --> F["Traceable exploration evidence"]
    classDef config fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef output fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A,B config;
    class C,D,E runtime;
    class F output;
:::

## Safe Usage Rules

::: mermaid
graph TD
    A["MCP exploration"] --> B{"Readonly and scoped?"}
    B -->|yes| C["Allowed"]
    B -->|no| D["Blocked by governance"]
    D --> E["Require safer configuration or different approach"]
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    class A,C runtime;
    class B decision;
    class D,E warning;
:::
