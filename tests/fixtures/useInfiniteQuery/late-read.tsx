import { effect, mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "nsh-query";
import { getJson } from "../../support/api";
import { Button } from "../../support/Button";

interface Page {
  items: string[];
  next: number | null;
}

const client = new QueryClient();
const detail = signal(false);

// `data` and `hasNextPage` are first read in a branch that opens once the
// first page is there.
function Posts() {
  const posts = useInfiniteQuery(() => ({
    queryKey: ["posts"],
    queryFn: ({ pageParam }) => getJson<Page>(`/posts?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage: Page) => lastPage.next ?? undefined,
    staleTime: Infinity,
  }));
  effect(() => {
    if (posts.error) console.error(posts.error);
  });
  return (
    <View>
      <Button label="Detail" onPress={() => detail.set(true)} />
      {detail() ? <Text>{`pages: ${posts.data?.pages.length ?? 0}, hasNextPage: ${posts.hasNextPage}`}</Text> : null}
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Posts />
  </QueryClientProvider>
));
