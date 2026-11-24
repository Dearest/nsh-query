import { List, Text, View } from "nsh";
import { useInfiniteQuery } from "nsh-query";
import { postsQuery } from "../queries";

export function Feed() {
  const posts = useInfiniteQuery(() => postsQuery);
  const items = () => posts.data?.pages.flatMap((page) => page.posts) ?? [];
  // Scrolling near the end loads the next page.
  const loadMore = () => {
    if (posts.hasNextPage && !posts.isFetchingNextPage) void posts.fetchNextPage();
  };
  return (
    <View class="flex-1">
      <Text class="px-4 text-sm text-muted-foreground">
        {posts.isPending
          ? "Loading posts"
          : posts.isFetchingNextPage
            ? `${items().length} posts, loading more`
            : posts.hasNextPage
              ? `${items().length} posts`
              : `All ${items().length} posts`}
      </Text>
      <List
        class="flex-1"
        testID="feed"
        contentClass="gap-2 p-4"
        each={items()}
        keyExtractor={(post) => String(post.id)}
        onLoadMore={loadMore}
      >
        {(post) => (
          <View class="rounded-md bg-card p-3">
            <Text class="text-card-foreground">{post().title}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
