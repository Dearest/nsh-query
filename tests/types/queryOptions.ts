import { QueryClient, queryOptions, useQuery } from "nsh-query";
import type { DefinedUseQueryResult, UseQueryResult } from "nsh-query";
import { expectType, fetchTodo, fetchTodos } from "./helpers";
import type { Equal, Todo } from "./helpers";

export function queryOptionsCases(client: QueryClient) {
  const todoOptions = (id: number) => queryOptions({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) });

  // The key carries the data type: imperative reads are typed.
  const cached = client.getQueryData(todoOptions(1).queryKey);
  expectType<Equal<typeof cached, Todo | undefined>>();

  // The same options feed useQuery and the client.
  const todo = useQuery(() => todoOptions(1));
  expectType<Equal<typeof todo, UseQueryResult<Todo, Error>>>();
  void client.prefetchQuery(todoOptions(2));

  // With initialData, data is never undefined.
  const withInitial = queryOptions({ queryKey: ["todos"], queryFn: fetchTodos, initialData: [] as Todo[] });
  const list = useQuery(() => withInitial);
  expectType<Equal<typeof list, DefinedUseQueryResult<Todo[], Error>>>();
  expectType<Equal<typeof list.data, Todo[]>>();

  // @ts-expect-error queryKey is required
  queryOptions({ queryFn: fetchTodos });

  queryOptions({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    // @ts-expect-error initialData must match what queryFn returns
    initialData: "nope",
  });
}
