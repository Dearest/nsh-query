import { mount, Text } from "nsh";
import { useMutationState } from "nsh-query";
import { ActivityScenario } from "../../support/ActivityScenario";

function Indicators() {
  const pending = useMutationState(() => ({
    filters: { status: "pending" },
    select: (mutation) => String(mutation.state.variables),
  }));
  const statuses = useMutationState();
  const todos = useMutationState(() => ({ filters: { mutationKey: ["todos"] } }));
  return (
    <>
      <Text testID="pending">{`pending: ${pending().join(",") || "none"}`}</Text>
      <Text testID="statuses">{`statuses: ${statuses().map((state) => state.status).join(",") || "none"}`}</Text>
      <Text testID="todos">{`todo mutations: ${todos().length}`}</Text>
    </>
  );
}

mount(() => (
  <ActivityScenario>
    <Indicators />
  </ActivityScenario>
));
