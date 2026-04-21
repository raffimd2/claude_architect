/**
 * Case-facts pattern demo.
 *
 * Simulate a 3-turn support conversation. Version A summarises the earlier
 * turns naively. Version B maintains a persistent [CASE FACTS] block.
 * Both get the same final question; only B remembers the order ID.
 *
 * Run:  npx ts-node src/case-facts.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

type CaseFacts = {
  customer_email?: string;
  order_id?: string;
  stated_amount_usd?: number;
};

const historyNaiveSummary =
  "Customer said their package arrived damaged last week and asked about refunds. They seemed frustrated.";

const historyWithFacts = `
[CASE FACTS]
  customer_email: priya@example.com
  order_id:       A-1138
  stated_amount_usd: 800
  issue:          package arrived damaged on 2024-11-05
  expectation:    full refund

[SUMMARY]
Customer is frustrated. We need to resolve the refund.
`;

async function answer(history: string) {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system:
      "You are a support agent. Answer the customer's final question using ONLY " +
      "the provided history. If a fact is not in the history, say 'unknown'.",
    messages: [
      {
        role: "user",
        content: `HISTORY:\n${history}\n\nFINAL MESSAGE: What's my order ID and how much am I owed?`,
      },
    ],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
}

async function main() {
  console.log("=== NAIVE SUMMARY ===");
  console.log(await answer(historyNaiveSummary));
  console.log("\n=== CASE FACTS BLOCK ===");
  console.log(await answer(historyWithFacts));
}

main().catch((e) => console.error(e));
