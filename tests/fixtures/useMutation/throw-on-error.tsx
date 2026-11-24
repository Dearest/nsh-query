import { ErrorBoundary, mount, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useMutation } from "nsh-query";
import { api } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();

const save = async () => {
  const response = await fetch(`${api}/todos`, { method: "POST", body: "{}" });
  if (!response.ok) throw new Error(`POST /todos: ${response.status}`);
};

function Save() {
  const mutation = useMutation(() => ({ mutationFn: save, throwOnError: true }));
  return (
    <View>
      <Text>{`status: ${mutation.status}`}</Text>
      <Button label="Save" onPress={() => mutation.mutate()} />
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <ErrorBoundary fallback={(error) => <Text>{`boundary: ${error instanceof Error ? error.message : String(error)}`}</Text>}>
      <Save />
    </ErrorBoundary>
  </QueryClientProvider>
));
