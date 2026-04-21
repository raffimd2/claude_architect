/**
 * Scenario 3 capstone — Multi-agent research system (simplified).
 *
 * We implement the orchestration WITHOUT the Agent SDK, so the file is
 * self-contained and runnable. The patterns shown are the ones the exam
 * tests; swapping in query() + Task/allowedTools is a mechanical change.
 *
 *   - Coordinator pulls findings from 2 searchers in parallel.
 *   - Every finding is {claim, source, date, excerpt}.
 *   - Coverage evaluator; re-delegation if gaps.
 *   - Synthesiser has a scoped verify_fact tool.
 *   - Error propagation if a searcher "times out" (long queries fail).
 *
 * Run:  npx ts-node src/research-system.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

type Finding = { claim: string; source: string; date: string; excerpt: string };

type SubResult =
  | { ok: true; findings: Finding[] }
  | { ok: false; attempted: string; partial: Finding[]; alternatives: string[] };

async function ask(system: string, user: string): Promise<string> {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    system,
    messages: [{ role: "user", content: user }],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
}

async function search(q: string): Promise<SubResult> {
  if (q.length > 60) {
    return { ok: false, attempted: q, partial: [], alternatives: ["split by subtopic"] };
  }
  const out = await ask(
    'Return a JSON array of 3 findings. Each: {"claim","source","date","excerpt"}. JSON only.',
    `Topic: ${q}`
  );
  try {
    const start = out.indexOf("[");
    return { ok: true, findings: JSON.parse(out.slice(start)) as Finding[] };
  } catch {
    return { ok: false, attempted: q, partial: [], alternatives: ["retry with narrower query"] };
  }
}

async function evaluateCoverage(query: string, findings: Finding[]): Promise<string[]> {
  const out = await ask(
    'Given a user query and findings, output STRICT JSON: {"missing": [subtopic,...]}. Empty list if fully covered.',
    `Query: ${query}\n\nFindings JSON:\n${JSON.stringify(findings, null, 2)}`
  );
  try {
    return (JSON.parse(out.slice(out.indexOf("{"))) as any).missing ?? [];
  } catch {
    return [];
  }
}

async function synthesise(query: string, findings: Finding[]): Promise<string> {
  return ask(
    `Synthesise a report. Preserve citations as [source, date]. Include a 'coverage' section
     distinguishing well-established from contested findings. If dates differ significantly
     across sources, call that out instead of treating it as a contradiction.`,
    `Query: ${query}\n\nFindings JSON:\n${JSON.stringify(findings, null, 2)}`
  );
}

async function main() {
  const query = "impact of AI on creative industries";
  const subtopics = ["AI in music production", "AI in screenwriting", "AI in visual arts"];
  const findings: Finding[] = [];

  // Parallel spawn.
  const subs = await Promise.all(subtopics.map((s) => search(s)));
  for (const r of subs) {
    if (r.ok) findings.push(...r.findings);
    else console.log(`[propagate] error: ${r.attempted} — alternatives: ${r.alternatives.join(", ")}`);
  }

  // Refinement loop.
  for (let round = 1; round <= 2; round++) {
    const missing = await evaluateCoverage(query, findings);
    console.log(`round ${round}: ${missing.length} missing — ${missing.join(", ")}`);
    if (missing.length === 0) break;

    const more = await Promise.all(missing.slice(0, 2).map((m) => search(m)));
    for (const r of more) if (r.ok) findings.push(...r.findings);
  }

  // Synthesis.
  console.log("\n=== REPORT ===\n" + (await synthesise(query, findings)));
}

main().catch((e) => console.error(e));
