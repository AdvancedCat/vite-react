import { error as _consoleError } from "../../shared/consoleWithStackDev";
import { OffscreenDetached } from './ReactFiberOffscreenComponent';
import checkPropTypes from "../../shared/checkPropTypes";
import { markComponentRenderStarted, markComponentRenderStopped, setIsStrictModeForDevtools } from './ReactFiberDevToolsHook';
import { IndeterminateComponent, FunctionComponent, ClassComponent, HostRoot, HostComponent, HostResource, HostSingleton, HostText, HostPortal, ForwardRef, Fragment, Mode, ContextProvider, ContextConsumer, Profiler, SuspenseComponent, SuspenseListComponent, MemoComponent, SimpleMemoComponent, LazyComponent, IncompleteClassComponent, ScopeComponent, OffscreenComponent, LegacyHiddenComponent, CacheComponent, TracingMarkerComponent } from './ReactWorkTags';
import { NoFlags, PerformedWork, Placement, Hydrating, ContentReset, DidCapture, Update, Ref, RefStatic, ChildDeletion, ForceUpdateForLegacySuspense, StaticMask, ShouldCapture, ForceClientRender, Passive } from './ReactFiberFlags';
import ReactSharedInternals from "../../react/src/ReactSharedInternals";
import { debugRenderPhaseSideEffectsForStrictMode, disableLegacyContext, disableModulePatternComponents, enableProfilerCommitHooks, enableProfilerTimer, warnAboutDefaultPropsOnFunctionComponents, enableScopeAPI, enableCache, enableLazyContextPropagation, enableSchedulingProfiler, enableTransitionTracing, enableLegacyHidden, enableCPUSuspense, enableUseMutableSource, enableFloat, enableHostSingletons } from "../../shared/ReactFeatureFlags";
import isArray from "../../shared/isArray";
import shallowEqual from "../../shared/shallowEqual";
import getComponentNameFromFiber from "./getComponentNameFromFiber";
import getComponentNameFromType from "../../shared/getComponentNameFromType";
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
import { REACT_LAZY_TYPE, getIteratorFn } from "../../shared/ReactSymbols";
import { getCurrentFiberOwnerNameInDevOrNull, setIsRendering } from './ReactCurrentFiber';
import { resolveFunctionForHotReloading, resolveForwardRefForHotReloading, resolveClassForHotReloading } from './ReactFiberHotReloading';
import { mountChildFibers, reconcileChildFibers, cloneChildFibers } from './ReactChildFiber';
import { processUpdateQueue, cloneUpdateQueue, initializeUpdateQueue, enqueueCapturedUpdate } from './ReactFiberClassUpdateQueue';
import { NoLane, NoLanes, SyncLane, OffscreenLane, DefaultHydrationLane, SomeRetryLane, NoTimestamp, includesSomeLane, laneToLanes, removeLanes, mergeLanes, getBumpedLaneForHydration, pickArbitraryLane } from './ReactFiberLane';
import { ConcurrentMode, NoMode, ProfileMode, StrictLegacyMode } from './ReactTypeOfMode';
import { shouldSetTextContent, isSuspenseInstancePending, isSuspenseInstanceFallback, getSuspenseInstanceFallbackErrorDetails, registerSuspenseInstanceRetry, supportsHydration, supportsResources, supportsSingletons, isPrimaryRenderer, getResource } from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
import { shouldError, shouldSuspend } from './ReactFiberReconciler';
import { pushHostContext, pushHostContainer } from './ReactFiberHostContext';
import { suspenseStackCursor, pushSuspenseListContext, ForceSuspenseFallback, hasSuspenseListContext, setDefaultShallowSuspenseListContext, setShallowSuspenseListContext, pushPrimaryTreeSuspenseHandler, pushFallbackTreeSuspenseHandler, pushOffscreenSuspenseHandler, reuseSuspenseHandlerOnStack, popSuspenseHandler } from './ReactFiberSuspenseContext';
import { pushHiddenContext, reuseHiddenContextOnStack } from './ReactFiberHiddenContext';
import { findFirstSuspended } from './ReactFiberSuspenseComponent';
import { pushProvider, propagateContextChange, lazilyPropagateParentContextChanges, propagateParentContextChangesToDeferredTree, checkIfContextChanged, readContext, prepareToReadContext, scheduleContextWorkOnParentPath } from './ReactFiberNewContext';
import { renderWithHooks, checkDidRenderIdHook, bailoutHooks, replaySuspendedComponentWithHooks } from './ReactFiberHooks';
import { stopProfilerTimerIfRunning } from './ReactProfilerTimer';
import { getMaskedContext, getUnmaskedContext, hasContextChanged as hasLegacyContextChanged, pushContextProvider as pushLegacyContextProvider, isContextProvider as isLegacyContextProvider, pushTopLevelContextObject, invalidateContextProvider } from './ReactFiberContext';
import { getIsHydrating, enterHydrationState, reenterHydrationStateFromDehydratedSuspenseInstance, resetHydrationState, claimHydratableSingleton, tryToClaimNextHydratableInstance, warnIfHydrating, queueHydrationError } from './ReactFiberHydrationContext';
import { adoptClassInstance, constructClassInstance, mountClassInstance, resumeMountClassInstance, updateClassInstance } from './ReactFiberClassComponent';
import { resolveDefaultProps } from './ReactFiberLazyComponent';
import { resolveLazyComponentTag, createFiberFromTypeAndProps, createFiberFromFragment, createFiberFromOffscreen, createWorkInProgress, isSimpleFunctionComponent } from './ReactFiber';
import { retryDehydratedSuspenseBoundary, scheduleUpdateOnFiber, renderDidSuspendDelayIfPossible, markSkippedUpdateLanes, getWorkInProgressRoot } from './ReactFiberWorkLoop';
import { enqueueConcurrentRenderForLane } from './ReactFiberConcurrentUpdates';
import { setWorkInProgressVersion } from './ReactMutableSource';
import { pushCacheProvider, CacheContext } from './ReactFiberCacheComponent';
import { createCapturedValue, createCapturedValueAtFiber } from './ReactCapturedValue';
import { createClassErrorUpdate } from './ReactFiberThrow';
import is from "../../shared/objectIs";
import { getForksAtLevel, isForkedChild, pushTreeId, pushMaterializedTreeId } from './ReactFiberTreeContext';
import { requestCacheFromPool, pushRootTransition, getSuspendedCache, pushTransition, getOffscreenDeferredCache, getPendingTransitions } from './ReactFiberTransition';
import { getMarkerInstances, pushMarkerInstance, pushRootMarkerInstance, TransitionTracingMarker } from './ReactFiberTracingMarkerComponent';
var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner; // A special exception that's used to unwind the stack when an update flows
// into a dehydrated boundary.

