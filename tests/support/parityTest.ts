// The test side of the upstream parity tests: open a scenario of a parity
// fixture, read what it logged.
import { open } from "nsh/test";
import type { App, OpenOptions } from "nsh/test";

/**
 * Opens `scenario` of the fixture `entry` on a manual clock. The viewport is
 * tall: `app.texts()` only reads what is on screen, and logs can be long.
 */
export function openScenario(entry: string, scenario: string, options: OpenOptions = {}): Promise<App> {
  return open(entry, { clock: {}, width: 2000, height: 100_000, ...options, host: { params: { scenario } } });
}

// Puts back the `undefined` values the fixture marked, keeping their keys.
function restoreUndefined(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if ("$undefined" in value) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) record[key] = restoreUndefined(record[key]);
  return value;
}

/**
 * What the scenario logged, in order. Throws when it cannot read every entry
 * the fixture counted (`app.texts()` reads only what is on screen).
 */
export function logs<T = any>(app: App): T[] {
  const texts = app.texts();
  const counted = texts.find((text) => text.startsWith("log-count:"));
  if (counted === undefined) throw new Error("logs(): the fixture shows no log-count: is it a parity fixture?");
  const entries = texts.filter((text) => text.startsWith("log:"));
  const expected = Number(counted.slice("log-count:".length));
  if (entries.length !== expected) {
    throw new Error(`logs(): read ${entries.length} of the ${expected} entries the fixture logged; open it with a larger viewport`);
  }
  return entries.map((text) => restoreUndefined(JSON.parse(text.slice(4))) as T);
}

/** Moves the app's manual clock by `ms`, as upstream's `vi.advanceTimersByTimeAsync(ms)`. */
export function advance(app: App, ms: number): Promise<void> {
  return app.clock!.runFor(ms);
}

/** How an upstream `new Error(message)` reads in a log. */
export const error = (message: string) => ({ $error: message });
