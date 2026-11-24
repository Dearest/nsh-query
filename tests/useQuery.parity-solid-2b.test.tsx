import { expect, test } from "nsh/test";
import type { App } from "nsh/test";
import { advance, error, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useQuery/parity-solid-2b.tsx";
const run = (name: string) => openScenario(entry, name);

/** The logged objects that have `field`. */
const logged = (app: App, field: string) => logs(app).filter((entry) => field in entry);
const last = (app: App, field: string) => logged(app, field).at(-1);

const offline = (app: App) => app.setNetworkState({ kind: "none" });
const online = (app: App) => app.setNetworkState({ kind: "wifi" });

test("should cancel the query function when there are no more subscriptions", async () => {
  const app = await run("should cancel the query function when there are no more subscriptions");
  await advance(app, 10);
  expect(app.texts()).toContain("off");
  expect(logged(app, "abortEvent")).toEqual([{ abortEvent: "abort" }]);
});

test("should cancel the query if the signal was consumed and there are no more subscriptions", async () => {
  const app = await run("should cancel the query if the signal was consumed and there are no more subscriptions");
  await advance(app, 10);
  expect(app.texts()).toContain("off");
  await advance(app, 15);
  expect(logged(app, "mounted")).toHaveLength(4);

  await app.press("report");
  const [first, second, third, fourth] = last(app, "states").states;
  expect(first).toMatchObject({ data: "data 0", status: "success", dataUpdateCount: 1 });
  expect(second).toMatchObject({ data: null, status: "pending", fetchStatus: "idle" });
  expect(third).toMatchObject({ data: "data 2", status: "success", dataUpdateCount: 1 });
  expect(fourth).toMatchObject({ data: null, status: "pending", fetchStatus: "idle" });
});

test("should refetch when quickly switching to a failed query", async () => {
  const app = await run("should refetch when quickly switching to a failed query");
  await advance(app, 50);
  // react-query's 4 renders include 2 with the same pending state; these are
  // the distinct states.
  const states = logs(app);
  expect(states).toHaveLength(2);
  // Load query 1
  expect(states[0]).toMatchObject({ status: "pending", error: null });
  // No rerenders - No state updates
  // Loaded query 1
  expect(states[1]).toMatchObject({ status: "success", error: null });
});

test("should update query state and refetch when reset with resetQueries", async () => {
  const app = await run("should update query state and refetch when reset with resetQueries");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");

  await app.press("reset");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 2");

  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 2 });
  const states = logged(app, "status");
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ isPending: true, isFetching: true, isSuccess: false, isStale: true });
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: 1, isPending: false, isFetching: false, isSuccess: true, isStale: false });
  expect(states[2]).toMatchObject({ isPending: true, isFetching: true, isSuccess: false, isStale: true });
  expect(states[2]).toMatchObject({ data: undefined });
  expect(states[3]).toMatchObject({ data: 2, isPending: false, isFetching: false, isSuccess: true, isStale: false });
});

test("should update query state and not refetch when resetting a disabled query with resetQueries", async () => {
  const app = await run(
    "should update query state and not refetch when resetting a disabled query with resetQueries",
  );
  expect(app.texts()).toContain("data: null");

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");

  await app.press("reset");
  await advance(app, 10);
  expect(app.texts()).toContain("data: null");

  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 1 });
  const states = logged(app, "status");
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ isPending: true, isFetching: false, isSuccess: false, isStale: false });
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ isPending: true, isFetching: true, isSuccess: false, isStale: false });
  expect(states[1]).toMatchObject({ data: undefined });
  expect(states[2]).toMatchObject({ data: 1, isPending: false, isFetching: false, isSuccess: true, isStale: false });
  expect(states[3]).toMatchObject({ isPending: true, isFetching: false, isSuccess: false, isStale: false });
  expect(states[3]).toMatchObject({ data: undefined });
});

test("should only call the query hash function once", async () => {
  const app = await run("should only call the query hash function once");
  await app.press("report");
  expect(last(app, "hashes")).toEqual({ hashes: 1 });
});

