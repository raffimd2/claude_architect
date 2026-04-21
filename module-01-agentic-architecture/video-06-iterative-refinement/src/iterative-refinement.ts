/**
 * Iterative refinement loop demo.
 *
 * Round 1: researcher returns findings on the original topic.
 * Round 2: evaluator checks coverage against the user query.
 * Round 3: researcher fills the gaps; synthesiser re-runs.
 *
 * Run:  npx ts-node src/iterative-refinement.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

async function ask(system: string, user: string): Promise<string> {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system,
    messages: [{ role: "user", content: user }],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
}

async function research(topic: string): Promise<string[]> {
  const out = await ask(
    'Return 4 bullet findings. One per line. Prefix each with "- ".',
    `Topic: ${topic}`
  );
  return out.split("\n").filter((l) => l.startsWith("- "));
}

async function evaluate(query: string, findings: string[]): Promise<{ missing: string[] }> {
  const out = await ask(
    `You audit coverage. Given a user query and a list of findings, return STRICT JSON:
    {"missing": ["subtopic1", ...]}
    List concrete subtopics implied by the query but not present in findings. If fully covered, return {"missing": []}.`,
    `Query: ${query}\n\nFindings:\n${findings.join("\n")}`
  );
  try {
    const jsonStart = out.indexOf("{");
    return JSON.parse(out.slice(jsonStart));
  } catch {
    return { missing: [] };
  }
}

async function synthesise(query: string, findings: string[]): Promise<string> {
  return ask(
    "Write a 4-sentence summary. Keep bullet citations as [source] markers.",
    `Query: ${query}\n\nFindings:\n${findings.join("\n")}`
  );
}

async function main() {
  const query = "impact of AI on creative industries";
  let findings: string[] = [];

  console.log("ROUND 1 — initial research");
  findings = findings.concat(await research(query));
  console.log(findings.join("\n"));

  for (let round = 2; round <= 3; round++) {
    console.log(`\nROUND ${round} — evaluate coverage`);
    const { missing } = await evaluate(query, findings);
    console.log("missing:", missing);
    if (missing.length === 0) break;

    for (const m of missing.slice(0, 3)) {
      console.log(`  → researching ${m}`);
      findings = findings.concat(await research(m));
    }
  }

  console.log("\n=== FINAL SUMMARY ===");
  console.log(await synthesise(query, findings));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
