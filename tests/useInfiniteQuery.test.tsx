import { expect, open, test } from "nsh/test";

const page = (items: string[], next: number | null) => ({ body: { items, next }, delay: 50 });
const network = {
  "https://api.test/posts?page=1": page(["a", "b"], 2),
  "https://api.test/posts?page=2": page(["c", "d"], 3),
  "https://api.test/posts?page=3": page(["e"], null),
};

test("fetchNextPage appends pages and hasNextPage follows getNextPageParam", async () => {
  const app = await open("./fixtures/useInfiniteQuery/pages.tsx", { clock: {}, network });
  await app.waitFor("text:pages: 1");
  expect(app.texts()).toContain("items: a,b");
  expect(app.texts()).toContain("hasNextPage: true");

  await app.press("More");
  expect(app.texts()).toContain("isFetchingNextPage: true");
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("pages: 2");
  expect(app.texts()).toContain("items: a,b,c,d");
  expect(app.texts()).toContain("isFetchingNextPage: false");
  expect(app.texts()).toContain("hasNextPage: true");

  await app.press("More");
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("items: a,b,c,d,e");
  expect(app.texts()).toContain("params: 1,2,3");
  expect(app.texts()).toContain("hasNextPage: false");
  expect(app.requests().map((r) => r.url)).toEqual([
    "https://api.test/posts?page=1",
    "https://api.test/posts?page=2",
    "https://api.test/posts?page=3",
  ]);
});

test("infiniteQueryOptions keys the cache: getQueryData reads the pages with its queryKey", async () => {
  const app = await open("./fixtures/useInfiniteQuery/pages.tsx", { clock: {}, network });
  await app.waitFor("text:pages: 1");
  await app.press("More");
  await app.clock!.runFor(50);
  expect(app.texts()).toContain("cached pages: 2");
});

test("a property first read after it changed shows the current value", async () => {
  const app = await open("./fixtures/useInfiniteQuery/late-read.tsx", { clock: {}, network });
  await app.clock!.runFor(100);
  await app.press("Detail");
  expect(app.texts()).toContain("pages: 1, hasNextPage: true");
});
