# Simple Usage Guide

Users may say:

- `Run hiring QC according to AGENTS.md.`
- `Generate a test plan for hiring according to AGENTS.md.`
- `Add business tests for hiring according to AGENTS.md.`
- `Run hiring QC with local auth bootstrap according to AGENTS.md.`

AI must automatically expand these requests into governed workflows.

If the workflow hits missing required configuration, AI should ask for only that missing configuration and then continue the same task.
If the missing item is sensitive and the user provides it, AI should save it only to the local Git-ignored secret config file for that project and environment before resuming.

## Execute QC

`Run hiring QC` expands into project discovery, auth discovery, auth state check, context read, reviewed test plan lookup, test selection, and report generation.

If config like a missing project-level URL, auth mode choice, login credential, token, or config file path blocks progress, AI should ask for that one item and then resume QC.

## Generate Test Plan

`Generate a test plan for hiring` expands into project discovery, context read, impact analysis, and draft test plan generation. It does not authorize long-term test generation.

## Add Business Tests

`Add business tests for hiring` expands into project discovery, context validation, test plan validation, and long-term generation only when a reviewed test plan exists.

## Local Auth Bootstrap

`Run hiring QC with local auth bootstrap` expands into project config discovery, auth config discovery, auth state reuse, manual login when needed, and continuation of the QC workflow.
