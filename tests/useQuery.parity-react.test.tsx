import { expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useQuery/parity-react.tsx";
const run = (name: string) => openScenario(entry, name);

// The StrictMode variant is React-only; this is the non-strict case.
test("should stay idle after a cancelled retry delay (StrictMode: %s)", async () => {
  const app = await run("should stay idle after a cancelled retry delay (StrictMode: %s)");
  await advance(app, 0);
  await app.press("cancel");
  await advance(app, 1);
  expect(app.texts()).toContain("fetchStatus: idle");
  await app.setLifecycle("background");
  await advance(app, 100);
  expect(app.texts()).toContain("fetchStatus: idle");
});

test("should not get into an infinite loop when removing a query with gcTime 0 and rerendering", async () => {
  const app = await run("should not get into an infinite loop when removing a query with gcTime 0 and rerendering");
  await advance(app, 6);
  expect(app.texts()).toContain("data");
  await app.press("remove");
  await advance(app, 6);
  expect(app.texts()).toContain("data");
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ isPending: true, isSuccess: false, data: undefined });
  expect(states[1]).toMatchObject({ isPending: false, isSuccess: true, data: "data" });
  expect(states[2]).toMatchObject({ isPending: true, isSuccess: false, data: undefined });
  expect(states[3]).toMatchObject({ isPending: false, isSuccess: true, data: "data" });
});

test("should be able to select a part of the data with select in object syntax", async () => {
  const app = await run("should be able to select a part of the data with select in object syntax");
  await advance(app, 0);
  expect(app.texts()).toContain("test");
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ data: "test" });
});

test("should not re-run a stable select when it re-renders if selector throws an error", async () => {
  const app = await run("should not re-run a stable select when it re-renders if selector throws an error");
  const runs = async () => {
    await app.press("report");
    return logs(app).at(-1).runs;
  };
  await advance(app, 0);
  expect(app.texts()).toContain("error: Select Error");
  expect(await runs()).toBe(1);
  await app.press("rerender");
  await advance(app, 0);
  expect(await runs()).toBe(1);
  await app.press("refetch");
  await advance(app, 0);
  expect(await runs()).toBe(2);
});

test("should be able to remove a query", async () => {
  const app = await run("should be able to remove a query");
  await advance(app, 0);
  expect(app.texts()).toContain("data: 1");
  await app.press("remove");
  await advance(app, 0);
  await app.press("rerender");
  await advance(app, 0);
  expect(app.texts()).toContain("data: 2");
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ status: "pending", data: undefined });
  expect(states[1]).toMatchObject({ status: "success", data: 1 });
  expect(states[2]).toMatchObject({ status: "pending", data: undefined });
  expect(states[3]).toMatchObject({ status: "success", data: 2 });
});

test("should create a new query when refetching a removed query", async () => {
  const app = await run("should create a new query when refetching a removed query");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 1");
  await app.press("remove");
  await app.press("refetch");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 2");
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ data: undefined, dataUpdatedAt: 0 });
  expect(states[1]).toMatchObject({ data: 1 });
  expect(states[2]).toMatchObject({ data: undefined, dataUpdatedAt: 0 });
  expect(states[3]).toMatchObject({ data: 2 });
});

test("should not update disabled query when refetching with refetchQueries", async () => {
  const app = await run("should not update disabled query when refetching with refetchQueries");
  await advance(app, 31);
  const states = logs(app);
  expect(states).toHaveLength(1);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: false, isSuccess: false, isStale: false });
});

test("should keep the previous data when placeholderData is set and select fn transform is used", async () => {
  const app = await run("should keep the previous data when placeholderData is set and select fn transform is used");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("setCount");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 1");
  const states = logs(app);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, isSuccess: false, isPlaceholderData: false });
  expect(states[1]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: false });
  expect(states[2]).toMatchObject({ data: 0, isFetching: true, isSuccess: true, isPlaceholderData: true });
  expect(states[3]).toMatchObject({ data: 1, isFetching: false, isSuccess: true, isPlaceholderData: false });
});

test("should keep the previous queryKey (from prevQuery) between multiple pending queries when placeholderData is set and select fn transform is used", async () => {
  const app = await run(
    "should keep the previous queryKey (from prevQuery) between multiple pending queries when placeholderData is set and select fn transform is used",
  );
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("setCount");
  await app.press("setCount");
  await app.press("setCount");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 3");
  const [first, ...rest] = logs(app);
  const keys = rest.map((entry) => entry.prevKey);
  expect(keys.length).toBeGreaterThan(0);
  expect(keys.every((k) => JSON.stringify(k) === JSON.stringify([first.key, 0]))).toBe(true);
});

