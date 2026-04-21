/**
 * Prerequisite gate demo — the exam's favourite pattern.
 *
 * process_refund MUST NOT run until get_customer has succeeded and
 * returned a verified customer ID. A hook enforces this deterministically.
 *
 * Run:  npx ts-node src/prerequisite-gate.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const tools: Anthropic.Tool[] = [
  {
    name: "get_customer",
    description: "Look up a customer by email. Returns {customer_id, verified}.",
    input_schema: {
      type: "object",
      properties: { email: { type: "string" } },
      required: ["email"],
    },
  },
  {
    name: "process_refund",
    description: "Process a refund. Requires a prior successful get_customer call.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        order_id: { type: "string" },
        amount_usd: { type: "number" },
      },
      required: ["customer_id", "order_id", "amount_usd"],
    },
  },
];

type Session = { verifiedCustomerId?: string };

function executeTool(name: string, input: any, session: Session): string {
  if (name === "get_customer") {
    session.verifiedCustomerId = "C-42";
    return JSON.stringify({ customer_id: "C-42", verified: true });
  }
  if (name === "process_refund") {
    return JSON.stringify({ status: "refunded", order_id: input.order_id });
  }
  return JSON.stringify({ error: "unknown tool" });
}

function preToolUseHook(call: Anthropic.ToolUseBlock, session: Session): string | null {
  if (call.name === "process_refund" && !session.verifiedCustomerId) {
    return JSON.stringify({
      status: "blocked",
      reason: "Customer not verified. Call get_customer first.",
    });
  }
  return null;
}

async function loop(userPrompt: string) {
  const session: Session = {};
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
      const denied = preToolUseHook(call, session);
      if (denied) {
        console.log(`[hook BLOCK] ${call.name} — prerequisite missing`);
        return { type: "tool_result", tool_use_id: call.id, content: denied };
      }
      console.log(`[tool] ${call.name}(${JSON.stringify(call.input)})`);
      const out = executeTool(call.name, call.input, session);
      console.log(`       → ${out}`);
      return { type: "tool_result", tool_use_id: call.id, content: out };
    });
    messages.push({ role: "user", content: results });
  }
}

loop(
  "Customer priya@example.com wants a $50 refund on order A-1138."
).catch((e) => {
  console.error(e);
  process.exit(1);
});
