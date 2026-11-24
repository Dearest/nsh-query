# 0003. Focused means "not in the background"

Status: accepted

## Context

query-core's `focusManager` drives refetching on focus and pauses `refetchInterval` polling and retries while unfocused (unless `refetchIntervalInBackground`). In browsers, v5 takes the focus from `visibilitychange`: a tab is focused while it is visible.

NSH reports `lifecycle()`: `"active"` (in use), `"inactive"` (visible, but another app or window has the focus, or the system shows something over it) and `"background"` (not visible). It also counts wakes from sleep (`wakeCount()`), which on desktops may leave `lifecycle()` unchanged.

## Decision

`connectNsh()` sets `focusManager.setFocused(lifecycle() !== "background")`, and calls `focusManager.onFocus()` on each wake. Its first run only records the state, so mounting the app does not count as a return to it. Apps that want `"inactive"` to count as unfocused pass `connectNsh({ focused: (state) => state === "active" })`.

## Consequences

- Same semantics as react-query and solid-query in a browser: a visible window keeps polling; one in the background stops; coming back refetches stale queries.
- Clicking another window on a desktop does not stop polling or trigger refetches when coming back.
- A laptop waking with the app in front refetches stale queries, as returning to a hidden tab does.

## Alternatives considered

- **`"active"` only counts as focused.** Rejected as the default: on desktops, polling would stop whenever the user clicks another window, and refetches would fire on every window switch.
- **Ignore wakes.** Rejected: after a sleep, network connections and timers did not live through it; stale data should refresh.
