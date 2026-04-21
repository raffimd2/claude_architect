/**
 * tool_choice: forced named tool.
 *
 * First turn forces extract_metadata so enrichment can't run until metadata
 * exists. Second turn reverts to "auto" for the agentic phase.
 *
 * Run:  npx ts-node src/tool-choice-forced.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const tools: Anthropic.Tool[] = [
  {
    name: "extract_metadata",
    description: "Extract document metadata: title, author, date.",
    input_schema: {
      type: "object",
      properties: { title: { type: "string" }, author: { type: "string" }, date: { type: "string" } },
      required: ["title", "author", "date"],
    },
  },
  {
    name: "enrich_with_citations",
    description: "Enrich metadata with BibTeX and DOI lookups.",
    input_schema: {
      type: "object",
      properties: { title: { type: "string" }, author: { type: "string" } },
      required: ["title", "author"],
    },
  },
];

const DOC = `Project Orion report by Tom Smith, September 14 2024. Contents: ...`;

async function main() {
  // Turn 1 — force metadata extraction.
  const r1 = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    tools,
    tool_choice: { type: "tool", name: "extract_metadata" },
    messages: [{ role: "user", content: DOC }],
  });
  console.log("turn 1 (forced):");
  for (const b of r1.content) if (b.type === "tool_use") console.log(`  → ${b.name}: ${JSON.stringify(b.input)}`);

  // Turn 2 — auto. The model decides whether enrichment is needed.
  // (For brevity we don't run the full loop here; in production you'd
  // append the tool_result and continue.)
  console.log("\nturn 2 would resume with tool_choice: 'auto'.");
}

main().catch((e) => console.error(e));
