/**
 * Structured error demo.
 *
 * We loop with four tools, each simulating a different failure or an empty-
 * but-successful result. Watch how Claude reacts differently to each.
 *
 * Run:  npx ts-node src/errors.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const tools: Anthropic.Tool[] = [
  {
    name: "flaky_search",
    description: "Search the docs. Sometimes times out (transient).",
    input_schema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
  },
  {
    name: "strict_refund",
    description: "Refund an order. Rejects amounts > $500 (business rule).",
    input_schema: {
      type: "object",
      properties: { order: { type: "string" }, amount_usd: { type: "number" } },
      required: ["order", "amount_usd"],
    },
  },
  {
    name: "admin_only_export",
    description: "Export PII. Requires admin permission.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "empty_search",
    description: "Search again with a narrower query.",
    input_schema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
  },
];

function runTool(name: string, input: any): string {
  if (name === "flaky_search") {
    return JSON.stringify({
      isError: true,
      errorCategory: "transient",
      isRetryable: true,
      description: "Upstream timeout after 5s. Safe to retry once.",
    });
  }
  if (name === "strict_refund") {
    if (input.amount_usd > 500) {
      return JSON.stringify({
        isError: true,
        errorCategory: "business",
        isRetryable: false,
        description: "Refund exceeds $500 limit.",
        customerFacingMessage: "I can't issue a refund this large automatically — escalating.",
      });
    }
    return JSON.stringify({ status: "refunded", order: input.order });
  }
  if (name === "admin_only_export") {
    return JSON.stringify({
      isError: true,
      errorCategory: "permission",
      isRetryable: false,
      description: "Current principal lacks admin scope.",
    });
  }
  if (name === "empty_search") {
    return JSON.stringify({ isError: false, matches: [] });
  }
  return JSON.stringify({ isError: true, description: "unknown tool" });
}

async function loop(userPrompt: string) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  for (let i = 0; i < 12; i++) {
    const r = await client.messages.create({ model: MODEL, max_tokens: 800, tools, messages });
    messages.push({ role: "assistant", content: r.content });
    if (r.stop_reason === "end_turn") {
      console.log("\n=== FINAL ===\n" + r.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n"));
      return;
    }
    if (r.stop_reason !== "tool_use") return;
    const uses = r.content.filter((b: any) => b.type === "tool_use") as Anthropic.ToolUseBlock[];
    const results: Anthropic.ToolResultBlockParam[] = uses.map((call) => {
      const out = runTool(call.name, call.input);
      console.log(`[${i + 1}] ${call.name} → ${out}`);
      return { type: "tool_result", tool_use_id: call.id, content: out };
    });
    messages.push({ role: "user", content: results });
  }
}

loop(
  "Please search the docs for refund policy, then refund $800 on order A-1138."
).catch((e) => {
  console.error(e);
  process.exit(1);
});
