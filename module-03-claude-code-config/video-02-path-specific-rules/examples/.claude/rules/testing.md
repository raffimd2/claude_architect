---
paths: ["**/*.test.*", "**/*.spec.*"]
---

# Testing conventions

- Framework: **Vitest** in this repo. Do not introduce Jest.
- Use `describe` + `it`. Never bare `test`.
- Co-locate fixtures in `__fixtures__` alongside the test file.
- Every public export must have at least one test.
- Don't mock the database in integration tests — use the test DB container.
