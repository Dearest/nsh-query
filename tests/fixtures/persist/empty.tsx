import { mount } from "nsh";
import { PersistScenario } from "../../support/PersistScenario";

// No queries: nothing is saved after the restore, so what is in Storage
// afterwards is what the restore left.
mount(() => <PersistScenario />);
