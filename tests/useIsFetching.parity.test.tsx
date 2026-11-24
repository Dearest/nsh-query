import { expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useIsFetching/parity.tsx";
const run = (name: string) => openScenario(entry, name);

test("should update as queries start and stop fetching", async () => {
  const app = await run("should update as queries start and stop fetching");
  expect(app.texts()).toContain("isFetching: 0");

  await app.press("setReady");
  expect(app.texts()).toContain("isFetching: 1");
  await advance(app, 50);
  expect(app.texts()).toContain("isFetching: 0");
});

test("should not update state while rendering", async () => {
  const app = await run("should not update state while rendering");
  await advance(app, 300);
  // the sequence of distinct values; react's render count also records 1 twice
  expect(logs(app)).toEqual([0, 1, 2, 1, 0]);
});

test("should be able to filter", async () => {
  const app = await run("should be able to filter");
  expect(app.texts()).toContain("isFetching: 0");

  await app.press("setStarted");
  expect(app.texts()).toContain("isFetching: 1");
  await advance(app, 20);
  expect(app.texts()).toContain("isFetching: 0");

  // at no point should we have isFetching: 2
  expect(logs(app)).not.toContain(2);
  expect(logs(app)).toEqual([0, 1, 0]);
});

test("should show the correct fetching state when mounted after a query", async () => {
  const app = await run("should show the correct fetching state when mounted after a query");
  expect(app.texts()).toContain("isFetching: 1");
  await advance(app, 10);
  expect(app.texts()).toContain("isFetching: 0");
});

test("should use provided custom queryClient", async () => {
  const app = await run("should use provided custom queryClient");
  expect(app.texts()).toContain("isFetching: 1");
  await advance(app, 10);
  expect(app.texts()).toContain("isFetching: 0");
  expect(logs(app)).toEqual(["onSuccess"]);
});

test("should resubscribe when a custom queryClient changes", async () => {
  const app = await run("should resubscribe when a custom queryClient changes");
  expect(app.texts()).toContain("isFetching: 0");

  await app.press("start1");
  expect(app.texts()).toContain("isFetching: 1");

  await app.press("switch");
  expect(app.texts()).toContain("unsubscribed: 1");
  expect(app.texts()).toContain("isFetching: 0");

  await app.press("start2");
  expect(app.texts()).toContain("isFetching: 1");
  await advance(app, 20);
  expect(app.texts()).toContain("isFetching: 0");
});
