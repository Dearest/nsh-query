import { mount } from "nsh";
import { StatusScenario } from "../../support/StatusScenario";

mount(() => <StatusScenario staleTime={Infinity} />);
