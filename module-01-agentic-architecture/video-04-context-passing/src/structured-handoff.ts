/**
 * Structured handoff demo.
 *
 * A coordinator-style function calls two fake "subagents" (here, functions)
 * and produces a STRUCTURED payload. The real synthesis Claude call then
 * receives that payload as JSON and preserves citations.
 *
 * We use plain functions to keep the demo runnable without the Agent SDK —
 * the point is the SHAPE of what gets passed, not the SDK plumbing.
 *
 * Run:  npx ts-node src/structured-handoff.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

type Finding = {
  claim: string;
  source: string;
  url?: string;
  date: string;
  excerpt: string;
};

// Pretend-subagent #1.
async function search_landr(): Promise<Finding[]> {
  return [
    {
      claim: "LANDR offers AI-driven mastering",
      source: "LANDR docs",
      url: "https://example.com/landr",
      date: "2024-11-03",
      excerpt: "Upload a WAV, get a mastered output in 60s.",
    },
  ];
}

// Pretend-subagent #2.
async function search_academic(): Promise<Finding[]> {
  return [
    {
      claim: "A 2024 study found AI affects mixing EQ decisions by 12%",
      source: "Journal of Audio Engineering",
      date: "2024-05-01",
      excerpt: "We observed a 12% shift in EQ decisions across 50 engineers.",
    },
  ];
}

async function synthesise(findings: Finding[]): Promise<string> {
  const system = `You synthesise findings. Every claim must carry a bracketed
citation like [source, YYYY-MM-DD]. Produce 3 sentences.`;

  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [
      {
        role: "user",
        content: `Findings (JSON):\n${JSON.stringify(findings, null, 2)}`,
      },
    ],
  });

  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
}

async function main() {
  const all = [...(await search_landr()), ...(await search_academic())];
  console.log("STRUCTURED HANDOFF:");
  console.log(JSON.stringify(all, null, 2));
  console.log("\nSYNTHESIS:");
  console.log(await synthesise(all));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
