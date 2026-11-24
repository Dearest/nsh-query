import { expect, test } from "nsh/test";
import { advance, logs, openScenario } from "./support/parityTest";

const run = (name: string) => openScenario("./fixtures/useQueries/subscribed.tsx", name);

test("should not optimistically show fetching when unsubscribed", async () => {
  const app = await run("should not optimistically show fetching when unsubscribed");
  expect(app.texts()).toContain("isFetching: false");
  expect(app.texts()).toContain("fetchStatus: idle");
  await app.press("report");
  expect(logs(app)).toEqual([{ calls: 0, observers: 0 }]);
});

test("subscribed: false detaches every query until it is true again", async () => {
  const app = await run("subscribed: false detaches every query until it is true again");
  expect(app.texts()).toContain("data: cached, cached");
  await advance(app, 100);
  await app.press("report");
  expect(logs(app).at(-1)).toEqual({ calls: 0, observers: [0, 0] });

  await app.press("subscribe");
  await advance(app, 10);
  expect(app.texts()).toContain("data: fetched 1, fetched 2");
  await app.press("report");
  expect(logs(app).at(-1)).toEqual({ calls: 2, observers: [1, 1] });
});