export var SelectiveHydrationException = new Error("This is not a real error. It's an implementation detail of React's " + "selective hydration feature. If this leaks into userspace, it's a bug in " + 'React. Please file an issue.');
var didReceiveUpdate = false;
var didWarnAboutBadClass;
var didWarnAboutModulePatternComponent;
var didWarnAboutContextTypeOnFunctionComponent;
var didWarnAboutGetDerivedStateOnFunctionComponent;
var didWarnAboutFunctionRefs;
export var didWarnAboutReassigningProps;
var didWarnAboutRevealOrder;
var didWarnAboutTailOptions;
var didWarnAboutDefaultPropsOnFunctionComponent;
export function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderLanes);
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.
    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderLanes);
  }
}
function forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderLanes) {
  // This function is fork of reconcileChildren. It's used in cases where we
  // want to reconcile without matching against the existing set. This has the
  // effect of all current children being unmounted; even if the type and key
  // are the same, the old child is unmounted and a new child is created.
  //
  // To do this, we're going to go through the reconcile algorithm twice. In
  // the first pass, we schedule a deletion for all the current children by
  // passing null.
  workInProgress.child = reconcileChildFibers(workInProgress, current.child, null, renderLanes); // In the second pass, we mount the new children. The trick here is that we
  // pass null in place of where we usually pass the current child set. This has
  // the effect of remounting all children regardless of whether their
  // identities match.

  workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderLanes);
}
function updateForwardRef(current, workInProgress, Component, nextProps, renderLanes) {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens after the first render suspends.
  // We'll need to figure out if this is fine or can cause issues.

  var render = Component.render;
  var ref = workInProgress.ref; // The rest is a fork of updateFunctionComponent

  var nextChildren;
  var hasId;
  prepareToReadContext(workInProgress, renderLanes);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  {
    nextChildren = renderWithHooks(current, workInProgress, render, nextProps, ref, renderLanes);
    hasId = checkDidRenderIdHook();
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }
  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  if (getIsHydrating() && hasId) {
    pushMaterializedTreeId(workInProgress);
  } // React DevTools reads this flag.

  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function updateMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
  if (current === null) {
    var type = Component.type;
    if (isSimpleFunctionComponent(type) && Component.compare === null &&
    // SimpleMemoComponent codepath doesn't resolve outer props either.
    Component.defaultProps === undefined) {
      var resolvedType = type;
      // If this is a plain function component without default props,
      // and with only the default shallow comparison, we upgrade it
      // to a SimpleMemoComponent to allow fast path updates.

      workInProgress.tag = SimpleMemoComponent;
      workInProgress.type = resolvedType;
      return updateSimpleMemoComponent(current, workInProgress, resolvedType, nextProps, renderLanes);
    }
    var child = createFiberFromTypeAndProps(Component.type, null, nextProps, workInProgress, workInProgress.mode, renderLanes);
    child.ref = workInProgress.ref;
    child.return = workInProgress;
    workInProgress.child = child;
    return child;
  }
  var currentChild = current.child; // This is always exactly one child

  var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
  if (!hasScheduledUpdateOrContext) {
    // This will be the props with resolved defaultProps,
    // unlike current.memoizedProps which will be the unresolved ones.
    var prevProps = currentChild.memoizedProps; // Default to shallow comparison

    var compare = Component.compare;
    compare = compare !== null ? compare : shallowEqual;
    if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
  } // React DevTools reads this flag.

  workInProgress.flags |= PerformedWork;
  var newChild = createWorkInProgress(currentChild, nextProps);
  newChild.ref = workInProgress.ref;
  newChild.return = workInProgress;
  workInProgress.child = newChild;
  return newChild;
}
function updateSimpleMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens when the inner render suspends.
  // We'll need to figure out if this is fine or can cause issues.

  if (current !== null) {
    var prevProps = current.memoizedProps;
    if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress.ref &&
    // Prevent bailout if the implementation changed due to hot reload.
    true) {
      didReceiveUpdate = false; // The props are shallowly equal. Reuse the previous props object, like we
      // would during a normal fiber bailout.
      //
      // We don't have strong guarantees that the props object is referentially
      // equal during updates where we can't bail out anyway — like if the props
      // are shallowly equal, but there's a local state or context update in the
      // same batch.
      //
      // However, as a principle, we should aim to make the behavior consistent
      // across different ways of memoizing a component. For example, React.memo
      // has a different internal Fiber layout if you pass a normal function
      // component (SimpleMemoComponent) versus if you pass a different type
      // like forwardRef (MemoComponent). But this is an implementation detail.
      // Wrapping a component in forwardRef (or React.lazy, etc) shouldn't
      // affect whether the props object is reused during a bailout.

      workInProgress.pendingProps = nextProps = prevProps;
      if (!checkScheduledUpdateOrContext(current, renderLanes)) {
        // The pending lanes were cleared at the beginning of beginWork. We're
        // about to bail out, but there might be other lanes that weren't
        // included in the current render. Usually, the priority level of the
        // remaining updates is accumulated during the evaluation of the
        // component (i.e. when processing the update queue). But since since
        // we're bailing out early *without* evaluating the component, we need
        // to account for it here, too. Reset to the value of the current fiber.
        // NOTE: This only applies to SimpleMemoComponent, not MemoComponent,
        // because a MemoComponent fiber does not have hooks or an update queue;
        // rather, it wraps around an inner component, which may or may not
        // contains hooks.
        // TODO: Move the reset at in beginWork out of the common path so that
        // this is no longer necessary.
        workInProgress.lanes = current.lanes;
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      } else if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      }
    }
  }
  return updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes);
}
function updateOffscreenComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  var nextIsDetached = (workInProgress.stateNode._pendingVisibility & OffscreenDetached) !== 0;
  var prevState = current !== null ? current.memoizedState : null;
  markRef(current, workInProgress);
  if (nextProps.mode === 'hidden' || enableLegacyHidden && nextProps.mode === 'unstable-defer-without-hiding' || nextIsDetached) {
    // Rendering a hidden tree.
    var didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;
    if (didSuspend) {
      // Something suspended inside a hidden tree
      // Include the base lanes from the last render
      var nextBaseLanes = prevState !== null ? mergeLanes(prevState.baseLanes, renderLanes) : renderLanes;
      if (current !== null) {
        // Reset to the current children
        var currentChild = workInProgress.child = current.child; // The current render suspended, but there may be other lanes with
        // pending work. We can't read `childLanes` from the current Offscreen
        // fiber because we reset it when it was deferred; however, we can read
        // the pending lanes from the child fibers.

        var currentChildLanes = NoLanes;
        while (currentChild !== null) {
          currentChildLanes = mergeLanes(mergeLanes(currentChildLanes, currentChild.lanes), currentChild.childLanes);
          currentChild = currentChild.sibling;
        }
        var lanesWeJustAttempted = nextBaseLanes;
        var remainingChildLanes = removeLanes(currentChildLanes, lanesWeJustAttempted);
        workInProgress.childLanes = remainingChildLanes;
      } else {
        workInProgress.childLanes = NoLanes;
        workInProgress.child = null;
      }
      return deferHiddenOffscreenComponent(current, workInProgress, nextBaseLanes, renderLanes);
    }
    if ((workInProgress.mode & ConcurrentMode) === NoMode) {
      // In legacy sync mode, don't defer the subtree. Render it now.
      // TODO: Consider how Offscreen should work with transitions in the future
      var nextState = {
        baseLanes: NoLanes,
        cachePool: null
      };
      workInProgress.memoizedState = nextState;
      if (enableCache) {
        // push the cache pool even though we're going to bail out
        // because otherwise there'd be a context mismatch
        if (current !== null) {
          pushTransition(workInProgress, null, null);
        }
      }
      reuseHiddenContextOnStack(workInProgress);
      pushOffscreenSuspenseHandler(workInProgress);
    } else if (!includesSomeLane(renderLanes, OffscreenLane)) {
      // We're hidden, and we're not rendering at Offscreen. We will bail out
      // and resume this tree later.
      // Schedule this fiber to re-render at Offscreen priority
      workInProgress.lanes = workInProgress.childLanes = laneToLanes(OffscreenLane); // Include the base lanes from the last render

      var _nextBaseLanes = prevState !== null ? mergeLanes(prevState.baseLanes, renderLanes) : renderLanes;
      return deferHiddenOffscreenComponent(current, workInProgress, _nextBaseLanes, renderLanes);
    } else {
      // This is the second render. The surrounding visible content has already
      // committed. Now we resume rendering the hidden tree.
      // Rendering at offscreen, so we can clear the base lanes.
      var _nextState = {
        baseLanes: NoLanes,
        cachePool: null
      };
      workInProgress.memoizedState = _nextState;
      if (enableCache && current !== null) {
        // If the render that spawned this one accessed the cache pool, resume
        // using the same cache. Unless the parent changed, since that means
        // there was a refresh.
        var prevCachePool = prevState !== null ? prevState.cachePool : null; // TODO: Consider if and how Offscreen pre-rendering should
        // be attributed to the transition that spawned it

        pushTransition(workInProgress, prevCachePool, null);
      } // Push the lanes that were skipped when we bailed out.

      if (prevState !== null) {
        pushHiddenContext(workInProgress, prevState);
      } else {
        reuseHiddenContextOnStack(workInProgress);
      }
      pushOffscreenSuspenseHandler(workInProgress);
    }
  } else {
    // Rendering a visible tree.
    if (prevState !== null) {
      // We're going from hidden -> visible.
      var _prevCachePool = null;
      if (enableCache) {
        // If the render that spawned this one accessed the cache pool, resume
        // using the same cache. Unless the parent changed, since that means
        // there was a refresh.
        _prevCachePool = prevState.cachePool;
      }
      var transitions = null;
      if (enableTransitionTracing) {
        // We have now gone from hidden to visible, so any transitions should
        // be added to the stack to get added to any Offscreen/suspense children
        var instance = workInProgress.stateNode;
        if (instance !== null && instance._transitions != null) {
          transitions = Array.from(instance._transitions);
        }
      }
      pushTransition(workInProgress, _prevCachePool, transitions); // Push the lanes that were skipped when we bailed out.

      pushHiddenContext(workInProgress, prevState);
      reuseSuspenseHandlerOnStack(workInProgress); // Since we're not hidden anymore, reset the state

      workInProgress.memoizedState = null;
    } else {
      // We weren't previously hidden, and we still aren't, so there's nothing
      // special to do. Need to push to the stack regardless, though, to avoid
      // a push/pop misalignment.
      if (enableCache) {
        // If the render that spawned this one accessed the cache pool, resume
        // using the same cache. Unless the parent changed, since that means
        // there was a refresh.
        if (current !== null) {
          pushTransition(workInProgress, null, null);
        }
      } // We're about to bail out, but we need to push this to the stack anyway
      // to avoid a push/pop misalignment.

      reuseHiddenContextOnStack(workInProgress);
      reuseSuspenseHandlerOnStack(workInProgress);
    }
  }
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function deferHiddenOffscreenComponent(current, workInProgress, nextBaseLanes, renderLanes) {
  var nextState = {
    baseLanes: nextBaseLanes,
    // Save the cache pool so we can resume later.
    cachePool: enableCache ? getOffscreenDeferredCache() : null
  };
  workInProgress.memoizedState = nextState;
  if (enableCache) {
    // push the cache pool even though we're going to bail out
    // because otherwise there'd be a context mismatch
    if (current !== null) {
      pushTransition(workInProgress, null, null);
    }
  } // We're about to bail out, but we need to push this to the stack anyway
  // to avoid a push/pop misalignment.

  reuseHiddenContextOnStack(workInProgress);
  pushOffscreenSuspenseHandler(workInProgress);
  if (enableLazyContextPropagation && current !== null) {
    // Since this tree will resume rendering in a separate render, we need
    // to propagate parent contexts now so we don't lose track of which
    // ones changed.
    propagateParentContextChangesToDeferredTree(current, workInProgress, renderLanes);
  }
  return null;
} // Note: These happen to have identical begin phases, for now. We shouldn't hold
// ourselves to this constraint, though. If the behavior diverges, we should
// fork the function.

var updateLegacyHiddenComponent = updateOffscreenComponent;
function updateCacheComponent(current, workInProgress, renderLanes) {
  if (!enableCache) {
    return null;
  }
  prepareToReadContext(workInProgress, renderLanes);
  var parentCache = readContext(CacheContext);
  if (current === null) {
    // Initial mount. Request a fresh cache from the pool.
    var freshCache = requestCacheFromPool(renderLanes);
    var initialState = {
      parent: parentCache,
      cache: freshCache
    };
    workInProgress.memoizedState = initialState;
    initializeUpdateQueue(workInProgress);
    pushCacheProvider(workInProgress, freshCache);
  } else {
    // Check for updates
    if (includesSomeLane(current.lanes, renderLanes)) {
      cloneUpdateQueue(current, workInProgress);
      processUpdateQueue(workInProgress, null, null, renderLanes);
    }
    var prevState = current.memoizedState;
    var nextState = workInProgress.memoizedState; // Compare the new parent cache to the previous to see detect there was
    // a refresh.

    if (prevState.parent !== parentCache) {
      // Refresh in parent. Update the parent.
      var derivedState = {
        parent: parentCache,
        cache: parentCache
      }; // Copied from getDerivedStateFromProps implementation. Once the update
      // queue is empty, persist the derived state onto the base state.

      workInProgress.memoizedState = derivedState;
      if (workInProgress.lanes === NoLanes) {
        var updateQueue = workInProgress.updateQueue;
        workInProgress.memoizedState = updateQueue.baseState = derivedState;
      }
      pushCacheProvider(workInProgress, parentCache); // No need to propagate a context change because the refreshed parent
      // already did.
    } else {
      // The parent didn't refresh. Now check if this cache did.
      var nextCache = nextState.cache;
      pushCacheProvider(workInProgress, nextCache);
      if (nextCache !== prevState.cache) {
        // This cache refreshed. Propagate a context change.
        propagateContextChange(workInProgress, CacheContext, renderLanes);
      }
    }
  }
  var nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
} // This should only be called if the name changes

