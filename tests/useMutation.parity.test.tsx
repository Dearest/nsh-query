import { expect, test } from "nsh/test";
import { advance, error, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useMutation/parity.tsx";
const run = (name: string) => openScenario(entry, name);

const hookContext = { client: true, meta: undefined, mutationKey: undefined };

test("should be able to reset `data`", async () => {
  const app = await run("should be able to reset `data`");
  expect(app.texts()).toContain("heading: empty");
  await app.press("mutate");
  expect(app.texts()).toContain("heading: mutation");
  await app.press("reset");
  expect(app.texts()).toContain("heading: empty");
});

test("should be able to reset `error`", async () => {
  const app = await run("should be able to reset `error`");
  expect(app.texts()).not.toContain("heading: Expected mock error. All is well!");
  await app.press("mutate");
  expect(app.texts()).toContain("heading: Expected mock error. All is well!");
  await app.press("reset");
  expect(app.texts()).not.toContain("heading: Expected mock error. All is well!");
});

test("should call mutate callbacks when useMutation has no callbacks", async () => {
  const app = await run("should call mutate callbacks when useMutation has no callbacks");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutate.onSuccess", "mutate.onSettled"]);
});

test("should call mutate error callbacks when useMutation has no callbacks", async () => {
  const app = await run("should call mutate error callbacks when useMutation has no callbacks");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutate.onError", "mutate.onSettled"]);
});

test("should call only mutate onSuccess when useMutation has no callbacks", async () => {
  const app = await run("should call only mutate onSuccess when useMutation has no callbacks");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutate.onSuccess"]);
});

test("should call only mutate onError when useMutation has no callbacks", async () => {
  const app = await run("should call only mutate onError when useMutation has no callbacks");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutate.onError"]);
});

test("should call only mutate onSettled when useMutation has no callbacks", async () => {
  const app = await run("should call only mutate onSettled when useMutation has no callbacks");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutate.onSettled"]);
});

test("should call mutateAsync callbacks when useMutation has no callbacks", async () => {
  const app = await run("should call mutateAsync callbacks when useMutation has no callbacks");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutateAsync.onSuccess", "mutateAsync.onSettled"]);
});

test("should call mutateAsync error callbacks when useMutation has no callbacks", async () => {
  const app = await run("should call mutateAsync error callbacks when useMutation has no callbacks");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutateAsync.onError", "mutateAsync.onSettled"]);
});

test("should call only mutateAsync onSuccess when useMutation has no callbacks", async () => {
  const app = await run("should call only mutateAsync onSuccess when useMutation has no callbacks");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutateAsync.onSuccess"]);
});

test("should call only mutateAsync onError when useMutation has no callbacks", async () => {
  const app = await run("should call only mutateAsync onError when useMutation has no callbacks");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutateAsync.onError"]);
});

test("should call only mutateAsync onSettled when useMutation has no callbacks", async () => {
  const app = await run("should call only mutateAsync onSettled when useMutation has no callbacks");
  await advance(app, 10);
  expect(logs(app)).toEqual(["mutateAsync.onSettled"]);
});

test("should be able to call `onSuccess` and `onSettled` after each successful mutate", async () => {
  const app = await run("should be able to call `onSuccess` and `onSettled` after each successful mutate");
  expect(app.texts()).toContain("heading: 0");
  await app.press("mutate");
  await app.press("mutate");
  await app.press("mutate");
  await advance(app, 0);
  expect(app.texts()).toContain("heading: 3");
  const entries = logs<Record<string, number>>(app);
  expect(entries.filter((e) => "onSuccess" in e).map((e) => e["onSuccess"])).toEqual([1, 2, 3]);
  expect(entries.filter((e) => "onSettled" in e).map((e) => e["onSettled"])).toEqual([1, 2, 3]);
});

test("should set correct values for `failureReason` and `failureCount` on multiple mutate calls", async () => {
  const app = await run("should set correct values for `failureReason` and `failureCount` on multiple mutate calls");
  expect(app.texts()).toContain("Data");
  await app.press("mutate");
  expect(app.texts()).toContain("Status error");
  expect(app.texts()).toContain("Failed 1 times");
  expect(app.texts()).toContain("Failed because Error test");
  await app.press("mutate");
  expect(app.texts()).toContain("Status pending");
  await advance(app, 10);
  expect(app.texts()).toContain("Status success");
  expect(app.texts()).toContain("Data 2");
  expect(app.texts()).toContain("Failed 0 times");
  expect(app.texts()).toContain("Failed because null");
});

test("should be able to call `onError` and `onSettled` after each failed mutate", async () => {
  const app = await run("should be able to call `onError` and `onSettled` after each failed mutate");
  expect(app.texts()).toContain("heading: 0");
  await app.press("mutate");
  await app.press("mutate");
  await app.press("mutate");
  await advance(app, 0);
  expect(app.texts()).toContain("heading: 3");
  const messages = [1, 2, 3].map((n) => `Expected mock error. All is well! ${n}`);
  const entries = logs<Record<string, string>>(app);
  expect(entries.filter((e) => "onError" in e).map((e) => e["onError"])).toEqual(messages);
  expect(entries.filter((e) => "onSettled" in e).map((e) => e["onSettled"])).toEqual(messages);
});

test("should be able to override the useMutation success callbacks", async () => {
  const app = await run("should be able to override the useMutation success callbacks");
  await advance(app, 10);
  expect(logs(app)).toEqual([
    "useMutation.onSuccess",
    "useMutation.onSettled",
    "mutateAsync.onSuccess",
    "mutateAsync.onSettled",
    "mutateAsync.result:todo",
  ]);
});

test("should be able to override the error callbacks when using mutateAsync", async () => {
  const app = await run("should be able to override the error callbacks when using mutateAsync");
  await advance(app, 10);
  expect(logs(app)).toEqual([
    "useMutation.onError",
    "useMutation.onSettled",
    "mutateAsync.onError",
    "mutateAsync.onSettled",
    "mutateAsync.error:oops",
  ]);
});

test("should be able to use mutation defaults", async () => {
  const app = await run("should be able to use mutation defaults");
  await advance(app, 20);
  const states = logs(app);
  expect(states).toHaveLength(3);
  expect(states[0]).toMatchObject({ data: undefined });
  expect(states[0]).toMatchObject({ isPending: false });
  expect(states[1]).toMatchObject({ data: undefined });
  expect(states[1]).toMatchObject({ isPending: true });
  expect(states[2]).toMatchObject({ data: "todo", isPending: false });
});

test("should be able to retry a failed mutation", async () => {
  const app = await run("should be able to retry a failed mutation");
  await advance(app, 15);
  expect(logs(app)).toEqual([{ count: 1 }, { count: 2 }]);
  await advance(app, 5);
  expect(logs(app)).toEqual([{ count: 1 }, { count: 2 }]);
});

test("should not retry mutations while offline", async () => {
  const app = await run("should not retry mutations while offline");
  await app.setNetworkState({ kind: "none" });
  expect(app.texts()).toContain("error: null, status: idle, isPaused: false");
  await app.press("mutate");
  expect(app.texts()).toContain("error: null, status: pending, isPaused: true");
  expect(logs(app)).toEqual([]);
  await app.setNetworkState({ kind: "wifi" });
  await advance(app, 5);
  expect(app.texts()).toContain("error: oops, status: error, isPaused: false");
  expect(logs(app)).toEqual([{ count: 1 }, { count: 2 }]);
});

test("should call onMutate even if paused", async () => {
  const app = await run("should call onMutate even if paused");
  await app.setNetworkState({ kind: "none" });
  expect(app.texts()).toContain("data: null, status: idle, isPaused: false");
  await app.press("mutate");
  expect(app.texts()).toContain("data: null, status: pending, isPaused: true");
  expect(logs(app)).toEqual([{ onMutate: ["todo", hookContext] }]);
  await app.setNetworkState({ kind: "wifi" });
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1, status: success, isPaused: false");
  expect(logs(app)).toEqual([{ onMutate: ["todo", hookContext] }, { count: 1 }]);
});

test("should optimistically go to paused state if offline", async () => {
  const app = await run("should optimistically go to paused state if offline");
  await app.setNetworkState({ kind: "none" });
  expect(app.texts()).toContain("data: null, status: idle, isPaused: false");
  await app.press("mutate");
  expect(app.texts()).toContain("data: null, status: pending, isPaused: true");
  // no intermediate 'pending, false' state is expected because we don't start mutating!
  const states = logs(app);
  expect(states[0]).toBe("idle, false");
  expect(states[1]).toBe("pending, true");
  await app.setNetworkState({ kind: "wifi" });
  await advance(app, 10);
  expect(app.texts()).toContain("data: 1, status: success, isPaused: false");
});

test("should be able to retry a mutation when online", async () => {
  const app = await run("should be able to retry a mutation when online");
  await app.setNetworkState({ kind: "none" });
  await advance(app, 16);
  let states = logs(app);
  expect(states).toHaveLength(4);
  expect(states[0]).toMatchObject({ isPending: false, isPaused: false, failureCount: 0, failureReason: null });
  expect(states[1]).toMatchObject({ isPending: true, isPaused: false, failureCount: 0, failureReason: null });
  expect(states[2]).toMatchObject({ isPending: true, isPaused: false, failureCount: 1, failureReason: error("oops") });
  expect(states[3]).toMatchObject({ isPending: true, isPaused: true, failureCount: 1, failureReason: error("oops") });
  await app.press("inspect");
  expect(logs(app)[4]).toEqual({
    cached: 1,
    state: { status: "pending", isPaused: true, failureCount: 1, failureReason: error("oops") },
  });

  await app.setNetworkState({ kind: "wifi" });
  await advance(app, 1);
  states = logs(app);
  expect(states).toHaveLength(7);
  expect(states[5]).toMatchObject({ isPending: true, isPaused: false, failureCount: 1, failureReason: error("oops") });
  expect(states[6]).toMatchObject({ isPending: false, isPaused: false, failureCount: 0, failureReason: null, data: "data" });
  await app.press("inspect");
  expect(logs(app)[7]).toEqual({
    cached: 1,
    state: { status: "success", isPaused: false, failureCount: 0, failureReason: null, data: "data" },
  });
});

test("should not change state if unmounted", async () => {
  const app = await run("should not change state if unmounted");
  await app.press("mutate");
  expect(logs(app)).toEqual(["idle", "pending"]);
  await app.press("unmount");
  await app.press("inspect");
  expect(logs(app)).toEqual(["idle", "pending", { cacheStatus: "pending" }]);
  await advance(app, 10);
  await app.press("inspect");
  expect(logs(app)).toEqual(["idle", "pending", { cacheStatus: "pending" }, { cacheStatus: "success" }]);
});
