// The fixture side of the upstream parity tests (tests/PARITY.md). A parity
// fixture holds many scenarios, each a port of one upstream test; the test
// picks one with `open(entry, { host: { params: { scenario } } })`.
//
// What upstream tests keep in variables (`states.push(...)`, `fetchCount`) a
// scenario hands to `log`, which the test reads back with `logs(app)`.
import { host, mount, signal, Text, View } from "nsh";
import type { JSX } from "nsh";
import { QueryCache, QueryClient, QueryClientProvider } from "nsh-query";

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let keyCount = 0;
/** A query key of its own for each call, as upstream's `createKey()`. */
export function createKey(): string[] {
  keyCount += 1;
  return [`query_${keyCount}`];
}

function toJson(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) => {
    if (v === undefined) return { $undefined: true };
    if (typeof v === "function") return "[Function]";
    if (v instanceof Error) return { $error: v.message };
    return v;
  });
}

const lines = signal<string[]>([]);

/** Records `value` (a snapshot: functions as "[Function]", errors as `{ $error: message }`). */
export function log(value: unknown): void {
  lines.update((list) => [...list, toJson(value)]);
}

/** A plain copy of a hook result, for `log`. */
export function snapshot<T extends object>(result: T): T {
  return { ...result };
}

export interface ScenarioContext {
  queryClient: QueryClient;
  queryCache: QueryCache;
}

export type Scenario = (context: ScenarioContext) => JSX.Element;

/**
 * Mounts the scenario the test asked for. By default it renders inside a
 * `QueryClientProvider` of a new client, as upstream's `renderWithClient`;
 * `provider: false` leaves the provider to the scenario.
 */
export function runScenarios(scenarios: Record<string, Scenario>, options: { provider?: boolean } = {}): void {
  const name = String(host.params["scenario"]);
  const scenario = scenarios[name];
  if (!scenario) throw new Error(`no scenario named ${name}`);
  const queryCache = new QueryCache();
  const queryClient = new QueryClient({ queryCache });
  const context = { queryClient, queryCache };
  mount(() => (
    <View>
      {options.provider === false ? (
        scenario(context)
      ) : (
        <QueryClientProvider client={queryClient}>{scenario(context)}</QueryClientProvider>
      )}
      <Text testID="log-count">{`log-count:${lines().length}`}</Text>
      <Each of={lines()} key="index">
        {(line) => <Text class="line-clamp-1">{`log:${line()}`}</Text>}
      </Each>
    </View>
  ));
}
