/**
 * DEMO 3 — The correct loop with a harder, multi-step prompt.
 *
 * Same loop as demo 2, but the user asks a question that forces Claude to
 * chain several tool calls together. Watch the console output: you should
 * see the model decide WHICH tool to call next based on previous results.
 *
 * This is the "model-driven decision-making" the exam contrasts with
 * "pre-configured decision trees or tool sequences".
 *
 * Run:  npm run multi-tool
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { tools, runTool } from "./tools";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";
const HARD_CAP = 25;

const SYSTEM = `You are a careful assistant. When the user asks a question
that needs live data or arithmetic, ALWAYS use a tool rather than guessing.
Explain your reasoning briefly before giving the final answer.`;

async function runAgenticLoop(userPrompt: string) {
  console.log(`USER: ${userPrompt}\n`);

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  for (let i = 0; i < HARD_CAP; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

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

      const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map(
        (call) => {
          console.log(`[iter ${i + 1}] ${call.name}(${JSON.stringify(call.input)})`);
          const output = runTool(call.name, call.input as Record<string, unknown>);
          console.log(`           → ${output}`);
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

    console.log(`Unexpected stop_reason: ${response.stop_reason}.`);
    return;
  }
}

runAgenticLoop(
  "Compare the temperatures in Copenhagen, Tokyo, and San Francisco. " +
    "Then compute the average of those three temperatures and tell me which " +
    "city is closest to the average."
).catch((e) => {
  console.error(e);
  process.exit(1);
});
