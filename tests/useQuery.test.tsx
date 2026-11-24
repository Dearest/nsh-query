import { expect, open, test } from "nsh/test";
import type { StubRequest } from "nsh/test";

const todo = (id: number, title = `Todo ${id}`) => ({ body: { id, title } });
const runsShown = (texts: string[]) => Number(texts.find((t) => t.startsWith("runs: "))!.slice(6));

test("switching pages: the remounted query shows cached data in its first frame, without a request", async () => {
  const app = await open("./fixtures/useQuery/switch-page.tsx", {
    clock: {},
    network: { "https://api.test/todos/1": todo(1, "Walk the dog") },
  });
  expect(app.texts()).toContain("first frame: nothing");
  await app.waitFor("text:title: Walk the dog");
  await app.press("List");
  expect(app.texts()).toContain("list page");
  await app.press("Detail");
  expect(app.texts()).toContain("first frame: Walk the dog");
  expect(app.requests()).toHaveLength(1);
});

test("options are reactive: a new key keeps the observer and keepPreviousData shows the old data meanwhile", async () => {
  const app = await open("./fixtures/useQuery/reactive-options.tsx", {
    clock: {},
    network: {
      "https://api.test/todos/1": todo(1),
      "https://api.test/todos/2": { ...todo(2), delay: 100 },
      "https://api.test/todos/3": { ...todo(3), delay: 100 },
    },
  });
  await app.waitFor("text:kept: Todo 1");
  expect(app.texts()).toContain("placeholder: false");

  await app.press("Next");
  expect(app.texts()).toContain("kept: Todo 1");
  expect(app.texts()).toContain("placeholder: true");
  expect(app.texts()).toContain("plain: none");
  await app.clock!.runFor(100);
  expect(app.texts()).toContain("kept: Todo 2");
  expect(app.texts()).toContain("placeholder: false");
  expect(app.texts()).toContain("plain: Todo 2");

  await app.press("Next");
  await app.clock!.runFor(100);
  expect(app.texts()).toContain("kept: Todo 3");
  expect(app.texts()).toContain("bodies: 1");
  expect(app.requests().map((r: StubRequest) => r.url)).toEqual([
    "https://api.test/todos/1",
    "https://api.test/todos/2",
    "https://api.test/todos/3",
  ]);
});

test("field tracking: a binding that reads only data does not run again when isFetching flips", async () => {
  const app = await open("./fixtures/useQuery/field-tracking.tsx", {
    clock: {},
    network: { "https://api.test/todos/1": { ...todo(1, "Walk the dog"), delay: 50 } },
  });
  await app.waitFor("text:title: Walk the dog");
  await app.press("Count");
  const before = runsShown(app.texts());

  await app.press("Refetch");
  await app.clock!.runFor(100);
  expect(app.requests()).toHaveLength(2);
  await app.press("Count");
  expect(runsShown(app.texts())).toBe(before);
});

test("field tracking: the same binding runs again when data changes", async () => {
  let title = "Walk the dog";
  const app = await open("./fixtures/useQuery/field-tracking.tsx", {
    clock: {},
    network: { "https://api.test/todos/1": () => ({ body: { id: 1, title } }) },
  });
  await app.waitFor("text:title: Walk the dog");
  await app.press("Count");
  const before = runsShown(app.texts());

  title = "Feed the cat";
  await app.press("Refetch");
  await app.waitFor("text:title: Feed the cat");
  await app.press("Count");
  expect(runsShown(app.texts())).toBe(before + 1);
});

test("batching: an effect reading fields of two observers runs once per query update", async () => {
  let title = "Walk the dog";
  const app = await open("./fixtures/useQuery/batching.tsx", {
    clock: {},
    network: { "https://api.test/todos/1": () => ({ body: { id: 1, title } }) },
  });
  await app.waitFor("text:title: Walk the dog");
  await app.press("Count");
  const before = runsShown(app.texts());

  title = "Feed the cat";
  await app.press("Refetch");
  await app.waitFor("text:title: Feed the cat");
  await app.press("Count");
  expect(runsShown(app.texts())).toBe(before + 1);
  expect(app.requests()).toHaveLength(2);
});

test("throwOnError throws the error from the result to the nearest ErrorBoundary", async () => {
  const app = await open("./fixtures/useQuery/throw-on-error.tsx", {
    clock: {},
    network: {
      "https://api.test/todos/1": { status: 500 },
      "https://api.test/todos/2": { status: 500 },
    },
  });
  await app.waitFor("text:boundary: GET /todos/1: 500");
  expect(app.texts()).toContain("kept: error, GET /todos/2: 500");
  expect(app.texts()).not.toContain("kept boundary");
});

test("the result supports `in`, Object.keys and spreading, and its methods are stable", async () => {
  const app = await open("./fixtures/useQuery/result-object.tsx", {
    clock: {},
    network: { "https://api.test/todos/1": todo(1, "Walk the dog") },
  });
  await app.waitFor("text:title: Walk the dog");
  await app.press("Describe");
  expect(app.texts()).toContain(
    "in: true, true, false | keys: true | spread: Walk the dog, success | refetch stable: true",
  );
});
