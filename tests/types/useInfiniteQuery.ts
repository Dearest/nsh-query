import { infiniteQueryOptions, QueryClient, useInfiniteQuery } from "nsh-query";
import type { InfiniteData, UseInfiniteQueryResult } from "nsh-query";
import { expectType } from "./helpers";
import type { Equal } from "./helpers";

interface Page {
  items: string[];
  next: number | null;
}

declare function fetchPage(page: number): Promise<Page>;

export function infiniteCases(client: QueryClient) {
  const options = infiniteQueryOptions({
    queryKey: ["posts"],
    queryFn: ({ pageParam }) => {
      expectType<Equal<typeof pageParam, number>>();
      return fetchPage(pageParam);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
  });
  const cached = client.getQueryData(options.queryKey);
  expectType<Equal<typeof cached, InfiniteData<Page, unknown> | undefined>>();

  const posts = useInfiniteQuery(() => options);
  expectType<Equal<typeof posts, UseInfiniteQueryResult<InfiniteData<Page, unknown>, Error>>>();
  expectType<Equal<typeof posts.data, InfiniteData<Page, unknown> | undefined>>();
  expectType<Equal<typeof posts.hasNextPage, boolean>>();

  const items = useInfiniteQuery(() => ({
    ...options,
    select: (data) => data.pages.flatMap((page) => page.items),
  }));
  expectType<Equal<typeof items.data, string[] | undefined>>();

  const seeded = useInfiniteQuery(() => ({ ...options, initialData: { pages: [], pageParams: [] } }));
  expectType<Equal<typeof seeded.data, InfiniteData<Page, unknown>>>();

  // @ts-expect-error initialPageParam is required
  useInfiniteQuery(() => ({
    queryKey: ["posts"],
    queryFn: ({ pageParam }: { pageParam: number }) => fetchPage(pageParam),
    getNextPageParam: (lastPage: Page) => lastPage.next ?? undefined,
  }));
}
