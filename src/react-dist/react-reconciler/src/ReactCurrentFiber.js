import ReactSharedInternals from "../../react/src/ReactSharedInternals";
import { getStackByFiberInDevAndProd } from './ReactFiberComponentStack';
import getComponentNameFromFiber from "./getComponentNameFromFiber";
var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
export var current = null;
export var isRendering = false;
export function getCurrentFiberOwnerNameInDevOrNull() {
  return null;
}
function getCurrentFiberStackInDev() {
  return '';
}
export function resetCurrentFiber() {}
export function setCurrentFiber(fiber) {}
export function getCurrentFiber() {
  return null;
}
export function setIsRendering(rendering) {}
export function getIsRendering() {}