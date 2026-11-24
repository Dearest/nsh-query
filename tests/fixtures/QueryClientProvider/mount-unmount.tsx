import { mount, signal, Text, View } from "nsh";
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from "nsh-query";
import { Button } from "../../support/Button";

const client = new QueryClient();
const shown = signal(true);
const report = signal("");

const listening = () => `focus listeners: ${focusManager.hasListeners()}, online listeners: ${onlineManager.hasListeners()}`;

function App() {
  return (
    <View>
      <If when={shown()}>
        <QueryClientProvider client={client}>
          <Text>provided</Text>
        </QueryClientProvider>
      </If>
      <Button label="Toggle" onPress={() => shown.update((value) => !value)} />
      <Button label="Report" onPress={() => report.set(listening())} />
      <Text testID="report">{report()}</Text>
    </View>
  );
}

mount(App);
