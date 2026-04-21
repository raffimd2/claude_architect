/**
 * BAD descriptions — watch Claude misroute.
 *
 * Both tools accept similar identifiers and have one-line descriptions.
 * The user asks about an order, but Claude often calls get_customer first
 * because it can't differentiate.
 *
 * Run:  npx ts-node src/bad-descriptions.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const tools: Anthropic.Tool[] = [
  {
    name: "get_customer",
    description: "Retrieves customer information.",
    input_schema: {
      type: "object",
      properties: { identifier: { type: "string" } },
      required: ["identifier"],
    },
  },
  {
    name: "lookup_order",
    description: "Retrieves order details.",
    input_schema: {
      type: "object",
      properties: { identifier: { type: "string" } },
      required: ["identifier"],
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
