import { expect, open, test } from "nsh/test";
import { activityNetwork as network } from "./support/activityNetwork";

test("useIsFetching counts the queries fetching, as they start and end", async () => {
  const app = await open("./fixtures/useIsFetching/indicator.tsx", { clock: {}, network });
  expect(app.texts()).toContain("fetching: 1");
  expect(app.texts()).toContain("fetching users: 0");
  await app.clock!.runFor(100);
  expect(app.texts()).toContain("fetching: 0");

  await app.press("Load users");
  expect(app.texts()).toContain("fetching: 1");
  expect(app.texts()).toContain("fetching users: 1");
  await app.clock!.runFor(100);
  expect(app.texts()).toContain("fetching: 0");
  expect(app.texts()).toContain("fetching users: 0");
});
