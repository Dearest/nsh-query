import { expect, test } from "nsh/test";
import type { App } from "nsh/test";
import { advance, error, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useQuery/parity-react-b.tsx";
const run = (name: string) => openScenario(entry, name);

/** Presses "report" and returns what it logged. */
async function report(app: App) {
  await app.press("report");
  return logs(app).at(-1);
}

/** How many times upstream's spy was called: the scenario logs `{ spy: data }` each time data changes. */
const spyCalls = (app: App) => logs(app).length;

test("should only run select when dependencies change if memoized", async () => {
  const app = await run("should only run select when dependencies change if memoized");
  expect(app.texts()).toContain("Data: selected 101");
  expect((await report(app)).selectRun).toBe(1);
  await advance(app, 11);
  expect(app.texts()).toContain("Data: selected 2");
  expect((await report(app)).selectRun).toBe(2);
  await app.press("inc");
  await advance(app, 11);
  expect(app.texts()).toContain("Data: selected 3");
  expect((await report(app)).selectRun).toBe(3);
});

// React counts renders; here the options run once per change of what they read,
// and the hash function runs once each time.
test("should only call the query hash function once each render", async () => {
  const app = await run("should only call the query hash function once each render");
  await advance(app, 0);
  expect(app.texts()).toContain("data: test");
  expect(await report(app)).toEqual({ hashes: 1, evaluations: 1 });
  await app.press("rerender");
  await advance(app, 0);
  expect(await report(app)).toEqual({ hashes: 2, evaluations: 2 });
});

test("should hash query keys that contain bigints given a supported query hash function", async () => {
  const app = await run("should hash query keys that contain bigints given a supported query hash function");
  await advance(app, 0);
  expect((await report(app)).data).toBe("test");
});

test("should be notified of updates between create and subscribe", async () => {
  const app = await run("should be notified of updates between create and subscribe");
  await advance(app, 11);
  expect(app.texts()).toContain("status: success");
  expect(app.texts()).toContain("data: 1");
});

test("should reuse same data object reference when queryKey changes back to some cached data", async () => {
  const app = await run("should reuse same data object reference when queryKey changes back to some cached data");
  let seen = spyCalls(app);
  expect(seen).toBe(1);
  const callsSince = () => {
    const calls = spyCalls(app) - seen;
    seen = spyCalls(app);
    return calls;
  };
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 1");
  expect(callsSince()).toBe(1);
  await app.press("id 2");
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 2");
  expect(callsSince()).toBe(2); // called with undefined because id changed
  await app.press("id 1");
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 1");
  expect(callsSince()).toBe(1);
  await app.press("id 2");
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 2");
  expect(callsSince()).toBe(1);
});

test("should reuse same data object reference when queryKey changes and placeholderData is present", async () => {
  const app = await run("should reuse same data object reference when queryKey changes and placeholderData is present");
  let seen = spyCalls(app);
  expect(seen).toBe(1);
  const callsSince = () => {
    const calls = spyCalls(app) - seen;
    seen = spyCalls(app);
    return calls;
  };
  expect(app.texts()).toContain("Rendered Id: 99");
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 1");
  expect(callsSince()).toBe(1);
  await app.press("id 2");
  expect(app.texts()).toContain("Rendered Id: 99");
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 2");
  expect(callsSince()).toBe(2); // called with the placeholder because id changed
  await app.press("id 1");
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 1");
  expect(callsSince()).toBe(1);
  await app.press("id 2");
  await advance(app, 6);
  expect(app.texts()).toContain("Rendered Id: 2");
  expect(callsSince()).toBe(1);
});

test("should not cause an infinite render loop when using unstable callback ref", async () => {
  const app = await run("should not cause an infinite render loop when using unstable callback ref");
  await advance(app, 6);
  expect(app.texts()).toContain("Works");
});

test("should keep the previous data when placeholderData is set and cache is used", async () => {
  const app = await run("should keep the previous data when placeholderData is set and cache is used");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("setCount");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 1");
  await app.press("setCount");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 0");
  await app.press("setCount");
  await advance(app, 11);
  expect(app.texts()).toContain("data: 2");
  const states = logs(app);
  expect(states).toHaveLength(7);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true, isSuccess: false, isPlaceholderData: false });
  expect(states[1]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: false });
  expect(states[2]).toMatchObject({ data: 0, isFetching: true, isSuccess: true, isPlaceholderData: true });
  expect(states[3]).toMatchObject({ data: 1, isFetching: false, isSuccess: true, isPlaceholderData: false });
  expect(states[4]).toMatchObject({ data: 0, isFetching: false, isSuccess: true, isPlaceholderData: false });
  expect(states[5]).toMatchObject({ data: 0, isFetching: true, isSuccess: true, isPlaceholderData: true });
  expect(states[6]).toMatchObject({ data: 2, isFetching: false, isSuccess: true, isPlaceholderData: false });
});

