import { expect, test } from "nsh/test";
import type { App } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useQuery/parity-solid-1b.tsx";
const run = (name: string) => openScenario(entry, name);

/** The app goes to the background and comes back: a window focus. */
async function refocus(app: App): Promise<void> {
  await app.setLifecycle("background");
  await app.setLifecycle("active");
}

test("should not override initial data in dependent queries", async () => {
  const app = await run("should not override initial data in dependent queries");
  expect(app.texts()).toContain("First Data: init");
  expect(app.texts()).toContain("Second Data: init");
  expect(app.texts()).toContain("First Status: success");
  expect(app.texts()).toContain("Second Status: success");
});

test("should update query options", async () => {
  const app = await run("should update query options");
  expect(logs(app)).toEqual([{ retryDelay: 20 }]);
});

test("should batch re-renders", async () => {
  const app = await run("should batch re-renders");
  await advance(app, 0);
  await app.press("count");
  // Since components are rendered once
  // There will only be one pass
  expect(logs(app).at(-1)).toMatchObject({ renders: 1 });

  await advance(app, 15);
  expect(app.texts()).toContain("data data");
  await app.press("count");
  // both observers' updates run the effect reading them once, not twice
  expect(logs(app).at(-1)).toEqual({ renders: 1, effectRuns: 2 });
});

test("should render latest data even if react has discarded certain renders", async () => {
  const app = await run("should render latest data even if react has discarded certain renders");
  await advance(app, 10);
  expect(app.texts()).toContain("new");
});

test("should start with status pending, fetchStatus idle if enabled is false", async () => {
  const app = await run("should start with status pending, fetchStatus idle if enabled is false");
  expect(app.texts()).toContain("First Status: pending, idle");
  expect(app.texts()).toContain("Second Status: pending, fetching");
  await advance(app, 10);
  expect(app.texts()).toContain("Second Status: success, idle");
});

test('should be in "pending" state by default', async () => {
  const app = await run('should be in "pending" state by default');
  expect(app.texts()).toContain("status: pending");
});

test("should not refetch query on focus when `enabled` is set to `false`", async () => {
  const app = await run("should not refetch query on focus when `enabled` is set to `false`");
  await advance(app, 10);
  expect(app.texts()).toContain("default");
  await refocus(app);
  await advance(app, 10);
  expect(logs(app)).toEqual([]);
});

for (const name of [
  "should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`",
  "should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false`",
  "should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`",
]) {
  test(name, async () => {
    const app = await run(name);
    // a focus while the first fetch runs (solid) and one after it (react)
    await refocus(app);
    await advance(app, 10);
    await refocus(app);
    await advance(app, 10);
    const states = logs(app);
    expect(states).toHaveLength(2);
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true });
    expect(states[1]).toMatchObject({ data: 0, isFetching: false });
  });
}

test("should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always`", async () => {
  const app = await run("should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always`");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 0, isFetching: false");
  await refocus(app);
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1, isFetching: false");
  const states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true });
  expect(states[1]).toMatchObject({ data: 0, isFetching: false });
  expect(states[2]).toMatchObject({ data: 0, isFetching: true });
  expect(states[3]).toMatchObject({ data: 1, isFetching: false });
});

test("should calculate focus behavior for refetchOnWindowFocus depending on function", async () => {
  const app = await run("should calculate focus behavior for refetchOnWindowFocus depending on function");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 0");
  let states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: undefined, isFetching: true });
  expect(states[1]).toMatchObject({ data: 0, isFetching: false });

  await refocus(app);
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");
  // refetch should happen
  states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[2]).toMatchObject({ data: 0, isFetching: true });
  expect(states[3]).toMatchObject({ data: 1, isFetching: false });

  await refocus(app);
  await advance(app, 20);
  // no more refetch now
  expect(logs(app)).toHaveLength(4);
});

