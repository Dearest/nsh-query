import { expect, test } from "nsh/test";
import type { App } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useQuery/parity-solid-2.tsx";
const run = (name: string) => openScenario(entry, name);

/** The logged objects that have `field`. */
const logged = (app: App, field: string) => logs(app).filter((entry) => field in entry);
const last = (app: App, field: string) => logged(app, field).at(-1);

test("should not retry if retry function `false`", async () => {
  const app = await run("should not retry if retry function `false`");
  await advance(app, 10);
  expect(app.texts()).toContain("pending");
  await advance(app, 10);
  expect(app.texts()).toContain("pending");
  expect(app.texts()).toContain("Failed 1 times");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
  expect(app.texts()).toContain("Failed 2 times");
  expect(app.texts()).toContain("Failed because NoRetry");
  expect(app.texts()).toContain("NoRetry");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 2 });
});

test("should extract retryDelay from error", async () => {
  const app = await run("should extract retryDelay from error");
  await advance(app, 10);
  expect(app.texts()).toContain("pending");
  expect(app.texts()).toContain("Failed 1 times");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 1 });
  await advance(app, 10);
  await advance(app, 50);
  expect(app.texts()).toContain("Failed because DelayError: 50ms");
  expect(app.texts()).toContain("Failed 2 times");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 2 });
});

test("should continue retry after focus regain", async () => {
  const app = await run("should continue retry after focus regain");
  // make page unfocused
  await app.setLifecycle("background");

  // The query should display the first error result
  await advance(app, 11);
  expect(app.texts()).toContain("failureCount 1");
  await advance(app, 11);
  expect(app.texts()).toContain("failureReason fetching error 1");
  expect(app.texts()).toContain("status pending");
  expect(app.texts()).toContain("error null");
  // Check if the query really paused
  await advance(app, 11);
  expect(app.texts()).toContain("failureCount 1");
  expect(app.texts()).toContain("failureReason fetching error 1");

  await app.setLifecycle("active");

  // Wait for the final result
  await advance(app, 10);
  await advance(app, 11);
  await advance(app, 11);
  expect(app.texts()).toContain("failureCount 4");
  expect(app.texts()).toContain("failureReason fetching error 4");
  expect(app.texts()).toContain("status error");
  expect(app.texts()).toContain("error fetching error 4");
  // Check if the query really stopped
  await advance(app, 11);
  expect(app.texts()).toContain("failureCount 4");
  expect(app.texts()).toContain("failureReason fetching error 4");
});

test("should fetch on mount when a query was already created with setQueryData", async () => {
  const app = await run("should fetch on mount when a query was already created with setQueryData");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states).toMatchObject([
    { data: "prefetched", isFetching: true, isStale: true },
    { data: "data", isFetching: false, isStale: true },
  ]);
});

test("should refetch after focus regain", async () => {
  const app = await run("should refetch after focus regain");
  // make page unfocused
  await app.setLifecycle("background");
  await advance(app, 10);
  expect(logs(app)).toHaveLength(2);

  await app.setLifecycle("active");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states).toMatchObject([
    { data: "prefetched", isFetching: true, isStale: true },
    { data: "data", isFetching: false, isStale: true },
    { data: "data", isFetching: true, isStale: true },
    { data: "data", isFetching: false, isStale: true },
  ]);
});

test("should refetch if stale after a prefetch", async () => {
  const app = await run("should refetch if stale after a prefetch");
  await advance(app, 10);
  await advance(app, 10);
  expect(logged(app, "status")).toHaveLength(2);
  await app.press("report");
  expect(last(app, "prefetchCalls")).toEqual({ prefetchCalls: 1, queryFnCalls: 1 });
});

test("should not refetch if not stale after a prefetch", async () => {
  const app = await run("should not refetch if not stale after a prefetch");
  await advance(app, 10);
  await advance(app, 10);
  await app.press("report");
  expect(last(app, "prefetchCalls")).toEqual({ prefetchCalls: 1, queryFnCalls: 0 });
});