test("should refetch when changed enabled to true in error state", async () => {
  const app = await run("should refetch when changed enabled to true in error state");
  // initial state check
  expect(app.texts()).toContain("status: pending");

  // render error state component
  await advance(app, 10);
  expect(app.texts()).toContain("error");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 1 });

  // change to enabled to false
  await app.press("retry");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 1 });

  // change to enabled to true
  await app.press("retry");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 2 });
});

test("should refetch when query key changed when previous status is error", async () => {
  const app = await run("should refetch when query key changed when previous status is error");
  // initial state check
  expect(app.texts()).toContain("status: pending");
  // render error state component
  await advance(app, 10);
  expect(app.texts()).toContain("error");

  // change to unmount query
  await app.press("change");
  await advance(app, 10);
  expect(app.texts()).toContain("rendered");

  // change to mount new query
  await app.press("change");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
});

test("should refetch when query key changed when switching between erroneous queries", async () => {
  const app = await run("should refetch when query key changed when switching between erroneous queries");
  // initial state check
  expect(app.texts()).toContain("status: fetching");
  // render error state component
  await advance(app, 10);
  expect(app.texts()).toContain("error");

  // change to mount second query
  await app.press("change");
  expect(app.texts()).toContain("status: fetching");
  await advance(app, 10);
  expect(app.texts()).toContain("error");

  // change to mount first query again
  await app.press("change");
  expect(app.texts()).toContain("status: fetching");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
});

test("should have no error in pending state when refetching after error occurred", async () => {
  const app = await run("should have no error in pending state when refetching after error occurred");
  await advance(app, 10);
  expect(app.texts()).toContain("error");

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 5");

  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ status: "pending", error: null });
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ status: "error", error: error("oops") });
  expect(states[1]).toMatchObject({ data: undefined });
  expect(states[2]).toMatchObject({ status: "pending", error: null });
  expect(states[2]).toMatchObject({ data: undefined });
  expect(states[3]).toMatchObject({ status: "success", data: 5, error: null });
});

test("should not start fetching online queries if you are offline", async () => {
  const app = await run("should not start fetching online queries if you are offline");
  await offline(app);
  await app.press("mount");

  await advance(app, 10);
  expect(app.texts()).toContain("status: pending, isPaused: true");

  await online(app);
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, isPaused: false");
  expect(app.texts()).toContain("data: data");

  expect(logs(app).map((entry) => entry.fetchStatus)).toEqual(["paused", "fetching", "idle"]);
});

test("should not refetch online queries if you are offline", async () => {
  const app = await run("should not refetch online queries if you are offline");
  expect(app.texts()).toContain("status: pending, fetchStatus: fetching, failureCount: 0");
  await advance(app, 10);
  expect(app.texts()).toContain("data: data1");

  await offline(app);
  await app.press("invalidate");
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: paused, failureCount: 0");
  expect(app.texts()).toContain("failureReason: null");

  await online(app);
  await advance(app, 0);
  expect(app.texts()).toContain("status: success, fetchStatus: fetching, failureCount: 0");
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: idle, failureCount: 0");
  expect(app.texts()).toContain("failureReason: null");
  expect(app.texts()).toContain("data: data2");
});

test("should not refetch online queries if you are offline and refocus", async () => {
  const app = await run("should not refetch online queries if you are offline and refocus");
  expect(app.texts()).toContain("status: pending, fetchStatus: fetching");
  await advance(app, 10);
  expect(app.texts()).toContain("data: data1");

  await offline(app);
  await app.press("invalidate");
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: paused");

  await app.setLifecycle("background");
  await app.setLifecycle("active");

  await advance(app, 10);
  expect(app.texts()).not.toContain("data: data2");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 1 });
});