test("should refetch fresh query when refetchOnMount is set to always", async () => {
  const app = await run("should refetch fresh query when refetchOnMount is set to always");
  await advance(app, 10);
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: "prefetched", isStale: false, isFetching: true });
  expect(states[1]).toMatchObject({ data: "data", isStale: false, isFetching: false });
});

test("should refetch stale query when refetchOnMount is set to true", async () => {
  const app = await run("should refetch stale query when refetchOnMount is set to true");
  await advance(app, 10);
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: "prefetched", isStale: true, isFetching: true });
  expect(states[1]).toMatchObject({ data: "data", isStale: true, isFetching: false });
});

test("should set status to error if queryFn throws", async () => {
  const app = await run("should set status to error if queryFn throws");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
  expect(app.texts()).toContain("Error test");
});

test("should throw error if queryFn throws and throwOnError is in use", async () => {
  const app = await run("should throw error if queryFn throws and throwOnError is in use");
  await advance(app, 10);
  expect(app.texts()).toContain("error boundary");
});

test("should throw error inside the same component if queryFn throws and throwOnError is in use", async () => {
  const app = await run("should throw error inside the same component if queryFn throws and throwOnError is in use");
  await advance(app, 10);
  expect(app.texts()).toContain("error boundary");
});

test("should throw error inside the same component if queryFn throws and show the correct error message", async () => {
  const app = await run(
    "should throw error inside the same component if queryFn throws and show the correct error message",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("Fallback error: Error test");
});

test("should show the correct error message on the error property when accessed outside error boundary", async () => {
  const app = await run(
    "should show the correct error message on the error property when accessed outside error boundary",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("Outside error boundary: Error test");
  expect(app.texts()).toContain("Fallback error: Error test");
});

test("should update with data if we observe no properties and throwOnError", async () => {
  const app = await run("should update with data if we observe no properties and throwOnError");
  await advance(app, 10);
  await app.press("read");
  expect(logs(app)).toEqual([{ data: "data", isFetching: 0 }]);
});

test("should set status to error instead of throwing when error should not be thrown", async () => {
  const app = await run("should set status to error instead of throwing when error should not be thrown");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
  expect(app.texts()).toContain("Local Error");
  expect(app.texts()).not.toContain("error boundary");
});

test("should throw error instead of setting status when error should be thrown", async () => {
  const app = await run("should throw error instead of setting status when error should be thrown");
  await advance(app, 10);
  expect(app.texts()).toContain("error boundary");
  expect(app.texts()).toContain("Remote Error");
});

const counts = (app: App) => logs(app).map((line) => line.count);

test("should continue retries when observers unmount and remount while waiting for a retry (#3031)", async () => {
  const name = "should continue retries when observers unmount and remount while waiting for a retry (#3031)";
  // solid's timing: hide and show at once, while waiting for the first retry
  const app = await run(name);
  await advance(app, 10);
  expect(app.texts()).toContain("failureCount: 1");
  expect(app.texts()).toContain("failureReason: some error");
  await app.press("hide");
  expect(app.texts()).toContain("show");
  await app.press("show");
  // Wait for retry delay and second attempt
  await advance(app, 100);
  await advance(app, 10);
  // Wait for third attempt
  await advance(app, 100);
  await advance(app, 10);
  expect(app.texts()).toContain("error: some error");
  expect(counts(app)).toEqual([1, 2, 3]);

  // react's timing: hidden while the retry is due, so the retry is dropped and
  // the remount fetches again (1 + 1 + 2 retries)
  const late = await run(name);
  await advance(late, 11);
  expect(late.texts()).toContain("failureCount: 1");
  await advance(late, 90);
  await late.press("hide");
  await advance(late, 11);
  expect(late.texts()).toContain("show");
  await late.press("show");
  await advance(late, 11);
  await advance(late, 110);
  await advance(late, 110);
  expect(late.texts()).toContain("error: some error");
  expect(counts(late)).toEqual([1, 2, 3, 4]);
});

test("should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031)", async () => {
  const app = await run(
    "should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031)",
  );
  await advance(app, 10);
  expect(app.texts()).toContain("failureCount: 1");
  expect(app.texts()).toContain("failureReason: some error");
  await app.press("hide");
  await app.press("cancel");
  expect(app.texts()).toContain("show");
  await advance(app, 1);
  await app.press("show");
  // Wait for new mount fetch
  await advance(app, 10);
  // Wait for first retry
  await advance(app, 100);
  await advance(app, 10);
  // Wait for second retry
  await advance(app, 100);
  await advance(app, 10);
  expect(app.texts()).toContain("error: some error");
  // initial fetch (1), which will be cancelled, followed by new mount(2) + 2 retries = 4
  expect(counts(app)).toEqual([1, 2, 3, 4]);
});

test("should always fetch if refetchOnMount is set to always", async () => {
  const app = await run("should always fetch if refetchOnMount is set to always");
  await advance(app, 10);
  await advance(app, 10);
  expect(app.texts()).toContain("data: data");
  await advance(app, 60);
  const states = logs(app);
  expect(states).toHaveLength(3);
  expect(states[0]).toMatchObject({ data: "prefetched", isStale: false, isFetching: true });
  expect(states[1]).toMatchObject({ data: "data", isStale: false, isFetching: false });
  expect(states[2]).toMatchObject({ data: "data", isStale: true, isFetching: false });
});

test("should fetch if initial data is set", async () => {
  const app = await run("should fetch if initial data is set");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: "initial", isStale: true, isFetching: true });
  expect(states[1]).toMatchObject({ data: "data", isStale: true, isFetching: false });
});