test("should show placeholderData between multiple pending queries when select fn transform is used", async () => {
  const app = await run("should show placeholderData between multiple pending queries when select fn transform is used");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("setCount");
  await app.press("setCount");
  await app.press("setCount");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 3");
  const states = logs(app);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, isSuccess: false, isPlaceholderData: false });
  expect(states[1]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: false });
  // React renders three equal states (count = 1, 2, 3); the result here only
  // changes once, so the sequence of distinct states is compared.
  expect(states).toHaveLength(4);
  expect(states[2]).toMatchObject({ data: 0, isFetching: true, isSuccess: true, isPlaceholderData: true });
  expect(states[3]).toMatchObject({ data: 3, isFetching: false, isSuccess: true, isPlaceholderData: false });
});

test("should transition to error state when placeholderData is set", async () => {
  const app = await run("should transition to error state when placeholderData is set");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("next");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 1");
  await app.press("next");
  await advance(app, 11);
  expect(app.texts()).toContain("error: Error test");
  const states = logs(app);
  expect(states).toHaveLength(6);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, status: "pending", error: null, isPlaceholderData: false });
  expect(states[1]).toMatchObject({ data: 0, isFetching: false, status: "success", error: null, isPlaceholderData: false });
  expect(states[2]).toMatchObject({ data: 0, isFetching: true, status: "success", error: null, isPlaceholderData: true });
  expect(states[3]).toMatchObject({ data: 1, isFetching: false, status: "success", error: null, isPlaceholderData: false });
  expect(states[4]).toMatchObject({ data: 1, isFetching: true, status: "success", error: null, isPlaceholderData: true });
  expect(states[5]).toMatchObject({ data: undefined, isFetching: false, status: "error", isPlaceholderData: false });
  expect(states[5].error).toEqual({ $error: "Error test" });
});

test("should keep the previous data on disabled query when placeholderData is set", async () => {
  const app = await run("should keep the previous data on disabled query when placeholderData is set");
  expect(app.texts()).toContain("data: undefined");
  await app.press("refetch");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("setCount");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("refetch");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 1");
  const states = logs(app);
  expect(states).toHaveLength(6);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: false, isSuccess: false, isPlaceholderData: false });
  expect(states[1]).toMatchObject({ data: undefined, isFetching: true, isSuccess: false, isPlaceholderData: false });
  expect(states[2]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: false });
  expect(states[3]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: true });
  expect(states[4]).toMatchObject({ data: 0, isFetching: true, isSuccess: true, isPlaceholderData: true });
  expect(states[5]).toMatchObject({ data: 1, isFetching: false, isSuccess: true, isPlaceholderData: false });
});

test("should re-render disabled observers when other observers trigger a query (#8741)", async () => {
  const app = await run("should re-render disabled observers when other observers trigger a query (#8741)");
  expect(app.texts()).toContain("User fetching status is idle");
  await app.press("Set ID and trigger user load");
  await advance(app, 0);
  expect(app.texts()).toContain("User fetching status is fetching");
  await advance(app, 11);
  expect(app.texts()).toContain('UserInfo data is {"id":42,"name":"user"} ');
  expect(app.texts()).toContain("User fetching status is idle");
});

test("should not re-render when change props are not actively being tracked", async () => {
  const app = await run("should not re-render when change props are not actively being tracked");
  await advance(app, 6);
  expect(app.texts()).toContain("fetch counter: 1");
  let states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, status: "pending" });
  expect(states[1]).toMatchObject({ data: "fetch counter: 1", status: "success", isFetching: false });

  await app.press("disableTracking");
  await app.press("refetch");
  await advance(app, 20);
  expect(logs(app)).toHaveLength(2);

  await app.press("enableTracking");
  await app.press("refetch");
  await advance(app, 6);
  expect(app.texts()).toContain("fetch counter: 3");
  await advance(app, 20);
  states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[2]).toMatchObject({ data: "fetch counter: 2", status: "success", isFetching: true });
  expect(states[3]).toMatchObject({ data: "fetch counter: 3", status: "success", isFetching: false });
});

// The error is thrown where `data` is read, as in solid-query: a component that
// reads only `status` shows the error status instead of reaching the boundary.
test("should throw error if queryFn rejects with a falsy error and throwOnError is in use", async () => {
  const app = await run("should throw error if queryFn rejects with a falsy error and throwOnError is in use");
  await advance(app, 0);
  expect(app.texts()).toContain("data boundary");
  expect(app.texts()).not.toContain("status boundary");
  expect(app.texts()).toContain("status: error");
});

test("should reset failureCount on successful fetch", async () => {
  const app = await run("should reset failureCount on successful fetch");
  await advance(app, 11);
  expect(app.texts()).toContain("failureCount 2");
  expect(app.texts()).toContain("failureReason error");
  await advance(app, 11);
  expect(app.texts()).toContain("failureCount 0");
  expect(app.texts()).toContain("failureReason null");
});

test("should show the correct data when switching keys with initialData, placeholderData & staleTime", async () => {
  const app = await run("should show the correct data when switching keys with initialData, placeholderData & staleTime");
  expect(app.texts()).toContain("Current Todos, filter: all");
  await app.press("High");
  await advance(app, 0);
  expect(app.texts()).toContain("Current Todos, filter: high");
  await app.press("All");
  await advance(app, 0);
  expect(app.texts()).toContain("todo B - medium");
});
