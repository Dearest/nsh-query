import { skipToken, useQueries, useQuery } from "nsh-query";
import type { DefinedUseQueryResult, UseQueryResult } from "nsh-query";
import { expectType, fetchTodo, fetchTodos } from "./helpers";
import type { Equal, Todo } from "./helpers";

export function useQueryCases(props: { id: number | undefined }) {
  // data may be undefined until the query succeeds.
  const todo = useQuery(() => ({ queryKey: ["todos", props.id], queryFn: () => fetchTodo(props.id!) }));
  expectType<Equal<typeof todo, UseQueryResult<Todo, Error>>>();
  expectType<Equal<typeof todo.data, Todo | undefined>>();
  if (todo.isSuccess) expectType<Equal<typeof todo.data, Todo>>();

  // initialData makes data defined.
  const todos = useQuery(() => ({ queryKey: ["todos"], queryFn: fetchTodos, initialData: [] as Todo[] }));
  expectType<Equal<typeof todos, DefinedUseQueryResult<Todo[], Error>>>();
  expectType<Equal<typeof todos.data, Todo[]>>();

  // initialData as a function that may return undefined does not.
  const maybe = useQuery(() => ({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    initialData: (): Todo[] | undefined => undefined,
  }));
  expectType<Equal<typeof maybe.data, Todo[] | undefined>>();

  // select changes the type of data.
  const count = useQuery(() => ({ queryKey: ["todos"], queryFn: fetchTodos, select: (list) => list.length }));
  expectType<Equal<typeof count.data, number | undefined>>();
  const titles = useQuery(() => ({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    initialData: [] as Todo[],
    select: (list) => list.map((item) => item.title),
  }));
  expectType<Equal<typeof titles.data, string[]>>();

  // skipToken keeps the queryFn's data type.
  const skipped = useQuery(() => ({
    queryKey: ["todos", props.id],
    queryFn: props.id === undefined ? skipToken : () => fetchTodo(props.id!),
  }));
  expectType<Equal<typeof skipped.data, Todo | undefined>>();

  // A typed error.
  const typedError = useQuery<Todo[], TypeError>(() => ({ queryKey: ["todos"], queryFn: fetchTodos }));
  expectType<Equal<typeof typedError.error, TypeError | null>>();

  // @ts-expect-error options are a function, not an object
  useQuery({ queryKey: ["todos"], queryFn: fetchTodos });
}

export function subscribedCases(ids: number[]) {
  useQuery(() => ({ queryKey: ["todos"], queryFn: fetchTodos, subscribed: false }));
  // @ts-expect-error subscribed is a boolean
  useQuery(() => ({ queryKey: ["todos"], queryFn: fetchTodos, subscribed: "no" }));

  useQueries(() => ({ queries: ids.map((id) => ({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) })), subscribed: false }));
  // @ts-expect-error subscribed is a boolean
  useQueries(() => ({ queries: [{ queryKey: ["todos"], queryFn: fetchTodos }], subscribed: 1 }));
}
