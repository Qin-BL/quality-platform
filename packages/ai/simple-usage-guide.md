# Simple Usage Guide

Users may say:

- `按照 AGENTS.md 的规范，执行 hiring QC。`
- `按照 AGENTS.md 的规范，为 hiring 生成 test plan。`
- `按照 AGENTS.md 的规范，添加 hiring 业务测试。`
- `按照 AGENTS.md 的规范，使用本地 auth bootstrap 执行 hiring QC。`

AI must automatically expand these requests into governed workflows.

If the workflow hits missing required configuration, AI should ask for only that missing configuration and then continue the same task.
If the missing item is sensitive and the user provides it, AI should save it only to the local Git-ignored secret config file for that project and environment before resuming.

## Execute QC

`执行 hiring QC` expands into project discovery, auth discovery, auth state check, context read, reviewed test plan lookup, test selection, and report generation.

If config like a missing project-level URL, auth mode choice, login credential, token, or config file path blocks progress, AI should ask for that one item and then resume QC.

## Generate Test Plan

`为 hiring 生成 test plan` expands into project discovery, context read, impact analysis, and draft test plan generation. It does not authorize long-term test generation.

## Add Business Tests

`添加 hiring 业务测试` expands into project discovery, context validation, test plan validation, and long-term generation only when a reviewed test plan exists.

## Local Auth Bootstrap

`使用本地 auth bootstrap 执行 hiring QC` expands into project config discovery, auth config discovery, auth state reuse, manual login when needed, and continuation of the QC workflow.
