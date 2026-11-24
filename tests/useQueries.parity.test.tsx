import { expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useQueries/parity.tsx";
const run = (name: string) => openScenario(entry, name);

for (const [title, throws] of [
  ["should settle after fetched data reaches an inline selector (throws: false)", false],
  ["should settle after fetched data reaches an inline selector (throws: true)", true],
] as const) {
  test(title, async () => {
    const app = await run(title);
    expect(app.texts()).toContain("pending");
    for (let i = 0; i < 3; i++) await advance(app, 5);
    expect(app.texts()).toContain(throws ? "fetched with a select error" : "fetched");
    await app.press("report");
    const settled = logs(app)[0].renders;

    for (let i = 0; i < 3; i++) await advance(app, 5);
    await app.press("report");
    expect(logs(app)[1]).toEqual({ renders: settled });
  });
}

test("should return the correct states", async () => {
  const app = await run("should return the correct states");
  await advance(app, 100);
  expect(app.texts()).toContain("data1: 1, data2: 2");
  const results = logs(app);
  expect(results).toHaveLength(3);
  expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }]);
  expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }]);
  expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }]);
});

test("should not change state if unmounted", async () => {
  const app = await run("should not change state if unmounted");
  expect(logs(app)).toEqual([{ state: "pending" }]);

  await app.press("unmount");
  await app.press("report");
  expect(logs(app)[1]).toEqual({ queryStatus: "pending" });

  await advance(app, 20);
  await app.press("report");
  expect(logs(app)[2]).toEqual({ queryStatus: "success" });
  expect(logs(app).filter((line) => "state" in line)).toEqual([{ state: "pending" }]);
});

test("should use provided custom queryClient", async () => {
  const app = await run("should use provided custom queryClient");
  await advance(app, 10);
  expect(app.texts()).toContain("data: custom client");
});

const restoring = [
  "status1: pending",
  "status2: pending",
  "fetchStatus1: idle",
  "fetchStatus2: idle",
  "data1: undefined",
  "data2: undefined",
];

test("should not fetch for the duration of the restoring period when isRestoring is true", async () => {
  const app = await run("should not fetch for the duration of the restoring period when isRestoring is true");
  await advance(app, 0);
  for (const text of restoring) expect(app.texts()).toContain(text);
  expect(logs(app)).toEqual([]);
  await advance(app, 10);
  for (const text of restoring) expect(app.texts()).toContain(text);
  expect(logs(app)).toEqual([]);
});

test("should not fetch queries with different durations for the duration of the restoring period when isRestoring is true", async () => {
  const app = await run(
    "should not fetch queries with different durations for the duration of the restoring period when isRestoring is true",
  );
  await advance(app, 0);
  for (const text of restoring) expect(app.texts()).toContain(text);
  expect(logs(app)).toEqual([]);
  await advance(app, 11);
  for (const text of restoring) expect(app.texts()).toContain(text);
  expect(logs(app)).toEqual([]);
  await advance(app, 10);
  for (const text of restoring) expect(app.texts()).toContain(text);
  expect(logs(app)).toEqual([]);
});

test("should track results", async () => {
  const app = await run("should track results");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1");
  expect(logs(app)).toEqual([{ data: undefined }, { data: 1 }]);

  await app.press("refetch");
  await advance(app, 10);
  expect(app.texts()).toContain("data: 2");
  // only one run for the data update, none for the isFetching transition
  expect(logs(app)).toEqual([{ data: undefined }, { data: 1 }, { data: 2 }]);
});

test("should throw error if in one of queries' queryFn throws and throwOnError is in use", async () => {
  const app = await run("should throw error if in one of queries' queryFn throws and throwOnError is in use");
  await advance(app, 0);
  expect(app.texts()).toContain("error boundary");
  expect(app.texts()).toContain("single query error");
});

test("should throw error if in one of queries' queryFn throws and throwOnError function resolves to true", async () => {
  const app = await run(
    "should throw error if in one of queries' queryFn throws and throwOnError function resolves to true",
  );
  await advance(app, 0);
  expect(app.texts()).toContain("error boundary");
  expect(app.texts()).toContain("single query error");
});

