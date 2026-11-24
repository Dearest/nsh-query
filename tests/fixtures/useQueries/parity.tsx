import { effect, ErrorBoundary, signal, Text, View } from "nsh";
import type { JSX } from "nsh";
import { IsRestoringContext, QueriesObserver, QueryClient, QueryClientContext, useQueries } from "nsh-query";
import type { QueryObserverResult } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

// Upstream's `render` without a provider: the hook gets its client as an argument.
function NoProvider(props: { children: JSX.Element }) {
  return <QueryClientContext.Provider value={undefined}>{props.children}</QueryClientContext.Provider>;
}

function Boundary(props: { children: JSX.Element; message?: boolean }) {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <View>
          <Text>error boundary</Text>
          <If when={props.message !== false}>
            <Text>{error instanceof Error ? error.message : String(error)}</Text>
          </If>
        </View>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}

function settles(throws: boolean): Scenario {
  return () => {
    const queryKey = createKey();
    const queryFn = () => sleep(10).then(() => "fetched");
    let renders = 0;
    const results = useQueries(() => ({
      queries: [
        {
          queryKey,
          queryFn,
          select: (value: string) => {
            if (throws) throw new Error(value + " with a select error");
            return new Set([value]);
          },
        },
      ],
    }));
    effect(() => {
      results[0]!.data;
      results[0]!.error;
      renders++;
    });
    return (
      <View>
        <Text>{results[0]!.error?.message ?? (results[0]!.data ? [...results[0]!.data].join() : "pending")}</Text>
        <Button label="report" onPress={() => log({ renders })} />
      </View>
    );
  };
}

