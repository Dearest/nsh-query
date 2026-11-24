import { untracked } from "nsh";
import type { Accessor } from "nsh";

/**
 * A read-only object that reads `source()` on every property access, so that a
 * property read in a JSX binding, `computed` or `effect` is reactive while the
 * object itself stays the same. `in`, `Object.keys` and spreading work.
 * `onRead` hears each property name read (the observer's `trackProp`).
 */
export function readonlyView<T extends object>(source: Accessor<T>, onRead?: (prop: string) => void): T {
  const target = Array.isArray(untracked(source)) ? [] : {};
  return new Proxy(target, {
    get(_, prop) {
      if (onRead && typeof prop === "string") onRead(prop);
      return Reflect.get(source(), prop);
    },
    has(_, prop) {
      return Reflect.has(source(), prop);
    },
    ownKeys() {
      return Reflect.ownKeys(source());
    },
    getOwnPropertyDescriptor(_, prop) {
      if (onRead && typeof prop === "string") onRead(prop);
      const value = source();
      const descriptor = Reflect.getOwnPropertyDescriptor(value, prop);
      if (!descriptor) return undefined;
      return {
        value: Reflect.get(value, prop),
        enumerable: descriptor.enumerable ?? false,
        configurable: !(Array.isArray(target) && prop === "length"),
        writable: true,
      };
    },
    set() {
      return false;
    },
    deleteProperty() {
      return false;
    },
    defineProperty() {
      return false;
    },
  }) as T;
}
