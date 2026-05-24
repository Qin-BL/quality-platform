# Impact Analysis Contract

> **How Planner Agent analyzes change impact and maps to test levels.**

---

## 1. Input

- QC request
- PR diff / change summary / release notes
- Project context documents (all 6 context files)
- Existing reviewed test plans

---

## 2. Analysis Steps

### Step 1: Identify Changed Files
- List all modified files from the PR/change.
- Categorize: frontend, backend, config, documentation, tests.

### Step 2: Map to Systems
- Frontend files → affected pages, routes, components, auth flow
- Backend files → affected domains, models, endpoints, jobs, webhooks
- Config files → affected environment, CI, deployment
- Documentation → no test impact

### Step 3: Identify Affected APIs
- Which endpoints changed?
- Which request/response contracts changed?
- Are there new endpoints or deprecated ones?

### Step 4: Identify Affected External Systems
- Which integrations are affected?
- Data flow changes?
- New external dependencies?

### Step 5: Select Test Levels
- Map findings to test levels using selection rules in SKILL.md.

---

## 3. Output Contract

```markdown
## Impact Analysis

### Changed Files
| File | Type | Risk |

### Affected Frontend
- Routes: [...]
- Pages: [...]
- Components: [...]

### Affected Backend
- Domains: [...]
- Endpoints: [...]
- Jobs/Webhooks: [...]

### Affected APIs
- Endpoints: [...]

### Affected External Systems
- Systems: [...]

### Suggested Test Levels
| Level | Reason | Priority |
```

---

## 4. Rules

1. If no changes affect a system, mark it as "not affected" — skip that test level.
2. Unknown impact → flag as Open Question.
3. NEVER assume impact without evidence.

---

*Phase 1: Contract definition.*