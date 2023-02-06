import { warn as _consoleWarn } from "../../shared/consoleWithStackDev";
import _assign from "../../shared/assign";
import { error as _consoleError } from "../../shared/consoleWithStackDev";
import { findCurrentHostFiber, findCurrentHostFiberWithNoPortals } from './ReactFiberTreeReflection';
import { get as getInstance } from "../../shared/ReactInstanceMap";
import { HostComponent, HostSingleton, ClassComponent, HostRoot, SuspenseComponent } from './ReactWorkTags';
import getComponentNameFromFiber from "./getComponentNameFromFiber";
import isArray from "../../shared/isArray";
import { enableSchedulingProfiler } from "../../shared/ReactFeatureFlags";
import ReactSharedInternals from "../../react/src/ReactSharedInternals";
import { getPublicInstance } from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
import { findCurrentUnmaskedContext, processChildContext, emptyContextObject, isContextProvider as isLegacyContextProvider } from './ReactFiberContext';
import { createFiberRoot } from './ReactFiberRoot';
import { isRootDehydrated } from './ReactFiberShellHydration';
import { injectInternals, markRenderScheduled, onScheduleRoot } from './ReactFiberDevToolsHook';
import { requestEventTime, requestUpdateLane, scheduleUpdateOnFiber, scheduleInitialHydrationOnRoot, flushRoot, batchedUpdates, flushSync, isAlreadyRendering, flushControlled, deferredUpdates, discreteUpdates, flushPassiveEffects } from './ReactFiberWorkLoop';
import { enqueueConcurrentRenderForLane } from './ReactFiberConcurrentUpdates';
import { createUpdate, enqueueUpdate, entangleTransitions } from './ReactFiberClassUpdateQueue';
import { isRendering as ReactCurrentFiberIsRendering, current as ReactCurrentFiberCurrent, resetCurrentFiber as resetCurrentDebugFiberInDEV, setCurrentFiber as setCurrentDebugFiberInDEV } from './ReactCurrentFiber';
import { StrictLegacyMode } from './ReactTypeOfMode';
import { SyncLane, SelectiveHydrationLane, NoTimestamp, getHighestPriorityPendingLanes, higherPriorityLane } from './ReactFiberLane';
import { getCurrentUpdatePriority, runWithPriority } from './ReactEventPriorities';
import { scheduleRefresh, scheduleRoot, setRefreshHandler, findHostInstancesForRefresh } from './ReactFiberHotReloading';
import ReactVersion from "../../shared/ReactVersion";
export { registerMutableSourceForHydration } from './ReactMutableSource';
export { createPortal } from './ReactPortal';
export { createComponentSelector, createHasPseudoClassSelector, createRoleSelector, createTestNameSelector, createTextSelector, getFindAllNodesFailureDescription, findAllNodes, findBoundingRects, focusWithin, observeVisibleRects } from './ReactTestSelectors'; // 0 is PROD, 1 is DEV.
// Might add PROFILE later.

var didWarnAboutNestedUpdates;
var didWarnAboutFindNodeInStrictMode;
function getContextForSubtree(parentComponent) {
  if (!parentComponent) {
    return emptyContextObject;
  }
  var fiber = getInstance(parentComponent);
  var parentContext = findCurrentUnmaskedContext(fiber);
  if (fiber.tag === ClassComponent) {
    var Component = fiber.type;
    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }
  return parentContext;
}
function findHostInstance(component) {
  var fiber = getInstance(component);
  if (fiber === undefined) {
    if (typeof component.render === 'function') {
      throw new Error('Unable to find node on an unmounted component.');
    } else {
      var keys = Object.keys(component).join(',');
      throw new Error("Argument appears to not be a ReactComponent. Keys: " + keys);
    }
  }
  var hostFiber = findCurrentHostFiber(fiber);
  if (hostFiber === null) {
    return null;
  }
  return hostFiber.stateNode;
}
function findHostInstanceWithWarning(component, methodName) {
  return findHostInstance(component);
}
export function createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
  var hydrate = false;
  var initialChildren = null;
  return createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
}
export function createHydrationContainer(initialChildren,
// TODO: Remove `callback` when we delete legacy mode.
callback, containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
  var hydrate = true;
  var root = createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks); // TODO: Move this to FiberRoot constructor

  root.context = getContextForSubtree(null); // Schedule the initial render. In a hydration root, this is different from
  // a regular update because the initial render must match was was rendered
  // on the server.
  // NOTE: This update intentionally doesn't have a payload. We're only using
  // the update to schedule work on the root fiber (and, for legacy roots, to
  // enqueue the callback if one is provided).

  var current = root.current;
  var eventTime = requestEventTime();
  var lane = requestUpdateLane(current);
  var update = createUpdate(eventTime, lane);
  update.callback = callback !== undefined && callback !== null ? callback : null;
  enqueueUpdate(current, update, lane);
  scheduleInitialHydrationOnRoot(root, lane, eventTime);
  return root;
}
export function updateContainer(element, container, parentComponent, callback) {
  var current = container.current;
  var eventTime = requestEventTime();
  var lane = requestUpdateLane(current);
  if (enableSchedulingProfiler) {
    markRenderScheduled(lane);
  }
  var context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }
  var update = createUpdate(eventTime, lane); // Caution: React DevTools currently depends on this property
  // being called "element".

  update.payload = {
    element: element
  };
  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }
  var root = enqueueUpdate(current, update, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane, eventTime);
    entangleTransitions(root, current, lane);
  }
  return lane;
}
export { batchedUpdates, deferredUpdates, discreteUpdates, flushControlled, flushSync, isAlreadyRendering, flushPassiveEffects };
export function getPublicRootInstance(container) {
  var containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostSingleton:
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}
export function attemptSynchronousHydration(fiber) {
  switch (fiber.tag) {
    case HostRoot:
      {
        var root = fiber.stateNode;
        if (isRootDehydrated(root)) {
          // Flush the first scheduled "update".
          var lanes = getHighestPriorityPendingLanes(root);
          flushRoot(root, lanes);
        }
        break;
      }
    case SuspenseComponent:
      {
        flushSync(function () {
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
          if (root !== null) {
            var eventTime = requestEventTime();
            scheduleUpdateOnFiber(root, fiber, SyncLane, eventTime);
          }
        }); // If we're still blocked after this, we need to increase
        // the priority of any promises resolving within this
        // boundary so that they next attempt also has higher pri.

        var retryLane = SyncLane;
        markRetryLaneIfNotHydrated(fiber, retryLane);
        break;
      }
  }
}
function markRetryLaneImpl(fiber, retryLane) {
  var suspenseState = fiber.memoizedState;
  if (suspenseState !== null && suspenseState.dehydrated !== null) {
    suspenseState.retryLane = higherPriorityLane(suspenseState.retryLane, retryLane);
  }
} // Increases the priority of thenables when they resolve within this boundary.

