import { expect, open, test } from "nsh/test";

const network = { "https://api.test/todos": { body: [{ id: 1, title: "Walk the dog" }] } };

test("useQuery without a provider or a client throws an error naming QueryClientProvider", async () => {
  const app = await open("./fixtures/QueryClientProvider/no-provider.tsx", { clock: {}, network });
  const error = app.texts().find((text) => text.includes("No QueryClient") || text.includes("no QueryClient"));
  expect(error).toBeDefined();
  expect(error!).toMatch("QueryClientProvider");
  expect(app.requests()).toHaveLength(0);
});

test("useQueryClient reads the provider, and a client passed as the last argument wins", async () => {
  const app = await open("./fixtures/QueryClientProvider/explicit-client.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  expect(app.texts()).toContain("context client: true");
  expect(app.texts()).toContain("argument client: true");
  await app.press("Report");
  expect(app.texts()).toContain("explicit: true, provided: false");
  expect(app.requests()).toHaveLength(1);
});

test("the provider mounts the client while it is shown and unmounts it after", async () => {
  const app = await open("./fixtures/QueryClientProvider/mount-unmount.tsx", { clock: {} });
  await app.press("Report");
  expect(app.texts()).toContain("focus listeners: true, online listeners: true");
  await app.press("Toggle");
  await app.press("Report");
  expect(app.texts()).toContain("focus listeners: false, online listeners: false");
});

test("QueryClientContext provides a client as is, without mounting it", async () => {
  const app = await open("./fixtures/QueryClientProvider/context-only.tsx", { clock: {}, network });
  await app.waitFor("text:todos: 1");
  expect(app.texts()).toContain("same client: true");
  expect(app.texts()).toContain("client mounted: false");
});