test("should not refetch online queries while already paused", async () => {
  const app = await run("should not refetch online queries while already paused");
  await offline(app);
  await app.press("mount");
  expect(app.texts()).toContain("status: pending, fetchStatus: paused");

  await app.press("invalidate");
  // invalidation should not trigger a refetch
  await advance(app, 10);
  expect(app.texts()).toContain("status: pending, fetchStatus: paused");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 0 });
});

test("should not refetch online queries while already paused if data is in the cache", async () => {
  const app = await run("should not refetch online queries while already paused if data is in the cache");
  await offline(app);
  await app.press("mount");
  expect(app.texts()).toContain("status: success, fetchStatus: paused");
  expect(app.texts()).toContain("data: initial");

  await app.press("invalidate");
  // invalidation should not trigger a refetch
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: paused");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 0 });
});

test("should not get online queries stuck in fetching state when pausing multiple times", async () => {
  const app = await run("should not get online queries stuck in fetching state when pausing multiple times");
  await offline(app);
  await app.press("mount");

  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: paused");
  expect(app.texts()).toContain("data: initial");

  // triggers one pause
  await app.press("invalidate");
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: paused");
  // triggers a second pause
  await app.setLifecycle("background");
  await app.setLifecycle("active");

  await online(app);
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: idle");
  expect(app.texts()).toContain("data: data1");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 1 });
});

test("should pause retries of online queries if you are offline", async () => {
  const app = await run("should pause retries of online queries if you are offline");
  // First retry (online): retryDelay (10ms) + queryFn (10ms)
  await advance(app, 10);
  expect(app.texts()).toContain("status: pending, fetchStatus: fetching, failureCount: 1");
  await advance(app, 10);
  expect(app.texts()).toContain("failureReason: failed1");

  await offline(app);

  // Second retry (offline, paused): retryDelay (10ms) + queryFn (10ms)
  // Third retry is scheduled but paused due to offline
  await advance(app, 10);
  await advance(app, 10);
  expect(app.texts()).toContain("status: pending, fetchStatus: paused, failureCount: 2");
  expect(app.texts()).toContain("failureReason: failed2");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 2 });

  await online(app);

  // Third retry (resumed): only queryFn (10ms), retryDelay already consumed while paused
  await advance(app, 10);
  expect(app.texts()).toContain("status: error, fetchStatus: idle, failureCount: 3");
  expect(app.texts()).toContain("failureReason: failed3");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 3 });
});

test("should not fetch online queries if paused initial load and we go online after unmount", async () => {
  const app = await run("should not fetch online queries if paused initial load and we go online after unmount");
  await offline(app);
  await app.press("mount");
  expect(app.texts()).toContain("status: pending, fetchStatus: paused");

  await app.press("hide");
  await online(app);

  await advance(app, 10);
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 0, fetchStatus: "idle", status: "pending" });
});

test("should re-fetch online queries if paused and we go online even if already unmounted (because not cancelled)", async () => {
  const app = await run(
    "should re-fetch online queries if paused and we go online even if already unmounted (because not cancelled)",
  );
  await offline(app);
  await app.press("mount");
  expect(app.texts()).toContain("status: success, fetchStatus: paused");

  await app.press("hide");
  await online(app);

  await advance(app, 10);
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 1, fetchStatus: "idle", status: "success" });
});

test("should not fetch online queries if paused and we go online when cancelled and no refetchOnReconnect", async () => {
  const app = await run(
    "should not fetch online queries if paused and we go online when cancelled and no refetchOnReconnect",
  );
  await offline(app);
  await app.press("mount");
  expect(app.texts()).toContain("status: pending, fetchStatus: paused");

  await app.press("cancel");
  await advance(app, 10);
  expect(app.texts()).toContain("status: pending, fetchStatus: idle");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 0 });

  await online(app);
  expect(app.texts()).toContain("status: pending, fetchStatus: idle");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 0 });
});

test("should fetch online queries if paused and we go online even if already unmounted when refetch was not cancelled", async () => {
  const app = await run(
    "should fetch online queries if paused and we go online even if already unmounted when refetch was not cancelled",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: idle");
  await offline(app);

  await app.press("invalidate");
  await advance(app, 10);
  expect(app.texts()).toContain("status: success, fetchStatus: paused");

  await app.press("hide");
  await online(app);

  await advance(app, 10);
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 2, fetchStatus: "idle", status: "success" });
});

