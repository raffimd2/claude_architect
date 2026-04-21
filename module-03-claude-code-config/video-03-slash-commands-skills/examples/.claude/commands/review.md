---
description: Run the team's PR review checklist against the current diff
---

You are doing a pull-request review. Use this exact checklist, in order:

1. **Correctness** — walk through every logical branch. Flag any missed edge case.
2. **Tests** — is there a test for every behavioural change? If not, list what's missing.
3. **Security** — SQL, XSS, deserialisation, secret leaks, auth bypasses.
4. **Observability** — are new code paths logged with request id + user id?
5. **Docs** — does the public API surface need a changelog entry?

For each finding, return: `{file, line, severity (low|med|high), issue, suggested fix}`.
