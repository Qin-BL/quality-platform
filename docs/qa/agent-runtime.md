# Agent Runtime — Collaboration Model

## Overview

quality-platform defines 8 specialized AI agents that collaborate through a structured workflow. Each agent has a clear role, inputs, outputs, and boundaries.

---

## Agent Roles

| Agent | Phase | Responsibility | Output |
|-------|-------|----------------|--------|
| **Planner** | Plan | Impact analysis, test plan generation | Test plan draft |
| **Generator** | Generate | Executable test code generation | Test files |
| **Explorer** | Explore | Browser UI exploration and locator discovery | Exploration log |
| **Runner** | Execute | Test execution and evidence collection | Execution summary |
| **Healer** | Analyze | Failure classification and healing suggestions | Failure report + suggestions |
| **External Verifier** | Verify | External system reconciliation | Verification report |
| **Report Writer** | Report | Aggregate all outputs into QC report | QC report |
| **Governance** | Govern | Security, compliance, and audit enforcement | Governance report |

---

## Agent Collaboration

```
Planner (Plan)
    ↓
Generator (Generate) ← Explorer (Discover)
    ↓
Runner (Execute) ← External Verifier (Verify)
    ↓
Healer (Analyze)
    ↓
Report Writer (Report)
    ↓
Governance (Govern — runs throughout)
```

### Sequential Dependencies

1. **Planner** must complete before **Generator** (tests are based on reviewed plans).
2. **Generator** must complete before **Runner** (tests must exist to execute).
3. **Runner** and **External Verifier** can run in parallel.
4. **Healer** depends on **Runner** output (failure data).
5. **Report Writer** depends on all agents.
6. **Governance** runs continuously — monitoring all agents.

### Parallelism

- **Runner** and **External Verifier** are independent — they can execute in parallel.
- **Explorer** can run independently of Generator when discovering new UI paths.

---

## Agent Boundaries

Each agent has strict boundaries:

| Agent | CAN DO | CANNOT DO |
|-------|--------|-----------|
| Planner | Generate test plans | Generate test code |
| Generator | Generate tests from reviewed plans | Generate tests from drafts |
| Explorer | Discover UI paths | Produce final assertions |
| Runner | Execute and collect evidence | Classify failures |
| Healer | Suggest fixes | Auto-apply fixes or weaken assertions |
| External Verifier | Check external system consistency | Access production write |
| Report Writer | Aggregate and format reports | Modify test results |
| Governance | Audit and report violations | Modify other agents' outputs |

---

*Phase 1: Agent roles defined. Actual agent execution is AI-driven.*