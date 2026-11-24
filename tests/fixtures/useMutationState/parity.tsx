import { effect, signal, Text, View } from "nsh";
import { QueryClient, useIsMutating, useMutation, useMutationState } from "nsh-query";
import type { Mutation } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep } from "../../support/parity";
import type { Scenario } from "../../support/parity";

// Runs `start` once, when the effects of the components above it have run.
function Start(props: { start: () => void }) {
  effect(() => props.start());
  return <View />;
}

const scenarios: Record<string, Scenario> = {
  "useIsMutating › should return the number of fetching mutations": () => {
    const key1 = createKey();
    const key2 = createKey();

    function IsMutating() {
      const isMutating = useIsMutating();
      return <Text>{`mutating: ${isMutating()}`}</Text>;
    }

    function Mutations() {
      const mutation1 = useMutation(() => ({
        mutationKey: key1,
        mutationFn: () => sleep(50).then(() => "data"),
      }));
      const mutation2 = useMutation(() => ({
        mutationKey: key2,
        mutationFn: () => sleep(10).then(() => "data"),
      }));
      const mutate1 = mutation1.mutate;
      const mutate2 = mutation2.mutate;
      return (
        <View>
          <Button label="mutate1" onPress={() => mutate1()} />
          <Button label="mutate2" onPress={() => mutate2()} />
        </View>
      );
    }

    return (
      <View>
        <IsMutating />
        <Mutations />
      </View>
    );
  },

  "useIsMutating › should update when the query client is cleared": ({ queryClient }) => {
    function Page() {
      const mutation = useMutation(() => ({ mutationFn: () => sleep(1000).then(() => "data") }));
      const isMutating = useIsMutating();
      const mutate = mutation.mutate;
      return (
        <View>
          <Text>{`mutating: ${isMutating()}`}</Text>
          <Button label="mutate" onPress={() => mutate()} />
          <Button
            label="clear"
            onPress={() => {
              queryClient.clear();
              log({ isMutating: queryClient.isMutating() });
            }}
          />
        </View>
      );
    }

    return <Page />;
  },

  "useIsMutating › should filter correctly by mutationKey": () => {
    const key1 = createKey();
    const key2 = createKey();

    function IsMutating() {
      const isMutating = useIsMutating(() => ({ mutationKey: key1 }));
      return <Text>{`mutating: ${isMutating()}`}</Text>;
    }

    function Page() {
      const mutation1 = useMutation(() => ({ mutationKey: key1, mutationFn: () => sleep(100).then(() => "data") }));
      const mutation2 = useMutation(() => ({ mutationKey: key2, mutationFn: () => sleep(100).then(() => "data") }));
      const mutate1 = mutation1.mutate;
      const mutate2 = mutation2.mutate;
      return (
        <>
          <IsMutating />
          <Button
            label="start"
            onPress={() => {
              mutate1();
              mutate2();
            }}
          />
        </>
      );
    }

    return <Page />;
  },

  "useIsMutating › should filter correctly by predicate": () => {
    const key1 = createKey();
    const key2 = createKey();

    function IsMutating() {
      const isMutating = useIsMutating(() => ({
        predicate: (mutation) => mutation.options.mutationKey?.[0] === key1[0],
      }));
      return <Text>{`mutating: ${isMutating()}`}</Text>;
    }

    function Page() {
      const mutation1 = useMutation(() => ({ mutationKey: key1, mutationFn: () => sleep(100).then(() => "data") }));
      const mutation2 = useMutation(() => ({ mutationKey: key2, mutationFn: () => sleep(100).then(() => "data") }));
      const mutate1 = mutation1.mutate;
      const mutate2 = mutation2.mutate;
      return (
        <>
          <IsMutating />
          <Button
            label="start"
            onPress={() => {
              mutate1();
              mutate2();
            }}
          />
        </>
      );
    }

    return <Page />;
  },

  "useIsMutating › should use provided custom queryClient": () => {
    const queryClient = new QueryClient();
    const key = createKey();

    function Page() {
      const isMutating = useIsMutating(() => ({}), queryClient);
      const mutation = useMutation(
        () => ({ mutationKey: key, mutationFn: () => sleep(10).then(() => "data") }),
        queryClient,
      );
      const mutate = mutation.mutate;
      return (
        <View>
          <Text>{`mutating: ${isMutating()}`}</Text>
          <Start start={() => mutate()} />
        </View>
      );
    }

    return <Page />;
  },

  "useIsMutating › should update when filters change without a cache update": ({ queryClient }) => {
    const key = createKey();
    const otherKey = createKey();
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: key,
      mutationFn: () => sleep(100),
    });
    void mutation.execute(undefined);

    function Page() {
      const mutationKey = signal(key);
      const count = useIsMutating(() => ({ mutationKey: mutationKey() }));
      return (
        <View>
          <Text>{`mutating: ${count()}`}</Text>
          <Button label="change" onPress={() => mutationKey.set(otherKey)} />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should update when filters change without a cache update": ({ queryClient }) => {
    const key1 = createKey();
    const key2 = createKey();
    const cache = queryClient.getMutationCache();
    cache.build(queryClient, { mutationKey: key1 });
    cache.build(queryClient, { mutationKey: key2 });
    let cacheEvents = 0;
    cache.subscribe(() => {
      cacheEvents++;
    });

    function Page() {
      const mutationKey = signal(key1);
      const keys = useMutationState(() => ({
        filters: { mutationKey: mutationKey() },
        select: (mutation) => mutation.options.mutationKey,
      }));
      effect(() => log({ keys: keys(), cacheEvents }));
      return (
        <View>
          <Text>{`keys: ${JSON.stringify(keys())}`}</Text>
          <Button label="second" onPress={() => mutationKey.set(key2)} />
          <Button label="unknown" onPress={() => mutationKey.set(createKey())} />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should update when select changes without a cache update": ({ queryClient }) => {
    const key = createKey();
    queryClient.getMutationCache().build(queryClient, { mutationKey: key });

    function Page() {
      const select = signal<(mutation: Mutation) => unknown>((mutation) => mutation.options.mutationKey);
      const result = useMutationState(() => ({ select: select() }));
      return (
        <View>
          <Text>{`result: ${JSON.stringify(result())}`}</Text>
          <Button label="by status" onPress={() => select.set((mutation) => mutation.state.status)} />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should recompute object results on rerender with stable filters and select": ({
    queryClient,
  }) => {
    const key = createKey();
    const cache = queryClient.getMutationCache();
    const existingMutation = cache.build(queryClient, { mutationKey: key, meta: { time: 0 } });
    const state = existingMutation.state;
    const filters = { mutationKey: key };
    const select = (mutation: Mutation) => ({ time: mutation.meta?.time });
    const options = { filters, select };
    let cacheEvents = 0;
    cache.subscribe(() => {
      cacheEvents++;
    });

    function Page() {
      const rerender = signal(0);
      const result = useMutationState(() => {
        rerender();
        return options;
      });
      return (
        <View>
          <Text>{`result: ${JSON.stringify(result())}`}</Text>
          <Button
            label="update"
            onPress={() => {
              existingMutation.setOptions({ ...existingMutation.options, meta: { time: 1000 } });
              rerender.update((count) => count + 1);
              log({ sameState: existingMutation.state === state, cacheEvents });
            }}
          />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should recompute Date results on rerender with stable filters and select": ({ queryClient }) => {
    const key = createKey();
    const cache = queryClient.getMutationCache();
    const existingMutation = cache.build(queryClient, { mutationKey: key, meta: { time: 0 } });
    const state = existingMutation.state;
    const filters = { mutationKey: key };
    const select = (mutation: Mutation) => new Date(Number(mutation.meta?.time));
    const options = { filters, select };
    let cacheEvents = 0;
    cache.subscribe(() => {
      cacheEvents++;
    });

    function Page() {
      const rerender = signal(0);
      const result = useMutationState(() => {
        rerender();
        return options;
      });
      return (
        <View>
          <Text>{`result: ${JSON.stringify(result())}`}</Text>
          <Button
            label="update"
            onPress={() => {
              existingMutation.setOptions({ ...existingMutation.options, meta: { time: 1000 } });
              rerender.update((count) => count + 1);
              log({ sameState: existingMutation.state === state, cacheEvents });
            }}
          />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should render selector results that cannot be structurally shared": ({ queryClient }) => {
    const key = createKey();
    queryClient.getMutationCache().build(queryClient, { mutationKey: key });

    function Page() {
      const time = signal(0);
      const result = useMutationState(() => {
        const current = time();
        return { filters: { mutationKey: key }, select: () => new Date(current) };
      });
      return (
        <View>
          <Text>{`date: ${result()[0]?.toISOString()}`}</Text>
          <Button label="later" onPress={() => time.set(1000)} />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should update Date selector results when mutation state changes": () => {
    const key = createKey();
    const filters = { mutationKey: key };
    const select = (mutation: Mutation) => new Date(mutation.state.status === "success" ? 1000 : 0);

    function Dates() {
      const mutation = useMutation(() => ({ mutationKey: key, mutationFn: () => sleep(10) }));
      const result = useMutationState(() => ({ filters, select }));
      const mutate = mutation.mutate;
      return (
        <View>
          <Text>{`dates: ${JSON.stringify(result())}`}</Text>
          <Button label="mutate" onPress={() => mutate()} />
        </View>
      );
    }

    return <Dates />;
  },

  "useMutationState › should update when only the mutation state changes": () => {
    const key = createKey();
    const filters = { mutationKey: key };
    const select = (mutation: Mutation) => mutation.state.status;

    function Statuses() {
      const result = useMutationState(() => ({ filters, select }));
      return <Text>{`statuses: ${JSON.stringify(result())}`}</Text>;
    }

    function Mutate() {
      const mutation = useMutation(() => ({ mutationKey: key, mutationFn: () => sleep(10) }));
      const mutate = mutation.mutate;
      return <Button label="mutate" onPress={() => mutate()} />;
    }

    return (
      <View>
        <Statuses />
        <Mutate />
      </View>
    );
  },

  "useMutationState › should preserve the result reference with stable inputs": ({ queryClient }) => {
    const key = createKey();
    queryClient.getMutationCache().build(queryClient, { mutationKey: key });
    const filters = { status: "idle" as const };
    const select = (mutation: Mutation) => ({ key: mutation.options.mutationKey });

    function Page() {
      const rerender = signal(0);
      const result = useMutationState(() => {
        rerender();
        return { filters, select };
      });
      effect(() => log(result()));
      return (
        <View>
          <Text>{`result: ${JSON.stringify(result())}`}</Text>
          <Button label="rerender" onPress={() => rerender.update((count) => count + 1)} />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should preserve the result reference with inline inputs": ({ queryClient }) => {
    const key = createKey();
    queryClient.getMutationCache().build(queryClient, { mutationKey: key });
    const filters = { status: "idle" as const };
    const select = (mutation: Mutation) => ({ key: mutation.options.mutationKey });

    function Page() {
      const rerender = signal(0);
      const result = useMutationState(() => {
        rerender();
        return { filters: { ...filters }, select: (mutation) => select(mutation) };
      });
      effect(() => log(result()));
      return (
        <View>
          <Text>{`result: ${JSON.stringify(result())}`}</Text>
          <Button label="rerender" onPress={() => rerender.update((count) => count + 1)} />
        </View>
      );
    }

    return <Page />;
  },

  "useMutationState › should read from a changed custom queryClient": () => {
    const client1 = new QueryClient();
    const client2 = new QueryClient();
    const key1 = createKey();
    const key2 = createKey();
    client1.getMutationCache().build(client1, { mutationKey: key1 });
    client2.getMutationCache().build(client2, { mutationKey: key2 });
    const select = (mutation: Mutation) => mutation.options.mutationKey;
    const which = signal(1);

    function Page(props: { client: QueryClient }) {
      const keys = useMutationState(() => ({ select }), props.client);
      return <Text>{`keys: ${JSON.stringify(keys())}`}</Text>;
    }

    return (
      <View>
        <Button label="switch" onPress={() => which.set(2)} />
        <Button
          label="report"
          onPress={() =>
            log({
              client1: client1.getMutationCache().hasListeners(),
              client2: client2.getMutationCache().hasListeners(),
            })
          }
        />
        <If when={which() === 1}>
          <Page client={client1} />
        </If>
        <If when={which() === 2}>
          <Page client={client2} />
        </If>
      </View>
    );
  },

  "useMutationState › should remove successful mutations when the query client is cleared": ({ queryClient }) => {
    function Page() {
      const mutation = useMutation(() => ({ mutationFn: () => Promise.resolve("saved") }));
      const data = useMutationState(() => ({
        filters: { status: "success" },
        select: (mutation) => mutation.state.data,
      }));
      const mutate = mutation.mutate;
      return (
        <View>
          <Text>{`data: ${JSON.stringify(data())}`}</Text>
          <Button label="mutate" onPress={() => mutate()} />
          <Button
            label="clear"
            onPress={() => {
              queryClient.clear();
              log({ mutations: queryClient.getMutationCache().getAll().length });
            }}
          />
        </View>
      );
    }

    return <Page />;
  },

  "should return all mutation states when called without options": () => {
    const mutationKey = createKey();

    function States() {
      const mutationStates = useMutationState();
      return <Text>{`count: ${mutationStates().length}`}</Text>;
    }

    function Mutate() {
      const mutation = useMutation(() => ({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => `data${input}`),
      }));
      const mutate = mutation.mutate;
      return <Button label="mutate" onPress={() => mutate(1)} />;
    }

    return (
      <View>
        <States />
        <Mutate />
      </View>
    );
  },

  "should return variables after calling mutate": () => {
    const mutationKey = createKey();

    function Variables() {
      const variables = useMutationState(() => ({
        filters: { mutationKey, status: "pending" },
        select: (mutation) => mutation.state.variables,
      }));
      effect(() => log(variables()));
      return <Text>{`variables: ${JSON.stringify(variables())}`}</Text>;
    }

    function Mutate() {
      const mutation = useMutation(() => ({
        mutationKey,
        mutationFn: (input: number) => sleep(150).then(() => `data${input}`),
      }));
      const mutate = mutation.mutate;
      return (
        <View>
          <Text>{`data: ${mutation.data ?? "null"}`}</Text>
          <Button label="mutate" onPress={() => mutate(1)} />
        </View>
      );
    }

    return (
      <View>
        <Variables />
        <Mutate />
      </View>
    );
  },
};

runScenarios(scenarios);
