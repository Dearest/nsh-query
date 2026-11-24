#!/usr/bin/env bash
# The full check, the same locally and in CI:
#   1. vendor/ is exactly what scripts/sync-vendor.mjs writes for the versions
#      recorded in vendor/VERSIONS.json
#   2. every export of the library's own is used in tests/
#   3. every test tests/PARITY.md names exists
#   4. tests/: nsh check (types included), nsh test
#   5. example/: nsh check, nsh test (once example/ exists)
#
# Set JUNIT_DIR to also write JUnit reports there.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

step() { printf '\n==> %s\n' "$*"; }

step "nsh $(nsh --version)"

step "vendor/ matches scripts/sync-vendor.mjs"
version="$(node -e 'const v=require("./vendor/VERSIONS.json");const s=new Set(Object.values(v).map((p)=>p.version));if(s.size!==1)throw new Error("vendor/VERSIONS.json mixes versions");console.log([...s][0])')"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
node scripts/sync-vendor.mjs "$version" --out "$scratch/vendor"
if ! diff -r -x .DS_Store "$scratch/vendor" vendor; then
  echo "vendor/ differs from a fresh sync of $version: run 'node scripts/sync-vendor.mjs $version' and do not edit vendor/ by hand" >&2
  exit 1
fi

run_app() {
  local dir="$1"
  step "$dir: nsh check"
  (cd "$dir" && nsh check)
  step "$dir: nsh test"
  local junit=()
  if [[ -n "${JUNIT_DIR:-}" ]]; then
    mkdir -p "$JUNIT_DIR"
    junit=(--junit "$(cd "$JUNIT_DIR" && pwd)/$dir.xml")
  fi
  (cd "$dir" && nsh test ${junit[@]+"${junit[@]}"})
}

step "every export of nsh-query's own has a test"
node scripts/check-exports.mjs

step "tests/PARITY.md points to existing tests"
node scripts/check-parity.mjs

run_app tests
if [[ -f example/nsh.json ]]; then
  run_app example
fi

step "all checks passed"
