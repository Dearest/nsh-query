import { effect, lifecycle, network, untracked, wakeCount } from "nsh";
import { focusManager, onlineManager } from "./core";

/** What `lifecycle()` reports: in use, visible without the focus, or not visible. */
export type LifecycleState = "active" | "inactive" | "background";

export interface ConnectNshOptions {
  /**
   * Whether queries count as focused in a lifecycle state. By default only
   * `"background"` is unfocused, as a hidden browser tab is for TanStack Query:
   * a window that is visible but not focused keeps polling.
   */
  focused?: (state: LifecycleState) => boolean;
}

/**
 * Connects query-core's focus and online managers to NSH's platform signals:
 * `lifecycle()` sets the focus, `network().online` the connection, and each
 * wake from sleep (`wakeCount()`) counts as the app becoming visible again.
 *
 * `QueryClientProvider` calls it for you. Call it in a component body when you
 * pass a `QueryClient` to the hooks directly instead of providing one.
 *
 * @example
 * ```tsx
 * function App() {
 *   queryClient.mount();
 *   cleanup(() => queryClient.unmount());
 *   connectNsh({ focused: (state) => state === "active" });
 *   return <Todos client={queryClient} />;
 * }
 * ```
 */
export function connectNsh(options: ConnectNshOptions = {}): void {
  const isFocused = options.focused ?? ((state: LifecycleState) => state !== "background");

  effect(() => {
    const state = lifecycle();
    untracked(() => focusManager.setFocused(isFocused(state)));
  });

  effect(() => {
    const online = network().online;
    untracked(() => onlineManager.setOnline(online));
  });

  let wakes = untracked(wakeCount);
  effect(() => {
    const count = wakeCount();
    if (count === wakes) return;
    wakes = count;
    untracked(() => focusManager.onFocus());
  });
}
