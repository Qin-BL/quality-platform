# AI QC Workflow

One sentence expands into a governed pipeline:

1. Read governance
2. Detect `PROJECT_KEY`
3. Resolve project config
4. Run the configured upstream unit-test gate when available
5. Stop immediately if that required unit-test gate fails
6. Resolve auth config and auth state
7. Read context
8. Analyze impact
9. Generate or locate a test plan
10. Require review before long-term generation
11. Generate or execute tests with governed boundaries
12. Classify failures
13. Suggest healing
14. Produce audit-ready reporting

Core principles:

- Context first
- Test plan first
- Reviewed test plan for long-term tests
- Generated tests follow lifecycle governance
- Product-repository internal unit tests stay outside this platform's scope
