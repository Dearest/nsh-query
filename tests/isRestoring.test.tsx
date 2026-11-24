import { expect, open, test } from "nsh/test";

const network = { "https://api.test/todos": { body: [{ id: 1, title: "Walk the dog" }] } };

test("while restoring, queries neither subscribe nor fetch; after, they fetch", async () => {
  const app = await open("./fixtures/isRestoring/restoring.tsx", { clock: {}, network });
  expect(app.texts()).toContain("restoring: true");
  expect(app.texts()).toContain("fetchStatus: idle");
  await app.clock!.runFor(100);
  expect(app.requests()).toHaveLength(0);

  await app.press("Restored");
  await app.waitFor("text:todos: 1");
  expect(app.texts()).toContain("restoring: false");
  expect(app.requests()).toHaveLength(1);
});
