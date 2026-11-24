import { expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useInfiniteQuery/parity.tsx";
const run = (name: string) => openScenario(entry, name);

test("should return the correct states for a successful query", async () => {
  const app = await run("should return the correct states for a successful query");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toEqual({
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    fetchNextPage: "[Function]",
    fetchPreviousPage: "[Function]",
    hasNextPage: false,
    hasPreviousPage: false,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: true,
    isPaused: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isFetchPreviousPageError: false,
    isFetchingPreviousPage: false,
    isPending: true,
    isLoading: true,
    isInitialLoading: true,
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
  });
  expect(states[1]).toEqual({
    data: { pages: [0], pageParams: [0] },
    dataUpdatedAt: states[1].dataUpdatedAt,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    fetchNextPage: "[Function]",
    fetchPreviousPage: "[Function]",
    hasNextPage: true,
    hasPreviousPage: false,
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isPaused: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isFetchPreviousPageError: false,
    isFetchingPreviousPage: false,
    isPending: false,
    isLoading: false,
    isInitialLoading: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: true,
    isSuccess: true,
    isEnabled: true,
    refetch: "[Function]",
    status: "success",
    fetchStatus: "idle",
  });
  expect(typeof states[1].dataUpdatedAt).toBe("number");
});

test("should not throw when fetchNextPage returns an error", async () => {
  const app = await run("should not throw when fetchNextPage returns an error");
  await advance(app, 50);
  expect(logs(app)).toEqual([{ noThrow: true }]);
});

test("should keep the previous data when placeholderData is set", async () => {
  const app = await run("should keep the previous data when placeholderData is set");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 0-desc");

  await app.press("fetchNextPage");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 0-desc,1-desc");

  await app.press("order");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 0-asc");
  expect(app.texts()).toContain("isFetching: false");

  const states = logs(app);
  expect(states).toHaveLength(6);
  expect(states[0]).toMatchObject({
    data: undefined,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: false,
    isPlaceholderData: false,
  });
  expect(states[1]).toMatchObject({
    data: { pages: ["0-desc"] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
    isPlaceholderData: false,
  });
  expect(states[2]).toMatchObject({
    data: { pages: ["0-desc"] },
    isFetching: true,
    isFetchingNextPage: true,
    isSuccess: true,
    isPlaceholderData: false,
  });
  expect(states[3]).toMatchObject({
    data: { pages: ["0-desc", "1-desc"] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
    isPlaceholderData: false,
  });
  // Set state
  expect(states[4]).toMatchObject({
    data: { pages: ["0-desc", "1-desc"] },
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: true,
    isPlaceholderData: true,
  });
  expect(states[5]).toMatchObject({
    data: { pages: ["0-asc"] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
    isPlaceholderData: false,
  });
});

test("should be able to select a part of the data", async () => {
  const app = await run("should be able to select a part of the data");
  await advance(app, 10);
  expect(app.texts()).toContain("count: 1");
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined, isSuccess: false });
  expect(states[1]).toMatchObject({ data: { pages: ["count: 1"] }, isSuccess: true });
});

test("should be able to select a new result and not cause infinite renders", async () => {
  const app = await run("should be able to select a new result and not cause infinite renders");
  await advance(app, 10);
  expect(app.texts()).toContain("count: 1");
  await app.press("report");
  const [first, second, report] = logs(app);
  expect(logs(app)).toHaveLength(3);
  expect(report).toEqual({ selectCalled: 1 });
  expect(first).toMatchObject({ data: undefined, isSuccess: false });
  expect(second).toMatchObject({ data: { pages: [{ count: 1 }] }, isSuccess: true });
});

test("should be able to reverse the data", async () => {
  const app = await run("should be able to reverse the data");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 0");

  await app.press("fetchNextPage");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1,0");

  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ data: undefined, isSuccess: false });
  expect(states[1]).toMatchObject({ data: { pages: [0] }, isSuccess: true });
  expect(states[2]).toMatchObject({ data: { pages: [0] }, isSuccess: true });
  expect(states[3]).toMatchObject({ data: { pages: [1, 0] }, isSuccess: true });
});

