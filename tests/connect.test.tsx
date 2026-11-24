import { expect, open, test } from "nsh/test";
import type { StubRequest } from "nsh/test";

const network = { "https://api.test/todos": { body: [{ id: 1, title: "Walk the dog" }] } };
const todoRequests = (requests: StubRequest[]) => requests.filter((r) => r.url === "https://api.test/todos").length;

test("polling continues while inactive and stops in the background", async () => {
  const app = await open("./fixtures/connect/polling.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.clock!.runFor(250);
  const active = todoRequests(app.requests());
  expect(active).toBeGreaterThanOrEqual(3);

  await app.setLifecycle("inactive");
  await app.clock!.runFor(300);
  const inactive = todoRequests(app.requests());
  expect(inactive).toBeGreaterThanOrEqual(active + 2);

  await app.setLifecycle("background");
  await app.clock!.runFor(50);
  const background = todoRequests(app.requests());
  await app.clock!.runFor(500);
  expect(todoRequests(app.requests())).toBe(background);

  await app.setLifecycle("active");
  await app.clock!.runFor(250);
  expect(todoRequests(app.requests())).toBeGreaterThanOrEqual(background + 2);
});

test("coming back to the foreground refetches stale data once", async () => {
  const app = await open("./fixtures/connect/stale-on-focus.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.setLifecycle("background");
  await app.clock!.runFor(200);
  expect(todoRequests(app.requests())).toBe(1);
  await app.setLifecycle("active");
  await app.clock!.runFor(50);
  expect(todoRequests(app.requests())).toBe(2);
});

test("coming back before the data is stale does not refetch", async () => {
  const app = await open("./fixtures/connect/stale-on-focus.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.setLifecycle("background");
  await app.setLifecycle("active");
  await app.clock!.runFor(50);
  expect(todoRequests(app.requests())).toBe(1);
});

test("inactive counts as focused: going from inactive to active does not refetch", async () => {
  const app = await open("./fixtures/connect/stale-on-focus.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.setLifecycle("inactive");
  await app.clock!.runFor(200);
  await app.setLifecycle("active");
  await app.clock!.runFor(50);
  expect(todoRequests(app.requests())).toBe(1);
});

test("connectNsh({ focused }) can count inactive as unfocused", async () => {
  const app = await open("./fixtures/connect/custom-focus.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.setLifecycle("inactive");
  await app.clock!.runFor(50);
  const inactive = todoRequests(app.requests());
  await app.clock!.runFor(500);
  expect(todoRequests(app.requests())).toBe(inactive);
  await app.setLifecycle("active");
  await app.clock!.runFor(250);
  expect(todoRequests(app.requests())).toBeGreaterThanOrEqual(inactive + 2);
});

test("offline, a fetch pauses; back online it resumes by itself", async () => {
  const app = await open("./fixtures/connect/offline.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.setNetworkState({ kind: "none" });
  await app.press("Refetch");
  await app.clock!.runFor(100);
  expect(app.texts()).toContain("fetchStatus: paused");
  expect(todoRequests(app.requests())).toBe(1);

  await app.setNetworkState({ kind: "wifi" });
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("fetchStatus: idle");
  expect(todoRequests(app.requests())).toBe(2);
});

test("waking from sleep refetches stale data once", async () => {
  const app = await open("./fixtures/connect/stale-on-focus.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.clock!.runFor(200);
  await app.wake();
  await app.clock!.runFor(50);
  expect(todoRequests(app.requests())).toBe(2);
});

test("waking before the data is stale does not refetch", async () => {
  const app = await open("./fixtures/connect/stale-on-focus.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.wake();
  await app.clock!.runFor(50);
  expect(todoRequests(app.requests())).toBe(1);
});

test("waking in the background does not refetch", async () => {
  const app = await open("./fixtures/connect/stale-on-focus.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  await app.setLifecycle("background");
  await app.clock!.runFor(200);
  await app.wake();
  await app.clock!.runFor(50);
  expect(todoRequests(app.requests())).toBe(1);
});
