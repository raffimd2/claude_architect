# Module 1 · Agentic Architecture & Orchestration (27%)

The heaviest module on the exam. Eight videos covering Domain 1, Task Statements 1.1–1.7.

| # | Video | Task Statement |
|---|---|---|
| 1 | [The Agentic Loop](./video-01-agentic-loop/) | 1.1 |
| 2 | [Model-Driven vs Scripted Orchestration](./video-02-model-driven-vs-scripted/) | 1.1 |
| 3 | [Coordinator–Subagent (Hub-and-Spoke)](./video-03-coordinator-subagent/) | 1.2, 1.3 |
| 4 | [Explicit Context Passing](./video-04-context-passing/) | 1.3 |
| 5 | [Parallel Subagent Execution](./video-05-parallel-subagents/) | 1.3, 1.6 |
| 6 | [Iterative Refinement Loops](./video-06-iterative-refinement/) | 1.2, 1.6 |
| 7 | [Hooks for Determinism](./video-07-hooks-determinism/) | 1.5 |
| 8 | [Sessions, Resume, Fork](./video-08-sessions/) | 1.7 |

## Shared deps

Each video has its own `src/` folder with runnable TypeScript demos. Install deps once at the module level:

```bash
cp shared/package.json ./package.json
cp shared/tsconfig.json ./tsconfig.json
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
```

Then run any demo:

```bash
npx ts-node video-03-coordinator-subagent/src/hub-and-spoke.ts
```

## Lab at the end

**Exam Exercise 1** — a multi-tool customer-support agent with structured errors, prerequisite gate, and escalation. We cover this in depth in Module 6, Video 1 (Scenario 1 capstone).
