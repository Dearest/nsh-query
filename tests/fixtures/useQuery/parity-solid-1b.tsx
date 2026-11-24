import { effect, ErrorBoundary, signal, Text, View } from "nsh";
import type { JSX } from "nsh";
import { noop, useQuery } from "nsh-query";
import type { QueryClient, UseQueryResult } from "nsh-query";
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

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

function retryScenario(withCancel: boolean): Scenario {
  return ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    function Page() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            log({ count });
            throw new Error("some error");
          }),
        retry: 2,
        retryDelay: 100,
      }));
      return (
        <View>
          <Text>{`error: ${result.error?.message ?? "null"}`}</Text>
          <Text>{`failureCount: ${result.failureCount}`}</Text>
          <Text>{`failureReason: ${result.failureReason?.message ?? ""}`}</Text>
        </View>
      );
    }
    const show = signal(true);
    return (
      <View>
        <Button label={show() ? "hide" : "show"} onPress={() => show.set(!show())} />
        {withCancel ? <Button label="cancel" onPress={() => void queryClient.cancelQueries({ queryKey: key })} /> : null}
        <If when={show()}>
          <Page />
        </If>
      </View>
    );
  };
}

const scenarios: Record<string, Scenario> = {
  "should not override initial data in dependent queries": () => {
    const key1 = createKey();
    const key2 = createKey();
    const first = useQuery(() => ({
      queryKey: key1,
      queryFn: () => sleep(10).then(() => "data"),
      enabled: false,
      initialData: "init",
    }));
    const second = useQuery(() => ({
      queryKey: key2,
      queryFn: () => sleep(10).then(() => "data"),
      enabled: false,
      initialData: "init",
    }));
    return (
      <View>
        <Text>{`First Data: ${first.data}`}</Text>
        <Text>{`Second Data: ${second.data}`}</Text>
        <Text>{`First Status: ${first.status}`}</Text>
        <Text>{`Second Status: ${second.status}`}</Text>
      </View>
    );
  },

  "should update query options": ({ queryCache }) => {
    const key = createKey();
    const queryFn = () => sleep(10).then(() => "data1");
    useQuery(() => ({ queryKey: key, queryFn, retryDelay: 10 }));
    useQuery(() => ({ queryKey: key, queryFn, retryDelay: 20 }));
    log({ retryDelay: queryCache.find({ queryKey: key })?.options.retryDelay });
    return <View />;
  },

  "should batch re-renders": () => {
    const key = createKey();
    let renders = 0;
    let effectRuns = 0;
    const queryFn = () => sleep(15).then(() => "data");
    function Page() {
      const query1 = useQuery(() => ({ queryKey: key, queryFn }));
      const query2 = useQuery(() => ({ queryKey: key, queryFn }));
      renders++;
      effect(() => {
        void query1.data;
        void query2.data;
        effectRuns++;
      });
      return (
        <View>
          <Text>{`${query1.data ?? ""} ${query2.data ?? ""}`}</Text>
          <Button label="count" onPress={() => log({ renders, effectRuns })} />
        </View>
      );
    }
    return <Page />;
  },

  "should render latest data even if react has discarded certain renders": ({ queryClient }) => {
    const key = createKey();
    const newState = signal("state");
    const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "data") }));
    effect(() => {
      setTimeout(() => {
        queryClient.setQueryData(key, "new");
        newState.set("state");
      }, 10);
    });
    return <Text>{state.data ?? ""}</Text>;
  },

  "should start with status pending, fetchStatus idle if enabled is false": () => {
    const key1 = createKey();
    const key2 = createKey();
    const first = useQuery(() => ({ queryKey: key1, queryFn: () => sleep(10).then(() => "data"), enabled: false }));
    const second = useQuery(() => ({ queryKey: key2, queryFn: () => sleep(10).then(() => "data") }));
    return (
      <View>
        <Text>{`First Status: ${first.status}, ${first.fetchStatus}`}</Text>
        <Text>{`Second Status: ${second.status}, ${second.fetchStatus}`}</Text>
      </View>
    );
  },

  'should be in "pending" state by default': () => {
    const key = createKey();
    const query = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }));
    return <Text>{`status: ${query.status}`}</Text>;
  },

  "should not refetch query on focus when `enabled` is set to `false`": () => {
    const key = createKey();
    let calls = 0;
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => {
        calls++;
        log({ calls });
        return "data";
      },
      enabled: false,
    }));
    return <Text>{query.data ?? "default"}</Text>;
  },

  "should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => count++),
      staleTime: 0,
      refetchOnWindowFocus: false,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false`": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => count++),
      staleTime: 0,
      refetchOnWindowFocus: () => false,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => count++),
      staleTime: Infinity,
      refetchOnWindowFocus: true,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always`": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => count++),
      staleTime: Infinity,
      refetchOnWindowFocus: "always",
    }));
    effect(() => log(snapshot(state)));
    return <Text>{`data: ${state.data}, isFetching: ${String(state.isFetching)}`}</Text>;
  },

  "should calculate focus behavior for refetchOnWindowFocus depending on function": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => count++),
      staleTime: 0,
      retry: 0,
      refetchOnWindowFocus: (query) => (query.state.data || 0) < 1,
    }));
    effect(() => log(snapshot(state)));
    return <Text>{`data: ${state.data}`}</Text>;
  },

  "should refetch fresh query when refetchOnMount is set to always": ({ queryClient }) => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => "data"),
        refetchOnMount: "always",
        staleTime: Infinity,
      }));
      effect(() => log(snapshot(state)));
      return <View />;
    }
    return afterPrefetch(queryClient, key, "prefetched", Page);
  },

  "should refetch stale query when refetchOnMount is set to true": ({ queryClient }) => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => "data"),
        refetchOnMount: true,
        staleTime: 0,
      }));
      effect(() => log(snapshot(state)));
      return <View />;
    }
    return afterPrefetch(queryClient, key, "prefetched", Page);
  },

  "should set status to error if queryFn throws": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error("Error test"))),
      retry: false,
    }));
    return (
      <View>
        <Text>{state.status}</Text>
        <Text>{state.error?.message ?? ""}</Text>
      </View>
    );
  },

  "should throw error if queryFn throws and throwOnError is in use": () => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => Promise.reject(new Error("Error test"))),
        retry: false,
        throwOnError: true,
      }));
      return (
        <View>
          <Text>{state.data ?? ""}</Text>
          <Text>{state.status}</Text>
          <Text>{state.error?.message ?? ""}</Text>
        </View>
      );
    }
    return (
      <ErrorBoundary fallback={() => <Text>error boundary</Text>}>
        <Page />
      </ErrorBoundary>
    );
  },

  "should throw error inside the same component if queryFn throws and throwOnError is in use": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error("Error test"))),
      retry: false,
      throwOnError: true,
    }));
    return (
      <View>
        <ErrorBoundary fallback={() => <Text>error boundary</Text>}>
          <Text>{state.data ?? ""}</Text>
          <Text>{state.status}</Text>
          <Text>{state.error?.message ?? ""}</Text>
        </ErrorBoundary>
      </View>
    );
  },

  "should throw error inside the same component if queryFn throws and show the correct error message": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error("Error test"))),
      retry: false,
      throwOnError: true,
    }));
    return (
      <View>
        <ErrorBoundary fallback={(err) => <Text>{`Fallback error: ${message(err)}`}</Text>}>
          <Text>{state.data ?? ""}</Text>
          <Text>{state.status}</Text>
          <Text>{state.error?.message ?? ""}</Text>
        </ErrorBoundary>
      </View>
    );
  },

  "should show the correct error message on the error property when accessed outside error boundary": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error("Error test"))),
      retry: false,
      throwOnError: true,
    }));
    return (
      <View>
        <Text>{`Outside error boundary: ${state.error?.message ?? ""}`}</Text>
        <ErrorBoundary fallback={(err) => <Text>{`Fallback error: ${message(err)}`}</Text>}>
          <Text>{state.data ?? ""}</Text>
          <Text>{state.status}</Text>
        </ErrorBoundary>
      </View>
    );
  },

  "should update with data if we observe no properties and throwOnError": ({ queryClient }) => {
    const key = createKey();
    let result: UseQueryResult<string> | undefined;
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      throwOnError: true,
    }));
    effect(() => {
      result = query;
    });
    return <Button label="read" onPress={() => log({ data: result?.data, isFetching: queryClient.isFetching() })} />;
  },

  "should set status to error instead of throwing when error should not be thrown": () => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => Promise.reject(new Error("Local Error"))),
        retry: false,
        throwOnError: (err) => err.message !== "Local Error",
      }));
      return (
        <View>
          <Text>{state.status}</Text>
          <Text>{state.error?.message ?? ""}</Text>
        </View>
      );
    }
    return (
      <ErrorBoundary fallback={() => <Text>error boundary</Text>}>
        <Page />
      </ErrorBoundary>
    );
  },

  "should throw error instead of setting status when error should be thrown": () => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => Promise.reject(new Error("Remote Error"))),
        retry: false,
        throwOnError: (err) => err.message !== "Local Error",
      }));
      return (
        <View>
          <Text>{state.data ?? ""}</Text>
          <Text>{state.status}</Text>
          <Text>{state.error?.message ?? ""}</Text>
        </View>
      );
    }
    return (
      <ErrorBoundary
        fallback={(error) => (
          <View>
            <Text>error boundary</Text>
            <Text>{message(error)}</Text>
          </View>
        )}
      >
        <Page />
      </ErrorBoundary>
    );
  },

  "should continue retries when observers unmount and remount while waiting for a retry (#3031)": retryScenario(false),

  "should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031)":
    retryScenario(true),

  "should always fetch if refetchOnMount is set to always": ({ queryClient }) => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => "data"),
        refetchOnMount: "always",
        staleTime: 50,
      }));
      effect(() => log(snapshot(state)));
      return (
        <View>
          <Text>{`data: ${state.data ?? "null"}`}</Text>
          <Text>{`isFetching: ${state.isFetching}`}</Text>
          <Text>{`isStale: ${state.isStale}`}</Text>
        </View>
      );
    }
    return afterPrefetch(queryClient, key, "prefetched", Page);
  },

  "should fetch if initial data is set": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      initialData: "initial",
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should keep initialData visible alongside the error when a refetch fails": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error("Some error"))),
      initialData: "initial",
      retry: false,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not fetch if initial data is set with a stale time": () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      staleTime: 50,
      initialData: "initial",
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should fetch if initial data updated at is older than stale time": () => {
    const key = createKey();
    const oneSecondAgo = Date.now() - 1000;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      staleTime: 50,
      initialData: "initial",
      initialDataUpdatedAt: oneSecondAgo,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  'should fetch if "initial data updated at" is exactly 0': () => {
    const key = createKey();
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => "data"),
      staleTime: 10 * 1000,
      initialData: "initial",
      initialDataUpdatedAt: 0,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should keep initial data when the query key changes": () => {
    const key = createKey();
    const count = signal(0);
    const state = useQuery(() => ({
      queryKey: [...key, count()],
      queryFn: () => sleep(10).then(() => ({ count: 10 })),
      staleTime: Infinity,
      initialData: () => ({ count: count() }),
    }));
    effect(() => log(snapshot(state)));
    setTimeout(() => count.set(1), 10);
    return <View />;
  },

  "should retry specified number of times": () => {
    const key = createKey();
    let calls = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => {
        calls++;
        log({ calls });
        return sleep(10).then(() => Promise.reject(new Error("Error test Barrett")));
      },
      retry: 1,
      retryDelay: 1,
    }));
    return (
      <View>
        <Text>{state.status}</Text>
        <Text>{`Failed ${state.failureCount} times`}</Text>
        <Text>{`Failed because ${state.failureReason?.message ?? ""}`}</Text>
      </View>
    );
  },
};

runScenarios(scenarios);
