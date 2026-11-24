import { mount } from "nsh";
import { PersistScenario, Todos } from "../../support/PersistScenario";

mount(() => (
  <PersistScenario buster="v2">
    <Todos />
  </PersistScenario>
));
