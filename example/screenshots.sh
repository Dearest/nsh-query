#!/usr/bin/env bash
# Takes the README's screenshots of the example on macOS: the todo list and a
# todo's detail. Opens a real window (on a second display when there is one).
#
#   example/screenshots.sh

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
out="../docs/images"
mkdir -p "$out"
nsh test App.tsx --target macos <<STEPS
await app.waitFor("text:Walk the dog", { timeout: 15000 });
await app.screenshot("$out/example-list.png");
await app.press("Walk the dog");
await app.waitFor("text:Around the park, twice.", { timeout: 15000 });
await app.screenshot("$out/example-detail.png");
STEPS
echo "wrote $out/example-list.png and $out/example-detail.png"
