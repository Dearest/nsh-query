import { cleanup, effect, signal, Text, untracked, View } from "nsh";
import type { JSX } from "nsh";
import {
  IsRestoringContext,
  noop,
  QueryClient,
  QueryClientContext,
  skipToken,
  useQuery,
} from "nsh-query";
import type { QueryFunction } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

/** Shows its children for `duration` ms, then "off" (upstream's `Blink`). */
function Blink(props: { duration: number; children: JSX.Element }): JSX.Element {
  const shouldShow = signal(true);
  const timeout = setTimeout(() => shouldShow.set(false), props.duration);
  cleanup(() => clearTimeout(timeout));
  return (
    <If when={shouldShow()} else={<Text>off</Text>}>
      {props.children}
    </If>
  );
}

/** Mounts its children when "mount" is pressed and unmounts them when "hide" is. */
function Mounter(props: { children: JSX.Element }): JSX.Element {
  const show = signal(false);
  return (
    <View>
      <If when={show()}>{props.children}</If>
      <Button label="mount" onPress={() => show.set(true)} />
      <Button label="hide" onPress={() => show.set(false)} />
    </View>
  );
}

const scenarios: Record<string, Scenario> = {
  "should cancel the query function when there are no more subscriptions": () => {
    const key = createKey();
    const queryFn = ({ signal: abortSignal }: { signal: AbortSignal }) =>
      new Promise<string>((resolve, reject) => {
        abortSignal.addEventListener("abort", (event) => {
          log({ abortEvent: event.type });
          reject("Cancelled");
        });
        void sleep(20).then(() => resolve("OK"));
      });
    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn }));
      return <Text>{`Status: ${state.status}`}</Text>;
    }
    return (
      <Blink duration={5}>
        <Page />
      </Blink>
    );
  },

  "should cancel the query if the signal was consumed and there are no more subscriptions": ({ queryCache }) => {
    const key = createKey();
    const queryFn: QueryFunction<string, readonly [string[], number]> = async (ctx) => {
      const [, limit] = ctx.queryKey;
      const value = limit % 2 && ctx.signal ? "abort" : `data ${limit}`;
      await sleep(25);
      return value;
    };
    function Page(props: { limit: number }) {
      const state = useQuery(() => ({ queryKey: [key, props.limit] as const, queryFn }));
      log({ mounted: props.limit });
      return (
        <View>
          <Text>{`Status: ${state.status}`}</Text>
          <Text>{`data: ${state.data ?? ""}`}</Text>
        </View>
      );
    }
    const report = () => {
      const states = [0, 1, 2, 3].map((limit) => {
        const state = queryCache.find({ queryKey: [key, limit] })?.state;
        return state && {
          data: state.data ?? null,
          status: state.status,
          fetchStatus: state.fetchStatus,
          dataUpdateCount: state.dataUpdateCount,
        };
      });
      log({ states });
    };
    return (
      <View>
        <Blink duration={5}>
          <Page limit={0} />
          <Page limit={1} />
          <Page limit={2} />
          <Page limit={3} />
        </Blink>
        <Button label="report" onPress={report} />
      </View>
    );
  },

  "should refetch when quickly switching to a failed query": () => {
    const key = createKey();
    const queryFn = () => sleep(50).then(() => "OK");
    const id = signal(1);
    const hasChanged = signal(false);
    const state = useQuery(() => ({ queryKey: [key, id()], queryFn }));
    effect(() => log(snapshot(state)));
    effect(() => {
      hasChanged();
      untracked(() => {
        id.set(id() === 1 ? 2 : 1);
        hasChanged.set(true);
      });
    });
    return <View />;
  },

  "should update query state and refetch when reset with resetQueries": ({ queryClient }) => {
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
        <Button label="reset" onPress={() => void queryClient.resetQueries({ queryKey: key })} />
        <Text>{`data: ${state.data ?? "null"}`}</Text>
        <Text>{`isFetching: ${state.isFetching}`}</Text>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should update query state and not refetch when resetting a disabled query with resetQueries": ({ queryClient }) => {
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
      enabled: false,
      notifyOnChangeProps: "all",
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Button label="reset" onPress={() => void queryClient.resetQueries({ queryKey: key })} />
        <Text>{`data: ${state.data ?? "null"}`}</Text>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should only call the query hash function once": () => {
    const key = createKey();
    let hashes = 0;
    function queryKeyHashFn(x: any) {
      hashes++;
      return JSON.stringify(x);
    }
    useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test"), queryKeyHashFn }));
    return <Button label="report" onPress={() => log({ hashes })} />;
  },

  "should refetch when changed enabled to true in error state": () => {
    const key = createKey();
    let queryFnCalls = 0;
    const queryFn = () => {
      queryFnCalls++;
      log({ queryFnCalls });
      return sleep(10).then(() => Promise.reject(new Error("Suspense Error Bingo")));
    };
    function Page(props: { enabled: boolean }) {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        enabled: props.enabled,
        retry: false,
        retryOnMount: () => false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      }));
      return <Text>{state.isPending ? "status: pending" : state.error instanceof Error ? "error" : "rendered"}</Text>;
    }
    const enabled = signal(true);
    return (
      <View>
        <Page enabled={enabled()} />
        <Button label="retry" onPress={() => enabled.set(!enabled())} />
      </View>
    );
  },

  "should refetch when query key changed when previous status is error": () => {
    function Page(props: { id: number }) {
      const state = useQuery(() => ({
        queryKey: [props.id],
        queryFn: () => sleep(10).then(() => (props.id % 2 === 1 ? Promise.reject(new Error("Error")) : "data")),
        retry: false,
        retryOnMount: () => false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      }));
      return <Text>{state.isPending ? "status: pending" : state.error instanceof Error ? "error" : "rendered"}</Text>;
    }
    const id = signal(1);
    return (
      <View>
        <Page id={id()} />
        <Button label="change" onPress={() => id.set(id() + 1)} />
      </View>
    );
  },

  "should refetch when query key changed when switching between erroneous queries": () => {
    function Page(props: { id: boolean }) {
      const state = useQuery(() => ({
        queryKey: [props.id],
        queryFn: () => sleep(10).then(() => Promise.reject(new Error("Error"))),
        retry: false,
        retryOnMount: () => false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      }));
      return (
        <Text>{state.isFetching ? "status: fetching" : state.error instanceof Error ? "error" : "rendered"}</Text>
      );
    }
    const value = signal(true);
    return (
      <View>
        <Page id={value()} />
        <Button label="change" onPress={() => value.set(!value())} />
      </View>
    );
  },

  "should have no error in pending state when refetching after error occurred": () => {
    const key = createKey();
    const error = new Error("oops");
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          if (count === 0) {
            count++;
            throw error;
          }
          return 5;
        }),
      retry: false,
    }));
    effect(() => log(snapshot(state)));
    return (
      <If when={!state.isPending} else={<Text>status: pending</Text>}>
        <If when={state.error instanceof Error} else={<Text>{`data: ${state.data}`}</Text>}>
          <View>
            <Text>error</Text>
            <Button label="refetch" onPress={() => void state.refetch()} />
          </View>
        </If>
      </If>
    );
  },

  "should not start fetching online queries if you are offline": () => {
    const key = createKey();
    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "data") }));
      effect(() => log({ fetchStatus: state.fetchStatus }));
      return (
        <View>
          <Text>{`status: ${state.status}, isPaused: ${String(state.isPaused)}`}</Text>
          <Text>{`data: ${state.data ?? ""}`}</Text>
        </View>
      );
    }
    return (
      <Mounter>
        <Page />
      </Mounter>
    );
  },

  "should not refetch online queries if you are offline": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const state = useQuery<unknown, string, string>(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          return "data" + count;
        }),
    }));
    return (
      <View>
        <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}, failureCount: ${state.failureCount}`}</Text>
        <Text>{`failureReason: ${state.failureReason ?? "null"}`}</Text>
        <Text>{`data: ${state.data ?? ""}`}</Text>
        <Button label="invalidate" onPress={() => void queryClient.invalidateQueries({ queryKey: key })} />
      </View>
    );
  },

  "should not refetch online queries if you are offline and refocus": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          return "data" + count;
        }),
    }));
    return (
      <View>
        <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
        <Text>{`data: ${state.data ?? ""}`}</Text>
        <Button label="invalidate" onPress={() => void queryClient.invalidateQueries({ queryKey: key })} />
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should not refetch online queries while already paused": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            return "data" + count;
          }),
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
          <Text>{`data: ${state.data ?? ""}`}</Text>
          <Button label="invalidate" onPress={() => void queryClient.invalidateQueries({ queryKey: key })} />
        </View>
      );
    }
    return (
      <View>
        <Mounter>
          <Page />
        </Mounter>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should not refetch online queries while already paused if data is in the cache": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            return "data" + count;
          }),
        initialData: "initial",
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
          <Text>{`data: ${state.data}`}</Text>
          <Button label="invalidate" onPress={() => void queryClient.invalidateQueries({ queryKey: key })} />
        </View>
      );
    }
    return (
      <View>
        <Mounter>
          <Page />
        </Mounter>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should not get online queries stuck in fetching state when pausing multiple times": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            return "data" + count;
          }),
        initialData: "initial",
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
          <Text>{`data: ${state.data}`}</Text>
          <Button label="invalidate" onPress={() => void queryClient.invalidateQueries({ queryKey: key })} />
        </View>
      );
    }
    return (
      <View>
        <Mounter>
          <Page />
        </Mounter>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should pause retries of online queries if you are offline": () => {
    const key = createKey();
    let count = 0;
    const state = useQuery<unknown, Error>(() => ({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => {
          count++;
          throw new Error("failed" + count);
        }),
      retry: 2,
      retryDelay: 10,
    }));
    return (
      <View>
        <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}, failureCount: ${state.failureCount}`}</Text>
        <Text>{`failureReason: ${state.failureReason?.message ?? "null"}`}</Text>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should not fetch online queries if paused initial load and we go online after unmount": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    function Component() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async ({ signal: _signal }) => {
          count++;
          await sleep(10);
          return `signal${count}`;
        },
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
          <Text>{`data: ${state.data ?? ""}`}</Text>
        </View>
      );
    }
    const report = () => {
      const state = queryClient.getQueryState(key);
      log({ count, fetchStatus: state?.fetchStatus, status: state?.status });
    };
    return (
      <View>
        <Mounter>
          <Component />
        </Mounter>
        <Button label="report" onPress={report} />
      </View>
    );
  },

  "should re-fetch online queries if paused and we go online even if already unmounted (because not cancelled)": ({
    queryClient,
  }) => {
    const key = createKey();
    let count = 0;
    queryClient.setQueryData(key, "initial");
    function Component() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          count++;
          await sleep(10);
          return "data" + count;
        },
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
          <Text>{`data: ${state.data}`}</Text>
        </View>
      );
    }
    const report = () => {
      const state = queryClient.getQueryState(key);
      log({ count, fetchStatus: state?.fetchStatus, status: state?.status });
    };
    return (
      <View>
        <Mounter>
          <Component />
        </Mounter>
        <Button label="report" onPress={report} />
      </View>
    );
  },

  "should not fetch online queries if paused and we go online when cancelled and no refetchOnReconnect": ({
    queryClient,
  }) => {
    const key = createKey();
    let count = 0;
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            return "data" + count;
          }),
        refetchOnReconnect: false,
      }));
      return (
        <View>
          <Button label="cancel" onPress={() => void queryClient.cancelQueries({ queryKey: key })} />
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
          <Text>{`data: ${state.data ?? ""}`}</Text>
        </View>
      );
    }
    return (
      <View>
        <Mounter>
          <Page />
        </Mounter>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should fetch online queries if paused and we go online even if already unmounted when refetch was not cancelled": ({
    queryClient,
  }) => {
    const key = createKey();
    let count = 0;
    function Component() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => {
          count++;
          return Promise.resolve(`data${count}`);
        },
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}`}</Text>
          <Text>{`data: ${state.data ?? ""}`}</Text>
        </View>
      );
    }
    const show = signal(true);
    const report = () => {
      const state = queryClient.getQueryState(key);
      log({ count, fetchStatus: state?.fetchStatus, status: state?.status });
    };
    return (
      <View>
        <If when={show()}>
          <Component />
        </If>
        <Button label="hide" onPress={() => show.set(false)} />
        <Button label="invalidate" onPress={() => void queryClient.invalidateQueries({ queryKey: key })} />
        <Button label="report" onPress={report} />
      </View>
    );
  },

  "should start fetching always queries even if you are offline": () => {
    const key = createKey();
    let count = 0;
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            return "data " + count;
          }),
        networkMode: "always",
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, isPaused: ${String(state.isPaused)}`}</Text>
          <Text>{`data: ${state.data ?? ""}`}</Text>
        </View>
      );
    }
    return (
      <Mounter>
        <Page />
      </Mounter>
    );
  },

  "should not pause retries of always queries": () => {
    const key = createKey();
    let count = 0;
    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            throw new Error("error " + count);
          }),
        networkMode: "always",
        retry: 1,
        retryDelay: 5,
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, isPaused: ${String(state.isPaused)}`}</Text>
          <Text>{`error: ${state.error instanceof Error ? state.error.message : ""}`}</Text>
        </View>
      );
    }
    return (
      <View>
        <Mounter>
          <Page />
        </Mounter>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should start fetching offlineFirst queries if you are offline, but pause retries": () => {
    const key = createKey();
    let count = 0;
    function Page() {
      const state = useQuery<unknown, Error>(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            count++;
            throw new Error("failed" + count);
          }),
        retry: 2,
        retryDelay: 1,
        networkMode: "offlineFirst",
      }));
      return (
        <View>
          <Text>{`status: ${state.status}, fetchStatus: ${state.fetchStatus}, failureCount: ${state.failureCount}`}</Text>
          <Text>{`failureReason: ${state.failureReason?.message ?? "null"}`}</Text>
        </View>
      );
    }
    return (
      <View>
        <Mounter>
          <Page />
        </Mounter>
        <Button label="report" onPress={() => log({ count })} />
      </View>
    );
  },

  "should have status=error on mount when a query has failed": ({ queryClient }) => {
    const key = createKey();
    const error = new Error("oops");
    const queryFn = () => sleep(10).then(() => Promise.reject(error));
    void queryClient.query({ queryKey: key, queryFn }).catch(noop);
    const show = signal(false);
    setTimeout(() => show.set(true), 10);
    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn, retry: false, retryOnMount: () => false }));
      effect(() => log(snapshot(state)));
      return <View />;
    }
    return (
      <If when={show()}>
        <Page />
      </If>
    );
  },

  "should respect updatedAt in setQueryData": ({ queryClient }) => {
    const key = createKey();
    const state = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "data") }));
    return (
      <View>
        <Text>{`data: ${state.data ?? ""}`}</Text>
        <Text>{`dataUpdatedAt: ${state.dataUpdatedAt}`}</Text>
        <Button label="setQueryData" onPress={() => queryClient.setQueryData(key, "newData", { updatedAt: 100 })} />
      </View>
    );
  },

  "should increase errorUpdateCount on each fetch failure": () => {
    const key = createKey();
    const error = new Error("oops");
    const state = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(error)),
      retry: false,
    }));
    return (
      <View>
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Text>{`data: ${state.errorUpdateCount}`}</Text>
      </View>
    );
  },

  "should not fetch while restoring and refetch after restoring is complete": () => {
    const key = createKey();
    let queryFnCalls = 0;
    const isRestoring = signal(true);
    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => {
          queryFnCalls++;
          return sleep(10).then(() => "data");
        },
      }));
      return (
        <View>
          <Text>{`status: ${query.status}`}</Text>
          <Text>{`fetchStatus: ${query.fetchStatus}`}</Text>
          <Text>{`data: ${query.data ?? "undefined"}`}</Text>
        </View>
      );
    }
    return (
      <View>
        <IsRestoringContext.Provider value={isRestoring}>
          <Page />
        </IsRestoringContext.Provider>
        <Button label="restored" onPress={() => isRestoring.set(false)} />
        <Button label="report" onPress={() => log({ queryFnCalls })} />
      </View>
    );
  },

  "should use provided custom queryClient": () => {
    const key = createKey();
    const customClient = new QueryClient();
    const queryFn = () => sleep(10).then(() => "custom client");
    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn }), customClient);
      return <Text>{`Status: ${state.data ?? ""}`}</Text>;
    }
    return (
      <QueryClientContext.Provider value={undefined}>
        <Page />
      </QueryClientContext.Provider>
    );
  },

  "should not fetch when queryFn is skipToken, and fetch once postId is set": () => {
    const key = createKey();
    let queryFnCalls = 0;
    const queryFn = () => {
      queryFnCalls++;
      return sleep(10).then(() => "post 1");
    };
    const postId = signal<number>();
    const state = useQuery(() => ({ queryKey: key, queryFn: postId() != null ? queryFn : skipToken }));
    return (
      <View>
        <Text>{`data: ${state.data ?? "none"}`}</Text>
        <Button label="set postId" onPress={() => postId.set(1)} />
        <Button label="report" onPress={() => log({ queryFnCalls })} />
      </View>
    );
  },
};

runScenarios(scenarios);
