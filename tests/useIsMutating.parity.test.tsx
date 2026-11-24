import { expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useIsMutating/parity.tsx";
const run = (name: string) => openScenario(entry, name);

test("should return the number of fetching mutations", async () => {
  const app = await run("should return the number of fetching mutations");
  await advance(app, 150);
  expect(logs(app)).toEqual([0, 1, 2, 1, 0]);
});

test("should filter correctly by mutationKey", async () => {
  const app = await run("should filter correctly by mutationKey");
  // the other mutation does not notify the indicator
  await advance(app, 100);
  expect(logs(app)).toEqual([0, 1, 0]);
});

test("should filter correctly by predicate", async () => {
  const app = await run("should filter correctly by predicate");
  await advance(app, 100);
  expect(logs(app)).toEqual([0, 1, 0]);
});

test("should use provided custom queryClient", async () => {
  const app = await run("should use provided custom queryClient");
  expect(app.texts()).toContain("mutating: 0");
  await advance(app, 10);
  expect(app.texts()).toContain("mutating: 1");
  await advance(app, 20);
  expect(app.texts()).toContain("mutating: 0");
});

test("should resubscribe when a custom queryClient changes", async () => {
  const app = await run("should resubscribe when a custom queryClient changes");
  expect(app.texts()).toContain("mutating: 0");

  await app.press("start1");
  expect(app.texts()).toContain("mutating: 1");

  await app.press("switch");
  expect(app.texts()).toContain("unsubscribed: 1");
  expect(app.texts()).toContain("mutating: 0");

  await app.press("start2");
  expect(app.texts()).toContain("mutating: 1");
  await advance(app, 20);
  expect(app.texts()).toContain("mutating: 0");
});

test("should not change state if unmounted", async () => {
  const app = await run("should not change state if unmounted");
  expect(logs(app)).toEqual([0, 1]);

  await app.press("unmount");
  await app.press("status");
  expect(logs(app)).toEqual([0, 1, { status: "pending" }]);

  await advance(app, 20);
  await app.press("status");
  expect(logs(app)).toEqual([0, 1, { status: "pending" }, { status: "success" }]);
});
