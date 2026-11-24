// Shared by the fixtures: the stubbed API the tests answer (`open`'s `network`).
export const api = "https://api.test";

export interface Todo {
  id: number;
  title: string;
}

export async function getJson<T>(path: string, init?: { signal?: AbortSignal }): Promise<T> {
  const response = await fetch(`${api}${path}`, init?.signal ? { signal: init.signal } : undefined);
  if (!response.ok) throw new Error(`GET ${path}: ${response.status}`);
  return (await response.json()) as T;
}
