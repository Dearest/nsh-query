import { expect, open, test } from "nsh/test";

// The query-core members nsh-query relies on beyond the documented API. When
// an upgrade of vendor/query-core breaks one of them, this test names it.
const members = [
  "QueryClient.defaultQueryOptions",
  "QueryObserver.getOptimisticResult",
  "_optimisticResults: optimistic",
  "_optimisticResults: isRestoring",
  "QueryObserver.trackProp",
  "QueriesObserver.getOptimisticResult",
  "QueryObserver.updateResult",
  "environmentManager.setIsServer",
  "focusManager.setEventListener",
  "focusManager.setFocused",
  "focusManager.onFocus",
  "onlineManager.setEventListener",
  "onlineManager.setOnline",
  "notifyManager.setBatchNotifyFunction",
  "QueryClient.mount / unmount",
];

test("query-core still provides what the adapter relies on", async () => {
  const app = await open("./fixtures/core-contract/contract.tsx", { clock: {} });
  await app.waitFor("text:all: done");
  for (const member of members) {
    expect(app.texts()).toContain(`${member}: ok`);
  }
});
