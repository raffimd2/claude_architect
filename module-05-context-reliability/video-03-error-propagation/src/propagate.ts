/**
 * Error propagation simulation (no Claude calls — pure orchestration).
 *
 * A subagent times out. It returns structured error context. The
 * coordinator retries with a narrower query, then accepts partial
 * results with a coverage annotation.
 *
 * Run:  npx ts-node src/propagate.ts
 */

type SubagentResult =
  | { ok: true; findings: string[] }
  | {
      ok: false;
      errorCategory: "transient" | "business" | "permission";
      isRetryable: boolean;
      attemptedQuery: string;
      partialResults: string[];
      alternatives: string[];
    };

// Fake subagent that "times out" on broad queries.
async function subSearch(query: string): Promise<SubagentResult> {
  if (query.length > 30) {
    return {
      ok: false,
      errorCategory: "transient",
      isRetryable: true,
      attemptedQuery: query,
      partialResults: ["partial: found 1 paper before timeout"],
      alternatives: ["split query into per-subtopic queries"],
    };
  }
  return { ok: true, findings: [`result for "${query}"`, `another result for "${query}"`] };
}

async function coordinator() {
  const broad = "creative industries AI music writing film";
  console.log(`attempt 1: ${broad}`);
  let r = await subSearch(broad);

  if (!r.ok && r.isRetryable) {
    console.log(`  → ${r.errorCategory} error. suggested: ${r.alternatives.join(" | ")}`);
    // Narrow — per-subtopic.
    const subs = ["AI music", "AI film"];
    const partials: string[] = [...r.partialResults];
    for (const s of subs) {
      console.log(`attempt 2: ${s}`);
      const r2 = await subSearch(s);
      if (r2.ok) partials.push(...r2.findings);
    }
    console.log("\nREPORT:");
    console.log(JSON.stringify({
      findings: partials,
      coverage: {
        covered: subs,
        gaps_due_to_errors: ["writing (still unqueried after retries)"],
      },
    }, null, 2));
  }
}

coordinator();
