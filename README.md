# quality-platform

`quality-platform` is an **AI-native Autonomous QC Platform** for governed Playwright-based quality operations.

It is:

- AI QC Agent Runtime
- Test Governance Platform
- Playwright Execution Layer
- Playwright MCP Exploration Layer
- Auth Bootstrap Layer
- Project Discovery Layer
- Failure Classification Layer
- Healing Suggestion Layer
- CI Quality Gate Layer
- Audit and Reporting Layer

It is not:

- A generic Playwright starter
- A place for unit tests owned by concrete product or service repositories
- A repo for changing or backfilling business-project internal unit-test suites
- A home for real business selectors, endpoints, or production write workflows in tracked files

## Visual Overview

::: mermaid
graph TD
    U["User Request"] --> A["AGENTS.md + quality-platform skill"]
    A --> D["Project Discovery<br/>+ Config Resolution"]
    D --> O["Auth Bootstrap<br/>+ Environment Orchestration"]
    O --> P["Context<br/>+ Reviewed Test Plan"]
    P --> X["Playwright Execution<br/>+ MCP Runtime"]
    X --> H["Failure Classification<br/>+ Healing Suggestions"]
    H --> R["QC Report<br/>+ Audit Trail<br/>+ Quality Gates"]
    classDef input fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef outcome fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class U input;
    class A,D,O,P,X,H runtime;
    class R outcome;
:::

::: mermaid
graph TD
    subgraph Governance
        G1["AGENTS.md"]
        G2["skills/quality-platform/SKILL.md"]
        G3["ai-task-contract"]
    end
    subgraph Runtime
        R1["Project Discovery"]
        R2["Auth Bootstrap"]
        R3["Environment Orchestration"]
        R4["App Map / Coverage Map"]
        R5["MCP Runtime"]
        R6["Playwright Execution"]
    end
    subgraph Output
        O1["Failure Attribution"]
        O2["Healing Suggestions"]
        O3["QC Report"]
        O4["Audit Log"]
    end
    Governance --> Runtime --> Output
    classDef governance fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef output fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class G1,G2,G3 governance;
    class R1,R2,R3,R4,R5,R6 runtime;
    class O1,O2,O3,O4 output;
:::

## Advanced Runtime Capabilities

The framework now includes first-class support for:

- Failure attribution and healing-loop analysis
- Test data and environment orchestration
- MCP exploration manifests and artifact recording
- App-map and coverage-gap reporting
- Missing-input detection with resumable blocked-state files

## One-line Usage

Future users should be able to say:

`Run hiring QC according to AGENTS.md.`

The framework and AI workflow will expand that into:

1. Detect `PROJECT_KEY=hiring`
2. Read governance files
3. Resolve project config
4. Run the configured unit-test gate first when the target system exposes an existing unit-test command
5. Detect configured unit-test coverage and summarize per-module coverage when coverage commands are declared
6. Stop immediately if a required unit-test gate fails
7. Resolve auth config
8. Check auth state
9. Bootstrap local auth when needed
10. Read context
11. Read reviewed test plan
12. Select tests
13. Execute or prepare QC
14. Generate a standard QC report

If required configuration is missing during the workflow, the AI should ask only for that missing configuration, save sensitive values only to local Git-ignored secret config files, and then continue the unfinished task.

## Visual Workflow

::: mermaid
graph TD
    C["Run <project-key> QC<br/>according to AGENTS.md."] --> K["Detect PROJECT_KEY"]
    K --> G["Load governance files"]
    G --> PC["Resolve project config"]
    PC --> UG["Run upstream<br/>unit-test gate"]
    UG -->|fail| STOP1["Stop and report<br/>upstream regression"]
    UG -->|pass| AC["Resolve auth config"]
    AC --> MI{"Missing required input?"}
    MI -->|yes| ASK["Ask only for<br/>the missing item"]
    ASK --> SAVE["Save resumable<br/>blocked state"]
    SAVE --> RESUME["Resume unfinished step<br/>after user reply"]
    RESUME --> AC
    MI -->|no| ORCH["Run environment<br/>orchestration"]
    ORCH --> CTX["Read context<br/>+ reviewed test plan"]
    CTX --> MAP["Build app map<br/>+ coverage summary"]
    MAP --> RUN["Execute governed QC flow"]
    RUN --> FAIL["Classify failures<br/>+ suggest healing"]
    FAIL --> REPORT["Write QC report<br/>+ audit trail"]
    classDef command fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    classDef outcome fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class C command;
    class MI decision;
    class K,G,PC,UG,AC,ASK,SAVE,RESUME,ORCH,CTX,MAP,RUN,FAIL runtime;
    class STOP1 warning;
    class REPORT outcome;
