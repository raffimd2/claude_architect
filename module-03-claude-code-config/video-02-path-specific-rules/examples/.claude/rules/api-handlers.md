---
paths: ["src/api/**/*.ts"]
---

# API handler conventions

- Every handler wraps logic in `asyncHandler(...)`.
- Errors throw typed `HttpError` subclasses — never return error strings.
- Validate incoming bodies with Zod schemas at the top of the handler.
- Log request id + user id at handler entry.
