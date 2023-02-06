/* eslint-disable react-internal/prod-error-codes */
import { enableHostSingletons, enableFloat } from "../../shared/ReactFeatureFlags";
import { flushSync, scheduleUpdateOnFiber, flushPassiveEffects } from './ReactFiberWorkLoop';
import { enqueueConcurrentRenderForLane } from './ReactFiberConcurrentUpdates';
import { updateContainer } from './ReactFiberReconciler';
import { emptyContextObject } from './ReactFiberContext';
import { SyncLane, NoTimestamp } from './ReactFiberLane';
import { ClassComponent, FunctionComponent, ForwardRef, HostComponent, HostResource, HostSingleton, HostPortal, HostRoot, MemoComponent, SimpleMemoComponent } from './ReactWorkTags';
import { REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE, REACT_LAZY_TYPE } from "../../shared/ReactSymbols";
import { supportsSingletons } from "../../react-dom-bindings/src/client/ReactDOMHostConfig"; // Resolves type to a family.
// Used by React Refresh runtime through DevTools Global Hook.

var resolveFamily = null;
var failedBoundaries = null;
export var setRefreshHandler = function (handler) {};
export function resolveFunctionForHotReloading(type) {
  {
    return type;
  }
}
export function resolveClassForHotReloading(type) {
  // No implementation differences.
  return resolveFunctionForHotReloading(type);
}
export function resolveForwardRefForHotReloading(type) {
  {
    return type;
  }
}
export function isCompatibleFamilyForHotReloading(fiber, element) {
  {
    return false;
  }
}
export function markFailedErrorBoundaryForHotReloading(fiber) {}
export var scheduleRefresh = function (root, update) {};
export var scheduleRoot = function (root, element) {};
function scheduleFibersWithFamiliesRecursively(fiber, updatedFamilies, staleFamilies) {}
export var findHostInstancesForRefresh = function (root, families) {
  {
    throw new Error('Did not expect findHostInstancesForRefresh to be called in production.');
  }
};
function findHostInstancesForMatchingFibersRecursively(fiber, types, hostInstances) {}
function findHostInstancesForFiberShallowly(fiber, hostInstances) {}
function findChildHostInstancesForFiberShallowly(fiber, hostInstances) {
  return false;
}