/**
 * PostToolUse hook demo — normalise heterogeneous date formats.
 *
 * Three fake tools return timestamps in different shapes:
 *   - get_account:   ISO 8601 string
 *   - get_order:     Unix epoch seconds
 *   - get_activity:  {created_days_ago: number}
 *
 * The PostToolUse hook rewrites every result so Claude sees ISO 8601 only.
 *
 * Run:  npx ts-node src/normalise-dates.ts
 */

function postToolUseHook(name: string, rawResult: string): string {
  try {
    const obj = JSON.parse(rawResult);
    if (name === "get_order" && typeof obj.created_at === "number") {
      obj.created_at = new Date(obj.created_at * 1000).toISOString();
    }
    if (name === "get_activity" && typeof obj.created_days_ago === "number") {
      const ms = Date.now() - obj.created_days_ago * 86400_000;
      obj.created_at = new Date(ms).toISOString();
      delete obj.created_days_ago;
    }
    return JSON.stringify(obj);
  } catch {
    return rawResult;
  }
}

function call(name: string): string {
  if (name === "get_account") return JSON.stringify({ id: "C-1", created_at: "2025-10-01T12:00:00Z" });
  if (name === "get_order")   return JSON.stringify({ id: "A-1138", created_at: 1712345678 });
  if (name === "get_activity") return JSON.stringify({ type: "login", created_days_ago: 3 });
  return JSON.stringify({});
}

for (const tool of ["get_account", "get_order", "get_activity"]) {
  const raw  = call(tool);
  const norm = postToolUseHook(tool, raw);
  console.log(`${tool.padEnd(12)} raw:  ${raw}`);
  console.log(`${" ".repeat(12)} norm: ${norm}\n`);
}