const scenarios: Record<string, Scenario> = {
  "should settle after fetched data reaches an inline selector (throws: false)": settles(false),
  "should settle after fetched data reaches an inline selector (throws: true)": settles(true),

  "should return the correct states": () => {
    const key1 = createKey();
    const key2 = createKey();
    const result = useQueries(() => ({
      queries: [
        { queryKey: key1, queryFn: () => sleep(10).then(() => 1) },
        { queryKey: key2, queryFn: () => sleep(100).then(() => 2) },
      ],
    }));
    effect(() => log([snapshot(result[0]), snapshot(result[1])]));
    return <Text>{`data1: ${String(result[0].data ?? "null")}, data2: ${String(result[1].data ?? "null")}`}</Text>;
  },

  "should not change state if unmounted": ({ queryClient }) => {
    const key1 = createKey();

    // Upstream mocks the QueriesObserver to not unsubscribe the listener
    // when the component is unmounted.
    const subscribe = QueriesObserver.prototype.subscribe;
    QueriesObserver.prototype.subscribe = function (listener) {
      subscribe.call(this, listener);
      return () => void 0;
    };

    function Queries() {
      const queries = useQueries(() => ({
        queries: [{ queryKey: key1, queryFn: () => sleep(10).then(() => 1) }],
      }));
      effect(() => log({ state: queries[0].status }));
      return <Text>queries</Text>;
    }

    const mounted = signal(true);
    return (
      <View>
        <Button label="unmount" onPress={() => mounted.set(false)} />
        <If when={mounted()}>
          <Queries />
        </If>
        <Button label="report" onPress={() => log({ queryStatus: queryClient.getQueryState(key1)?.status })} />
      </View>
    );
  },

  "should use provided custom queryClient": () => {
    const key = createKey();
    const queryClient = new QueryClient();
    const queryFn = () => sleep(10).then(() => "custom client");

    function Page() {
      const queries = useQueries(() => ({ queries: [{ queryKey: key, queryFn }] }), queryClient);
      return <Text>{`data: ${queries[0].data ?? ""}`}</Text>;
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should not fetch for the duration of the restoring period when isRestoring is true": () => {
    const key1 = createKey();
    const key2 = createKey();
    const queryFn1 = () => {
      log({ queryFn: 1 });
      return sleep(10).then(() => "data1");
    };
    const queryFn2 = () => {
      log({ queryFn: 2 });
      return sleep(10).then(() => "data2");
    };

    function Page() {
      const results = useQueries(() => ({
        queries: [
          { queryKey: key1, queryFn: queryFn1 },
          { queryKey: key2, queryFn: queryFn2 },
        ],
      }));
      return <Statuses results={results} />;
    }

    return (
      <IsRestoringContext.Provider value={() => true}>
        <Page />
      </IsRestoringContext.Provider>
    );
  },

  "should not fetch queries with different durations for the duration of the restoring period when isRestoring is true":
    () => {
      const key1 = createKey();
      const key2 = createKey();
      const queryFn1 = () => {
        log({ queryFn: 1 });
        return sleep(10).then(() => "data1");
      };
      const queryFn2 = () => {
        log({ queryFn: 2 });
        return sleep(20).then(() => "data2");
      };

      function Page() {
        const results = useQueries(() => ({
          queries: [
            { queryKey: key1, queryFn: queryFn1 },
            { queryKey: key2, queryFn: queryFn2 },
          ],
        }));
        return <Statuses results={results} />;
      }

      return (
        <IsRestoringContext.Provider value={() => true}>
          <Page />
        </IsRestoringContext.Provider>
      );
    },

  "should track results": () => {
    const key1 = createKey();
    let count = 0;
    const result = useQueries(() => ({
      queries: [
        {
          queryKey: key1,
          queryFn: () =>
            sleep(10).then(() => {
              count++;
              return count;
            }),
        },
      ],
    }));
    effect(() => log({ data: result[0].data }));
    return (
      <View>
        <Text>{`data: ${String(result[0].data ?? "null")}`}</Text>
        <Button label="refetch" onPress={() => void result[0].refetch()} />
      </View>
    );
  },

  "should throw error if in one of queries' queryFn throws and throwOnError is in use": () => {
    const key1 = createKey();
    const key2 = createKey();
    const key3 = createKey();
    const key4 = createKey();

    function Page() {
      useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => Promise.reject(new Error("this should not throw because throwOnError is not set")),
          },
          {
            queryKey: key2,
            queryFn: () => Promise.reject(new Error("single query error")),
            throwOnError: true,
            retry: false,
          },
          { queryKey: key3, queryFn: () => Promise.resolve(2) },
          {
            queryKey: key4,
            queryFn: () => Promise.reject(new Error("this should not throw because query#2 already did")),
            throwOnError: true,
            retry: false,
          },
        ],
      }));
      return <View />;
    }

    return (
      <Boundary>
        <Page />
      </Boundary>
    );
  },

  "should throw error if in one of queries' queryFn throws and throwOnError function resolves to true": () => {
    const key1 = createKey();
    const key2 = createKey();
    const key3 = createKey();
    const key4 = createKey();

    function Page() {
      useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              Promise.reject(new Error("this should not throw because throwOnError function resolves to false")),
            throwOnError: () => false,
            retry: false,
          },
          { queryKey: key2, queryFn: () => Promise.resolve(2) },
          {
            queryKey: key3,
            queryFn: () => Promise.reject(new Error("single query error")),
            throwOnError: () => true,
            retry: false,
          },
          {
            queryKey: key4,
            queryFn: () => Promise.reject(new Error("this should not throw because query#3 already did")),
            throwOnError: true,
            retry: false,
          },
        ],
      }));
      return <View />;
    }

    return (
      <Boundary>
        <Page />
      </Boundary>
    );
  },

  "should throw error if in one of queries' queryFn rejects with a falsy error and throwOnError is in use": () => {
    const key = createKey();

    function Page() {
      useQueries(() => ({
        queries: [{ queryKey: key, queryFn: () => Promise.reject(), retry: false, throwOnError: true }],
      }));
      return <View />;
    }

    return (
      <Boundary message={false}>
        <Page />
      </Boundary>
    );
  },

  "should combine queries": () => {
    const key1 = createKey();
    const key2 = createKey();
    const queryClient = new QueryClient();

    function Page() {
      const queries = useQueries(
        () => ({
          queries: [
            { queryKey: key1, queryFn: () => Promise.resolve("first result") },
            { queryKey: key2, queryFn: () => Promise.resolve("second result") },
          ],
          combine: (results) => ({
            combined: true,
            res: results.map((res) => res.data).join(","),
          }),
        }),
        queryClient,
      );
      return <Text>{`data: ${String(queries.combined)} ${queries.res}`}</Text>;
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should not return new instances when called without queries": () => {
    const key = createKey();
    const ids: number[] = [];
    let resultChanged = 0;
    const count = signal(0);
    const result = useQueries(() => {
      // a React re-render: the options are evaluated again
      count();
      return {
        queries: ids.map((id) => ({
          queryKey: [key, id],
          queryFn: () => () => Promise.resolve({ id, content: { value: Math.random() } }),
        })),
        combine: () => ({ empty: "object" }),
      };
    });
    effect(() => {
      JSON.stringify(result);
      resultChanged++;
    });
    return (
      <View>
        <Text>{`count: ${count()}`}</Text>
        <Text>{`data: ${JSON.stringify(result)}`}</Text>
        <Button label="inc" onPress={() => count.update((c) => c + 1)} />
        <Button label="report" onPress={() => log({ resultChanged })} />
      </View>
    );
  },

  "should not have infinite render loops with empty queries (#6645)": () => {
    let renderCount = 0;
    const result = useQueries(() => ({ queries: [] }));
    effect(() => {
      JSON.stringify(result);
      renderCount++;
    });
    return (
      <View>
        <Text>{`data: ${JSON.stringify(result)}`}</Text>
        <Button label="report" onPress={() => log({ renderCount })} />
      </View>
    );
  },

  "should only call combine with query results": () => {
    const key1 = createKey();
    const key2 = createKey();
    const result = useQueries(() => ({
      queries: [
        { queryKey: key1, queryFn: () => sleep(5).then(() => Promise.resolve("query1")) },
        { queryKey: key2, queryFn: () => sleep(20).then(() => Promise.resolve("query2")) },
      ],
      combine: ([query1, query2]) => ({
        data: { query1: query1.data, query2: query2.data },
      }),
    }));
    return <Text>{`data: ${JSON.stringify(result)}`}</Text>;
  },

  "should track property access through combine function": () => {
    const key1 = createKey();
    const key2 = createKey();
    let count = 0;
    const queryClient = new QueryClient();

    function Page() {
      const queries = useQueries(
        () => ({
          queries: [
            { queryKey: key1, queryFn: () => sleep(5).then(() => Promise.resolve("first result " + count)) },
            { queryKey: key2, queryFn: () => sleep(50).then(() => Promise.resolve("second result " + count)) },
          ],
          combine: (queryResults) => ({
            combined: true,
            refetch: () => queryResults.forEach((res) => res.refetch()),
            res: queryResults.flatMap((res) => (res.data ? [res.data] : [])).join(","),
          }),
        }),
        queryClient,
      );
      effect(() => log(snapshot(queries)));
      return (
        <View>
          <Text>{`data: ${String(queries.combined)} ${queries.res}`}</Text>
          <Button label="refetch" onPress={() => queries.refetch()} />
          <Button label="count" onPress={() => count++} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should synchronously track properties of all observer even if a property (isLoading) is only accessed on one observer (#7000)":
    () => {
      const key = createKey();
      const ids = [1, 2];
      const result = useQueries(() => ({
        queries: ids.map((id) => ({
          queryKey: [key, id],
          queryFn: () =>
            sleep(10).then(() => {
              if (id === 2) throw new Error("FAILURE");
              return { id, title: `Post ${id}` };
            }),
          retry: false,
        })),
        combine: (results) => {
          // this tracks data on all observers
          void results.forEach((result) => result.data);
          return {
            // .some aborts early, so `isLoading` might not be accessed (and thus tracked) on all observers
            // leading to missing re-renders
            isLoading: results.some((result) => result.isLoading),
          };
        },
      }));
      return <Text>{`Loading Status: ${result.isLoading ? "Loading..." : "Loaded"}`}</Text>;
    },

  "should not have stale closures with combine (#6648)": () => {
    const key = createKey();
    const queryClient = new QueryClient();

    function Page() {
      const count = signal(0);
      const queries = useQueries(() => {
        const current = count();
        return {
          queries: [{ queryKey: key, queryFn: () => Promise.resolve("result") }],
          combine: (results) => ({
            count: current,
            res: results.map((res) => res.data).join(","),
          }),
        };
      }, queryClient);
      return (
        <View>
          <Text>{`data: ${String(queries.count)} ${queries.res}`}</Text>
          <Button label="inc" onPress={() => count.update((c) => c + 1)} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should optimize combine if it is a stable reference": () => {
    const key1 = createKey();
    const key2 = createKey();
    const client = new QueryClient();
    let spy = 0;
    let value = 0;

    function Page() {
      const state = signal(0);
      const combine = (results: QueryObserverResult[]) => {
        const result = {
          combined: true,
          res: results.map((res) => res.data).join(","),
        };
        spy++;
        return result;
      };
      const queries = useQueries(() => {
        // a React re-render: the options are evaluated again
        state();
        return {
          queries: [
            { queryKey: key1, queryFn: () => sleep(10).then(() => "first result:" + value) },
            { queryKey: key2, queryFn: () => sleep(20).then(() => "second result:" + value) },
          ],
          combine,
        };
      }, client);
      return (
        <View>
          <Text>{`data: ${String(queries.combined)} ${queries.res}`}</Text>
          <Button label="rerender" onPress={() => state.update((s) => s + 1)} />
          <Button label="refetchQueries" onPress={() => void client.refetchQueries()} />
          <Button label="value" onPress={() => (value = 1)} />
          <Button label="report" onPress={() => log({ spy })} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should re-run combine if the functional reference changes": () => {
    const key1 = createKey();
    const key2 = createKey();
    const client = new QueryClient();
    let spy = 0;

    function Page() {
      const state = signal(0);
      const queries = useQueries(() => {
        const current = state();
        return {
          queries: [
            { queryKey: [key1], queryFn: () => sleep(10).then(() => "first result") },
            { queryKey: [key2], queryFn: () => sleep(20).then(() => "second result") },
          ],
          combine: (results: QueryObserverResult[]) => {
            const result = {
              combined: true,
              state: current,
              res: results.map((res) => res.data).join(","),
            };
            spy++;
            return result;
          },
        };
      }, client);
      return (
        <View>
          <Text>{`data: ${String(queries.state)} ${queries.res}`}</Text>
          <Button label="rerender" onPress={() => state.update((s) => s + 1)} />
          <Button label="report" onPress={() => log({ spy })} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should not re-render if combine returns a stable reference": () => {
    const key1 = createKey();
    const key2 = createKey();
    const client = new QueryClient();
    const queryFns: string[] = [];
    let renders = 0;
    const foo = { value: "foo" };

    function Page() {
      const data = useQueries(
        () => ({
          queries: [
            {
              queryKey: [key1],
              queryFn: () =>
                sleep(10).then(() => {
                  queryFns.push("first result");
                  return "first result";
                }),
            },
            {
              queryKey: [key2],
              queryFn: () =>
                sleep(20).then(() => {
                  queryFns.push("second result");
                  return "second result";
                }),
            },
          ],
          combine: () => foo,
        }),
        client,
      );
      effect(() => {
        data.value;
        renders++;
      });
      return (
        <View>
          <Text>{`data: ${data.value}`}</Text>
          <Button label="report" onPress={() => log({ queryFns, renders })} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should re-render once combine returns a different reference": () => {
    const key1 = createKey();
    const key2 = createKey();
    const key3 = createKey();
    const client = new QueryClient();
    let renders = 0;

    function Page() {
      const data = useQueries(
        () => ({
          queries: [
            { queryKey: [key1], queryFn: () => sleep(10).then(() => "first result") },
            { queryKey: [key2], queryFn: () => sleep(15).then(() => "second result") },
            { queryKey: [key3], queryFn: () => sleep(20).then(() => "third result") },
          ],
          combine: (results) => {
            const isPending = results.some((res) => res.isPending);
            return { value: isPending ? "pending" : "foo" };
          },
        }),
        client,
      );
      effect(() => {
        data.value;
        renders++;
      });
      return (
        <View>
          <Text>{`data: ${data.value}`}</Text>
          <Button label="report" onPress={() => log({ renders })} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should track properties correctly with combine": () => {
    const key1 = createKey();
    const key2 = createKey();
    const key3 = createKey();
    const client = new QueryClient();

    function Page() {
      const data = useQueries(
        () => ({
          queries: [
            { queryKey: [key1], queryFn: () => sleep(10).then(() => "first result") },
            { queryKey: [key2], queryFn: () => sleep(15).then(() => "second result") },
            { queryKey: [key3], queryFn: () => sleep(20).then(() => "third result") },
          ],
          combine: (results) => {
            if (results.find((r) => r.isPending)) return { value: "pending" };
            return { value: results.map((r) => r.data).join(", ") };
          },
        }),
        client,
      );
      return (
        <View>
          <Text>{`data: ${data.value}`}</Text>
          <Button label="update" onPress={() => client.setQueryData([key1], "first result updated")} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should not re-run stable combine on unrelated re-render": () => {
    const key1 = createKey();
    const key2 = createKey();
    const client = new QueryClient();
    let spy = 0;

    function Page() {
      const unrelatedState = signal(0);
      const combine = (results: QueryObserverResult[]) => {
        const result = {
          combined: true,
          res: results.map((res) => res.data).join(","),
        };
        spy++;
        return result;
      };
      const queries = useQueries(() => {
        // a React re-render: the options are evaluated again
        unrelatedState();
        return {
          queries: [
            { queryKey: key1, queryFn: () => sleep(10).then(() => "first result") },
            { queryKey: key2, queryFn: () => sleep(20).then(() => "second result") },
          ],
          combine,
        };
      }, client);
      return (
        <View>
          <Text>{`data: ${String(queries.combined)} ${queries.res}`}</Text>
          <Text>{`unrelated: ${unrelatedState()}`}</Text>
          <Button label="increment" onPress={() => unrelatedState.update((s) => s + 1)} />
          <Button label="report" onPress={() => log({ spy })} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },

  "should not cause infinite re-renders when removing last query": () => {
    const key1 = createKey();
    const key2 = createKey();
    let renderCount = 0;
    const queries = signal([
      { queryKey: key1, queryFn: () => "data1" },
      { queryKey: key2, queryFn: () => "data2" },
    ]);
    const result = useQueries(() => ({ queries: queries() }));
    effect(() => {
      result.length;
      renderCount++;
    });
    return (
      <View>
        <Text>{`queries: ${result.length}`}</Text>
        <Button label="remove last" onPress={() => queries.set([{ queryKey: key1, queryFn: () => "data1" }])} />
        <Button label="remove first" onPress={() => queries.set([{ queryKey: key2, queryFn: () => "data2" }])} />
        <Button
          label="report"
          onPress={() => {
            log({ renderCount });
            renderCount = 0;
          }}
        />
      </View>
    );
  },

  "should return correct results when queries count changes with stable combine reference": ({ queryClient }) => {
    const combine = (results: QueryObserverResult[]) => results;
    const key = createKey();

    function Page() {
      const n = signal(0);
      const queries = useQueries(
        () => ({
          queries: [...Array(n()).keys()].map((i) => ({
            queryKey: [...key, i],
            queryFn: () => i,
          })),
          combine,
        }),
        queryClient,
      );
      effect(() => log({ n: n(), length: queries.length }));
      return (
        <View>
          <Text>{`n: ${n()}`}</Text>
          <Text>{`length: ${queries.length}`}</Text>
          <Button label="Increase" onPress={() => n.update((value) => value + 1)} />
        </View>
      );
    }

    return (
      <NoProvider>
        <Page />
      </NoProvider>
    );
  },
};

function Statuses(props: { results: { status: string; fetchStatus: string; data: unknown }[] }) {
  return (
    <View>
      <Text>{`status1: ${props.results[0]?.status}`}</Text>
      <Text>{`status2: ${props.results[1]?.status}`}</Text>
      <Text>{`fetchStatus1: ${props.results[0]?.fetchStatus}`}</Text>
      <Text>{`fetchStatus2: ${props.results[1]?.fetchStatus}`}</Text>
      <Text>{`data1: ${props.results[0]?.data ?? "undefined"}`}</Text>
      <Text>{`data2: ${props.results[1]?.data ?? "undefined"}`}</Text>
    </View>
  );
}

runScenarios(scenarios);
