import { effect, signal, Text, View } from "nsh";
import { MutationCache, QueryClient, QueryClientProvider, useIsMutating, useMutation } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep } from "../../support/parity";
import type { Scenario } from "../../support/parity";

// Runs `start` once, when the effects of the components above it have run.
function Start(props: { start: () => void }) {
  effect(() => props.start());
  return <View />;
}

class QuietMutationCache extends MutationCache {
  override subscribe(listener: Parameters<MutationCache["subscribe"]>[0]) {
    super.subscribe(listener);
    return () => void 0;
  }
}

const scenarios: Record<string, Scenario> = {
  "should return the number of fetching mutations": () => {
    const mutationKey1 = createKey();
    const mutationKey2 = createKey();

    function IsMutating() {
      const isMutating = useIsMutating();
      effect(() => log(isMutating()));
      return <View />;
    }

    function Mutations() {
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(150).then(() => "data"),
      }));
      const mutation2 = useMutation(() => ({
        mutationKey: mutationKey2,
        mutationFn: () => sleep(50).then(() => "data"),
      }));
      const mutate1 = mutation1.mutate;
      const mutate2 = mutation2.mutate;
      return (
        <Start
          start={() => {
            mutate1();
            setTimeout(() => mutate2(), 50);
          }}
        />
      );
    }

    return (
      <View>
        <IsMutating />
        <Mutations />
      </View>
    );
  },

  "should filter correctly by mutationKey": () => {
    const mutationKey1 = createKey();
    const mutationKey2 = createKey();

    function IsMutating() {
      const isMutating = useIsMutating(() => ({ mutationKey: mutationKey1 }));
      effect(() => log(isMutating()));
      return <View />;
    }

    function Page() {
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(100).then(() => "data"),
      }));
      const mutation2 = useMutation(() => ({
        mutationKey: mutationKey2,
        mutationFn: () => sleep(100).then(() => "data"),
      }));
      const mutate1 = mutation1.mutate;
      const mutate2 = mutation2.mutate;
      return (
        <>
          <IsMutating />
          <Start
            start={() => {
              mutate1();
              mutate2();
            }}
          />
        </>
      );
    }

    return <Page />;
  },

  "should filter correctly by predicate": () => {
    const mutationKey1 = createKey();
    const mutationKey2 = createKey();

    function IsMutating() {
      const isMutating = useIsMutating(() => ({
        predicate: (mutation) => mutation.options.mutationKey?.[0] === mutationKey1[0],
      }));
      effect(() => log(isMutating()));
      return <View />;
    }

    function Page() {
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(100).then(() => "data"),
      }));
      const mutation2 = useMutation(() => ({
        mutationKey: mutationKey2,
        mutationFn: () => sleep(100).then(() => "data"),
      }));
      const mutate1 = mutation1.mutate;
      const mutate2 = mutation2.mutate;
      return (
        <>
          <IsMutating />
          <Start
            start={() => {
              mutate1();
              mutate2();
            }}
          />
        </>
      );
    }

    return <Page />;
  },

  "should use provided custom queryClient": () => {
    const customClient = new QueryClient();
    const mutationKey1 = createKey();

    function Page() {
      const isMutating = useIsMutating(undefined, customClient);
      const mutation = useMutation(
        () => ({
          mutationKey: mutationKey1,
          mutationFn: () => sleep(20).then(() => "data"),
        }),
        customClient,
      );
      const mutate = mutation.mutate;
      setTimeout(() => mutate(), 10);
      return <Text>{`mutating: ${isMutating()}`}</Text>;
    }

    return <Page />;
  },

  "should resubscribe when a custom queryClient changes": () => {
    const queryClient1 = new QueryClient();
    const queryClient2 = new QueryClient();
    const which = signal(1);
    const unsubscribes = signal(0);
    const mutationCache1 = queryClient1.getMutationCache();
    const originalSubscribe1 = mutationCache1.subscribe.bind(mutationCache1);
    mutationCache1.subscribe = (listener) => {
      const stop = originalSubscribe1(listener);
      return () => {
        unsubscribes.update((count) => count + 1);
        stop();
      };
    };

    function Page(props: { client: QueryClient }) {
      const isMutating = useIsMutating(undefined, props.client);
      return <Text>{`mutating: ${isMutating()}`}</Text>;
    }

    const run = (client: QueryClient, data: string) =>
      void client
        .getMutationCache()
        .build(client, { mutationFn: () => sleep(20).then(() => data) })
        .execute(undefined);

    return (
      <View>
        <Button label="start1" onPress={() => run(queryClient1, "data1")} />
        <Button label="switch" onPress={() => which.set(2)} />
        <Button label="start2" onPress={() => run(queryClient2, "data2")} />
        <Text>{`unsubscribed: ${unsubscribes()}`}</Text>
        <If when={which() === 1}>
          <Page client={queryClient1} />
        </If>
        <If when={which() === 2}>
          <Page client={queryClient2} />
        </If>
      </View>
    );
  },

  "should not change state if unmounted": () => {
    // The cache never drops its listener, so a state change after unmount would show.
    const spiedClient = new QueryClient({ mutationCache: new QuietMutationCache() });
    const mutationKey1 = createKey();

    function IsMutating() {
      const isMutating = useIsMutating();
      effect(() => log(isMutating()));
      return <View />;
    }

    function Page() {
      const mounted = signal(true);
      const mutation1 = useMutation(() => ({
        mutationKey: mutationKey1,
        mutationFn: () => sleep(10).then(() => "data"),
      }));
      const mutate1 = mutation1.mutate;
      return (
        <View>
          <Button label="unmount" onPress={() => mounted.set(false)} />
          <Button label="status" onPress={() => log({ status: spiedClient.getMutationCache().getAll()[0]?.state.status })} />
          <If when={mounted()}>
            <IsMutating />
          </If>
          <Start start={() => mutate1()} />
        </View>
      );
    }

    return (
      <QueryClientProvider client={spiedClient}>
        <Page />
      </QueryClientProvider>
    );
  },
};

runScenarios(scenarios);
