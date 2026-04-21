/**
 * Scenario 1 capstone — Customer Support Resolution Agent.
 *
 * Demonstrates:
 *   - 4 MCP-style tools with rich descriptions (Module 2)
 *   - Structured error responses (Module 2)
 *   - Prerequisite hook (Module 1 V7)
 *   - Refund-limit hook (Module 1 V7)
 *   - Case facts block (Module 5 V1)
 *   - Escalation few-shot + handoff packet (Module 5 V2)
 *
 * Run:  npx ts-node src/support-agent.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";
const REFUND_LIMIT = 500;

type Session = {
  verifiedCustomerId?: string;
  facts: {
    customer_email?: string;
    order_id?: string;
    stated_amount_usd?: number;
  };
};

const tools: Anthropic.Tool[] = [
  {
    name: "get_customer",
    description:
      "Look up a customer by email or customer ID.\nUSE WHEN: you need customer identity, plan, or verified status.\nDO NOT USE WHEN: only an order ID is provided — use lookup_order.",
    input_schema: {
      type: "object",
      properties: { email: { type: "string" }, customer_id: { type: "string" } },
    },
  },
  {
    name: "lookup_order",
    description:
      "Look up an order by ID.\nUSE WHEN: you have an order ID like 'A-1138'.\nReturns: { order_id, status, total, refundable_until }.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
    },
  },
  {
    name: "process_refund",
    description:
      "Issue a refund on an order. Requires prior verified customer. Amounts > $500 require escalation.",
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
  {
    name: "escalate_to_human",
    description: "Escalate with a structured handoff packet.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string" },
        customer_id: { type: "string" },
        recommended_action: { type: "string" },
      },
      required: ["reason"],
    },
  },
];

const SYSTEM_PROMPT = `
You are a support resolution agent.

ESCALATION RULES (few-shot):
  Example 1 — Customer says "I want to speak to a human."
    Action: escalate_to_human immediately. Do not investigate first.
  Example 2 — Policy silent (e.g. competitor price match).
    Action: escalate_to_human with a handoff packet.
  Example 3 — Customer frustrated but issue is straightforward.
    Action: acknowledge, offer resolution, escalate only if they reiterate.

Use the CASE FACTS block in the most recent user turn as the source of truth.
`;

function buildCaseFacts(s: Session): string {
  const f = s.facts;
  return `[CASE FACTS]
  customer_email:      ${f.customer_email ?? "unknown"}
  verified_customer:   ${s.verifiedCustomerId ?? "no"}
  order_id:            ${f.order_id ?? "unknown"}
  stated_amount_usd:   ${f.stated_amount_usd ?? "unknown"}
`;
}

function runTool(name: string, input: any, session: Session): string {
  if (name === "get_customer") {
    session.verifiedCustomerId = "C-42";
    session.facts.customer_email = input.email;
    return JSON.stringify({ customer_id: "C-42", verified: true });
  }
  if (name === "lookup_order") {
    session.facts.order_id = input.order_id;
    return JSON.stringify({ order_id: input.order_id, status: "shipped", total: 800, refundable_until: "2025-01-01" });
  }
  if (name === "process_refund") {
    return JSON.stringify({ status: "refunded", order_id: input.order_id });
  }
  if (name === "escalate_to_human") {
    return JSON.stringify({ status: "escalated", ticket: "HUMAN-0001" });
  }
  return JSON.stringify({ isError: true, description: "unknown tool" });
}

function preHook(call: Anthropic.ToolUseBlock, session: Session): string | null {
  if (call.name === "process_refund") {
    if (!session.verifiedCustomerId) {
      return JSON.stringify({
        isError: true,
        errorCategory: "validation",
        isRetryable: false,
        description: "Customer not verified. Call get_customer first.",
      });
    }
    const amt = Number((call.input as any).amount_usd ?? 0);
    if (amt > REFUND_LIMIT) {
      return JSON.stringify({
        isError: true,
        errorCategory: "business",
        isRetryable: false,
        description: `Refund exceeds $${REFUND_LIMIT} limit. Escalate instead.`,
      });
    }
  }
  return null;
}

async function loop(userPrompt: string) {
  const session: Session = { facts: {} };
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `${buildCaseFacts(session)}\n${userPrompt}` },
  ];

  for (let i = 0; i < 15; i++) {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });
    messages.push({ role: "assistant", content: r.content });

    if (r.stop_reason === "end_turn") {
      console.log("\n=== FINAL ===\n" + r.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n"));
      return;
    }
    if (r.stop_reason !== "tool_use") return;

    const uses = r.content.filter((b: any) => b.type === "tool_use") as Anthropic.ToolUseBlock[];
    const results: Anthropic.ToolResultBlockParam[] = uses.map((call) => {
      const denied = preHook(call, session);
      if (denied) {
        console.log(`[hook DENY] ${call.name}`);
        return { type: "tool_result", tool_use_id: call.id, content: denied };
      }
      const out = runTool(call.name, call.input, session);
      console.log(`[tool] ${call.name}(${JSON.stringify(call.input)}) → ${out}`);
      return { type: "tool_result", tool_use_id: call.id, content: out };
    });

    // Re-inject fresh CASE FACTS each turn.
    messages.push({
      role: "user",
      content: [...results, { type: "text", text: buildCaseFacts(session) }] as any,
    });
  }
}

loop(
  "priya@example.com — I was charged $800 on order A-1138 which arrived damaged. I'd like a full refund."
).catch((e) => console.error(e));
