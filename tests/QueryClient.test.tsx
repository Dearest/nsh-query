import { expect, open, test } from "nsh/test";

test("fetchQuery resolves through the vendored query-core", async () => {
  const app = await open("./fixtures/QueryClient/fetch-query.tsx", {
    clock: {},
    network: { "https://api.test/todos/1": { body: { id: 1, title: "Walk the dog" } } },
  });
  await app.waitFor("text:Walk the dog");
  expect(app.requests()).toHaveLength(1);
});
