# Project Package

This package owns project discovery, config loading, and natural-language QC command parsing.

## Runtime Guarantees

1. Project config discovery is standardized.
2. Users should not need to tell AI where context, auth config, or reviewed test plans live.
3. Safe defaults remain readonly-first and review-first.

### qc-command-parser.ts

Natural language command parser:
- `parseQCCommand()` — parse user command into structured QC request
- `QCCommandIntent` — run_qc, add_business_tests, generate_test_plan, etc.

## Usage

```typescript
import { parseQCCommand } from './qc-command-parser';

const cmd = parseQCCommand('按照 AGENTS.md 的规范，执行 hiring QC。');
// { intent: 'run_qc', projectKey: 'hiring', ... }
```
