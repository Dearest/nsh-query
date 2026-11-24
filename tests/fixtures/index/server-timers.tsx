import { mount } from "nsh";
import { environmentManager } from "nsh-query";
import { TimersScenario } from "../../support/TimersScenario";

// Undo the entry's fix: query-core's own detection, which takes NSH for a server.
environmentManager.setIsServer(() => true);

mount(TimersScenario);
