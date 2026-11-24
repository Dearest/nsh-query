import { expect, test } from "nsh/test";
import { advance, error, logs, openScenario } from "./support/parityTest";

const entry = "./fixtures/useMutation/parity-b.tsx";
const run = (name: string) => openScenario(entry, name);

const hookContext = { client: true, meta: undefined, mutationKey: undefined };

test("should be able to throw an error when throwOnError is set to true", async () => {
  const app = await run("should be able to throw an error when throwOnError is set to true");
  expect(app.texts()).not.toContain("error");
  await app.press("mutate");
  expect(app.texts()).toContain("error");
  expect(app.texts()).not.toContain("mutate");
});

test("should be able to throw an error when throwOnError is a function that returns true", async () => {
  const app = await run("should be able to throw an error when throwOnError is a function that returns true");
  // first error goes to component
  await app.press("mutate");
  expect(app.texts()).toContain("mock error");
  expect(app.texts()).not.toContain("error boundary");
  // second error goes to boundary
  await app.press("mutate");
  expect(app.texts()).toContain("error boundary");
  expect(app.texts()).not.toContain("mutate");
});

test("should not throw an error when throwOnError is set to false", async () => {
  const app = await run("should not throw an error when throwOnError is set to false");
  await app.press("mutate");
  await advance(app, 11);
  expect(app.texts()).toContain("error: Expected mock error");
});

test("should not throw an error when throwOnError is a function that returns false", async () => {
  const app = await run("should not throw an error when throwOnError is a function that returns false");
  await app.press("mutate");
  await advance(app, 11);
  expect(app.texts()).toContain("error: Expected mock error");
});

test("should not throw an error when throwOnError is not set", async () => {
  const app = await run("should not throw an error when throwOnError is not set");
  await app.press("mutate");
  await advance(app, 11);
  expect(app.texts()).toContain("error: Expected mock error");
});

test("should pass meta to mutation on success", async () => {
  const app = await run("should pass meta to mutation on success");
  await app.press("succeed");
  expect(app.texts()).toContain("successTest");
  expect(logs(app)).toEqual([{ success: "mutation succeeded" }]);
});

test("should pass meta to mutation on error", async () => {
  const app = await run("should pass meta to mutation on error");
  await app.press("error");
  expect(app.texts()).toContain("errorTest");
  expect(logs(app)).toEqual([{ error: "mutation failed" }]);
});

test("should call cache callbacks when unmounted", async () => {
  const app = await run("should call cache callbacks when unmounted");
  expect(app.texts()).toContain("data: null, status: idle, isPaused: false");
  await app.press("mutate");
  await app.press("hide");
  await advance(app, 10);
  await app.press("inspect");
  expect(logs(app)).toEqual([{ count: 1 }, "onSuccess", "onSettled", { cached: 0 }]);
});

test("should call mutate callbacks only for the last observer", async () => {
  const app = await run("should call mutate callbacks only for the last observer");
  expect(app.texts()).toContain("data: null, status: idle");
  await app.press("mutate1");
  await app.press("mutate2");
  await advance(app, 11);
  expect(app.texts()).toContain("data: result-todo2, status: success");
  const entries = logs<Record<string, unknown>>(app);
  const of = (name: string) => entries.filter((e) => name in e).map((e) => e[name]);
  expect(of("count")).toEqual([1, 2]);
  expect(of("onSuccess")).toEqual([
    ["result-todo1", "todo1", undefined, hookContext],
    ["result-todo2", "todo2", undefined, hookContext],
  ]);
  expect(of("onSettled")).toHaveLength(2);
  expect(of("onSuccessMutate")).toEqual([["result-todo2", "todo2", undefined, hookContext]]);
  expect(of("onSettledMutate")).toEqual([["result-todo2", null, "todo2", undefined, hookContext]]);
});

test("should go to error state if onSuccess callback errors", async () => {
  const app = await run("should go to error state if onSuccess callback errors");
  expect(app.texts()).toContain("status: idle");
  await app.press("mutate");
  await advance(app, 10);
  expect(app.texts()).toContain("status: error");
  expect(logs(app)).toEqual([{ onError: [error("error from onSuccess"), "todo", undefined, hookContext] }]);
});

