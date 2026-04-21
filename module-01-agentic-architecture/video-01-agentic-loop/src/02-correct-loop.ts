/**
 * DEMO 2 — The CORRECT agentic loop.
 *
 * This is the pattern the Claude Certified Architect exam expects:
 *
 *   1. Send the conversation to Claude.
 *   2. Inspect `stop_reason`:
 *        - "tool_use"  → execute the requested tools, append results,
 *                        loop again.
 *        - "end_turn"  → the model is done; print the final answer and exit.
 *   3. Always append BOTH the assistant turn AND the tool_result turn
 *      to `messages` so the model can reason about previous steps on the
 *      next iteration.
 *
 * Run:  npm run correct
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { tools, runTool } from "./tools";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";
// A safety cap, NOT the primary termination mechanism.
const HARD_CAP = 25;

async function runAgenticLoop(userPrompt: string) {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  for (let i = 0; i < HARD_CAP; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools,
      messages,
    });

    // 1. Append the assistant turn so it's visible on the next iteration.
    messages.push({ role: "assistant", content: response.content });

    // 2. Inspect stop_reason — the RIGHT signal to drive the loop.
    if (response.stop_reason === "end_turn") {
      const finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      console.log("\n=== FINAL ANSWER ===");
      console.log(finalText);
      return;
    }

    if (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // 3. Run every tool call and return the results in a SINGLE user turn,
      //    one tool_result block per tool_use id.
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map(
        (call) => {
          console.log(`[tool] ${call.name}(${JSON.stringify(call.input)})`);
          const output = runTool(call.name, call.input as Record<string, unknown>);
          console.log(`       → ${output}`);
          return {
            type: "tool_result",
            tool_use_id: call.id,
            content: output,
          };
        }
      );

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Any other stop_reason (max_tokens, pause_turn, refusal, etc.) is a
    // real signal — log it and stop.
    console.log(`Unexpected stop_reason: ${response.stop_reason}. Ending loop.`);
    return;
  }

  console.warn(`Hit hard cap (${HARD_CAP} iterations) without end_turn.`);
}

runAgenticLoop(
  "What is the temperature in Copenhagen right now, and what is 23 * 4 + that temperature?"
).catch((e) => {
  console.error(e);
  process.exit(1);
});
