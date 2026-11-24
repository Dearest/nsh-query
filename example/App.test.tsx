import { expect, open, test } from "nsh/test";
import type { App } from "nsh/test";

// The fake API (api.ts) answers after 300 ms; the clock is manual.
const latency = 300;
const start = async (storage?: Record<string, string>) => {
  const app = await open("./App.tsx", storage ? { clock: {}, storage } : { clock: {} });
  await app.clock!.runFor(latency);
  return app;
};

test("list and detail: going back and forth shows cached data at once", async () => {
  const app = await start();
  expect(app.texts()).toContain("Walk the dog");

  await app.press("Walk the dog");
  expect(app.texts()).toContain("Loading todo");
  await app.clock!.runFor(latency);
  expect(app.texts()).toContain("Around the park, twice.");

  await app.press("Back");
  expect(app.texts()).toContain("Walk the dog");
  expect(app.texts()).not.toContain("Loading todos");
  expect(app.texts()).not.toContain("Refreshing");

  await app.press("Walk the dog");
  expect(app.texts()).not.toContain("Loading todo");
  expect(app.texts()).toContain("Around the park, twice.");
});

test("polling: the online count refreshes every five seconds", async () => {
  const app = await start();
  expect(app.texts()).toContain("Online now: 3");
  await app.clock!.runFor(5000 + latency);
  expect(app.texts()).toContain("Online now: 4");
  await app.clock!.runFor(5000 + latency);
  expect(app.texts()).toContain("Online now: 5");
});

test("optimistic update: a new todo shows at once, then as saved", async () => {
  const app = await start();
  await app.press("Add todo");
  expect(app.texts()).toContain("New todo 1 (saving)");
  await app.clock!.runFor(latency);
  await app.clock!.runFor(latency);
  expect(app.texts()).toContain("New todo 1");
  expect(app.texts()).not.toContain("New todo 1 (saving)");
});

// Drags the feed up to its end, a screenful at a time.
async function scrollToEnd(app: App) {
  for (;;) {
    try {
      await app.scroll("id:feed", 700);
    } catch {
      return;
    }
  }
}

test("infinite scrolling: scrolling to the end of the feed loads the next pages", async () => {
  const app = await start();
  await app.press("Feed");
  expect(app.texts()).toContain("Loading posts");
  await app.clock!.runFor(latency);
  expect(app.texts()).toContain("Post 20");
  for (let i = 0; i < 10 && !app.shows("text:All 100 posts"); i++) {
    await scrollToEnd(app);
    await app.clock!.runFor(latency);
  }
  expect(app.texts()).toContain("Post 100");
  expect(app.texts()).toContain("All 100 posts");
});

test("persistence: a new launch opens on the saved cache, without loading", async () => {
  const first = await start();
  await first.clock!.runFor(1000);
  const storage = first.storage();
  expect(storage["nsh-query-example"]).toBeDefined();

  const app = await open("./App.tsx", { clock: {}, storage });
  expect(app.texts()).toContain("Walk the dog");
  expect(app.texts()).not.toContain("Loading todos");
});
