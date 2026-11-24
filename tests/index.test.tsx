import { expect, open, test } from "nsh/test";

const network = {
  "https://api.test/todos": { body: [{ id: 1, title: "Walk the dog" }] },
  "https://api.test/users/1": { body: { name: "Ada" } },
};

const todoRequests = (requests: { url: string }[]) =>
  requests.filter((request) => request.url === "https://api.test/todos").length;

test("importing nsh-query makes query-core treat the app as a client", async () => {
  const app = await open("./fixtures/index/client-timers.tsx", { clock: {}, network });
  await app.waitFor("text:user: Ada");
  expect(app.texts()).toContain("stale: false");
  await app.clock!.runFor(300);
  expect(todoRequests(app.requests())).toBeGreaterThanOrEqual(3);
  expect(app.texts()).toContain("stale: true");
});

test("with query-core's own server detection there are no refetch or stale timers", async () => {
  const app = await open("./fixtures/index/server-timers.tsx", { clock: {}, network });
  await app.waitFor("text:user: Ada");
  await app.clock!.runFor(300);
  expect(todoRequests(app.requests())).toBe(1);
  expect(app.texts()).toContain("stale: false");
});