test("should throw in case of bad arguments to enhance DevX", async () => {
  const app = await run("should throw in case of bad arguments to enhance DevX");
  const thrown = app.texts().find((text) => text.startsWith("thrown: "));
  expect(thrown?.startsWith("thrown: Bad argument type")).toBe(true);
  expect(app.texts()).not.toContain("Does not matter");
});

test("should respect skipToken and refetch when skipToken is taken away", async () => {
  const app = await run("should respect skipToken and refetch when skipToken is taken away");
  expect(app.texts()).toContain("status: pending");
  await app.press("enable");
  await advance(app, 11);
  expect(app.texts()).toContain("status: success");
  expect(app.texts()).toContain("data: data");
});

test("should allow enabled: true and queryFn: skipToken", async () => {
  const app = await run("should allow enabled: true and queryFn: skipToken");
  expect(app.texts()).toContain("status: pending, fetchStatus: idle");
});

test("should return correct optimistic result when fetching after error", async () => {
  const app = await run("should return correct optimistic result when fetching after error");
  await advance(app, 11);
  expect(app.texts()).toContain("status: error, idle");
  await app.press("toggle");
  await app.press("toggle");
  await advance(app, 11);
  expect(app.texts()).toContain("status: error, idle");
  const results = logs(app);
  expect(results).toHaveLength(4);
  expect(results[0]).toMatchObject({
    status: "pending",
    fetchStatus: "fetching",
    error: null,
    errorUpdatedAt: 0,
    errorUpdateCount: 0,
    isLoading: true,
    failureCount: 0,
    failureReason: null,
  });
  expect(results[1]).toMatchObject({
    status: "error",
    fetchStatus: "idle",
    error: error("oh no"),
    errorUpdateCount: 1,
    isLoading: false,
    failureCount: 1,
    failureReason: error("oh no"),
  });
  expect(results[1].errorUpdatedAt).toBeGreaterThan(0);
  expect(results[2]).toMatchObject({
    status: "pending",
    fetchStatus: "fetching",
    error: null,
    errorUpdateCount: 1,
    isLoading: true,
    failureCount: 0,
    failureReason: null,
  });
  expect(results[2].errorUpdatedAt).toBeGreaterThan(0);
  expect(results[3]).toMatchObject({
    status: "error",
    fetchStatus: "idle",
    error: error("oh no"),
    errorUpdateCount: 2,
    isLoading: false,
    failureCount: 1,
    failureReason: error("oh no"),
  });
  expect(results[3].errorUpdatedAt).toBeGreaterThan(0);
});

test("should retry on mount when throwOnError returns false", async () => {
  const app = await run("should retry on mount when throwOnError returns false");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect(app.texts()).toContain("error: Simulated 500 error");
  expect((await report(app)).fetchCount).toBe(1);
  await app.press("toggle");
  await app.press("toggle");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect((await report(app)).fetchCount).toBe(2);
});

