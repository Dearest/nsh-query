import { mount } from "nsh";
import { StatusScenario } from "../../support/StatusScenario";

mount(() => <StatusScenario refetchInterval={100} staleTime={Infinity} />);
