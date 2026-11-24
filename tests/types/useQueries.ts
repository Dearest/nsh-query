import { queryOptions, useQueries } from "nsh-query";
import type { UseQueryResult } from "nsh-query";
import { expectType, fetchTodo, fetchTodos } from "./helpers";
import type { Equal, Todo } from "./helpers";

export function useQueriesCases(ids: number[]) {
  // A tuple of queries gives a tuple of results, each typed.
  const [todos, count, user] = useQueries(() => ({
    queries: [
      { queryKey: ["todos"], queryFn: fetchTodos },
      { queryKey: ["todos", "count"], queryFn: fetchTodos, select: (list: Todo[]) => list.length },
      queryOptions({ queryKey: ["users", 1], queryFn: () => Promise.resolve({ name: "Ada" }) }),
    ],
  }));
  expectType<Equal<typeof todos, UseQueryResult<Todo[], Error>>>();
  expectType<Equal<typeof count, UseQueryResult<number, Error>>>();
  expectType<Equal<typeof user, UseQueryResult<{ name: string }, Error>>>();

  // A mapped array gives an array of results.
  const each = useQueries(() => ({
    queries: ids.map((id) => ({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) })),
  }));
  expectType<Equal<typeof each, UseQueryResult<Todo, Error>[]>>();

  // combine decides the result.
  const combined = useQueries(() => ({
    queries: ids.map((id) => ({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) })),
    combine: (results) => ({ titles: results.map((result) => result.data?.title), pending: results.some((r) => r.isPending) }),
  }));
  expectType<Equal<typeof combined, { titles: (string | undefined)[]; pending: boolean }>>();

  useQueries(() => ({
    queries: ids.map((id) => ({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) })),
    // @ts-expect-error combine must return an object or an array: the result is read by property
    combine: (results) => results.length,
  }));
}
