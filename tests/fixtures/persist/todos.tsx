import { mount } from "nsh";
import { PersistScenario, Todos } from "../../support/PersistScenario";

mount(() => (
  <PersistScenario>
    <Todos />
  </PersistScenario>
));
