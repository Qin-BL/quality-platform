# Failure Analysis — {{TEST_NAME}}

> **Analyzed:** {{DATE}}
> **Analyzed by:** {{ANALYZED_BY}}

---

## Failure Summary

[Brief description of what failed.]

---

## Failure Type

- [ ] product_bug
- [ ] test_bug
- [ ] environment_issue
- [ ] flaky
- [ ] data_issue
- [ ] external_dependency
- [ ] unknown

---

## Evidence

- [ ] Screenshot: {{SCREENSHOT_PATH}}
- [ ] Trace: {{TRACE_PATH}}
- [ ] Video: {{VIDEO_PATH}}
- [ ] Error log: {{ERROR_LOG_EXCERPT}}

---

## Suspected Cause

[Detailed analysis of what is suspected to have caused the failure.]

---

## Key Questions

### Is this a product bug?
[Analysis of whether this is a real application defect.]

### Is this a test bug?
[Analysis of whether the test code itself is wrong.]

### Is this an environment issue?
[Analysis of environmental factors.]

### Is this flaky?
[Analysis of whether the failure is intermittent.]

### Is this an external dependency issue?
[Analysis of whether an external system caused the failure.]

---

## Recommended Action

[What should be done about this failure.]

- [ ] Fix test (suggested: {{FIX_TYPE}})
- [ ] Report to developers
- [ ] Fix environment configuration
- [ ] Investigate external system
- [ ] Human triage needed