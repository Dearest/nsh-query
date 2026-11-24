# Desktop apps: windows and focus

## One QueryClient for every window

Every `<Window>` of an app runs on the app's one JS engine. Create one `QueryClient` at module level and give it to a `QueryClientProvider` in each window's root: all windows then share one cache, and a fetch or `setQueryData` in one window shows in the others.

```tsx
export const queryClient = new QueryClient();

function MainWindow() {
  return <Window id="main"><QueryClientProvider client={queryClient}><Main /></QueryClientProvider></Window>;
}
function DetailWindow() {
  return <Window id="detail"><QueryClientProvider client={queryClient}><Detail /></QueryClientProvider></Window>;
}
```

## What counts as focused

Queries are focused unless the app is in the background (`lifecycle() === "background"`: hidden, minimized or fully covered).

| The app is | Polling (`refetchInterval`) and retries | On coming back |
|---|---|---|
| active | run | |
| inactive: visible, another app or window has the focus | run | |
| in the background | pause (unless `refetchIntervalInBackground: true`) | stale queries refetch |
| waking from sleep | | stale queries refetch |

To also pause while the app is visible without the focus, call `connectNsh({ focused: (state) => state === "active" })` in a component body. `lifecycle()` is the app's, not a window's: to stop the queries of one hidden window or page, use `subscribed` (references/hidden-pages.md).

Offline (`network().online` false) fetches pause and resume by themselves when the network returns.
