# Pages that are hidden but stay mounted

A page kept mounted while hidden (an inactive tab, a covered pane) should stop following the cache. Pass `subscribed` the page's visibility:

```tsx
function Todos(props: { visible: boolean }) {
  const todos = useQuery(() => ({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    refetchInterval: 10_000,
    subscribed: props.visible,
  }));
  return <Each of={todos.data}>{(todo) => <Text>{todo().title}</Text>}</Each>;
}
```

While `subscribed` is `false`: nothing fetches, polling stops, and updates from elsewhere (`setQueryData`, another component's fetch) do not reach this result, which stays as it was. Back to `true`: the result takes the cache's current state and refetches if the data is stale, as on mount. `useQuery`, `useInfiniteQuery` and `useQueries` take it.

Pick by intent:

| | `enabled: false` | `subscribed: false` |
|---|---|---|
| Use for | "not yet": a query waiting for an id or a login | "not shown": a hidden page |
| Fetches by itself | no | no |
| Shows cache updates from elsewhere | yes | no |
| Keeps the query in the cache | yes, while mounted | no: with no other subscriber the query is collected after `gcTime` |

A page hidden for longer than `gcTime` (5 minutes by default) comes back in the pending state. To have it show data at once after a long time hidden, raise `gcTime` on those queries.

A page that is unmounted when hidden needs none of this: unmounting unsubscribes, and the cache gives the data back in the first frame when it mounts again.
