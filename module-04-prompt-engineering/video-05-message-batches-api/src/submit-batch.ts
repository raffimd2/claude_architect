/**
 * Message Batches API — submit + poll + correlate by custom_id.
 *
 * Three summarisation requests, each tagged with a custom_id so we can
 * identify failures if any.
 *
 * Run:  npx ts-node src/submit-batch.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const DOCS = [
  { id: "doc-001", body: "Project Orion completed 2024-09-14 at $1.2M cost." },
  { id: "doc-002", body: "Q3 revenue up 12% yoy driven by subscription tier." },
  { id: "doc-003", body: "Security audit: one high-sev SQL injection in v3.1." },
];

async function main() {
  const batch = await (client as any).messages.batches.create({
    requests: DOCS.map((d) => ({
      custom_id: d.id,
      params: {
        model: MODEL,
        max_tokens: 150,
        messages: [
          { role: "user", content: `Summarise in one sentence:\n${d.body}` },
        ],
      },
    })),
  });

  console.log("submitted:", batch.id);

  // Poll until terminal. In production you'd back off; here we just wait.
  let status = batch;
  while (!["ended", "canceled", "expired"].includes(status.processing_status)) {
    await new Promise((r) => setTimeout(r, 5000));
    status = await (client as any).messages.batches.retrieve(batch.id);
    console.log("status:", status.processing_status);
  }

  // Stream results.
  const results = (client as any).messages.batches.results(batch.id);
  for await (const r of results) {
    if (r.result.type === "succeeded") {
      const text = r.result.message.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("");
      console.log(`${r.custom_id}: ${text}`);
    } else {
      console.log(`${r.custom_id}: FAILED — resubmit with modifications`);
    }
  }
}

main().catch((e) => console.error(e));