function updateTracingMarkerComponent(current, workInProgress, renderLanes) {
  if (!enableTransitionTracing) {
    return null;
  } // TODO: (luna) Only update the tracing marker if it's newly rendered or it's name changed.
  // A tracing marker is only associated with the transitions that rendered
  // or updated it, so we can create a new set of transitions each time

  if (current === null) {
    var currentTransitions = getPendingTransitions();
    if (currentTransitions !== null) {
      var markerInstance = {
        tag: TransitionTracingMarker,
        transitions: new Set(currentTransitions),
        pendingBoundaries: null,
        name: workInProgress.pendingProps.name,
        aborts: null
      };
      workInProgress.stateNode = markerInstance; // We call the marker complete callback when all child suspense boundaries resolve.
      // We do this in the commit phase on Offscreen. If the marker has no child suspense
      // boundaries, we need to schedule a passive effect to make sure we call the marker
      // complete callback.

      workInProgress.flags |= Passive;
    }
  } else {}
  var instance = workInProgress.stateNode;
  if (instance !== null) {
    pushMarkerInstance(workInProgress, instance);
  }
  var nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function updateFragment(current, workInProgress, renderLanes) {
  var nextChildren = workInProgress.pendingProps;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function updateMode(current, workInProgress, renderLanes) {
  var nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function updateProfiler(current, workInProgress, renderLanes) {
  if (enableProfilerTimer) {
    workInProgress.flags |= Update;
    if (enableProfilerCommitHooks) {
      // Reset effect durations for the next eventual effect phase.
      // These are reset during render to allow the DevTools commit hook a chance to read them,
      var stateNode = workInProgress.stateNode;
      stateNode.effectDuration = 0;
      stateNode.passiveEffectDuration = 0;
    }
  }
  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function markRef(current, workInProgress) {
  var ref = workInProgress.ref;
  if (current === null && ref !== null || current !== null && current.ref !== ref) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
    workInProgress.flags |= RefStatic;
  }
}
function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {
  var context;
  if (!disableLegacyContext) {
    var unmaskedContext = getUnmaskedContext(workInProgress, Component, true);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }
  var nextChildren;
  var hasId;
  prepareToReadContext(workInProgress, renderLanes);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  {
    nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, context, renderLanes);
    hasId = checkDidRenderIdHook();
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }
  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  if (getIsHydrating() && hasId) {
    pushMaterializedTreeId(workInProgress);
  } // React DevTools reads this flag.

  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
export function replayFunctionComponent(current, workInProgress, nextProps, Component, renderLanes) {
  // This function is used to replay a component that previously suspended,
  // after its data resolves. It's a simplified version of
  // updateFunctionComponent that reuses the hooks from the previous attempt.
  var context;
  if (!disableLegacyContext) {
    var unmaskedContext = getUnmaskedContext(workInProgress, Component, true);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }
  prepareToReadContext(workInProgress, renderLanes);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  var nextChildren = replaySuspendedComponentWithHooks(current, workInProgress, Component, nextProps, context);
  var hasId = checkDidRenderIdHook();
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }
  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  if (getIsHydrating() && hasId) {
    pushMaterializedTreeId(workInProgress);
  } // React DevTools reads this flag.

  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function updateClassComponent(current, workInProgress, Component, nextProps, renderLanes) {
  // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.

  var hasContext;
  if (isLegacyContextProvider(Component)) {
    hasContext = true;
    pushLegacyContextProvider(workInProgress);
  } else {
    hasContext = false;
  }
  prepareToReadContext(workInProgress, renderLanes);
  var instance = workInProgress.stateNode;
  var shouldUpdate;
  if (instance === null) {
    resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress); // In the initial pass we might need to construct the instance.

    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
    shouldUpdate = true;
  } else if (current === null) {
    // In a resume, we'll already have an instance we can reuse.
    shouldUpdate = resumeMountClassInstance(workInProgress, Component, nextProps, renderLanes);
  } else {
    shouldUpdate = updateClassInstance(current, workInProgress, Component, nextProps, renderLanes);
  }
  var nextUnitOfWork = finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderLanes);
  return nextUnitOfWork;
}
function finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderLanes) {
  // Refs should update even if shouldComponentUpdate returns false
  markRef(current, workInProgress);
  var didCaptureError = (workInProgress.flags & DidCapture) !== NoFlags;
  if (!shouldUpdate && !didCaptureError) {
    // Context providers should defer to sCU for rendering
    if (hasContext) {
      invalidateContextProvider(workInProgress, Component, false);
    }
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  var instance = workInProgress.stateNode; // Rerender

  ReactCurrentOwner.current = workInProgress;
  var nextChildren;
  if (didCaptureError && typeof Component.getDerivedStateFromError !== 'function') {
    // If we captured an error, but getDerivedStateFromError is not defined,
    // unmount all the children. componentDidCatch will schedule an update to
    // re-render a fallback. This is temporary until we migrate everyone to
    // the new API.
    // TODO: Warn in a future release.
    nextChildren = null;
    if (enableProfilerTimer) {
      stopProfilerTimerIfRunning(workInProgress);
    }
  } else {
    if (enableSchedulingProfiler) {
      markComponentRenderStarted(workInProgress);
    }
    {
      nextChildren = instance.render();
    }
    if (enableSchedulingProfiler) {
      markComponentRenderStopped();
    }
  } // React DevTools reads this flag.

  workInProgress.flags |= PerformedWork;
  if (current !== null && didCaptureError) {
    // If we're recovering from an error, reconcile without reusing any of
    // the existing children. Conceptually, the normal children and the children
    // that are shown on error are two different sets, so we shouldn't reuse
    // normal children even if their identities match.
    forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderLanes);
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  } // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.

  workInProgress.memoizedState = instance.state; // The context might have changed so we need to recalculate it.

  if (hasContext) {
    invalidateContextProvider(workInProgress, Component, true);
  }
  return workInProgress.child;
}
function pushHostRootContext(workInProgress) {
  var root = workInProgress.stateNode;
  if (root.pendingContext) {
    pushTopLevelContextObject(workInProgress, root.pendingContext, root.pendingContext !== root.context);
  } else if (root.context) {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }
  pushHostContainer(workInProgress, root.containerInfo);
}
function updateHostRoot(current, workInProgress, renderLanes) {
  pushHostRootContext(workInProgress);
  if (current === null) {
    throw new Error('Should have a current fiber. This is a bug in React.');
  }
  var nextProps = workInProgress.pendingProps;
  var prevState = workInProgress.memoizedState;
  var prevChildren = prevState.element;
  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);
  var nextState = workInProgress.memoizedState;
  var root = workInProgress.stateNode;
  pushRootTransition(workInProgress, root, renderLanes);
  if (enableTransitionTracing) {
    pushRootMarkerInstance(workInProgress);
  }
  if (enableCache) {
    var nextCache = nextState.cache;
    pushCacheProvider(workInProgress, nextCache);
    if (nextCache !== prevState.cache) {
      // The root cache refreshed.
      propagateContextChange(workInProgress, CacheContext, renderLanes);
    }
  } // Caution: React DevTools currently depends on this property
  // being called "element".

  var nextChildren = nextState.element;
  if (supportsHydration && prevState.isDehydrated) {
    // This is a hydration root whose shell has not yet hydrated. We should
    // attempt to hydrate.
    // Flip isDehydrated to false to indicate that when this render
    // finishes, the root will no longer be dehydrated.
    var overrideState = {
      element: nextChildren,
      isDehydrated: false,
      cache: nextState.cache
    };
    var updateQueue = workInProgress.updateQueue; // `baseState` can always be the last state because the root doesn't
    // have reducer functions so it doesn't need rebasing.

    updateQueue.baseState = overrideState;
    workInProgress.memoizedState = overrideState;
    if (workInProgress.flags & ForceClientRender) {
      // Something errored during a previous attempt to hydrate the shell, so we
      // forced a client render.
      var recoverableError = createCapturedValueAtFiber(new Error('There was an error while hydrating. Because the error happened outside ' + 'of a Suspense boundary, the entire root will switch to ' + 'client rendering.'), workInProgress);
      return mountHostRootWithoutHydrating(current, workInProgress, nextChildren, renderLanes, recoverableError);
    } else if (nextChildren !== prevChildren) {
      var _recoverableError = createCapturedValueAtFiber(new Error('This root received an early update, before anything was able ' + 'hydrate. Switched the entire root to client rendering.'), workInProgress);
      return mountHostRootWithoutHydrating(current, workInProgress, nextChildren, renderLanes, _recoverableError);
    } else {
      // The outermost shell has not hydrated yet. Start hydrating.
      enterHydrationState(workInProgress);
      if (enableUseMutableSource) {
        var mutableSourceEagerHydrationData = root.mutableSourceEagerHydrationData;
        if (mutableSourceEagerHydrationData != null) {
          for (var i = 0; i < mutableSourceEagerHydrationData.length; i += 2) {
            var mutableSource = mutableSourceEagerHydrationData[i];
            var version = mutableSourceEagerHydrationData[i + 1];
            setWorkInProgressVersion(mutableSource, version);
          }
        }
      }
      var child = mountChildFibers(workInProgress, null, nextChildren, renderLanes);
      workInProgress.child = child;
      var node = child;
      while (node) {
        // Mark each child as hydrating. This is a fast path to know whether this
        // tree is part of a hydrating tree. This is used to determine if a child
        // node has fully mounted yet, and for scheduling event replaying.
        // Conceptually this is similar to Placement in that a new subtree is
        // inserted into the React tree here. It just happens to not need DOM
        // mutations because it already exists.
        node.flags = node.flags & ~Placement | Hydrating;
        node = node.sibling;
      }
    }
  } else {
    // Root is not dehydrated. Either this is a client-only root, or it
    // already hydrated.
    resetHydrationState();
    if (nextChildren === prevChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }
  return workInProgress.child;
}
function mountHostRootWithoutHydrating(current, workInProgress, nextChildren, renderLanes, recoverableError) {
  // Revert to client rendering.
  resetHydrationState();
  queueHydrationError(recoverableError);
  workInProgress.flags |= ForceClientRender;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function updateHostComponent(current, workInProgress, renderLanes) {
  pushHostContext(workInProgress);
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }
  var type = workInProgress.type;
  var nextProps = workInProgress.pendingProps;
  var prevProps = current !== null ? current.memoizedProps : null;
  var nextChildren = nextProps.children;
  var isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also has access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.flags |= ContentReset;
  }
  markRef(current, workInProgress);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function updateHostResource(current, workInProgress, renderLanes) {
  pushHostContext(workInProgress);
  markRef(current, workInProgress);
  var currentProps = current === null ? null : current.memoizedProps;
  workInProgress.memoizedState = getResource(workInProgress.type, workInProgress.pendingProps, currentProps); // Resources never have reconciler managed children. It is possible for
  // the host implementation of getResource to consider children in the
  // resource construction but they will otherwise be discarded. In practice
  // this precludes all but the simplest children and Host specific warnings
  // should be implemented to warn when children are passsed when otherwise not
  // expected

  return null;
}
function updateHostSingleton(current, workInProgress, renderLanes) {
  pushHostContext(workInProgress);
  if (current === null) {
    claimHydratableSingleton(workInProgress);
  }
  var nextChildren = workInProgress.pendingProps.children;
  if (current === null && !getIsHydrating()) {
    // Similar to Portals we append Singleton children in the commit phase. So we
    // Track insertions even on mount.
    // TODO: Consider unifying this with how the root works.
    workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderLanes);
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }
  markRef(current, workInProgress);
  return workInProgress.child;
}
function updateHostText(current, workInProgress) {
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  } // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.

  return null;
}
function mountLazyComponent(_current, workInProgress, elementType, renderLanes) {
  resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
  var props = workInProgress.pendingProps;
  var lazyComponent = elementType;
  var payload = lazyComponent._payload;
  var init = lazyComponent._init;
  var Component = init(payload); // Store the unwrapped component in the type.

  workInProgress.type = Component;
  var resolvedTag = workInProgress.tag = resolveLazyComponentTag(Component);
  var resolvedProps = resolveDefaultProps(Component, props);
  var child;
  switch (resolvedTag) {
    case FunctionComponent:
      {
        child = updateFunctionComponent(null, workInProgress, Component, resolvedProps, renderLanes);
        return child;
      }
    case ClassComponent:
      {
        child = updateClassComponent(null, workInProgress, Component, resolvedProps, renderLanes);
        return child;
      }
    case ForwardRef:
      {
        child = updateForwardRef(null, workInProgress, Component, resolvedProps, renderLanes);
        return child;
      }
    case MemoComponent:
      {
        child = updateMemoComponent(null, workInProgress, Component, resolveDefaultProps(Component.type, resolvedProps),
        // The inner type can have defaults too
        renderLanes);
        return child;
      }
  }
  var hint = '';
  // This message intentionally doesn't mention ForwardRef or MemoComponent
  // because the fact that it's a separate type of work is an
  // implementation detail.

  throw new Error("Element type is invalid. Received a promise that resolves to: " + Component + ". " + ("Lazy element type must resolve to a class or function." + hint));
}
function mountIncompleteClassComponent(_current, workInProgress, Component, nextProps, renderLanes) {
  resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress); // Promote the fiber to a class and try rendering again.

  workInProgress.tag = ClassComponent; // The rest of this function is a fork of `updateClassComponent`
  // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.

  var hasContext;
  if (isLegacyContextProvider(Component)) {
    hasContext = true;
    pushLegacyContextProvider(workInProgress);
  } else {
    hasContext = false;
  }
  prepareToReadContext(workInProgress, renderLanes);
  constructClassInstance(workInProgress, Component, nextProps);
  mountClassInstance(workInProgress, Component, nextProps, renderLanes);
  return finishClassComponent(null, workInProgress, Component, true, hasContext, renderLanes);
}
function mountIndeterminateComponent(_current, workInProgress, Component, renderLanes) {
  resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
  var props = workInProgress.pendingProps;
  var context;
  if (!disableLegacyContext) {
    var unmaskedContext = getUnmaskedContext(workInProgress, Component, false);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }
  prepareToReadContext(workInProgress, renderLanes);
  var value;
  var hasId;
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  {
    value = renderWithHooks(null, workInProgress, Component, props, context, renderLanes);
    hasId = checkDidRenderIdHook();
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  } // React DevTools reads this flag.

  workInProgress.flags |= PerformedWork;
  if (
  // Run these checks in production only if the flag is off.
  // Eventually we'll delete this branch altogether.
  !disableModulePatternComponents && typeof value === 'object' && value !== null && typeof value.render === 'function' && value.$$typeof === undefined) {
    // Proceed under the assumption that this is a class instance

    workInProgress.tag = ClassComponent; // Throw out any hooks that were used.

    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null; // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.

    var hasContext = false;
    if (isLegacyContextProvider(Component)) {
      hasContext = true;
      pushLegacyContextProvider(workInProgress);
    } else {
      hasContext = false;
    }
    workInProgress.memoizedState = value.state !== null && value.state !== undefined ? value.state : null;
    initializeUpdateQueue(workInProgress);
    adoptClassInstance(workInProgress, value);
    mountClassInstance(workInProgress, Component, props, renderLanes);
    return finishClassComponent(null, workInProgress, Component, true, hasContext, renderLanes);
  } else {
    // Proceed under the assumption that this is a function component
    workInProgress.tag = FunctionComponent;
    if (getIsHydrating() && hasId) {
      pushMaterializedTreeId(workInProgress);
    }
    reconcileChildren(null, workInProgress, value, renderLanes);
    return workInProgress.child;
  }
}
function validateFunctionComponentInDev(workInProgress, Component) {}
var SUSPENDED_MARKER = {
  dehydrated: null,
  treeContext: null,
  retryLane: NoLane
};
function mountSuspenseOffscreenState(renderLanes) {
  return {
    baseLanes: renderLanes,
    cachePool: getSuspendedCache()
  };
}
function updateSuspenseOffscreenState(prevOffscreenState, renderLanes) {
  var cachePool = null;
  if (enableCache) {
    var prevCachePool = prevOffscreenState.cachePool;
    if (prevCachePool !== null) {
      var parentCache = isPrimaryRenderer ? CacheContext._currentValue : CacheContext._currentValue2;
      if (prevCachePool.parent !== parentCache) {
        // Detected a refresh in the parent. This overrides any previously
        // suspended cache.
        cachePool = {
          parent: parentCache,
          pool: parentCache
        };
      } else {
        // We can reuse the cache from last time. The only thing that would have
        // overridden it is a parent refresh, which we checked for above.
        cachePool = prevCachePool;
      }
    } else {
      // If there's no previous cache pool, grab the current one.
      cachePool = getSuspendedCache();
    }
  }
  return {
    baseLanes: mergeLanes(prevOffscreenState.baseLanes, renderLanes),
    cachePool: cachePool
  };
} // TODO: Probably should inline this back

