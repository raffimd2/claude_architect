# Mock Exam — Claude Certified Architect · Foundations

60 questions · 4 scenarios × 15 questions each · 90 minutes recommended.
Correct answers at the bottom. No penalty for guessing.

---

## Scenario A — Customer Support Resolution Agent

**A-1.** Agent skips `get_customer` for 10% of requests, causing occasional misidentified account refunds. Best fix?
- A. Add more few-shot examples showing `get_customer` first.
- B. Add a programmatic prerequisite hook that blocks downstream tools until `get_customer` returns verified ID.
- C. Switch to a larger model.
- D. Raise `max_tokens`.

**A-2.** `get_customer` and `lookup_order` both have one-line descriptions and similar input schemas. Misrouting happens frequently. Most effective first step?
- A. Consolidate both tools into a single `lookup_entity` tool.
- B. Expand descriptions using the four-component template (inputs, examples, edge cases, boundaries).
- C. Implement a routing layer that parses the user query before tool invocation.
- D. Train a classifier on historical tickets.

**A-3.** Customer types "connect me to a human agent" as their first message. Correct agent behavior?
- A. Investigate the underlying issue first; escalate if it turns out complex.
- B. Escalate immediately with a structured handoff packet.
- C. Run a sentiment classifier to confirm frustration before escalating.
- D. Ask Claude to self-rate confidence and escalate if below a threshold.

**A-4.** First-contact resolution is 55%. Logs show the agent escalates straightforward damaged-item replacements and attempts autonomous resolution on policy-exception cases. Best fix?
- A. Add explicit escalation criteria with few-shot examples to the system prompt.
- B. Deploy sentiment-triggered escalation above a threshold.
- C. Have Claude self-report a 1-10 confidence and escalate under 7.
- D. Train a classifier on historical escalations.

**A-5.** Customer says "I already told you my order number" but the agent has asked again. Best fix?
- A. Raise `max_tokens`.
- B. Maintain a persistent case-facts block included in every turn's prompt.
- C. Switch to a larger model.
- D. Expose additional tools to re-look up the order on demand.

**A-6.** Refunds above $500 require manual approval per policy. How to enforce?
- A. Rule in the system prompt saying "never refund above $500".
- B. `PreToolUse` hook blocking `process_refund` when `amount_usd > 500`.
- C. Train a classifier on approved refunds.
- D. Set `tool_choice: "any"` to limit tool selection.

**A-7.** `get_customer` returns 3 matches for the given email. Best action?
- A. Pick the customer on the Pro plan.
- B. Pick the most recently active customer.
- C. Ask the customer for an additional identifier (order ID, zip, account number).
- D. Escalate to a human immediately.

**A-8.** Three MCP tools return dates in ISO, Unix epoch, and days-ago formats. Where to normalise?
- A. In a separate Claude call that reformats dates.
- B. In a `PostToolUse` hook that rewrites tool results to ISO before the model sees them.
- C. Switch to a larger model.
- D. Ask Claude to reformat dates itself each turn.

**A-9.** FCR 55% because multi-concern messages ("return + cancel + fix email") get partially handled. Best pattern?
- A. Larger system prompt listing common combinations.
- B. Decompose the request into distinct items, investigate each (in parallel where possible), synthesize unified resolution.
- C. Force one concern per message.
- D. Sentiment-triage first.

**A-10.** Synthesis subagent needs to verify 85% simple facts and 15% complex claims. Currently all verifications round-trip through the coordinator (adds 40% latency). Best fix?
- A. Give synthesis subagent all search tools.
- B. Scoped `verify_fact` tool on the synthesis subagent; complex cases still route through coordinator.
- C. Batch all verifications at the end of synthesis.
- D. Cache extra context proactively during initial research.

**A-11.** Policy-violating refund should produce a structured error. Best fields?
- A. `errorCategory`, `isRetryable`, human-readable description, customer-facing message.
- B. Generic "Operation failed".
- C. HTTP status code.
- D. Full Python traceback.

**A-12.** A `search_tickets` call returns zero matches from a healthy backend. Right shape?
- A. `isError: true, errorCategory: "transient"`.
- B. Success with `matches: []`.
- C. Escalate immediately.
- D. Retry until non-empty.

