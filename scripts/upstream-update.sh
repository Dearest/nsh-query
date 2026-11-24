#!/usr/bin/env bash
# Moves vendor/ to another query-core version and writes what a reviewer needs:
#
#   scripts/upstream-update.sh <version> <output dir>
#
# <output dir>/report.md   scripts/upstream-report.mjs from the current version
# <output dir>/check.log   the output of scripts/check.sh
# <output dir>/body.md     a pull request body: check result, then the report
# <output dir>/status      "pass" or "fail"
#
# It changes vendor/ (and nothing else) and exits 0 even when the check fails:
# a red upgrade is still worth a pull request, with the failure in its body.
# .github/workflows/upstream.yml runs it; run it locally the same way.

set -euo pipefail

version="${1:?usage: scripts/upstream-update.sh <version> <output dir>}"
out="${2:?usage: scripts/upstream-update.sh <version> <output dir>}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
mkdir -p "$out"
out="$(cd "$out" && pwd)"

current="$(node -p 'require("./vendor/VERSIONS.json")["@tanstack/query-core"].version')"
echo "query-core $current -> $version"

node scripts/sync-vendor.mjs "$version"
node scripts/upstream-report.mjs "$current" "$version" --out "$out/report.md"

if scripts/check.sh >"$out/check.log" 2>&1; then status=pass; else status=fail; fi
echo "$status" >"$out/status"
echo "scripts/check.sh: $status"

node - "$out" "$status" "$current" "$version" <<'NODE'
const fs = require("fs");
const [out, status, from, to] = process.argv.slice(2);
const report = fs.readFileSync(`${out}/report.md`, "utf8");
const log = fs.readFileSync(`${out}/check.log`, "utf8");
const tail = log.split("\n").filter((line) => !line.startsWith("✓ bundled")).slice(-60).join("\n");
const head = [
  `Updates vendored query-core from ${from} to ${to}, with scripts/sync-vendor.mjs.`,
  "",
  status === "pass"
    ? "`scripts/check.sh` passes."
    : "`scripts/check.sh` **fails**: the end of its output is below. Follow docs/upgrading-query-core.md.",
  "",
  "<details><summary>scripts/check.sh</summary>",
  "",
  "```text",
  tail,
  "```",
  "",
  "</details>",
  "",
].join("\n");
const limit = 60000;
let body = `${head}\n${report}`;
if (body.length > limit) {
  const cut = report.replace(/<details><summary>Full diff<\/summary>[\s\S]*?<\/details>/g, "_Full diff left out for length: see the workflow run's `upstream-report` artifact._");
  body = `${head}\n${cut}`.slice(0, limit);
}
fs.writeFileSync(`${out}/body.md`, body);
NODE
