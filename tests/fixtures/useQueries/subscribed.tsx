import { signal, Text, View } from "nsh";
import { useQueries } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep } from "../../support/parity";
import type { Scenario } from "../../support/parity";

// useQueries' top-level `subscribed`. The title matching react-query's test is a port of it.

const scenarios: Record<string, Scenario> = {
  "should not optimistically show fetching when unsubscribed": ({ queryClient }) => {
    const key = createKey();
    let calls = 0;
    const results = useQueries(() => ({
      queries: [
        {
          queryKey: key,
          queryFn: () => {
            calls += 1;
            return Promise.resolve("data");
          },
        },
      ],
      subscribed: false,
    }));
    return (
      <View>
        <Text>{`isFetching: ${String(results[0]!.isFetching)}`}</Text>
        <Text>{`fetchStatus: ${results[0]!.fetchStatus}`}</Text>
        <Button
          label="report"
          onPress={() => log({ calls, observers: queryClient.getQueryCache().find({ queryKey: key })?.observers.length })}
        />
      </View>
    );
  },

  "subscribed: false detaches every query until it is true again": ({ queryClient }) => {
    const keys = [createKey(), createKey()];
    let calls = 0;
    const subscribed = signal(false);
    for (const key of keys) queryClient.setQueryData(key, "cached");
    const results = useQueries(() => ({
      queries: keys.map((key) => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            calls += 1;
            return `fetched ${calls}`;
          }),
      })),
      subscribed: subscribed(),
    }));
    const observers = () => keys.map((key) => queryClient.getQueryCache().find({ queryKey: key })?.observers.length);
    return (
      <View>
        <Text>{`data: ${results.map((result) => result.data).join(", ")}`}</Text>
        <Button label="subscribe" onPress={() => subscribed.set(true)} />
        <Button label="report" onPress={() => log({ calls, observers: observers() })} />
      </View>
    );
  },
};

runScenarios(scenarios);