test("should reset failureCount and failureReason on successful fetch", async () => {
  const app = await run("should reset failureCount and failureReason on successful fetch");
  // First attempt fails immediately
  await advance(app, 10);
  expect(app.texts()).toContain("failureCount 1");
  // Wait for first retry
  await advance(app, 10);
  await advance(app, 10);
  expect(app.texts()).toContain("failureCount 2");
  expect(app.texts()).toContain("failureReason error");
  // Wait for second retry (success)
  await advance(app, 10);
  await advance(app, 10);
  expect(app.texts()).toContain("failureCount 0");
  expect(app.texts()).toContain("failureReason null");
});

test("should use prefetched data for dependent query", async () => {
  const app = await run("should use prefetched data for dependent query");
  await advance(app, 0);
  expect(app.texts()).toContain("isPrefetched");

  await app.press("setKey");
  await advance(app, 0);
  expect(app.texts()).toContain("data: prefetched data");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");
  expect(logged(app, "count")).toEqual([{ count: 1 }]);
});

test("should support dependent queries via the enable config option", async () => {
  const app = await run("should support dependent queries via the enable config option");
  expect(app.texts()).toContain("FetchStatus: idle");
  expect(app.texts()).toContain("Data: no data");

  await app.press("fetch");
  await advance(app, 0);
  expect(app.texts()).toContain("FetchStatus: fetching");
  await advance(app, 10);
  expect(app.texts()).toContain("FetchStatus: idle");
  expect(app.texts()).toContain("Data: data");
});

test("should cleanup observers after component that created the query is unmounted in race condition #1", async () => {
  const app = await run(
    "should cleanup observers after component that created the query is unmounted in race condition #1",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("component");
  expect(app.texts()).toContain("data: 1");

  await app.press("toggle");
  expect(app.texts()).toContain("not showing");

  await app.press("toggle");
  await advance(app, 10);
  expect(app.texts()).toContain("component");
  expect(app.texts()).toContain("data: 2");

  await app.press("toggle");
  expect(app.texts()).toContain("not showing");

  await app.press("observers");
  expect(last(app, "observers")).toEqual({ observers: 0 });
});

test("should cleanup observers after component that created the query is unmounted in race condition #2", async () => {
  const app = await run(
    "should cleanup observers after component that created the query is unmounted in race condition #2",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("component");
  expect(app.texts()).toContain("data: 1");

  await app.press("toggle");
  await advance(app, 0);
  expect(app.texts()).toContain("not showing");

  await app.press("toggle");
  await advance(app, 10);
  expect(app.texts()).toContain("component");
  expect(app.texts()).toContain("data: 2");

  await app.press("toggle");
  await advance(app, 0);
  expect(app.texts()).toContain("not showing");

  await app.press("observers");
  expect(last(app, "observers")).toEqual({ observers: 0 });
});

test("should mark query as fetching, when using initialData", async () => {
  const app = await run("should mark query as fetching, when using initialData");
  expect(app.texts()).toContain("data: initialData");
  await advance(app, 10);
  expect(app.texts()).toContain("data: serverData");
  const results = logs(app);
  expect(results).toHaveLength(2);
  expect(results[0]).toMatchObject({ data: "initialData", isFetching: true });
  expect(results[1]).toMatchObject({ data: "serverData", isFetching: false });
});

test("should initialize state properly, when initialData is falsy", async () => {
  const app = await run("should initialize state properly, when initialData is falsy");
  await advance(app, 10);
  const results = logs(app);
  expect(results).toHaveLength(2);
  expect(results[0]).toMatchObject({ data: 0, isFetching: true });
  expect(results[1]).toMatchObject({ data: 1, isFetching: false });
});

test("should persist data when enabled is changed to false", async () => {
  const app = await run("should persist data when enabled is changed to false");
  await advance(app, 10);
  expect(app.texts()).toContain("fetched data");
  expect(app.texts()).toContain("enabled");
  await advance(app, 5);
  expect(app.texts()).toContain("fetched data");
  expect(app.texts()).toContain("disabled");
  const results = logs(app);
  expect(results).toHaveLength(3);
  expect(results[0]).toMatchObject({ data: "initial", isStale: true });
  expect(results[1]).toMatchObject({ data: "fetched data", isStale: true });
  // disabled observers are not stale
  expect(results[2]).toMatchObject({ data: "fetched data", isStale: false });
});

test("should support enabled:false in query object syntax", async () => {
  const app = await run("should support enabled:false in query object syntax");
  await app.press("report");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 0, found: true });
  expect(app.texts()).toContain("fetchStatus: idle");
});

