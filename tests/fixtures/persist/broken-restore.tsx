import { mount } from "nsh";
import { PersistScenario, Todos } from "../../support/PersistScenario";

mount(() => (
  <PersistScenario persister={{ deserialize: () => { throw new Error("corrupt"); } }}>
    <Todos />
  </PersistScenario>
));
