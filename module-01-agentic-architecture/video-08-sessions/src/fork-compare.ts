/**
 * Fork-and-compare simulation.
 *
 * We "simulate" a session baseline by inlining a shared analysis summary,
 * then fire two Claude calls that start from that identical baseline and
 * diverge into two different refactor plans. Real fork_session in the
 * Agent SDK does this at the session level; the exam only asks you to
 * recognise the pattern, not memorise the API.
 *
 * Run:  npx ts-node src/fork-compare.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const BASELINE_ANALYSIS = `
# Baseline analysis (shared across forks)
- Repo: legacy-billing (Node 14, Express 4, ~22k LOC)
- Entry points: src/api/invoices.ts, src/api/payments.ts
- Critical paths: /invoices (GET/POST), /payments (POST)
- Pain: shared global singleton for Stripe client makes testing hard.
- Constraint: must deploy with zero downtime; revenue-path service.
`;

async function plan(strategy: string): Promise<string> {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system:
      "You are a staff engineer. Produce a migration plan in 6 numbered steps. " +
      "Call out risks and rollback for each step.",
    messages: [
      {
        role: "user",
        content: `${BASELINE_ANALYSIS}\n\nStrategy requested: ${strategy}\n\nWrite the plan.`,
      },
    ],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
}

async function main() {
  const [strangler, bigBang] = await Promise.all([
    plan("strangler-fig pattern (route-by-route)"),
    plan("big-bang replacement behind a feature flag"),
  ]);

  console.log("=== FORK A — Strangler ===\n" + strangler);
  console.log("\n=== FORK B — Big Bang ===\n" + bigBang);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