test("should be able to fetch a previous page", async () => {
  const app = await run("should be able to fetch a previous page");
  await advance(app, 30);
  expect(app.texts()).toContain("data: 9,10");
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({
    data: undefined,
    hasNextPage: false,
    hasPreviousPage: false,
    isFetching: true,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isSuccess: false,
  });
  expect(states[1]).toMatchObject({
    data: { pages: [10] },
    hasNextPage: true,
    hasPreviousPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isSuccess: true,
  });
  expect(states[2]).toMatchObject({
    data: { pages: [10] },
    hasNextPage: true,
    hasPreviousPage: true,
    isFetching: true,
    isFetchingNextPage: false,
    isFetchingPreviousPage: true,
    isSuccess: true,
  });
  expect(states[3]).toMatchObject({
    data: { pages: [9, 10] },
    hasNextPage: true,
    hasPreviousPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isSuccess: true,
  });
});

test("should be able to refetch when providing page params automatically", async () => {
  const app = await run("should be able to refetch when providing page params automatically");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 10");

  await app.press("fetchNextPage");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 10,11");

  await app.press("fetchPreviousPage");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 9,10,11");

  await app.press("refetch");
  await advance(app, 30);
  expect(app.texts()).toContain("isFetching: false");

  const states = logs(app);
  expect(states).toHaveLength(8);
  // Initial fetch
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, isFetchingNextPage: false, isRefetching: false });
  // Initial fetch done
  expect(states[1]).toMatchObject({
    data: { pages: [10] },
    isFetching: false,
    isFetchingNextPage: false,
    isRefetching: false,
  });
  // Fetch next page
  expect(states[2]).toMatchObject({
    data: { pages: [10] },
    isFetching: true,
    isFetchingNextPage: true,
    isRefetching: false,
  });
  // Fetch next page done
  expect(states[3]).toMatchObject({
    data: { pages: [10, 11] },
    isFetching: false,
    isFetchingNextPage: false,
    isRefetching: false,
  });
  // Fetch previous page
  expect(states[4]).toMatchObject({
    data: { pages: [10, 11] },
    isFetching: true,
    isFetchingNextPage: false,
    isFetchingPreviousPage: true,
    isRefetching: false,
  });
  // Fetch previous page done
  expect(states[5]).toMatchObject({
    data: { pages: [9, 10, 11] },
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isRefetching: false,
  });
  // Refetch
  expect(states[6]).toMatchObject({
    data: { pages: [9, 10, 11] },
    isFetching: true,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isRefetching: true,
  });
  // Refetch done
  expect(states[7]).toMatchObject({
    data: { pages: [9, 10, 11] },
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isRefetching: false,
  });
});

const idle = {
  isFetching: false,
  isFetchNextPageError: false,
  isFetchingNextPage: false,
  isFetchPreviousPageError: false,
  isFetchingPreviousPage: false,
  isRefetchError: false,
  isRefetching: false,
};

test("should return the correct states when refetch fails", async () => {
  const app = await run("should return the correct states when refetch fails");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 10");

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("isFetching: false");

  const states = logs(app);
  expect(states).toHaveLength(4);
  // Initial fetch
  expect(states[0]).toMatchObject({ ...idle, data: undefined, isFetching: true });
  // Initial fetch done
  expect(states[1]).toMatchObject({ ...idle, data: { pages: [10] } });
  // Refetch
  expect(states[2]).toMatchObject({ ...idle, data: { pages: [10] }, isFetching: true, isRefetching: true });
  // Refetch failed
  expect(states[3]).toMatchObject({ ...idle, data: { pages: [10] }, isRefetchError: true });
});

test("should return the correct states when fetchNextPage fails", async () => {
  const app = await run("should return the correct states when fetchNextPage fails");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 10");

  await app.press("fetchNextPage");
  await advance(app, 10);
  expect(app.texts()).toContain("isFetching: false");

  const states = logs(app);
  expect(states).toHaveLength(4);
  // Initial fetch
  expect(states[0]).toMatchObject({ ...idle, data: undefined, isFetching: true });
  // Initial fetch done
  expect(states[1]).toMatchObject({ ...idle, data: { pages: [10] } });
  // Fetch next page
  expect(states[2]).toMatchObject({ ...idle, data: { pages: [10] }, isFetching: true, isFetchingNextPage: true });
  // Fetch next page failed
  expect(states[3]).toMatchObject({ ...idle, data: { pages: [10] }, isFetchNextPageError: true });
});

