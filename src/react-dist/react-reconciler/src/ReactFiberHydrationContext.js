import { error as _consoleError } from "../../shared/consoleWithStackDev";
import { NoMode, ConcurrentMode } from './ReactTypeOfMode';
import { HostComponent, HostSingleton, HostText, HostRoot, SuspenseComponent } from './ReactWorkTags';
import { ChildDeletion, Placement, Hydrating, NoFlags, DidCapture } from './ReactFiberFlags';
import { enableHostSingletons, enableFloat } from "../../shared/ReactFeatureFlags";
import { createFiberFromHostInstanceForDeletion, createFiberFromDehydratedFragment } from './ReactFiber';
import { shouldSetTextContent, supportsHydration, supportsSingletons, isHydratable, canHydrateInstance, canHydrateTextInstance, canHydrateSuspenseInstance, getNextHydratableSibling, getFirstHydratableChild, getFirstHydratableChildWithinContainer, getFirstHydratableChildWithinSuspenseInstance, hydrateInstance, hydrateTextInstance, hydrateSuspenseInstance, getNextHydratableInstanceAfterSuspenseInstance, shouldDeleteUnhydratedTailInstances, didNotMatchHydratedContainerTextInstance, didNotMatchHydratedTextInstance, didNotHydrateInstanceWithinContainer, didNotHydrateInstanceWithinSuspenseInstance, didNotHydrateInstance, didNotFindHydratableInstanceWithinContainer, didNotFindHydratableTextInstanceWithinContainer, didNotFindHydratableSuspenseInstanceWithinContainer, didNotFindHydratableInstanceWithinSuspenseInstance, didNotFindHydratableTextInstanceWithinSuspenseInstance, didNotFindHydratableSuspenseInstanceWithinSuspenseInstance, didNotFindHydratableInstance, didNotFindHydratableTextInstance, didNotFindHydratableSuspenseInstance, resolveSingletonInstance } from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
import { OffscreenLane } from './ReactFiberLane';
import { getSuspendedTreeContext, restoreSuspendedTreeContext } from './ReactFiberTreeContext';
import { queueRecoverableErrors } from './ReactFiberWorkLoop';
import { getRootHostContainer, getHostContext } from './ReactFiberHostContext'; // The deepest Fiber on the stack involved in a hydration context.
// This may have been an insertion or a hydration.

var hydrationParentFiber = null;
var nextHydratableInstance = null;
var isHydrating = false; // This flag allows for warning supression when we expect there to be mismatches
// due to earlier mismatches or a suspended fiber.

var didSuspendOrErrorDEV = false; // Hydration errors that were thrown inside this boundary

