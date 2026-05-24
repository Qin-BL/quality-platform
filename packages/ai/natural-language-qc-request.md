# Natural Language QC Request Contract

> **How QC requests are submitted and parsed by the Planner Agent.**

---

## 1. Request Format

QC requests can be submitted as natural language or structured following `templates/qc-request.template.md`.

### Minimum Required Information
- **Target Project** — Which business project needs QC
- **Change Type** — What changed (PR, release, feature, bugfix)
- **Source Links** — PR URL, commit hash, release tag

### Optional
- Specific scope or concerns
- Urgency / deadline
- Known risks

---

## 2. Request Lifecycle

```
Submitted (incoming/)
    ↓
Planner reads and analyzes (analyzed/)
    ↓
Impact analysis complete
    ↓
Test plan generated
    ↓
QC execution complete (completed/)
```

---

## 3. What AI Must Do

1. Parse the request for key information
2. Load governance rules (AGENTS.md)
3. Read project context documents
4. Identify if the request is for a known or new project
5. If new project, flag that context documents must be filled first
6. Route to Planner Agent for impact analysis

---

## 4. What AI Must Not Do

1. Execute QC without understanding the request
2. Skip context document reading
3. Assume information not provided in the request
4. Process requests for projects without context documents

---

*Phase 1: Contract definition. No requests exist yet.*