import { error as _consoleError } from '../../shared/consoleWithStackDev';
import { NoTimestamp, SyncLane } from './ReactFiberLane';
import { isOffscreenManual } from './ReactFiberOffscreenComponent';
import {
    enableCreateEventHandleAPI,
    enableProfilerTimer,
    enableProfilerCommitHooks,
    enableProfilerNestedUpdatePhase,
    enableSchedulingProfiler,
    enableSuspenseCallback,
    enableScopeAPI,
    deletedTreeCleanUpLevel,
    enableUpdaterTracking,
    enableCache,
    enableTransitionTracing,
    enableUseEffectEventHook,
    enableFloat,
    enableLegacyHidden,
    enableHostSingletons,
} from '../../shared/ReactFeatureFlags';
import {
    FunctionComponent,
    ForwardRef,
    ClassComponent,
    HostRoot,
    HostComponent,
    HostResource,
    HostSingleton,
    HostText,
    HostPortal,
    Profiler,
    SuspenseComponent,
    DehydratedFragment,
    IncompleteClassComponent,
    MemoComponent,
    SimpleMemoComponent,
    SuspenseListComponent,
    ScopeComponent,
    OffscreenComponent,
    LegacyHiddenComponent,
    CacheComponent,
    TracingMarkerComponent,
} from './ReactWorkTags';
import {
    NoFlags,
    ContentReset,
    Placement,
    ChildDeletion,
    Snapshot,
    Update,
    Callback,
    Ref,
    Hydrating,
    Passive,
    BeforeMutationMask,
    MutationMask,
    LayoutMask,
    PassiveMask,
    Visibility,
} from './ReactFiberFlags';
import getComponentNameFromFiber from './getComponentNameFromFiber';
import {
    resetCurrentFiber as resetCurrentDebugFiberInDEV,
    setCurrentFiber as setCurrentDebugFiberInDEV,
    getCurrentFiber as getCurrentDebugFiberInDEV,
} from './ReactCurrentFiber';
import { resolveDefaultProps } from './ReactFiberLazyComponent';
import {
    isCurrentUpdateNested,
    getCommitTime,
    recordLayoutEffectDuration,
    startLayoutEffectTimer,
    recordPassiveEffectDuration,
    startPassiveEffectTimer,
} from './ReactProfilerTimer';
import { ConcurrentMode, NoMode, ProfileMode } from './ReactTypeOfMode';
import {
    deferHiddenCallbacks,
    commitHiddenCallbacks,
    commitCallbacks,
} from './ReactFiberClassUpdateQueue';
import {
    getPublicInstance,
    supportsMutation,
    supportsPersistence,
    supportsHydration,
    supportsResources,
    supportsSingletons,
    commitMount,
    commitUpdate,
    resetTextContent,
    commitTextUpdate,
    appendChild,
    appendChildToContainer,
    insertBefore,
    insertInContainerBefore,
    removeChild,
    removeChildFromContainer,
    clearSuspenseBoundary,
    clearSuspenseBoundaryFromContainer,
    replaceContainerChildren,
    createContainerChildSet,
    hideInstance,
    hideTextInstance,
    unhideInstance,
    unhideTextInstance,
    commitHydratedContainer,
    commitHydratedSuspenseInstance,
    clearContainer,
    prepareScopeUpdate,
    prepareForCommit,
    beforeActiveInstanceBlur,
    detachDeletedInstance,
    acquireResource,
    releaseResource,
    clearSingleton,
    acquireSingletonInstance,
    releaseSingletonInstance,
} from '../../react-dom-bindings/src/client/ReactDOMHostConfig';
import {
    captureCommitPhaseError,
    resolveRetryWakeable,
    markCommitTimeOfFallback,
    enqueuePendingPassiveProfilerEffect,
    restorePendingUpdaters,
    addTransitionStartCallbackToPendingTransition,
    addTransitionProgressCallbackToPendingTransition,
    addTransitionCompleteCallbackToPendingTransition,
    addMarkerProgressCallbackToPendingTransition,
    addMarkerIncompleteCallbackToPendingTransition,
    addMarkerCompleteCallbackToPendingTransition,
    setIsRunningInsertionEffect,
    getExecutionContext,
    CommitContext,
    NoContext,
} from './ReactFiberWorkLoop';
import {
    NoFlags as NoHookEffect,
    HasEffect as HookHasEffect,
    Layout as HookLayout,
    Insertion as HookInsertion,
    Passive as HookPassive,
} from './ReactHookEffectTags';
import { didWarnAboutReassigningProps } from './ReactFiberBeginWork';
import { doesFiberContain } from './ReactFiberTreeReflection';
import {
    invokeGuardedCallback,
    clearCaughtError,
} from '../../shared/ReactErrorUtils';
import {
    isDevToolsPresent,
    markComponentPassiveEffectMountStarted,
    markComponentPassiveEffectMountStopped,
    markComponentPassiveEffectUnmountStarted,
    markComponentPassiveEffectUnmountStopped,
    markComponentLayoutEffectMountStarted,
    markComponentLayoutEffectMountStopped,
    markComponentLayoutEffectUnmountStarted,
    markComponentLayoutEffectUnmountStopped,
    onCommitUnmount,
} from './ReactFiberDevToolsHook';
import { releaseCache, retainCache } from './ReactFiberCacheComponent';
import { clearTransitionsForLanes } from './ReactFiberLane';
import {
    OffscreenVisible,
    OffscreenDetached,
    OffscreenPassiveEffectsConnected,
} from './ReactFiberOffscreenComponent';
import {
    TransitionRoot,
    TransitionTracingMarker,
} from './ReactFiberTracingMarkerComponent';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentRenderForLane } from './ReactFiberConcurrentUpdates';
var didWarnAboutUndefinedSnapshotBeforeUpdate = null;
// Used during the commit phase to track the state of the Offscreen component stack.
// Allows us to avoid traversing the return path to find the nearest Offscreen ancestor.

var offscreenSubtreeIsHidden = false;
var offscreenSubtreeWasHidden = false;
var PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;
var nextEffect = null; // Used for Profiling builds to track updaters.

var inProgressLanes = null;
var inProgressRoot = null;
function shouldProfile(current) {
    return (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        (current.mode & ProfileMode) !== NoMode &&
        (getExecutionContext() & CommitContext) !== NoContext
    );
}
export function reportUncaughtErrorInDEV(error) {}
var callComponentWillUnmountWithTimer = function (current, instance) {
    instance.props = current.memoizedProps;
    instance.state = current.memoizedState;
    if (shouldProfile(current)) {
        try {
            startLayoutEffectTimer();
            instance.componentWillUnmount();
        } finally {
            recordLayoutEffectDuration(current);
        }
    } else {
        instance.componentWillUnmount();
    }
}; // Capture errors so they don't interrupt unmounting.

function safelyCallComponentWillUnmount(
    current,
    nearestMountedAncestor,
    instance
) {
    try {
        callComponentWillUnmountWithTimer(current, instance);
    } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
    }
} // Capture errors so they don't interrupt mounting.

