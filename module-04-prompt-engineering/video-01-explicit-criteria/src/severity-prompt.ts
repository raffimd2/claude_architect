/**
 * Severity prompt template with explicit, example-backed categories.
 *
 * This is the shape of prompt the exam rewards — definitions AND examples
 * for each level, not a 1-5 scale and a vague instruction.
 */

export const SEVERITY_PROMPT = `
Classify each finding with one of these severities. Every level has an
explicit definition and an example.

HIGH
  Definition: the bug can cause data loss, security breach, or break a
              revenue-path production flow.
  Example: unhandled promise rejection in the charge handler; SQL built by
           string concatenation; null-pointer deref in the main request path.

MEDIUM
  Definition: the bug causes a degraded experience but not data loss or a
              broken critical path.
  Example: a non-blocking race condition in a cache layer; missing retry on
           a non-critical integration call.

LOW
  Definition: code quality or minor correctness issue unlikely to affect
              production users.
  Example: unused import; a subtle typing issue in a test fixture.

Rules:
- Every finding must map to EXACTLY one of {HIGH, MEDIUM, LOW}.
- If a finding does not fit one of the examples, prefer to NOT report it.
`;
