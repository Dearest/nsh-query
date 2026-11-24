import { effect, signal, Text, View } from "nsh";
import { QueryCache, QueryClient, useIsFetching, useQuery } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep } from "../../support/parity";
import type { Scenario } from "../../support/parity";

const scenarios: Record<string, Scenario> = {
  "should update as queries start and stop fetching": () => {
    const key = createKey();

    function IsFetching() {
      const isFetching = useIsFetching();
      return <Text>{`isFetching: ${isFetching()}`}</Text>;
    }

    function Query() {
      const ready = signal(false);
      useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(50).then(() => "test"),
        enabled: ready(),
      }));
      return <Button label="setReady" onPress={() => ready.set(true)} />;
    }

    return (
      <View>
        <IsFetching />
        <Query />
      </View>
    );
  },

  "should not update state while rendering": () => {
    const key1 = createKey();
    const key2 = createKey();

    function IsFetching() {
      const isFetching = useIsFetching();
      effect(() => log(isFetching()));
      return <View />;
    }

    function FirstQuery() {
      useQuery(() => ({ queryKey: key1, queryFn: () => sleep(150).then(() => "data") }));
      return <View />;
    }

    function SecondQuery() {
      useQuery(() => ({ queryKey: key2, queryFn: () => sleep(200).then(() => "data") }));
      return <View />;
    }

    function Page() {
      const renderSecond = signal(false);
      setTimeout(() => renderSecond.set(true), 100);
      return (
        <>
          <IsFetching />
          <FirstQuery />
          <If when={renderSecond()}>
            <SecondQuery />
          </If>
        </>
      );
    }

    return <Page />;
  },

  "should be able to filter": () => {
    const key1 = createKey();
    const key2 = createKey();

    function One() {
      useQuery(() => ({ queryKey: key1, queryFn: () => sleep(10).then(() => "test") }));
      return <View />;
    }

    function Two() {
      useQuery(() => ({ queryKey: key2, queryFn: () => sleep(20).then(() => "test") }));
      return <View />;
    }

    function Page() {
      const started = signal(false);
      const isFetching = useIsFetching(() => ({ queryKey: key1 }));
      effect(() => log(isFetching()));
      return (
        <View>
          <Button label="setStarted" onPress={() => started.set(true)} />
          <Text>{`isFetching: ${isFetching()}`}</Text>
          <If when={started()}>
            <View>
              <One />
              <Two />
            </View>
          </If>
        </View>
      );
    }

    return <Page />;
  },

  "should show the correct fetching state when mounted after a query": () => {
    const key = createKey();

    function Page() {
      useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }));
      const isFetching = useIsFetching();
      return <Text>{`isFetching: ${isFetching()}`}</Text>;
    }

    return <Page />;
  },

  "should use provided custom queryClient": () => {
    const queryCache = new QueryCache({ onSuccess: () => log("onSuccess") });
    const customClient = new QueryClient({ queryCache });
    const key = createKey();

    function Page() {
      useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }), customClient);
      const isFetching = useIsFetching(undefined, customClient);
      return <Text>{`isFetching: ${isFetching()}`}</Text>;
    }

    return <Page />;
  },

  "should resubscribe when a custom queryClient changes": () => {
    const queryClient1 = new QueryClient();
    const queryClient2 = new QueryClient();
    const key1 = createKey();
    const key2 = createKey();
    const which = signal(1);
    const unsubscribes = signal(0);
    const queryCache1 = queryClient1.getQueryCache();
    const originalSubscribe1 = queryCache1.subscribe.bind(queryCache1);
    queryCache1.subscribe = (listener) => {
      const stop = originalSubscribe1(listener);
      return () => {
        unsubscribes.update((count) => count + 1);
        stop();
      };
    };

    function Page(props: { client: QueryClient }) {
      const isFetching = useIsFetching(undefined, props.client);
      return <Text>{`isFetching: ${isFetching()}`}</Text>;
    }

    return (
      <View>
        <Button
          label="start1"
          onPress={() => void queryClient1.query({ queryKey: key1, queryFn: () => sleep(20).then(() => "test1") })}
        />
        <Button label="switch" onPress={() => which.set(2)} />
        <Button
          label="start2"
          onPress={() => void queryClient2.query({ queryKey: key2, queryFn: () => sleep(20).then(() => "test2") })}
        />
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
};

runScenarios(scenarios);
