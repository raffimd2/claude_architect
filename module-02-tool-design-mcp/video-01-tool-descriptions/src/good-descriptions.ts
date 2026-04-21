/**
 * GOOD descriptions — four-component template applied.
 *
 * Run:  npx ts-node src/good-descriptions.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const tools: Anthropic.Tool[] = [
  {
    name: "get_customer",
    description:
      "Look up a customer record by email or customer ID.\n\n" +
      "USE WHEN:\n" +
      "  - The user provides an email or a customer ID like 'C-42'\n" +
      "  - You need the customer's plan, verified status, or recent ticket IDs\n\n" +
      "DO NOT USE WHEN:\n" +
      "  - The user provides an order ID (ORD- or A-). Use lookup_order instead.\n\n" +
      "Inputs:\n" +
      "  - email: string (optional) — e.g. 'priya@example.com'\n" +
      "  - customer_id: string (optional) — e.g. 'C-42'\n\n" +
      "Returns: { customer_id, name, plan, verified, recent_ticket_ids[] }",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        customer_id: { type: "string" },
      },
    },
  },
  {
    name: "lookup_order",
    description:
      "Look up an order by order ID.\n\n" +
      "USE WHEN:\n" +
      "  - The user provides an order ID matching /^(ORD-|A-)\\w+/, e.g. 'A-1138'\n" +
      "  - You need status, line items, or refund history for a specific order\n\n" +
      "DO NOT USE WHEN:\n" +
      "  - The user provides an email or customer ID. Use get_customer first.\n\n" +
      "Inputs:\n" +
      "  - order_id: string — e.g. 'A-1138'\n\n" +
      "Returns: { order_id, status, total, line_items[], refunded_at }",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
    },
  },
];

async function run(question: string) {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    tools,
    messages: [{ role: "user", content: question }],
  });
  for (const b of r.content) {
    if (b.type === "tool_use") console.log(`→ ${b.name}(${JSON.stringify(b.input)})`);
  }
}

run("Can you check my order #A-1138 status?");
