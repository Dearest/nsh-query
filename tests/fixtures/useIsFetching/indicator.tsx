import { mount, Text } from "nsh";
import { useIsFetching } from "nsh-query";
import { ActivityScenario } from "../../support/ActivityScenario";

function Indicators() {
  const all = useIsFetching();
  const users = useIsFetching(() => ({ queryKey: ["users"] }));
  return (
    <>
      <Text testID="all">{`fetching: ${all()}`}</Text>
      <Text testID="users">{`fetching users: ${users()}`}</Text>
    </>
  );
}

mount(() => (
  <ActivityScenario>
    <Indicators />
  </ActivityScenario>
));
