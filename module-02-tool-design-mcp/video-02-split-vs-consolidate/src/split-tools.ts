/**
 * Split-tool demo.
 *
 * Three purpose-specific tools instead of one generic analyze_document.
 * We ask three different questions about the same document and show how
 * Claude picks the right tool each time.
 *
 * Run:  npx ts-node src/split-tools.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const DOC = `
Project Orion was completed on 2024-09-14 at a cost of $1.2M, led by
engineering director Tom Smith. It delivered the new payments gateway;
early metrics show a 12% reduction in transaction failures. Smith's
follow-up paper will appear in JSE 2025.
`;

const tools: Anthropic.Tool[] = [
  {
    name: "extract_data_points",
    description:
      "Extract specific named fields from a document. Use when the caller wants " +
      "explicit data (dates, amounts, names).",
    input_schema: {
      type: "object",
      properties: {
        doc: { type: "string" },
        fields: { type: "array", items: { type: "string" } },
      },
      required: ["doc", "fields"],
    },
  },
  {
    name: "summarize_content",
    description:
      "Produce a length-bounded summary of a document. Use when the caller wants " +
      "a natural-language overview, not specific fields.",
    input_schema: {
      type: "object",
      properties: {
        doc: { type: "string" },
        max_sentences: { type: "number" },
      },
      required: ["doc", "max_sentences"],
    },
  },
  {
    name: "verify_claim_against_source",
    description:
      "Verify whether a specific claim is supported by a document. Returns " +
      "{supports: bool, excerpt: string}. Use when the caller wants to fact-check.",
    input_schema: {
      type: "object",
      properties: {
        doc: { type: "string" },
        claim: { type: "string" },
      },
      required: ["doc", "claim"],
    },
  },
];

async function ask(q: string) {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    tools,
    messages: [{ role: "user", content: `${q}\n\nDOCUMENT:\n${DOC}` }],
  });
  for (const b of r.content) {
    if (b.type === "tool_use") console.log(`Q: ${q}\n→ ${b.name}(${JSON.stringify(b.input).slice(0, 120)}...)\n`);
  }
}

async function main() {
  await ask("What's the completion date and cost of the project?");
  await ask("Give me a two-sentence summary of the project.");
  await ask("Is it true that Tom Smith led the project?");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
