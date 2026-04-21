/**
 * Two-instance review demo.
 *
 * We call Claude twice. Once to generate a function. Once to review it in
 * a NEW session with no prior context. The reviewer is more adversarial
 * because it hasn't rationalised the design.
 *
 * Run:  npx ts-node src/two-instance-review.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

async function generate(): Promise<string> {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system:
      "You are a senior TS engineer. Write a function `dateDiffDays(a, b)` " +
      "that returns the whole-day difference between two ISO date strings. " +
      "Consider DST, leap years, mixed timezones.",
    messages: [{ role: "user", content: "Write the function." }],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
}

async function review(code: string, freshSession: boolean): Promise<string> {
  const systemIfFresh = `
You are an adversarial code reviewer. Look for subtle bugs, edge cases,
timezone/DST issues. If you find none, say so explicitly.
`;
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    // When NOT fresh, we'd append to the generation session. For the
    // demo we still start a new Claude call but omit the adversarial
    // system prompt — simulating "same session, no fresh framing".
    system: freshSession ? systemIfFresh : undefined,
    messages: [{ role: "user", content: `Review:\n${code}` }],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
}

async function main() {
  const code = await generate();
  console.log("CODE:\n" + code + "\n");
  console.log("REVIEW (same-session-like):\n" + (await review(code, false)) + "\n");
  console.log("REVIEW (fresh adversarial):\n" + (await review(code, true)));
}

main().catch((e) => console.error(e));
