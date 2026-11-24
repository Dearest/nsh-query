import { expect, test } from "nsh/test";
import type { App } from "nsh/test";
import { advance, error, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useQuery/parity-solid-1.tsx";
const run = (name: string) => openScenario(entry, name);

function tagged(app: App, tag: string): any[] {
  return logs(app)
    .filter((line) => Array.isArray(line) && line[0] === tag)
    .map((line) => line[1]);
}

test("should allow to set default data value", async () => {
  const app = await run("should allow to set default data value");
  expect(app.texts()).toContain("default");
  await advance(app, 10);
  expect(app.texts()).toContain("test");
});

const pendingState = {
  data: undefined,
  dataUpdatedAt: 0,
  error: null,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  errorUpdateCount: 0,
  isError: false,
  isFetched: false,
  isFetchedAfterMount: false,
  isFetching: true,
  isPaused: false,
  isPending: true,
  isInitialLoading: true,
  isLoading: true,
  isLoadingError: false,
  isPlaceholderData: false,
  isRefetchError: false,
  isRefetching: false,
  isStale: true,
  isSuccess: false,
  isEnabled: true,
  refetch: "[Function]",
  status: "pending",
  fetchStatus: "fetching",
};

test("should return the correct states for a successful query", async () => {
  const app = await run("should return the correct states for a successful query");
  await advance(app, 10);
  expect(app.texts()).toContain("test");
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toEqual(pendingState);
  expect(states[1]).toEqual({
    ...pendingState,
    data: "test",
    dataUpdatedAt: states[1].dataUpdatedAt,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isPending: false,
    isInitialLoading: false,
    isLoading: false,
    isSuccess: true,
    status: "success",
    fetchStatus: "idle",
  });
  expect(typeof states[1].dataUpdatedAt).toBe("number");
});

test("should return the correct states for an unsuccessful query", async () => {
  const app = await run("should return the correct states for an unsuccessful query");
  await advance(app, 21);
  expect(app.texts()).toContain("Status: error");
  const states = logs(app);
  expect(states).toHaveLength(3);
  expect(states[0]).toEqual(pendingState);
  expect(states[1]).toEqual({ ...pendingState, failureCount: 1, failureReason: error("rejected #1") });
  expect(states[2]).toEqual({
    ...pendingState,
    error: error("rejected #2"),
    errorUpdatedAt: states[2].errorUpdatedAt,
    failureCount: 2,
    failureReason: error("rejected #2"),
    errorUpdateCount: 1,
    isError: true,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isPending: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: true,
    status: "error",
    fetchStatus: "idle",
  });
  expect(typeof states[2].errorUpdatedAt).toBe("number");
});

test("should set isFetchedAfterMount to true after a query has been fetched", async () => {
  const app = await run("should set isFetchedAfterMount to true after a query has been fetched");
  await advance(app, 10);
  expect(app.texts()).toContain("data: prefetched");
  expect(app.texts()).toContain("isFetched: true");
  expect(app.texts()).toContain("isFetchedAfterMount: false");
  await advance(app, 10);
  expect(app.texts()).toContain("data: data");
  expect(app.texts()).toContain("isFetchedAfterMount: true");
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: "prefetched", isFetched: true, isFetchedAfterMount: false });
  expect(states[1]).toMatchObject({ data: "data", isFetched: true, isFetchedAfterMount: true });
});

test("should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already", async () => {
  const app = await run(
    "should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already",
  );
  await advance(app, 15);
  // first refetch only, second refetch is ignored
  expect(logs(app)).toEqual([{ fetchCount: 1 }]);
});

test("should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already", async () => {
  const app = await run(
    "should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already",
  );
  await advance(app, 15);
  // first refetch (gets cancelled) and second refetch
  expect(logs(app).at(-1)).toEqual({ fetchCount: 2 });
});

test("should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet", async () => {
  const app = await run(
    "should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet",
  );
  await advance(app, 15);
  // first refetch will not get cancelled, second one gets skipped
  expect(logs(app)).toEqual([{ fetchCount: 1 }]);
});

test("should be able to watch a query without providing a query function", async () => {
  const app = await run("should be able to watch a query without providing a query function");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "data" });
});

test("should pick up a query when re-mounting with gcTime 0", async () => {
  const app = await run("should pick up a query when re-mounting with gcTime 0");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");
  await app.press("toggle");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 2");
  const states = logs(app);
  expect(states).toHaveLength(4);
  // First load
  expect(states[0]).toMatchObject({ isPending: true, isSuccess: false, isFetching: true });
  // First success
  expect(states[1]).toMatchObject({ isPending: false, isSuccess: true, isFetching: false });
  // Switch, goes to fetching
  expect(states[2]).toMatchObject({ isPending: false, isSuccess: true, isFetching: true });
  // Second success
  expect(states[3]).toMatchObject({ isPending: false, isSuccess: true, isFetching: false });
});

test("should fetch when refetchOnMount is false and nothing has been fetched yet", async () => {
  const app = await run("should fetch when refetchOnMount is false and nothing has been fetched yet");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "test" });
});

