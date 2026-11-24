import { effect, signal, Text, View } from "nsh";
import type { JSX } from "nsh";
import {
  infiniteQueryOptions,
  keepPreviousData,
  QueryClient,
  QueryClientContext,
  skipToken,
  useInfiniteQuery,
} from "nsh-query";
import type { QueryFunctionContext } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

interface Result {
  items: number[];
  nextId?: number | undefined;
  prevId?: number | undefined;
  ts: number;
}

const pageSize = 10;

const data = (value: unknown) => (value ? JSON.parse(JSON.stringify(value)) : undefined);

// Upstream's `Blink`: shows its children for `duration` ms, then "off".
function Blink(props: { duration: number; children: JSX.Element }) {
  const shown = signal(true);
  setTimeout(() => shown.set(false), props.duration);
  return (
    <If when={shown()} else={<Text>off</Text>}>
      {props.children}
    </If>
  );
}

// Upstream's abort-signal spies: what each call of the query function received.
function abortSpy() {
  const calls: {
    pageParam: number;
    queryKey: readonly unknown[];
    signal: AbortSignal;
    onAbort: number;
    listener: number;
  }[] = [];
  const fetchPage = async (context: QueryFunctionContext<string[], number>) => {
    const call = { pageParam: context.pageParam, queryKey: context.queryKey, signal: context.signal, onAbort: 0, listener: 0 };
    calls.push(call);
    context.signal.onabort = () => call.onAbort++;
    context.signal.addEventListener("abort", () => call.listener++);
    await sleep(50);
    return context.pageParam;
  };
  const report = () =>
    log(
      calls.map((call) => ({
        pageParam: call.pageParam,
        queryKey: call.queryKey,
        isAbortSignal: call.signal instanceof AbortSignal,
        aborted: call.signal.aborted,
        onAbort: call.onAbort,
        listener: call.listener,
      })),
    );
  return { fetchPage, report };
}

