import { mount, Text } from "nsh";
import { useIsMutating } from "nsh-query";
import { ActivityScenario } from "../../support/ActivityScenario";

function Indicators() {
  const all = useIsMutating();
  const todos = useIsMutating(() => ({ mutationKey: ["todos"] }));
  return (
    <>
      <Text testID="all">{`mutating: ${all()}`}</Text>
      <Text testID="todos">{`mutating todos: ${todos()}`}</Text>
    </>
  );
}

mount(() => (
  <ActivityScenario>
    <Indicators />
  </ActivityScenario>
));
