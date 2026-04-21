/**
 * Scenario 4 capstone — developer productivity assistant (agentic loop).
 *
 * Tools:
 *   - grep_repo(pattern)
 *   - read_file(path)
 *   - write_scratchpad(text)
 *
 * Scratchpad is an in-memory string. In Claude Code you'd write a real file.
 *
 * Run:  npx ts-node src/dev-assistant.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const REPO: Record<string, string> = {
  "src/api/refund.ts": "export async function refund(req, res) { /* ... */ }",
  "src/services/refund.ts": "export const refundService = { process(orderId, amount) { /* ... */ } }",
  "src/clients/stripe.ts": "import stripe from 'stripe'; export const stripeRefund = ...",
};

let scratchpad = "";

const tools: Anthropic.Tool[] = [
  {
    name: "grep_repo",
    description: "Grep source files for a regex pattern. Returns {file, line}[] hits.",
    input_schema: { type: "object", properties: { pattern: { type: "string" } }, required: ["pattern"] },
  },
  {
    name: "read_file",
    description: "Read a file by repo-relative path. Returns full contents.",
    input_schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
  },
  {
    name: "write_scratchpad",
    description: "Append a finding to the investigation scratchpad.",
    input_schema: { type: "object", properties: { note: { type: "string" } }, required: ["note"] },
  },
];

function run(name: string, input: any): string {
  if (name === "grep_repo") {
    const rx = new RegExp(input.pattern);
    const hits = Object.entries(REPO)
      .filter(([_, v]) => rx.test(v))
      .map(([file]) => ({ file }));
    return JSON.stringify(hits);
  }
  if (name === "read_file") {
    return REPO[input.path] ?? "FILE NOT FOUND";
  }
  if (name === "write_scratchpad") {
    scratchpad += `- ${input.note}\n`;
    return JSON.stringify({ ok: true });
  }
  return JSON.stringify({ isError: true });
}

async function loop(userPrompt: string) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  for (let i = 0; i < 12; i++) {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system:
        "You investigate a repo. Use grep_repo first to find hits, then read_file " +
        "to inspect, then write_scratchpad to record findings. End when you've " +
        "summarised the flow.",
      tools,
      messages,
    });
    messages.push({ role: "assistant", content: r.content });
    if (r.stop_reason === "end_turn") {
      console.log("\n=== FINAL ANSWER ===\n" + r.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n"));
      console.log("\n=== SCRATCHPAD ===\n" + scratchpad);
      return;
    }
    if (r.stop_reason !== "tool_use") return;
    const uses = r.content.filter((b: any) => b.type === "tool_use") as Anthropic.ToolUseBlock[];
    const results: Anthropic.ToolResultBlockParam[] = uses.map((u) => ({
      type: "tool_result",
      tool_use_id: u.id,
      content: run(u.name, u.input),
    }));
    messages.push({ role: "user", content: results });
  }
}

loop("Trace how refunds flow through this codebase. Summarise in 3 bullets.").catch((e) => console.error(e));
