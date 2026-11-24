import { expect, open, test } from "nsh/test";
import { activityNetwork as network } from "./support/activityNetwork";

test("useIsMutating counts the mutations running, as they start and end", async () => {
  const app = await open("./fixtures/useIsMutating/indicator.tsx", { clock: {}, network });
  expect(app.texts()).toContain("mutating: 0");

  await app.press("Add");
  expect(app.texts()).toContain("mutating: 1");
  expect(app.texts()).toContain("mutating todos: 1");
  await app.press("Rename");
  expect(app.texts()).toContain("mutating: 2");
  expect(app.texts()).toContain("mutating todos: 1");

  await app.clock!.runFor(100);
  expect(app.texts()).toContain("mutating: 0");
  expect(app.texts()).toContain("mutating todos: 0");
});
