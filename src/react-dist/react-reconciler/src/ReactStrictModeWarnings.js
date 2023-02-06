import { warn as _consoleWarn } from "../../shared/consoleWithStackDev";
import { error as _consoleError } from "../../shared/consoleWithStackDev";
import { resetCurrentFiber as resetCurrentDebugFiberInDEV, setCurrentFiber as setCurrentDebugFiberInDEV } from './ReactCurrentFiber';
import getComponentNameFromFiber from "./getComponentNameFromFiber";
import { StrictLegacyMode } from './ReactTypeOfMode';
var ReactStrictModeWarnings = {
  recordUnsafeLifecycleWarnings: function (fiber, instance) {},
  flushPendingUnsafeLifecycleWarnings: function () {},
  recordLegacyContextWarning: function (fiber, instance) {},
  flushLegacyContextWarning: function () {},
  discardPendingWarnings: function () {}
};
export default ReactStrictModeWarnings;