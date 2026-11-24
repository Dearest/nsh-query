// A fake API kept in memory, so that the example runs without a network: each
// call answers after `latency` milliseconds, as a server would.

export interface Todo {
  id: number;
  title: string;
  notes: string;
}

export interface Post {
  id: number;
  title: string;
}

export interface PostsPage {
  posts: Post[];
  next: number | null;
}

export const latency = 300;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const todos: Todo[] = [
  { id: 1, title: "Walk the dog", notes: "Around the park, twice." },
  { id: 2, title: "Water the plants", notes: "The ones on the balcony too." },
  { id: 3, title: "Buy groceries", notes: "Milk, eggs, bread." },
];

let visits = 0;

export async function fetchTodos(): Promise<Todo[]> {
  await wait(latency);
  return todos.map((todo) => ({ ...todo }));
}

export async function fetchTodo(id: number): Promise<Todo> {
  await wait(latency);
  const todo = todos.find((item) => item.id === id);
  if (!todo) throw new Error(`No todo ${id}`);
  return { ...todo };
}

export async function addTodo(title: string): Promise<Todo> {
  await wait(latency);
  const todo = { id: todos.length + 1, title, notes: "" };
  todos.push(todo);
  return { ...todo };
}

/** How many users are online: a number that changes on every call, to poll. */
export async function fetchOnline(): Promise<number> {
  await wait(latency);
  visits += 1;
  return 2 + visits;
}

const pageSize = 20;
const pageCount = 5;

export async function fetchPosts(page: number): Promise<PostsPage> {
  await wait(latency);
  const posts = Array.from({ length: pageSize }, (_, index) => {
    const id = (page - 1) * pageSize + index + 1;
    return { id, title: `Post ${id}` };
  });
  return { posts, next: page < pageCount ? page + 1 : null };
}
