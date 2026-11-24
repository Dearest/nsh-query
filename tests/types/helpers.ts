// Type-level assertions, checked by `nsh check`. The files in tests/types/ are
// never run: their functions only need to type check (or fail to, where marked
// with `@ts-expect-error`).

export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export function expectType<T extends true>(): void {}

export interface Todo {
  id: number;
  title: string;
}

export declare function fetchTodo(id: number): Promise<Todo>;
export declare function fetchTodos(): Promise<Todo[]>;