test("should go to error state if onError callback errors", async () => {
  const app = await run("should go to error state if onError callback errors");
  await advance(app, 10);
  expect(app.texts()).toContain("error: null, status: idle");
  await app.press("mutate");
  await advance(app, 10);
  expect(app.texts()).toContain("error: mutateFnError, status: error");
});

test("should go to error state if onSettled callback errors", async () => {
  const app = await run("should go to error state if onSettled callback errors");
  expect(app.texts()).toContain("error: null, status: idle");
  await app.press("mutate");
  await advance(app, 10);
  expect(app.texts()).toContain("error: mutateFnError, status: error");
  expect(logs(app)).toEqual([{ onError: [error("mutateFnError"), "todo", undefined, hookContext] }]);
});

test("should use provided custom queryClient", async () => {
  const app = await run("should use provided custom queryClient");
  expect(app.texts()).toContain("data: null, status: idle");
  await app.press("mutate");
  expect(app.texts()).toContain("data: custom client, status: success");
});

test("should update the cache in onMutate and roll back via onMutateResult in onError", async () => {
  const app = await run("should update the cache in onMutate and roll back via onMutateResult in onError");
  await app.press("add");
  await app.press("inspect");
  expect(logs(app)).toEqual([["Todo 1", "Todo 2"]]);
  await advance(app, 11);
  await app.press("inspect");
  expect(logs(app)).toEqual([["Todo 1", "Todo 2"], ["Todo 1"]]);
});

test("should keep the optimistic update in place when the mutation succeeds", async () => {
  const app = await run("should keep the optimistic update in place when the mutation succeeds");
  await app.press("add");
  await advance(app, 11);
  await app.press("inspect");
  expect(logs(app)).toEqual([["Todo 1", "Todo 2"]]);
});

test("should be able to run multiple mutateAsync calls in parallel with Promise.all", async () => {
  const app = await run("should be able to run multiple mutateAsync calls in parallel with Promise.all");
  await app.press("upload all");
  await advance(app, 11);
  expect(app.texts()).toContain("result: uploaded: file1, uploaded: file2, uploaded: file3");
});

test("should handle Promise.all rejection when one parallel mutateAsync call fails", async () => {
  const app = await run("should handle Promise.all rejection when one parallel mutateAsync call fails");
  await app.press("upload all");
  await advance(app, 11);
  expect(app.texts()).toContain("result: error: upload failed");
});

test("should handle partial failure in parallel mutateAsync calls with Promise.allSettled", async () => {
  const app = await run("should handle partial failure in parallel mutateAsync calls with Promise.allSettled");
  await app.press("upload all");
  await advance(app, 11);
  expect(app.texts()).toContain("result: uploaded: file1, error: upload failed, uploaded: file3");
});

test("should pass a non-undefined onMutateResult alongside context to onSuccess", async () => {
  const app = await run("should pass a non-undefined onMutateResult alongside context to onSuccess");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual([{ onSuccess: ["TODO", "todo", { startedWith: "todo" }, hookContext] }]);
});

test("should give mutationFn the same QueryClient instance via context", async () => {
  const app = await run("should give mutationFn the same QueryClient instance via context");
  await app.press("mutate");
  await advance(app, 11);
  expect(app.texts()).toContain("data: tag-from-this-client");
});

test("should include mutationKey in the context passed to hook-level callbacks", async () => {
  const app = await run("should include mutationKey in the context passed to hook-level callbacks");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual([{ mutationKey: ["todos", "add"] }]);
});

test("should let onSuccess invalidate queries via context.client without a useQueryClient() closure", async () => {
  const app = await run("should let onSuccess invalidate queries via context.client without a useQueryClient() closure");
  await app.press("inspect");
  await app.press("mutate");
  await advance(app, 10);
  await app.press("inspect");
  expect(logs(app)).toEqual([{ isInvalidated: false }, { isInvalidated: true }]);
});

