/**
 * PreToolUse hook demo — block process_refund for amounts above a threshold.
 *
 * We implement a lightweight hook harness on top of the agentic loop from
 * Video 1. Before each tool_use executes, the hook decides approve/deny/
 * replace. A denied call is replaced with a synthesised tool_result so
 * Claude sees the block and can react (e.g. escalate).
 *
 * Run:  npx ts-node src/block-refund.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";
const REFUND_LIMIT = 500;

const tools: Anthropic.Tool[] = [
  {
    name: "process_refund",
    description: "Issue a refund for a given order and amount in USD.",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        amount_usd: { type: "number" },
      },
      required: ["order_id", "amount_usd"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Route the case to a human agent with a reason string.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
    },
  },
];

type HookDecision =
  | { type: "approve" }
  | { type: "deny"; tool_result: string };

function preToolUseHook(call: Anthropic.ToolUseBlock): HookDecision {
  if (call.name === "process_refund") {
    const amt = Number((call.input as any).amount_usd ?? 0);
    if (amt > REFUND_LIMIT) {
      return {
        type: "deny",
        tool_result: JSON.stringify({
          status: "blocked_by_policy",
          reason: `Refunds above $${REFUND_LIMIT} require human approval.`,
          suggested_next_action: "escalate_to_human",
        }),
      };
    }
  }
  return { type: "approve" };
}

function executeTool(name: string, input: any): string {
  if (name === "process_refund") {
    return JSON.stringify({ status: "refunded", order_id: input.order_id, amount_usd: input.amount_usd });
  }
  if (name === "escalate_to_human") {
    return JSON.stringify({ status: "escalated", reason: input.reason });
  }
  return JSON.stringify({ error: "unknown tool" });
}

async function loop(userPrompt: string) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  for (let i = 0; i < 15; i++) {
    const r = await client.messages.create({ model: MODEL, max_tokens: 1024, tools, messages });
    messages.push({ role: "assistant", content: r.content });

    if (r.stop_reason === "end_turn") {
      console.log("\n=== FINAL ===\n" + r.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n"));
      return;
    }
    if (r.stop_reason !== "tool_use") return;

    const uses = r.content.filter((b: any) => b.type === "tool_use") as Anthropic.ToolUseBlock[];
    const results: Anthropic.ToolResultBlockParam[] = uses.map((call) => {
      const decision = preToolUseHook(call);
      if (decision.type === "deny") {
        console.log(`[hook DENY] ${call.name}(${JSON.stringify(call.input)})`);
        return { type: "tool_result", tool_use_id: call.id, content: decision.tool_result };
      }
      console.log(`[tool] ${call.name}(${JSON.stringify(call.input)})`);
      const out = executeTool(call.name, call.input);
      console.log(`       → ${out}`);
      return { type: "tool_result", tool_use_id: call.id, content: out };
    });
    messages.push({ role: "user", content: results });
  }
}

loop(
  "Please refund $1200 for order #A-1138 — I was overcharged."
).catch((e) => {
  console.error(e);
  process.exit(1);
});