test("should not fetch when refetchOnMount is false and data has been fetched already", async () => {
  const app = await run("should not fetch when refetchOnMount is false and data has been fetched already");
  expect(logs(app)).toHaveLength(1);
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(1);
  expect(states[0]).toMatchObject({ data: "prefetched" });
});

test("should be able to select a part of the data with select", async () => {
  const app = await run("should be able to select a part of the data with select");
  await advance(app, 10);
  expect(app.texts()).toContain("test");
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "test" });
});

test("should be able to select a part of the data with select in object syntax 2", async () => {
  const app = await run("should be able to select a part of the data with select in object syntax 2");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "test" });
});

test("should be able to select a part of the data with select in object syntax 1", async () => {
  const app = await run("should be able to select a part of the data with select in object syntax 1");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "test" });
});

test("should not re-render when it should only re-render only data change and the selected data did not change", async () => {
  const app = await run(
    "should not re-render when it should only re-render only data change and the selected data did not change",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("data: test");
  expect(logs(app)).toHaveLength(2);

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: test");
  // make sure no additional states happen
  await advance(app, 50);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "test" });
});

test("should throw an error when a selector throws", async () => {
  const app = await run("should throw an error when a selector throws");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ status: "pending", data: undefined });
  expect(states[1]).toMatchObject({ status: "error", error: error("Select Error") });
});

test("should track properties and only re-render when a tracked property changes", async () => {
  const app = await run("should track properties and only re-render when a tracked property changes");
  await advance(app, 10);
  expect(app.texts()).toContain("test1");
  expect(logs(app)).toEqual([{ data: undefined }, { data: "test1" }]);

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("test2");
  // isFetching flipped twice, but only `data` is read
  expect(logs(app)).toEqual([{ data: undefined }, { data: "test1" }, { data: "test2" }]);
});

test("should always re-render if we are tracking props but not using any", async () => {
  const app = await run("should always re-render if we are tracking props but not using any");
  await advance(app, 10);
  expect(tagged(app, "renderCount")).toEqual([1, 2]);
  const states = tagged(app, "state");
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "test" });
});

test("should share equal data structures between query results", async () => {
  const app = await run("should share equal data structures between query results");
  await advance(app, 10);
  expect(app.texts()).toContain("data: false");

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: true");

  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[2].data).toEqual([
    { id: "1", done: false },
    { id: "2", done: false },
  ]);
  expect(states[3].data).toEqual([
    { id: "1", done: false },
    { id: "2", done: true },
  ]);

  await app.press("compare");
  expect(logs(app).at(-1)).toEqual({
    sameTodos: false,
    sameTodo1: true,
    sameTodo2: false,
    newTodosIsResult2: false,
  });
});

test("should use query function from hook when the existing query does not have a query function", async () => {
  const app = await run(
    "should use query function from hook when the existing query does not have a query function",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("data: set");

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: fetched");

  const results = logs(app);
  expect(results).toHaveLength(3);
  expect(results[0]).toMatchObject({ data: "set", isFetching: false });
  expect(results[1]).toMatchObject({ data: "set", isFetching: true });
  expect(results[2]).toMatchObject({ data: "fetched", isFetching: false });
});

test("should update query stale state and refetch when invalidated with invalidateQueries", async () => {
  const app = await run("should update query stale state and refetch when invalidated with invalidateQueries");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1, isStale: false, isFetching: false");

  await app.press("invalidate");
  expect(app.texts()).toContain("data: 1, isStale: true, isFetching: true");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 2, isStale: false, isFetching: false");

  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({
    data: undefined,
    isFetching: true,
    isRefetching: false,
    isSuccess: false,
    isStale: true,
  });
  expect(states[1]).toMatchObject({ data: 1, isFetching: false, isRefetching: false, isSuccess: true, isStale: false });
  expect(states[2]).toMatchObject({ data: 1, isFetching: true, isRefetching: true, isSuccess: true, isStale: true });
  expect(states[3]).toMatchObject({ data: 2, isFetching: false, isRefetching: false, isSuccess: true, isStale: false });
});

test("should not update disabled query when refetch with refetchQueries", async () => {
  const app = await run("should not update disabled query when refetch with refetchQueries");
  await advance(app, 30);
  const states = logs(app);
  expect(states).toHaveLength(1);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: false, isSuccess: false, isStale: false });
});

test("should not refetch disabled query when invalidated with invalidateQueries", async () => {
  const app = await run("should not refetch disabled query when invalidated with invalidateQueries");
  expect(logs(app)).toHaveLength(1);
  await advance(app, 30);
  const states = logs(app);
  expect(states).toHaveLength(1);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: false, isSuccess: false, isStale: false });
});

test("should not fetch when switching to a disabled query", async () => {
  const app = await run("should not fetch when switching to a disabled query");
  await advance(app, 10);
  expect(app.texts()).toContain("count: 1");
  expect(app.texts()).toContain("data: undefined");
  const states = logs(app);
  expect(states).toHaveLength(3);
  // Fetch query
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, isSuccess: false });
  // Fetched query
  expect(states[1]).toMatchObject({ data: 0, isFetching: false, isSuccess: true });
  // Switch to disabled query
  expect(states[2]).toMatchObject({ data: undefined, isFetching: false, isSuccess: false });
});

