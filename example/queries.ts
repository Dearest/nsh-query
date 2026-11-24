import { infiniteQueryOptions, mutationOptions, queryOptions } from "nsh-query";
import { addTodo, fetchOnline, fetchPosts, fetchTodo, fetchTodos } from "./api";

export const todosQuery = queryOptions({ queryKey: ["todos"], queryFn: fetchTodos });

export const todoQuery = (id: number) => queryOptions({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) });

export const onlineQuery = queryOptions({ queryKey: ["online"], queryFn: fetchOnline, refetchInterval: 5000 });

export const postsQuery = infiniteQueryOptions({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.next ?? undefined,
});

export const addTodoMutation = mutationOptions({ mutationKey: ["todos", "add"], mutationFn: addTodo });
