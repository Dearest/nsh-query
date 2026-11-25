import { expect, open, test } from "nsh/test";

const user = (id: number, name: string) => ({ body: { id, name }, delay: 50 });
const network = {
  "https://api.test/users/1": user(1, "Ada"),
  "https://api.test/users/2": user(2, "Grace"),
  "https://api.test/users/3": user(3, "Linus"),
};

test("queries can be added and removed, and combine shapes the result", async () => {
  const app = await open("./fixtures/useQueries/dynamic.tsx", { clock: {}, network });
  expect(app.texts()).toContain("pending: true");
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("names: Ada,Grace");
  expect(app.texts()).toContain("pending: false");
  expect(app.texts()).toContain("count: 2");
  expect(app.texts()).toContain("array: true");

  await app.press("Add");
  expect(app.texts()).toContain("names: Ada,Grace,...");
  expect(app.texts()).toContain("pending: true");
  expect(app.texts()).toContain("statuses: success,success,pending");
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("names: Ada,Grace,Linus");
  expect(app.texts()).toContain("count: 3");

  await app.press("Remove");
  await app.press("Remove");
  expect(app.texts()).toContain("names: Ada");
  expect(app.texts()).toContain("count: 1");
  expect(app.texts()).toContain("statuses: success");
  expect(app.requests().map((r) => r.url)).toEqual([
    "https://api.test/users/1",
    "https://api.test/users/2",
    "https://api.test/users/3",
  ]);
});

test("combine does not run again while no result changes", async () => {
  const app = await open("./fixtures/useQueries/dynamic.tsx", { clock: {}, network });
  await app.clock!.runFor(50);
  await app.press("Combines");
  const settled = app.texts().find((text) => text.startsWith("combines: "))!;
  await app.clock!.runFor(1000);
  await app.press("Combines");
  expect(app.texts()).toContain(settled);
});

test("a property first read after it changed shows the current value", async () => {
  const app = await open("./fixtures/useQueries/late-read.tsx", { clock: {}, network });
  await app.clock!.runFor(50);
  await app.press("Handler");
  expect(app.texts()).toContain("handler: success,success");
  await app.press("Detail");
  expect(app.texts()).toContain("names: Ada,Grace");

  await app.press("Add");
  expect(app.texts()).toContain("names: Ada,Grace,...");
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("names: Ada,Grace,Linus");

  await app.press("Refetch");
  await app.press("Indicator");
  expect(app.texts()).toContain("fetching: true,false,false");
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("fetching: false,false,false");
  expect(app.requests()).toHaveLength(4);
});
