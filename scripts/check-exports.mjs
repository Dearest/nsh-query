#!/usr/bin/env node
// Checks that every export of the library's own (not passed through from
// query-core) appears in a test or a fixture under tests/.
//
//   node scripts/check-exports.mjs

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function filesUnder(dir, predicate) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path, predicate)));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

function explicitValueExports(source) {
  const names = new Set();
  for (const match of source.matchAll(/^export\s+\{([^}]*)\}\s+from\s+["'][^"']+["'];/gm)) {
    for (const part of match[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name && !name.startsWith("type ")) names.add(name);
    }
  }
  for (const match of source.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|let)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(match[1]);
  }
  return names;
}

async function main() {
  const surface = JSON.parse(await readFile(join(root, "tests/api-surface.json"), "utf8"));
  const core = new Set(Object.keys(await import(pathToFileURL(join(root, "vendor/query-core/index.js")).href)));
  const entries = { "nsh-query": "src/index.ts", "nsh-query/persist": "src/persist/index.ts" };

  const own = new Set();
  for (const [entry, file] of Object.entries(entries)) {
    const explicit = explicitValueExports(await readFile(join(root, file), "utf8"));
    for (const name of surface[entry] ?? []) {
      if (!core.has(name) || explicit.has(name)) own.add(name);
    }
  }

  const testFiles = await filesUnder(join(root, "tests"), (path) => /\.(test\.tsx?|tsx?)$/.test(path) && !path.endsWith(".d.ts"));
  const sources = await Promise.all(
    testFiles
      .filter((path) => path.includes(`${join("tests", "fixtures")}`) || /\.test\.tsx?$/.test(path) || path.includes(join("tests", "types")))
      .map((path) => readFile(path, "utf8")),
  );
  const text = sources.join("\n");
  const missing = [...own].filter((name) => !new RegExp(`\\b${name.replace(/[$]/g, "\\$")}\\b`).test(text)).sort();

  if (missing.length > 0) {
    console.error(`exports without a test (add one under tests/ that uses them): ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`${own.size} exports of nsh-query's own, each used in a test`);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