test("should retry on mount when throwOnError returns false for a falsy error", async () => {
  const app = await run("should retry on mount when throwOnError returns false for a falsy error");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect((await report(app)).calls).toBe(1);
  await app.press("toggle");
  await app.press("toggle");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect((await report(app)).calls).toBe(2);
});

// react-query turns retryOnMount off once an error boundary has shown the error,
// until a QueryErrorResetBoundary resets it; nsh-query has no reset boundary, so
// the remounted component retries and the boundary shows the new error.
test("should not retry on mount when throwOnError function returns true", async () => {
  const app = await run("should not retry on mount when throwOnError function returns true");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect(app.texts()).toContain("error: Simulated 500 error");
  expect(app.texts().some((text) => text.startsWith("data: "))).toBe(false);
  expect((await report(app)).fetchCount).toBe(1);
  await app.press("toggle");
  await app.press("toggle");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect((await report(app)).fetchCount).toBe(2);
  expect(app.texts()).toContain("error: Simulated 500 error");
  expect(app.texts().some((text) => text.startsWith("data: "))).toBe(false);
});

test("should handle throwOnError function based on actual error state", async () => {
  const app = await run("should handle throwOnError function based on actual error state");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect(app.texts()).toContain("error: Simulated 500 error");
  expect((await report(app)).fetchCount).toBe(1);
  await app.press("toggle");
  await app.press("toggle");
  await advance(app, 0);
  expect(app.texts()).toContain("status: error");
  expect((await report(app)).fetchCount).toBe(2);
});

test("should pass the query to retryOnMount callback", async () => {
  const app = await run("should pass the query to retryOnMount callback");
  await advance(app, 0);
  expect(app.texts()).toContain("error");
  await app.press("toggle");
  await app.press("toggle");
  await advance(app, 0);
  const calls = logs(app).filter((entry) => "retryOnMount" in entry);
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.at(-1).retryOnMount).toEqual({ isCachedQuery: true, status: "error", data: undefined });
  expect((await report(app)).queryFnCalls).toBe(1);
});

test("should not call retryOnMount callback when the query has data", async () => {
  const app = await run("should not call retryOnMount callback when the query has data");
  await advance(app, 11);
  expect(app.texts()).toContain("data");
  await app.press("refetch");
  await advance(app, 11);
  expect(app.texts()).toContain("data");
  expect(app.texts()).toContain("oops");
  await app.press("toggle");
  await app.press("toggle");
  await advance(app, 11);
  expect(await report(app)).toEqual({ queryFnCalls: 3, retryOnMountCalls: 0 });
});

test("should not fetch for the duration of the restoring period when isRestoring is true", async () => {
  const app = await run("should not fetch for the duration of the restoring period when isRestoring is true");
  const expectIdle = async () => {
    expect(app.texts()).toContain("status: pending");
    expect(app.texts()).toContain("fetchStatus: idle");
    expect(app.texts()).toContain("data: undefined");
    expect((await report(app)).queryFnCalls).toBe(0);
  };
  await advance(app, 0);
  await expectIdle();
  await advance(app, 11);
  await expectIdle();
});

test("should not loop when a query with select and keepPreviousData is disabled", async () => {
  const app = await run("should not loop when a query with select and keepPreviousData is disabled");
  await advance(app, 0);
  expect(app.texts()).toContain("picked: a");
  await app.press("text:picked: a");
  await advance(app, 0);
  expect(app.texts()).toContain("picked: none");
});

test("should settle as placeholder data when select maps keepPreviousData to undefined", async () => {
  const app = await run("should settle as placeholder data when select maps keepPreviousData to undefined");
  await advance(app, 0);
  expect(app.texts()).toContain("status: success");
  await app.press("text:status: success");
  await advance(app, 0);
  expect(logs(app).at(-1)).toMatchObject({ status: "success", isPlaceholderData: true, data: undefined });
});
