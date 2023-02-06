import { error as _consoleError } from "./consoleWithStackDev";
var loggedTypeFailures = {};
import { describeUnknownElementTypeFrameInDEV } from "./ReactComponentStackFrame";
import ReactSharedInternals from "../react/src/ReactSharedInternals";
import hasOwnProperty from "./hasOwnProperty";
var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
function setCurrentlyValidatingElement(element) {}
export default function checkPropTypes(typeSpecs, values, location, componentName, element) {}