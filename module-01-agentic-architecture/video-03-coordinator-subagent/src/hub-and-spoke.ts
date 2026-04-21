/**
 * Hub-and-spoke demo using @anthropic-ai/claude-agent-sdk.
 *
 * A coordinator delegates to two subagents:
 *   - researcher — returns bullet findings on a topic.
 *   - synthesiser — merges findings into a final paragraph.
 *
 * Key exam points demonstrated:
 *   - Coordinator has "Task" in allowedTools (required for spawning).
 *   - Subagents receive context ONLY via their prompts; they do not
 *     inherit the coordinator's conversation history.
 *   - Coordinator prompt specifies goals ("produce a cited summary"),
 *     not procedures ("call search then synthesise").
 *
 * Run:  npx ts-node src/hub-and-spoke.ts
 */

import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";

const agents = {
  researcher: {
    description: "Finds and returns bullet findings for a given topic.",
    prompt:
      "You are a research subagent. Given a topic, return 3-5 concise bullet " +
      "findings with made-up-but-plausible inline citations like [source-1]. " +
      "Do not editorialise. End your response after the bullets.",
    tools: [],
  },
  synthesiser: {
    description:
      "Merges a set of findings provided in its prompt into a 3-sentence summary.",
    prompt:
      "You are a synthesis subagent. The findings you need are in the user " +
      "prompt. Write a 3-sentence summary that preserves citations.",
    tools: [],
  },
};

const COORDINATOR_PROMPT = `
You are a research coordinator. Your job: produce a cited summary of the user's
topic by delegating to subagents via the Task tool.

Quality criteria:
- Every claim must carry a citation from the findings.
- The final summary is 3 sentences.

IMPORTANT: subagents have NO access to your conversation. When you call the
synthesiser, pass the researcher's findings directly in the prompt.
`;

async function main() {
  const topic = process.argv.slice(2).join(" ") || "the impact of AI on music production";

  const run = query({
    prompt: `Topic: ${topic}`,
    options: {
      systemPrompt: COORDINATOR_PROMPT,
      allowedTools: ["Task"],
      agents,
      model: "claude-sonnet-4-6",
    },
  });

  for await (const message of run) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") process.stdout.write(block.text);
        if (block.type === "tool_use" && block.name === "Task") {
          const input = block.input as any;
          console.log(`\n[coordinator] spawn → ${input.subagent_type}`);
        }
      }
    }
  }
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
