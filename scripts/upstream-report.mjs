#!/usr/bin/env node
// Writes a Markdown report of what changed upstream between two versions of
// query-core, for whoever upgrades vendor/:
//
//   node scripts/upstream-report.mjs <old version> <new version> [--out <file>]
//
// 1. query-core's exports added and removed (values and types);
// 2. the diff of src/ in @tanstack/react-query and @tanstack/solid-query, the
//    official adapters: what they changed is what this adapter may need to follow;
// 3. the GitHub releases in between.

import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { compareVersions, downloadPackage, packument } from "./npm.mjs";

const ADAPTERS = ["@tanstack/react-query", "@tanstack/solid-query"];

function usage(message) {
  if (message) console.error(`error: ${message}`);
  console.error("usage: node scripts/upstream-report.mjs <old version> <new version> [--out <file>]");
  process.exit(2);
}

function parseArgs(argv) {
  const positional = [];
  let out;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = argv[++i] ?? usage("--out needs a file");
    else if (argv[i].startsWith("-")) usage(`unknown option ${argv[i]}`);
    else positional.push(argv[i]);
  }
  if (positional.length !== 2) usage("give the old and the new version");
  return { from: positional[0], to: positional[1], out };
}

// The names an ES module or declaration file exports: `export { a, b as c, type T }`
// clauses and `export declare|const|function|class|type|interface X` statements.
function exportedNames(source) {
  const values = new Set();
  const types = new Set();
  for (const clause of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of clause[1].split(",")) {
      const item = part.trim();
      if (!item) continue;
      const isType = item.startsWith("type ");
      const name = item.replace(/^type\s+/, "").split(/\s+as\s+/).pop().trim();
      (isType ? types : values).add(name);
    }
  }
  for (const statement of source.matchAll(
    /^export\s+(?:declare\s+)?(const|let|var|function|class|abstract class|enum|type|interface)\s+([A-Za-z_$][\w$]*)/gm,
  )) {
    (statement[1] === "type" || statement[1] === "interface" ? types : values).add(statement[2]);
  }
  for (const name of values) types.delete(name);
  return { values, types };
}

async function coreExports(version) {
  const { files } = await downloadPackage("@tanstack/query-core", version);
  const js = files.get("build/modern/index.js")?.toString("utf8");
  const dts = files.get("build/modern/index.d.ts")?.toString("utf8");
  if (!js || !dts) throw new Error(`@tanstack/query-core@${version}: no build/modern/index.js or index.d.ts`);
  const runtime = exportedNames(js).values;
  const declared = exportedNames(dts);
  const types = new Set([...declared.types, ...declared.values].filter((name) => !runtime.has(name)));
  return { values: runtime, types };
}

function listChanges(before, after) {
  const added = [...after].filter((name) => !before.has(name)).sort();
  const removed = [...before].filter((name) => !after.has(name)).sort();
  return { added, removed };
}

async function writeSrc(name, version, dir) {
  const { files } = await downloadPackage(name, version);
  let count = 0;
  for (const [path, data] of files) {
    if (!path.startsWith("src/")) continue;
    const target = join(dir, path.slice(4));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
    count++;
  }
  return count;
}

function gitDiff(a, b, args) {
  try {
    return execFileSync("git", ["diff", "--no-index", "--no-color", ...args, a, b], { encoding: "utf8", maxBuffer: 64 << 20 });
  } catch (error) {
    if (error.status === 1) return error.stdout;
    throw error;
  }
}

async function adapterDiff(name, from, to, scratch) {
  const base = join(scratch, name.replace(/[@/]/g, "_"));
  const a = join(base, from);
  const b = join(base, to);
  const [countA, countB] = await Promise.all([writeSrc(name, from, a), writeSrc(name, to, b)]);
  if (countA === 0 || countB === 0) return { stat: "", diff: "", note: `${name} publishes no src/ for one of the versions` };
  const relative = (text) => text.split(a).join(`${from}`).split(b).join(`${to}`);
  return {
    stat: relative(gitDiff(a, b, ["--stat=120"])).trim(),
    diff: relative(gitDiff(a, b, ["--unified=3"])).trim(),
  };
}

function releaseUrl(name, version) {
  return `https://github.com/TanStack/query/releases/tag/${encodeURIComponent(`${name}@${version}`)}`;
}

async function releasesBetween(name, from, to) {
  const doc = await packument(name);
  return Object.keys(doc.versions)
    .filter((v) => compareVersions(v, from) > 0 && compareVersions(v, to) <= 0)
    .sort(compareVersions);
}

async function main() {
  const { from, to, out } = parseArgs(process.argv.slice(2));
  const scratch = await mkdtemp(join(tmpdir(), "upstream-report-"));
  try {
    const [oldCore, newCore] = await Promise.all([coreExports(from), coreExports(to)]);
    const values = listChanges(oldCore.values, newCore.values);
    const types = listChanges(oldCore.types, newCore.types);
    const diffs = [];
    for (const name of ADAPTERS) diffs.push([name, await adapterDiff(name, from, to, scratch)]);
    const releases = await releasesBetween("@tanstack/query-core", from, to);

    const lines = [`# query-core ${from} → ${to}`, "", "## 1. query-core exports", ""];
    const section = (title, { added, removed }) => {
      lines.push(`**${title}**: ${added.length} added, ${removed.length} removed.`, "");
      for (const name of added) lines.push(`- added \`${name}\``);
      for (const name of removed) lines.push(`- removed \`${name}\``);
      if (added.length + removed.length > 0) lines.push("");
    };
    section("Runtime exports", values);
    section("Type exports", types);
    lines.push(
      "Runtime changes show up in `tests/api-surface.json` (update it in this PR). Removed names that nsh-query uses fail `nsh check`; internals it relies on are checked by `tests/core-contract.test.tsx`.",
      "",
      "## 2. Official adapters, `src/` diff",
      "",
    );
    for (const [name, result] of diffs) {
      lines.push(`### ${name}`, "");
      if (result.note) lines.push(result.note, "");
      else if (!result.diff) lines.push("No changes.", "");
      else {
        lines.push("```text", result.stat, "```", "", "<details><summary>Full diff</summary>", "", "```diff", result.diff, "```", "", "</details>", "");
      }
    }
    lines.push("## 3. Releases", "");
    if (releases.length === 0) lines.push(`No @tanstack/query-core release after ${from} up to ${to}.`);
    for (const version of releases) lines.push(`- [@tanstack/query-core@${version}](${releaseUrl("@tanstack/query-core", version)})`);
    for (const name of ADAPTERS) lines.push(`- [${name}@${to}](${releaseUrl(name, to)})`);
    lines.push("");

    const report = lines.join("\n");
    if (out) await writeFile(out, report);
    else process.stdout.write(report);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
