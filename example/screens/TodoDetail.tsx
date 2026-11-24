import { Text, View } from "nsh";
import { useQuery } from "nsh-query";
import { todoQuery } from "../queries";
import { Button } from "./Button";

export function TodoDetail(props: { id: number; onBack: () => void }) {
  const todo = useQuery(() => todoQuery(props.id));
  return (
    <View class="flex-1 gap-3 p-4">
      <Button label="Back" onPress={props.onBack} />
      <If when={todo.data} else={<Text>Loading todo</Text>}>
        {(data) => (
          <View class="gap-2">
            <Text class="text-2xl font-semibold text-foreground">{data().title}</Text>
            <Text class="text-foreground">{data().notes || "No notes"}</Text>
          </View>
        )}
      </If>
    </View>
  );
}
