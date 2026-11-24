import { expect, open, test } from "nsh/test";
import { activityNetwork as network } from "./support/activityNetwork";

test("useMutationState follows the mutations in the cache, filtered and selected", async () => {
  const app = await open("./fixtures/useMutationState/indicator.tsx", { clock: {}, network });
  expect(app.texts()).toContain("pending: none");
  expect(app.texts()).toContain("statuses: none");

  await app.press("Add");
  await app.press("Rename");
  expect(app.texts()).toContain("pending: Walk the dog,Ada");
  expect(app.texts()).toContain("statuses: pending,pending");
  expect(app.texts()).toContain("todo mutations: 1");

  await app.clock!.runFor(100);
  expect(app.texts()).toContain("pending: none");
  expect(app.texts()).toContain("statuses: success,success");
  expect(app.texts()).toContain("todo mutations: 1");
});