**A-13.** Every tool result has 40+ fields; context window fills. Best mitigation?
- A. Larger model.
- B. Trim verbose outputs to only relevant fields via `PostToolUse` hook before they enter context.
- C. `/compact` after every call.
- D. Shorter system prompt.

**A-14.** Want transactional facts (order IDs, amounts, dates) reliable across a long support conversation. Pattern?
- A. Persistent case-facts block re-injected each turn.
- B. Summarise the conversation every 5 turns.
- C. Fork the session at each tool call.
- D. Re-run lookup tools every turn.

**A-15.** Support agent has 18 tools — selection reliability is poor. Best partition?
- A. Split across specialised subagents, 4-5 tools each; provide scoped cross-role tools for high-frequency needs.
- B. Add more few-shot examples.
- C. Switch to a larger model.
- D. Force `tool_choice: "any"`.

---

## Scenario B — Multi-Agent Research System

**B-1.** Coordinator spawns one subagent per subtopic, sequentially. Total latency is 3× what it could be. Fix?
- A. Emit multiple `Task` calls in one coordinator response (parallel spawn).
- B. Larger model.
- C. Shorter subagent prompts.
- D. Skip coordinator; call subagents directly.

**B-2.** Coordinator uses `allowedTools: []`. Subagents never spawn. Cause?
- A. `Task` is missing from `allowedTools`.
- B. Subagent definitions are wrong.
- C. Model too small.
- D. System prompt too short.

**B-3.** Synthesis outputs have no citations even though findings included sources. Root cause?
- A. Model limitation.
- B. Findings were passed as prose to the synthesiser instead of structured `{claim, source, date, excerpt}`.
- C. Synthesiser prompt is too short.
- D. Too many tools on synthesiser.

**B-4.** Report on "creative industries" covers only visual arts. Logs show coordinator decomposed into art/design/photography subtasks. Root cause?
- A. Synthesiser lacks coverage-gap instructions.
- B. Coordinator decomposition is too narrow.
- C. Search agent's queries are inadequate.
- D. Document analyser filters non-visual sources.

**B-5.** To prevent the narrow-decomposition recurrence, best mechanism?
- A. Iterative refinement loop: coverage evaluator re-delegates when gaps remain.
- B. Larger system prompt.
- C. Prompt coordinator "cover everything".
- D. More subagents.

**B-6.** Two credible sources report different stats on the same claim. Synthesis should...
- A. Pick the most recent.
- B. Preserve both values with source attribution and a conflict annotation.
- C. Average them.
- D. Drop both.

**B-7.** Publication dates 2023 vs 2024 look like a contradiction. Fix?
- A. Require subagents to output dates in the structured finding; annotate temporal differences.
- B. Ignore dates.
- C. Take the newer one.
- D. Larger model.

**B-8.** Subagents do NOT inherit coordinator context. What's required?
- A. Explicit context passing via the spawn prompt.
- B. Shared memory server.
- C. Global variables.
- D. Same session ID.

**B-9.** Search subagent times out mid-topic. Best propagation?
- A. Return `{status: 'failed'}`.
- B. Structured error context: failure type, attempted query, partial results, suggested alternatives.
- C. Raise exception to kill the workflow.
- D. Return empty results as success.

**B-10.** Coordinator prompt says "call search, then analyse, then synthesise". Subagents rigidly follow; open-ended queries underperform. Better prompt style?
- A. Goals and quality criteria; let subagents adapt.
- B. Even more specific procedure.
- C. Switch to scripted pipeline only.
- D. No coordinator prompt.

**B-11.** System crashed mid-session. Best recovery design?
- A. Each subagent exports state to a known file; coordinator writes a manifest.json on resume, re-injects state.
- B. Restart from scratch.
- C. Cache transcripts.
- D. Retry the whole topic.

**B-12.** Synthesiser's output sometimes omits findings from the middle of the payload. Cause + fix?
- A. Lost-in-the-middle effect; reorder payload, add section headers, lead with key summary.
- B. Larger model.
- C. Shorter findings.
- D. More tools.

**B-13.** Want to compare two refactor strategies from identical analysis. Mechanism?
- A. `fork_session` from the shared baseline.
- B. Run two agents; compare manually.
- C. Larger model.
- D. Re-explore the repo twice.