function shouldRemainOnFallback(current, workInProgress, renderLanes) {
  // If we're already showing a fallback, there are cases where we need to
  // remain on that fallback regardless of whether the content has resolved.
  // For example, SuspenseList coordinates when nested content appears.
  if (current !== null) {
    var suspenseState = current.memoizedState;
    if (suspenseState === null) {
      // Currently showing content. Don't hide it, even if ForceSuspenseFallback
      // is true. More precise name might be "ForceRemainSuspenseFallback".
      // Note: This is a factoring smell. Can't remain on a fallback if there's
      // no fallback to remain on.
      return false;
    }
  } // Not currently showing content. Consult the Suspense context.

  var suspenseContext = suspenseStackCursor.current;
  return hasSuspenseListContext(suspenseContext, ForceSuspenseFallback);
}
function getRemainingWorkInPrimaryTree(current, renderLanes) {
  // TODO: Should not remove render lanes that were pinged during this render
  return removeLanes(current.childLanes, renderLanes);
}
function updateSuspenseComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps; // This is used by DevTools to force a boundary to suspend.

  var showFallback = false;
  var didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;
  if (didSuspend || shouldRemainOnFallback(current, workInProgress, renderLanes)) {
    // Something in this boundary's subtree already suspended. Switch to
    // rendering the fallback children.
    showFallback = true;
    workInProgress.flags &= ~DidCapture;
  } // OK, the next part is confusing. We're about to reconcile the Suspense
  // boundary's children. This involves some custom reconciliation logic. Two
  // main reasons this is so complicated.
  //
  // First, Legacy Mode has different semantics for backwards compatibility. The
  // primary tree will commit in an inconsistent state, so when we do the
  // second pass to render the fallback, we do some exceedingly, uh, clever
  // hacks to make that not totally break. Like transferring effects and
  // deletions from hidden tree. In Concurrent Mode, it's much simpler,
  // because we bailout on the primary tree completely and leave it in its old
  // state, no effects. Same as what we do for Offscreen (except that
  // Offscreen doesn't have the first render pass).
  //
  // Second is hydration. During hydration, the Suspense fiber has a slightly
  // different layout, where the child points to a dehydrated fragment, which
  // contains the DOM rendered by the server.
  //
  // Third, even if you set all that aside, Suspense is like error boundaries in
  // that we first we try to render one tree, and if that fails, we render again
  // and switch to a different tree. Like a try/catch block. So we have to track
  // which branch we're currently rendering. Ideally we would model this using
  // a stack.

  if (current === null) {
    // Initial mount
    // Special path for hydration
    // If we're currently hydrating, try to hydrate this boundary.
    if (getIsHydrating()) {
      // We must push the suspense handler context *before* attempting to
      // hydrate, to avoid a mismatch in case it errors.
      if (showFallback) {
        pushPrimaryTreeSuspenseHandler(workInProgress);
      } else {
        pushFallbackTreeSuspenseHandler(workInProgress);
      }
      tryToClaimNextHydratableInstance(workInProgress); // This could've been a dehydrated suspense component.

      var suspenseState = workInProgress.memoizedState;
      if (suspenseState !== null) {
        var dehydrated = suspenseState.dehydrated;
        if (dehydrated !== null) {
          return mountDehydratedSuspenseComponent(workInProgress, dehydrated, renderLanes);
        }
      } // If hydration didn't succeed, fall through to the normal Suspense path.
      // To avoid a stack mismatch we need to pop the Suspense handler that we
      // pushed above. This will become less awkward when move the hydration
      // logic to its own fiber.

      popSuspenseHandler(workInProgress);
    }
    var nextPrimaryChildren = nextProps.children;
    var nextFallbackChildren = nextProps.fallback;
    if (showFallback) {
      pushFallbackTreeSuspenseHandler(workInProgress);
      var fallbackFragment = mountSuspenseFallbackChildren(workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
      var primaryChildFragment = workInProgress.child;
      primaryChildFragment.memoizedState = mountSuspenseOffscreenState(renderLanes);
      workInProgress.memoizedState = SUSPENDED_MARKER;
      if (enableTransitionTracing) {
        var currentTransitions = getPendingTransitions();
        if (currentTransitions !== null) {
          var parentMarkerInstances = getMarkerInstances();
          var offscreenQueue = primaryChildFragment.updateQueue;
          if (offscreenQueue === null) {
            var newOffscreenQueue = {
              transitions: currentTransitions,
              markerInstances: parentMarkerInstances,
              wakeables: null
            };
            primaryChildFragment.updateQueue = newOffscreenQueue;
          } else {
            offscreenQueue.transitions = currentTransitions;
            offscreenQueue.markerInstances = parentMarkerInstances;
          }
        }
      }
      return fallbackFragment;
    } else if (enableCPUSuspense && typeof nextProps.unstable_expectedLoadTime === 'number') {
      // This is a CPU-bound tree. Skip this tree and show a placeholder to
      // unblock the surrounding content. Then immediately retry after the
      // initial commit.
      pushFallbackTreeSuspenseHandler(workInProgress);
      var _fallbackFragment = mountSuspenseFallbackChildren(workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
      var _primaryChildFragment = workInProgress.child;
      _primaryChildFragment.memoizedState = mountSuspenseOffscreenState(renderLanes);
      workInProgress.memoizedState = SUSPENDED_MARKER; // TODO: Transition Tracing is not yet implemented for CPU Suspense.
      // Since nothing actually suspended, there will nothing to ping this to
      // get it started back up to attempt the next item. While in terms of
      // priority this work has the same priority as this current render, it's
      // not part of the same transition once the transition has committed. If
      // it's sync, we still want to yield so that it can be painted.
      // Conceptually, this is really the same as pinging. We can use any
      // RetryLane even if it's the one currently rendering since we're leaving
      // it behind on this node.

      workInProgress.lanes = SomeRetryLane;
      return _fallbackFragment;
    } else {
      pushPrimaryTreeSuspenseHandler(workInProgress);
      return mountSuspensePrimaryChildren(workInProgress, nextPrimaryChildren, renderLanes);
    }
  } else {
    // This is an update.
    // Special path for hydration
    var prevState = current.memoizedState;
    if (prevState !== null) {
      var _dehydrated = prevState.dehydrated;
      if (_dehydrated !== null) {
        return updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, nextProps, _dehydrated, prevState, renderLanes);
      }
    }
    if (showFallback) {
      pushFallbackTreeSuspenseHandler(workInProgress);
      var _nextFallbackChildren = nextProps.fallback;
      var _nextPrimaryChildren = nextProps.children;
      var fallbackChildFragment = updateSuspenseFallbackChildren(current, workInProgress, _nextPrimaryChildren, _nextFallbackChildren, renderLanes);
      var _primaryChildFragment2 = workInProgress.child;
      var prevOffscreenState = current.child.memoizedState;
      _primaryChildFragment2.memoizedState = prevOffscreenState === null ? mountSuspenseOffscreenState(renderLanes) : updateSuspenseOffscreenState(prevOffscreenState, renderLanes);
      if (enableTransitionTracing) {
        var _currentTransitions = getPendingTransitions();
        if (_currentTransitions !== null) {
          var _parentMarkerInstances = getMarkerInstances();
          var _offscreenQueue = _primaryChildFragment2.updateQueue;
          var currentOffscreenQueue = current.updateQueue;
          if (_offscreenQueue === null) {
            var _newOffscreenQueue = {
              transitions: _currentTransitions,
              markerInstances: _parentMarkerInstances,
              wakeables: null
            };
            _primaryChildFragment2.updateQueue = _newOffscreenQueue;
          } else if (_offscreenQueue === currentOffscreenQueue) {
            // If the work-in-progress queue is the same object as current, we
            // can't modify it without cloning it first.
            var _newOffscreenQueue2 = {
              transitions: _currentTransitions,
              markerInstances: _parentMarkerInstances,
              wakeables: currentOffscreenQueue !== null ? currentOffscreenQueue.wakeables : null
            };
            _primaryChildFragment2.updateQueue = _newOffscreenQueue2;
          } else {
            _offscreenQueue.transitions = _currentTransitions;
            _offscreenQueue.markerInstances = _parentMarkerInstances;
          }
        }
      }
      _primaryChildFragment2.childLanes = getRemainingWorkInPrimaryTree(current, renderLanes);
      workInProgress.memoizedState = SUSPENDED_MARKER;
      return fallbackChildFragment;
    } else {
      pushPrimaryTreeSuspenseHandler(workInProgress);
      var _nextPrimaryChildren2 = nextProps.children;
      var _primaryChildFragment3 = updateSuspensePrimaryChildren(current, workInProgress, _nextPrimaryChildren2, renderLanes);
      workInProgress.memoizedState = null;
      return _primaryChildFragment3;
    }
  }
}
function mountSuspensePrimaryChildren(workInProgress, primaryChildren, renderLanes) {
  var mode = workInProgress.mode;
  var primaryChildProps = {
    mode: 'visible',
    children: primaryChildren
  };
  var primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, mode, renderLanes);
  primaryChildFragment.return = workInProgress;
  workInProgress.child = primaryChildFragment;
  return primaryChildFragment;
}
function mountSuspenseFallbackChildren(workInProgress, primaryChildren, fallbackChildren, renderLanes) {
  var mode = workInProgress.mode;
  var progressedPrimaryFragment = workInProgress.child;
  var primaryChildProps = {
    mode: 'hidden',
    children: primaryChildren
  };
  var primaryChildFragment;
  var fallbackChildFragment;
  if ((mode & ConcurrentMode) === NoMode && progressedPrimaryFragment !== null) {
    // In legacy mode, we commit the primary tree as if it successfully
    // completed, even though it's in an inconsistent state.
    primaryChildFragment = progressedPrimaryFragment;
    primaryChildFragment.childLanes = NoLanes;
    primaryChildFragment.pendingProps = primaryChildProps;
    if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
      // Reset the durations from the first pass so they aren't included in the
      // final amounts. This seems counterintuitive, since we're intentionally
      // not measuring part of the render phase, but this makes it match what we
      // do in Concurrent Mode.
      primaryChildFragment.actualDuration = 0;
      primaryChildFragment.actualStartTime = -1;
      primaryChildFragment.selfBaseDuration = 0;
      primaryChildFragment.treeBaseDuration = 0;
    }
    fallbackChildFragment = createFiberFromFragment(fallbackChildren, mode, renderLanes, null);
  } else {
    primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, mode, NoLanes);
    fallbackChildFragment = createFiberFromFragment(fallbackChildren, mode, renderLanes, null);
  }
  primaryChildFragment.return = workInProgress;
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;
  return fallbackChildFragment;
}
function mountWorkInProgressOffscreenFiber(offscreenProps, mode, renderLanes) {
  // The props argument to `createFiberFromOffscreen` is `any` typed, so we use
  // this wrapper function to constrain it.
  return createFiberFromOffscreen(offscreenProps, mode, NoLanes, null);
}
function updateWorkInProgressOffscreenFiber(current, offscreenProps) {
  // The props argument to `createWorkInProgress` is `any` typed, so we use this
  // wrapper function to constrain it.
  return createWorkInProgress(current, offscreenProps);
}
function updateSuspensePrimaryChildren(current, workInProgress, primaryChildren, renderLanes) {
  var currentPrimaryChildFragment = current.child;
  var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
  var primaryChildFragment = updateWorkInProgressOffscreenFiber(currentPrimaryChildFragment, {
    mode: 'visible',
    children: primaryChildren
  });
  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    primaryChildFragment.lanes = renderLanes;
  }
  primaryChildFragment.return = workInProgress;
  primaryChildFragment.sibling = null;
  if (currentFallbackChildFragment !== null) {
    // Delete the fallback child fragment
    var deletions = workInProgress.deletions;
    if (deletions === null) {
      workInProgress.deletions = [currentFallbackChildFragment];
      workInProgress.flags |= ChildDeletion;
    } else {
      deletions.push(currentFallbackChildFragment);
    }
  }
  workInProgress.child = primaryChildFragment;
  return primaryChildFragment;
}
function updateSuspenseFallbackChildren(current, workInProgress, primaryChildren, fallbackChildren, renderLanes) {
  var mode = workInProgress.mode;
  var currentPrimaryChildFragment = current.child;
  var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
  var primaryChildProps = {
    mode: 'hidden',
    children: primaryChildren
  };
  var primaryChildFragment;
  if (
  // In legacy mode, we commit the primary tree as if it successfully
  // completed, even though it's in an inconsistent state.
  (mode & ConcurrentMode) === NoMode &&
  // Make sure we're on the second pass, i.e. the primary child fragment was
  // already cloned. In legacy mode, the only case where this isn't true is
  // when DevTools forces us to display a fallback; we skip the first render
  // pass entirely and go straight to rendering the fallback. (In Concurrent
  // Mode, SuspenseList can also trigger this scenario, but this is a legacy-
  // only codepath.)
  workInProgress.child !== currentPrimaryChildFragment) {
    var progressedPrimaryFragment = workInProgress.child;
    primaryChildFragment = progressedPrimaryFragment;
    primaryChildFragment.childLanes = NoLanes;
    primaryChildFragment.pendingProps = primaryChildProps;
    if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
      // Reset the durations from the first pass so they aren't included in the
      // final amounts. This seems counterintuitive, since we're intentionally
      // not measuring part of the render phase, but this makes it match what we
      // do in Concurrent Mode.
      primaryChildFragment.actualDuration = 0;
      primaryChildFragment.actualStartTime = -1;
      primaryChildFragment.selfBaseDuration = currentPrimaryChildFragment.selfBaseDuration;
      primaryChildFragment.treeBaseDuration = currentPrimaryChildFragment.treeBaseDuration;
    } // The fallback fiber was added as a deletion during the first pass.
    // However, since we're going to remain on the fallback, we no longer want
    // to delete it.

    workInProgress.deletions = null;
  } else {
    primaryChildFragment = updateWorkInProgressOffscreenFiber(currentPrimaryChildFragment, primaryChildProps); // Since we're reusing a current tree, we need to reuse the flags, too.
    // (We don't do this in legacy mode, because in legacy mode we don't re-use
    // the current tree; see previous branch.)

    primaryChildFragment.subtreeFlags = currentPrimaryChildFragment.subtreeFlags & StaticMask;
  }
  var fallbackChildFragment;
  if (currentFallbackChildFragment !== null) {
    fallbackChildFragment = createWorkInProgress(currentFallbackChildFragment, fallbackChildren);
  } else {
    fallbackChildFragment = createFiberFromFragment(fallbackChildren, mode, renderLanes, null); // Needs a placement effect because the parent (the Suspense boundary) already
    // mounted but this is a new fiber.

    fallbackChildFragment.flags |= Placement;
  }
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;
  return fallbackChildFragment;
}
function retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, recoverableError) {
  // Falling back to client rendering. Because this has performance
  // implications, it's considered a recoverable error, even though the user
  // likely won't observe anything wrong with the UI.
  //
  // The error is passed in as an argument to enforce that every caller provide
  // a custom message, or explicitly opt out (currently the only path that opts
  // out is legacy mode; every concurrent path provides an error).
  if (recoverableError !== null) {
    queueHydrationError(recoverableError);
  } // This will add the old fiber to the deletion list

  reconcileChildFibers(workInProgress, current.child, null, renderLanes); // We're now not suspended nor dehydrated.

  var nextProps = workInProgress.pendingProps;
  var primaryChildren = nextProps.children;
  var primaryChildFragment = mountSuspensePrimaryChildren(workInProgress, primaryChildren, renderLanes); // Needs a placement effect because the parent (the Suspense boundary) already
  // mounted but this is a new fiber.

  primaryChildFragment.flags |= Placement;
  workInProgress.memoizedState = null;
  return primaryChildFragment;
}
function mountSuspenseFallbackAfterRetryWithoutHydrating(current, workInProgress, primaryChildren, fallbackChildren, renderLanes) {
  var fiberMode = workInProgress.mode;
  var primaryChildProps = {
    mode: 'visible',
    children: primaryChildren
  };
  var primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, fiberMode, NoLanes);
  var fallbackChildFragment = createFiberFromFragment(fallbackChildren, fiberMode, renderLanes, null); // Needs a placement effect because the parent (the Suspense
  // boundary) already mounted but this is a new fiber.

  fallbackChildFragment.flags |= Placement;
  primaryChildFragment.return = workInProgress;
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;
  if ((workInProgress.mode & ConcurrentMode) !== NoMode) {
    // We will have dropped the effect list which contains the
    // deletion. We need to reconcile to delete the current child.
    reconcileChildFibers(workInProgress, current.child, null, renderLanes);
  }
  return fallbackChildFragment;
}
function mountDehydratedSuspenseComponent(workInProgress, suspenseInstance, renderLanes) {
  // During the first pass, we'll bail out and not drill into the children.
  // Instead, we'll leave the content in place and try to hydrate it later.
  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    workInProgress.lanes = laneToLanes(SyncLane);
  } else if (isSuspenseInstanceFallback(suspenseInstance)) {
    // This is a client-only boundary. Since we won't get any content from the server
    // for this, we need to schedule that at a higher priority based on when it would
    // have timed out. In theory we could render it in this pass but it would have the
    // wrong priority associated with it and will prevent hydration of parent path.
    // Instead, we'll leave work left on it to render it in a separate commit.
    // TODO This time should be the time at which the server rendered response that is
    // a parent to this boundary was displayed. However, since we currently don't have
    // a protocol to transfer that time, we'll just estimate it by using the current
    // time. This will mean that Suspense timeouts are slightly shifted to later than
    // they should be.
    // Schedule a normal pri update to render this content.
    workInProgress.lanes = laneToLanes(DefaultHydrationLane);
  } else {
    // We'll continue hydrating the rest at offscreen priority since we'll already
    // be showing the right content coming from the server, it is no rush.
    workInProgress.lanes = laneToLanes(OffscreenLane);
  }
  return null;
}
function updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, nextProps, suspenseInstance, suspenseState, renderLanes) {
  if (!didSuspend) {
    // This is the first render pass. Attempt to hydrate.
    pushPrimaryTreeSuspenseHandler(workInProgress); // We should never be hydrating at this point because it is the first pass,
    // but after we've already committed once.

    warnIfHydrating();
    if ((workInProgress.mode & ConcurrentMode) === NoMode) {
      return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, null);
    }
    if (isSuspenseInstanceFallback(suspenseInstance)) {
      // This boundary is in a permanent fallback state. In this case, we'll never
      // get an update and we'll never be able to hydrate the final content. Let's just try the
      // client side render instead.
      var digest, message, stack;
      {
        var _getSuspenseInstanceF2 = getSuspenseInstanceFallbackErrorDetails(suspenseInstance);
        digest = _getSuspenseInstanceF2.digest;
      }
      var error;
      if (message) {
        // eslint-disable-next-line react-internal/prod-error-codes
        error = new Error(message);
      } else {
        error = new Error('The server could not finish this Suspense boundary, likely ' + 'due to an error during server rendering. Switched to ' + 'client rendering.');
      }
      error.digest = digest;
      var capturedValue = createCapturedValue(error, digest, stack);
      return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, capturedValue);
    }
    if (enableLazyContextPropagation &&
    // TODO: Factoring is a little weird, since we check this right below, too.
    // But don't want to re-arrange the if-else chain until/unless this
    // feature lands.
    !didReceiveUpdate) {
      // We need to check if any children have context before we decide to bail
      // out, so propagate the changes now.
      lazilyPropagateParentContextChanges(current, workInProgress, renderLanes);
    } // We use lanes to indicate that a child might depend on context, so if
    // any context has changed, we need to treat is as if the input might have changed.

    var hasContextChanged = includesSomeLane(renderLanes, current.childLanes);
    if (didReceiveUpdate || hasContextChanged) {
      // This boundary has changed since the first render. This means that we are now unable to
      // hydrate it. We might still be able to hydrate it using a higher priority lane.
      var root = getWorkInProgressRoot();
      if (root !== null) {
        var attemptHydrationAtLane = getBumpedLaneForHydration(root, renderLanes);
        if (attemptHydrationAtLane !== NoLane && attemptHydrationAtLane !== suspenseState.retryLane) {
          // Intentionally mutating since this render will get interrupted. This
          // is one of the very rare times where we mutate the current tree
          // during the render phase.
          suspenseState.retryLane = attemptHydrationAtLane; // TODO: Ideally this would inherit the event time of the current render

          var eventTime = NoTimestamp;
          enqueueConcurrentRenderForLane(current, attemptHydrationAtLane);
          scheduleUpdateOnFiber(root, current, attemptHydrationAtLane, eventTime); // Throw a special object that signals to the work loop that it should
          // interrupt the current render.
          //
          // Because we're inside a React-only execution stack, we don't
          // strictly need to throw here — we could instead modify some internal
          // work loop state. But using an exception means we don't need to
          // check for this case on every iteration of the work loop. So doing
          // it this way moves the check out of the fast path.

          throw SelectiveHydrationException;
        } else {// We have already tried to ping at a higher priority than we're rendering with
          // so if we got here, we must have failed to hydrate at those levels. We must
          // now give up. Instead, we're going to delete the whole subtree and instead inject
          // a new real Suspense boundary to take its place, which may render content
          // or fallback. This might suspend for a while and if it does we might still have
          // an opportunity to hydrate before this pass commits.
        }
      } // If we did not selectively hydrate, we'll continue rendering without
      // hydrating. Mark this tree as suspended to prevent it from committing
      // outside a transition.
      //
      // This path should only happen if the hydration lane already suspended.
      // Currently, it also happens during sync updates because there is no
      // hydration lane for sync updates.
      // TODO: We should ideally have a sync hydration lane that we can apply to do
      // a pass where we hydrate this subtree in place using the previous Context and then
      // reapply the update afterwards.

      renderDidSuspendDelayIfPossible();
      return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, null);
    } else if (isSuspenseInstancePending(suspenseInstance)) {
      // This component is still pending more data from the server, so we can't hydrate its
      // content. We treat it as if this component suspended itself. It might seem as if
      // we could just try to render it client-side instead. However, this will perform a
      // lot of unnecessary work and is unlikely to complete since it often will suspend
      // on missing data anyway. Additionally, the server might be able to render more
      // than we can on the client yet. In that case we'd end up with more fallback states
      // on the client than if we just leave it alone. If the server times out or errors
      // these should update this boundary to the permanent Fallback state instead.
      // Mark it as having captured (i.e. suspended).
      workInProgress.flags |= DidCapture; // Leave the child in place. I.e. the dehydrated fragment.

      workInProgress.child = current.child; // Register a callback to retry this boundary once the server has sent the result.

      var retry = retryDehydratedSuspenseBoundary.bind(null, current);
      registerSuspenseInstanceRetry(suspenseInstance, retry);
      return null;
    } else {
      // This is the first attempt.
      reenterHydrationStateFromDehydratedSuspenseInstance(workInProgress, suspenseInstance, suspenseState.treeContext);
      var primaryChildren = nextProps.children;
      var primaryChildFragment = mountSuspensePrimaryChildren(workInProgress, primaryChildren, renderLanes); // Mark the children as hydrating. This is a fast path to know whether this
      // tree is part of a hydrating tree. This is used to determine if a child
      // node has fully mounted yet, and for scheduling event replaying.
      // Conceptually this is similar to Placement in that a new subtree is
      // inserted into the React tree here. It just happens to not need DOM
      // mutations because it already exists.

      primaryChildFragment.flags |= Hydrating;
      return primaryChildFragment;
    }
  } else {
    // This is the second render pass. We already attempted to hydrated, but
    // something either suspended or errored.
    if (workInProgress.flags & ForceClientRender) {
      // Something errored during hydration. Try again without hydrating.
      pushPrimaryTreeSuspenseHandler(workInProgress);
      workInProgress.flags &= ~ForceClientRender;
      var _capturedValue = createCapturedValue(new Error('There was an error while hydrating this Suspense boundary. ' + 'Switched to client rendering.'));
      return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, _capturedValue);
    } else if (workInProgress.memoizedState !== null) {
      // Something suspended and we should still be in dehydrated mode.
      // Leave the existing child in place.
      // Push to avoid a mismatch
      pushFallbackTreeSuspenseHandler(workInProgress);
      workInProgress.child = current.child; // The dehydrated completion pass expects this flag to be there
      // but the normal suspense pass doesn't.

      workInProgress.flags |= DidCapture;
      return null;
    } else {
      // Suspended but we should no longer be in dehydrated mode.
      // Therefore we now have to render the fallback.
      pushFallbackTreeSuspenseHandler(workInProgress);
      var nextPrimaryChildren = nextProps.children;
      var nextFallbackChildren = nextProps.fallback;
      var fallbackChildFragment = mountSuspenseFallbackAfterRetryWithoutHydrating(current, workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
      var _primaryChildFragment4 = workInProgress.child;
      _primaryChildFragment4.memoizedState = mountSuspenseOffscreenState(renderLanes);
      workInProgress.memoizedState = SUSPENDED_MARKER;
      return fallbackChildFragment;
    }
  }
}
function scheduleSuspenseWorkOnFiber(fiber, renderLanes, propagationRoot) {
  fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
  var alternate = fiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
  }
  scheduleContextWorkOnParentPath(fiber.return, renderLanes, propagationRoot);
}
function propagateSuspenseContextChange(workInProgress, firstChild, renderLanes) {
  // Mark any Suspense boundaries with fallbacks as having work to do.
  // If they were previously forced into fallbacks, they may now be able
  // to unblock.
  var node = firstChild;
  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      var state = node.memoizedState;
      if (state !== null) {
        scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
      }
    } else if (node.tag === SuspenseListComponent) {
      // If the tail is hidden there might not be an Suspense boundaries
      // to schedule work on. In this case we have to schedule it on the
      // list itself.
      // We don't have to traverse to the children of the list since
      // the list will propagate the change when it rerenders.
      scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    } // $FlowFixMe[incompatible-use] found when upgrading Flow

    while (node.sibling === null) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    } // $FlowFixMe[incompatible-use] found when upgrading Flow

    node.sibling.return = node.return;
    node = node.sibling;
  }
}
function findLastContentRow(firstChild) {
  // This is going to find the last row among these children that is already
  // showing content on the screen, as opposed to being in fallback state or
  // new. If a row has multiple Suspense boundaries, any of them being in the
  // fallback state, counts as the whole row being in a fallback state.
  // Note that the "rows" will be workInProgress, but any nested children
  // will still be current since we haven't rendered them yet. The mounted
  // order may not be the same as the new order. We use the new order.
  var row = firstChild;
  var lastContentRow = null;
  while (row !== null) {
    var currentRow = row.alternate; // New rows can't be content rows.

    if (currentRow !== null && findFirstSuspended(currentRow) === null) {
      lastContentRow = row;
    }
    row = row.sibling;
  }
  return lastContentRow;
}
function validateRevealOrder(revealOrder) {}
function validateTailOptions(tailMode, revealOrder) {}
function validateSuspenseListNestedChild(childSlot, index) {
  return true;
}
function validateSuspenseListChildren(children, revealOrder) {}
function initSuspenseListRenderState(workInProgress, isBackwards, tail, lastContentRow, tailMode) {
  var renderState = workInProgress.memoizedState;
  if (renderState === null) {
    workInProgress.memoizedState = {
      isBackwards: isBackwards,
      rendering: null,
      renderingStartTime: 0,
      last: lastContentRow,
      tail: tail,
      tailMode: tailMode
    };
  } else {
    // We can reuse the existing object from previous renders.
    renderState.isBackwards = isBackwards;
    renderState.rendering = null;
    renderState.renderingStartTime = 0;
    renderState.last = lastContentRow;
    renderState.tail = tail;
    renderState.tailMode = tailMode;
  }
} // This can end up rendering this component multiple passes.
// The first pass splits the children fibers into two sets. A head and tail.
// We first render the head. If anything is in fallback state, we do another
// pass through beginWork to rerender all children (including the tail) with
// the force suspend context. If the first render didn't have anything in
// in fallback state. Then we render each row in the tail one-by-one.
// That happens in the completeWork phase without going back to beginWork.

function updateSuspenseListComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps;
  var revealOrder = nextProps.revealOrder;
  var tailMode = nextProps.tail;
  var newChildren = nextProps.children;
  validateRevealOrder(revealOrder);
  validateTailOptions(tailMode, revealOrder);
  validateSuspenseListChildren(newChildren, revealOrder);
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  var suspenseContext = suspenseStackCursor.current;
  var shouldForceFallback = hasSuspenseListContext(suspenseContext, ForceSuspenseFallback);
  if (shouldForceFallback) {
    suspenseContext = setShallowSuspenseListContext(suspenseContext, ForceSuspenseFallback);
    workInProgress.flags |= DidCapture;
  } else {
    var didSuspendBefore = current !== null && (current.flags & DidCapture) !== NoFlags;
    if (didSuspendBefore) {
      // If we previously forced a fallback, we need to schedule work
      // on any nested boundaries to let them know to try to render
      // again. This is the same as context updating.
      propagateSuspenseContextChange(workInProgress, workInProgress.child, renderLanes);
    }
    suspenseContext = setDefaultShallowSuspenseListContext(suspenseContext);
  }
  pushSuspenseListContext(workInProgress, suspenseContext);
  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    // In legacy mode, SuspenseList doesn't work so we just
    // use make it a noop by treating it as the default revealOrder.
    workInProgress.memoizedState = null;
  } else {
    switch (revealOrder) {
      case 'forwards':
        {
          var lastContentRow = findLastContentRow(workInProgress.child);
          var tail;
          if (lastContentRow === null) {
            // The whole list is part of the tail.
            // TODO: We could fast path by just rendering the tail now.
            tail = workInProgress.child;
            workInProgress.child = null;
          } else {
            // Disconnect the tail rows after the content row.
            // We're going to render them separately later.
            tail = lastContentRow.sibling;
            lastContentRow.sibling = null;
          }
          initSuspenseListRenderState(workInProgress, false,
          // isBackwards
          tail, lastContentRow, tailMode);
          break;
        }
      case 'backwards':
        {
          // We're going to find the first row that has existing content.
          // At the same time we're going to reverse the list of everything
          // we pass in the meantime. That's going to be our tail in reverse
          // order.
          var _tail = null;
          var row = workInProgress.child;
          workInProgress.child = null;
          while (row !== null) {
            var currentRow = row.alternate; // New rows can't be content rows.

            if (currentRow !== null && findFirstSuspended(currentRow) === null) {
              // This is the beginning of the main content.
              workInProgress.child = row;
              break;
            }
            var nextRow = row.sibling;
            row.sibling = _tail;
            _tail = row;
            row = nextRow;
          } // TODO: If workInProgress.child is null, we can continue on the tail immediately.

          initSuspenseListRenderState(workInProgress, true,
          // isBackwards
          _tail, null,
          // last
          tailMode);
          break;
        }
      case 'together':
        {
          initSuspenseListRenderState(workInProgress, false,
          // isBackwards
          null,
          // tail
          null,
          // last
          undefined);
          break;
        }
      default:
        {
          // The default reveal order is the same as not having
          // a boundary.
          workInProgress.memoizedState = null;
        }
    }
  }
  return workInProgress.child;
}
function updatePortalComponent(current, workInProgress, renderLanes) {
  pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
  var nextChildren = workInProgress.pendingProps;
  if (current === null) {
    // Portals are special because we don't append the children during mount
    // but at commit. Therefore we need to track insertions which the normal
    // flow doesn't do during mount. This doesn't happen at the root because
    // the root always starts with a "current" with a null child.
    // TODO: Consider unifying this with how the root works.
    workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderLanes);
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }
  return workInProgress.child;
}
var hasWarnedAboutUsingNoValuePropOnContextProvider = false;
function updateContextProvider(current, workInProgress, renderLanes) {
  var providerType = workInProgress.type;
  var context = providerType._context;
  var newProps = workInProgress.pendingProps;
  var oldProps = workInProgress.memoizedProps;
  var newValue = newProps.value;
  pushProvider(workInProgress, context, newValue);
  if (enableLazyContextPropagation) {// In the lazy propagation implementation, we don't scan for matching
    // consumers until something bails out, because until something bails out
    // we're going to visit those nodes, anyway. The trade-off is that it shifts
    // responsibility to the consumer to track whether something has changed.
  } else {
    if (oldProps !== null) {
      var oldValue = oldProps.value;
      if (is(oldValue, newValue)) {
        // No change. Bailout early if children are the same.
        if (oldProps.children === newProps.children && !hasLegacyContextChanged()) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
        }
      } else {
        // The context value changed. Search for matching consumers and schedule
        // them to update.
        propagateContextChange(workInProgress, context, renderLanes);
      }
    }
  }
  var newChildren = newProps.children;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
