// Every name of the public API imports from "nsh-query".
import {
  connectNsh,
  infiniteQueryOptions,
  IsRestoringContext,
  mutationOptions,
  QueryClient,
  QueryClientContext,
  QueryClientProvider,
  queryOptions,
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useIsRestoring,
  useMutation,
  useMutationState,
  useQueries,
  useQuery,
  useQueryClient,
} from "nsh-query";
import type {
  DefinedUseQueryResult,
  QueryClientProviderProps,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "nsh-query";
import { expectType } from "./helpers";
import type { Equal } from "./helpers";

export const values = [
  connectNsh,
  infiniteQueryOptions,
  IsRestoringContext,
  mutationOptions,
  QueryClientContext,
  QueryClientProvider,
  queryOptions,
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useIsRestoring,
  useMutation,
  useMutationState,
  useQueries,
  useQuery,
  useQueryClient,
];

export type Types = [
  DefinedUseQueryResult,
  QueryClientProviderProps,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
];

export function clientCases(client: QueryClient, props: QueryClientProviderProps) {
  expectType<Equal<typeof props.client, QueryClient>>();
  void client.invalidateQueries({ queryKey: ["todos"] });
  const options: UseQueryOptions<number> = () => ({ queryKey: ["count"], queryFn: () => 1 });
  void options;
}
