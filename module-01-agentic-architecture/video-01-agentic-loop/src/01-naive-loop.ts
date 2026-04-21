/**
 * DEMO 1 — The NAIVE loop (anti-pattern).
 *
 * Exam-relevant anti-patterns demonstrated here:
 *   1. Parsing assistant text ("done", "finished") to decide when to stop.
 *   2. Using an arbitrary iteration cap (MAX_ITER = 10) as the primary
 *      termination mechanism.
 *   3. Ignoring stop_reason entirely.
 *
 * Run:  npm run naive
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { tools, runTool } from "./tools";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";
const MAX_ITER = 10;

async function main() {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content:
        "What is the temperature in Copenhagen right now, and what is 23 * 4 + that temperature?",
    },
  ];

  for (let i = 0; i < MAX_ITER; i++) {
    console.log(`\n--- iteration ${i + 1} ---`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools,
      messages,
    });

    // ❌ Anti-pattern: look at the text and guess whether we are done.
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const text = textBlocks.map((b) => b.text).join("\n");
    console.log("assistant text:", text || "(no text)");

    if (/\b(done|finished|final answer)\b/i.test(text)) {
      console.log("Stopping because assistant said a magic word. 😬");
      return;
    }

    // Still, we blindly execute any tool calls we see.
    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (toolUses.length === 0) {
      // We leave the loop only because there were no tool calls AND no
      // magic word. This means we can accidentally keep looping on empty
      // responses, or exit too early when the model is mid-task.
      console.log("No tool calls this turn — guessing we're done.");
      return;
    }

    // Missing: we do NOT append the assistant turn or tool results to
    // `messages`, so on the next iteration the model has no memory of
    // what it already did. This is a common beginner bug.
    for (const call of toolUses) {
      const result = runTool(call.name, call.input as Record<string, unknown>);
      console.log(`  tool ${call.name} →`, result);
    }
  }

  console.log("\n⚠️  Hit MAX_ITER. In production this would silently truncate work.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