var hasWarnedAboutUsingContextAsConsumer = false;
function updateContextConsumer(current, workInProgress, renderLanes) {
  var context = workInProgress.type; // The logic below for Context differs depending on PROD or DEV mode. In
  // DEV mode, we create a separate object for Context.Consumer that acts
  // like a proxy to Context. This proxy object adds unnecessary code in PROD
  // so we use the old behaviour (Context.Consumer references Context) to
  // reduce size and overhead. The separate object references context via
  // a property called "_context", which also gives us the ability to check
  // in DEV mode if this property exists or not and warn if it does not.

  var newProps = workInProgress.pendingProps;
  var render = newProps.children;
  prepareToReadContext(workInProgress, renderLanes);
  var newValue = readContext(context);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  var newChildren;
  {
    newChildren = render(newValue);
  }
  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  } // React DevTools reads this flag.

  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
function updateScopeComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
export function markWorkInProgressReceivedUpdate() {
  didReceiveUpdate = true;
}
export function checkIfWorkInProgressReceivedUpdate() {
  return didReceiveUpdate;
}
function resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress) {
  if ((workInProgress.mode & ConcurrentMode) === NoMode) {
    if (current !== null) {
      // A lazy component only mounts if it suspended inside a non-
      // concurrent tree, in an inconsistent state. We want to treat it like
      // a new mount, even though an empty version of it already committed.
      // Disconnect the alternate pointers.
      current.alternate = null;
      workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

      workInProgress.flags |= Placement;
    }
  }
}
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
  if (current !== null) {
    // Reuse previous dependencies
    workInProgress.dependencies = current.dependencies;
  }
  if (enableProfilerTimer) {
    // Don't update "base" render times for bailouts.
    stopProfilerTimerIfRunning(workInProgress);
  }
  markSkippedUpdateLanes(workInProgress.lanes); // Check if the children have any pending work.

  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // The children don't have any work either. We can skip them.
    // TODO: Once we add back resuming, we should check if the children are
    // a work-in-progress set. If so, we need to transfer their effects.
    if (enableLazyContextPropagation && current !== null) {
      // Before bailing out, check if there are any context changes in
      // the children.
      lazilyPropagateParentContextChanges(current, workInProgress, renderLanes);
      if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
        return null;
      }
    } else {
      return null;
    }
  } // This fiber doesn't have work, but its subtree does. Clone the child
  // fibers and continue.

  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}
