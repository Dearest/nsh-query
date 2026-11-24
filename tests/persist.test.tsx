import { expect, open, test } from "nsh/test";
import type { StubRequest } from "nsh/test";

const todos = { "https://api.test/todos": { body: [{ id: 1, title: "Walk the dog" }] } };
const saved = (storage: Record<string, string>) =>
  JSON.parse(storage["nsh-query"]!) as {
    buster: string;
    timestamp: number;
    clientState: { queries: { queryKey: unknown[]; state: { data: unknown } }[] };
  };

async function savedStorage() {
  const app = await open("./fixtures/persist/todos.tsx", { clock: {}, network: todos });
  await app.waitFor("text:todos: Walk the dog");
  await app.clock!.runFor(1000);
  return app.storage();
}

test("round trip: app A saves its cache, app B opens on it with the data and no request", async () => {
  const storage = await savedStorage();
  expect(storage["nsh-query"]).toBeDefined();
  expect(saved(storage).clientState.queries.map((query) => query.queryKey)).toEqual([["todos"]]);

  const app = await open("./fixtures/persist/todos.tsx", { clock: {}, network: todos, storage });
  expect(app.texts()).toContain("todos: Walk the dog");
  expect(app.texts()).toContain("outcome: restored");
  await app.clock!.runFor(1000);
  expect(app.requests()).toHaveLength(0);
});

test("a different buster: the saved cache is not restored", async () => {
  const storage = await savedStorage();
  const app = await open("./fixtures/persist/todos-v2.tsx", {
    clock: {},
    network: { "https://api.test/todos": { body: [{ id: 2, title: "Feed the cat" }] } },
    storage,
  });
  await app.waitFor("text:todos: Feed the cat");
  expect(app.requests()).toHaveLength(1);
  await app.clock!.runFor(1000);
  expect(saved(app.storage()).buster).toBe("v2");
});

test("a different buster removes the saved cache", async () => {
  const storage = await savedStorage();
  const app = await open("./fixtures/persist/empty-v2.tsx", { clock: {}, storage });
  expect(app.texts()).toContain("outcome: restored");
  await app.clock!.runFor(1000);
  expect(app.storage()["nsh-query"]).toBeUndefined();
});

test("past maxAge the saved cache is not restored, and is removed", async () => {
  const storage = await savedStorage();
  const later = Date.now() + 25 * 60 * 60 * 1000;
  const empty = await open("./fixtures/persist/empty.tsx", { clock: { time: later }, storage });
  await empty.clock!.runFor(1000);
  expect(empty.storage()["nsh-query"]).toBeUndefined();

  const app = await open("./fixtures/persist/todos.tsx", { clock: { time: later }, network: todos, storage });
  await app.waitFor("text:todos: Walk the dog");
  expect(app.requests()).toHaveLength(1);
});

test("within maxAge the saved cache is restored", async () => {
  const storage = await savedStorage();
  const app = await open("./fixtures/persist/todos.tsx", {
    clock: { time: Date.now() + 23 * 60 * 60 * 1000 },
    network: todos,
    storage,
  });
  expect(app.texts()).toContain("todos: Walk the dog");
  expect(app.requests()).toHaveLength(0);
});

test("while restoring, queries do not fetch; restored stale data is refetched after", async () => {
  const storage = await savedStorage();
  const app = await open("./fixtures/persist/slow-restore.tsx", { clock: {}, network: todos, storage });
  expect(app.texts()).toContain("restoring: true");
  expect(app.texts()).toContain("todos: none");
  expect(app.texts()).toContain("fetchStatus: idle");
  await app.clock!.runFor(50);
  expect(app.requests()).toHaveLength(0);

  await app.clock!.runFor(50);
  expect(app.texts()).toContain("restoring: false");
  expect(app.texts()).toContain("todos: Walk the dog");
  await app.clock!.runFor(10);
  expect(app.requests()).toHaveLength(1);
});

test("a restore that fails calls onError, removes the saved cache and fetches", async () => {
  const storage = await savedStorage();
  const app = await open("./fixtures/persist/broken-restore.tsx", { clock: {}, network: todos, storage });
  await app.waitFor("text:todos: Walk the dog");
  expect(app.texts()).toContain("outcome: restore failed");
  expect(app.requests()).toHaveLength(1);
});

test("a full Storage drops the oldest queries instead of failing the save", async () => {
  const body = "p".repeat(25_000);
  const filler = "x".repeat(5 * 1024 * 1024 - 60_000);
  const app = await open("./fixtures/persist/quota.tsx", {
    clock: {},
    storage: { filler },
    network: { "https://api.test/posts/*": (request: StubRequest) => ({ body: { id: request.url, body } }) },
  });
  for (const id of [1, 2, 3]) {
    await app.press("Next");
    await app.waitFor(`text:post ${id}: 25000`);
    await app.clock!.runFor(200);
  }
  await app.clock!.runFor(1000);
  const keys = saved(app.storage()).clientState.queries.map((query) => query.queryKey);
  expect(keys).toEqual([
    ["posts", 2],
    ["posts", 3],
  ]);
  expect(app.storage().filler).toHaveLength(filler.length);
});

test("the persistence functions work without the provider", async () => {
  const first = await open("./fixtures/persist/manual.tsx", { clock: {} });
  await first.waitFor("text:restored first: nothing; other client: Ada");
  const keys = (JSON.parse(first.storage().manual!) as { clientState: { queries: { queryKey: unknown[] }[] } }).clientState.queries.map(
    (query) => query.queryKey,
  );
  expect(keys).toEqual([["todos"], ["users"]]);

  const second = await open("./fixtures/persist/manual.tsx", { clock: {}, storage: first.storage() });
  await second.waitFor("text:restored first: Walk the dog; other client: Ada");
});
