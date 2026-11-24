import { batch, mount, signal, Text, View } from "nsh";
import {
  environmentManager,
  focusManager,
  notifyManager,
  onlineManager,
  QueryClient,
  QueryObserver,
} from "nsh-query";
import type { QueryObserverResult } from "nsh-query";

// The query-core members the adapter relies on that are internal or
// semi-public. Each check renders `<name>: ok` or `<name>: FAIL <reason>`.

const results = signal<string[]>([]);
const report = (name: string, outcome: string) => results.update((list) => [...list, `${name}: ${outcome}`]);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const settle = async () => {
  for (let i = 0; i < 5; i++) await tick();
};

const checks: [string, () => void | Promise<void>][] = [
  [
    "QueryClient.defaultQueryOptions",
    () => {
      const client = new QueryClient({ defaultOptions: { queries: { staleTime: 123 } } });
      const options = client.defaultQueryOptions({ queryKey: ["todos"] });
      assert(options._defaulted === true, "not marked _defaulted");
      assert(options.queryHash === '["todos"]', `queryHash is ${options.queryHash}`);
      assert(options.staleTime === 123, "client defaults not applied");
    },
  ],
  [
    "QueryObserver.getOptimisticResult",
    () => {
      const client = new QueryClient();
      const options = client.defaultQueryOptions({ queryKey: ["todos"], queryFn: () => [] });
      const observer = new QueryObserver(client, options);
      const result = observer.getOptimisticResult(options);
      assert(result.status === "pending", `status is ${result.status}`);
      client.setQueryData(["todos"], ["cached"]);
      assert(observer.getOptimisticResult(options).data?.[0] === "cached", "cached data not in the result");
    },
  ],
  [
    "_optimisticResults: optimistic",
    () => {
      const client = new QueryClient();
      const options = client.defaultQueryOptions({ queryKey: ["todos"], queryFn: () => [] });
      options._optimisticResults = "optimistic";
      const result = new QueryObserver(client, options).getOptimisticResult(options);
      assert(result.fetchStatus === "fetching", `fetchStatus is ${result.fetchStatus}`);
    },
  ],
  [
    "_optimisticResults: isRestoring",
    () => {
      const client = new QueryClient();
      const options = client.defaultQueryOptions({ queryKey: ["todos"], queryFn: () => [] });
      options._optimisticResults = "isRestoring";
      const result = new QueryObserver(client, options).getOptimisticResult(options);
      assert(result.fetchStatus === "idle", `fetchStatus is ${result.fetchStatus}`);
    },
  ],
  [
    "QueryObserver.trackProp",
    async () => {
      const client = new QueryClient();
      const options = { queryKey: ["todos"], queryFn: () => ["same"] };
      const dataOnly = new QueryObserver(client, options);
      const fetching = new QueryObserver(client, options);
      dataOnly.trackProp("data");
      fetching.trackProp("isFetching");
      const seen = { dataOnly: 0, fetching: 0 };
      const offDataOnly = dataOnly.subscribe(() => seen.dataOnly++);
      const offFetching = fetching.subscribe(() => seen.fetching++);
      await settle();
      const after = { ...seen };
      await client.refetchQueries({ queryKey: ["todos"] });
      await settle();
      offDataOnly();
      offFetching();
      assert(seen.dataOnly === after.dataOnly, `data-only observer notified ${seen.dataOnly - after.dataOnly} times on a refetch that left data as it was`);
      assert(seen.fetching >= after.fetching + 2, "isFetching observer not notified of the refetch");
    },
  ],
  [
    "QueryObserver.updateResult",
    () => {
      const client = new QueryClient();
      const observer = new QueryObserver<string[]>(client, { queryKey: ["todos"], enabled: false });
      assert(observer.getCurrentResult().data === undefined, "data before the update");
      client.setQueryData(["todos"], ["changed"]);
      observer.updateResult();
      const result: QueryObserverResult<string[]> = observer.getCurrentResult();
      assert(result.data?.[0] === "changed", "updateResult did not pick up the cache change");
    },
  ],
  [
    "environmentManager.setIsServer",
    () => {
      assert(environmentManager.isServer() === false, "nsh-query did not set isServer to false on import");
      environmentManager.setIsServer(() => true);
      assert(environmentManager.isServer() === true, "setIsServer(() => true) not applied");
      environmentManager.setIsServer(() => false);
      assert(environmentManager.isServer() === false, "setIsServer(() => false) not applied");
    },
  ],
  [
    "focusManager.setEventListener",
    () => {
      let handler: ((focused?: boolean) => void) | undefined;
      let cleaned = false;
      focusManager.setEventListener((onFocus) => {
        handler = onFocus;
        return () => {
          cleaned = true;
        };
      });
      assert(handler, "setup not called");
      handler(false);
      assert(focusManager.isFocused() === false, "the setup's callback did not set the focus");
      focusManager.setEventListener(() => () => {});
      assert(cleaned, "the previous setup's cleanup did not run");
      focusManager.setFocused(true);
    },
  ],
  [
    "focusManager.setFocused",
    () => {
      const seen: boolean[] = [];
      const off = focusManager.subscribe((focused) => seen.push(focused));
      focusManager.setFocused(false);
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      off();
      assert(seen.join() === "false,true", `listeners saw ${seen.join()}`);
      assert(focusManager.isFocused() === true, "isFocused() did not follow");
    },
  ],
  [
    "focusManager.onFocus",
    () => {
      const seen: boolean[] = [];
      const off = focusManager.subscribe((focused) => seen.push(focused));
      focusManager.onFocus();
      off();
      assert(seen.join() === "true", `listeners saw ${seen.join()}`);
    },
  ],
  [
    "onlineManager.setEventListener",
    () => {
      let handler: ((online: boolean) => void) | undefined;
      onlineManager.setEventListener((setOnline) => {
        handler = setOnline;
        return () => {};
      });
      assert(handler, "setup not called");
      handler(false);
      assert(onlineManager.isOnline() === false, "the setup's callback did not set the connection");
      handler(true);
      onlineManager.setEventListener(() => () => {});
    },
  ],
  [
    "onlineManager.setOnline",
    () => {
      const seen: boolean[] = [];
      const off = onlineManager.subscribe((online) => seen.push(online));
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
      onlineManager.setOnline(true);
      off();
      assert(seen.join() === "false,true", `listeners saw ${seen.join()}`);
    },
  ],
  [
    "notifyManager.setBatchNotifyFunction",
    async () => {
      let batches = 0;
      notifyManager.setBatchNotifyFunction((callback) => {
        batches++;
        batch(callback);
      });
      const calls: number[] = [];
      const notify = notifyManager.batchCalls((n: number) => calls.push(n));
      notifyManager.batch(() => {
        notify(1);
        notify(2);
      });
      await settle();
      notifyManager.setBatchNotifyFunction(batch);
      assert(calls.join() === "1,2", `calls were ${calls.join()}`);
      assert(batches === 1, `${batches} batches`);
    },
  ],
  [
    "QueryClient.mount / unmount",
    () => {
      const client = new QueryClient();
      assert(!focusManager.hasListeners() && !onlineManager.hasListeners(), "listeners before mount");
      client.mount();
      assert(focusManager.hasListeners() && onlineManager.hasListeners(), "mount did not subscribe");
      client.unmount();
      assert(!focusManager.hasListeners() && !onlineManager.hasListeners(), "unmount did not unsubscribe");
    },
  ],
];

async function run() {
  for (const [name, check] of checks) {
    try {
      await check();
      report(name, "ok");
    } catch (error) {
      report(name, `FAIL ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  report("all", "done");
}

void run();

mount(() => (
  <View>
    <Each of={results()}>{(line) => <Text>{line()}</Text>}</Each>
  </View>
));
