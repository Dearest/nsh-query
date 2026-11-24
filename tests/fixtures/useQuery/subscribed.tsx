import { signal, Text, View } from "nsh";
import { useQuery } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep } from "../../support/parity";
import type { Scenario, ScenarioContext } from "../../support/parity";

// The `subscribed` option. Titles that match react-query's tests are ports of
// them (tests/PARITY.md).

const observers = ({ queryClient }: ScenarioContext, key: string[]) =>
  queryClient.getQueryCache().find({ queryKey: key })?.observers.length ?? 0;

function counter() {
  let fetches = 0;
  return {
    fetches: () => fetches,
    queryFn: () =>
      sleep(10).then(() => {
        fetches += 1;
        return `data ${fetches}`;
      }),
  };
}

const scenarios: Record<string, Scenario> = {
  "subscribed: false shows the cached data without fetching": (ctx) => {
    const key = createKey();
    const source = counter();
    ctx.queryClient.setQueryData(key, "cached");
    const query = useQuery(() => ({ queryKey: key, queryFn: source.queryFn, subscribed: false }));
    return (
      <View>
        <Text>{`data: ${query.data ?? "none"}`}</Text>
        <Text>{`fetchStatus: ${query.fetchStatus}`}</Text>
        <Button label="report" onPress={() => log({ fetches: source.fetches(), observers: observers(ctx, key) })} />
      </View>
    );
  },

  "polling stops and cache updates are not shown while unsubscribed": (ctx) => {
    const key = createKey();
    const source = counter();
    const subscribed = signal(true);
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: source.queryFn,
      refetchInterval: 50,
      subscribed: subscribed(),
    }));
    return (
      <View>
        <Text>{`data: ${query.data ?? "none"}`}</Text>
        <Button label="unsubscribe" onPress={() => subscribed.set(false)} />
        <Button label="set data" onPress={() => ctx.queryClient.setQueryData(key, "from elsewhere")} />
        <Button label="report" onPress={() => log({ fetches: source.fetches(), observers: observers(ctx, key) })} />
      </View>
    );
  },

  "subscribing again refetches stale data once": (ctx) => {
    const key = createKey();
    const source = counter();
    const subscribed = signal(true);
    const query = useQuery(() => ({ queryKey: key, queryFn: source.queryFn, staleTime: 100, subscribed: subscribed() }));
    return (
      <View>
        <Text>{`data: ${query.data ?? "none"}`}</Text>
        <Button label="unsubscribe" onPress={() => subscribed.set(false)} />
        <Button label="subscribe" onPress={() => subscribed.set(true)} />
        <Button label="report" onPress={() => log({ fetches: source.fetches(), observers: observers(ctx, key) })} />
      </View>
    );
  },

  "changing other options while unsubscribed does not subscribe": (ctx) => {
    const key = createKey();
    const source = counter();
    const suffix = signal("");
    ctx.queryClient.setQueryData(key, "cached");
    const query = useQuery(() => {
      const end = suffix();
      return {
        queryKey: key,
        queryFn: source.queryFn,
        subscribed: false,
        select: (data: string) => `${data}${end}`,
      };
    });
    return (
      <View>
        <Text>{`data: ${query.data ?? "none"}`}</Text>
        <Button label="change select" onPress={() => suffix.set("!")} />
        <Button label="report" onPress={() => log({ fetches: source.fetches(), observers: observers(ctx, key) })} />
      </View>
    );
  },

  "should be able to toggle subscribed": (ctx) => {
    const key = createKey();
    let calls = 0;
    const subscribed = signal(true);
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => {
        calls += 1;
        return Promise.resolve("data");
      },
      subscribed: subscribed(),
    }));
    return (
      <View>
        <Text>{`data: ${query.data ?? ""}`}</Text>
        <Button label="toggle" onPress={() => subscribed.update((value) => !value)} />
        <Button label="report" onPress={() => log({ calls, observers: observers(ctx, key) })} />
      </View>
    );
  },

  "should not optimistically show fetching when unsubscribed": (ctx) => {
    const key = createKey();
    let calls = 0;
    const subscribed = signal(true);
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => {
        calls += 1;
        return Promise.resolve("data");
      },
      subscribed: subscribed(),
    }));
    return (
      <View>
        <Text>{`isFetching: ${String(query.isFetching)}`}</Text>
        <Text>{`fetchStatus: ${query.fetchStatus}`}</Text>
        <Button label="unsubscribe" onPress={() => subscribed.set(false)} />
        <Button label="report" onPress={() => log({ calls, observers: observers(ctx, key) })} />
      </View>
    );
  },

  "should not be attached to the query when subscribed is false": (ctx) => {
    const key = createKey();
    let calls = 0;
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => {
        calls += 1;
        return Promise.resolve("data");
      },
      subscribed: false,
    }));
    return (
      <View>
        <Text>{`data: ${query.data ?? ""}`}</Text>
        <Button label="report" onPress={() => log({ calls, observers: observers(ctx, key) })} />
      </View>
    );
  },

  "should not re-render when data is added to the cache when subscribed is false": (ctx) => {
    const key = createKey();
    let runs = 0;
    const query = useQuery(() => ({ queryKey: key, queryFn: () => Promise.resolve("data"), subscribed: false }));
    const label = () => {
      runs += 1;
      return query.data ? `has data${query.data}` : "no data";
    };
    return (
      <View>
        <Text>{label()}</Text>
        <Button label="set data" onPress={() => ctx.queryClient.setQueryData<string>(key, "new data")} />
        <Button label="report" onPress={() => log({ runs })} />
      </View>
    );
  },
};

runScenarios(scenarios);
