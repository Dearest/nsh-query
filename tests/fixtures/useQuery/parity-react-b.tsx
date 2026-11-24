import { computed, effect, ErrorBoundary, signal, Text, View } from "nsh";
import type { JSX, ViewRef } from "nsh";
import { IsRestoringContext, keepPreviousData, skipToken, useQuery } from "nsh-query";
import type { Query } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

/** Shows `children` while `shown()`; the "toggle" button unmounts and mounts them again. */
function Toggle(props: { children: () => JSX.Element }) {
  const shown = signal(true);
  return (
    <View>
      <Button label="toggle" onPress={() => shown.update((value) => !value)} />
      <If when={shown()}>{() => props.children()}</If>
    </View>
  );
}

const describeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

const scenarios: Record<string, Scenario> = {
  "should only run select when dependencies change if memoized": () => {
    const key = createKey();
    let selectRun = 0;
    const count = signal(2);
    const state = useQuery(() => {
      const current = count();
      return {
        queryKey: key,
        queryFn: () => sleep(10).then(() => 0),
        select: (data: number) => {
          selectRun++;
          return `selected ${data + current}`;
        },
        placeholderData: 99,
      };
    });
    return (
      <View>
        <Text>{`Data: ${state.data ?? ""}`}</Text>
        <Button label="inc" onPress={() => count.update((n) => n + 1)} />
        <Button label="report" onPress={() => log({ selectRun })} />
      </View>
    );
  },

  "should only call the query hash function once each render": () => {
    const key = createKey();
    let hashes = 0;
    let evaluations = 0;
    const rerender = signal(0);
    const queryKeyHashFn = (value: unknown) => {
      hashes++;
      return JSON.stringify(value);
    };
    const state = useQuery(() => {
      rerender();
      evaluations++;
      return { queryKey: key, queryFn: () => "test", queryKeyHashFn };
    });
    return (
      <View>
        <Text>{`data: ${state.data ?? ""}`}</Text>
        <Button label="rerender" onPress={() => rerender.update((n) => n + 1)} />
        <Button label="report" onPress={() => log({ hashes, evaluations })} />
      </View>
    );
  },

  "should hash query keys that contain bigints given a supported query hash function": ({ queryClient }) => {
    const key = [createKey(), 1n];
    const queryKeyHashFn = (value: unknown) =>
      JSON.stringify(value, (_, item: unknown) => (typeof item === "bigint" ? item.toString() : item));
    useQuery(() => ({ queryKey: key, queryFn: () => "test", queryKeyHashFn }));
    return (
      <Button
        label="report"
        onPress={() => log({ data: queryClient.getQueryCache().get(queryKeyHashFn(key))?.state.data })}
      />
    );
  },

  "should be notified of updates between create and subscribe": ({ queryClient }) => {
    const key = createKey();
    const state = useQuery(() => ({
      enabled: false,
      queryKey: key,
      queryFn: () => sleep(10).then(() => 5),
    }));
    queryClient.setQueryData(key, 1);
    return (
      <View>
        <Text>{`status: ${state.status}`}</Text>
        <Text>{`data: ${state.data ?? ""}`}</Text>
      </View>
    );
  },

  "should reuse same data object reference when queryKey changes back to some cached data": () => {
    const key = createKey();
    const fetchNumber = (id: number) => sleep(5).then(() => ({ numbers: { current: { id } } }));
    const selector = (data: { numbers: { current: { id: number } } }) => data.numbers.current;
    const id = signal(1);
    const state = useQuery(() => {
      const current = id();
      return { select: selector, queryKey: [key, "user", current], queryFn: () => fetchNumber(current) };
    });
    const data = computed(() => state.data);
    effect(() => log({ spy: data() }));
    return (
      <View>
        <Button label="id 1" onPress={() => id.set(1)} />
        <Button label="id 2" onPress={() => id.set(2)} />
        <Text>{`Rendered Id: ${state.data?.id ?? ""}`}</Text>
      </View>
    );
  },

  "should reuse same data object reference when queryKey changes and placeholderData is present": () => {
    const key = createKey();
    const fetchNumber = (id: number) => sleep(5).then(() => ({ numbers: { current: { id } } }));
    const selector = (data: { numbers: { current: { id: number } } }) => data.numbers.current;
    const id = signal(1);
    const state = useQuery(() => {
      const current = id();
      return {
        select: selector,
        queryKey: [key, "user", current],
        queryFn: () => fetchNumber(current),
        placeholderData: { numbers: { current: { id: 99 } } },
      };
    });
    const data = computed(() => state.data);
    effect(() => log({ spy: data() }));
    return (
      <View>
        <Button label="id 1" onPress={() => id.set(1)} />
        <Button label="id 2" onPress={() => id.set(2)} />
        <Text>{`Rendered Id: ${state.data?.id ?? ""}`}</Text>
      </View>
    );
  },

  "should not cause an infinite render loop when using unstable callback ref": () => {
    const key = createKey();
    const ref = signal<ViewRef | undefined>(undefined);
    const state = useQuery(() => ({ queryKey: [key], queryFn: () => sleep(5).then(() => "Works") }));
    return (
      <View ref={(value) => ref.set(value)}>
        <Text>{state.data ?? ""}</Text>
      </View>
    );
  },

  "should keep the previous data when placeholderData is set and cache is used": () => {
    const key = createKey();
    const steps = [0, 1, 0, 2];
    const count = signal(0);
    const state = useQuery(() => {
      const step = steps[count()];
      return {
        staleTime: Infinity,
        queryKey: [key, step],
        queryFn: () => sleep(10).then(() => step),
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

  "should throw in case of bad arguments to enhance DevX": () => {
    const key = createKey();
    const queryFn = () => "data";
    function Page() {
      // @ts-expect-error: an invalid call on purpose
      useQuery(key, { queryFn });
      return <Text>Does not matter</Text>;
    }
    return (
      <ErrorBoundary fallback={(error) => <Text>{`thrown: ${describeError(error)}`}</Text>}>
        <Page />
      </ErrorBoundary>
    );
  },

  "should respect skipToken and refetch when skipToken is taken away": () => {
    const key = createKey();
    function Page(props: { enabled: boolean }) {
      const state = useQuery(() => ({
        queryKey: [key],
        queryFn: props.enabled ? () => sleep(10).then(() => Promise.resolve("data")) : skipToken,
        retry: false,
        retryOnMount: () => false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      }));
      return (
        <View>
          <Text>{`status: ${state.status}`}</Text>
          <Text>{`data: ${String(state.data)}`}</Text>
        </View>
      );
    }
    const enabled = signal(false);
    return (
      <View>
        <Page enabled={enabled()} />
        <Button label="enable" onPress={() => enabled.update((value) => !value)} />
      </View>
    );
  },

  "should allow enabled: true and queryFn: skipToken": () => {
    const key = createKey();
    const query = useQuery(() => ({ queryKey: key, queryFn: skipToken, enabled: true }));
    return <Text>{`status: ${query.status}, fetchStatus: ${query.fetchStatus}`}</Text>;
  },

  "should return correct optimistic result when fetching after error": () => {
    const key = createKey();
    const error = new Error("oh no");
    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => Promise.reject(error)),
        retry: false,
        notifyOnChangeProps: "all",
      }));
      effect(() => log(snapshot(query)));
      return (
        <View>
          <Text>{`status: ${query.status}, ${query.fetchStatus}`}</Text>
          <Text>{`error: ${query.error?.message ?? ""}`}</Text>
        </View>
      );
    }
    return <Toggle>{() => <Page />}</Toggle>;
  },

  "should retry on mount when throwOnError returns false": () => {
    const key = createKey();
    let fetchCount = 0;
    const queryFn = () => {
      fetchCount++;
      return Promise.reject(new Error("Simulated 500 error"));
    };
    function Component() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        throwOnError: () => false,
        retryOnMount: () => true,
        staleTime: Infinity,
        retry: false,
      }));
      return (
        <View>
          <Text testID="status">{`status: ${state.status}`}</Text>
          <If when={state.error}>
            <Text testID="error">{`error: ${state.error?.message ?? ""}`}</Text>
          </If>
        </View>
      );
    }
    return (
      <View>
        <Toggle>{() => <Component />}</Toggle>
        <Button label="report" onPress={() => log({ fetchCount })} />
      </View>
    );
  },

  "should retry on mount when throwOnError returns false for a falsy error": () => {
    const key = createKey();
    let calls = 0;
    const queryFn = () => {
      calls++;
      return Promise.reject();
    };
    function Component() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        throwOnError: () => false,
        retryOnMount: () => true,
        staleTime: Infinity,
        retry: false,
      }));
      return <Text testID="status">{`status: ${state.status}`}</Text>;
    }
    return (
      <View>
        <Toggle>{() => <Component />}</Toggle>
        <Button label="report" onPress={() => log({ calls })} />
      </View>
    );
  },

  "should not retry on mount when throwOnError function returns true": () => {
    const key = createKey();
    let fetchCount = 0;
    const queryFn = () => {
      fetchCount++;
      return Promise.reject(new Error("Simulated 500 error"));
    };
    function Component() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        throwOnError: () => true,
        retryOnMount: () => true,
        staleTime: Infinity,
        retry: false,
      }));
      return (
        <View>
          <Text>{`data: ${state.data ?? ""}`}</Text>
          <Text testID="status">{`status: ${state.status}`}</Text>
          <If when={state.error}>
            <Text testID="error">{`error: ${state.error?.message ?? ""}`}</Text>
          </If>
        </View>
      );
    }
    const fallback = (error: unknown) => (
      <View>
        <Text testID="status">status: error</Text>
        <Text testID="error">{`error: ${error instanceof Error ? error.message : ""}`}</Text>
      </View>
    );
    return (
      <View>
        <Toggle>
          {() => (
            <ErrorBoundary fallback={fallback}>
              <Component />
            </ErrorBoundary>
          )}
        </Toggle>
        <Button label="report" onPress={() => log({ fetchCount })} />
      </View>
    );
  },

  "should handle throwOnError function based on actual error state": () => {
    const key = createKey();
    let fetchCount = 0;
    const queryFn = () => {
      fetchCount++;
      return Promise.reject(new Error("Simulated 500 error"));
    };
    function Component() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        throwOnError: (error: Error) => error.message.includes("404"),
        retryOnMount: true,
        staleTime: Infinity,
        retry: false,
      }));
      return (
        <View>
          <Text testID="status">{`status: ${state.status}`}</Text>
          <If when={state.error}>
            <Text testID="error">{`error: ${state.error?.message ?? ""}`}</Text>
          </If>
        </View>
      );
    }
    return (
      <View>
        <Toggle>{() => <Component />}</Toggle>
        <Button label="report" onPress={() => log({ fetchCount })} />
      </View>
    );
  },

  "should pass the query to retryOnMount callback": ({ queryClient }) => {
    const key = createKey();
    let queryFnCalls = 0;
    const queryFn = () => {
      queryFnCalls++;
      return Promise.reject(new Error("oops"));
    };
    const retryOnMount = (query: Query) => {
      log({
        retryOnMount: {
          isCachedQuery: query === queryClient.getQueryCache().find({ queryKey: key }),
          status: query.state.status,
          data: query.state.data,
        },
      });
      return query.state.status !== "error";
    };
    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn, retry: false, retryOnMount }));
      return <Text>{state.status}</Text>;
    }
    return (
      <View>
        <Toggle>{() => <Page />}</Toggle>
        <Button label="report" onPress={() => log({ queryFnCalls })} />
      </View>
    );
  },

  "should not call retryOnMount callback when the query has data": () => {
    const key = createKey();
    let count = 0;
    let queryFnCalls = 0;
    let retryOnMountCalls = 0;
    const retryOnMount = () => {
      retryOnMountCalls++;
      return false;
    };
    const queryFn = async () => {
      queryFnCalls++;
      await sleep(10);
      count++;
      if (count === 1) return "data";
      throw new Error("oops");
    };
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        retry: false,
        staleTime: 0,
        refetchOnMount: true,
        retryOnMount,
      }));
      return (
        <View>
          <Text>{state.data ?? "no data"}</Text>
          <Text>{state.error instanceof Error ? state.error.message : "no error"}</Text>
          <Button label="refetch" onPress={() => void state.refetch()} />
        </View>
      );
    }
    return (
      <View>
        <Toggle>{() => <Page />}</Toggle>
        <Button label="report" onPress={() => log({ queryFnCalls, retryOnMountCalls })} />
      </View>
    );
  },

  "should not fetch for the duration of the restoring period when isRestoring is true": () => {
    const key = createKey();
    let queryFnCalls = 0;
    const queryFn = () => {
      queryFnCalls++;
      return sleep(10).then(() => "data");
    };
    function Page() {
      const result = useQuery(() => ({ queryKey: key, queryFn }));
      return (
        <View>
          <Text testID="status">{`status: ${result.status}`}</Text>
          <Text testID="fetchStatus">{`fetchStatus: ${result.fetchStatus}`}</Text>
          <Text testID="data">{`data: ${result.data ?? "undefined"}`}</Text>
        </View>
      );
    }
    return (
      <View>
        {IsRestoringContext.Provider({
          value: () => true,
          get children() {
            return <Page />;
          },
        })}
        <Button label="report" onPress={() => log({ queryFnCalls })} />
      </View>
    );
  },

  "should not loop when a query with select and keepPreviousData is disabled": () => {
    const key = createKey();
    const id = signal("a");
    const state = useQuery(() => {
      const current = id();
      return {
        queryKey: [...key, current],
        queryFn: () => [current],
        enabled: current !== "",
        placeholderData: keepPreviousData,
        select: (items: string[]) => items.find((item) => item === current),
      };
    });
    return <Button label={`picked: ${state.data ?? "none"}`} onPress={() => id.set("")} />;
  },

  "should settle as placeholder data when select maps keepPreviousData to undefined": () => {
    const key = createKey();
    const id = signal("a");
    const state = useQuery(() => {
      const current = id();
      return {
        queryKey: [...key, current],
        queryFn: () => [current],
        enabled: current !== "",
        placeholderData: keepPreviousData,
        select: (items: string[]) => items.find((item) => item === current),
      };
    });
    effect(() => log(snapshot(state)));
    return <Button label={`status: ${state.status}`} onPress={() => id.set("")} />;
  },
};

runScenarios(scenarios);
