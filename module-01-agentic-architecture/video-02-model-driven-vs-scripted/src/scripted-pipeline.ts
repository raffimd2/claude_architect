/**
 * Scripted / prompt-chaining demo.
 *
 * We decompose "summarise this support ticket" into three FIXED steps.
 * Each step is its own Claude call. There is no agentic loop — this is
 * the exam's "scripted" pattern, and it's the right choice when:
 *   - steps must happen in a fixed order, AND
 *   - each step has predictable inputs/outputs.
 *
 * Run:  npx ts-node src/scripted-pipeline.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const TICKET = `
Subject: Double-charged for subscription
Hi, I was charged twice on the 14th for my Pro subscription
(order #A-1138 and #A-1139). Please refund one of them.
— Priya
`;

async function ask(system: string, user: string): Promise<string> {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: user }],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
}

async function main() {
  console.log("STEP 1 — extract structured facts");
  const facts = await ask(
    "Extract: customer_name, issue, order_ids (array). Return JSON only.",
    TICKET
  );
  console.log(facts);

  console.log("\nSTEP 2 — classify intent");
  const intent = await ask(
    'Classify the ticket intent as one of: "refund_request", "billing_question", "other". Return just the label.',
    TICKET
  );
  console.log(intent.trim());

  console.log("\nSTEP 3 — draft customer response");
  const reply = await ask(
    "Draft a warm, two-sentence acknowledgement that we will investigate and refund if duplicate.",
    `Facts: ${facts}\n\nTicket:\n${TICKET}`
  );
  console.log(reply);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
