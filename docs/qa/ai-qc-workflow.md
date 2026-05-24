# AI QC Workflow

One sentence expands into a governed pipeline:

1. Read governance
2. Detect `PROJECT_KEY`
3. Resolve project config and auth config
4. Check auth state
5. Read context
6. Analyze impact
7. Generate or locate a test plan
8. Require review before long-term generation
9. Generate or execute tests with governed boundaries
10. Classify failures
11. Suggest healing
12. Produce audit-ready reporting

Core principles:

- Context first
- Test plan first
- Reviewed test plan for long-term tests
- Generated tests follow lifecycle governance
- Product-repository internal unit tests stay outside this platform's scope
