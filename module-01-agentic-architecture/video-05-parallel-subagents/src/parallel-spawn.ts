/**
 * Parallel subagent demo (simulation).
 *
 * We simulate the coordinator emitting three Task calls in a single turn
 * using Promise.all, vs emitting them serially. Print wall-clock for each.
 *
 * Run:  npx ts-node src/parallel-spawn.ts
 */

async function fakeSubagent(label: string, ms: number): Promise<string> {
  await new Promise((r) => setTimeout(r, ms));
  return `finding from ${label}`;
}

async function serial() {
  const t0 = Date.now();
  const a = await fakeSubagent("news", 1000);
  const b = await fakeSubagent("papers", 1000);
  const c = await fakeSubagent("vendor", 1000);
  const ms = Date.now() - t0;
  console.log(`serial   → ${ms}ms   ${[a, b, c].join(" | ")}`);
}

async function parallel() {
  const t0 = Date.now();
  const [a, b, c] = await Promise.all([
    fakeSubagent("news", 1000),
    fakeSubagent("papers", 1000),
    fakeSubagent("vendor", 1000),
  ]);
  const ms = Date.now() - t0;
  console.log(`parallel → ${ms}ms   ${[a, b, c].join(" | ")}`);
}

async function main() {
  await serial();
  await parallel();
}

main();
