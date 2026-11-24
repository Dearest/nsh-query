import { expect, open, test } from "nsh/test";
import type { StubRequest } from "nsh/test";

function server() {
  const todos = [{ title: "Walk the dog" }];
  return {
    "GET https://api.test/todos": () => ({ body: todos }),
    "POST https://api.test/todos": (request: StubRequest) => {
      const todo = JSON.parse(request.body!) as { title: string };
      if (todo.title === "Fail") return { status: 500, delay: 100 };
      todos.push(todo);
      return { status: 201, body: todo, delay: 100 };
    },
  };
}

const methods = (requests: StubRequest[]) => requests.map((r) => r.method);

test("an optimistic update shows at once, and onSettled's invalidation refetches", async () => {
  const app = await open("./fixtures/useMutation/optimistic.tsx", { clock: {}, network: server() });
  await app.waitFor("text:todos: Walk the dog");

  await app.press("Add Feed the cat");
  expect(app.texts()).toContain("todos: Walk the dog, Feed the cat (saving)");
  expect(app.texts()).toContain("status: pending");
  expect(app.texts()).toContain("variables: Feed the cat");

  await app.clock!.runFor(100);
  await app.waitFor("text:todos: Walk the dog, Feed the cat");
  expect(app.texts()).toContain("status: success");
  expect(methods(app.requests())).toEqual(["GET", "POST", "GET"]);
});

test("a failed mutation rolls the optimistic update back", async () => {
  const app = await open("./fixtures/useMutation/optimistic.tsx", { clock: {}, network: server() });
  await app.waitFor("text:todos: Walk the dog");

  await app.press("Add Fail");
  expect(app.texts()).toContain("todos: Walk the dog, Fail (saving)");
  await app.clock!.runFor(100);
  expect(app.texts()).toContain("todos: Walk the dog");
  expect(app.texts()).toContain("status: error");
  expect(app.texts()).toContain("error: POST /todos: 500");
  expect(methods(app.requests())).toEqual(["GET", "POST", "GET"]);

  await app.press("Reset");
  expect(app.texts()).toContain("status: idle");
  expect(app.texts()).toContain("error: none");
});

test("mutateAsync returns the result, and mutate, mutateAsync and reset are stable", async () => {
  const app = await open("./fixtures/useMutation/optimistic.tsx", { clock: {}, network: server() });
  await app.waitFor("text:todos: Walk the dog");
  await app.press("Stable");
  expect(app.texts()).toContain("stable: true");
  await app.press("Async");
  await app.clock!.runFor(100);
  expect(app.texts()).toContain("resolved: Water the plants");
});

test("throwOnError throws a failed mutation's error to the nearest ErrorBoundary", async () => {
  const app = await open("./fixtures/useMutation/throw-on-error.tsx", {
    clock: {},
    network: { "POST https://api.test/todos": { status: 500 } },
  });
  expect(app.texts()).toContain("status: idle");
  await app.press("Save");
  await app.waitFor("text:boundary: POST /todos: 500");
});
