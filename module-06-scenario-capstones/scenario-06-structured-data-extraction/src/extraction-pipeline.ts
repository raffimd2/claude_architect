/**
 * Scenario 6 capstone — full extraction pipeline.
 *
 * Flow per document:
 *   1. Extract via tool_use with strict schema.
 *   2. Validate semantics (line_items sum == total).
 *   3. Retry ONCE with error feedback on validation failure.
 *   4. Compute effective confidence (min of per-field).
 *   5. Route: auto-accept if confidence >= 0.9 AND no conflict.
 *             Human review otherwise.
 *
 * Run:  npx ts-node src/extraction-pipeline.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

type Extracted = {
  vendor: { value: string; confidence: number };
  total: { value: number; confidence: number };
  due_date: { value: string | null; confidence: number };
  line_items: { label: string; amount: number }[];
  category: "services" | "goods" | "subscription" | "other";
  category_detail?: string | null;
  stated_total: number;
  calculated_total: number;
  conflict_detected: boolean;
};

const saveInvoice: Anthropic.Tool = {
  name: "save_invoice",
  description: "Save structured invoice extraction with confidence scores and validation fields.",
  input_schema: {
    type: "object",
    properties: {
      vendor: {
        type: "object",
        properties: { value: { type: "string" }, confidence: { type: "number" } },
        required: ["value", "confidence"],
      },
      total: {
        type: "object",
        properties: { value: { type: "number" }, confidence: { type: "number" } },
        required: ["value", "confidence"],
      },
      due_date: {
        type: "object",
        properties: { value: { type: ["string", "null"] }, confidence: { type: "number" } },
        required: ["value", "confidence"],
      },
      line_items: {
        type: "array",
        items: {
          type: "object",
          properties: { label: { type: "string" }, amount: { type: "number" } },
          required: ["label", "amount"],
        },
      },
      category: { type: "string", enum: ["services", "goods", "subscription", "other"] },
      category_detail: { type: ["string", "null"] },
      stated_total: { type: "number" },
      calculated_total: { type: "number" },
      conflict_detected: { type: "boolean" },
    },
    required: [
      "vendor",
      "total",
      "due_date",
      "line_items",
      "category",
      "stated_total",
      "calculated_total",
      "conflict_detected",
    ],
  } as any,
};

const DOCS = [
  "Acme Corp · Invoice #INV-9012 · Due 2024-12-31 · Widgets $40x2, Gizmo $60, Delivery $10. Total $150. Services",
  "Small cafe receipt · $13.40 · Nov 3 2024. (No due date.)",
  "Gym subscription · Monthly $49.99 · category: fitness",
];

async function extractOnce(doc: string, feedback?: string): Promise<Extracted> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: doc }];
  if (feedback) {
    messages.push({ role: "user", content: `Validation feedback: ${feedback}. Return a corrected extraction.` });
  }
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    tools: [saveInvoice],
    tool_choice: { type: "tool", name: "save_invoice" },
    messages,
  });
  const use = r.content.find((b: any) => b.type === "tool_use") as Anthropic.ToolUseBlock;
  return use.input as Extracted;
}

function validate(x: Extracted): string | null {
  const sum = x.line_items.reduce((s, l) => s + l.amount, 0);
  if (Math.abs(sum - x.stated_total) > 0.01 && !x.conflict_detected) {
    return `line_items sum to ${sum} but stated_total is ${x.stated_total}. Set conflict_detected=true or recheck.`;
  }
  return null;
}

async function processDoc(doc: string) {
  console.log(`\nDOC: ${doc}`);
  let x = await extractOnce(doc);
  const err = validate(x);
  if (err) {
    console.log(`  ⚠  ${err}`);
    x = await extractOnce(doc, err);
  }
  const minConf = Math.min(x.vendor.confidence, x.total.confidence, x.due_date.confidence);
  const accept = minConf >= 0.9 && !x.conflict_detected;
  console.log(
    `  → route: ${accept ? "AUTO-ACCEPT" : "HUMAN REVIEW"}  (min_conf=${minConf}, conflict=${x.conflict_detected})`
  );
  console.log(`    ${JSON.stringify({ vendor: x.vendor.value, total: x.total.value, due_date: x.due_date.value })}`);
}

async function main() {
  for (const d of DOCS) await processDoc(d);
}

main().catch((e) => console.error(e));
