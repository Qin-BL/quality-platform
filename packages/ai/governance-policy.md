# AI Governance Policy

> **How Governance Agent enforces platform rules and compliance.**

---

## 1. Governance Scope

Governance Agent is responsible for enforcing AGENTS.md compliance across all AI agent actions. It operates as an auditor — it does not block actions, but reports violations.

---

## 2. What Governance Checks

### Security Audits
1. **Secret exposure** — Are tokens, keys, or credentials exposed in generated code?
2. **Production safety** — Are production guards active and not bypassed?
3. **Environment verification** — Is the correct environment being used?

### Process Audits
4. **Test plan review** — Are test plans reviewed before test generation?
5. **Asset lifecycle** — Are generated assets being directly promoted?
6. **Reviewed basis** — Are permanent tests based on reviewed test plans?

### Quality Audits
7. **Assertion integrity** — Have assertions been weakened or removed?
8. **Failure handling** — Are failures being hidden or skipped?
9. **Business rule fabrication** — Are business rules being invented?

---

## 3. Violation Severity

| Severity | Description | Action |
|----------|-------------|--------|
| **CRITICAL** | Production write, secret exposure | Block immediately, report |
| **HIGH** | Bypassed reviewed test plan, weakened assertions | Flag, require fix before proceeding |
| **MEDIUM** | Skipped failure, missing context | Warn, document risk |
| **LOW** | Missing tag, minor naming issue | Note, non-blocking |

---

## 4. Governance Report

Every QC cycle must include a governance check:

```markdown
## Governance Check
- AGENTS.md compliance: PASS/FAIL
- Secret exposure: NONE/DETECTED
- Production safety: ACTIVE/BYPASSED
- Test plan review: VERIFIED/VIOLATED
- Asset lifecycle: COMPLIANT/VIOLATED
- Assertion integrity: MAINTAINED/WEAKENED
```

---

## 5. Audit Trail

All governance findings are recorded in the audit trail for compliance and retrospective analysis.

---

*Phase 1: Policy definition. Governance checks not yet automated.*