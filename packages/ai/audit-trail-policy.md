# Audit Trail Policy

> **How all platform actions are recorded for compliance and traceability.**

---

## 1. Purpose

The audit trail provides a complete, timestamped record of all significant actions in the quality platform — AI analysis, test generation, human reviews, asset promotions, and production guard events.

---

## 2. What Gets Recorded

| Action Type | When | Agent |
|-------------|------|-------|
| `ai_analysis` | Impact analysis complete | Planner |
| `ai_test_plan_generated` | Test plan draft created | Planner |
| `ai_test_generated` | Test code generated | Generator |
| `ai_healing_suggestion` | Healing suggestion created | Healer |
| `human_review_approved` | Human approves test plan/asset | Human |
| `human_review_rejected` | Human rejects test plan/asset | Human |
| `asset_promoted` | Test asset promoted to CI regression | Human/Governance |
| `asset_deprecated` | Test asset deprecated | Human/Governance |
| `production_guard_check` | Production safety guard executed | Governance |
| `external_system_access` | External system accessed | External Verifier |
| `qc_request_analyzed` | QC request analyzed | Planner |
| `qc_request_completed` | QC cycle complete | Report Writer |
| `governance_violation` | Rule violation detected | Governance |

---

## 3. Audit Entry Format

Each entry includes:
- Unique ID
- Timestamp
- Action type
- Agent name
- Project key (if applicable)
- Detail description
- Status (success/warning/error/blocked)
- Optional metadata

---

## 4. Storage

- **Phase 1**: In-memory, printed in QC reports
- **Phase 2+**: Persistent file-based or database storage

---

## 5. Compliance

Audit trails support:
- **Retrospective analysis** — What happened during a QC cycle
- **Incident investigation** — What went wrong and why
- **Process improvement** — Where did the process break down
- **Regulatory compliance** — Proof of testing and review

---

*Phase 1: Policy and type definitions. No persistent storage yet.*