test("should throw error if in one of queries' queryFn rejects with a falsy error and throwOnError is in use", async () => {
  const app = await run(
    "should throw error if in one of queries' queryFn rejects with a falsy error and throwOnError is in use",
  );
  await advance(app, 0);
  expect(app.texts()).toContain("error boundary");
});

test("should combine queries", async () => {
  const app = await run("should combine queries");
  await advance(app, 0);
  expect(app.texts()).toContain("data: true first result,second result");
});

test("should not return new instances when called without queries", async () => {
  const app = await run("should not return new instances when called without queries");
  await advance(app, 0);
  expect(app.texts()).toContain('data: {"empty":"object"}');
  expect(app.texts()).toContain("count: 0");
  await app.press("report");
  expect(logs(app)).toEqual([{ resultChanged: 1 }]);

  await app.press("inc");
  await advance(app, 0);
  expect(app.texts()).toContain("count: 1");
  // no further effect runs because the returned object is structurally shared
  await app.press("report");
  expect(logs(app)).toEqual([{ resultChanged: 1 }, { resultChanged: 1 }]);
});

test("should not have infinite render loops with empty queries (#6645)", async () => {
  const app = await run("should not have infinite render loops with empty queries (#6645)");
  expect(app.texts()).toContain("data: []");
  await app.press("report");
  expect(logs(app)).toEqual([{ renderCount: 1 }]);
});

test("should only call combine with query results", async () => {
  const app = await run("should only call combine with query results");
  await advance(app, 21);
  expect(app.texts()).toContain('data: {"data":{"query1":"query1","query2":"query2"}}');
});

test("should track property access through combine function", async () => {
  const app = await run("should track property access through combine function");
  await advance(app, 50);
  expect(app.texts()).toContain("data: true first result 0,second result 0");

  const results = logs(app);
  expect(results).toHaveLength(3);
  expect(results[0]).toEqual({ combined: true, refetch: "[Function]", res: "" });
  expect(results[1]).toEqual({ combined: true, refetch: "[Function]", res: "first result 0" });
  expect(results[2]).toEqual({ combined: true, refetch: "[Function]", res: "first result 0,second result 0" });

  await app.press("count");
  await app.press("refetch");
  await advance(app, 50);
  expect(app.texts()).toContain("data: true first result 1,second result 1");

  const length = logs(app).length;
  expect([4, 5, 6]).toContain(length);
  expect(logs(app)[length - 1]).toEqual({
    combined: true,
    refetch: "[Function]",
    res: "first result 1,second result 1",
  });

  await app.press("refetch");
  await advance(app, 100);
  // no further run because data didn't change
  expect(logs(app)).toHaveLength(length);
});

test("should synchronously track properties of all observer even if a property (isLoading) is only accessed on one observer (#7000)", async () => {
  const app = await run(
    "should synchronously track properties of all observer even if a property (isLoading) is only accessed on one observer (#7000)",
  );
  expect(app.texts()).toContain("Loading Status: Loading...");
  await advance(app, 10);
  expect(app.texts()).toContain("Loading Status: Loaded");
});

test("should not have stale closures with combine (#6648)", async () => {
  const app = await run("should not have stale closures with combine (#6648)");
  await advance(app, 0);
  expect(app.texts()).toContain("data: 0 result");

  await app.press("inc");
  await advance(app, 0);
  expect(app.texts()).toContain("data: 1 result");
});

const spy = async (app: Awaited<ReturnType<typeof run>>) => {
  await app.press("report");
  return logs(app).at(-1).spy as number;
};

