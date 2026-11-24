import { mount, Text } from "nsh";

// `nsh check` and `nsh test` need an entry. The scenarios the tests open
// live in fixtures/, one entry per scenario.
function App() {
  return <Text>nsh-query test fixtures</Text>;
}

mount(App);