:::

## Test Asset Lifecycle

::: mermaid
graph TD
    A["Context Ready"] --> B["Impact Analysis"]
    B --> C["Generated<br/>Test Plan"]
    C --> D["Reviewed<br/>Test Plan"]
    D --> E["Generated<br/>Tests"]
    E --> F["Reviewed<br/>Tests"]
    F --> G["Promoted<br/>Tests"]
    G --> H["Maintained / Deprecated"]
    C -. "review required before<br/>long-term generation" .-> E
    E -. "cannot promote<br/>directly" .-> G
    classDef planning fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef review fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef execution fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef lifecycle fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A,B,C planning;
    class D,F review;
    class E execution;
    class G,H lifecycle;
:::

## Core Commands

```bash
npm run typecheck
npm run validate:structure
npm run ai:check
npm run guard:all

npm run project:resolve -- --project hiring
npm run check:unit-coverage -- --project hiring
npm run orchestrate:test-env -- --project hiring
npm run check:app-map -- --project hiring
npm run mcp:explore -- --project hiring --request "Explore auth and dashboard"
npm run cleanup:test-artifacts -- --project hiring
npm run auth:check -- --project hiring
npm run auth:login -- --project hiring
npm run qc -- --project hiring
```

## Minimal Setup

```bash
npm install
cp .env.example .env
```

Windows users can use a shell that supports inline env vars or add `cross-env` later if the team decides it is worth the extra dependency. Phase 1 keeps dependencies minimal.

For local secret reuse, the framework also supports `.secrets/<project-key>/<TEST_ENV>.local.json`. That file is ignored by Git and can store local-only auth URLs, usernames, passwords, tokens, or MFA-related values when a user explicitly provides them.

## How To Read The Repo

- `AGENTS.md`: global operating rules and non-negotiable guardrails
- `skills/quality-platform/SKILL.md`: canonical AI workflow entry point
- `packages/`: reusable framework runtime and governance code
- `projects/`: concrete project spaces and reviewed test assets
- `scripts/`: CLI entry points for QC, auth, orchestration, healing, and reporting
- `docs/qa/`: deeper architecture and operating documentation

## Documentation Map

::: mermaid
graph TD
    A["README"] --> B["Architecture"]
    A --> C["AI QC Workflow"]
    A --> D["Project Config Discovery"]
    A --> E["Auth Bootstrap"]
    A --> F["Healing Strategy"]
    A --> G["Test Asset Lifecycle"]
    A --> H["Playwright MCP Strategy"]
    A --> I["Production Safety"]
    A --> J["Autonomous QC Roadmap"]

    B --> B1["What the platform is"]
    C --> C1["How one request expands into QC"]
    D --> D1["How config is found automatically"]
    E --> E1["How auth is checked and resumed"]
    F --> F1["How failures become governed fixes"]
    G --> G1["How assets move from generated to promoted"]
    H --> H1["How exploration stays governed"]
    I --> I1["How production write stays blocked"]
    J --> J1["How autonomy grows over time"]

    classDef root fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef doc fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef purpose fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A root;
    class B,C,D,E,F,G,H,I,J doc;
    class B1,C1,D1,E1,F1,G1,H1,I1,J1 purpose;
:::

Suggested reading order:

1. `README.md`
2. `docs/qa/architecture.md`
3. `docs/qa/ai-qc-workflow.md`
4. `docs/qa/project-config-discovery.md`
5. `docs/qa/auth-bootstrap.md`
6. `docs/qa/healing-strategy.md`
7. `docs/qa/test-asset-lifecycle.md`
8. `docs/qa/playwright-mcp-strategy.md`
9. `docs/qa/production-safety.md`
10. `docs/qa/autonomous-qc-roadmap.md`

## Current Status

This repository currently contains **framework only**:

- No real business project
- No real business test
- No business-repository unit tests
- No real selector
- No real endpoint
- No real credential or token in tracked files

## Docs

Start with:

- [Architecture](./docs/qa/architecture.md)
- [Simple QC Command](./docs/qa/simple-qc-command.md)
- [Project Config Discovery](./docs/qa/project-config-discovery.md)
- [Auth Bootstrap](./docs/qa/auth-bootstrap.md)
- [Playwright MCP Strategy](./docs/qa/playwright-mcp-strategy.md)
- [Playwright Test Agents Strategy](./docs/qa/playwright-test-agents-strategy.md)
- [Autonomous QC Roadmap](./docs/qa/autonomous-qc-roadmap.md)
