import { Text, View } from "nsh";

export function Button(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <View
      role="button"
      onPress={props.onPress}
      disabled={props.disabled ?? false}
      class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90 disabled:opacity-50"
    >
      <Text class="text-primary-foreground">{props.label}</Text>
    </View>
  );
}
