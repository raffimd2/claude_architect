/**
 * Validation-retry demo.
 *
 * Extract {total, line_items[]} from a noisy invoice.
 * Validation: line_items must sum to total (semantic check).
 * On failure, we retry ONCE with the specific error appended.
 *
 * Run:  npx ts-node src/validation-retry.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const saveInvoice: Anthropic.Tool = {
  name: "save_invoice",
  description: "Save invoice data.",
  input_schema: {
    type: "object",
    properties: {
      total: { type: "number" },
      line_items: {
        type: "array",
        items: {
          type: "object",
          properties: { label: { type: "string" }, amount: { type: "number" } },
          required: ["label", "amount"],
        },
      },
    },
    required: ["total", "line_items"],
  },
};

const DOC = `
Acme Invoice
- Widget x2 @ $40 each
- Gizmo x1 @ $60
- Delivery $10
Total: $100
`;

type Extracted = { total: number; line_items: { label: string; amount: number }[] };

function validate(x: Extracted): string | null {
  const sum = x.line_items.reduce((s, l) => s + l.amount, 0);
  if (Math.abs(sum - x.total) > 0.01) {
    return `Validation error: line_items sum to ${sum} but total is ${x.total}. Please recheck the line_items.`;
  }
  return null;
}

async function extract(messages: Anthropic.MessageParam[]): Promise<Extracted> {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    tools: [saveInvoice],
    tool_choice: { type: "tool", name: "save_invoice" },
    messages,
  });
  const use = r.content.find((b: any) => b.type === "tool_use") as Anthropic.ToolUseBlock;
  return use.input as Extracted;
}

async function main() {
  let messages: Anthropic.MessageParam[] = [{ role: "user", content: DOC }];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const x = await extract(messages);
    console.log(`ATTEMPT ${attempt}: ${JSON.stringify(x)}`);
    const err = validate(x);
    if (!err) {
      console.log("✅ validated");
      return;
    }
    console.log(`❌ ${err}`);
    // Retry with error feedback appended.
    messages = [
      { role: "user", content: DOC },
      { role: "assistant", content: JSON.stringify(x) },
      { role: "user", content: err + "\n\nReturn a corrected extraction." },
    ];
  }

  console.log("Could not validate after 2 attempts. Escalate to human.");
}

main().catch((e) => console.error(e));
