import { expect, test } from "nsh/test";
import type { App } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/QueryClientProvider/parity.tsx";
const run = (name: string) => openScenario(entry, name);

/** Presses "report" and returns what it logged. */
async function report(app: App) {
  await app.press("report");
  return logs(app).at(-1);
}

test("should set a specific cache for all queries to use", async () => {
  const app = await run("should set a specific cache for all queries to use");
  await advance(app, 10);
  expect(app.texts()).toContain("test");
  expect((await report(app)).data).toBe("test");
});

test("should allow multiple caches to be partitioned", async () => {
  const app = await run("should allow multiple caches to be partitioned");
  await advance(app, 10);
  expect(app.texts()).toContain("test1");
  expect(app.texts()).toContain("test2");
  expect(await report(app)).toEqual({ cache1key1: "test1", cache1key2: true, cache2key1: true, cache2key2: "test2" });
});

test("should use defaultOptions for queries when they don't provide their own config", async () => {
  const app = await run("should use defaultOptions for queries when they don't provide their own config");
  await advance(app, 10);
  expect(app.texts()).toContain("test");
  expect((await report(app)).gcTime).toBe("Infinity");
});

test("should throw an error if no query client has been set", async () => {
  const app = await run("should throw an error if no query client has been set");
  expect(app.texts()).not.toContain("rendered");
  const thrown = app.texts().find((text) => text.startsWith("thrown: "));
  expect(thrown).toMatch("No QueryClient set, use QueryClientProvider to set one");
});

test("should not throw an error if user provides custom query client", async () => {
  const app = await run("should not throw an error if user provides custom query client");
  expect(app.texts()).toContain("rendered");
  expect(app.texts().some((text) => text.startsWith("thrown:"))).toBe(false);
});
