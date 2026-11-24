import { context } from "nsh";
import type { Accessor } from "nsh";

/**
 * Whether a persisted cache is being restored. `PersistQueryClientProvider`
 * provides it; while it reads `true`, queries neither subscribe nor fetch.
 */
export const IsRestoringContext = context<Accessor<boolean>>(() => false);

/**
 * An accessor that reads `true` while `PersistQueryClientProvider` restores the
 * cache, `false` otherwise.
 *
 * @example
 * ```tsx
 * function Status() {
 *   const isRestoring = useIsRestoring();
 *   return <Text>{isRestoring() ? "Restoring" : "Ready"}</Text>;
 * }
 * ```
 */
export function useIsRestoring(): Accessor<boolean> {
  return IsRestoringContext();
}
