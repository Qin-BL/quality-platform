# Test Review Checklist

> **Before marking a test plan as reviewed, verify ALL items on this checklist.**

---

## Context Completeness

- [ ] `product-context.md` is filled with actual business information
- [ ] `frontend-context.md` describes actual routes and pages
- [ ] `backend-context.md` describes actual domains and data models
- [ ] `api-context.md` describes actual endpoints and contracts
- [ ] `external-systems-context.md` identifies all external dependencies
- [ ] `test-scope.md` defines clear in/out of scope boundaries

## Test Plan Quality

- [ ] Test plan follows the template from `templates/test-plan.template.md`
- [ ] Smoke cases cover the MOST critical user flows
- [ ] E2E cases cover complete business workflows
- [ ] API cases cover both success and error scenarios
- [ ] External verification cases include environment safety checks
- [ ] Test data strategy is defined and includes cleanup
- [ ] Priority levels are assigned (P0/P1/P2)
- [ ] Open questions are documented (no assumptions)

## Safety Checks

- [ ] No production write operations planned
- [ ] Production smoke tests are readonly only
- [ ] External system access uses sandbox/staging accounts
- [ ] All credentials referenced via environment variables (not hardcoded)

## Executability

- [ ] Each test case can be implemented with available templates
- [ ] Required page objects, clients, fixtures can be created
- [ ] Test data is obtainable (no dependency on real user data)

## Review Decision

- [ ] **APPROVED** — Ready for test generation
- [ ] **CHANGES REQUESTED** — See comments above
- [ ] **REJECTED** — Requires significant rework

---

*Reviewer: ___________ | Date: ___________*