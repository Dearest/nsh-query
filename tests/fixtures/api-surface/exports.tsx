import { mount, Text } from "nsh";
import * as query from "nsh-query";
import * as persist from "nsh-query/persist";

const surface = {
  "nsh-query": Object.keys(query).sort(),
  "nsh-query/persist": Object.keys(persist).sort(),
};

mount(() => <Text testID="surface">{JSON.stringify(surface)}</Text>);
