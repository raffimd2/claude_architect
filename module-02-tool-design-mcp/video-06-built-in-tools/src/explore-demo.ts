/**
 * Exploration walkthrough (no Claude call — it's a narrated demo).
 *
 * We mimic what a Claude Code session would do:
 *   1. Glob src/**/*.ts  (find files)
 *   2. Grep  "export default"   (find entry points)
 *   3. Read  the file that matches
 *   4. Grep  for one symbol across the rest
 *
 * The point is the ORDER. Run with --show to print step markers.
 *
 * Run:  npx ts-node src/explore-demo.ts --show
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";

function glob(dir: string, ext: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) glob(full, ext, out);
    else if (extname(full) === ext) out.push(full);
  }
  return out;
}

function grep(files: string[], pattern: RegExp): { file: string; line: string }[] {
  const hits: { file: string; line: string }[] = [];
  for (const f of files) {
    const content = readFileSync(f, "utf8").split("\n");
    for (const line of content) if (pattern.test(line)) hits.push({ file: f, line });
  }
  return hits;
}

function main() {
  const show = process.argv.includes("--show");
  const log = (...s: string[]) => show && console.log(...s);

  log("step 1 — Glob src/**/*.ts");
  const files = glob(".", ".ts");
  log(`  ${files.length} files`);

  log("\nstep 2 — Grep for 'async function main'");
  const entries = grep(files, /async function main/);
  for (const h of entries) log(`  ${h.file}:  ${h.line.trim()}`);

  log("\nstep 3 — Read the first entry point");
  if (entries.length > 0) {
    const head = readFileSync(entries[0].file, "utf8").split("\n").slice(0, 5).join("\n");
    log(head);
  }
}

main();
