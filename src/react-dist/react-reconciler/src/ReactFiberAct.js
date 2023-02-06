import { error as _consoleError } from "../../shared/consoleWithStackDev";
import ReactSharedInternals from "../../react/src/ReactSharedInternals";
import { warnsIfNotActing } from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
var ReactCurrentActQueue = ReactSharedInternals.ReactCurrentActQueue;
export function isLegacyActEnvironment(fiber) {
  return false;
}
export function isConcurrentActEnvironment() {
  return false;
}