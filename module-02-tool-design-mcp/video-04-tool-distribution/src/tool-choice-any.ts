/**
 * tool_choice: "any" — the model MUST call one of the provided tools.
 *
 * Two extraction tools, one for invoices and one for receipts. We don't
 * know which document type we'll get, but we guarantee a structured
 * output instead of prose.
 *
 * Run:  npx ts-node src/tool-choice-any.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const tools: Anthropic.Tool[] = [
  {
    name: "extract_invoice",
    description: "Extract invoice fields: vendor, total, due_date, line_items.",
    input_schema: {
      type: "object",
      properties: {
        vendor: { type: "string" },
        total: { type: "number" },
        due_date: { type: "string" },
        line_items: { type: "array", items: { type: "string" } },
      },
      required: ["vendor", "total"],
    },
  },
  {
    name: "extract_receipt",
    description: "Extract receipt fields: merchant, total, purchased_at.",
    input_schema: {
      type: "object",
      properties: {
        merchant: { type: "string" },
        total: { type: "number" },
        purchased_at: { type: "string" },
      },
      required: ["merchant", "total"],
    },
  },
];

const DOC = `Acme Corp · Invoice #INV-9012 · Due 2024-12-31 · Total $2,400 · 2x widgets, 1x gizmo`;

async function main() {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    tools,
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: DOC }],
  });
  for (const b of r.content) {
    if (b.type === "tool_use") console.log(`→ ${b.name}:\n${JSON.stringify(b.input, null, 2)}`);
  }
}

main().catch((e) => console.error(e));
