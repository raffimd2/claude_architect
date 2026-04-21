---
description: Deep-audit a file or directory for common regression patterns
context: fork
allowed-tools: [Read, Grep, Glob]
argument-hint: "<file or directory to audit>"
---

You are performing a code audit in an isolated sub-agent context. You have
read-only access (Read, Grep, Glob) — no Write, no Bash. If you find issues
that require fixes, REPORT them; do not attempt to edit files.

# Audit checklist

1. **Error handling** — unhandled promise rejections, silent `catch` blocks,
   `throw new Error("...")` without context.
2. **Concurrency** — non-idempotent request handlers, shared mutable state,
   race conditions around file I/O.
3. **Data** — N+1 queries, unbounded `SELECT *`, missing pagination.
4. **Security** — string-concatenation SQL, `eval`, untrusted input into
   `child_process.exec`, secret-like string literals.

# Output shape

Return a single JSON report:

```json
{
  "target": "<what was audited>",
  "findings": [
    { "severity": "high|med|low", "file": "...", "line": 42, "issue": "...", "evidence": "..." }
  ],
  "coverage": "what you looked at, and what you didn't"
}
```
