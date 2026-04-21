/**
 * Structured extraction via tool_use.
 *
 * Single schema with:
 *   - required vs optional fields
 *   - nullable types (prevents fabrication)
 *   - enum with "other" + detail for extensible categories
 *
 * Run:  npx ts-node src/extract-with-tool.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const saveInvoice: Anthropic.Tool = {
  name: "save_invoice",
  description: "Save structured invoice data.",
  input_schema: {
    type: "object",
    properties: {
      vendor: { type: "string" },
      total: { type: "number" },
      due_date: { type: ["string", "null"] },
      category: { type: "string", enum: ["services", "goods", "subscription", "other"] },
      category_detail: { type: ["string", "null"] },
    },
    required: ["vendor", "total", "category"],
  } as any,
};

const DOCS = [
  "Acme · Invoice #INV-9012 · Due 2024-12-31 · Total $2,400 · Services",
  "Small Cafe receipt · $13.40 · Nov 3 2024",
  "Gym subscription monthly $49.99",
];

async function extract(doc: string) {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    tools: [saveInvoice],
    tool_choice: { type: "tool", name: "save_invoice" },
    messages: [{ role: "user", content: doc }],
  });
  for (const b of r.content) {
    if (b.type === "tool_use") console.log(`DOC: ${doc}\n→ ${JSON.stringify(b.input, null, 2)}\n`);
  }
}

async function main() {
  for (const d of DOCS) await extract(d);
}

main().catch((e) => console.error(e));