test("should init to status:pending, fetchStatus:idle when enabled is false", async () => {
  const app = await run("should init to status:pending, fetchStatus:idle when enabled is false");
  expect(app.texts()).toContain("status: pending, idle");
});

test("should not schedule garbage collection, if gcTimeout is set to `Infinity`", async () => {
  const app = await run("should not schedule garbage collection, if gcTimeout is set to `Infinity`");
  await advance(app, 10);
  expect(app.texts()).toContain("fetched data");
  await app.press("unmount");
  expect(last(app, "setTimeoutDelays")).toEqual({ setTimeoutDelays: [] });
});

test("should schedule garbage collection, if gcTimeout is not set to `Infinity`", async () => {
  const app = await run("should schedule garbage collection, if gcTimeout is not set to `Infinity`");
  await advance(app, 10);
  expect(app.texts()).toContain("fetched data");
  await app.press("unmount");
  const delays = last(app, "setTimeoutDelays").setTimeoutDelays as unknown[];
  expect(delays.at(-1)).toBe(10 * 60 * 1000);
});

test("should not cause memo churn when data does not change", async () => {
  const app = await run("should not cause memo churn when data does not change");
  expect(app.texts()).toContain("status pending");
  await advance(app, 10);
  expect(app.texts()).toContain("status success");

  await app.press("refetch");
  await advance(app, 0);
  expect(app.texts()).toContain("isFetching true");
  await advance(app, 10);
  expect(app.texts()).toContain("isFetching false");

  await app.press("report");
  const report = last(app, "queryFnCalls");
  expect(report.queryFnCalls).toBe(2);
  // What depends on the memo ran for undefined and "data" only.
  expect(report.memoConsumerRuns).toBe(2);
  // The memo itself runs again on every result the component is notified of.
  expect(report.memoRuns).toBe(4);
});

test("should update data upon interval changes", async () => {
  const app = await run("should update data upon interval changes");
  // mount
  await advance(app, 10);
  expect(app.texts()).toContain("count: 0");
  // Wait for first interval
  await advance(app, 210);
  expect(app.texts()).toContain("count: 1");
  // Wait for second interval
  await advance(app, 210);
  expect(app.texts()).toContain("count: 2");
});

test("should refetch in an interval depending on function result", async () => {
  const app = await run("should refetch in an interval depending on function result");
  // Initial fetch (10ms)
  await advance(app, 10);
  // First interval (10ms delay + 10ms fetch)
  await advance(app, 10);
  await advance(app, 10);
  // Second interval (10ms delay + 10ms fetch)
  await advance(app, 10);
  await advance(app, 10);
  expect(app.texts()).toContain("count: 2");

  const states = logs(app);
  expect(states).toHaveLength(6);
  expect(states).toMatchObject([
    { status: "pending", isFetching: true },
    { status: "success", isFetching: false, data: 0 },
    { status: "success", isFetching: true, data: 0 },
    { status: "success", isFetching: false, data: 1 },
    { status: "success", isFetching: true, data: 1 },
    { status: "success", isFetching: false, data: 2 },
  ]);
  expect(states[0]).toMatchObject({ data: undefined });
});