var hydrationErrors = null;
function warnIfHydrating() {}
export function markDidThrowWhileHydratingDEV() {}
export function didSuspendOrErrorWhileHydratingDEV() {
  return false;
}
function enterHydrationState(fiber) {
  if (!supportsHydration) {
    return false;
  }
  var parentInstance = fiber.stateNode.containerInfo;
  nextHydratableInstance = getFirstHydratableChildWithinContainer(parentInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  hydrationErrors = null;
  didSuspendOrErrorDEV = false;
  return true;
}
function reenterHydrationStateFromDehydratedSuspenseInstance(fiber, suspenseInstance, treeContext) {
  if (!supportsHydration) {
    return false;
  }
  nextHydratableInstance = getFirstHydratableChildWithinSuspenseInstance(suspenseInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  hydrationErrors = null;
  didSuspendOrErrorDEV = false;
  if (treeContext !== null) {
    restoreSuspendedTreeContext(fiber, treeContext);
  }
  return true;
}
function warnUnhydratedInstance(returnFiber, instance) {}
function deleteHydratableInstance(returnFiber, instance) {
  warnUnhydratedInstance(returnFiber, instance);
  var childToDelete = createFiberFromHostInstanceForDeletion();
  childToDelete.stateNode = instance;
  childToDelete.return = returnFiber;
  var deletions = returnFiber.deletions;
  if (deletions === null) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= ChildDeletion;
  } else {
    deletions.push(childToDelete);
  }
}
function warnNonhydratedInstance(returnFiber, fiber) {}
function insertNonHydratedInstance(returnFiber, fiber) {
  fiber.flags = fiber.flags & ~Hydrating | Placement;
  warnNonhydratedInstance(returnFiber, fiber);
}
function tryHydrate(fiber, nextInstance) {
  switch (fiber.tag) {
    // HostSingleton is intentionally omitted. the hydration pathway for singletons is non-fallible
    // you can find it inlined in claimHydratableSingleton
    case HostComponent:
      {
        var type = fiber.type;
        var props = fiber.pendingProps;
        var instance = canHydrateInstance(nextInstance, type, props);
        if (instance !== null) {
          fiber.stateNode = instance;
          hydrationParentFiber = fiber;
          nextHydratableInstance = getFirstHydratableChild(instance);
          return true;
        }
        return false;
      }
    case HostText:
      {
        var text = fiber.pendingProps;
        var textInstance = canHydrateTextInstance(nextInstance, text);
        if (textInstance !== null) {
          fiber.stateNode = textInstance;
          hydrationParentFiber = fiber; // Text Instances don't have children so there's nothing to hydrate.

          nextHydratableInstance = null;
          return true;
        }
        return false;
      }
    case SuspenseComponent:
      {
        var suspenseInstance = canHydrateSuspenseInstance(nextInstance);
        if (suspenseInstance !== null) {
          var suspenseState = {
            dehydrated: suspenseInstance,
            treeContext: getSuspendedTreeContext(),
            retryLane: OffscreenLane
          };
          fiber.memoizedState = suspenseState; // Store the dehydrated fragment as a child fiber.
          // This simplifies the code for getHostSibling and deleting nodes,
          // since it doesn't have to consider all Suspense boundaries and
          // check if they're dehydrated ones or not.

          var dehydratedFragment = createFiberFromDehydratedFragment(suspenseInstance);
          dehydratedFragment.return = fiber;
          fiber.child = dehydratedFragment;
          hydrationParentFiber = fiber; // While a Suspense Instance does have children, we won't step into
          // it during the first pass. Instead, we'll reenter it later.

          nextHydratableInstance = null;
          return true;
        }
        return false;
      }
    default:
      return false;
  }
}
function shouldClientRenderOnMismatch(fiber) {
  return (fiber.mode & ConcurrentMode) !== NoMode && (fiber.flags & DidCapture) === NoFlags;
}
function throwOnHydrationMismatch(fiber) {
  throw new Error('Hydration failed because the initial UI does not match what was ' + 'rendered on the server.');
}
function claimHydratableSingleton(fiber) {
  if (enableHostSingletons && supportsSingletons) {
    if (!isHydrating) {
      return;
    }
    var currentRootContainer = getRootHostContainer();
    var currentHostContext = getHostContext();
    var instance = fiber.stateNode = resolveSingletonInstance(fiber.type, fiber.pendingProps, currentRootContainer, currentHostContext, false);
    hydrationParentFiber = fiber;
    nextHydratableInstance = getFirstHydratableChild(instance);
  }
}
function tryToClaimNextHydratableInstance(fiber) {
  if (!isHydrating) {
    return;
  }
  if (enableFloat && !isHydratable(fiber.type, fiber.pendingProps)) {
    // This fiber never hydrates from the DOM and always does an insert
    fiber.flags = fiber.flags & ~Hydrating | Placement;
    isHydrating = false;
    hydrationParentFiber = fiber;
    return;
  }
  var nextInstance = nextHydratableInstance;
  if (!nextInstance) {
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance(hydrationParentFiber, fiber);
      throwOnHydrationMismatch(fiber);
    } // Nothing to hydrate. Make it an insertion.

    insertNonHydratedInstance(hydrationParentFiber, fiber);
    isHydrating = false;
    hydrationParentFiber = fiber;
    return;
  }
  var firstAttemptedInstance = nextInstance;
  if (!tryHydrate(fiber, nextInstance)) {
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance(hydrationParentFiber, fiber);
      throwOnHydrationMismatch(fiber);
    } // If we can't hydrate this instance let's try the next one.
    // We use this as a heuristic. It's based on intuition and not data so it
    // might be flawed or unnecessary.

    nextInstance = getNextHydratableSibling(firstAttemptedInstance);
    var prevHydrationParentFiber = hydrationParentFiber;
    if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
      // Nothing to hydrate. Make it an insertion.
      insertNonHydratedInstance(hydrationParentFiber, fiber);
      isHydrating = false;
      hydrationParentFiber = fiber;
      return;
    } // We matched the next one, we'll now assume that the first one was
    // superfluous and we'll delete it. Since we can't eagerly delete it
    // we'll have to schedule a deletion. To do that, this node needs a dummy
    // fiber associated with it.

    deleteHydratableInstance(prevHydrationParentFiber, firstAttemptedInstance);
  }
}
function prepareToHydrateHostInstance(fiber, hostContext) {
  if (!supportsHydration) {
    throw new Error('Expected prepareToHydrateHostInstance() to never be called. ' + 'This error is likely caused by a bug in React. Please file an issue.');
  }
  var instance = fiber.stateNode;
  var shouldWarnIfMismatchDev = !didSuspendOrErrorDEV;
  var updatePayload = hydrateInstance(instance, fiber.type, fiber.memoizedProps, hostContext, fiber, shouldWarnIfMismatchDev); // TODO: Type this specific to this type of component.

  fiber.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
  // is a new ref we mark this as an update.

  if (updatePayload !== null) {
    return true;
  }
  return false;
}
function prepareToHydrateHostTextInstance(fiber) {
  if (!supportsHydration) {
    throw new Error('Expected prepareToHydrateHostTextInstance() to never be called. ' + 'This error is likely caused by a bug in React. Please file an issue.');
  }
  var textInstance = fiber.stateNode;
  var textContent = fiber.memoizedProps;
  var shouldWarnIfMismatchDev = !didSuspendOrErrorDEV;
  var shouldUpdate = hydrateTextInstance(textInstance, textContent, fiber, shouldWarnIfMismatchDev);
  if (shouldUpdate) {
    // We assume that prepareToHydrateHostTextInstance is called in a context where the
    // hydration parent is the parent host component of this host text.
    var returnFiber = hydrationParentFiber;
    if (returnFiber !== null) {
      switch (returnFiber.tag) {
        case HostRoot:
          {
            var parentContainer = returnFiber.stateNode.containerInfo;
            var isConcurrentMode = (returnFiber.mode & ConcurrentMode) !== NoMode;
            didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, textContent,
            // TODO: Delete this argument when we remove the legacy root API.
            isConcurrentMode, shouldWarnIfMismatchDev);
            break;
          }
        case HostSingleton:
        case HostComponent:
          {
            var parentType = returnFiber.type;
            var parentProps = returnFiber.memoizedProps;
            var parentInstance = returnFiber.stateNode;
            var _isConcurrentMode2 = (returnFiber.mode & ConcurrentMode) !== NoMode;
            didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, textContent,
            // TODO: Delete this argument when we remove the legacy root API.
            _isConcurrentMode2, shouldWarnIfMismatchDev);
            break;
          }
      }
    }
  }
  return shouldUpdate;
}
function prepareToHydrateHostSuspenseInstance(fiber) {
  if (!supportsHydration) {
    throw new Error('Expected prepareToHydrateHostSuspenseInstance() to never be called. ' + 'This error is likely caused by a bug in React. Please file an issue.');
  }
  var suspenseState = fiber.memoizedState;
  var suspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;
  if (!suspenseInstance) {
    throw new Error('Expected to have a hydrated suspense instance. ' + 'This error is likely caused by a bug in React. Please file an issue.');
  }
  hydrateSuspenseInstance(suspenseInstance, fiber);
}
function skipPastDehydratedSuspenseInstance(fiber) {
  if (!supportsHydration) {
    throw new Error('Expected skipPastDehydratedSuspenseInstance() to never be called. ' + 'This error is likely caused by a bug in React. Please file an issue.');
  }
  var suspenseState = fiber.memoizedState;
  var suspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;
  if (!suspenseInstance) {
    throw new Error('Expected to have a hydrated suspense instance. ' + 'This error is likely caused by a bug in React. Please file an issue.');
  }
  return getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance);
}
function popToNextHostParent(fiber) {
  var parent = fiber.return;
  while (parent !== null && parent.tag !== HostComponent && parent.tag !== HostRoot && parent.tag !== SuspenseComponent && (!(enableHostSingletons && supportsSingletons) ? true : parent.tag !== HostSingleton)) {
    parent = parent.return;
  }
  hydrationParentFiber = parent;
}
function popHydrationState(fiber) {
  if (!supportsHydration) {
    return false;
  }
  if (fiber !== hydrationParentFiber) {
    // We're deeper than the current hydration context, inside an inserted
    // tree.
    return false;
  }
  if (!isHydrating) {
    // If we're not currently hydrating but we're in a hydration context, then
    // we were an insertion and now need to pop up reenter hydration of our
    // siblings.
    popToNextHostParent(fiber);
    isHydrating = true;
    return false;
  }
  var shouldClear = false;
  if (enableHostSingletons && supportsSingletons) {
    // With float we never clear the Root, or Singleton instances. We also do not clear Instances
    // that have singleton text content
    if (fiber.tag !== HostRoot && fiber.tag !== HostSingleton && !(fiber.tag === HostComponent && shouldSetTextContent(fiber.type, fiber.memoizedProps))) {
      shouldClear = true;
    }
  } else {
    // If we have any remaining hydratable nodes, we need to delete them now.
    // We only do this deeper than head and body since they tend to have random
    // other nodes in them. We also ignore components with pure text content in
    // side of them. We also don't delete anything inside the root container.
    if (fiber.tag !== HostRoot && (fiber.tag !== HostComponent || shouldDeleteUnhydratedTailInstances(fiber.type) && !shouldSetTextContent(fiber.type, fiber.memoizedProps))) {
      shouldClear = true;
    }
  }
  if (shouldClear) {
    var nextInstance = nextHydratableInstance;
    if (nextInstance) {
      if (shouldClientRenderOnMismatch(fiber)) {
        warnIfUnhydratedTailNodes(fiber);
        throwOnHydrationMismatch(fiber);
      } else {
        while (nextInstance) {
          deleteHydratableInstance(fiber, nextInstance);
          nextInstance = getNextHydratableSibling(nextInstance);
        }
      }
    }
  }
  popToNextHostParent(fiber);
  if (fiber.tag === SuspenseComponent) {
    nextHydratableInstance = skipPastDehydratedSuspenseInstance(fiber);
  } else {
    nextHydratableInstance = hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null;
  }
  return true;
}
function hasUnhydratedTailNodes() {
  return isHydrating && nextHydratableInstance !== null;
}
function warnIfUnhydratedTailNodes(fiber) {
  var nextInstance = nextHydratableInstance;
  while (nextInstance) {
    warnUnhydratedInstance(fiber, nextInstance);
    nextInstance = getNextHydratableSibling(nextInstance);
  }
}
function resetHydrationState() {
  if (!supportsHydration) {
    return;
  }
  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
  didSuspendOrErrorDEV = false;
}
export function upgradeHydrationErrorsToRecoverable() {
  if (hydrationErrors !== null) {
    // Successfully completed a forced client render. The errors that occurred
    // during the hydration attempt are now recovered. We will log them in
    // commit phase, once the entire tree has finished.
    queueRecoverableErrors(hydrationErrors);
    hydrationErrors = null;
  }
}
function getIsHydrating() {
  return isHydrating;
}
export function queueHydrationError(error) {
  if (hydrationErrors === null) {
    hydrationErrors = [error];
  } else {
    hydrationErrors.push(error);
  }
}
export { warnIfHydrating, enterHydrationState, getIsHydrating, reenterHydrationStateFromDehydratedSuspenseInstance, resetHydrationState, claimHydratableSingleton, tryToClaimNextHydratableInstance, prepareToHydrateHostInstance, prepareToHydrateHostTextInstance, prepareToHydrateHostSuspenseInstance, popHydrationState, hasUnhydratedTailNodes, warnIfUnhydratedTailNodes };