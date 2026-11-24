# 0001. Which TanStack adapter nsh-query aligns with

Status: accepted

## Context

nsh-query adapts `@tanstack/query-core` to NSH. TanStack ships official adapters for React, Solid, Vue, Svelte and Angular, and each one answers three separate questions: what the API looks like, how the adapter is built, and how queries behave. "Align with solid-query" is ambiguous unless those three are named separately.

NSH's reactive graph follows Solid's model: signals, computed values, effects, owners and context. A component function runs once, and after that only the bindings that read a signal run again.

## Decision

Alignment is defined per layer.

| Layer | Reference | Why |
|---|---|---|
| API shape | `@tanstack/solid-query` | Components run once, so options must be a function (`useQuery(() => ({ ... }))`) and results must be read by property (`todo.data`) without destructuring. These are exactly the points where solid-query differs from react-query. Export names follow solid-query's current primary names (`useQuery`, `useMutation`, ...). |
| Implementation | `@tanstack/react-query`'s `useBaseQuery` | It depends only on query-core: take the optimistic result, subscribe, track accessed properties. It maps directly onto an NSH `signal`. |
| Behavior | `@tanstack/query-core` | Caching, staleness, retries and deduplication are query-core's, vendored unmodified. The adapter neither changes nor extends them. |

## Consequences

- solid-query documentation and examples apply to nsh-query with few changes. The remaining differences are listed in `docs/differences.md`.
- When porting a feature, read solid-query for types and the export list, and react-query for how the adapter code works.
- Upstream parity tests are taken from both adapters (`tests/PARITY.md`).

## Alternatives considered

- **Port solid-query's implementation.** Rejected: its `useBaseQuery` is built on `createResource`, `createStore`, `reconcile`, Suspense and SSR hydration. NSH has none of them.
- **Angular-style results (`query.data()`).** Each field would be an accessor. Rejected: NSH's JSX already makes property reads reactive, so the Solid shape works and stays closer to what react-query and solid-query users write.
- **React-style API (plain options object, destructured result).** Rejected: a plain object reads props once, and a destructured result never updates, because the component body does not run again.