test("should not interval fetch with a refetchInterval of 0", async () => {
  const app = await run("should not interval fetch with a refetchInterval of 0");
  await advance(app, 10);
  expect(app.texts()).toContain("count: 1");
  // extra advance to make sure we're not re-fetching
  await advance(app, 100);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states).toMatchObject([
    { status: "pending", isFetching: true },
    { status: "success", isFetching: false, data: 1 },
  ]);
  expect(states[0]).toMatchObject({ data: undefined });
});

test("should accept an empty string as query key", async () => {
  const app = await run("should accept an empty string as query key");
  await advance(app, 10);
  expect(app.texts()).toContain('[""]');
});

test("should accept an object as query key", async () => {
  const app = await run("should accept an object as query key");
  await advance(app, 10);
  expect(app.texts()).toContain('[{"a":"a"}]');
});

test("should refetch if any query instance becomes enabled", async () => {
  const app = await run("should refetch if any query instance becomes enabled");
  await app.press("report");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 0 });

  await app.press("enable");
  await advance(app, 10);
  expect(app.texts()).toContain("data");
  await app.press("report");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 1 });
});

test("should use placeholder data while the query loads", async () => {
  const app = await run("should use placeholder data while the query loads");
  await advance(app, 10);
  expect(app.texts()).toContain("Data: data");
  expect(logs(app)).toMatchObject([
    { isSuccess: true, isPlaceholderData: true, data: "placeholder" },
    { isSuccess: true, isPlaceholderData: false, data: "data" },
  ]);
});

test("should use placeholder data even for disabled queries", async () => {
  const app = await run("should use placeholder data even for disabled queries");
  await advance(app, 10);
  expect(app.texts()).toContain("Data: data");
  expect(logs(app)).toMatchObject([
    { state: { isSuccess: true, isPlaceholderData: true, data: "placeholder" }, count: 0 },
    { state: { isSuccess: true, isPlaceholderData: true, data: "placeholder" }, count: 1 },
    { state: { isSuccess: true, isPlaceholderData: false, data: "data" }, count: 1 },
  ]);
});

test("should run placeholder data through select", async () => {
  const app = await run("should run placeholder data through select");
  await advance(app, 10);
  expect(app.texts()).toContain("Data: 2");
  expect(logs(app)).toMatchObject([
    { isSuccess: true, isPlaceholderData: true, data: "46" },
    { isSuccess: true, isPlaceholderData: false, data: "2" },
  ]);
});

test("should run placeholder data function result through select", async () => {
  const app = await run("should run placeholder data function result through select");
  await advance(app, 10);
  expect(app.texts()).toContain("Data: 2");
  expect(logged(app, "status")).toMatchObject([
    { isSuccess: true, isPlaceholderData: true, data: "46" },
    { isSuccess: true, isPlaceholderData: false, data: "2" },
  ]);
  await app.press("report");
  expect(last(app, "placeholderFunctionRunCount")).toEqual({ placeholderFunctionRunCount: 1 });
});

test("should always return the correct state from select", async () => {
  const app = await run("should always return the correct state from select");
  expect(app.texts()).toContain("Data: selected 101");
  await advance(app, 10);
  expect(app.texts()).toContain("Data: selected 2");

  await app.press("inc");
  expect(app.texts()).toContain("Data: selected 3");

  await app.press("forceUpdate");
  expect(app.texts()).toContain("forceValue: 2");
  // data should still be 3 after an independent re-render
  expect(app.texts()).toContain("Data: selected 3");
});

test("should structurally share data in select", async () => {
  const app = await run("should structurally share data in select");
  await advance(app, 10);
  expect(app.texts()).toContain("Data: [2,3]");
  expect(logged(app, "selected")).toHaveLength(1);

  await app.press("forceUpdate");
  expect(app.texts()).toContain("forceValue: 2");
  expect(app.texts()).toContain("Data: [2,3]");
  // effect should not be triggered again due to structural sharing
  expect(logged(app, "selected")).toHaveLength(1);
});
