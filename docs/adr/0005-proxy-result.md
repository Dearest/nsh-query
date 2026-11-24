# 0005. Results are read-only proxies that track what is read

Status: accepted

## Context

An NSH component runs once; only the bindings, `computed` values and effects that read a signal run again. A hook result must therefore be read lazily, where it is used (`todo.data` in a binding), not destructured in the component body. query-core's `QueryObserver` can notify only when a property that was read changes (`trackProp`, react-query's "tracked properties"), which avoids work when, say, only `isFetching` changed.

solid-query returns a Solid store kept in sync with `reconcile`; NSH has no stores.

## Decision

The hooks return a `Proxy` (`src/readonlyView.ts`) over a signal holding the current result. Each property read reads the signal, so it is reactive where it happens, and calls `observer.trackProp(name)`. `has`, `ownKeys` and `getOwnPropertyDescriptor` are implemented, so `in`, `Object.keys` and spreading work; writes fail. The signal compares results shallowly, so a notification with the same values does not run anything. Subscriptions go through `notifyManager.batchCalls`, and `notifyManager` batches with NSH's `batch`, so one query update runs each dependant once. `structuralSharing` stays on: unchanged parts of `data` keep their identity, which `<Each>` uses to keep rows.

## Consequences

- `todo.data`, `todo.isPending`, `todo.refetch()` read as in solid-query.
- A binding re-runs when any property its result tracks changes; with one signal per result, a binding reading only `data` also re-runs when another binding of the same result reads `isFetching` and it flips (with the same `data`, so nothing on screen changes).
- `throwOnError` throws when `data` is read, so the nearest `<ErrorBoundary>` around the reading binding takes it, as in solid-query.

## Alternatives considered

- **Accessors per property (`todo.data()`)**, as angular-query. Rejected: further from solid-query and react-query code, and NSH bindings already make property reads reactive.
- **One signal per property.** Finer-grained (a binding reading only `data` never re-runs for `isFetching`), at the cost of more code and signals per hook; can be revisited without changing the API.
- **A plain object replaced on each update.** Rejected: destructuring-free reads in the body would see stale objects, and nothing would be reactive.
