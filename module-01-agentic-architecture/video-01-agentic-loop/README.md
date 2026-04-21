# Module 1 · Video 1 — The Agentic Loop

Demo code and production assets for the pilot video of the **Claude Certified Architect — Foundations** series by [GenAI Mentor](https://www.genai-mentor.ai/).

**Exam mapping:** Domain 1 (Agentic Architecture & Orchestration), Task Statement 1.1.
**Reference:** [claudecertifications.com/claude-certified-architect/exam-guide](https://claudecertifications.com/claude-certified-architect/exam-guide).

## What's in here

| File | Purpose |
|---|---|
| `src/tools.ts` | Two simple tools (`get_weather`, `calculator`) used by all demos. |
| `src/01-naive-loop.ts` | Naive loop demonstrating three exam anti-patterns. |
| `src/02-correct-loop.ts` | The correct loop — the one the exam expects. |
| `src/03-multi-tool-loop.ts` | Same loop with a harder prompt that forces multi-step orchestration. |

## Run it locally

```bash
cd video-series/module-01-agentic-architecture/video-01-agentic-loop
cp .env.example .env           # paste your ANTHROPIC_API_KEY
npm install
npm run naive        # show the anti-pattern
npm run correct      # show the correct loop
npm run multi-tool   # show model-driven orchestration
```

## What the viewer should take away

1. `stop_reason` is the ONLY reliable signal for loop termination.
2. `"tool_use"` → continue; `"end_turn"` → stop.
3. Always append **both** the assistant turn and the `tool_result` blocks to `messages`.
4. Iteration caps are a safety net, never the primary stop condition.
5. The model decides *which* tool to call next — not your code.

## License

MIT. Attribution: GenAI Mentor.
