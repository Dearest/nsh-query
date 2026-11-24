# 0004. Export `use*` names only

Status: accepted

## Context

solid-query 5 exported `createQuery`, `createMutation`, ... and later moved to `useQuery`, `useMutation`, ... as its primary names, keeping `create*` as aliases. react-query, vue-query and preact-query use `use*`. NSH components are Solid-like, where `create*` is the convention for primitives.

## Decision

Export `useQuery`, `useInfiniteQuery`, `useQueries`, `useMutation`, `useIsFetching`, `useIsMutating`, `useMutationState`, `useQueryClient` and `useIsRestoring`, with no `create*` aliases.

## Consequences

- Code and documentation written for solid-query's current names and for react-query keep their names.
- One name per function: no aliases to document, type-test or keep in the API surface.
- Solid users who still write `createQuery` rename it (`docs/differences.md`).

## Alternatives considered

- **Both names, as solid-query.** Rejected: twice the surface for no behavior.
- **`create*` only, as NSH's own primitives (`signal`, `computed`).** Rejected: TanStack's documentation and ecosystem use `use*`.