test("should return the correct states when fetchPreviousPage fails", async () => {
  const app = await run("should return the correct states when fetchPreviousPage fails");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 10");

  await app.press("fetchPreviousPage");
  await advance(app, 10);
  expect(app.texts()).toContain("isFetching: false");

  const states = logs(app);
  expect(states).toHaveLength(4);
  // Initial fetch
  expect(states[0]).toMatchObject({ ...idle, data: undefined, isFetching: true });
  // Initial fetch done
  expect(states[1]).toMatchObject({ ...idle, data: { pages: [10] } });
  // Fetch previous page
  expect(states[2]).toMatchObject({
    ...idle,
    data: { pages: [10] },
    isFetching: true,
    isFetchingPreviousPage: true,
  });
  // Fetch previous page failed
  expect(states[3]).toMatchObject({ ...idle, data: { pages: [10] }, isFetchPreviousPageError: true });
});

test("should silently cancel any ongoing fetch when fetching more", async () => {
  const app = await run("should silently cancel any ongoing fetch when fetching more");
  await advance(app, 50);
  expect(app.texts()).toContain("status: success, idle");
  expect(app.texts()).toContain('data: {"pages":[10],"pageParams":[10]}');
  await advance(app, 50);
  expect(app.texts()).toContain("status: success, fetching");
  await advance(app, 60);
  expect(app.texts()).toContain("status: success, idle");
  expect(app.texts()).toContain('data: {"pages":[10,11],"pageParams":[10,11]}');

  const states = logs(app);
  expect(states).toHaveLength(5);
  expect(states[0]).toMatchObject({
    hasNextPage: false,
    data: undefined,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: false,
  });
  expect(states[1]).toMatchObject({
    hasNextPage: true,
    data: { pages: [10] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  expect(states[2]).toMatchObject({
    hasNextPage: true,
    data: { pages: [10] },
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  expect(states[3]).toMatchObject({
    hasNextPage: true,
    data: { pages: [10] },
    isFetching: true,
    isFetchingNextPage: true,
    isSuccess: true,
  });
  expect(states[4]).toMatchObject({
    hasNextPage: true,
    data: { pages: [10, 11] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
});

test("should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked", async () => {
  const app = await run(
    "should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked",
  );
  await advance(app, 160);
  await app.press("report");
  const [calls] = logs(app);
  expect(calls).toEqual([
    { pageParam: 10, queryKey: calls[0].queryKey, isAbortSignal: true, aborted: false, onAbort: 0, listener: 0 },
    { pageParam: 11, queryKey: calls[0].queryKey, isAbortSignal: true, aborted: true, onAbort: 1, listener: 1 },
    { pageParam: 11, queryKey: calls[0].queryKey, isAbortSignal: true, aborted: false, onAbort: 0, listener: 0 },
  ]);
  expect(calls[0].queryKey[0]).toMatch(/^query_/);
});

test("should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used", async () => {
  const app = await run(
    "should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used",
  );
  await advance(app, 160);
  await app.press("report");
  const [calls] = logs(app);
  expect(calls).toEqual([
    { pageParam: 10, queryKey: calls[0].queryKey, isAbortSignal: true, aborted: false, onAbort: 0, listener: 0 },
    { pageParam: 11, queryKey: calls[0].queryKey, isAbortSignal: true, aborted: false, onAbort: 0, listener: 0 },
  ]);
  expect(calls[0].queryKey[0]).toMatch(/^query_/);
});

test("should keep fetching first page when not loaded yet and triggering fetch more", async () => {
  const app = await run("should keep fetching first page when not loaded yet and triggering fetch more");
  await advance(app, 60);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({
    hasNextPage: false,
    data: undefined,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: false,
  });
  expect(states[1]).toMatchObject({
    hasNextPage: true,
    data: { pages: [10] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
});

test("should stop fetching additional pages when the component is unmounted and AbortSignal is consumed", async () => {
  const app = await run(
    "should stop fetching additional pages when the component is unmounted and AbortSignal is consumed",
  );
  await advance(app, 125);
  await app.press("report");
  expect(logs(app)).toEqual([
    {
      fetches: 2,
      state: { data: { pages: [1, 2, 3, 4], pageParams: [0, 1, 2, 3] }, status: "success", error: null },
    },
  ]);
});

test("should be able to set new pages with the query client", async () => {
  const app = await run("should be able to set new pages with the query client");
  await advance(app, 70);
  const states = logs(app);
  expect(states).toHaveLength(5);
  expect(states[0]).toMatchObject({
    hasNextPage: false,
    data: undefined,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: false,
  });
  // After first fetch
  expect(states[1]).toMatchObject({
    hasNextPage: true,
    data: { pages: [0] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  // Set state
  expect(states[2]).toMatchObject({
    hasNextPage: true,
    data: { pages: [7, 8] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  // Refetch
  expect(states[3]).toMatchObject({
    hasNextPage: true,
    data: { pages: [7, 8] },
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  // Refetch done
  expect(states[4]).toMatchObject({
    hasNextPage: true,
    data: { pages: [7, 8] },
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });

  // react-query's version: refetching with a multiplier of 2 rebuilds the page params
  await advance(app, 60);
  expect(app.texts()).toContain('data: {"pages":[14,30],"pageParams":[7,15]}');
});

test("should keep initialData visible alongside the error when a refetch fails", async () => {
  const app = await run("should keep initialData visible alongside the error when a refetch fails");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: { pages: [1] }, isError: false });
  expect(states[1]).toMatchObject({ data: { pages: [1] }, isError: true });
});

test("should not fetch when queryFn is skipToken, and fetch once it is replaced", async () => {
  const app = await run("should not fetch when queryFn is skipToken, and fetch once it is replaced");
  expect(app.texts()).toContain("isFetching: false");
  await advance(app, 10);
  expect(logs(app)).toEqual([]);
  expect(app.texts()).toContain("isFetching: false");
  expect(app.texts()).toContain("pages: none");

  await app.press("set postId");
  await advance(app, 10);
  expect(logs(app)).toEqual([{ calls: 1 }]);
  expect(app.texts()).toContain("pages: comments for 1 page 0");
});

test("should only refetch the first page when initialData is provided", async () => {
  const app = await run("should only refetch the first page when initialData is provided");
  await advance(app, 30);
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({
    data: { pages: [1] },
    hasNextPage: true,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  expect(states[1]).toMatchObject({
    data: { pages: [1] },
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  expect(states[2]).toMatchObject({
    data: { pages: [1] },
    hasNextPage: true,
    isFetching: true,
    isFetchingNextPage: true,
    isSuccess: true,
  });
  expect(states[3]).toMatchObject({
    data: { pages: [1, 2] },
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
});

test("should set hasNextPage to false if getNextPageParam returns undefined", async () => {
  const app = await run("should set hasNextPage to false if getNextPageParam returns undefined");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({
    data: undefined,
    hasNextPage: false,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: false,
  });
  expect(states[1]).toMatchObject({
    data: { pages: [1] },
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
});

test("should compute hasNextPage correctly using initialData", async () => {
  const app = await run("should compute hasNextPage correctly using initialData");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({
    data: { pages: [10] },
    hasNextPage: true,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  expect(states[1]).toMatchObject({
    data: { pages: [10] },
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
});

test("should compute hasNextPage correctly for falsy getFetchMore return value using initialData", async () => {
  const app = await run("should compute hasNextPage correctly for falsy getFetchMore return value using initialData");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({
    data: { pages: [10] },
    hasNextPage: false,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: true,
  });
  expect(states[1]).toMatchObject({
    data: { pages: [10] },
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
});

test("should not use selected data when computing hasNextPage", async () => {
  const app = await run("should not use selected data when computing hasNextPage");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({
    data: undefined,
    hasNextPage: false,
    isFetching: true,
    isFetchingNextPage: false,
    isSuccess: false,
  });
  expect(states[1]).toMatchObject({
    data: { pages: ["1"] },
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    isSuccess: true,
  });
});

test("should build fresh cursors on refetch", async () => {
  const app = await run("should build fresh cursors on refetch");
  expect(app.texts()).toContain("Loading...");
  await advance(app, 10);
  expect(app.texts()).toContain("Item: 2");
  expect(app.texts()).toContain("Page 0: 0");

  await app.press("Load More");
  expect(app.texts()).toContain("Loading more...");
  await advance(app, 10);
  expect(app.texts()).toContain("Item: 5");
  expect(app.texts()).toContain("Page 0: 0");
  expect(app.texts()).toContain("Page 1: 1");

  await app.press("Load More");
  expect(app.texts()).toContain("Loading more...");
  await advance(app, 10);
  expect(app.texts()).toContain("Item: 8");
  expect(app.texts()).toContain("Page 0: 0");
  expect(app.texts()).toContain("Page 1: 1");
  expect(app.texts()).toContain("Page 2: 2");

  await app.press("Refetch");
  expect(app.texts()).toContain("Background Updating...");
  await advance(app, 30);
  expect(app.texts()).toContain("Item: 8");
  expect(app.texts()).toContain("Page 0: 3");
  expect(app.texts()).toContain("Page 1: 4");
  expect(app.texts()).toContain("Page 2: 5");

  // ensure that Item: 4 is rendered before removing it
  expect(app.texts().filter((text) => text === "Item: 4")).toHaveLength(1);

  // remove Item: 4
  await app.press("Remove item");
  expect(app.texts()).toContain("Background Updating...");
  // ensure that an additional item is rendered (it means that cursors were properly rebuilt)
  await advance(app, 30);
  expect(app.texts()).toContain("Item: 9");
  expect(app.texts()).toContain("Page 0: 6");
  expect(app.texts()).toContain("Page 1: 7");
  expect(app.texts()).toContain("Page 2: 8");

  // ensure that Item: 4 is no longer rendered
  expect(app.texts().filter((text) => text === "Item: 4")).toHaveLength(0);
});

test("should compute hasNextPage correctly for falsy getFetchMore return value on refetching", async () => {
  const app = await run("should compute hasNextPage correctly for falsy getFetchMore return value on refetching");
  expect(app.texts()).toContain("Loading...");
  await advance(app, 10);
  expect(app.texts()).toContain("Item: 9");
  expect(app.texts()).toContain("Page 0: 0");

  await app.press("Load More");
  expect(app.texts()).toContain("Loading more...");
  await advance(app, 10);
  expect(app.texts()).toContain("Item: 19");
  expect(app.texts()).toContain("Page 0: 0");
  expect(app.texts()).toContain("Page 1: 1");

  await app.press("Load More");
  expect(app.texts()).toContain("Loading more...");
  await advance(app, 10);
  expect(app.texts()).toContain("Item: 29");
  expect(app.texts()).toContain("Page 0: 0");
  expect(app.texts()).toContain("Page 1: 1");
  expect(app.texts()).toContain("Page 2: 2");
  expect(app.texts()).toContain("Nothing more to load");

  await app.press("Remove Last Page");
  await app.press("Refetch");
  expect(app.texts()).toContain("Background Updating...");
  await advance(app, 20);
  expect(app.texts()).toContain("Page 0: 3");
  expect(app.texts()).toContain("Page 1: 4");
  expect(app.texts()).toContain("Nothing more to load");
  expect(app.texts()).not.toContain("Item: 29");
  expect(app.texts()).not.toContain("Page 2: 5");
});

test("should cancel the query function when there are no more subscriptions", async () => {
  const app = await run("should cancel the query function when there are no more subscriptions");
  expect(app.texts()).toContain("Status: pending");
  await advance(app, 5);
  expect(app.texts()).toContain("off");
  expect(logs(app)).toEqual([{ abort: "abort" }]);
});

test("should use provided custom queryClient", async () => {
  const app = await run("should use provided custom queryClient");
  await advance(app, 10);
  expect(app.texts()).toContain("Status: custom client");
});

test("should work with infiniteQueryOptions", async () => {
  const app = await run("should work with infiniteQueryOptions");
  await advance(app, 10);
  expect(app.texts()).toContain("Status: 220");
});
