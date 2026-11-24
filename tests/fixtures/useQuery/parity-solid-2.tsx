import { computed, effect, signal, Text, View } from "nsh";
import type { JSX } from "nsh";
import { noop, useQuery } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

function GcScenario(props: { gcTime: number }): JSX.Element {
  const key = createKey();
  const show = signal(true);
  function Page() {
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "fetched data"),
      gcTime: props.gcTime,
    }));
    return <Text>{query.data ?? ""}</Text>;
  }
  const unmount = () => {
    const delays: unknown[] = [];
    const original = globalThis.setTimeout;
    globalThis.setTimeout = ((handler: (...args: any[]) => void, timeout?: number, ...args: any[]) => {
      delays.push(timeout);
      return original(handler, timeout, ...args);
    }) as typeof setTimeout;
    try {
      show.set(false);
    } finally {
      globalThis.setTimeout = original;
    }
    log({ setTimeoutDelays: delays });
  };
  return (
    <View>
      <If when={show()}>
        <Page />
      </If>
      <Button label="unmount" onPress={unmount} />
    </View>
  );
}

const scenarios: Record<string, Scenario> = {
  "should not retry if retry function `false`": () => {
    const key = createKey();
    let calls = 0;
    const queryFn = () => {
      calls++;
      const message = calls === 1 ? "Error test first" : "NoRetry";
      log({ queryFnCalls: calls });
      return sleep(10).then(() => Promise.reject(new Error(message)));
    };
    const state = useQuery<unknown, Error>(() => ({
      queryKey: key,
      queryFn,
      retryDelay: 1,
      retry: (_failureCount, err) => err.message !== "NoRetry",
    }));
    return (
      <View>
        <Text>{state.status}</Text>
        <Text>{`Failed ${state.failureCount} times`}</Text>
        <Text>{`Failed because ${state.failureReason?.message ?? ""}`}</Text>
        <Text>{state.error?.message ?? ""}</Text>
      </View>
    );
  },

  "should extract retryDelay from error": () => {
    const key = createKey();
    type DelayError = { delay: number };
    let calls = 0;
    const state = useQuery<unknown, DelayError>(() => ({
      queryKey: key,
      queryFn: async () => {
        calls++;
        log({ queryFnCalls: calls });
        await sleep(10);
        throw { delay: 50 };
      },
      retry: 1,
      retryDelay: (_, error: DelayError) => error.delay,
    }));
    return (
      <View>
        <Text>{state.status}</Text>
        <Text>{`Failed ${state.failureCount} times`}</Text>
        <Text>{`Failed because DelayError: ${state.failureReason?.delay ?? ""}ms`}</Text>
      </View>
    );
  },

  "should continue retry after focus regain": () => {
    const key = createKey();
    let count = 0;
    const query = useQuery<unknown, string>(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          throw `fetching error ${count}`;
        }),
      retry: 3,
      retryDelay: 1,
    }));
    return (
      <View>
        <Text>{`error ${String(query.error)}`}</Text>
        <Text>{`status ${query.status}`}</Text>
        <Text>{`failureCount ${query.failureCount}`}</Text>
        <Text>{`failureReason ${query.failureReason ?? ""}`}</Text>
      </View>
    );
  },

  "should fetch on mount when a query was already created with setQueryData": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData(key, "prefetched");
    const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "data") }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should refetch after focus regain": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData(key, "prefetched");
    const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "data") }));
    effect(() => log(snapshot(state)));
    return <Text>{`${state.data ?? ""}, ${state.isStale}, ${state.isFetching}`}</Text>;
  },

  "should refetch if stale after a prefetch": ({ queryClient }) => {
    const key = createKey();
    let queryFnCalls = 0;
    let prefetchCalls = 0;
    void queryClient
      .query({
        queryKey: key,
        queryFn: () => {
          prefetchCalls++;
          return "not yet...";
        },
        staleTime: 10,
      })
      .catch(noop);
    const show = signal(false);
    setTimeout(() => show.set(true), 10);
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => {
          queryFnCalls++;
          return "data";
        },
      }));
      effect(() => log(snapshot(state)));
      return <View />;
    }
    return (
      <View>
        <If when={show()}>
          <Page />
        </If>
        <Button label="report" onPress={() => log({ prefetchCalls, queryFnCalls })} />
      </View>
    );
  },

  "should not refetch if not stale after a prefetch": ({ queryClient }) => {
    const key = createKey();
    let queryFnCalls = 0;
    let prefetchCalls = 0;
    void queryClient
      .query({
        queryKey: key,
        queryFn: () => {
          prefetchCalls++;
          return sleep(10).then(() => "not yet...");
        },
        staleTime: 1000,
      })
      .catch(noop);
    const show = signal(false);
    setTimeout(() => show.set(true), 10);
    function Page() {
      useQuery(() => ({
        queryKey: key,
        queryFn: () => {
          queryFnCalls++;
          return sleep(10).then(() => "data");
        },
        staleTime: 1000,
      }));
      return <View />;
    }
    return (
      <View>
        <If when={show()}>
          <Page />
        </If>
        <Button label="report" onPress={() => log({ prefetchCalls, queryFnCalls })} />
      </View>
    );
  },

  "should reset failureCount and failureReason on successful fetch": () => {
    const key = createKey();
    let counter = 0;
    const query = useQuery<unknown, Error>(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          if (counter < 2) {
            counter++;
            throw new Error("error");
          }
          return "data";
        }),
      retryDelay: 10,
    }));
    return (
      <View>
        <Text>{`failureCount ${query.failureCount}`}</Text>
        <Text>{`failureReason ${query.failureReason?.message ?? "null"}`}</Text>
      </View>
    );
  },

  "should use prefetched data for dependent query": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const enabled = signal(false);
    const isPrefetched = signal(false);
    const query = useQuery<unknown>(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          log({ count });
          return count;
        }),
      enabled: enabled(),
    }));
    effect(() => {
      void queryClient
        .query({ queryKey: key, queryFn: () => Promise.resolve("prefetched data") })
        .catch(noop)
        .then(() => isPrefetched.set(true));
    });
    return (
      <View>
        <If when={isPrefetched()}>
          <Text>isPrefetched</Text>
        </If>
        <Button label="setKey" onPress={() => enabled.set(true)} />
        <Text>{`data: ${String(query.data ?? "")}`}</Text>
      </View>
    );
  },

  "should support dependent queries via the enable config option": () => {
    const key = createKey();
    const shouldFetch = signal(false);
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      enabled: shouldFetch(),
    }));
    return (
      <View>
        <Text>{`FetchStatus: ${query.fetchStatus}`}</Text>
        <Text>{`Data: ${query.data || "no data"}`}</Text>
        <If when={!shouldFetch()}>
          <Button label="fetch" onPress={() => shouldFetch.set(true)} />
        </If>
      </View>
    );
  },

  "should cleanup observers after component that created the query is unmounted in race condition #1": ({
    queryClient,
  }) => {
    const key = createKey();
    function Component() {
      let val = 1;
      const dataQuery = useQuery(() => ({ queryKey: [key], queryFn: () => sleep(10).then(() => val++) }));
      return (
        <View>
          <Text>component</Text>
          <Text>{`data: ${String(dataQuery.data)}`}</Text>
        </View>
      );
    }
    const showComp = signal(true);
    return (
      <View>
        <Button
          label="toggle"
          onPress={() => {
            void queryClient.invalidateQueries();
            showComp.set(!showComp());
          }}
        />
        <If when={showComp()} else={<Text>not showing</Text>}>
          <Component />
        </If>
        <Button
          label="observers"
          onPress={() => log({ observers: queryClient.getQueryCache().find({ queryKey: [key] })!.getObserversCount() })}
        />
      </View>
    );
  },

  "should cleanup observers after component that created the query is unmounted in race condition #2": ({
    queryClient,
  }) => {
    const key = createKey();
    function Component() {
      let val = 1;
      const dataQuery = useQuery(() => ({ queryKey: [key], queryFn: () => sleep(10).then(() => val++) }));
      return (
        <View>
          <Text>component</Text>
          <Text>{`data: ${String(dataQuery.data)}`}</Text>
        </View>
      );
    }
    const showComp = signal(true);
    return (
      <View>
        <Button
          label="toggle"
          onPress={() => {
            queueMicrotask(() => showComp.set(!showComp()));
            void queryClient.invalidateQueries();
          }}
        />
        <If when={showComp()} else={<Text>not showing</Text>}>
          <Component />
        </If>
        <Button
          label="observers"
          onPress={() => log({ observers: queryClient.getQueryCache().find({ queryKey: [key] })!.getObserversCount() })}
        />
      </View>
    );
  },

  "should mark query as fetching, when using initialData": () => {
    const key = createKey();
    const result = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "serverData"),
      initialData: "initialData",
    }));
    effect(() => log(snapshot(result)));
    return <Text>{`data: ${result.data}`}</Text>;
  },

  "should initialize state properly, when initialData is falsy": () => {
    const key = createKey();
    const result = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 1),
      initialData: 0,
    }));
    effect(() => log(snapshot(result)));
    return <View />;
  },

  "should persist data when enabled is changed to false": () => {
    const key = createKey();
    const shouldFetch = signal(true);
    const result = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "fetched data"),
      enabled: shouldFetch(),
      initialData: shouldFetch() ? "initial" : "initial falsy",
    }));
    effect(() => log(snapshot(result)));
    setTimeout(() => shouldFetch.set(false), 15);
    return (
      <View>
        <Text>{result.data}</Text>
        <Text>{shouldFetch() ? "enabled" : "disabled"}</Text>
      </View>
    );
  },

  "should support enabled:false in query object syntax": ({ queryCache }) => {
    const key = createKey();
    let queryFnCalls = 0;
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => {
        queryFnCalls++;
        return "data";
      },
      enabled: false,
    }));
    return (
      <View>
        <Text>{`fetchStatus: ${query.fetchStatus}`}</Text>
        <Button
          label="report"
          onPress={() => log({ queryFnCalls, found: queryCache.find({ queryKey: key }) !== undefined })}
        />
      </View>
    );
  },

  "should init to status:pending, fetchStatus:idle when enabled is false": () => {
    const key = createKey();
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      enabled: false,
    }));
    return <Text>{`status: ${query.status}, ${query.fetchStatus}`}</Text>;
  },

  "should not schedule garbage collection, if gcTimeout is set to `Infinity`": () => <GcScenario gcTime={Infinity} />,

  "should schedule garbage collection, if gcTimeout is not set to `Infinity`": () => (
    <GcScenario gcTime={10 * 60 * 1000} />
  ),

  "should not cause memo churn when data does not change": () => {
    const key = createKey();
    let queryFnCalls = 0;
    let memoRuns = 0;
    let memoConsumerRuns = 0;
    const result = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          queryFnCalls++;
          return "data";
        }),
    }));
    const memo = computed(() => {
      memoRuns++;
      return result.data;
    });
    effect(() => {
      memo();
      memoConsumerRuns++;
    });
    return (
      <View>
        <Text>{`status ${result.status}`}</Text>
        <Text>{`isFetching ${result.isFetching ? "true" : "false"}`}</Text>
        <Button label="refetch" onPress={() => void result.refetch()} />
        <Button label="report" onPress={() => log({ queryFnCalls, memoRuns, memoConsumerRuns })} />
      </View>
    );
  },

  "should update data upon interval changes": () => {
    const key = createKey();
    let count = 0;
    const int = signal(200);
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => count++),
      refetchInterval: int(),
    }));
    effect(() => {
      if (state.data === 2) int.set(0);
    });
    return <Text>{`count: ${state.data}`}</Text>;
  },

  "should refetch in an interval depending on function result": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => count++),
      refetchInterval: ({ state: { data = 0 } }) => (data < 2 ? 10 : false),
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`count: ${state.data}`}</Text>
        <Text>{`status: ${state.status}`}</Text>
        <Text>{`refetch: ${state.isRefetching}`}</Text>
      </View>
    );
  },

  "should not interval fetch with a refetchInterval of 0": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 1),
      refetchInterval: 0,
    }));
    effect(() => log(snapshot(state)));
    return <Text>{`count: ${state.data}`}</Text>;
  },

  "should accept an empty string as query key": () => {
    const result = useQuery(() => ({ queryKey: [""], queryFn: (ctx) => sleep(10).then(() => ctx.queryKey) }));
    return <Text>{JSON.stringify(result.data) ?? ""}</Text>;
  },

  "should accept an object as query key": () => {
    const result = useQuery(() => ({ queryKey: [{ a: "a" }], queryFn: (ctx) => sleep(10).then(() => ctx.queryKey) }));
    return <Text>{JSON.stringify(result.data) ?? ""}</Text>;
  },

  "should refetch if any query instance becomes enabled": () => {
    const key = createKey();
    let queryFnCalls = 0;
    const shared = sleep(10).then(() => "data");
    const queryFn = () => {
      queryFnCalls++;
      return shared;
    };
    function Disabled() {
      useQuery(() => ({ queryKey: key, queryFn, enabled: false }));
      return <View />;
    }
    const enabled = signal(false);
    const result = useQuery(() => ({ queryKey: key, queryFn, enabled: enabled() }));
    return (
      <View>
        <Disabled />
        <Text>{result.data ?? ""}</Text>
        <Button label="enable" onPress={() => enabled.set(true)} />
        <Button label="report" onPress={() => log({ queryFnCalls })} />
      </View>
    );
  },

  "should use placeholder data while the query loads": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      placeholderData: "placeholder",
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`Data: ${state.data}`}</Text>
        <Text>{`Status: ${state.status}`}</Text>
      </View>
    );
  },

  "should use placeholder data even for disabled queries": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      placeholderData: "placeholder",
      enabled: count() === 0,
    }));
    effect(() => log({ state: snapshot(state), count: count() }));
    effect(() => count.set(1));
    return (
      <View>
        <Text>{`Data: ${state.data}`}</Text>
        <Text>{`Status: ${state.status}`}</Text>
      </View>
    );
  },

  "should run placeholder data through select": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 1),
      placeholderData: 23,
      select: (data) => String(data * 2),
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`Data: ${state.data}`}</Text>
        <Text>{`Status: ${state.status}`}</Text>
      </View>
    );
  },

  "should run placeholder data function result through select": () => {
    const key = createKey();
    let placeholderFunctionRunCount = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 1),
      placeholderData: () => {
        placeholderFunctionRunCount++;
        return 23;
      },
      select: (data) => String(data * 2),
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Text>{`Data: ${state.data}`}</Text>
        <Text>{`Status: ${state.status}`}</Text>
        <Button label="report" onPress={() => log({ placeholderFunctionRunCount })} />
      </View>
    );
  },

  "should always return the correct state from select": () => {
    const key = createKey();
    const count = signal(2);
    const forceValue = signal(1);
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 0),
      get select() {
        const currentCount = count();
        return (data: number) => `selected ${data + currentCount}`;
      },
      placeholderData: 99,
    }));
    return (
      <View>
        <Text>{`Data: ${state.data}`}</Text>
        <Text>{`forceValue: ${forceValue()}`}</Text>
        <Button label="inc" onPress={() => count.set(count() + 1)} />
        <Button label="forceUpdate" onPress={() => forceValue.set(forceValue() + 1)} />
      </View>
    );
  },

  "should structurally share data in select": () => {
    const key = createKey();
    const forceValue = signal(1);
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => [1, 2]),
      select: (res) => res.map((x) => x + 1),
    }));
    effect(() => {
      if (state.data) log({ selected: state.data });
    });
    return (
      <View>
        <Text>{`Data: ${JSON.stringify(state.data)}`}</Text>
        <Text>{`forceValue: ${forceValue()}`}</Text>
        <Button label="forceUpdate" onPress={() => forceValue.set(forceValue() + 1)} />
      </View>
    );
  },
};

runScenarios(scenarios);