function remountFiber(current, oldWorkInProgress, newWorkInProgress) {
  {
    throw new Error('Did not expect this call in production. ' + 'This is a bug in React. Please file an issue.');
  }
}
function checkScheduledUpdateOrContext(current, renderLanes) {
  // Before performing an early bailout, we must check if there are pending
  // updates or context.
  var updateLanes = current.lanes;
  if (includesSomeLane(updateLanes, renderLanes)) {
    return true;
  } // No pending update, but because context is propagated lazily, we need
  // to check for a context change before we bail out.

  if (enableLazyContextPropagation) {
    var dependencies = current.dependencies;
    if (dependencies !== null && checkIfContextChanged(dependencies)) {
      return true;
    }
  }
  return false;
}
function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes) {
  // This fiber does not have any pending work. Bailout without entering
  // the begin phase. There's still some bookkeeping we that needs to be done
  // in this optimized path, mostly pushing stuff onto the stack.
  switch (workInProgress.tag) {
    case HostRoot:
      pushHostRootContext(workInProgress);
      var root = workInProgress.stateNode;
      pushRootTransition(workInProgress, root, renderLanes);
      if (enableTransitionTracing) {
        pushRootMarkerInstance(workInProgress);
      }
      if (enableCache) {
        var cache = current.memoizedState.cache;
        pushCacheProvider(workInProgress, cache);
      }
      resetHydrationState();
      break;
    case HostResource:
    case HostSingleton:
    case HostComponent:
      pushHostContext(workInProgress);
      break;
    case ClassComponent:
      {
        var Component = workInProgress.type;
        if (isLegacyContextProvider(Component)) {
          pushLegacyContextProvider(workInProgress);
        }
        break;
      }
    case HostPortal:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      break;
    case ContextProvider:
      {
        var newValue = workInProgress.memoizedProps.value;
        var context = workInProgress.type._context;
        pushProvider(workInProgress, context, newValue);
        break;
      }
    case Profiler:
      if (enableProfilerTimer) {
        // Profiler should only call onRender when one of its descendants actually rendered.
        var hasChildWork = includesSomeLane(renderLanes, workInProgress.childLanes);
        if (hasChildWork) {
          workInProgress.flags |= Update;
        }
        if (enableProfilerCommitHooks) {
          // Reset effect durations for the next eventual effect phase.
          // These are reset during render to allow the DevTools commit hook a chance to read them,
          var stateNode = workInProgress.stateNode;
          stateNode.effectDuration = 0;
          stateNode.passiveEffectDuration = 0;
        }
      }
      break;
    case SuspenseComponent:
      {
        var state = workInProgress.memoizedState;
        if (state !== null) {
          if (state.dehydrated !== null) {
            // We're not going to render the children, so this is just to maintain
            // push/pop symmetry
            pushPrimaryTreeSuspenseHandler(workInProgress); // We know that this component will suspend again because if it has
            // been unsuspended it has committed as a resolved Suspense component.
            // If it needs to be retried, it should have work scheduled on it.

            workInProgress.flags |= DidCapture; // We should never render the children of a dehydrated boundary until we
            // upgrade it. We return null instead of bailoutOnAlreadyFinishedWork.

            return null;
          } // If this boundary is currently timed out, we need to decide
          // whether to retry the primary children, or to skip over it and
          // go straight to the fallback. Check the priority of the primary
          // child fragment.

          var primaryChildFragment = workInProgress.child;
          var primaryChildLanes = primaryChildFragment.childLanes;
          if (includesSomeLane(renderLanes, primaryChildLanes)) {
            // The primary children have pending work. Use the normal path
            // to attempt to render the primary children again.
            return updateSuspenseComponent(current, workInProgress, renderLanes);
          } else {
            // The primary child fragment does not have pending work marked
            // on it
            pushPrimaryTreeSuspenseHandler(workInProgress); // The primary children do not have pending work with sufficient
            // priority. Bailout.

            var child = bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
            if (child !== null) {
              // The fallback children have pending work. Skip over the
              // primary children and work on the fallback.
              return child.sibling;
            } else {
              // Note: We can return `null` here because we already checked
              // whether there were nested context consumers, via the call to
              // `bailoutOnAlreadyFinishedWork` above.
              return null;
            }
          }
        } else {
          pushPrimaryTreeSuspenseHandler(workInProgress);
        }
        break;
      }
    case SuspenseListComponent:
      {
        var didSuspendBefore = (current.flags & DidCapture) !== NoFlags;
        var _hasChildWork = includesSomeLane(renderLanes, workInProgress.childLanes);
        if (enableLazyContextPropagation && !_hasChildWork) {
          // Context changes may not have been propagated yet. We need to do
          // that now, before we can decide whether to bail out.
          // TODO: We use `childLanes` as a heuristic for whether there is
          // remaining work in a few places, including
          // `bailoutOnAlreadyFinishedWork` and
          // `updateDehydratedSuspenseComponent`. We should maybe extract this
          // into a dedicated function.
          lazilyPropagateParentContextChanges(current, workInProgress, renderLanes);
          _hasChildWork = includesSomeLane(renderLanes, workInProgress.childLanes);
        }
        if (didSuspendBefore) {
          if (_hasChildWork) {
            // If something was in fallback state last time, and we have all the
            // same children then we're still in progressive loading state.
            // Something might get unblocked by state updates or retries in the
            // tree which will affect the tail. So we need to use the normal
            // path to compute the correct tail.
            return updateSuspenseListComponent(current, workInProgress, renderLanes);
          } // If none of the children had any work, that means that none of
          // them got retried so they'll still be blocked in the same way
          // as before. We can fast bail out.

          workInProgress.flags |= DidCapture;
        } // If nothing suspended before and we're rendering the same children,
        // then the tail doesn't matter. Anything new that suspends will work
        // in the "together" mode, so we can continue from the state we had.

        var renderState = workInProgress.memoizedState;
        if (renderState !== null) {
          // Reset to the "together" mode in case we've started a different
          // update in the past but didn't complete it.
          renderState.rendering = null;
          renderState.tail = null;
          renderState.lastEffect = null;
        }
        pushSuspenseListContext(workInProgress, suspenseStackCursor.current);
        if (_hasChildWork) {
          break;
        } else {
          // If none of the children had any work, that means that none of
          // them got retried so they'll still be blocked in the same way
          // as before. We can fast bail out.
          return null;
        }
      }
    case OffscreenComponent:
    case LegacyHiddenComponent:
      {
        // Need to check if the tree still needs to be deferred. This is
        // almost identical to the logic used in the normal update path,
        // so we'll just enter that. The only difference is we'll bail out
        // at the next level instead of this one, because the child props
        // have not changed. Which is fine.
        // TODO: Probably should refactor `beginWork` to split the bailout
        // path from the normal path. I'm tempted to do a labeled break here
        // but I won't :)
        workInProgress.lanes = NoLanes;
        return updateOffscreenComponent(current, workInProgress, renderLanes);
      }
    case CacheComponent:
      {
        if (enableCache) {
          var _cache = current.memoizedState.cache;
          pushCacheProvider(workInProgress, _cache);
        }
        break;
      }
    case TracingMarkerComponent:
      {
        if (enableTransitionTracing) {
          var instance = workInProgress.stateNode;
          if (instance !== null) {
            pushMarkerInstance(workInProgress, instance);
          }
        }
      }
  }
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}
function beginWork(current, workInProgress, renderLanes) {
  if (current !== null) {
    var oldProps = current.memoizedProps;
    var newProps = workInProgress.pendingProps;
    if (oldProps !== newProps || hasLegacyContextChanged() ||
    // Force a re-render if the implementation changed due to hot reload:
    false) {
      // If props or context changed, mark the fiber as having performed work.
      // This may be unset if the props are determined to be equal later (memo).
      didReceiveUpdate = true;
    } else {
      // Neither props nor legacy context changes. Check if there's a pending
      // update or context change.
      var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
      if (!hasScheduledUpdateOrContext &&
      // If this is the second pass of an error or suspense boundary, there
      // may not be work scheduled on `current`, so we check for this flag.
      (workInProgress.flags & DidCapture) === NoFlags) {
        // No pending updates or context. Bail out now.
        didReceiveUpdate = false;
        return attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes);
      }
      if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      } else {
        // An update was scheduled on this fiber, but there are no new props
        // nor legacy context. Set this to false. If an update queue or context
        // consumer produces a changed value, it will set this to true. Otherwise,
        // the component will assume the children have not changed and bail out.
        didReceiveUpdate = false;
      }
    }
  } else {
    didReceiveUpdate = false;
    if (getIsHydrating() && isForkedChild(workInProgress)) {
      // Check if this child belongs to a list of muliple children in
      // its parent.
      //
      // In a true multi-threaded implementation, we would render children on
      // parallel threads. This would represent the beginning of a new render
      // thread for this subtree.
      //
      // We only use this for id generation during hydration, which is why the
      // logic is located in this special branch.
      var slotIndex = workInProgress.index;
      var numberOfForks = getForksAtLevel(workInProgress);
      pushTreeId(workInProgress, numberOfForks, slotIndex);
    }
  } // Before entering the begin phase, clear pending update priority.
  // TODO: This assumes that we're about to evaluate the component and process
  // the update queue. However, there's an exception: SimpleMemoComponent
  // sometimes bails out later in the begin phase. This indicates that we should
  // move this assignment out of the common path and into each branch.

  workInProgress.lanes = NoLanes;
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      {
        return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
      }
    case LazyComponent:
      {
        var elementType = workInProgress.elementType;
        return mountLazyComponent(current, workInProgress, elementType, renderLanes);
      }
    case FunctionComponent:
      {
        var Component = workInProgress.type;
        var unresolvedProps = workInProgress.pendingProps;
        var resolvedProps = workInProgress.elementType === Component ? unresolvedProps : resolveDefaultProps(Component, unresolvedProps);
        return updateFunctionComponent(current, workInProgress, Component, resolvedProps, renderLanes);
      }
    case ClassComponent:
      {
        var _Component = workInProgress.type;
        var _unresolvedProps = workInProgress.pendingProps;
        var _resolvedProps = workInProgress.elementType === _Component ? _unresolvedProps : resolveDefaultProps(_Component, _unresolvedProps);
        return updateClassComponent(current, workInProgress, _Component, _resolvedProps, renderLanes);
      }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostResource:
      if (enableFloat && supportsResources) {
        return updateHostResource(current, workInProgress, renderLanes);
      }

    // eslint-disable-next-line no-fallthrough

    case HostSingleton:
      if (enableHostSingletons && supportsSingletons) {
        return updateHostSingleton(current, workInProgress, renderLanes);
      }

    // eslint-disable-next-line no-fallthrough

    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    case HostText:
      return updateHostText(current, workInProgress);
    case SuspenseComponent:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
    case HostPortal:
      return updatePortalComponent(current, workInProgress, renderLanes);
    case ForwardRef:
      {
        var type = workInProgress.type;
        var _unresolvedProps2 = workInProgress.pendingProps;
        var _resolvedProps2 = workInProgress.elementType === type ? _unresolvedProps2 : resolveDefaultProps(type, _unresolvedProps2);
        return updateForwardRef(current, workInProgress, type, _resolvedProps2, renderLanes);
      }
    case Fragment:
      return updateFragment(current, workInProgress, renderLanes);
    case Mode:
      return updateMode(current, workInProgress, renderLanes);
    case Profiler:
      return updateProfiler(current, workInProgress, renderLanes);
    case ContextProvider:
      return updateContextProvider(current, workInProgress, renderLanes);
    case ContextConsumer:
      return updateContextConsumer(current, workInProgress, renderLanes);
    case MemoComponent:
      {
        var _type2 = workInProgress.type;
        var _unresolvedProps3 = workInProgress.pendingProps; // Resolve outer props first, then resolve inner props.

        var _resolvedProps3 = resolveDefaultProps(_type2, _unresolvedProps3);
        _resolvedProps3 = resolveDefaultProps(_type2.type, _resolvedProps3);
        return updateMemoComponent(current, workInProgress, _type2, _resolvedProps3, renderLanes);
      }
    case SimpleMemoComponent:
      {
        return updateSimpleMemoComponent(current, workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes);
      }
    case IncompleteClassComponent:
      {
        var _Component2 = workInProgress.type;
        var _unresolvedProps4 = workInProgress.pendingProps;
        var _resolvedProps4 = workInProgress.elementType === _Component2 ? _unresolvedProps4 : resolveDefaultProps(_Component2, _unresolvedProps4);
        return mountIncompleteClassComponent(current, workInProgress, _Component2, _resolvedProps4, renderLanes);
      }
    case SuspenseListComponent:
      {
        return updateSuspenseListComponent(current, workInProgress, renderLanes);
      }
    case ScopeComponent:
      {
        if (enableScopeAPI) {
          return updateScopeComponent(current, workInProgress, renderLanes);
        }
        break;
      }
    case OffscreenComponent:
      {
        return updateOffscreenComponent(current, workInProgress, renderLanes);
      }
    case LegacyHiddenComponent:
      {
        if (enableLegacyHidden) {
          return updateLegacyHiddenComponent(current, workInProgress, renderLanes);
        }
        break;
      }
    case CacheComponent:
      {
        if (enableCache) {
          return updateCacheComponent(current, workInProgress, renderLanes);
        }
        break;
      }
    case TracingMarkerComponent:
      {
        if (enableTransitionTracing) {
          return updateTracingMarkerComponent(current, workInProgress, renderLanes);
        }
        break;
      }
  }
  throw new Error("Unknown unit of work tag (" + workInProgress.tag + "). This error is likely caused by a bug in " + 'React. Please file an issue.');
}
export { beginWork };