function safelyAttachRef(current, nearestMountedAncestor) {
    try {
        commitAttachRef(current);
    } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
    }
}
function safelyDetachRef(current, nearestMountedAncestor) {
    var ref = current.ref;
    var refCleanup = current.refCleanup;
    if (ref !== null) {
        if (typeof refCleanup === 'function') {
            try {
                if (shouldProfile(current)) {
                    try {
                        startLayoutEffectTimer();
                        refCleanup();
                    } finally {
                        recordLayoutEffectDuration(current);
                    }
                } else {
                    refCleanup();
                }
            } catch (error) {
                captureCommitPhaseError(current, nearestMountedAncestor, error);
            } finally {
                // `refCleanup` has been called. Nullify all references to it to prevent double invocation.
                current.refCleanup = null;
                var finishedWork = current.alternate;
                if (finishedWork != null) {
                    finishedWork.refCleanup = null;
                }
            }
        } else if (typeof ref === 'function') {
            var retVal;
            try {
                if (shouldProfile(current)) {
                    try {
                        startLayoutEffectTimer();
                        retVal = ref(null);
                    } finally {
                        recordLayoutEffectDuration(current);
                    }
                } else {
                    retVal = ref(null);
                }
            } catch (error) {
                captureCommitPhaseError(current, nearestMountedAncestor, error);
            }
        } else {
            // $FlowFixMe unable to narrow type to RefObject
            ref.current = null;
        }
    }
}
function safelyCallDestroy(current, nearestMountedAncestor, destroy) {
    try {
        destroy();
    } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
    }
}
var focusedInstanceHandle = null;
var shouldFireAfterActiveInstanceBlur = false;
export function commitBeforeMutationEffects(root, firstChild) {
    focusedInstanceHandle = prepareForCommit(root.containerInfo);
    nextEffect = firstChild;
    commitBeforeMutationEffects_begin(); // We no longer need to track the active instance fiber

    var shouldFire = shouldFireAfterActiveInstanceBlur;
    shouldFireAfterActiveInstanceBlur = false;
    focusedInstanceHandle = null;
    return shouldFire;
}
function commitBeforeMutationEffects_begin() {
    while (nextEffect !== null) {
        var fiber = nextEffect; // This phase is only used for beforeActiveInstanceBlur.
        // Let's skip the whole loop if it's off.

        if (enableCreateEventHandleAPI) {
            // TODO: Should wrap this in flags check, too, as optimization
            var deletions = fiber.deletions;
            if (deletions !== null) {
                for (var i = 0; i < deletions.length; i++) {
                    var deletion = deletions[i];
                    commitBeforeMutationEffectsDeletion(deletion);
                }
            }
        }
        var child = fiber.child;
        if (
            (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags &&
            child !== null
        ) {
            child.return = fiber;
            nextEffect = child;
        } else {
            commitBeforeMutationEffects_complete();
        }
    }
}
function commitBeforeMutationEffects_complete() {
    while (nextEffect !== null) {
        var fiber = nextEffect;
        setCurrentDebugFiberInDEV(fiber);
        try {
            commitBeforeMutationEffectsOnFiber(fiber);
        } catch (error) {
            captureCommitPhaseError(fiber, fiber.return, error);
        }
        resetCurrentDebugFiberInDEV();
        var sibling = fiber.sibling;
        if (sibling !== null) {
            sibling.return = fiber.return;
            nextEffect = sibling;
            return;
        }
        nextEffect = fiber.return;
    }
}
function commitBeforeMutationEffectsOnFiber(finishedWork) {
    var current = finishedWork.alternate;
    var flags = finishedWork.flags;
    if (enableCreateEventHandleAPI) {
        if (
            !shouldFireAfterActiveInstanceBlur &&
            focusedInstanceHandle !== null
        ) {
            // Check to see if the focused element was inside of a hidden (Suspense) subtree.
            // TODO: Move this out of the hot path using a dedicated effect tag.
            if (
                finishedWork.tag === SuspenseComponent &&
                isSuspenseBoundaryBeingHidden(current, finishedWork) &&
                // $FlowFixMe[incompatible-call] found when upgrading Flow
                doesFiberContain(finishedWork, focusedInstanceHandle)
            ) {
                shouldFireAfterActiveInstanceBlur = true;
                beforeActiveInstanceBlur(finishedWork);
            }
        }
    }
    if ((flags & Snapshot) !== NoFlags) {
        setCurrentDebugFiberInDEV(finishedWork);
    }
    switch (finishedWork.tag) {
        case FunctionComponent: {
            if (enableUseEffectEventHook) {
                if ((flags & Update) !== NoFlags) {
                    commitUseEffectEventMount(finishedWork);
                }
            }
            break;
        }
        case ForwardRef:
        case SimpleMemoComponent: {
            break;
        }
        case ClassComponent: {
            if ((flags & Snapshot) !== NoFlags) {
                if (current !== null) {
                    var prevProps = current.memoizedProps;
                    var prevState = current.memoizedState;
                    var instance = finishedWork.stateNode; // We could update instance props and state here,
                    // but instead we rely on them being set during last render.
                    // TODO: revisit this when we implement resuming.

                    var snapshot = instance.getSnapshotBeforeUpdate(
                        finishedWork.elementType === finishedWork.type
                            ? prevProps
                            : resolveDefaultProps(finishedWork.type, prevProps),
                        prevState
                    );
                    instance.__reactInternalSnapshotBeforeUpdate = snapshot;
                }
            }
            break;
        }
        case HostRoot: {
            if ((flags & Snapshot) !== NoFlags) {
                if (supportsMutation) {
                    var root = finishedWork.stateNode;
                    clearContainer(root.containerInfo);
                }
            }
            break;
        }
        case HostComponent:
        case HostResource:
        case HostSingleton:
        case HostText:
        case HostPortal:
        case IncompleteClassComponent:
            // Nothing to do for these component types
            break;
        default: {
            if ((flags & Snapshot) !== NoFlags) {
                throw new Error(
                    'This unit of work tag should not have side-effects. This error is ' +
                        'likely caused by a bug in React. Please file an issue.'
                );
            }
        }
    }
    if ((flags & Snapshot) !== NoFlags) {
        resetCurrentDebugFiberInDEV();
    }
}
function commitBeforeMutationEffectsDeletion(deletion) {
    if (enableCreateEventHandleAPI) {
        // TODO (effects) It would be nice to avoid calling doesFiberContain()
        // Maybe we can repurpose one of the subtreeFlags positions for this instead?
        // Use it to store which part of the tree the focused instance is in?
        // This assumes we can safely determine that instance during the "render" phase.
        if (doesFiberContain(deletion, focusedInstanceHandle)) {
            shouldFireAfterActiveInstanceBlur = true;
            beforeActiveInstanceBlur(deletion);
        }
    }
}
function commitHookEffectListUnmount(
    flags,
    finishedWork,
    nearestMountedAncestor
) {
    var updateQueue = finishedWork.updateQueue;
    var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        var firstEffect = lastEffect.next;
        var effect = firstEffect;
        do {
            if ((effect.tag & flags) === flags) {
                // Unmount
                var destroy = effect.destroy;
                effect.destroy = undefined;
                if (destroy !== undefined) {
                    if (enableSchedulingProfiler) {
                        if ((flags & HookPassive) !== NoHookEffect) {
                            markComponentPassiveEffectUnmountStarted(
                                finishedWork
                            );
                        } else if ((flags & HookLayout) !== NoHookEffect) {
                            markComponentLayoutEffectUnmountStarted(
                                finishedWork
                            );
                        }
                    }
                    safelyCallDestroy(
                        finishedWork,
                        nearestMountedAncestor,
                        destroy
                    );
                    if (enableSchedulingProfiler) {
                        if ((flags & HookPassive) !== NoHookEffect) {
                            markComponentPassiveEffectUnmountStopped();
                        } else if ((flags & HookLayout) !== NoHookEffect) {
                            markComponentLayoutEffectUnmountStopped();
                        }
                    }
                }
            }
            effect = effect.next;
        } while (effect !== firstEffect);
    }
}
function commitHookEffectListMount(flags, finishedWork) {
    var updateQueue = finishedWork.updateQueue;
    var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        var firstEffect = lastEffect.next;
        var effect = firstEffect;
        do {
            if ((effect.tag & flags) === flags) {
                if (enableSchedulingProfiler) {
                    if ((flags & HookPassive) !== NoHookEffect) {
                        markComponentPassiveEffectMountStarted(finishedWork);
                    } else if ((flags & HookLayout) !== NoHookEffect) {
                        markComponentLayoutEffectMountStarted(finishedWork);
                    }
                } // Mount

                var create = effect.create;
                effect.destroy = create();
                if (enableSchedulingProfiler) {
                    if ((flags & HookPassive) !== NoHookEffect) {
                        markComponentPassiveEffectMountStopped();
                    } else if ((flags & HookLayout) !== NoHookEffect) {
                        markComponentLayoutEffectMountStopped();
                    }
                }
            }
            effect = effect.next;
        } while (effect !== firstEffect);
    }
}
function commitUseEffectEventMount(finishedWork) {
    var updateQueue = finishedWork.updateQueue;
    var eventPayloads = updateQueue !== null ? updateQueue.events : null;
    if (eventPayloads !== null) {
        for (var ii = 0; ii < eventPayloads.length; ii++) {
            var _eventPayloads$ii = eventPayloads[ii],
                ref = _eventPayloads$ii.ref,
                nextImpl = _eventPayloads$ii.nextImpl;
            ref.impl = nextImpl;
        }
    }
}
export function commitPassiveEffectDurations(finishedRoot, finishedWork) {
    if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        getExecutionContext() & CommitContext
    ) {
        // Only Profilers with work in their subtree will have an Update effect scheduled.
        if ((finishedWork.flags & Update) !== NoFlags) {
            switch (finishedWork.tag) {
                case Profiler: {
                    var passiveEffectDuration =
                        finishedWork.stateNode.passiveEffectDuration;
                    var _finishedWork$memoize = finishedWork.memoizedProps,
                        id = _finishedWork$memoize.id,
                        onPostCommit = _finishedWork$memoize.onPostCommit; // This value will still reflect the previous commit phase.
                    // It does not get reset until the start of the next commit phase.

                    var commitTime = getCommitTime();
                    var phase =
                        finishedWork.alternate === null ? 'mount' : 'update';
                    if (enableProfilerNestedUpdatePhase) {
                        if (isCurrentUpdateNested()) {
                            phase = 'nested-update';
                        }
                    }
                    if (typeof onPostCommit === 'function') {
                        onPostCommit(
                            id,
                            phase,
                            passiveEffectDuration,
                            commitTime
                        );
                    } // Bubble times to the next nearest ancestor Profiler.
                    // After we process that Profiler, we'll bubble further up.

                    var parentFiber = finishedWork.return;
                    outer: while (parentFiber !== null) {
                        switch (parentFiber.tag) {
                            case HostRoot:
                                var root = parentFiber.stateNode;
                                root.passiveEffectDuration +=
                                    passiveEffectDuration;
                                break outer;
                            case Profiler:
                                var parentStateNode = parentFiber.stateNode;
                                parentStateNode.passiveEffectDuration +=
                                    passiveEffectDuration;
                                break outer;
                        }
                        parentFiber = parentFiber.return;
                    }
                    break;
                }
                default:
                    break;
            }
        }
    }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
    // At this point layout effects have already been destroyed (during mutation phase).
    // This is done to prevent sibling component effects from interfering with each other,
    // e.g. a destroy function in one component should never override a ref set
    // by a create function in another component during the same commit.
    if (shouldProfile(finishedWork)) {
        try {
            startLayoutEffectTimer();
            commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
        recordLayoutEffectDuration(finishedWork);
    } else {
        try {
            commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
    }
}
function commitClassLayoutLifecycles(finishedWork, current) {
    var instance = finishedWork.stateNode;
    if (current === null) {
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.

        if (shouldProfile(finishedWork)) {
            try {
                startLayoutEffectTimer();
                instance.componentDidMount();
            } catch (error) {
                captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error
                );
            }
            recordLayoutEffectDuration(finishedWork);
        } else {
            try {
                instance.componentDidMount();
            } catch (error) {
                captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error
                );
            }
        }
    } else {
        var prevProps =
            finishedWork.elementType === finishedWork.type
                ? current.memoizedProps
                : resolveDefaultProps(finishedWork.type, current.memoizedProps);
        var prevState = current.memoizedState; // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.

        if (shouldProfile(finishedWork)) {
            try {
                startLayoutEffectTimer();
                instance.componentDidUpdate(
                    prevProps,
                    prevState,
                    instance.__reactInternalSnapshotBeforeUpdate
                );
            } catch (error) {
                captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error
                );
            }
            recordLayoutEffectDuration(finishedWork);
        } else {
            try {
                instance.componentDidUpdate(
                    prevProps,
                    prevState,
                    instance.__reactInternalSnapshotBeforeUpdate
                );
            } catch (error) {
                captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error
                );
            }
        }
    }
}
function commitClassCallbacks(finishedWork) {
    // TODO: I think this is now always non-null by the time it reaches the
    // commit phase. Consider removing the type check.
    var updateQueue = finishedWork.updateQueue;
    if (updateQueue !== null) {
        var instance = finishedWork.stateNode;
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.

        try {
            commitCallbacks(updateQueue, instance);
        } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
    }
}
function commitHostComponentMount(finishedWork) {
    var type = finishedWork.type;
    var props = finishedWork.memoizedProps;
    var instance = finishedWork.stateNode;
    try {
        commitMount(instance, type, props, finishedWork);
    } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
}
function commitProfilerUpdate(finishedWork, current) {
    if (enableProfilerTimer && getExecutionContext() & CommitContext) {
        try {
            var _finishedWork$memoize2 = finishedWork.memoizedProps,
                onCommit = _finishedWork$memoize2.onCommit,
                onRender = _finishedWork$memoize2.onRender;
            var effectDuration = finishedWork.stateNode.effectDuration;
            var commitTime = getCommitTime();
            var phase = current === null ? 'mount' : 'update';
            if (enableProfilerNestedUpdatePhase) {
                if (isCurrentUpdateNested()) {
                    phase = 'nested-update';
                }
            }
            if (typeof onRender === 'function') {
                onRender(
                    finishedWork.memoizedProps.id,
                    phase,
                    finishedWork.actualDuration,
                    finishedWork.treeBaseDuration,
                    finishedWork.actualStartTime,
                    commitTime
                );
            }
            if (enableProfilerCommitHooks) {
                if (typeof onCommit === 'function') {
                    onCommit(
                        finishedWork.memoizedProps.id,
                        phase,
                        effectDuration,
                        commitTime
                    );
                } // Schedule a passive effect for this Profiler to call onPostCommit hooks.
                // This effect should be scheduled even if there is no onPostCommit callback for this Profiler,
                // because the effect is also where times bubble to parent Profilers.

                enqueuePendingPassiveProfilerEffect(finishedWork); // Propagate layout effect durations to the next nearest Profiler ancestor.
                // Do not reset these values until the next render so DevTools has a chance to read them first.

                var parentFiber = finishedWork.return;
                outer: while (parentFiber !== null) {
                    switch (parentFiber.tag) {
                        case HostRoot:
                            var root = parentFiber.stateNode;
                            root.effectDuration += effectDuration;
                            break outer;
                        case Profiler:
                            var parentStateNode = parentFiber.stateNode;
                            parentStateNode.effectDuration += effectDuration;
                            break outer;
                    }
                    parentFiber = parentFiber.return;
                }
            }
        } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
    }
}
function commitLayoutEffectOnFiber(
    finishedRoot,
    current,
    finishedWork,
    committedLanes
) {
    // When updating this function, also update reappearLayoutEffects, which does
    // most of the same things when an offscreen tree goes from hidden -> visible.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
            recursivelyTraverseLayoutEffects(
                finishedRoot,
                finishedWork,
                committedLanes
            );
            if (flags & Update) {
                commitHookLayoutEffects(
                    finishedWork,
                    HookLayout | HookHasEffect
                );
            }
            break;
        }
        case ClassComponent: {
            recursivelyTraverseLayoutEffects(
                finishedRoot,
                finishedWork,
                committedLanes
            );
            if (flags & Update) {
                commitClassLayoutLifecycles(finishedWork, current);
            }
            if (flags & Callback) {
                commitClassCallbacks(finishedWork);
            }
            if (flags & Ref) {
                safelyAttachRef(finishedWork, finishedWork.return);
            }
            break;
        }
        case HostRoot: {
            recursivelyTraverseLayoutEffects(
                finishedRoot,
                finishedWork,
                committedLanes
            );
            if (flags & Callback) {
                // TODO: I think this is now always non-null by the time it reaches the
                // commit phase. Consider removing the type check.
                var updateQueue = finishedWork.updateQueue;
                if (updateQueue !== null) {
                    var instance = null;
                    if (finishedWork.child !== null) {
                        switch (finishedWork.child.tag) {
                            case HostSingleton:
                            case HostComponent:
                                instance = getPublicInstance(
                                    finishedWork.child.stateNode
                                );
                                break;
                            case ClassComponent:
                                instance = finishedWork.child.stateNode;
                                break;
                        }
                    }
                    try {
                        commitCallbacks(updateQueue, instance);
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            }
            break;
        }
        case HostResource: {
            if (enableFloat && supportsResources) {
                recursivelyTraverseLayoutEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes
                );
                if (flags & Ref) {
                    safelyAttachRef(finishedWork, finishedWork.return);
                }
                break;
            }
        }
        // eslint-disable-next-line-no-fallthrough

        case HostSingleton:
        case HostComponent: {
            recursivelyTraverseLayoutEffects(
                finishedRoot,
                finishedWork,
                committedLanes
            ); // Renderers may schedule work to be done after host components are mounted
            // (eg DOM renderer may schedule auto-focus for inputs and form controls).
            // These effects should only be committed when components are first mounted,
            // aka when there is no current/alternate.

            if (current === null && flags & Update) {
                commitHostComponentMount(finishedWork);
            }
            if (flags & Ref) {
                safelyAttachRef(finishedWork, finishedWork.return);
            }
            break;
        }
        case Profiler: {
            recursivelyTraverseLayoutEffects(
                finishedRoot,
                finishedWork,
                committedLanes
            ); // TODO: Should this fire inside an offscreen tree? Or should it wait to
            // fire when the tree becomes visible again.

            if (flags & Update) {
                commitProfilerUpdate(finishedWork, current);
            }
            break;
        }
        case SuspenseComponent: {
            recursivelyTraverseLayoutEffects(
                finishedRoot,
                finishedWork,
                committedLanes
            );
            if (flags & Update) {
                commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            }
            break;
        }
        case OffscreenComponent: {
            var isModernRoot = (finishedWork.mode & ConcurrentMode) !== NoMode;
            if (isModernRoot) {
                var isHidden = finishedWork.memoizedState !== null;
                var newOffscreenSubtreeIsHidden =
                    isHidden || offscreenSubtreeIsHidden;
                if (newOffscreenSubtreeIsHidden) {
                    // The Offscreen tree is hidden. Skip over its layout effects.
                } else {
                    // The Offscreen tree is visible.
                    var wasHidden =
                        current !== null && current.memoizedState !== null;
                    var newOffscreenSubtreeWasHidden =
                        wasHidden || offscreenSubtreeWasHidden;
                    var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
                    var prevOffscreenSubtreeWasHidden =
                        offscreenSubtreeWasHidden;
                    offscreenSubtreeIsHidden = newOffscreenSubtreeIsHidden;
                    offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden;
                    if (
                        offscreenSubtreeWasHidden &&
                        !prevOffscreenSubtreeWasHidden
                    ) {
                        // This is the root of a reappearing boundary. As we continue
                        // traversing the layout effects, we must also re-mount layout
                        // effects that were unmounted when the Offscreen subtree was
                        // hidden. So this is a superset of the normal commitLayoutEffects.
                        var includeWorkInProgressEffects =
                            (finishedWork.subtreeFlags & LayoutMask) !==
                            NoFlags;
                        recursivelyTraverseReappearLayoutEffects(
                            finishedRoot,
                            finishedWork,
                            includeWorkInProgressEffects
                        );
                    } else {
                        recursivelyTraverseLayoutEffects(
                            finishedRoot,
                            finishedWork,
                            committedLanes
                        );
                    }
                    offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
                    offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
                }
            } else {
                recursivelyTraverseLayoutEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes
                );
            }
            if (flags & Ref) {
                var props = finishedWork.memoizedProps;
                if (props.mode === 'manual') {
                    safelyAttachRef(finishedWork, finishedWork.return);
                } else {
                    safelyDetachRef(finishedWork, finishedWork.return);
                }
            }
            break;
        }
        default: {
            recursivelyTraverseLayoutEffects(
                finishedRoot,
                finishedWork,
                committedLanes
            );
            break;
        }
    }
}
function abortRootTransitions(
    root,
    abort,
    deletedTransitions,
    deletedOffscreenInstance,
    isInDeletedTree
) {
    if (enableTransitionTracing) {
        var rootTransitions = root.incompleteTransitions;
        deletedTransitions.forEach(function (transition) {
            if (rootTransitions.has(transition)) {
                var transitionInstance = rootTransitions.get(transition);
                if (transitionInstance.aborts === null) {
                    transitionInstance.aborts = [];
                }
                transitionInstance.aborts.push(abort);
                if (deletedOffscreenInstance !== null) {
                    if (
                        transitionInstance.pendingBoundaries !== null &&
                        transitionInstance.pendingBoundaries.has(
                            deletedOffscreenInstance
                        )
                    ) {
                        // $FlowFixMe[incompatible-use] found when upgrading Flow
                        transitionInstance.pendingBoundaries.delete(
                            deletedOffscreenInstance
                        );
                    }
                }
            }
        });
    }
}
function abortTracingMarkerTransitions(
    abortedFiber,
    abort,
    deletedTransitions,
    deletedOffscreenInstance,
    isInDeletedTree
) {
    if (enableTransitionTracing) {
        var markerInstance = abortedFiber.stateNode;
        var markerTransitions = markerInstance.transitions;
        var pendingBoundaries = markerInstance.pendingBoundaries;
        if (markerTransitions !== null) {
            // TODO: Refactor this code. Is there a way to move this code to
            // the deletions phase instead of calculating it here while making sure
            // complete is called appropriately?
            deletedTransitions.forEach(function (transition) {
                // If one of the transitions on the tracing marker is a transition
                // that was in an aborted subtree, we will abort that tracing marker
                if (
                    abortedFiber !== null &&
                    markerTransitions.has(transition) &&
                    (markerInstance.aborts === null ||
                        !markerInstance.aborts.includes(abort))
                ) {
                    if (markerInstance.transitions !== null) {
                        if (markerInstance.aborts === null) {
                            markerInstance.aborts = [abort];
                            addMarkerIncompleteCallbackToPendingTransition(
                                abortedFiber.memoizedProps.name,
                                markerInstance.transitions,
                                markerInstance.aborts
                            );
                        } else {
                            markerInstance.aborts.push(abort);
                        } // We only want to call onTransitionProgress when the marker hasn't been
                        // deleted

                        if (
                            deletedOffscreenInstance !== null &&
                            !isInDeletedTree &&
                            pendingBoundaries !== null &&
                            pendingBoundaries.has(deletedOffscreenInstance)
                        ) {
                            pendingBoundaries.delete(deletedOffscreenInstance);
                            addMarkerProgressCallbackToPendingTransition(
                                abortedFiber.memoizedProps.name,
                                deletedTransitions,
                                pendingBoundaries
                            );
                        }
                    }
                }
            });
        }
    }
}
function abortParentMarkerTransitionsForDeletedFiber(
    abortedFiber,
    abort,
    deletedTransitions,
    deletedOffscreenInstance,
    isInDeletedTree
) {
    if (enableTransitionTracing) {
        // Find all pending markers that are waiting on child suspense boundaries in the
        // aborted subtree and cancels them
        var fiber = abortedFiber;
        while (fiber !== null) {
            switch (fiber.tag) {
                case TracingMarkerComponent:
                    abortTracingMarkerTransitions(
                        fiber,
                        abort,
                        deletedTransitions,
                        deletedOffscreenInstance,
                        isInDeletedTree
                    );
                    break;
                case HostRoot:
                    var root = fiber.stateNode;
                    abortRootTransitions(
                        root,
                        abort,
                        deletedTransitions,
                        deletedOffscreenInstance,
                        isInDeletedTree
                    );
                    break;
                default:
                    break;
            }
            fiber = fiber.return;
        }
    }
}
function commitTransitionProgress(offscreenFiber) {
    if (enableTransitionTracing) {
        // This function adds suspense boundaries to the root
        // or tracing marker's pendingBoundaries map.
        // When a suspense boundary goes from a resolved to a fallback
        // state we add the boundary to the map, and when it goes from
        // a fallback to a resolved state, we remove the boundary from
        // the map.
        // We use stateNode on the Offscreen component as a stable object
        // that doesnt change from render to render. This way we can
        // distinguish between different Offscreen instances (vs. the same
        // Offscreen instance with different fibers)
        var offscreenInstance = offscreenFiber.stateNode;
        var prevState = null;
        var previousFiber = offscreenFiber.alternate;
        if (previousFiber !== null && previousFiber.memoizedState !== null) {
            prevState = previousFiber.memoizedState;
        }
        var nextState = offscreenFiber.memoizedState;
        var wasHidden = prevState !== null;
        var isHidden = nextState !== null;
        var pendingMarkers = offscreenInstance._pendingMarkers; // If there is a name on the suspense boundary, store that in
        // the pending boundaries.

        var name = null;
        var parent = offscreenFiber.return;
        if (
            parent !== null &&
            parent.tag === SuspenseComponent &&
            parent.memoizedProps.unstable_name
        ) {
            name = parent.memoizedProps.unstable_name;
        }
        if (!wasHidden && isHidden) {
            // The suspense boundaries was just hidden. Add the boundary
            // to the pending boundary set if it's there
            if (pendingMarkers !== null) {
                pendingMarkers.forEach(function (markerInstance) {
                    var pendingBoundaries = markerInstance.pendingBoundaries;
                    var transitions = markerInstance.transitions;
                    var markerName = markerInstance.name;
                    if (
                        pendingBoundaries !== null &&
                        !pendingBoundaries.has(offscreenInstance)
                    ) {
                        pendingBoundaries.set(offscreenInstance, {
                            name: name,
                        });
                        if (transitions !== null) {
                            if (
                                markerInstance.tag ===
                                    TransitionTracingMarker &&
                                markerName !== null
                            ) {
                                addMarkerProgressCallbackToPendingTransition(
                                    markerName,
                                    transitions,
                                    pendingBoundaries
                                );
                            } else if (markerInstance.tag === TransitionRoot) {
                                transitions.forEach(function (transition) {
                                    addTransitionProgressCallbackToPendingTransition(
                                        transition,
                                        pendingBoundaries
                                    );
                                });
                            }
                        }
                    }
                });
            }
        } else if (wasHidden && !isHidden) {
            // The suspense boundary went from hidden to visible. Remove
            // the boundary from the pending suspense boundaries set
            // if it's there
            if (pendingMarkers !== null) {
                pendingMarkers.forEach(function (markerInstance) {
                    var pendingBoundaries = markerInstance.pendingBoundaries;
                    var transitions = markerInstance.transitions;
                    var markerName = markerInstance.name;
                    if (
                        pendingBoundaries !== null &&
                        pendingBoundaries.has(offscreenInstance)
                    ) {
                        pendingBoundaries.delete(offscreenInstance);
                        if (transitions !== null) {
                            if (
                                markerInstance.tag ===
                                    TransitionTracingMarker &&
                                markerName !== null
                            ) {
                                addMarkerProgressCallbackToPendingTransition(
                                    markerName,
                                    transitions,
                                    pendingBoundaries
                                ); // If there are no more unresolved suspense boundaries, the interaction
                                // is considered finished

                                if (pendingBoundaries.size === 0) {
                                    if (markerInstance.aborts === null) {
                                        addMarkerCompleteCallbackToPendingTransition(
                                            markerName,
                                            transitions
                                        );
                                    }
                                    markerInstance.transitions = null;
                                    markerInstance.pendingBoundaries = null;
                                    markerInstance.aborts = null;
                                }
                            } else if (markerInstance.tag === TransitionRoot) {
                                transitions.forEach(function (transition) {
                                    addTransitionProgressCallbackToPendingTransition(
                                        transition,
                                        pendingBoundaries
                                    );
                                });
                            }
                        }
                    }
                });
            }
        }
    }
}
function hideOrUnhideAllChildren(finishedWork, isHidden) {
    // Only hide or unhide the top-most host nodes.
    var hostSubtreeRoot = null;
    if (supportsMutation) {
        // We only have the top Fiber that was inserted but we need to recurse down its
        // children to find all the terminal nodes.
        var node = finishedWork;
        while (true) {
            if (
                node.tag === HostComponent ||
                (enableFloat && supportsResources
                    ? node.tag === HostResource
                    : false) ||
                (enableHostSingletons && supportsSingletons
                    ? node.tag === HostSingleton
                    : false)
            ) {
                if (hostSubtreeRoot === null) {
                    hostSubtreeRoot = node;
                    try {
                        var instance = node.stateNode;
                        if (isHidden) {
                            hideInstance(instance);
                        } else {
                            unhideInstance(node.stateNode, node.memoizedProps);
                        }
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            } else if (node.tag === HostText) {
                if (hostSubtreeRoot === null) {
                    try {
                        var _instance = node.stateNode;
                        if (isHidden) {
                            hideTextInstance(_instance);
                        } else {
                            unhideTextInstance(_instance, node.memoizedProps);
                        }
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            } else if (
                (node.tag === OffscreenComponent ||
                    node.tag === LegacyHiddenComponent) &&
                node.memoizedState !== null &&
                node !== finishedWork
            ) {
                // Found a nested Offscreen component that is hidden.
                // Don't search any deeper. This tree should remain hidden.
            } else if (node.child !== null) {
                node.child.return = node;
                node = node.child;
                continue;
            }
            if (node === finishedWork) {
                return;
            }
            while (node.sibling === null) {
                if (node.return === null || node.return === finishedWork) {
                    return;
                }
                if (hostSubtreeRoot === node) {
                    hostSubtreeRoot = null;
                }
                node = node.return;
            }
            if (hostSubtreeRoot === node) {
                hostSubtreeRoot = null;
            }
            node.sibling.return = node.return;
            node = node.sibling;
        }
    }
}
function commitAttachRef(finishedWork) {
    var ref = finishedWork.ref;
    if (ref !== null) {
        var instance = finishedWork.stateNode;
        var instanceToUse;
        switch (finishedWork.tag) {
            case HostResource:
            case HostSingleton:
            case HostComponent:
                instanceToUse = getPublicInstance(instance);
                break;
            default:
                instanceToUse = instance;
        } // Moved outside to ensure DCE works with this flag

        if (enableScopeAPI && finishedWork.tag === ScopeComponent) {
            instanceToUse = instance;
        }
        if (typeof ref === 'function') {
            if (shouldProfile(finishedWork)) {
                try {
                    startLayoutEffectTimer();
                    finishedWork.refCleanup = ref(instanceToUse);
                } finally {
                    recordLayoutEffectDuration(finishedWork);
                }
            } else {
                finishedWork.refCleanup = ref(instanceToUse);
            }
        } else {
            // $FlowFixMe unable to narrow type to the non-function case

            ref.current = instanceToUse;
        }
    }
}
function detachFiberMutation(fiber) {
    // Cut off the return pointer to disconnect it from the tree.
    // This enables us to detect and warn against state updates on an unmounted component.
    // It also prevents events from bubbling from within disconnected components.
    //
    // Ideally, we should also clear the child pointer of the parent alternate to let this
    // get GC:ed but we don't know which for sure which parent is the current
    // one so we'll settle for GC:ing the subtree of this child.
    // This child itself will be GC:ed when the parent updates the next time.
    //
    // Note that we can't clear child or sibling pointers yet.
    // They're needed for passive effects and for findDOMNode.
    // We defer those fields, and all other cleanup, to the passive phase (see detachFiberAfterEffects).
    //
    // Don't reset the alternate yet, either. We need that so we can detach the
    // alternate's fields in the passive phase. Clearing the return pointer is
    // sufficient for findDOMNode semantics.
    var alternate = fiber.alternate;
    if (alternate !== null) {
        alternate.return = null;
    }
    fiber.return = null;
}
function detachFiberAfterEffects(fiber) {
    var alternate = fiber.alternate;
    if (alternate !== null) {
        fiber.alternate = null;
        detachFiberAfterEffects(alternate);
    } // Note: Defensively using negation instead of < in case
    // `deletedTreeCleanUpLevel` is undefined.

    if (!(deletedTreeCleanUpLevel >= 2)) {
        // This is the default branch (level 0).
        fiber.child = null;
        fiber.deletions = null;
        fiber.dependencies = null;
        fiber.memoizedProps = null;
        fiber.memoizedState = null;
        fiber.pendingProps = null;
        fiber.sibling = null;
        fiber.stateNode = null;
        fiber.updateQueue = null;
    } else {
        // Clear cyclical Fiber fields. This level alone is designed to roughly
        // approximate the planned Fiber refactor. In that world, `setState` will be
        // bound to a special "instance" object instead of a Fiber. The Instance
        // object will not have any of these fields. It will only be connected to
        // the fiber tree via a single link at the root. So if this level alone is
        // sufficient to fix memory issues, that bodes well for our plans.
        fiber.child = null;
        fiber.deletions = null;
        fiber.sibling = null; // The `stateNode` is cyclical because on host nodes it points to the host
        // tree, which has its own pointers to children, parents, and siblings.
        // The other host nodes also point back to fibers, so we should detach that
        // one, too.

        if (fiber.tag === HostComponent) {
            var hostInstance = fiber.stateNode;
            if (hostInstance !== null) {
                detachDeletedInstance(hostInstance);
            }
        }
        fiber.stateNode = null; // I'm intentionally not clearing the `return` field in this level. We
        // already disconnect the `return` pointer at the root of the deleted
        // subtree (in `detachFiberMutation`). Besides, `return` by itself is not
        // cyclical — it's only cyclical when combined with `child`, `sibling`, and
        // `alternate`. But we'll clear it in the next level anyway, just in case.

        if (deletedTreeCleanUpLevel >= 3) {
            // Theoretically, nothing in here should be necessary, because we already
            // disconnected the fiber from the tree. So even if something leaks this
            // particular fiber, it won't leak anything else
            //
            // The purpose of this branch is to be super aggressive so we can measure
            // if there's any difference in memory impact. If there is, that could
            // indicate a React leak we don't know about.
            fiber.return = null;
            fiber.dependencies = null;
            fiber.memoizedProps = null;
            fiber.memoizedState = null;
            fiber.pendingProps = null;
            fiber.stateNode = null; // TODO: Move to `commitPassiveUnmountInsideDeletedTreeOnFiber` instead.

            fiber.updateQueue = null;
        }
    }
}
function emptyPortalContainer(current) {
    if (!supportsPersistence) {
        return;
    }
    var portal = current.stateNode;
    var containerInfo = portal.containerInfo;
    var emptyChildSet = createContainerChildSet(containerInfo);
    replaceContainerChildren(containerInfo, emptyChildSet);
}
function getHostParentFiber(fiber) {
    var parent = fiber.return;
    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
    throw new Error(
        'Expected to find a host parent. This error is likely caused by a bug ' +
            'in React. Please file an issue.'
    );
}
function isHostParent(fiber) {
    return (
        fiber.tag === HostComponent ||
        fiber.tag === HostRoot ||
        (enableFloat && supportsResources
            ? fiber.tag === HostResource
            : false) ||
        (enableHostSingletons && supportsSingletons
            ? fiber.tag === HostSingleton
            : false) ||
        fiber.tag === HostPortal
    );
}
function getHostSibling(fiber) {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    // TODO: Find a more efficient way to do this.
    var node = fiber;
    siblings: while (true) {
        // If we didn't find anything, let's try the next sibling.
        while (node.sibling === null) {
            if (node.return === null || isHostParent(node.return)) {
                // If we pop out of the root or hit the parent the fiber we are the
                // last sibling.
                return null;
            } // $FlowFixMe[incompatible-type] found when upgrading Flow

            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
        while (
            node.tag !== HostComponent &&
            node.tag !== HostText &&
            (!(enableHostSingletons && supportsSingletons)
                ? true
                : node.tag !== HostSingleton) &&
            node.tag !== DehydratedFragment
        ) {
            // If it is not host node and, we might have a host node inside it.
            // Try to search down until we find one.
            if (node.flags & Placement) {
                // If we don't have a child, try the siblings instead.
                continue siblings;
            } // If we don't have a child, try the siblings instead.
            // We also skip portals because they are not part of this host tree.

            if (node.child === null || node.tag === HostPortal) {
                continue siblings;
            } else {
                node.child.return = node;
                node = node.child;
            }
        } // Check if this host node is stable or about to be placed.

        if (!(node.flags & Placement)) {
            // Found it!
            return node.stateNode;
        }
    }
}
function commitPlacement(finishedWork) {
    if (!supportsMutation) {
        return;
    }
    if (enableHostSingletons && supportsSingletons) {
        if (finishedWork.tag === HostSingleton) {
            // Singletons are already in the Host and don't need to be placed
            // Since they operate somewhat like Portals though their children will
            // have Placement and will get placed inside them
            return;
        }
    } // Recursively insert all host nodes into the parent.

    var parentFiber = getHostParentFiber(finishedWork);
    switch (parentFiber.tag) {
        case HostSingleton: {
            if (enableHostSingletons && supportsSingletons) {
                var parent = parentFiber.stateNode;
                var before = getHostSibling(finishedWork); // We only have the top Fiber that was inserted but we need to recurse down its
                // children to find all the terminal nodes.

                insertOrAppendPlacementNode(finishedWork, before, parent);
                break;
            }
        }
        // eslint-disable-next-line no-fallthrough

        case HostComponent: {
            var _parent = parentFiber.stateNode;
            if (parentFiber.flags & ContentReset) {
                // Reset the text content of the parent before doing any insertions
                resetTextContent(_parent); // Clear ContentReset from the effect tag

                parentFiber.flags &= ~ContentReset;
            }
            var _before = getHostSibling(finishedWork); // We only have the top Fiber that was inserted but we need to recurse down its
            // children to find all the terminal nodes.

            insertOrAppendPlacementNode(finishedWork, _before, _parent);
            break;
        }
        case HostRoot:
        case HostPortal: {
            var _parent2 = parentFiber.stateNode.containerInfo;
            var _before2 = getHostSibling(finishedWork);
            insertOrAppendPlacementNodeIntoContainer(
                finishedWork,
                _before2,
                _parent2
            );
            break;
        }
        // eslint-disable-next-line-no-fallthrough

        default:
            throw new Error(
                'Invalid host parent fiber. This error is likely caused by a bug ' +
                    'in React. Please file an issue.'
            );
    }
}
function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === HostComponent || tag === HostText;
    if (isHost) {
        var stateNode = node.stateNode;
        if (before) {
            insertInContainerBefore(parent, stateNode, before);
        } else {
            appendChildToContainer(parent, stateNode);
        }
    } else if (
        tag === HostPortal ||
        (enableHostSingletons && supportsSingletons
            ? tag === HostSingleton
            : false)
    ) {
        // If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
        // If the insertion is a HostSingleton then it will be placed independently
    } else {
        var child = node.child;
        if (child !== null) {
            insertOrAppendPlacementNodeIntoContainer(child, before, parent);
            var sibling = child.sibling;
            while (sibling !== null) {
                insertOrAppendPlacementNodeIntoContainer(
                    sibling,
                    before,
                    parent
                );
                sibling = sibling.sibling;
            }
        }
    }
}
function insertOrAppendPlacementNode(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === HostComponent || tag === HostText;
    if (isHost) {
        var stateNode = node.stateNode;
        if (before) {
            insertBefore(parent, stateNode, before);
        } else {
            appendChild(parent, stateNode);
        }
    } else if (
        tag === HostPortal ||
        (enableHostSingletons && supportsSingletons
            ? tag === HostSingleton
            : false)
    ) {
        // If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
        // If the insertion is a HostSingleton then it will be placed independently
    } else {
        var child = node.child;
        if (child !== null) {
            insertOrAppendPlacementNode(child, before, parent);
            var sibling = child.sibling;
            while (sibling !== null) {
                insertOrAppendPlacementNode(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
} // These are tracked on the stack as we recursively traverse a
// deleted subtree.
// TODO: Update these during the whole mutation phase, not just during
// a deletion.

var hostParent = null;
var hostParentIsContainer = false;
function commitDeletionEffects(root, returnFiber, deletedFiber) {
    if (supportsMutation) {
        // We only have the top Fiber that was deleted but we need to recurse down its
        // children to find all the terminal nodes.
        // Recursively delete all host nodes from the parent, detach refs, clean
        // up mounted layout effects, and call componentWillUnmount.
        // We only need to remove the topmost host child in each branch. But then we
        // still need to keep traversing to unmount effects, refs, and cWU. TODO: We
        // could split this into two separate traversals functions, where the second
        // one doesn't include any removeChild logic. This is maybe the same
        // function as "disappearLayoutEffects" (or whatever that turns into after
        // the layout phase is refactored to use recursion).
        // Before starting, find the nearest host parent on the stack so we know
        // which instance/container to remove the children from.
        // TODO: Instead of searching up the fiber return path on every deletion, we
        // can track the nearest host component on the JS stack as we traverse the
        // tree during the commit phase. This would make insertions faster, too.
        var parent = returnFiber;
        findParent: while (parent !== null) {
            switch (parent.tag) {
                case HostSingleton:
                case HostComponent: {
                    hostParent = parent.stateNode;
                    hostParentIsContainer = false;
                    break findParent;
                }
                case HostRoot: {
                    hostParent = parent.stateNode.containerInfo;
                    hostParentIsContainer = true;
                    break findParent;
                }
                case HostPortal: {
                    hostParent = parent.stateNode.containerInfo;
                    hostParentIsContainer = true;
                    break findParent;
                }
            }
            parent = parent.return;
        }
        if (hostParent === null) {
            throw new Error(
                'Expected to find a host parent. This error is likely caused by ' +
                    'a bug in React. Please file an issue.'
            );
        }
        commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
        hostParent = null;
        hostParentIsContainer = false;
    } else {
        // Detach refs and call componentWillUnmount() on the whole subtree.
        commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
    }
    detachFiberMutation(deletedFiber);
}
function recursivelyTraverseDeletionEffects(
    finishedRoot,
    nearestMountedAncestor,
    parent
) {
    // TODO: Use a static flag to skip trees that don't have unmount effects
    var child = parent.child;
    while (child !== null) {
        commitDeletionEffectsOnFiber(
            finishedRoot,
            nearestMountedAncestor,
            child
        );
        child = child.sibling;
    }
}
function commitDeletionEffectsOnFiber(
    finishedRoot,
    nearestMountedAncestor,
    deletedFiber
) {
    onCommitUnmount(deletedFiber); // The cases in this outer switch modify the stack before they traverse
    // into their subtree. There are simpler cases in the inner switch
    // that don't modify the stack.

    switch (deletedFiber.tag) {
        case HostResource: {
            if (enableFloat && supportsResources) {
                if (!offscreenSubtreeWasHidden) {
                    safelyDetachRef(deletedFiber, nearestMountedAncestor);
                }
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                );
                if (deletedFiber.memoizedState) {
                    releaseResource(deletedFiber.memoizedState);
                }
                return;
            }
        }
        // eslint-disable-next-line no-fallthrough

        case HostSingleton: {
            if (enableHostSingletons && supportsSingletons) {
                if (!offscreenSubtreeWasHidden) {
                    safelyDetachRef(deletedFiber, nearestMountedAncestor);
                }
                var prevHostParent = hostParent;
                var prevHostParentIsContainer = hostParentIsContainer;
                hostParent = deletedFiber.stateNode;
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                ); // Normally this is called in passive unmount effect phase however with
                // HostSingleton we warn if you acquire one that is already associated to
                // a different fiber. To increase our chances of avoiding this, specifically
                // if you keyed a HostSingleton so there will be a delete followed by a Placement
                // we treat detach eagerly here

                releaseSingletonInstance(deletedFiber.stateNode);
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;
                return;
            }
        }
        // eslint-disable-next-line no-fallthrough

        case HostComponent: {
            if (!offscreenSubtreeWasHidden) {
                safelyDetachRef(deletedFiber, nearestMountedAncestor);
            } // Intentional fallthrough to next branch
        }
        // eslint-disable-next-line-no-fallthrough

        case HostText: {
            // We only need to remove the nearest host child. Set the host parent
            // to `null` on the stack to indicate that nested children don't
            // need to be removed.
            if (supportsMutation) {
                var _prevHostParent = hostParent;
                var _prevHostParentIsContainer = hostParentIsContainer;
                hostParent = null;
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                );
                hostParent = _prevHostParent;
                hostParentIsContainer = _prevHostParentIsContainer;
                if (hostParent !== null) {
                    // Now that all the child effects have unmounted, we can remove the
                    // node from the tree.
                    if (hostParentIsContainer) {
                        removeChildFromContainer(
                            hostParent,
                            deletedFiber.stateNode
                        );
                    } else {
                        removeChild(hostParent, deletedFiber.stateNode);
                    }
                }
            } else {
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                );
            }
            return;
        }
        case DehydratedFragment: {
            if (enableSuspenseCallback) {
                var hydrationCallbacks = finishedRoot.hydrationCallbacks;
                if (hydrationCallbacks !== null) {
                    var onDeleted = hydrationCallbacks.onDeleted;
                    if (onDeleted) {
                        onDeleted(deletedFiber.stateNode);
                    }
                }
            } // Dehydrated fragments don't have any children
            // Delete the dehydrated suspense boundary and all of its content.

            if (supportsMutation) {
                if (hostParent !== null) {
                    if (hostParentIsContainer) {
                        clearSuspenseBoundaryFromContainer(
                            hostParent,
                            deletedFiber.stateNode
                        );
                    } else {
                        clearSuspenseBoundary(
                            hostParent,
                            deletedFiber.stateNode
                        );
                    }
                }
            }
            return;
        }
        case HostPortal: {
            if (supportsMutation) {
                // When we go into a portal, it becomes the parent to remove from.
                var _prevHostParent2 = hostParent;
                var _prevHostParentIsContainer2 = hostParentIsContainer;
                hostParent = deletedFiber.stateNode.containerInfo;
                hostParentIsContainer = true;
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                );
                hostParent = _prevHostParent2;
                hostParentIsContainer = _prevHostParentIsContainer2;
            } else {
                emptyPortalContainer(deletedFiber);
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                );
            }
            return;
        }
        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent: {
            if (!offscreenSubtreeWasHidden) {
                var updateQueue = deletedFiber.updateQueue;
                if (updateQueue !== null) {
                    var lastEffect = updateQueue.lastEffect;
                    if (lastEffect !== null) {
                        var firstEffect = lastEffect.next;
                        var effect = firstEffect;
                        do {
                            var _effect = effect,
                                destroy = _effect.destroy,
                                tag = _effect.tag;
                            if (destroy !== undefined) {
                                if ((tag & HookInsertion) !== NoHookEffect) {
                                    safelyCallDestroy(
                                        deletedFiber,
                                        nearestMountedAncestor,
                                        destroy
                                    );
                                } else if (
                                    (tag & HookLayout) !==
                                    NoHookEffect
                                ) {
                                    if (enableSchedulingProfiler) {
                                        markComponentLayoutEffectUnmountStarted(
                                            deletedFiber
                                        );
                                    }
                                    if (shouldProfile(deletedFiber)) {
                                        startLayoutEffectTimer();
                                        safelyCallDestroy(
                                            deletedFiber,
                                            nearestMountedAncestor,
                                            destroy
                                        );
                                        recordLayoutEffectDuration(
                                            deletedFiber
                                        );
                                    } else {
                                        safelyCallDestroy(
                                            deletedFiber,
                                            nearestMountedAncestor,
                                            destroy
                                        );
                                    }
                                    if (enableSchedulingProfiler) {
                                        markComponentLayoutEffectUnmountStopped();
                                    }
                                }
                            }
                            effect = effect.next;
                        } while (effect !== firstEffect);
                    }
                }
            }
            recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
            );
            return;
        }
        case ClassComponent: {
            if (!offscreenSubtreeWasHidden) {
                safelyDetachRef(deletedFiber, nearestMountedAncestor);
                var instance = deletedFiber.stateNode;
                if (typeof instance.componentWillUnmount === 'function') {
                    safelyCallComponentWillUnmount(
                        deletedFiber,
                        nearestMountedAncestor,
                        instance
                    );
                }
            }
            recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
            );
            return;
        }
        case ScopeComponent: {
            if (enableScopeAPI) {
                safelyDetachRef(deletedFiber, nearestMountedAncestor);
            }
            recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
            );
            return;
        }
        case OffscreenComponent: {
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
            if (deletedFiber.mode & ConcurrentMode) {
                // If this offscreen component is hidden, we already unmounted it. Before
                // deleting the children, track that it's already unmounted so that we
                // don't attempt to unmount the effects again.
                // TODO: If the tree is hidden, in most cases we should be able to skip
                // over the nested children entirely. An exception is we haven't yet found
                // the topmost host node to delete, which we already track on the stack.
                // But the other case is portals, which need to be detached no matter how
                // deeply they are nested. We should use a subtree flag to track whether a
                // subtree includes a nested portal.
                var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                offscreenSubtreeWasHidden =
                    prevOffscreenSubtreeWasHidden ||
                    deletedFiber.memoizedState !== null;
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                );
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            } else {
                recursivelyTraverseDeletionEffects(
                    finishedRoot,
                    nearestMountedAncestor,
                    deletedFiber
                );
            }
            break;
        }
        default: {
            recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
            );
            return;
        }
    }
}
function commitSuspenseCallback(finishedWork) {
    // TODO: Move this to passive phase
    var newState = finishedWork.memoizedState;
    if (enableSuspenseCallback && newState !== null) {
        var suspenseCallback = finishedWork.memoizedProps.suspenseCallback;
        if (typeof suspenseCallback === 'function') {
            var wakeables = finishedWork.updateQueue;
            if (wakeables !== null) {
                suspenseCallback(new Set(wakeables));
            }
        } else {
        }
    }
}
function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
    if (!supportsHydration) {
        return;
    }
    var newState = finishedWork.memoizedState;
    if (newState === null) {
        var current = finishedWork.alternate;
        if (current !== null) {
            var prevState = current.memoizedState;
            if (prevState !== null) {
                var suspenseInstance = prevState.dehydrated;
                if (suspenseInstance !== null) {
                    try {
                        commitHydratedSuspenseInstance(suspenseInstance);
                        if (enableSuspenseCallback) {
                            var hydrationCallbacks =
                                finishedRoot.hydrationCallbacks;
                            if (hydrationCallbacks !== null) {
                                var onHydrated = hydrationCallbacks.onHydrated;
                                if (onHydrated) {
                                    onHydrated(suspenseInstance);
                                }
                            }
                        }
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            }
        }
    }
}
function getRetryCache(finishedWork) {
    // TODO: Unify the interface for the retry cache so we don't have to switch
    // on the tag like this.
    switch (finishedWork.tag) {
        case SuspenseComponent:
        case SuspenseListComponent: {
            var retryCache = finishedWork.stateNode;
            if (retryCache === null) {
                retryCache = finishedWork.stateNode = new PossiblyWeakSet();
            }
            return retryCache;
        }
        case OffscreenComponent: {
            var instance = finishedWork.stateNode;
            var _retryCache = instance._retryCache;
            if (_retryCache === null) {
                _retryCache = instance._retryCache = new PossiblyWeakSet();
            }
            return _retryCache;
        }
        default: {
            throw new Error(
                'Unexpected Suspense handler tag (' +
                    finishedWork.tag +
                    '). This is a ' +
                    'bug in React.'
            );
        }
    }
}
export function detachOffscreenInstance(instance) {
    var fiber = instance._current;
    if (fiber === null) {
        throw new Error(
            'Calling Offscreen.detach before instance handle has been set.'
        );
    }
    if ((instance._pendingVisibility & OffscreenDetached) !== NoFlags) {
        // The instance is already detached, this is a noop.
        return;
    } // TODO: There is an opportunity to optimise this by not entering commit phase
    // and unmounting effects directly.

    var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
    if (root !== null) {
        instance._pendingVisibility |= OffscreenDetached;
        scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
    }
}
export function attachOffscreenInstance(instance) {
    var fiber = instance._current;
    if (fiber === null) {
        throw new Error(
            'Calling Offscreen.detach before instance handle has been set.'
        );
    }
    if ((instance._pendingVisibility & OffscreenDetached) === NoFlags) {
        // The instance is already attached, this is a noop.
        return;
    }
    var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
    if (root !== null) {
        instance._pendingVisibility &= ~OffscreenDetached;
        scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
    }
}
function attachSuspenseRetryListeners(finishedWork, wakeables) {
    // If this boundary just timed out, then it will have a set of wakeables.
    // For each wakeable, attach a listener so that when it resolves, React
    // attempts to re-render the boundary in the primary (pre-timeout) state.
    var retryCache = getRetryCache(finishedWork);
    wakeables.forEach(function (wakeable) {
        // Memoize using the boundary fiber to prevent redundant listeners.
        var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
        if (!retryCache.has(wakeable)) {
            retryCache.add(wakeable);
            if (enableUpdaterTracking) {
                if (isDevToolsPresent) {
                    if (inProgressLanes !== null && inProgressRoot !== null) {
                        // If we have pending work still, associate the original updaters with it.
                        restorePendingUpdaters(inProgressRoot, inProgressLanes);
                    } else {
                        throw Error(
                            'Expected finished root and lanes to be set. This is a bug in React.'
                        );
                    }
                }
            }
            wakeable.then(retry, retry);
        }
    });
} // This function detects when a Suspense boundary goes from visible to hidden.
// It returns false if the boundary is already hidden.
// TODO: Use an effect tag.

export function isSuspenseBoundaryBeingHidden(current, finishedWork) {
    if (current !== null) {
        var oldState = current.memoizedState;
        if (oldState === null || oldState.dehydrated !== null) {
            var newState = finishedWork.memoizedState;
            return newState !== null && newState.dehydrated === null;
        }
    }
    return false;
}
export function commitMutationEffects(root, finishedWork, committedLanes) {
    inProgressLanes = committedLanes;
    inProgressRoot = root;
    setCurrentDebugFiberInDEV(finishedWork);
    commitMutationEffectsOnFiber(finishedWork, root, committedLanes);
    setCurrentDebugFiberInDEV(finishedWork);
    inProgressLanes = null;
    inProgressRoot = null;
}
function recursivelyTraverseMutationEffects(root, parentFiber, lanes) {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects hae fired.
    var deletions = parentFiber.deletions;
    if (deletions !== null) {
        for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i];
            try {
                commitDeletionEffects(root, parentFiber, childToDelete);
            } catch (error) {
                captureCommitPhaseError(childToDelete, parentFiber, error);
            }
        }
    }
    var prevDebugFiber = getCurrentDebugFiberInDEV();
    if (parentFiber.subtreeFlags & MutationMask) {
        var child = parentFiber.child;
        while (child !== null) {
            setCurrentDebugFiberInDEV(child);
            commitMutationEffectsOnFiber(child, root, lanes);
            child = child.sibling;
        }
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
    var current = finishedWork.alternate;
    var flags = finishedWork.flags; // The effect flag should be checked *after* we refine the type of fiber,
    // because the fiber tag is more specific. An exception is any flag related
    // to reconciliation, because those can be set on all fiber types.

    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                try {
                    commitHookEffectListUnmount(
                        HookInsertion | HookHasEffect,
                        finishedWork,
                        finishedWork.return
                    );
                    commitHookEffectListMount(
                        HookInsertion | HookHasEffect,
                        finishedWork
                    );
                } catch (error) {
                    captureCommitPhaseError(
                        finishedWork,
                        finishedWork.return,
                        error
                    );
                } // Layout effects are destroyed during the mutation phase so that all
                // destroy functions for all fibers are called before any create functions.
                // This prevents sibling component effects from interfering with each other,
                // e.g. a destroy function in one component should never override a ref set
                // by a create function in another component during the same commit.

                if (shouldProfile(finishedWork)) {
                    try {
                        startLayoutEffectTimer();
                        commitHookEffectListUnmount(
                            HookLayout | HookHasEffect,
                            finishedWork,
                            finishedWork.return
                        );
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                    recordLayoutEffectDuration(finishedWork);
                } else {
                    try {
                        commitHookEffectListUnmount(
                            HookLayout | HookHasEffect,
                            finishedWork,
                            finishedWork.return
                        );
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            }
            return;
        }
        case ClassComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & Ref) {
                if (current !== null) {
                    safelyDetachRef(current, current.return);
                }
            }
            if (flags & Callback && offscreenSubtreeIsHidden) {
                var updateQueue = finishedWork.updateQueue;
                if (updateQueue !== null) {
                    deferHiddenCallbacks(updateQueue);
                }
            }
            return;
        }
        case HostResource: {
            if (enableFloat && supportsResources) {
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
                if (flags & Ref) {
                    if (current !== null) {
                        safelyDetachRef(current, current.return);
                    }
                }
                if (flags & Update) {
                    var newResource = finishedWork.memoizedState;
                    if (current !== null) {
                        var currentResource = current.memoizedState;
                        if (currentResource !== newResource) {
                            releaseResource(currentResource);
                        }
                    }
                    finishedWork.stateNode = newResource
                        ? acquireResource(newResource)
                        : null;
                }
                return;
            }
        }
        // eslint-disable-next-line-no-fallthrough

        case HostSingleton: {
            if (enableHostSingletons && supportsSingletons) {
                if (flags & Update) {
                    var previousWork = finishedWork.alternate;
                    if (previousWork === null) {
                        var singleton = finishedWork.stateNode;
                        var props = finishedWork.memoizedProps; // This was a new mount, we need to clear and set initial properties

                        clearSingleton(singleton);
                        acquireSingletonInstance(
                            finishedWork.type,
                            props,
                            singleton,
                            finishedWork
                        );
                    }
                }
            }
        }
        // eslint-disable-next-line-no-fallthrough

        case HostComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & Ref) {
                if (current !== null) {
                    safelyDetachRef(current, current.return);
                }
            }
            if (supportsMutation) {
                // TODO: ContentReset gets cleared by the children during the commit
                // phase. This is a refactor hazard because it means we must read
                // flags the flags after `commitReconciliationEffects` has already run;
                // the order matters. We should refactor so that ContentReset does not
                // rely on mutating the flag during commit. Like by setting a flag
                // during the render phase instead.
                if (finishedWork.flags & ContentReset) {
                    var instance = finishedWork.stateNode;
                    try {
                        resetTextContent(instance);
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
                if (flags & Update) {
                    var _instance2 = finishedWork.stateNode;
                    if (_instance2 != null) {
                        // Commit the work prepared earlier.
                        var newProps = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
                        // as the newProps. The updatePayload will contain the real change in
                        // this case.

                        var oldProps =
                            current !== null ? current.memoizedProps : newProps;
                        var type = finishedWork.type; // TODO: Type the updateQueue to be specific to host components.

                        var updatePayload = finishedWork.updateQueue;
                        finishedWork.updateQueue = null;
                        if (updatePayload !== null) {
                            try {
                                commitUpdate(
                                    _instance2,
                                    updatePayload,
                                    type,
                                    oldProps,
                                    newProps,
                                    finishedWork
                                );
                            } catch (error) {
                                captureCommitPhaseError(
                                    finishedWork,
                                    finishedWork.return,
                                    error
                                );
                            }
                        }
                    }
                }
            }
            return;
        }
        case HostText: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                if (supportsMutation) {
                    if (finishedWork.stateNode === null) {
                        throw new Error(
                            'This should have a text node initialized. This error is likely ' +
                                'caused by a bug in React. Please file an issue.'
                        );
                    }
                    var textInstance = finishedWork.stateNode;
                    var newText = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
                    // as the newProps. The updatePayload will contain the real change in
                    // this case.

                    var oldText =
                        current !== null ? current.memoizedProps : newText;
                    try {
                        commitTextUpdate(textInstance, oldText, newText);
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            }
            return;
        }
        case HostRoot: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                if (supportsMutation && supportsHydration) {
                    if (current !== null) {
                        var prevRootState = current.memoizedState;
                        if (prevRootState.isDehydrated) {
                            try {
                                commitHydratedContainer(root.containerInfo);
                            } catch (error) {
                                captureCommitPhaseError(
                                    finishedWork,
                                    finishedWork.return,
                                    error
                                );
                            }
                        }
                    }
                }
                if (supportsPersistence) {
                    var containerInfo = root.containerInfo;
                    var pendingChildren = root.pendingChildren;
                    try {
                        replaceContainerChildren(
                            containerInfo,
                            pendingChildren
                        );
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            }
            return;
        }
        case HostPortal: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                if (supportsPersistence) {
                    var portal = finishedWork.stateNode;
                    var _containerInfo = portal.containerInfo;
                    var _pendingChildren = portal.pendingChildren;
                    try {
                        replaceContainerChildren(
                            _containerInfo,
                            _pendingChildren
                        );
                    } catch (error) {
                        captureCommitPhaseError(
                            finishedWork,
                            finishedWork.return,
                            error
                        );
                    }
                }
            }
            return;
        }
        case SuspenseComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            var offscreenFiber = finishedWork.child;
            if (offscreenFiber.flags & Visibility) {
                var newState = offscreenFiber.memoizedState;
                var isHidden = newState !== null;
                if (isHidden) {
                    var wasHidden =
                        offscreenFiber.alternate !== null &&
                        offscreenFiber.alternate.memoizedState !== null;
                    if (!wasHidden) {
                        // TODO: Move to passive phase
                        markCommitTimeOfFallback();
                    }
                }
            }
            if (flags & Update) {
                try {
                    commitSuspenseCallback(finishedWork);
                } catch (error) {
                    captureCommitPhaseError(
                        finishedWork,
                        finishedWork.return,
                        error
                    );
                }
                var wakeables = finishedWork.updateQueue;
                if (wakeables !== null) {
                    finishedWork.updateQueue = null;
                    attachSuspenseRetryListeners(finishedWork, wakeables);
                }
            }
            return;
        }
        case OffscreenComponent: {
            if (flags & Ref) {
                if (current !== null) {
                    safelyDetachRef(current, current.return);
                }
            }
            var _newState = finishedWork.memoizedState;
            var _isHidden = _newState !== null;
            var _wasHidden = current !== null && current.memoizedState !== null;
            if (finishedWork.mode & ConcurrentMode) {
                // Before committing the children, track on the stack whether this
                // offscreen subtree was already hidden, so that we don't unmount the
                // effects again.
                var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
                var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                offscreenSubtreeIsHidden =
                    prevOffscreenSubtreeIsHidden || _isHidden;
                offscreenSubtreeWasHidden =
                    prevOffscreenSubtreeWasHidden || _wasHidden;
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
                offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
            } else {
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            }
            commitReconciliationEffects(finishedWork);
            var offscreenInstance = finishedWork.stateNode; // TODO: Add explicit effect flag to set _current.

            offscreenInstance._current = finishedWork; // Offscreen stores pending changes to visibility in `_pendingVisibility`. This is
            // to support batching of `attach` and `detach` calls.

            offscreenInstance._visibility &= ~OffscreenDetached;
            offscreenInstance._visibility |=
                offscreenInstance._pendingVisibility & OffscreenDetached;
            if (flags & Visibility) {
                // Track the current state on the Offscreen instance so we can
                // read it during an event
                if (_isHidden) {
                    offscreenInstance._visibility &= ~OffscreenVisible;
                } else {
                    offscreenInstance._visibility |= OffscreenVisible;
                }
                if (_isHidden) {
                    var isUpdate = current !== null;
                    var wasHiddenByAncestorOffscreen =
                        offscreenSubtreeIsHidden || offscreenSubtreeWasHidden; // Only trigger disapper layout effects if:
                    //   - This is an update, not first mount.
                    //   - This Offscreen was not hidden before.
                    //   - Ancestor Offscreen was not hidden in previous commit.

                    if (
                        isUpdate &&
                        !_wasHidden &&
                        !wasHiddenByAncestorOffscreen
                    ) {
                        if ((finishedWork.mode & ConcurrentMode) !== NoMode) {
                            // Disappear the layout effects of all the children
                            recursivelyTraverseDisappearLayoutEffects(
                                finishedWork
                            );
                        }
                    }
                } else {
                    if (_wasHidden) {
                        // TODO: Move re-appear call here for symmetry?
                    }
                } // Offscreen with manual mode manages visibility manually.

                if (supportsMutation && !isOffscreenManual(finishedWork)) {
                    // TODO: This needs to run whenever there's an insertion or update
                    // inside a hidden Offscreen tree.
                    hideOrUnhideAllChildren(finishedWork, _isHidden);
                }
            } // TODO: Move to passive phase

            if (flags & Update) {
                var offscreenQueue = finishedWork.updateQueue;
                if (offscreenQueue !== null) {
                    var _wakeables = offscreenQueue.wakeables;
                    if (_wakeables !== null) {
                        offscreenQueue.wakeables = null;
                        attachSuspenseRetryListeners(finishedWork, _wakeables);
                    }
                }
            }
            return;
        }
        case SuspenseListComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                var _wakeables2 = finishedWork.updateQueue;
                if (_wakeables2 !== null) {
                    finishedWork.updateQueue = null;
                    attachSuspenseRetryListeners(finishedWork, _wakeables2);
                }
            }
            return;
        }
        case ScopeComponent: {
            if (enableScopeAPI) {
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                commitReconciliationEffects(finishedWork); // TODO: This is a temporary solution that allowed us to transition away
                // from React Flare on www.

                if (flags & Ref) {
                    if (current !== null) {
                        safelyDetachRef(finishedWork, finishedWork.return);
                    }
                    safelyAttachRef(finishedWork, finishedWork.return);
                }
                if (flags & Update) {
                    var scopeInstance = finishedWork.stateNode;
                    prepareScopeUpdate(scopeInstance, finishedWork);
                }
            }
            return;
        }
        default: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            return;
        }
    }
}
function commitReconciliationEffects(finishedWork) {
    // Placement effects (insertions, reorders) can be scheduled on any fiber
    // type. They needs to happen after the children effects have fired, but
    // before the effects on this fiber have fired.
    var flags = finishedWork.flags;
    if (flags & Placement) {
        try {
            commitPlacement(finishedWork);
        } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
        } // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.

        finishedWork.flags &= ~Placement;
    }
    if (flags & Hydrating) {
        finishedWork.flags &= ~Hydrating;
    }
}
export function commitLayoutEffects(finishedWork, root, committedLanes) {
    inProgressLanes = committedLanes;
    inProgressRoot = root;
    var current = finishedWork.alternate;
    commitLayoutEffectOnFiber(root, current, finishedWork, committedLanes);
    inProgressLanes = null;
    inProgressRoot = null;
}
function recursivelyTraverseLayoutEffects(root, parentFiber, lanes) {
    var prevDebugFiber = getCurrentDebugFiberInDEV();
    if (parentFiber.subtreeFlags & LayoutMask) {
        var child = parentFiber.child;
        while (child !== null) {
            setCurrentDebugFiberInDEV(child);
            var current = child.alternate;
            commitLayoutEffectOnFiber(root, current, child, lanes);
            child = child.sibling;
        }
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
export function disappearLayoutEffects(finishedWork) {
    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent: {
            // TODO (Offscreen) Check: flags & LayoutStatic
            if (shouldProfile(finishedWork)) {
                try {
                    startLayoutEffectTimer();
                    commitHookEffectListUnmount(
                        HookLayout,
                        finishedWork,
                        finishedWork.return
                    );
                } finally {
                    recordLayoutEffectDuration(finishedWork);
                }
            } else {
                commitHookEffectListUnmount(
                    HookLayout,
                    finishedWork,
                    finishedWork.return
                );
            }
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
        case ClassComponent: {
            // TODO (Offscreen) Check: flags & RefStatic
            safelyDetachRef(finishedWork, finishedWork.return);
            var instance = finishedWork.stateNode;
            if (typeof instance.componentWillUnmount === 'function') {
                safelyCallComponentWillUnmount(
                    finishedWork,
                    finishedWork.return,
                    instance
                );
            }
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
        case HostResource:
        case HostSingleton:
        case HostComponent: {
            // TODO (Offscreen) Check: flags & RefStatic
            safelyDetachRef(finishedWork, finishedWork.return);
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
        case OffscreenComponent: {
            // TODO (Offscreen) Check: flags & RefStatic
            safelyDetachRef(finishedWork, finishedWork.return);
            var isHidden = finishedWork.memoizedState !== null;
            if (isHidden) {
                // Nested Offscreen tree is already hidden. Don't disappear
                // its effects.
            } else {
                recursivelyTraverseDisappearLayoutEffects(finishedWork);
            }
            break;
        }
        default: {
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
    }
}
function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
    // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
    var child = parentFiber.child;
    while (child !== null) {
        disappearLayoutEffects(child);
        child = child.sibling;
    }
}
export function reappearLayoutEffects(
    finishedRoot,
    current,
    finishedWork,
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    includeWorkInProgressEffects
) {
    // Turn on layout effects in a tree that previously disappeared.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
            recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
            ); // TODO: Check flags & LayoutStatic

            commitHookLayoutEffects(finishedWork, HookLayout);
            break;
        }
        case ClassComponent: {
            recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
            ); // TODO: Check for LayoutStatic flag

            var instance = finishedWork.stateNode;
            if (typeof instance.componentDidMount === 'function') {
                try {
                    instance.componentDidMount();
                } catch (error) {
                    captureCommitPhaseError(
                        finishedWork,
                        finishedWork.return,
                        error
                    );
                }
            } // Commit any callbacks that would have fired while the component
            // was hidden.

            var updateQueue = finishedWork.updateQueue;
            if (updateQueue !== null) {
                commitHiddenCallbacks(updateQueue, instance);
            } // If this is newly finished work, check for setState callbacks

            if (includeWorkInProgressEffects && flags & Callback) {
                commitClassCallbacks(finishedWork);
            } // TODO: Check flags & RefStatic

            safelyAttachRef(finishedWork, finishedWork.return);
            break;
        }
        // Unlike commitLayoutEffectsOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case HostRoot: {
        //  ...
        // }

        case HostResource:
        case HostSingleton:
        case HostComponent: {
            recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
            ); // Renderers may schedule work to be done after host components are mounted
            // (eg DOM renderer may schedule auto-focus for inputs and form controls).
            // These effects should only be committed when components are first mounted,
            // aka when there is no current/alternate.

            if (
                includeWorkInProgressEffects &&
                current === null &&
                flags & Update
            ) {
                commitHostComponentMount(finishedWork);
            } // TODO: Check flags & Ref

            safelyAttachRef(finishedWork, finishedWork.return);
            break;
        }
        case Profiler: {
            recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
            ); // TODO: Figure out how Profiler updates should work with Offscreen

            if (includeWorkInProgressEffects && flags & Update) {
                commitProfilerUpdate(finishedWork, current);
            }
            break;
        }
        case SuspenseComponent: {
            recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
            ); // TODO: Figure out how Suspense hydration callbacks should work
            // with Offscreen.

            if (includeWorkInProgressEffects && flags & Update) {
                commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            }
            break;
        }
        case OffscreenComponent: {
            var offscreenState = finishedWork.memoizedState;
            var isHidden = offscreenState !== null;
            if (isHidden) {
                // Nested Offscreen tree is still hidden. Don't re-appear its effects.
            } else {
                recursivelyTraverseReappearLayoutEffects(
                    finishedRoot,
                    finishedWork,
                    includeWorkInProgressEffects
                );
            } // TODO: Check flags & Ref

            safelyAttachRef(finishedWork, finishedWork.return);
            break;
        }
        default: {
            recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
            );
            break;
        }
    }
}
function recursivelyTraverseReappearLayoutEffects(
    finishedRoot,
    parentFiber,
    includeWorkInProgressEffects
) {
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    var childShouldIncludeWorkInProgressEffects =
        includeWorkInProgressEffects &&
        (parentFiber.subtreeFlags & LayoutMask) !== NoFlags; // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)

    var prevDebugFiber = getCurrentDebugFiberInDEV();
    var child = parentFiber.child;
    while (child !== null) {
        var current = child.alternate;
        reappearLayoutEffects(
            finishedRoot,
            current,
            child,
            childShouldIncludeWorkInProgressEffects
        );
        child = child.sibling;
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
    if (shouldProfile(finishedWork)) {
        startPassiveEffectTimer();
        try {
            commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
        recordPassiveEffectDuration(finishedWork);
    } else {
        try {
            commitHookEffectListMount(hookFlags, finishedWork);
        } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
    }
}
function commitOffscreenPassiveMountEffects(current, finishedWork, instance) {
    if (enableCache) {
        var previousCache = null;
        if (
            current !== null &&
            current.memoizedState !== null &&
            current.memoizedState.cachePool !== null
        ) {
            previousCache = current.memoizedState.cachePool.pool;
        }
        var nextCache = null;
        if (
            finishedWork.memoizedState !== null &&
            finishedWork.memoizedState.cachePool !== null
        ) {
            nextCache = finishedWork.memoizedState.cachePool.pool;
        } // Retain/release the cache used for pending (suspended) nodes.
        // Note that this is only reached in the non-suspended/visible case:
        // when the content is suspended/hidden, the retain/release occurs
        // via the parent Suspense component (see case above).

        if (nextCache !== previousCache) {
            if (nextCache != null) {
                retainCache(nextCache);
            }
            if (previousCache != null) {
                releaseCache(previousCache);
            }
        }
    }
    if (enableTransitionTracing) {
        // TODO: Pre-rendering should not be counted as part of a transition. We
        // may add separate logs for pre-rendering, but it's not part of the
        // primary metrics.
        var offscreenState = finishedWork.memoizedState;
        var queue = finishedWork.updateQueue;
        var isHidden = offscreenState !== null;
        if (queue !== null) {
            if (isHidden) {
                var transitions = queue.transitions;
                if (transitions !== null) {
                    transitions.forEach(function (transition) {
                        // Add all the transitions saved in the update queue during
                        // the render phase (ie the transitions associated with this boundary)
                        // into the transitions set.
                        if (instance._transitions === null) {
                            instance._transitions = new Set();
                        }
                        instance._transitions.add(transition);
                    });
                }
                var markerInstances = queue.markerInstances;
                if (markerInstances !== null) {
                    markerInstances.forEach(function (markerInstance) {
                        var markerTransitions = markerInstance.transitions; // There should only be a few tracing marker transitions because
                        // they should be only associated with the transition that
                        // caused them

                        if (markerTransitions !== null) {
                            markerTransitions.forEach(function (transition) {
                                if (instance._transitions === null) {
                                    instance._transitions = new Set();
                                } else if (
                                    instance._transitions.has(transition)
                                ) {
                                    if (
                                        markerInstance.pendingBoundaries ===
                                        null
                                    ) {
                                        markerInstance.pendingBoundaries =
                                            new Map();
                                    }
                                    if (instance._pendingMarkers === null) {
                                        instance._pendingMarkers = new Set();
                                    }
                                    instance._pendingMarkers.add(
                                        markerInstance
                                    );
                                }
                            });
                        }
                    });
                }
            }
            finishedWork.updateQueue = null;
        }
        commitTransitionProgress(finishedWork); // TODO: Refactor this into an if/else branch

        if (!isHidden) {
            instance._transitions = null;
            instance._pendingMarkers = null;
        }
    }
}
function commitCachePassiveMountEffect(current, finishedWork) {
    if (enableCache) {
        var previousCache = null;
        if (finishedWork.alternate !== null) {
            previousCache = finishedWork.alternate.memoizedState.cache;
        }
        var nextCache = finishedWork.memoizedState.cache; // Retain/release the cache. In theory the cache component
        // could be "borrowing" a cache instance owned by some parent,
        // in which case we could avoid retaining/releasing. But it
        // is non-trivial to determine when that is the case, so we
        // always retain/release.

        if (nextCache !== previousCache) {
            retainCache(nextCache);
            if (previousCache != null) {
                releaseCache(previousCache);
            }
        }
    }
}
function commitTracingMarkerPassiveMountEffect(finishedWork) {
    // Get the transitions that were initiatized during the render
    // and add a start transition callback for each of them
    // We will only call this on initial mount of the tracing marker
    // only if there are no suspense children
    var instance = finishedWork.stateNode;
    if (instance.transitions !== null && instance.pendingBoundaries === null) {
        addMarkerCompleteCallbackToPendingTransition(
            finishedWork.memoizedProps.name,
            instance.transitions
        );
        instance.transitions = null;
        instance.pendingBoundaries = null;
        instance.aborts = null;
        instance.name = null;
    }
}
export function commitPassiveMountEffects(
    root,
    finishedWork,
    committedLanes,
    committedTransitions
) {
    setCurrentDebugFiberInDEV(finishedWork);
    commitPassiveMountOnFiber(
        root,
        finishedWork,
        committedLanes,
        committedTransitions
    );
    resetCurrentDebugFiberInDEV();
}
function recursivelyTraversePassiveMountEffects(
    root,
    parentFiber,
    committedLanes,
    committedTransitions
) {
    var prevDebugFiber = getCurrentDebugFiberInDEV();
    if (parentFiber.subtreeFlags & PassiveMask) {
        var child = parentFiber.child;
        while (child !== null) {
            setCurrentDebugFiberInDEV(child);
            commitPassiveMountOnFiber(
                root,
                child,
                committedLanes,
                committedTransitions
            );
            child = child.sibling;
        }
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
function commitPassiveMountOnFiber(
    finishedRoot,
    finishedWork,
    committedLanes,
    committedTransitions
) {
    // When updating this function, also update reconnectPassiveEffects, which does
    // most of the same things when an offscreen tree goes from hidden -> visible,
    // or when toggling effects inside a hidden tree.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
            recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
            );
            if (flags & Passive) {
                commitHookPassiveMountEffects(
                    finishedWork,
                    HookPassive | HookHasEffect
                );
            }
            break;
        }
        case HostRoot: {
            recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
            );
            if (flags & Passive) {
                if (enableCache) {
                    var previousCache = null;
                    if (finishedWork.alternate !== null) {
                        previousCache =
                            finishedWork.alternate.memoizedState.cache;
                    }
                    var nextCache = finishedWork.memoizedState.cache; // Retain/release the root cache.
                    // Note that on initial mount, previousCache and nextCache will be the same
                    // and this retain won't occur. To counter this, we instead retain the HostRoot's
                    // initial cache when creating the root itself (see createFiberRoot() in
                    // ReactFiberRoot.js). Subsequent updates that change the cache are reflected
                    // here, such that previous/next caches are retained correctly.

                    if (nextCache !== previousCache) {
                        retainCache(nextCache);
                        if (previousCache != null) {
                            releaseCache(previousCache);
                        }
                    }
                }
                if (enableTransitionTracing) {
                    // Get the transitions that were initiatized during the render
                    // and add a start transition callback for each of them
                    var root = finishedWork.stateNode;
                    var incompleteTransitions = root.incompleteTransitions; // Initial render

                    if (committedTransitions !== null) {
                        committedTransitions.forEach(function (transition) {
                            addTransitionStartCallbackToPendingTransition(
                                transition
                            );
                        });
                        clearTransitionsForLanes(finishedRoot, committedLanes);
                    }
                    incompleteTransitions.forEach(function (
                        markerInstance,
                        transition
                    ) {
                        var pendingBoundaries =
                            markerInstance.pendingBoundaries;
                        if (
                            pendingBoundaries === null ||
                            pendingBoundaries.size === 0
                        ) {
                            if (markerInstance.aborts === null) {
                                addTransitionCompleteCallbackToPendingTransition(
                                    transition
                                );
                            }
                            incompleteTransitions.delete(transition);
                        }
                    });
                    clearTransitionsForLanes(finishedRoot, committedLanes);
                }
            }
            break;
        }
        case LegacyHiddenComponent: {
            if (enableLegacyHidden) {
                recursivelyTraversePassiveMountEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions
                );
                if (flags & Passive) {
                    var current = finishedWork.alternate;
                    var instance = finishedWork.stateNode;
                    commitOffscreenPassiveMountEffects(
                        current,
                        finishedWork,
                        instance
                    );
                }
            }
            break;
        }
        case OffscreenComponent: {
            // TODO: Pass `current` as argument to this function
            var _instance3 = finishedWork.stateNode;
            var nextState = finishedWork.memoizedState;
            var isHidden = nextState !== null;
            if (isHidden) {
                if (_instance3._visibility & OffscreenPassiveEffectsConnected) {
                    // The effects are currently connected. Update them.
                    recursivelyTraversePassiveMountEffects(
                        finishedRoot,
                        finishedWork,
                        committedLanes,
                        committedTransitions
                    );
                } else {
                    if (finishedWork.mode & ConcurrentMode) {
                        // The effects are currently disconnected. Since the tree is hidden,
                        // don't connect them. This also applies to the initial render.
                        if (enableCache || enableTransitionTracing) {
                            // "Atomic" effects are ones that need to fire on every commit,
                            // even during pre-rendering. An example is updating the reference
                            // count on cache instances.
                            recursivelyTraverseAtomicPassiveEffects(
                                finishedRoot,
                                finishedWork,
                                committedLanes,
                                committedTransitions
                            );
                        }
                    } else {
                        // Legacy Mode: Fire the effects even if the tree is hidden.
                        _instance3._visibility |=
                            OffscreenPassiveEffectsConnected;
                        recursivelyTraversePassiveMountEffects(
                            finishedRoot,
                            finishedWork,
                            committedLanes,
                            committedTransitions
                        );
                    }
                }
            } else {
                // Tree is visible
                if (_instance3._visibility & OffscreenPassiveEffectsConnected) {
                    // The effects are currently connected. Update them.
                    recursivelyTraversePassiveMountEffects(
                        finishedRoot,
                        finishedWork,
                        committedLanes,
                        committedTransitions
                    );
                } else {
                    // The effects are currently disconnected. Reconnect them, while also
                    // firing effects inside newly mounted trees. This also applies to
                    // the initial render.
                    _instance3._visibility |= OffscreenPassiveEffectsConnected;
                    var includeWorkInProgressEffects =
                        (finishedWork.subtreeFlags & PassiveMask) !== NoFlags;
                    recursivelyTraverseReconnectPassiveEffects(
                        finishedRoot,
                        finishedWork,
                        committedLanes,
                        committedTransitions,
                        includeWorkInProgressEffects
                    );
                }
            }
            if (flags & Passive) {
                var _current = finishedWork.alternate;
                commitOffscreenPassiveMountEffects(
                    _current,
                    finishedWork,
                    _instance3
                );
            }
            break;
        }
        case CacheComponent: {
            recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
            );
            if (flags & Passive) {
                // TODO: Pass `current` as argument to this function
                var _current2 = finishedWork.alternate;
                commitCachePassiveMountEffect(_current2, finishedWork);
            }
            break;
        }
        case TracingMarkerComponent: {
            if (enableTransitionTracing) {
                recursivelyTraversePassiveMountEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions
                );
                if (flags & Passive) {
                    commitTracingMarkerPassiveMountEffect(finishedWork);
                }
                break;
            } // Intentional fallthrough to next branch
        }
        // eslint-disable-next-line-no-fallthrough

        default: {
            recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
            );
            break;
        }
    }
}
function recursivelyTraverseReconnectPassiveEffects(
    finishedRoot,
    parentFiber,
    committedLanes,
    committedTransitions,
    includeWorkInProgressEffects
) {
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    var childShouldIncludeWorkInProgressEffects =
        includeWorkInProgressEffects &&
        (parentFiber.subtreeFlags & PassiveMask) !== NoFlags; // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)

    var prevDebugFiber = getCurrentDebugFiberInDEV();
    var child = parentFiber.child;
    while (child !== null) {
        reconnectPassiveEffects(
            finishedRoot,
            child,
            committedLanes,
            committedTransitions,
            childShouldIncludeWorkInProgressEffects
        );
        child = child.sibling;
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
export function reconnectPassiveEffects(
    finishedRoot,
    finishedWork,
    committedLanes,
    committedTransitions,
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    includeWorkInProgressEffects
) {
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
            recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
            ); // TODO: Check for PassiveStatic flag

            commitHookPassiveMountEffects(finishedWork, HookPassive);
            break;
        }
        // Unlike commitPassiveMountOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case HostRoot: {
        //  ...
        // }

        case LegacyHiddenComponent: {
            if (enableLegacyHidden) {
                recursivelyTraverseReconnectPassiveEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions,
                    includeWorkInProgressEffects
                );
                if (includeWorkInProgressEffects && flags & Passive) {
                    // TODO: Pass `current` as argument to this function
                    var current = finishedWork.alternate;
                    var instance = finishedWork.stateNode;
                    commitOffscreenPassiveMountEffects(
                        current,
                        finishedWork,
                        instance
                    );
                }
            }
            break;
        }
        case OffscreenComponent: {
            var _instance4 = finishedWork.stateNode;
            var nextState = finishedWork.memoizedState;
            var isHidden = nextState !== null;
            if (isHidden) {
                if (_instance4._visibility & OffscreenPassiveEffectsConnected) {
                    // The effects are currently connected. Update them.
                    recursivelyTraverseReconnectPassiveEffects(
                        finishedRoot,
                        finishedWork,
                        committedLanes,
                        committedTransitions,
                        includeWorkInProgressEffects
                    );
                } else {
                    if (finishedWork.mode & ConcurrentMode) {
                        // The effects are currently disconnected. Since the tree is hidden,
                        // don't connect them. This also applies to the initial render.
                        if (enableCache || enableTransitionTracing) {
                            // "Atomic" effects are ones that need to fire on every commit,
                            // even during pre-rendering. An example is updating the reference
                            // count on cache instances.
                            recursivelyTraverseAtomicPassiveEffects(
                                finishedRoot,
                                finishedWork,
                                committedLanes,
                                committedTransitions
                            );
                        }
                    } else {
                        // Legacy Mode: Fire the effects even if the tree is hidden.
                        _instance4._visibility |=
                            OffscreenPassiveEffectsConnected;
                        recursivelyTraverseReconnectPassiveEffects(
                            finishedRoot,
                            finishedWork,
                            committedLanes,
                            committedTransitions,
                            includeWorkInProgressEffects
                        );
                    }
                }
            } else {
                // Tree is visible
                // Since we're already inside a reconnecting tree, it doesn't matter
                // whether the effects are currently connected. In either case, we'll
                // continue traversing the tree and firing all the effects.
                //
                // We do need to set the "connected" flag on the instance, though.
                _instance4._visibility |= OffscreenPassiveEffectsConnected;
                recursivelyTraverseReconnectPassiveEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions,
                    includeWorkInProgressEffects
                );
            }
            if (includeWorkInProgressEffects && flags & Passive) {
                // TODO: Pass `current` as argument to this function
                var _current3 = finishedWork.alternate;
                commitOffscreenPassiveMountEffects(
                    _current3,
                    finishedWork,
                    _instance4
                );
            }
            break;
        }
        case CacheComponent: {
            recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
            );
            if (includeWorkInProgressEffects && flags & Passive) {
                // TODO: Pass `current` as argument to this function
                var _current4 = finishedWork.alternate;
                commitCachePassiveMountEffect(_current4, finishedWork);
            }
            break;
        }
        case TracingMarkerComponent: {
            if (enableTransitionTracing) {
                recursivelyTraverseReconnectPassiveEffects(
                    finishedRoot,
                    finishedWork,
                    committedLanes,
                    committedTransitions,
                    includeWorkInProgressEffects
                );
                if (includeWorkInProgressEffects && flags & Passive) {
                    commitTracingMarkerPassiveMountEffect(finishedWork);
                }
                break;
            } // Intentional fallthrough to next branch
        }
        // eslint-disable-next-line-no-fallthrough

        default: {
            recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
            );
            break;
        }
    }
}
function recursivelyTraverseAtomicPassiveEffects(
    finishedRoot,
    parentFiber,
    committedLanes,
    committedTransitions
) {
    // "Atomic" effects are ones that need to fire on every commit, even during
    // pre-rendering. We call this function when traversing a hidden tree whose
    // regular effects are currently disconnected.
    var prevDebugFiber = getCurrentDebugFiberInDEV(); // TODO: Add special flag for atomic effects

    if (parentFiber.subtreeFlags & PassiveMask) {
        var child = parentFiber.child;
        while (child !== null) {
            setCurrentDebugFiberInDEV(child);
            commitAtomicPassiveEffects(
                finishedRoot,
                child,
                committedLanes,
                committedTransitions
            );
            child = child.sibling;
        }
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
function commitAtomicPassiveEffects(
    finishedRoot,
    finishedWork,
    committedLanes,
    committedTransitions
) {
    // "Atomic" effects are ones that need to fire on every commit, even during
    // pre-rendering. We call this function when traversing a hidden tree whose
    // regular effects are currently disconnected.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case OffscreenComponent: {
            recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
            );
            if (flags & Passive) {
                // TODO: Pass `current` as argument to this function
                var current = finishedWork.alternate;
                var instance = finishedWork.stateNode;
                commitOffscreenPassiveMountEffects(
                    current,
                    finishedWork,
                    instance
                );
            }
            break;
        }
        case CacheComponent: {
            recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
            );
            if (flags & Passive) {
                // TODO: Pass `current` as argument to this function
                var _current5 = finishedWork.alternate;
                commitCachePassiveMountEffect(_current5, finishedWork);
            }
            break;
        }
        // eslint-disable-next-line-no-fallthrough

        default: {
            recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
            );
            break;
        }
    }
}
export function commitPassiveUnmountEffects(finishedWork) {
    setCurrentDebugFiberInDEV(finishedWork);
    commitPassiveUnmountOnFiber(finishedWork);
    resetCurrentDebugFiberInDEV();
}
function detachAlternateSiblings(parentFiber) {
    if (deletedTreeCleanUpLevel >= 1) {
        // A fiber was deleted from this parent fiber, but it's still part of the
        // previous (alternate) parent fiber's list of children. Because children
        // are a linked list, an earlier sibling that's still alive will be
        // connected to the deleted fiber via its `alternate`:
        //
        //   live fiber --alternate--> previous live fiber --sibling--> deleted
        //   fiber
        //
        // We can't disconnect `alternate` on nodes that haven't been deleted yet,
        // but we can disconnect the `sibling` and `child` pointers.
        var previousFiber = parentFiber.alternate;
        if (previousFiber !== null) {
            var detachedChild = previousFiber.child;
            if (detachedChild !== null) {
                previousFiber.child = null;
                do {
                    // $FlowFixMe[incompatible-use] found when upgrading Flow
                    var detachedSibling = detachedChild.sibling; // $FlowFixMe[incompatible-use] found when upgrading Flow

                    detachedChild.sibling = null;
                    detachedChild = detachedSibling;
                } while (detachedChild !== null);
            }
        }
    }
}
function commitHookPassiveUnmountEffects(
    finishedWork,
    nearestMountedAncestor,
    hookFlags
) {
    if (shouldProfile(finishedWork)) {
        startPassiveEffectTimer();
        commitHookEffectListUnmount(
            hookFlags,
            finishedWork,
            nearestMountedAncestor
        );
        recordPassiveEffectDuration(finishedWork);
    } else {
        commitHookEffectListUnmount(
            hookFlags,
            finishedWork,
            nearestMountedAncestor
        );
    }
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects have fired.
    var deletions = parentFiber.deletions;
    if ((parentFiber.flags & ChildDeletion) !== NoFlags) {
        if (deletions !== null) {
            for (var i = 0; i < deletions.length; i++) {
                var childToDelete = deletions[i]; // TODO: Convert this to use recursion

                nextEffect = childToDelete;
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                    childToDelete,
                    parentFiber
                );
            }
        }
        detachAlternateSiblings(parentFiber);
    }
    var prevDebugFiber = getCurrentDebugFiberInDEV(); // TODO: Split PassiveMask into separate masks for mount and unmount?

    if (parentFiber.subtreeFlags & PassiveMask) {
        var child = parentFiber.child;
        while (child !== null) {
            setCurrentDebugFiberInDEV(child);
            commitPassiveUnmountOnFiber(child);
            child = child.sibling;
        }
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
function commitPassiveUnmountOnFiber(finishedWork) {
    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            if (finishedWork.flags & Passive) {
                commitHookPassiveUnmountEffects(
                    finishedWork,
                    finishedWork.return,
                    HookPassive | HookHasEffect
                );
            }
            break;
        }
        case OffscreenComponent: {
            var instance = finishedWork.stateNode;
            var nextState = finishedWork.memoizedState;
            var isHidden = nextState !== null;
            if (
                isHidden &&
                instance._visibility & OffscreenPassiveEffectsConnected &&
                // For backwards compatibility, don't unmount when a tree suspends. In
                // the future we may change this to unmount after a delay.
                (finishedWork.return === null ||
                    finishedWork.return.tag !== SuspenseComponent)
            ) {
                // The effects are currently connected. Disconnect them.
                // TODO: Add option or heuristic to delay before disconnecting the
                // effects. Then if the tree reappears before the delay has elapsed, we
                // can skip toggling the effects entirely.
                instance._visibility &= ~OffscreenPassiveEffectsConnected;
                recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            } else {
                recursivelyTraversePassiveUnmountEffects(finishedWork);
            }
            break;
        }
        default: {
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
        }
    }
}
function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects have fired.
    var deletions = parentFiber.deletions;
    if ((parentFiber.flags & ChildDeletion) !== NoFlags) {
        if (deletions !== null) {
            for (var i = 0; i < deletions.length; i++) {
                var childToDelete = deletions[i]; // TODO: Convert this to use recursion

                nextEffect = childToDelete;
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                    childToDelete,
                    parentFiber
                );
            }
        }
        detachAlternateSiblings(parentFiber);
    }
    var prevDebugFiber = getCurrentDebugFiberInDEV(); // TODO: Check PassiveStatic flag

    var child = parentFiber.child;
    while (child !== null) {
        setCurrentDebugFiberInDEV(child);
        disconnectPassiveEffect(child);
        child = child.sibling;
    }
    setCurrentDebugFiberInDEV(prevDebugFiber);
}
export function disconnectPassiveEffect(finishedWork) {
    switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
            // TODO: Check PassiveStatic flag
            commitHookPassiveUnmountEffects(
                finishedWork,
                finishedWork.return,
                HookPassive
            ); // When disconnecting passive effects, we fire the effects in the same
            // order as during a deletiong: parent before child

            recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            break;
        }
        case OffscreenComponent: {
            var instance = finishedWork.stateNode;
            if (instance._visibility & OffscreenPassiveEffectsConnected) {
                instance._visibility &= ~OffscreenPassiveEffectsConnected;
                recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            } else {
                // The effects are already disconnected.
            }
            break;
        }
        default: {
            recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            break;
        }
    }
}
function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
    deletedSubtreeRoot,
    nearestMountedAncestor
) {
    while (nextEffect !== null) {
        var fiber = nextEffect; // Deletion effects fire in parent -> child order
        // TODO: Check if fiber has a PassiveStatic flag

        setCurrentDebugFiberInDEV(fiber);
        commitPassiveUnmountInsideDeletedTreeOnFiber(
            fiber,
            nearestMountedAncestor
        );
        resetCurrentDebugFiberInDEV();
        var child = fiber.child; // TODO: Only traverse subtree if it has a PassiveStatic flag. (But, if we
        // do this, still need to handle `deletedTreeCleanUpLevel` correctly.)

        if (child !== null) {
            child.return = fiber;
            nextEffect = child;
        } else {
            commitPassiveUnmountEffectsInsideOfDeletedTree_complete(
                deletedSubtreeRoot
            );
        }
    }
}
function commitPassiveUnmountEffectsInsideOfDeletedTree_complete(
    deletedSubtreeRoot
) {
    while (nextEffect !== null) {
        var fiber = nextEffect;
        var sibling = fiber.sibling;
        var returnFiber = fiber.return;
        if (deletedTreeCleanUpLevel >= 2) {
            // Recursively traverse the entire deleted tree and clean up fiber fields.
            // This is more aggressive than ideal, and the long term goal is to only
            // have to detach the deleted tree at the root.
            detachFiberAfterEffects(fiber);
            if (fiber === deletedSubtreeRoot) {
                nextEffect = null;
                return;
            }
        } else {
            // This is the default branch (level 0). We do not recursively clear all
            // the fiber fields. Only the root of the deleted subtree.
            if (fiber === deletedSubtreeRoot) {
                detachFiberAfterEffects(fiber);
                nextEffect = null;
                return;
            }
        }
        if (sibling !== null) {
            sibling.return = returnFiber;
            nextEffect = sibling;
            return;
        }
        nextEffect = returnFiber;
    }
}
function commitPassiveUnmountInsideDeletedTreeOnFiber(
    current,
    nearestMountedAncestor
) {
    switch (current.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
            commitHookPassiveUnmountEffects(
                current,
                nearestMountedAncestor,
                HookPassive
            );
            break;
        }
        // TODO: run passive unmount effects when unmounting a root.
        // Because passive unmount effects are not currently run,
        // the cache instance owned by the root will never be freed.
        // When effects are run, the cache should be freed here:
        // case HostRoot: {
        //   if (enableCache) {
        //     const cache = current.memoizedState.cache;
        //     releaseCache(cache);
        //   }
        //   break;
        // }

        case LegacyHiddenComponent:
        case OffscreenComponent: {
            if (enableCache) {
                if (
                    current.memoizedState !== null &&
                    current.memoizedState.cachePool !== null
                ) {
                    var cache = current.memoizedState.cachePool.pool; // Retain/release the cache used for pending (suspended) nodes.
                    // Note that this is only reached in the non-suspended/visible case:
                    // when the content is suspended/hidden, the retain/release occurs
                    // via the parent Suspense component (see case above).

                    if (cache != null) {
                        retainCache(cache);
                    }
                }
            }
            break;
        }
        case SuspenseComponent: {
            if (enableTransitionTracing) {
                // We need to mark this fiber's parents as deleted
                var offscreenFiber = current.child;
                var instance = offscreenFiber.stateNode;
                var transitions = instance._transitions;
                if (transitions !== null) {
                    var abortReason = {
                        reason: 'suspense',
                        name: current.memoizedProps.unstable_name || null,
                    };
                    if (
                        current.memoizedState === null ||
                        current.memoizedState.dehydrated === null
                    ) {
                        abortParentMarkerTransitionsForDeletedFiber(
                            offscreenFiber,
                            abortReason,
                            transitions,
                            instance,
                            true
                        );
                        if (nearestMountedAncestor !== null) {
                            abortParentMarkerTransitionsForDeletedFiber(
                                nearestMountedAncestor,
                                abortReason,
                                transitions,
                                instance,
                                false
                            );
                        }
                    }
                }
            }
            break;
        }
        case CacheComponent: {
            if (enableCache) {
                var _cache = current.memoizedState.cache;
                releaseCache(_cache);
            }
            break;
        }
        case TracingMarkerComponent: {
            if (enableTransitionTracing) {
                // We need to mark this fiber's parents as deleted
                var _instance5 = current.stateNode;
                var _transitions = _instance5.transitions;
                if (_transitions !== null) {
                    var _abortReason = {
                        reason: 'marker',
                        name: current.memoizedProps.name,
                    };
                    abortParentMarkerTransitionsForDeletedFiber(
                        current,
                        _abortReason,
                        _transitions,
                        null,
                        true
                    );
                    if (nearestMountedAncestor !== null) {
                        abortParentMarkerTransitionsForDeletedFiber(
                            nearestMountedAncestor,
                            _abortReason,
                            _transitions,
                            null,
                            false
                        );
                    }
                }
            }
            break;
        }
    }
}
function invokeLayoutEffectMountInDEV(fiber) {}
function invokePassiveEffectMountInDEV(fiber) {}
function invokeLayoutEffectUnmountInDEV(fiber) {}
function invokePassiveEffectUnmountInDEV(fiber) {}
export {
    commitPlacement,
    commitAttachRef,
    invokeLayoutEffectMountInDEV,
    invokeLayoutEffectUnmountInDEV,
    invokePassiveEffectMountInDEV,
    invokePassiveEffectUnmountInDEV,
};