test("should keep the previous data when placeholderData is set", async () => {
  const app = await run("should keep the previous data when placeholderData is set");
  await advance(app, 30);
  expect(app.texts()).toContain("data: 1");
  const states = logs(app);
  expect(states).toHaveLength(4);
  // Initial
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, isSuccess: false, isPlaceholderData: false });
  // Fetched
  expect(states[1]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: false });
  // Set state
  expect(states[2]).toMatchObject({ data: 0, isFetching: true, isSuccess: true, isPlaceholderData: true });
  // New data
  expect(states[3]).toMatchObject({ data: 1, isFetching: false, isSuccess: true, isPlaceholderData: false });
});

test("should not show initial data from next query if placeholderData is set", async () => {
  const app = await run("should not show initial data from next query if placeholderData is set");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 0, count: 0, isFetching: false");

  await app.press("inc");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1, count: 1, isFetching: false");

  const states = logs(app);
  expect(states).toHaveLength(4);
  // Initial
  expect(states[0]).toMatchObject({ data: 99, isFetching: true, isSuccess: true, isPlaceholderData: false });
  // Fetched
  expect(states[1]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: false });
  // Set state
  expect(states[2]).toMatchObject({ data: 99, isFetching: true, isSuccess: true, isPlaceholderData: false });
  // New data
  expect(states[3]).toMatchObject({ data: 1, isFetching: false, isSuccess: true, isPlaceholderData: false });
});

test("should keep the previous data on disabled query when placeholderData is set and switching query key multiple times", async () => {
  const app = await run(
    "should keep the previous data on disabled query when placeholderData is set and switching query key multiple times",
  );
  await advance(app, 51);
  const states = logs(app);
  expect(states).toHaveLength(4);
  // Disabled query
  expect(states[0]).toMatchObject({ data: 10, isFetching: false, isSuccess: true, isPlaceholderData: false });
  // Set state
  expect(states[1]).toMatchObject({ data: 10, isFetching: false, isSuccess: true, isPlaceholderData: true });
  // Refetch
  expect(states[2]).toMatchObject({ data: 10, isFetching: true, isSuccess: true, isPlaceholderData: true });
  // Refetch done
  expect(states[3]).toMatchObject({ data: 12, isFetching: false, isSuccess: true, isPlaceholderData: false });
});

test("should use the correct query function when components use different configurations", async () => {
  const app = await run("should use the correct query function when components use different configurations");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");

  await app.press("refetch");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: 1 });
  expect(states[2]).toMatchObject({ data: 1 });
  // This state should be 1 instead of 2
  expect(states[3]).toMatchObject({ data: 1 });
});

test("should be able to set different stale times for a query", async () => {
  const app = await run("should be able to set different stale times for a query");
  await advance(app, 20);
  await advance(app, 200);
  const states1 = tagged(app, "states1");
  const states2 = tagged(app, "states2");
  expect(states1).toHaveLength(4);
  expect(states2).toHaveLength(3);

  expect(states1).toMatchObject([
    // First render
    { data: "prefetch", isStale: false },
    // Second useQuery started fetching
    { data: "prefetch", isStale: false },
    // Second useQuery data came in
    { data: "two", isStale: false },
    // Data became stale after 100ms
    { data: "two", isStale: true },
  ]);

  expect(states2).toMatchObject([
    // First render, data is stale and starts fetching
    { data: "prefetch", isStale: true },
    // Second useQuery data came in
    { data: "two", isStale: false },
    // Data became stale after 10ms
    { data: "two", isStale: true },
  ]);
});

test("should re-render when a query becomes stale", async () => {
  const app = await run("should re-render when a query becomes stale");
  await advance(app, 70);
  const states = logs(app);
  expect(states).toHaveLength(3);
  expect(states[0]).toMatchObject({ isStale: true });
  expect(states[1]).toMatchObject({ isStale: false });
  expect(states[2]).toMatchObject({ isStale: true });
});

test("should not re-render when it should only re-render on data changes and the data did not change", async () => {
  const app = await run(
    "should not re-render when it should only re-render on data changes and the data did not change",
  );
  await advance(app, 15);
  await advance(app, 20);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined, status: "pending", isFetching: true });
  expect(states[1]).toMatchObject({ data: "test", status: "success", isFetching: false });

  // notifyOnChangeProps as a function
  const fnApp = await run(
    "function › should not re-render when it should only re-render on data changes and the data did not change",
  );
  await advance(fnApp, 5);
  expect(fnApp.texts()).toContain("test");
  await fnApp.press("refetch");
  await advance(fnApp, 20);
  const fnStates = logs(fnApp);
  expect(fnStates).toHaveLength(2);
  expect(fnStates[0]).toMatchObject({ data: undefined, status: "pending", isFetching: true });
  expect(fnStates[1]).toMatchObject({ data: "test", status: "success", isFetching: false });
});
