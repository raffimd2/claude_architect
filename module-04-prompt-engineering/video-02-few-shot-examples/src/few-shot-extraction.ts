/**
 * Few-shot extraction demo.
 *
 * Prompt contains 3 worked examples — one inline-citation doc, one
 * bibliographic, one narrative. We then give Claude a 4th doc with a
 * structure it has NOT seen, and it generalises.
 *
 * Run:  npx ts-node src/few-shot-extraction.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const SYSTEM = `
Extract {title, authors[], published_at} from each document as JSON.

EXAMPLE 1 — inline citation
Doc: "AI in music (Smith & Lee, 2024) changed everything."
Output: {"title": null, "authors": ["Smith", "Lee"], "published_at": "2024"}

EXAMPLE 2 — bibliographic
Doc: "Title: Neural Mastering. Authors: T. Smith, R. Lee. Published: Jan 2024."
Output: {"title": "Neural Mastering", "authors": ["T. Smith", "R. Lee"], "published_at": "2024-01"}

EXAMPLE 3 — narrative
Doc: "Tom Smith and Rhea Lee published their breakthrough on mastering in early 2024, titled 'Neural Mastering'."
Output: {"title": "Neural Mastering", "authors": ["Tom Smith", "Rhea Lee"], "published_at": "2024"}

Return ONLY the JSON. If a field is missing, use null.
`;

const UNSEEN_DOC = `
(2024) · "Latent Mixing" · by T. Smith, collaborating with R. Lee and J. Park.
`;

async function main() {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: SYSTEM,
    messages: [{ role: "user", content: UNSEEN_DOC }],
  });
  console.log(r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n"));
}

main().catch((e) => console.error(e));