**B-14.** Synthesiser fabricates sources when findings are sparse. Best schema change?
- A. Make source fields nullable; allow null instead of required.
- B. Require source fields; larger model will do better.
- C. Drop the source field.
- D. Raise `max_tokens`.

**B-15.** Synthesiser returns 6 round-trips per task — very slow. 85% are simple fact lookups. Fix?
- A. Scoped `verify_fact` tool on synthesiser.
- B. All tools on synthesiser.
- C. Proactive caching.
- D. Larger model.

---

## Scenario C — Claude Code for CI/CD

**C-1.** CI job running `claude "..."` hangs on interactive input. Fix?
- A. `-p` flag.
- B. `CLAUDE_HEADLESS=true`.
- C. `--batch`.
- D. `< /dev/null` workaround.

**C-2.** Pre-merge check must complete before merge. Nightly tech-debt report runs overnight. Which APIs?
- A. Sync for both.
- B. Sync for pre-merge; Message Batches for nightly.
- C. Batch for both.
- D. Batch for pre-merge; sync for nightly.

**C-3.** Batches API offers 50% cost savings with up to 24h processing. Inappropriate for...
- A. Blocking workflows (pre-merge checks).
- B. Overnight reports.
- C. Weekly audits.
- D. Non-latency-sensitive analytics.

**C-4.** Want machine-parseable review output for inline PR comments. Flags?
- A. `--output-format json --json-schema schema.json`.
- B. `--json-mode`.
- C. `--format parseable`.
- D. `--output yaml`.

**C-5.** 14-file PR single-pass review gives inconsistent depth and contradictory findings. Best restructure?
- A. Per-file passes + cross-file integration pass.
- B. Larger context window model.
- C. Require devs to split PR.
- D. 3 runs, require consensus.

**C-6.** Same Claude session generated and reviewed the code. Bugs slip through. Fix?
- A. Independent review instance with no prior reasoning context.
- B. Run review twice.
- C. Add `--output-format json`.
- D. Larger model.

**C-7.** Review re-runs produce duplicate comments on each new commit. Fix?
- A. Include prior findings in context; instruct to report only new or still-unaddressed.
- B. Manual dedupe.
- C. Post once, never re-run.
- D. Larger model.

**C-8.** Test generation suggests duplicate scenarios already in the test file. Fix?
- A. Pass existing tests into the prompt context.
- B. Larger model.
- C. Run test gen twice.
- D. Add `--output-format json`.

**C-9.** Batches API does NOT support...
- A. Multi-turn tool calling within a single request.
- B. `custom_id`.
- C. JSON output.
- D. System prompts.

**C-10.** You must guarantee 30-hour SLA with Batches API (24h worst-case). Cadence?
- A. Submit once daily.
- B. Submit every ~4 hours.
- C. Submit on demand.
- D. Submit every 30 minutes.

**C-11.** Some batch docs fail. Strategy?
- A. Identify by `custom_id` and resubmit modified (e.g. chunk oversize docs).
- B. Re-run entire batch.
- C. Manual review.
- D. Abandon failures.

**C-12.** Prompt for code review says "be conservative". False positives still high. Fix?
- A. Specific categorical criteria (e.g. "flag comment only when claimed behaviour contradicts code").
- B. "Be EXTRA conservative".
- C. Confidence threshold.
- D. Larger model.

**C-13.** One review category is 80% false positives; devs lose trust across all categories. Immediate action?
- A. Temporarily disable that category; keep the others.
- B. Larger model.
- C. Raise confidence threshold.
- D. Remove the review tool.

**C-14.** Give agent project context (conventions, testing standards) for CI runs. Mechanism?
- A. `CLAUDE.md` in the repo.
- B. Env vars.
- C. `.github/config`.
- D. Bash script.

**C-15.** Want false-positive analytics over time. What field on each finding?
- A. `detected_pattern`.
- B. `timestamp`.
- C. `severity`.
- D. `reporter`.

---

## Scenario D — Structured Data Extraction

**D-1.** Most reliable method for schema-compliant structured output?
- A. `tool_use` with JSON schema.
- B. Asking for JSON in the system prompt.
- C. Regex post-processing.
- D. Multiple retries.

