# Testing an app that uses nsh-query

Open the app with a manual clock and stubbed network, and move time explicitly:

```ts
const app = await open("./App.tsx", { clock: {}, network: { "https://api.example.com/todos": { body: [] } } });
await app.clock!.runFor(1000);
```

- Use the manual clock (`clock: {}`) whenever a query polls: on the real clock an app with `refetchInterval` is never quiet, and `open` waits seconds for it.
- A request not listed in `network` fails. Give a route a `delay` to see loading states; it answers when the clock passes it.
- Platform events: `await app.setLifecycle("background")`, `await app.setNetworkState({ kind: "none" })`, `await app.wake()`.
- Assert on what is on screen (`app.texts()`), the requests made (`app.requests()`) and the saved cache (`app.storage()`).
