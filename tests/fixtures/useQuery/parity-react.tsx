import { effect, ErrorBoundary, signal, Text, View } from "nsh";
import { keepPreviousData, useQuery } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

const scenarios: Record<string, Scenario> = {
  "should stay idle after a cancelled retry delay (StrictMode: %s)": ({ queryClient }) => {
    const key = createKey();
    const state = useQuery(
      () => ({
        queryKey: key,
        queryFn: () => Promise.reject(new Error("synthetic failure")),
        retry: 1,
        retryDelay: 100,
      }),
      queryClient,
    );
    return (
      <View>
        <Text>{`fetchStatus: ${state.fetchStatus}`}</Text>
        <Button label="cancel" onPress={() => void queryClient.cancelQueries({ queryKey: key })} />
      </View>
    );
  },

  "should not get into an infinite loop when removing a query with gcTime 0 and rerendering": ({ queryClient }) => {
    const key = createKey();
    const rerender = signal(0);
    const state = useQuery(() => {
      rerender();
      return {
        queryKey: key,
        queryFn: () => sleep(5).then(() => "data"),
        gcTime: 0,
        notifyOnChangeProps: ["isPending", "isSuccess", "data"],
      };
    });
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{state.data ?? ""}</Text>
        <Button
          label="remove"
          onPress={() => {
            queryClient.removeQueries({ queryKey: key });
            rerender.update((n) => n + 1);
          }}
        />
      </View>
    );
  },

  "should be able to select a part of the data with select in object syntax": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => ({ name: "test" }),
      select: (data) => data.name,
    }));
    effect(() => log(snapshot(state)));
    return <Text>{state.data ?? ""}</Text>;
  },

  "should not re-run a stable select when it re-renders if selector throws an error": () => {
    const key = createKey();
    const error = new Error("Select Error");
    let runs = 0;
    const rerender = signal(0);
    const select = (): string => {
      runs++;
      throw error;
    };
    const state = useQuery<string, Error>(() => {
      rerender();
      return { queryKey: key, queryFn: () => (runs === 0 ? "test" : "test2"), select };
    });
    return (
      <View>
        <Text>{`error: ${state.error?.message ?? ""}`}</Text>
        <Button label="rerender" onPress={() => rerender.update((n) => n + 1)} />
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Button label="report" onPress={() => log({ runs })} />
      </View>
    );
  },

  "should be able to remove a query": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const rerender = signal(0);
    const state = useQuery(() => {
      rerender();
      return { queryKey: key, queryFn: () => ++count, notifyOnChangeProps: "all" as const };
    });
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Button label="remove" onPress={() => queryClient.removeQueries({ queryKey: key })} />
        <Button label="rerender" onPress={() => rerender.update((n) => n + 1)} />
        <Text>{`data: ${state.data ?? "null"}`}</Text>
      </View>
    );
  },

  "should create a new query when refetching a removed query": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ++count),
      notifyOnChangeProps: "all",
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Button label="remove" onPress={() => queryClient.removeQueries({ queryKey: key })} />
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Text>{`data: ${state.data ?? "null"}`}</Text>
      </View>
    );
  },

  "should not update disabled query when refetching with refetchQueries": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          return count;
        }),
      enabled: false,
    }));
    effect(() => log(snapshot(state)));
    setTimeout(() => void queryClient.refetchQueries({ queryKey: key }), 20);
    return <View />;
  },

  "should keep the previous data when placeholderData is set and select fn transform is used": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => {
      const current = count();
      return {
        queryKey: [key, current],
        queryFn: () => sleep(10).then(() => ({ count: current })),
        select: (data: { count: number }) => data.count,
        placeholderData: keepPreviousData,
      };
    });
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`data: ${state.data ?? ""}`}</Text>
        <Button label="setCount" onPress={() => count.set(1)} />
      </View>
    );
  },

  "should keep the previous queryKey (from prevQuery) between multiple pending queries when placeholderData is set and select fn transform is used":
    () => {
      const key = createKey();
      const count = signal(0);
      log({ key });
      const state = useQuery(() => {
        const current = count();
        return {
          queryKey: [key, current],
          queryFn: () => sleep(10).then(() => ({ count: current })),
          select: (data: { count: number }) => data.count,
          placeholderData: (prevData: { count: number } | undefined, prevQuery: { queryKey: unknown } | undefined) => {
            if (prevQuery) log({ prevKey: prevQuery.queryKey });
            return prevData;
          },
        };
      });
      return (
        <View>
          <Text>{`data: ${state.data ?? ""}`}</Text>
          <Button label="setCount" onPress={() => count.update((n) => n + 1)} />
        </View>
      );
    },

  "should show placeholderData between multiple pending queries when select fn transform is used": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => {
      const current = count();
      return {
        queryKey: [key, current],
        queryFn: () => sleep(10).then(() => ({ count: current })),
        select: (data: { count: number }) => data.count,
        placeholderData: keepPreviousData,
      };
    });
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`data: ${state.data ?? ""}`}</Text>
        <Button label="setCount" onPress={() => count.update((n) => n + 1)} />
      </View>
    );
  },

  "should transition to error state when placeholderData is set": () => {
    const key = createKey();
    function Page(props: { count: number }) {
      const state = useQuery<number, Error>(() => {
        const count = props.count;
        return {
          queryKey: [key, count],
          queryFn: () =>
            sleep(10).then(() => {
              if (count === 2) throw new Error("Error test");
              return Promise.resolve(count);
            }),
          retry: false,
          placeholderData: keepPreviousData,
        };
      });
      effect(() => log(snapshot(state)));
      return (
        <View>
          <Text>{`data: ${state.data ?? ""}`}</Text>
          <Text>{`error: ${state.error?.message ?? ""}`}</Text>
          <Text>{`placeholder data: ${state.isPlaceholderData}`}</Text>
        </View>
      );
    }
    const count = signal(0);
    return (
      <View>
        <Page count={count()} />
        <Button label="next" onPress={() => count.update((n) => n + 1)} />
      </View>
    );
  },

  "should keep the previous data on disabled query when placeholderData is set": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => {
      const current = count();
      return {
        queryKey: [key, current],
        queryFn: () => sleep(10).then(() => current),
        enabled: false,
        placeholderData: keepPreviousData,
        notifyOnChangeProps: "all" as const,
      };
    });
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Button label="setCount" onPress={() => count.set(1)} />
        <Text>{`data: ${state.data ?? "undefined"}`}</Text>
      </View>
    );
  },

  "should re-render disabled observers when other observers trigger a query (#8741)": () => {
    const key = createKey();
    const useUserInfoQuery = (args: () => { id: number | null; enabled: boolean }) =>
      useQuery(() => {
        const { id, enabled } = args();
        return {
          queryKey: [key, id],
          queryFn: () => sleep(10).then(() => ({ id, name: "user" })),
          enabled: !!id && enabled,
        };
      });
    function UserInfo(props: { id: number | null }) {
      const searchQuery = useUserInfoQuery(() => ({ id: props.id, enabled: true }));
      return <Text>{`UserInfo data is ${JSON.stringify(searchQuery.data)} `}</Text>;
    }
    const id = signal<number | null>(null);
    const searchQuery = useUserInfoQuery(() => ({ id: id(), enabled: false }));
    return (
      <View>
        <Text>{`User fetching status is ${searchQuery.fetchStatus}`}</Text>
        <UserInfo id={id()} />
        <Button label="Set ID and trigger user load" onPress={() => id.set(42)} />
      </View>
    );
  },

  "should not re-render when change props are not actively being tracked": () => {
    const key = createKey();
    let fetchCounter = 0;
    let trackChanges = true;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(5).then(() => `fetch counter: ${++fetchCounter}`),
      notifyOnChangeProps: () => (trackChanges ? "all" : []),
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Button label="enableTracking" onPress={() => (trackChanges = true)} />
        <Button label="disableTracking" onPress={() => (trackChanges = false)} />
        <Text>{state.data ?? ""}</Text>
      </View>
    );
  },

  "should throw error if queryFn rejects with a falsy error and throwOnError is in use": () => {
    const key = createKey();
    const options = () => ({
      queryKey: key,
      queryFn: () => Promise.reject(),
      retry: false,
      throwOnError: true,
    });
    function DataPage() {
      const state = useQuery(options);
      return <Text>{`data: ${String(state.data)}`}</Text>;
    }
    function StatusPage() {
      const state = useQuery(options);
      return <Text>{`status: ${state.status}`}</Text>;
    }
    return (
      <View>
        <ErrorBoundary fallback={<Text>data boundary</Text>}>
          <DataPage />
        </ErrorBoundary>
        <ErrorBoundary fallback={<Text>status boundary</Text>}>
          <StatusPage />
        </ErrorBoundary>
      </View>
    );
  },

  "should reset failureCount on successful fetch": () => {
    const key = createKey();
    let counter = 0;
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => {
        if (counter < 2) {
          counter++;
          return Promise.reject(new Error("error"));
        }
        return Promise.resolve("data");
      },
      retryDelay: 10,
    }));
    return (
      <View>
        <Text>{`failureCount ${query.failureCount}`}</Text>
        <Text>{`failureReason ${query.failureReason?.message ?? "null"}`}</Text>
      </View>
    );
  },

  "should show the correct data when switching keys with initialData, placeholderData & staleTime": () => {
    const key = createKey();
    const allTodos = [
      { name: "todo A", priority: "high" },
      { name: "todo B", priority: "medium" },
    ];
    const initialTodos = allTodos;
    const filter = signal("");
    const todos = useQuery(() => {
      const current = filter();
      return {
        queryKey: [...key, current],
        queryFn: () => Promise.resolve(allTodos.filter((todo) => (current ? todo.priority === current : true))),
        initialData: () => (current === "" ? initialTodos : undefined),
        placeholderData: keepPreviousData,
        staleTime: 5000,
      };
    });
    return (
      <View>
        <Text>{`Current Todos, filter: ${filter() || "all"}`}</Text>
        <Button label="All" onPress={() => filter.set("")} />
        <Button label="High" onPress={() => filter.set("high")} />
        <Each of={todos.data ?? []} key={(todo) => todo.name}>
          {(todo) => <Text>{`${todo().name} - ${todo().priority}`}</Text>}
        </Each>
      </View>
    );
  },
};

runScenarios(scenarios);