**D-2.** Document may not have `due_date`. Schema requires it. Model fabricates. Fix?
- A. Make the field nullable/optional.
- B. Raise `max_tokens`.
- C. Force `tool_choice: "any"`.
- D. Add few-shot examples of complete invoices.

**D-3.** Enum should support extensibility (`"other"` with detail). Pattern?
- A. Enum includes `"other"`; a companion `*_detail` field holds specifics.
- B. Open string.
- C. Two separate schemas.
- D. Nullable enum.

**D-4.** Extraction fails schema validation. Information IS in the doc, just formatted differently. Fix?
- A. Retry with the specific validation error appended.
- B. Make fields nullable.
- C. Larger model.
- D. Drop validation.

**D-5.** Retry fails because the info is NOT in the source. Best choice?
- A. Mark field nullable; accept null.
- B. Keep retrying.
- C. Fabricate based on defaults.
- D. Escalate every time.

**D-6.** Line items sum to 110; stated total is 100. Schema passes. Fix?
- A. Extract both `stated_total` and `calculated_total`; set `conflict_detected` when they differ.
- B. Stricter schema.
- C. Larger model.
- D. Drop line items.

**D-7.** Extracting 10,000 documents for a weekly report. Best API?
- A. Message Batches (50% cheaper, latency OK).
- B. Sync.
- C. Claude Code CLI.
- D. Streaming.

**D-8.** Aggregate accuracy 97%. Safe to reduce human review?
- A. Not until stratified accuracy (by doc type and field) confirms consistent performance.
- B. Yes, immediately.
- C. Only for low-confidence.
- D. Only for invoices.

**D-9.** Field-level confidence routing: what calibrates the threshold?
- A. Labeled validation set.
- B. Model temperature.
- C. max_tokens.
- D. Number of few-shot examples.

**D-10.** Document has inline citations vs bibliographic refs vs embedded narrative. Best adaptation?
- A. 3 few-shot examples, one per structure, with reasoning.
- B. One long prose instruction.
- C. Separate tool per structure.
- D. Larger model.

**D-11.** Extraction produces wrong field for total (e.g. in `tax` slot). Syntax fine. Category of error?
- A. Semantic (not prevented by strict schemas).
- B. Schema syntax.
- C. Transient.
- D. Permission.

**D-12.** Prompt says "return JSON" and often returns fenced ```json blocks. Reliable fix?
- A. Switch to `tool_use` + schema.
- B. Stronger prompt.
- C. Post-processing regex.
- D. Larger model.

**D-13.** Want `detected_pattern` on each extraction finding. Purpose?
- A. Track which patterns trigger dismissals for false-positive analytics.
- B. Visual grouping only.
- C. Required by API.
- D. For caching.

**D-14.** Human-review queue overloaded. Prioritise?
- A. Low confidence + ambiguous/conflicting documents; high-impact fields.
- B. Random sampling.
- C. Round-robin.
- D. Alphabetical.

**D-15.** Multi-source synthesis merges findings; losses citations. Root cause?
- A. Upstream findings passed as prose; synthesiser couldn't preserve `{claim, source, date}` mapping.
- B. Larger model.
- C. Prompt too short.
- D. `tool_choice: "auto"`.

---

## Answer key

Scenario A: 1-B · 2-B · 3-B · 4-A · 5-B · 6-B · 7-C · 8-B · 9-B · 10-B · 11-A · 12-B · 13-B · 14-A · 15-A

Scenario B: 1-A · 2-A · 3-B · 4-B · 5-A · 6-B · 7-A · 8-A · 9-B · 10-A · 11-A · 12-A · 13-A · 14-A · 15-A

Scenario C: 1-A · 2-B · 3-A · 4-A · 5-A · 6-A · 7-A · 8-A · 9-A · 10-B · 11-A · 12-A · 13-A · 14-A · 15-A

Scenario D: 1-A · 2-A · 3-A · 4-A · 5-A · 6-A · 7-A · 8-A · 9-A · 10-A · 11-A · 12-A · 13-A · 14-A · 15-A

## Scoring

- 60 questions, scaled 100–1000 approximately.
- Target: 45/60 (~75%) correct for comfortable passing margin.
- Below 40/60: re-do the weakest scenario's module.
