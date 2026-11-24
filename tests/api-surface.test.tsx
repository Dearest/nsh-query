import { expect, open, test } from "nsh/test";
import expected from "./api-surface.json";

// The runtime exports of each entry, against tests/api-surface.json. When
// query-core adds or removes an export, or the library does, this fails with
// the difference: review it, then replace api-surface.json with the JSON shown.
test("the runtime exports match tests/api-surface.json", async () => {
  const app = await open("./fixtures/api-surface/exports.tsx", { clock: {} });
  const actual = JSON.parse(app.texts()[0]!) as Record<string, string[]>;
  const changes: string[] = [];
  for (const entry of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
    const before = new Set((expected as Record<string, string[]>)[entry] ?? []);
    const after = new Set(actual[entry] ?? []);
    for (const name of after) if (!before.has(name)) changes.push(`+ ${entry}: ${name}`);
    for (const name of before) if (!after.has(name)) changes.push(`- ${entry}: ${name}`);
  }
  if (changes.length > 0) {
    throw new Error(
      `the exports changed:\n${changes.join("\n")}\n\nIf intended, replace tests/api-surface.json with:\n${JSON.stringify(actual, null, 2)}\n`,
    );
  }
  expect(actual).toEqual(expected);
});
