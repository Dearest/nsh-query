import { describe, expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useMutationState/parity.tsx";
const run = (name: string) => openScenario(entry, name);

describe("useIsMutating", () => {
  const scenario = (name: string) => run(`useIsMutating › ${name}`);

  test("should return the number of fetching mutations", async () => {
    const app = await scenario("should return the number of fetching mutations");
    expect(app.texts()).toContain("mutating: 0");

    await app.press("mutate1");
    await advance(app, 10);
    expect(app.texts()).toContain("mutating: 1");

    await app.press("mutate2");
    await advance(app, 1);
    expect(app.texts()).toContain("mutating: 2");

    await advance(app, 10);
    expect(app.texts()).toContain("mutating: 1");

    await advance(app, 30);
    expect(app.texts()).toContain("mutating: 0");
  });

  test("should update when the query client is cleared", async () => {
    const app = await scenario("should update when the query client is cleared");
    await app.press("mutate");
    await advance(app, 1);
    expect(app.texts()).toContain("mutating: 1");

    await app.press("clear");
    await advance(app, 1);
    expect(logs(app)).toEqual([{ isMutating: 0 }]);
    expect(app.texts()).toContain("mutating: 0");

    await advance(app, 1000);
  });

  test("should filter correctly by mutationKey", async () => {
    const app = await scenario("should filter correctly by mutationKey");
    expect(app.texts()).toContain("mutating: 0");

    await app.press("start");
    await advance(app, 1);
    expect(app.texts()).toContain("mutating: 1");

    await advance(app, 100);
    expect(app.texts()).toContain("mutating: 0");
  });

  test("should filter correctly by predicate", async () => {
    const app = await scenario("should filter correctly by predicate");
    expect(app.texts()).toContain("mutating: 0");

    await app.press("start");
    await advance(app, 1);
    expect(app.texts()).toContain("mutating: 1");

    await advance(app, 100);
    expect(app.texts()).toContain("mutating: 0");
  });

  test("should use provided custom queryClient", async () => {
    const app = await scenario("should use provided custom queryClient");
    await advance(app, 0);
    expect(app.texts()).toContain("mutating: 1");
  });

  test("should update when filters change without a cache update", async () => {
    const app = await scenario("should update when filters change without a cache update");
    await advance(app, 0);
    expect(app.texts()).toContain("mutating: 1");

    await app.press("change");
    expect(app.texts()).toContain("mutating: 0");

    await advance(app, 100);
  });
});

describe("useMutationState", () => {
  const scenario = (name: string) => run(`useMutationState › ${name}`);

  test("should update when filters change without a cache update", async () => {
    const app = await scenario("should update when filters change without a cache update");
    const [first] = logs(app);
    const key1 = first.keys[0];
    expect(app.texts()).toContain(`keys: ${JSON.stringify([key1])}`);

    await app.press("second");
    const key2 = logs(app).at(-1).keys[0];
    expect(key2).not.toEqual(key1);
    expect(app.texts()).toContain(`keys: ${JSON.stringify([key2])}`);

    await app.press("unknown");
    expect(app.texts()).toContain("keys: []");
    expect(logs(app).every((entry) => entry.cacheEvents === 0)).toBe(true);
  });

  test("should update when select changes without a cache update", async () => {
    const app = await scenario("should update when select changes without a cache update");
    const text = app.texts().find((entry) => entry.startsWith("result: ["));
    expect(text).toMatch(/^result: \[\["query_\d+"\]\]$/);

    await app.press("by status");
    expect(app.texts()).toContain('result: ["idle"]');
  });

  test("should recompute object results on rerender with stable filters and select", async () => {
    const app = await scenario("should recompute object results on rerender with stable filters and select");
    expect(app.texts()).toContain('result: [{"time":0}]');

    await app.press("update");
    expect(app.texts()).toContain('result: [{"time":1000}]');
    expect(logs(app)).toEqual([{ sameState: true, cacheEvents: 0 }]);
  });

  test("should recompute Date results on rerender with stable filters and select", async () => {
    const app = await scenario("should recompute Date results on rerender with stable filters and select");
    expect(app.texts()).toContain('result: ["1970-01-01T00:00:00.000Z"]');

    await app.press("update");
    expect(app.texts()).toContain('result: ["1970-01-01T00:00:01.000Z"]');
    expect(logs(app)).toEqual([{ sameState: true, cacheEvents: 0 }]);
  });

  test("should render selector results that cannot be structurally shared", async () => {
    const app = await scenario("should render selector results that cannot be structurally shared");
    expect(app.texts()).toContain("date: 1970-01-01T00:00:00.000Z");

    await app.press("later");
    expect(app.texts()).toContain("date: 1970-01-01T00:00:01.000Z");
  });

  test("should update Date selector results when mutation state changes", async () => {
    const app = await scenario("should update Date selector results when mutation state changes");
    expect(app.texts()).toContain("dates: []");

    await app.press("mutate");
    await advance(app, 1);
    expect(app.texts()).toContain('dates: ["1970-01-01T00:00:00.000Z"]');

    await advance(app, 10);
    expect(app.texts()).toContain('dates: ["1970-01-01T00:00:01.000Z"]');
  });

  test("should update when only the mutation state changes", async () => {
    const app = await scenario("should update when only the mutation state changes");
    expect(app.texts()).toContain("statuses: []");

    await app.press("mutate");
    await advance(app, 1);
    expect(app.texts()).toContain('statuses: ["pending"]');

    await advance(app, 10);
    expect(app.texts()).toContain('statuses: ["success"]');
  });

  for (const title of [
    "should preserve the result reference with stable inputs",
    "should preserve the result reference with inline inputs",
  ]) {
    test(title, async () => {
      const app = await scenario(title);
      const expected = app.texts().find((entry) => entry.startsWith("result: "));
      expect(expected).toMatch(/^result: \[\{"key":\["query_\d+"\]\}\]$/);
      expect(logs(app)).toHaveLength(1);

      await app.press("rerender");
      expect(app.texts()).toContain(expected);
      expect(logs(app)).toHaveLength(1);
    });
  }

  test("should read from a changed custom queryClient", async () => {
    const app = await scenario("should read from a changed custom queryClient");
    const first = app.texts().find((entry) => entry.startsWith("keys: "));
    expect(first).toMatch(/^keys: \[\["query_\d+"\]\]$/);

    await app.press("switch");
    const second = app.texts().find((entry) => entry.startsWith("keys: "));
    expect(second).toMatch(/^keys: \[\["query_\d+"\]\]$/);
    expect(second).not.toBe(first);

    await app.press("report");
    expect(logs(app)).toEqual([{ client1: false, client2: true }]);
  });

  test("should remove successful mutations when the query client is cleared", async () => {
    const app = await scenario("should remove successful mutations when the query client is cleared");
    await app.press("mutate");
    await advance(app, 1);
    expect(app.texts()).toContain('data: ["saved"]');

    await app.press("clear");
    await advance(app, 1);
    expect(logs(app)).toEqual([{ mutations: 0 }]);
    expect(app.texts()).toContain("data: []");
  });

  test("should return all mutation states when called without options", async () => {
    const app = await run("should return all mutation states when called without options");
    expect(app.texts()).toContain("count: 0");

    await app.press("mutate");
    await advance(app, 0);
    expect(app.texts()).toContain("count: 1");
    await advance(app, 150);
    expect(app.texts()).toContain("count: 1");
  });

  test("should return variables after calling mutate", async () => {
    const app = await run("should return variables after calling mutate");
    expect(app.texts()).toContain("data: null");
    expect(app.texts()).toContain("variables: []");

    await app.press("mutate");
    expect(app.texts()).toContain("variables: [1]");

    await advance(app, 150);
    expect(app.texts()).toContain("data: data1");
    expect(app.texts()).toContain("variables: []");
    expect(logs(app)).toEqual([[], [1], []]);
  });
});
