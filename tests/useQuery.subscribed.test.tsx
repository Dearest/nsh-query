import { expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

// The `subscribed` option (fixtures/useQuery/subscribed.tsx). Tests named as
// react-query's are ports of them.

const run = (name: string) => openScenario("./fixtures/useQuery/subscribed.tsx", name);
const report = async (app: Awaited<ReturnType<typeof run>>) => {
  await app.press("report");
  return logs(app).at(-1);
};

test("subscribed: false shows the cached data without fetching", async () => {
  const app = await run("subscribed: false shows the cached data without fetching");
  expect(app.texts()).toContain("data: cached");
  expect(app.texts()).toContain("fetchStatus: idle");
  await advance(app, 100);
  expect(await report(app)).toEqual({ fetches: 0, observers: 0 });
});

test("polling stops and cache updates are not shown while unsubscribed", async () => {
  const app = await run("polling stops and cache updates are not shown while unsubscribed");
  await advance(app, 120);
  const before = await report(app);
  expect(before.fetches).toBeGreaterThanOrEqual(2);
  expect(before.observers).toBe(1);

  await app.press("unsubscribe");
  const shown = app.texts().find((text) => text.startsWith("data: "));
  // A fetch already running may still finish; no poll starts after it.
  await advance(app, 20);
  const settled = await report(app);
  expect(settled.observers).toBe(0);
  await advance(app, 500);
  expect(await report(app)).toEqual({ fetches: settled.fetches, observers: 0 });
  expect(app.texts()).toContain(shown);

  await app.press("set data");
  await advance(app, 10);
  expect(app.texts()).toContain(shown);
  expect(app.texts()).not.toContain("data: from elsewhere");
});

test("subscribing again refetches stale data once", async () => {
  const app = await run("subscribing again refetches stale data once");
  await advance(app, 10);
  expect(app.texts()).toContain("data: data 1");
  await app.press("unsubscribe");
  await advance(app, 200);
  await app.press("subscribe");
  await advance(app, 10);
  expect(app.texts()).toContain("data: data 2");
  await advance(app, 50);
  expect(await report(app)).toEqual({ fetches: 2, observers: 1 });
});

test("subscribing again before the data is stale does not fetch", async () => {
  const app = await run("subscribing again refetches stale data once");
  await advance(app, 10);
  await app.press("unsubscribe");
  await advance(app, 20);
  await app.press("subscribe");
  await advance(app, 50);
  expect(app.texts()).toContain("data: data 1");
  expect(await report(app)).toEqual({ fetches: 1, observers: 1 });
});

test("changing other options while unsubscribed does not subscribe", async () => {
  const app = await run("changing other options while unsubscribed does not subscribe");
  expect(app.texts()).toContain("data: cached");
  await app.press("change select");
  expect(app.texts()).toContain("data: cached!");
  await advance(app, 100);
  expect(await report(app)).toEqual({ fetches: 0, observers: 0 });
});

test("should be able to toggle subscribed", async () => {
  const app = await run("should be able to toggle subscribed");
  await advance(app, 0);
  expect(app.texts()).toContain("data: data");
  expect(await report(app)).toEqual({ calls: 1, observers: 1 });

  await app.press("toggle");
  expect(await report(app)).toEqual({ calls: 1, observers: 0 });

  await app.press("toggle");
  // background refetch when we re-subscribe
  await advance(app, 0);
  expect(await report(app)).toEqual({ calls: 2, observers: 1 });
});

test("should not optimistically show fetching when unsubscribed", async () => {
  const app = await run("should not optimistically show fetching when unsubscribed");
  await advance(app, 0);
  expect(app.texts()).toContain("isFetching: false");
  expect(app.texts()).toContain("fetchStatus: idle");

  await app.press("unsubscribe");
  expect(await report(app)).toEqual({ calls: 1, observers: 0 });
  expect(app.texts()).toContain("isFetching: false");
  expect(app.texts()).toContain("fetchStatus: idle");
});

test("should not be attached to the query when subscribed is false", async () => {
  const app = await run("should not be attached to the query when subscribed is false");
  await advance(app, 0);
  expect(app.texts()).toContain("data: ");
  expect(await report(app)).toEqual({ calls: 0, observers: 0 });
});

test("should not re-render when data is added to the cache when subscribed is false", async () => {
  const app = await run("should not re-render when data is added to the cache when subscribed is false");
  await advance(app, 0);
  expect(app.texts()).toContain("no data");
  await app.press("set data");
  await advance(app, 0);
  expect(app.texts()).toContain("no data");
  expect(await report(app)).toEqual({ runs: 1 });
});
