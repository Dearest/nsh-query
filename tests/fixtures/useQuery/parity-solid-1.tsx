import { effect, signal, Text, View } from "nsh";
import type { JSX } from "nsh";
import { keepPreviousData, noop, useQuery } from "nsh-query";
import type { QueryClient } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

function afterPrefetch(queryClient: QueryClient, key: string[], value: string, Page: () => JSX.Element) {
  const ready = signal(false);
  void queryClient
    .query({ queryKey: key, queryFn: () => sleep(10).then(() => value) })
    .catch(noop)
    .then(() => ready.set(true));
  return (
    <If when={ready()}>
      <Page />
    </If>
  );
}

const scenarios: Record<string, Scenario> = {
  "should allow to set default data value": () => {
    const key = createKey();
    const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }));
    return <Text>{state.data ?? "default"}</Text>;
  },

  "should return the correct states for a successful query": () => {
    const key = createKey();
    const state = useQuery<string, Error>(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }));
    effect(() => log(snapshot(state)));
    return <Text>{state.isPending ? "pending" : (state.data ?? "")}</Text>;
  },

  "should return the correct states for an unsuccessful query": () => {
    const key = createKey();
    let index = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error(`rejected #${++index}`))),
      retry: 1,
      retryDelay: 1,
    }));
    effect(() => log(snapshot(state)));
    return <Text>{`Status: ${state.status}`}</Text>;
  },

  "should set isFetchedAfterMount to true after a query has been fetched": ({ queryClient }) => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "data") }));
      effect(() => log(snapshot(state)));
      return (
        <View>
          <Text>{`data: ${state.data ?? ""}`}</Text>
          <Text>{`isFetched: ${state.isFetched}`}</Text>
          <Text>{`isFetchedAfterMount: ${state.isFetchedAfterMount}`}</Text>
        </View>
      );
    }
    return afterPrefetch(queryClient, key, "prefetched", Page);
  },

  "should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already": () => {
    const key = createKey();
    let fetchCount = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          fetchCount++;
          log({ fetchCount });
          return "data";
        }),
      enabled: false,
      initialData: "initialData",
    }));
    setTimeout(() => void state.refetch(), 5);
    setTimeout(() => void state.refetch({ cancelRefetch: false }), 5);
    return <View />;
  },

  "should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already": () => {
    const key = createKey();
    let fetchCount = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          fetchCount++;
          log({ fetchCount });
          return "data";
        }),
      enabled: false,
      initialData: "initialData",
    }));
    setTimeout(() => void state.refetch(), 5);
    setTimeout(() => void state.refetch(), 5);
    return <View />;
  },

  "should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet": () => {
    const key = createKey();
    let fetchCount = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          fetchCount++;
          log({ fetchCount });
          return "data";
        }),
      enabled: false,
    }));
    setTimeout(() => void state.refetch(), 5);
    setTimeout(() => void state.refetch(), 5);
    return <View />;
  },

  "should be able to watch a query without providing a query function": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryDefaults(key, { queryFn: () => sleep(10).then(() => "data") });
    const state = useQuery<string>(() => ({ queryKey: key }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should pick up a query when re-mounting with gcTime 0": () => {
    const key = createKey();
    const toggle = signal(false);
    function Component(props: { value: string }) {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => "data: " + props.value),
        gcTime: 0,
      }));
      effect(() => log(snapshot(state)));
      return <Text>{state.data ?? ""}</Text>;
    }
    return (
      <View>
        <Button label="toggle" onPress={() => toggle.set(true)} />
        <If when={toggle()}>
          <Component value="2" />
        </If>
        <If when={!toggle()}>
          <Component value="1" />
        </If>
      </View>
    );
  },

  "should fetch when refetchOnMount is false and nothing has been fetched yet": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "test"),
      refetchOnMount: false,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not fetch when refetchOnMount is false and data has been fetched already": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData(key, "prefetched");
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "test"),
      refetchOnMount: false,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should be able to select a part of the data with select": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ name: "test" })),
      select: (data) => data.name,
    }));
    effect(() => log(snapshot(state)));
    return <Text>{state.data ?? ""}</Text>;
  },

  "should be able to select a part of the data with select in object syntax 2": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ name: "test" })),
      select: (data) => data.name,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should be able to select a part of the data with select in object syntax 1": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ name: "test" })),
      select: (data) => data.name,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not re-render when it should only re-render only data change and the selected data did not change": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ name: "test" })),
      select: (data) => data.name,
      notifyOnChangeProps: ["data"],
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`data: ${state.data ?? ""}`}</Text>
        <Button label="refetch" onPress={() => void state.refetch()} />
      </View>
    );
  },

  "should throw an error when a selector throws": () => {
    const key = createKey();
    const selectError = new Error("Select Error");
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ name: "test" })),
      select: (): string => {
        throw selectError;
      },
    }));
    effect(() => {
      if (state.status === "pending") log({ status: "pending", data: undefined });
      else if (state.status === "error") log({ status: "error", error: state.error });
    });
    return <Text>{state.status}</Text>;
  },

  "should track properties and only re-render when a tracked property changes": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          return "test" + count;
        }),
    }));
    effect(() => log({ data: state.data }));
    return (
      <View>
        <Text>{state.data ?? ""}</Text>
        <Button label="refetch" onPress={() => void state.refetch()} />
      </View>
    );
  },

  "should always re-render if we are tracking props but not using any": () => {
    const key = createKey();
    let renderCount = 0;
    const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }));
    effect(() => log(["state", snapshot(state)]));
    effect(() => {
      snapshot(state);
      renderCount++;
      log(["renderCount", renderCount]);
    });
    return <Text>hello</Text>;
  },

  "should share equal data structures between query results": () => {
    const key = createKey();
    const result1 = [
      { id: "1", done: false },
      { id: "2", done: false },
    ];
    const result2 = [
      { id: "1", done: false },
      { id: "2", done: true },
    ];
    let count = 0;
    const datas: Array<typeof result1 | undefined> = [];
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          return count === 1 ? result1 : result2;
        }),
    }));
    effect(() => {
      const current = snapshot(state);
      datas.push(current.data);
      log(current);
    });
    return (
      <View>
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Button
          label="compare"
          onPress={() => {
            const todos = datas[2];
            const newTodos = datas[3];
            log({
              sameTodos: newTodos === todos,
              sameTodo1: newTodos?.[0] === todos?.[0],
              sameTodo2: newTodos?.[1] === todos?.[1],
              newTodosIsResult2: newTodos === result2,
            });
          }}
        />
        <Text>{`data: ${String(state.data?.[1]?.done)}`}</Text>
      </View>
    );
  },

  "should use query function from hook when the existing query does not have a query function": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData(key, "set");
    const result = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "fetched"),
      initialData: "initial",
      staleTime: Infinity,
    }));
    effect(() => log(snapshot(result)));
    return (
      <View>
        <Text>{`isFetching: ${result.isFetching}`}</Text>
        <Button label="refetch" onPress={() => void queryClient.refetchQueries({ queryKey: key })} />
        <Text>{`data: ${result.data}`}</Text>
      </View>
    );
  },

  "should update query stale state and refetch when invalidated with invalidateQueries": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          return count;
        }),
      staleTime: Infinity,
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Button label="invalidate" onPress={() => void queryClient.invalidateQueries({ queryKey: key })} />
        <Text>{`data: ${state.data}, isStale: ${state.isStale}, isFetching: ${state.isFetching}`}</Text>
      </View>
    );
  },

  "should not update disabled query when refetch with refetchQueries": ({ queryClient }) => {
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

  "should not refetch disabled query when invalidated with invalidateQueries": ({ queryClient }) => {
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
    setTimeout(() => void queryClient.invalidateQueries({ queryKey: key }), 20);
    return <View />;
  },

  "should not fetch when switching to a disabled query": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => ({
      queryKey: [...key, count()],
      queryFn: () => sleep(5).then(() => count()),
      enabled: count() === 0,
    }));
    effect(() => log(snapshot(state)));
    setTimeout(() => count.set(1), 10);
    return (
      <View>
        <Text>{`data: ${state.data ?? "undefined"}`}</Text>
        <Text>{`count: ${count()}`}</Text>
      </View>
    );
  },

  "should keep the previous data when placeholderData is set": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => ({
      queryKey: [...key, count()],
      queryFn: () => sleep(10).then(() => count()),
      placeholderData: keepPreviousData,
    }));
    effect(() => log(snapshot(state)));
    setTimeout(() => count.set(1), 20);
    return <Text>{`data: ${state.data}`}</Text>;
  },

  "should not show initial data from next query if placeholderData is set": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => ({
      queryKey: [...key, count()],
      queryFn: () => sleep(10).then(() => count()),
      initialData: 99,
      placeholderData: keepPreviousData,
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`data: ${state.data}, count: ${count()}, isFetching: ${String(state.isFetching)}`}</Text>
        <Button label="inc" onPress={() => count.set(1)} />
      </View>
    );
  },

  "should keep the previous data on disabled query when placeholderData is set and switching query key multiple times":
    ({ queryClient }) => {
      const key = createKey();
      queryClient.setQueryData([...key, 10], 10);
      const count = signal(10);
      const state = useQuery(() => ({
        queryKey: [...key, count()],
        queryFn: () => sleep(10).then(() => count()),
        enabled: false,
        placeholderData: keepPreviousData,
        notifyOnChangeProps: "all",
      }));
      effect(() => log(snapshot(state)));
      setTimeout(() => count.set(11), 20);
      setTimeout(() => count.set(12), 30);
      setTimeout(() => void state.refetch(), 40);
      return <View />;
    },

  "should use the correct query function when components use different configurations": () => {
    const key = createKey();
    function FirstComponent() {
      const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => 1) }));
      effect(() => log(snapshot(state)));
      return (
        <View>
          <Button label="refetch" onPress={() => void state.refetch()} />
          <Text>{`data: ${state.data}`}</Text>
        </View>
      );
    }
    function SecondComponent() {
      useQuery(() => ({ queryKey: key, queryFn: () => sleep(15).then(() => 2) }));
      return <View />;
    }
    return (
      <View>
        <FirstComponent />
        <SecondComponent />
      </View>
    );
  },

  "should be able to set different stale times for a query": ({ queryClient }) => {
    const key = createKey();
    const ready = signal(false);
    void queryClient
      .query({ queryKey: key, queryFn: () => sleep(10).then(() => "prefetch") })
      .catch(noop);
    setTimeout(() => ready.set(true), 20);
    function FirstComponent() {
      const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "one"), staleTime: 100 }));
      effect(() => log(["states1", snapshot(state)]));
      return <View />;
    }
    function SecondComponent() {
      const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "two"), staleTime: 10 }));
      effect(() => log(["states2", snapshot(state)]));
      return <View />;
    }
    return (
      <If when={ready()}>
        <View>
          <FirstComponent />
          <SecondComponent />
        </View>
      </If>
    );
  },

  "should re-render when a query becomes stale": () => {
    const key = createKey();
    const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test"), staleTime: 50 }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not re-render when it should only re-render on data changes and the data did not change": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(5).then(() => "test"),
      notifyOnChangeProps: ["data"],
    }));
    effect(() => log(snapshot(state)));
    setTimeout(() => void state.refetch(), 10);
    return <Text>{state.data ?? ""}</Text>;
  },

  "function › should not re-render when it should only re-render on data changes and the data did not change": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(5).then(() => "test"),
      notifyOnChangeProps: () => ["data"],
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Text>{state.data ?? ""}</Text>
      </View>
    );
  },
};

runScenarios(scenarios);
