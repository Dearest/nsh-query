#!/usr/bin/env node
// Checks tests/PARITY.md: every upstream case has a class, and every case
// marked ported or NSH differs names a test that exists in tests/.
//
//   node scripts/check-parity.mjs

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const classes = new Set(["ported", "not applicable", "NSH differs"]);

function cells(line) {
  return line
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

async function main() {
  const parity = await readFile(join(root, "tests/PARITY.md"), "utf8");
  const rows = parity.split("\n").filter((line) => line.startsWith("| ") && !line.startsWith("| Upstream test"));
  const sources = new Map();
  const problems = [];
  const counts = {};
  for (const row of rows) {
    const [name, kind, where] = cells(row);
    counts[kind] = (counts[kind] ?? 0) + 1;
    if (!classes.has(kind)) {
      problems.push(`${name}: class "${kind}"`);
      continue;
    }
    if (kind === "not applicable") {
      if (!where) problems.push(`${name}: no reason given`);
      continue;
    }
    for (const reference of where.split("<br>")) {
      const match = /^`([^`]+)` › (.+)$/.exec(reference);
      if (!match) {
        problems.push(`${name}: cannot read the test reference "${reference}"`);
        continue;
      }
      const [, file, path] = match;
      if (!sources.has(file)) sources.set(file, await readFile(join(root, "tests", file), "utf8").catch(() => null));
      const source = sources.get(file);
      const title = path.split(" › ").pop();
      if (source === null) problems.push(`${name}: no file tests/${file}`);
      else if (!source.includes(title) && !source.includes(JSON.stringify(title).slice(1, -1))) {
        problems.push(`${name}: no test "${title}" in tests/${file}`);
      }
    }
  }
  if (problems.length > 0) {
    console.error(`tests/PARITY.md:\n${problems.map((p) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`tests/PARITY.md: ${rows.length} upstream cases (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")})`);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