test("should optimize combine if it is a stable reference", async () => {
  const app = await run("should optimize combine if it is a stable reference");
  await advance(app, 20);
  expect(app.texts()).toContain("data: true first result:0,second result:0");
  // both pending, one pending, both resolved
  expect(await spy(app)).toBe(3);

  await app.press("refetchQueries");
  await advance(app, 20);
  // no increase because result hasn't changed
  expect(await spy(app)).toBe(3);

  await app.press("rerender");
  // one extra call due to recomputing the combined result on rerender
  expect(await spy(app)).toBe(4);

  await app.press("value");
  await app.press("refetchQueries");
  await advance(app, 20);
  expect(app.texts()).toContain("data: true first result:1,second result:1");
  // refetch with new values triggers: both pending -> one pending -> both resolved
  expect(await spy(app)).toBe(7);
});

test("should re-run combine if the functional reference changes", async () => {
  const app = await run("should re-run combine if the functional reference changes");
  await advance(app, 20);
  expect(app.texts()).toContain("data: 0 first result,second result");
  // both pending, one pending, both resolved
  expect(await spy(app)).toBe(3);

  await app.press("rerender");
  // state changed, re-run combine
  expect(await spy(app)).toBe(4);
});

test("should not re-render if combine returns a stable reference", async () => {
  const app = await run("should not re-render if combine returns a stable reference");
  await advance(app, 20);
  expect(app.texts()).toContain("data: foo");
  await app.press("report");
  expect(logs(app)).toEqual([{ queryFns: ["first result", "second result"], renders: 1 }]);
});

test("should re-render once combine returns a different reference", async () => {
  const app = await run("should re-render once combine returns a different reference");
  await advance(app, 0);
  expect(app.texts()).toContain("data: pending");
  await advance(app, 20);
  expect(app.texts()).toContain("data: foo");
  // one with pending, one with foo
  await app.press("report");
  expect(logs(app)).toEqual([{ renders: 2 }]);
});

test("should track properties correctly with combine", async () => {
  const app = await run("should track properties correctly with combine");
  await advance(app, 0);
  expect(app.texts()).toContain("data: pending");
  await advance(app, 20);
  expect(app.texts()).toContain("data: first result, second result, third result");

  await app.press("update");
  await advance(app, 20);
  expect(app.texts()).toContain("data: first result updated, second result, third result");
});

test("should not re-run stable combine on unrelated re-render", async () => {
  const app = await run("should not re-run stable combine on unrelated re-render");
  await advance(app, 20);
  expect(app.texts()).toContain("data: true first result,second result");
  // initial runs: both pending, one pending, both resolved
  expect(await spy(app)).toBe(3);

  await app.press("increment");
  expect(app.texts()).toContain("unrelated: 1");
  // combine should NOT re-run for unrelated re-render with stable reference
  expect(await spy(app)).toBe(3);

  await app.press("increment");
  expect(app.texts()).toContain("unrelated: 2");
  // still no extra calls to combine
  expect(await spy(app)).toBe(3);
});

test("should not cause infinite re-renders when removing last query", async () => {
  const app = await run("should not cause infinite re-renders when removing last query");
  await advance(app, 0);
  await app.press("report");

  await app.press("remove last");
  await advance(app, 100);
  await app.press("report");
  expect(logs(app)[1].renderCount).toBeLessThan(10);
  expect(app.texts()).toContain("queries: 1");

  await app.press("remove first");
  await advance(app, 100);
  await app.press("report");
  expect(logs(app)[2].renderCount).toBeLessThan(10);
  expect(app.texts()).toContain("queries: 1");
});

test("should return correct results when queries count changes with stable combine reference", async () => {
  const app = await run("should return correct results when queries count changes with stable combine reference");
  expect(app.texts()).toContain("n: 0");
  expect(app.texts()).toContain("length: 0");

  await app.press("Increase");
  await advance(app, 0);
  expect(app.texts()).toContain("n: 1");
  expect(app.texts()).toContain("length: 1");

  await app.press("Increase");
  await advance(app, 0);
  expect(app.texts()).toContain("n: 2");
  expect(app.texts()).toContain("length: 2");

  const results = logs(app);
  expect(results.length).toBeGreaterThan(0);
  for (const result of results) expect(result.length).toBe(result.n);
});
