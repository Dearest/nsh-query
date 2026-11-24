import { Text, View } from "nsh";

export function Button(props: { label: string; onPress: () => void }) {
  return (
    <View role="button" onPress={props.onPress}>
      <Text>{props.label}</Text>
    </View>
  );
}