function markRetryLaneIfNotHydrated(fiber, retryLane) {
  markRetryLaneImpl(fiber, retryLane);
  var alternate = fiber.alternate;
  if (alternate) {
    markRetryLaneImpl(alternate, retryLane);
  }
}
export function attemptDiscreteHydration(fiber) {
  if (fiber.tag !== SuspenseComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority and they should not suspend on I/O,
    // since you have to wrap anything that might suspend in
    // Suspense.
    return;
  }
  var lane = SyncLane;
  var root = enqueueConcurrentRenderForLane(fiber, lane);
  if (root !== null) {
    var eventTime = requestEventTime();
    scheduleUpdateOnFiber(root, fiber, lane, eventTime);
  }
  markRetryLaneIfNotHydrated(fiber, lane);
}
export function attemptContinuousHydration(fiber) {
  if (fiber.tag !== SuspenseComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority and they should not suspend on I/O,
    // since you have to wrap anything that might suspend in
    // Suspense.
    return;
  }
  var lane = SelectiveHydrationLane;
  var root = enqueueConcurrentRenderForLane(fiber, lane);
  if (root !== null) {
    var eventTime = requestEventTime();
    scheduleUpdateOnFiber(root, fiber, lane, eventTime);
  }
  markRetryLaneIfNotHydrated(fiber, lane);
}
export function attemptHydrationAtCurrentPriority(fiber) {
  if (fiber.tag !== SuspenseComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority other than synchronously flush it.
    return;
  }
  var lane = requestUpdateLane(fiber);
  var root = enqueueConcurrentRenderForLane(fiber, lane);
  if (root !== null) {
    var eventTime = requestEventTime();
    scheduleUpdateOnFiber(root, fiber, lane, eventTime);
  }
  markRetryLaneIfNotHydrated(fiber, lane);
}
export { getCurrentUpdatePriority, runWithPriority };
export { findHostInstance };
export { findHostInstanceWithWarning };
export function findHostInstanceWithNoPortals(fiber) {
  var hostFiber = findCurrentHostFiberWithNoPortals(fiber);
  if (hostFiber === null) {
    return null;
  }
  return hostFiber.stateNode;
}
var shouldErrorImpl = function (fiber) {
  return null;
};
export function shouldError(fiber) {
  return shouldErrorImpl(fiber);
}
var shouldSuspendImpl = function (fiber) {
  return false;
};
export function shouldSuspend(fiber) {
  return shouldSuspendImpl(fiber);
}
var overrideHookState = null;
var overrideHookStateDeletePath = null;
var overrideHookStateRenamePath = null;
var overrideProps = null;
var overridePropsDeletePath = null;
var overridePropsRenamePath = null;
var scheduleUpdate = null;
var setErrorHandler = null;
var setSuspenseHandler = null;
function findHostInstanceByFiber(fiber) {
  var hostFiber = findCurrentHostFiber(fiber);
  if (hostFiber === null) {
    return null;
  }
  return hostFiber.stateNode;
}
function emptyFindFiberByHostInstance(instance) {
  return null;
}
function getCurrentFiberForDevTools() {
  return ReactCurrentFiberCurrent;
}
export function injectIntoDevTools(devToolsConfig) {
  var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
  var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
  return injectInternals({
    bundleType: devToolsConfig.bundleType,
    version: devToolsConfig.version,
    rendererPackageName: devToolsConfig.rendererPackageName,
    rendererConfig: devToolsConfig.rendererConfig,
    overrideHookState: overrideHookState,
    overrideHookStateDeletePath: overrideHookStateDeletePath,
    overrideHookStateRenamePath: overrideHookStateRenamePath,
    overrideProps: overrideProps,
    overridePropsDeletePath: overridePropsDeletePath,
    overridePropsRenamePath: overridePropsRenamePath,
    setErrorHandler: setErrorHandler,
    setSuspenseHandler: setSuspenseHandler,
    scheduleUpdate: scheduleUpdate,
    currentDispatcherRef: ReactCurrentDispatcher,
    findHostInstanceByFiber: findHostInstanceByFiber,
    findFiberByHostInstance: findFiberByHostInstance || emptyFindFiberByHostInstance,
    // React Refresh
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    // Enables DevTools to append owner stacks to error messages in DEV mode.
    getCurrentFiber: null,
    // Enables DevTools to detect reconciler version rather than renderer version
    // which may not match for third party renderers.
    reconcilerVersion: ReactVersion
  });
}