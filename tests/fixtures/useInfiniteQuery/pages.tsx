import { mount, Text, View } from "nsh";
import { infiniteQueryOptions, QueryClient, QueryClientProvider, useInfiniteQuery } from "nsh-query";
import { getJson } from "../../support/api";
import { Button } from "../../support/Button";

interface Page {
  items: string[];
  next: number | null;
}

const client = new QueryClient();

const postsOptions = infiniteQueryOptions({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => getJson<Page>(`/posts?page=${pageParam}`),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.next ?? undefined,
});

function Posts() {
  const posts = useInfiniteQuery(() => postsOptions);
  return (
    <View>
      <Text testID="pages">{`pages: ${posts.data?.pages.length ?? 0}`}</Text>
      <Text testID="items">{`items: ${posts.data?.pages.flatMap((page) => page.items).join(",") ?? ""}`}</Text>
      <Text testID="params">{`params: ${posts.data?.pageParams.join(",") ?? ""}`}</Text>
      <Text testID="has-next">{`hasNextPage: ${posts.hasNextPage}`}</Text>
      <Text testID="fetching-next">{`isFetchingNextPage: ${posts.isFetchingNextPage}`}</Text>
      <Text testID="cached">{posts.data ? `cached pages: ${client.getQueryData(postsOptions.queryKey)?.pages.length}` : "cached pages: 0"}</Text>
      <Button label="More" onPress={() => void posts.fetchNextPage()} />
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Posts />
  </QueryClientProvider>
));