const scenarios: Record<string, Scenario> = {
  "should return the correct states for a successful query": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 0,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not throw when fetchNextPage returns an error": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => {
          if (pageParam === 2) throw new Error("error");
          return pageParam;
        }),
      retry: 1,
      retryDelay: 10,
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage + 1,
    }));
    setTimeout(() => {
      state
        .fetchNextPage()
        .then(() => log({ noThrow: true }))
        .catch(() => undefined);
    }, 20);
    return <View />;
  },

  "should keep the previous data when placeholderData is set": () => {
    const key = createKey();
    const order = signal("desc");
    const state = useInfiniteQuery(() => ({
      queryKey: [key, order()],
      queryFn: ({ pageParam }) => sleep(10).then(() => `${pageParam}-${order()}`),
      getNextPageParam: () => 1,
      initialPageParam: 0,
      placeholderData: keepPreviousData,
      notifyOnChangeProps: "all",
    }));
    effect(() => log({ ...snapshot(state), data: data(state.data) }));
    return (
      <View>
        <Button label="fetchNextPage" onPress={() => void state.fetchNextPage()} />
        <Button label="order" onPress={() => order.set("asc")} />
        <Text>{`data: ${state.data?.pages.join(",") ?? "null"}`}</Text>
        <Text>{`isFetching: ${String(state.isFetching)}`}</Text>
      </View>
    );
  },

  "should be able to select a part of the data": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ count: 1 })),
      select: (data) => ({
        pages: data.pages.map((x) => `count: ${x.count}`),
        pageParams: data.pageParams,
      }),
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    }));
    effect(() => log(snapshot(state)));
    return <Text>{state.data?.pages.join(",") ?? ""}</Text>;
  },

  "should be able to select a new result and not cause infinite renders": () => {
    const key = createKey();
    let selectCalled = 0;
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ count: 1 })),
      select: (data) => {
        selectCalled++;
        return {
          pages: data.pages.map((x) => ({ ...x, id: Math.random() })),
          pageParams: data.pageParams,
        };
      },
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    }));
    effect(() => log(snapshot(state)));
    return (
      <View>
        <Each of={state.data?.pages ?? []}>{(page) => <Text>{`count: ${page().count}`}</Text>}</Each>
        <Button label="report" onPress={() => log({ selectCalled })} />
      </View>
    );
  },

  "should be able to reverse the data": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      select: (data) => ({
        pages: [...data.pages].reverse(),
        pageParams: [...data.pageParams].reverse(),
      }),
      notifyOnChangeProps: "all",
      getNextPageParam: () => 1,
      initialPageParam: 0,
    }));
    effect(() => {
      snapshot(state);
      log({ data: data(state.data), isSuccess: state.isSuccess });
    });
    return (
      <View>
        <Button label="fetchNextPage" onPress={() => void state.fetchNextPage()} />
        <Text>{`data: ${state.data?.pages.join(",") ?? "null"}`}</Text>
        <Text>{`isFetching: ${state.isFetching}`}</Text>
      </View>
    );
  },

  "should be able to fetch a previous page": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
      initialPageParam: 10,
      notifyOnChangeProps: "all",
    }));
    effect(() =>
      log({
        data: data(state.data),
        hasNextPage: state.hasNextPage,
        hasPreviousPage: state.hasPreviousPage,
        isFetching: state.isFetching,
        isFetchingNextPage: state.isFetchingNextPage,
        isFetchingPreviousPage: state.isFetchingPreviousPage,
        isSuccess: state.isSuccess,
      }),
    );
    setTimeout(() => void state.fetchPreviousPage(), 20);
    return <Text>{`data: ${state.data?.pages.join(",") ?? "null"}`}</Text>;
  },

  "should be able to refetch when providing page params automatically": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      getPreviousPageParam: (firstPage) => firstPage - 1,
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
      notifyOnChangeProps: "all",
    }));
    effect(() =>
      log({
        data: data(state.data),
        isFetching: state.isFetching,
        isFetchingNextPage: state.isFetchingNextPage,
        isRefetching: state.isRefetching,
        isFetchingPreviousPage: state.isFetchingPreviousPage,
      }),
    );
    return (
      <View>
        <Button label="fetchNextPage" onPress={() => void state.fetchNextPage()} />
        <Button label="fetchPreviousPage" onPress={() => void state.fetchPreviousPage()} />
        <Button label="refetch" onPress={() => void state.refetch()} />
        <Text>{`data: ${state.data?.pages.join(",") ?? "null"}`}</Text>
        <Text>{`isFetching: ${String(state.isFetching)}`}</Text>
      </View>
    );
  },

  "should return the correct states when refetch fails": () => {
    const key = createKey();
    let isRefetch = false;
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => {
          if (isRefetch) throw new Error();
          return pageParam;
        }),
      getPreviousPageParam: (firstPage) => firstPage - 1,
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
      notifyOnChangeProps: "all",
      retry: false,
    }));
    effect(() => log(errorStates(state)));
    return (
      <View>
        <Button
          label="refetch"
          onPress={() => {
            isRefetch = true;
            void state.refetch();
          }}
        />
        <Text>{`data: ${state.data?.pages.join(",") ?? "null"}`}</Text>
        <Text>{`isFetching: ${String(state.isFetching)}`}</Text>
      </View>
    );
  },

  "should return the correct states when fetchNextPage fails": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => {
          if (pageParam !== 10) throw new Error();
          return pageParam;
        }),
      getPreviousPageParam: (firstPage) => firstPage - 1,
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
      notifyOnChangeProps: "all",
      retry: false,
    }));
    effect(() => log(errorStates(state)));
    return (
      <View>
        <Button label="fetchNextPage" onPress={() => void state.fetchNextPage()} />
        <Text>{`data: ${state.data?.pages.join(",") ?? "null"}`}</Text>
        <Text>{`isFetching: ${String(state.isFetching)}`}</Text>
      </View>
    );
  },

  "should return the correct states when fetchPreviousPage fails": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => {
          if (pageParam !== 10) throw new Error();
          return pageParam;
        }),
      getPreviousPageParam: (firstPage) => firstPage - 1,
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
      notifyOnChangeProps: "all",
      retry: false,
    }));
    effect(() => log(errorStates(state)));
    return (
      <View>
        <Button label="fetchPreviousPage" onPress={() => void state.fetchPreviousPage()} />
        <Text>{`data: ${state.data?.pages.join(",") ?? "null"}`}</Text>
        <Text>{`isFetching: ${String(state.isFetching)}`}</Text>
      </View>
    );
  },

  "should silently cancel any ongoing fetch when fetching more": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(50).then(() => pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
      notifyOnChangeProps: "all",
    }));
    effect(() =>
      log({
        hasNextPage: state.hasNextPage,
        data: data(state.data),
        isFetching: state.isFetching,
        isFetchingNextPage: state.isFetchingNextPage,
        isSuccess: state.isSuccess,
      }),
    );
    setTimeout(() => void state.refetch(), 100);
    setTimeout(() => void state.fetchNextPage(), 110);
    return (
      <View>
        <Text>{`data: ${JSON.stringify(state.data)}`}</Text>
        <Text>{`status: ${state.status}, ${state.fetchStatus}`}</Text>
      </View>
    );
  },

  "should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked": () => {
    const key = createKey();
    const { fetchPage, report } = abortSpy();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: fetchPage,
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
    }));
    setTimeout(() => void state.fetchNextPage(), 100);
    setTimeout(() => void state.fetchNextPage(), 110);
    return <Button label="report" onPress={report} />;
  },

  "should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used":
    () => {
      const key = createKey();
      const { fetchPage, report } = abortSpy();
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: fetchPage,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 10,
      }));
      setTimeout(() => void state.fetchNextPage(), 100);
      setTimeout(() => void state.fetchNextPage({ cancelRefetch: false }), 110);
      return <Button label="report" onPress={report} />;
    },

  "should keep fetching first page when not loaded yet and triggering fetch more": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(50).then(() => pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
      notifyOnChangeProps: "all",
    }));
    effect(() => log(snapshot(state)));
    setTimeout(() => void state.fetchNextPage(), 10);
    return <View />;
  },

  "should stop fetching additional pages when the component is unmounted and AbortSignal is consumed": ({
    queryClient,
  }) => {
    const key = createKey();
    let fetches = 0;
    const initialData = { pages: [1, 2, 3, 4], pageParams: [0, 1, 2, 3] };

    function List() {
      useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(50).then(() => {
            fetches++;
            return pageParam * 10;
          }),
        initialData,
        getNextPageParam: (_, allPages) => (allPages.length === 4 ? undefined : allPages.length),
        initialPageParam: 0,
      }));
      return <View />;
    }

    const show = signal(true);
    setTimeout(() => show.set(false), 75);
    return (
      <View>
        <If when={show()}>
          <List />
        </If>
        <Button
          label="report"
          onPress={() => {
            const state = queryClient.getQueryState(key);
            log({ fetches, state: { data: state?.data, status: state?.status, error: state?.error } });
          }}
        />
      </View>
    );
  },

  "should be able to set new pages with the query client": ({ queryClient }) => {
    const key = createKey();
    const firstPage = signal(0);
    let multiplier = 1;
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => multiplier * pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      notifyOnChangeProps: "all",
      initialPageParam: firstPage(),
    }));
    effect(() =>
      log({
        hasNextPage: state.hasNextPage,
        data: data(state.data),
        isFetching: state.isFetching,
        isFetchingNextPage: state.isFetchingNextPage,
        isSuccess: state.isSuccess,
      }),
    );
    setTimeout(() => {
      queryClient.setQueryData(key, { pages: [7, 8], pageParams: [7, 8] });
      firstPage.set(7);
    }, 20);
    setTimeout(() => void state.refetch(), 50);
    // react-query's version: a refetch with another multiplier
    setTimeout(() => {
      multiplier = 2;
      void state.refetch();
    }, 100);
    return <Text>{`data: ${JSON.stringify(state.data)}`}</Text>;
  },

  "should keep initialData visible alongside the error when a refetch fails": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error("Some error"))),
      initialData: { pages: [1], pageParams: [1] },
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
      retry: false,
    }));
    effect(() => log({ data: data(state.data), isError: state.isError }));
    return <View />;
  },

  "should not fetch when queryFn is skipToken, and fetch once it is replaced": () => {
    const key = createKey();
    let calls = 0;
    const queryFn = ({ pageParam }: { pageParam: number }) => {
      calls++;
      log({ calls });
      return sleep(10).then(() => `comments for 1 page ${pageParam}`);
    };
    const postId = signal<string | undefined>(undefined);
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: postId() != null ? queryFn : skipToken,
      initialPageParam: 0,
      getNextPageParam: () => 12,
    }));
    return (
      <View>
        <Text>{`isFetching: ${String(state.isFetching)}`}</Text>
        <Text>{`pages: ${state.data?.pages.join(", ") ?? "none"}`}</Text>
        <Button label="set postId" onPress={() => postId.set("1")} />
      </View>
    );
  },

  "should only refetch the first page when initialData is provided": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      initialData: { pages: [1], pageParams: [1] },
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 0,
      notifyOnChangeProps: "all",
    }));
    effect(() =>
      log({
        data: data(state.data),
        hasNextPage: state.hasNextPage,
        isFetching: state.isFetching,
        isFetchingNextPage: state.isFetchingNextPage,
        isSuccess: state.isSuccess,
      }),
    );
    setTimeout(() => void state.fetchNextPage(), 20);
    return <View />;
  },

  "should set hasNextPage to false if getNextPageParam returns undefined": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should compute hasNextPage correctly using initialData": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      initialPageParam: 10,
      initialData: { pages: [10], pageParams: [10] },
      getNextPageParam: (lastPage) => (lastPage === 10 ? 11 : undefined),
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should compute hasNextPage correctly for falsy getFetchMore return value using initialData": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      initialPageParam: 10,
      initialData: { pages: [10], pageParams: [10] },
      getNextPageParam: () => undefined,
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should not use selected data when computing hasNextPage": () => {
    const key = createKey();
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => (lastPage === 1 ? 2 : undefined),
      select: (data) => ({
        pages: data.pages.map((x) => x.toString()),
        pageParams: data.pageParams,
      }),
    }));
    effect(() => log(snapshot(state)));
    return <View />;
  },

  "should build fresh cursors on refetch": ({ queryClient }) => {
    const key = createKey();
    const items = [...new Array(15)].fill(null).map((_, d: number) => d);
    const limit = 3;
    const fetchItemsWithLimit = (cursor = 0, ts: number) =>
      sleep(10).then(() => ({
        nextId: cursor + limit,
        items: items.slice(cursor, cursor + limit),
        ts,
      }));

    let fetchCountRef = 0;
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) => fetchItemsWithLimit(pageParam, fetchCountRef++),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    }));

    return (
      <View>
        <Text>Pagination</Text>
        <If when={state.status === "pending"}>
          <Text>Loading...</Text>
        </If>
        <If when={state.status === "error"}>
          <Text>{`Error: ${state.error?.message}`}</Text>
        </If>
        <If when={state.status === "success"}>
          <Text>Data:</Text>
          <Each of={state.data?.pages ?? []}>
            {(page, i) => (
              <View>
                <Text>{`Page ${i()}: ${page().ts}`}</Text>
                <Each of={page().items} key="index">
                  {(item) => <Text>{`Item: ${item()}`}</Text>}
                </Each>
              </View>
            )}
          </Each>
          <View role="button" onPress={() => void state.fetchNextPage()}>
            <Text>
              {state.isFetchingNextPage ? "Loading more..." : state.hasNextPage ? "Load More" : "Nothing more to load"}
            </Text>
          </View>
          <Button label="Refetch" onPress={() => void state.refetch()} />
          <Button
            label="Remove item"
            onPress={() => {
              items.splice(4, 1);
              void queryClient.invalidateQueries({ queryKey: key });
            }}
          />
          <Text>{!state.isFetchingNextPage ? "Background Updating..." : ""}</Text>
        </If>
      </View>
    );
  },

  "should compute hasNextPage correctly for falsy getFetchMore return value on refetching": () => {
    const key = createKey();
    const MAX = 2;
    let fetchCountRef = 0;
    const isRemovedLastPage = signal(false);
    const state = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }): Promise<Result> => {
        const noNext = pageParam === MAX || (pageParam === MAX - 1 && isRemovedLastPage());
        return sleep(10).then(() => ({
          items: [...new Array(10)].fill(null).map((_, d: number) => pageParam * pageSize + d),
          nextId: noNext ? undefined : pageParam + 1,
          prevId: pageParam - 1,
          ts: fetchCountRef++,
        }));
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    }));

    return (
      <View>
        <Text>Pagination</Text>
        <If when={state.status === "pending"}>
          <Text>Loading...</Text>
        </If>
        <If when={state.status === "error"}>
          <Text>{`Error: ${state.error?.message}`}</Text>
        </If>
        <If when={state.status === "success"}>
          <Text>Data:</Text>
          <Each of={state.data?.pages ?? []}>
            {(page, i) => (
              <View>
                <Text>{`Page ${i()}: ${page().ts}`}</Text>
                <Each of={page().items} key="index">
                  {(item) => <Text>{`Item: ${item()}`}</Text>}
                </Each>
              </View>
            )}
          </Each>
          <View role="button" onPress={() => void state.fetchNextPage()}>
            <Text>
              {state.isFetchingNextPage ? "Loading more..." : state.hasNextPage ? "Load More" : "Nothing more to load"}
            </Text>
          </View>
          <Button label="Refetch" onPress={() => void state.refetch()} />
          <Button label="Remove Last Page" onPress={() => isRemovedLastPage.set(true)} />
          <Text>{state.isFetching && !state.isFetchingNextPage ? "Background Updating..." : ""}</Text>
        </If>
      </View>
    );
  },

  "should cancel the query function when there are no more subscriptions": () => {
    const key = createKey();
    const queryFn = ({ signal }: { signal?: AbortSignal }) =>
      new Promise<string>((resolve, reject) => {
        signal?.addEventListener("abort", (event) => {
          log({ abort: event.type });
          reject("Cancelled");
        });
        void sleep(20).then(() => resolve("OK"));
      });

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }));
      return <Text>{`Status: ${state.status}`}</Text>;
    }

    return (
      <Blink duration={5}>
        <Page />
      </Blink>
    );
  },

  "should use provided custom queryClient": () => {
    const key = createKey();
    const queryClient = new QueryClient();

    function Page() {
      const state = useInfiniteQuery(
        () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => "custom client"),
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
        queryClient,
      );
      return <Text>{`Status: ${state.data?.pages[0] ?? ""}`}</Text>;
    }

    return (
      <QueryClientContext.Provider value={undefined}>
        <Page />
      </QueryClientContext.Provider>
    );
  },

  "should work with infiniteQueryOptions": () => {
    const key = createKey();
    const queryClient = new QueryClient();
    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 220),
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    });

    function Page() {
      const state = useInfiniteQuery(() => options, queryClient);
      return <Text>{`Status: ${state.data?.pages[0] ?? ""}`}</Text>;
    }

    return (
      <QueryClientContext.Provider value={undefined}>
        <Page />
      </QueryClientContext.Provider>
    );
  },
};

function errorStates(state: {
  data: unknown;
  isFetching: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  isFetchPreviousPageError: boolean;
  isFetchingPreviousPage: boolean;
  isRefetchError: boolean;
  isRefetching: boolean;
}) {
  return {
    data: data(state.data),
    isFetching: state.isFetching,
    isFetchNextPageError: state.isFetchNextPageError,
    isFetchingNextPage: state.isFetchingNextPage,
    isFetchPreviousPageError: state.isFetchPreviousPageError,
    isFetchingPreviousPage: state.isFetchingPreviousPage,
    isRefetchError: state.isRefetchError,
    isRefetching: state.isRefetching,
  };
}

runScenarios(scenarios);