test("should start fetching always queries even if you are offline", async () => {
  const app = await run("should start fetching always queries even if you are offline");
  await offline(app);
  await app.press("mount");

  await advance(app, 10);
  expect(app.texts()).toContain("status: success, isPaused: false");
  expect(app.texts()).toContain("data: data 1");
});

test("should not pause retries of always queries", async () => {
  const app = await run("should not pause retries of always queries");
  await offline(app);
  await app.press("mount");

  await advance(app, 10);
  await advance(app, 10);
  await advance(app, 10);
  expect(app.texts()).toContain("status: error, isPaused: false");
  expect(app.texts()).toContain("error: error 2");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 2 });
});

test("should start fetching offlineFirst queries if you are offline, but pause retries", async () => {
  const app = await run("should start fetching offlineFirst queries if you are offline, but pause retries");
  await offline(app);
  await app.press("mount");

  // Initial fetch completes while offline: queryFn (10ms) + micro delay (1ms)
  // First retry is scheduled but paused due to offline
  await advance(app, 10);
  await advance(app, 1);
  expect(app.texts()).toContain("status: pending, fetchStatus: paused, failureCount: 1");
  expect(app.texts()).toContain("failureReason: failed1");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 1 });

  await online(app);

  // Resume retries when back online
  await advance(app, 10);
  await advance(app, 10);
  await advance(app, 10);
  expect(app.texts()).toContain("status: error, fetchStatus: idle, failureCount: 3");
  expect(app.texts()).toContain("failureReason: failed3");
  await app.press("report");
  expect(last(app, "count")).toEqual({ count: 3 });
});

test("should have status=error on mount when a query has failed", async () => {
  const app = await run("should have status=error on mount when a query has failed");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(1);
  expect(states[0]).toMatchObject({ status: "error", error: error("oops") });
});

test("should respect updatedAt in setQueryData", async () => {
  const app = await run("should respect updatedAt in setQueryData");
  await advance(app, 10);
  expect(app.texts()).toContain("data: data");

  await app.press("setQueryData");
  await advance(app, 0);
  expect(app.texts()).toContain("data: newData");
  expect(app.texts()).toContain("dataUpdatedAt: 100");
});

test("should increase errorUpdateCount on each fetch failure", async () => {
  const app = await run("should increase errorUpdateCount on each fetch failure");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 2");

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 3");
});

test("should not fetch while restoring and refetch after restoring is complete", async () => {
  const app = await run("should not fetch while restoring and refetch after restoring is complete");
  await advance(app, 0);
  expect(app.texts()).toContain("status: pending");
  expect(app.texts()).toContain("fetchStatus: idle");
  expect(app.texts()).toContain("data: undefined");
  await app.press("report");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 0 });

  // Restoring complete: should refetch
  await app.press("restored");
  await advance(app, 10);
  expect(app.texts()).toContain("status: success");
  expect(app.texts()).toContain("fetchStatus: idle");
  expect(app.texts()).toContain("data: data");
  await app.press("report");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 1 });
});

test("should use provided custom queryClient", async () => {
  const app = await run("should use provided custom queryClient");
  await advance(app, 10);
  expect(app.texts()).toContain("Status: custom client");
});

test("should not fetch when queryFn is skipToken, and fetch once postId is set", async () => {
  const app = await run("should not fetch when queryFn is skipToken, and fetch once postId is set");
  expect(app.texts()).toContain("data: none");
  await advance(app, 10);
  await app.press("report");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 0 });
  expect(app.texts()).toContain("data: none");

  await app.press("set postId");
  await advance(app, 10);
  await app.press("report");
  expect(last(app, "queryFnCalls")).toEqual({ queryFnCalls: 1 });
  expect(app.texts()).toContain("data: post 1");
});
