# My Project — Claude instructions

Modular CLAUDE.md using `@import`. Each imported file loads when this file loads.

@./docs/standards/typescript.md
@./docs/standards/react.md
@./docs/standards/testing.md

## Global rules

- Never commit to main directly; always use a feature branch.
- Run `npm run typecheck` after any code change.
- Prefer `Vitest` over `Jest` in this repo.