test("should be able to call `onSuccess` callback after successful mutate", async () => {
  const app = await run("should be able to call `onSuccess` callback after successful mutate");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onSuccess", "mutate.onSuccess"]);
});

test("should be able to call `onError` callback after failed mutate", async () => {
  const app = await run("should be able to call `onError` callback after failed mutate");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onError", "mutate.onError"]);
});

test("should be able to call `onSettled` callback after mutate", async () => {
  const app = await run("should be able to call `onSettled` callback after mutate");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onSettled", "mutate.onSettled"]);
});

test("should be able to call `onSuccess` callback after successful mutateAsync", async () => {
  const app = await run("should be able to call `onSuccess` callback after successful mutateAsync");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onSuccess", "mutateAsync.onSuccess"]);
});

test("should be able to call `onError` callback after failed mutateAsync", async () => {
  const app = await run("should be able to call `onError` callback after failed mutateAsync");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onError", "mutateAsync.onError"]);
});

test("should be able to call `onSettled` callback after mutateAsync", async () => {
  const app = await run("should be able to call `onSettled` callback after mutateAsync");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onSettled", "mutateAsync.onSettled"]);
});

test("should be able to override the error callbacks when using mutate", async () => {
  const app = await run("should be able to override the error callbacks when using mutate");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onError", "useMutation.onSettled", "mutate.onError", "mutate.onSettled"]);
});

test("should be able to override the settled callbacks when using mutate", async () => {
  const app = await run("should be able to override the settled callbacks when using mutate");
  await app.press("mutate");
  await advance(app, 10);
  expect(logs(app)).toEqual(["useMutation.onSuccess", "useMutation.onSettled", "mutate.onSuccess", "mutate.onSettled"]);
});

test("should be able to chain mutateAsync calls sequentially", async () => {
  const app = await run("should be able to chain mutateAsync calls sequentially");
  await app.press("chain");
  await advance(app, 10);
  await advance(app, 11);
  expect(app.texts()).toContain("result: profile updated for 1");
});

test("should handle error in chained mutateAsync calls", async () => {
  const app = await run("should handle error in chained mutateAsync calls");
  await app.press("chain");
  await advance(app, 11);
  expect(app.texts()).toContain("result: error: create failed");
});

test("should set success message from mutate callbacks when mutation succeeds", async () => {
  const app = await run("should set success message from mutate callbacks when mutation succeeds");
  await app.press("submit");
  await advance(app, 11);
  expect(app.texts()).toContain("message: success: submitted successfully");
});

test("should set error message from mutate callbacks when mutation fails", async () => {
  const app = await run("should set error message from mutate callbacks when mutation fails");
  await app.press("submit fail");
  await advance(app, 11);
  expect(app.texts()).toContain("message: error: submission failed");
});

test("should handle conditional error with retry using mutate", async () => {
  const app = await run("should handle conditional error with retry using mutate");
  await app.press("submit");
  await advance(app, 11);
  expect(app.texts()).toContain("message: failed, retrying...");
  await app.press("submit");
  await advance(app, 11);
  expect(app.texts()).toContain("message: result: success");
});

test("should support optimistic update on success", async () => {
  const app = await run("should support optimistic update on success");
  expect(app.texts()).toContain("items: item1, item2, item3");
  expect(app.texts()).toContain("success: none");
  await app.press("delete item2");
  // optimistic update: item2 removed immediately
  expect(app.texts()).toContain("items: item1, item3");
  await advance(app, 11);
  // success: item2 stays removed and onSuccess called
  expect(app.texts()).toContain("items: item1, item3");
  expect(app.texts()).toContain("success: deleted: item2");
});

test("should support optimistic update and rollback on error", async () => {
  const app = await run("should support optimistic update and rollback on error");
  expect(app.texts()).toContain("items: item1, item2, item3");
  expect(app.texts()).toContain("message: none");
  await app.press("delete item2");
  // optimistic update: item2 removed immediately
  expect(app.texts()).toContain("items: item1, item3");
  await advance(app, 11);
  // rollback: item2 restored after error, onSuccess not called
  expect(app.texts()).toContain("items: item1, item2, item3");
  expect(app.texts()).toContain("message: rollback");
});
