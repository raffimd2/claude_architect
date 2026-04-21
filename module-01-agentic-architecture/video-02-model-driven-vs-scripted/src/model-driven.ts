/**
 * Model-driven demo.
 *
 * Same agentic loop as Module 1 Video 1 — but now the user's question is
 * open-ended. Claude decides iteration-by-iteration which of the two tools
 * to call. We do NOT hard-code the sequence.
 *
 * Run:  npx ts-node src/model-driven.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const tools: Anthropic.Tool[] = [
  {
    name: "search_ticket",
    description: "Look up a support ticket by ID. Returns subject, body, and status.",
    input_schema: {
      type: "object",
      properties: { ticket_id: { type: "string" } },
      required: ["ticket_id"],
    },
  },
  {
    name: "search_customer",
    description: "Look up a customer by email. Returns customer name, plan, recent ticket IDs.",
    input_schema: {
      type: "object",
      properties: { email: { type: "string" } },
      required: ["email"],
    },
  },
];

function runTool(name: string, input: any): string {
  if (name === "search_customer" && input.email === "priya@example.com") {
    return JSON.stringify({
      name: "Priya",
      plan: "Pro",
      recent_ticket_ids: ["T-9001", "T-9002"],
    });
  }
  if (name === "search_ticket" && input.ticket_id === "T-9001") {
    return JSON.stringify({
      subject: "Double-charged for subscription",
      body: "Charged twice on the 14th (A-1138, A-1139).",
      status: "open",
    });
  }
  if (name === "search_ticket" && input.ticket_id === "T-9002") {
    return JSON.stringify({
      subject: "Thanks for the refund",
      body: "All sorted, thanks!",
      status: "closed",
    });
  }
  return JSON.stringify({ error: "not found" });
}

async function loop(userPrompt: string) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  for (let i = 0; i < 25; i++) {
    const r = await client.messages.create({ model: MODEL, max_tokens: 1024, tools, messages });
    messages.push({ role: "assistant", content: r.content });

    if (r.stop_reason === "end_turn") {
      console.log("\n=== FINAL ===\n" + r.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n"));
      return;
    }

    if (r.stop_reason === "tool_use") {
      const uses = r.content.filter((b: any) => b.type === "tool_use");
      const results: Anthropic.ToolResultBlockParam[] = uses.map((u: any) => {
        console.log(`[${i + 1}] ${u.name}(${JSON.stringify(u.input)})`);
        const out = runTool(u.name, u.input);
        console.log(`    → ${out}`);
        return { type: "tool_result", tool_use_id: u.id, content: out };
      });
      messages.push({ role: "user", content: results });
      continue;
    }
    return;
  }
}

// Open-ended — Claude has to look up the customer, THEN decide which ticket
// to investigate based on the status field. We never told it to do that.
loop(
  "Priya (priya@example.com) emailed us. Find her current open issue and summarise it."
).catch((e) => {
  console.error(e);
  process.exit(1);
});