test("should keep initialData visible alongside the error when a refetch fails", async () => {
  const app = await run("should keep initialData visible alongside the error when a refetch fails");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: "initial", isError: false });
  expect(states[1]).toMatchObject({ data: "initial", isError: true });
});

test("should not fetch if initial data is set with a stale time", async () => {
  const app = await run("should not fetch if initial data is set with a stale time");
  await advance(app, 60);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: "initial", isStale: false, isFetching: false });
  expect(states[1]).toMatchObject({ data: "initial", isStale: true, isFetching: false });
});

test("should fetch if initial data updated at is older than stale time", async () => {
  const app = await run("should fetch if initial data updated at is older than stale time");
  await advance(app, 70);
  const states = logs(app);
  expect(states).toHaveLength(3);
  expect(states[0]).toMatchObject({ data: "initial", isStale: true, isFetching: true });
  expect(states[1]).toMatchObject({ data: "data", isStale: false, isFetching: false });
  expect(states[2]).toMatchObject({ data: "data", isStale: true, isFetching: false });
});

test('should fetch if "initial data updated at" is exactly 0', async () => {
  const app = await run('should fetch if "initial data updated at" is exactly 0');
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  expect(states[0]).toMatchObject({ data: "initial", isStale: true, isFetching: true });
  expect(states[1]).toMatchObject({ data: "data", isStale: false, isFetching: false });
});

test("should keep initial data when the query key changes", async () => {
  const app = await run("should keep initial data when the query key changes");
  await advance(app, 10);
  const states = logs(app);
  expect(states).toHaveLength(2);
  // Initial
  expect(states[0]).toMatchObject({ data: { count: 0 } });
  // Set state
  expect(states[1]).toMatchObject({ data: { count: 1 } });
});

test("should retry specified number of times", async () => {
  const app = await run("should retry specified number of times");
  await advance(app, 10);
  expect(app.texts()).toContain("pending");
  await advance(app, 10);
  expect(app.texts()).toContain("pending");
  expect(app.texts()).toContain("Failed 1 times");
  await advance(app, 10);
  expect(app.texts()).toContain("error");
  // query should fail `retry + 1` times, since first time isn't a "retry"
  expect(app.texts()).toContain("Failed 2 times");
  expect(app.texts()).toContain("Failed because Error test Barrett");
  expect(logs(app)).toEqual([{ calls: 1 }, { calls: 2 }]);
});
