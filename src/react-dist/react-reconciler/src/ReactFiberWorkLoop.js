import { error as _consoleError } from '../../shared/consoleWithStackDev';
import { REACT_STRICT_MODE_TYPE } from '../../shared/ReactSymbols';
import {
    replayFailedUnitOfWorkWithInvokeGuardedCallback,
    enableCreateEventHandleAPI,
    enableProfilerTimer,
    enableProfilerCommitHooks,
    enableProfilerNestedUpdatePhase,
    enableProfilerNestedUpdateScheduledHook,
    deferRenderPhaseUpdateToNextBatch,
    enableDebugTracing,
    enableSchedulingProfiler,
    disableSchedulerTimeoutInWorkLoop,
    skipUnmountedBoundaries,
    enableUpdaterTracking,
    enableCache,
    enableTransitionTracing,
    useModernStrictMode,
} from '../../shared/ReactFeatureFlags';
import ReactSharedInternals from '../../react/src/ReactSharedInternals';
import is from '../../shared/objectIs';
import {
    // Aliased because `act` will override and push to an internal queue
    scheduleCallback as Scheduler_scheduleCallback,
    cancelCallback as Scheduler_cancelCallback,
    shouldYield,
    requestPaint,
    now,
    ImmediatePriority as ImmediateSchedulerPriority,
    UserBlockingPriority as UserBlockingSchedulerPriority,
    NormalPriority as NormalSchedulerPriority,
    IdlePriority as IdleSchedulerPriority,
} from './Scheduler';
import {
    flushSyncCallbacks,
    flushSyncCallbacksOnlyInLegacyMode,
    scheduleSyncCallback,
    scheduleLegacySyncCallback,
} from './ReactFiberSyncTaskQueue';
import {
    logCommitStarted,
    logCommitStopped,
    logLayoutEffectsStarted,
    logLayoutEffectsStopped,
    logPassiveEffectsStarted,
    logPassiveEffectsStopped,
    logRenderStarted,
    logRenderStopped,
} from './DebugTracing';
import {
    resetAfterCommit,
    scheduleTimeout,
    cancelTimeout,
    noTimeout,
    afterActiveInstanceBlur,
    getCurrentEventPriority,
    supportsMicrotasks,
    errorHydratingContainer,
    scheduleMicrotask,
    prepareRendererToRender,
    resetRendererAfterRender,
} from '../../react-dom-bindings/src/client/ReactDOMHostConfig';
import {
    createWorkInProgress,
    assignFiberPropertiesInDEV,
    resetWorkInProgress,
} from './ReactFiber';
import { isRootDehydrated } from './ReactFiberShellHydration';
import { didSuspendOrErrorWhileHydratingDEV } from './ReactFiberHydrationContext';
import {
    NoMode,
    ProfileMode,
    ConcurrentMode,
    StrictLegacyMode,
    StrictEffectsMode,
} from './ReactTypeOfMode';
import {
    HostRoot,
    IndeterminateComponent,
    ClassComponent,
    SuspenseComponent,
    SuspenseListComponent,
    OffscreenComponent,
    FunctionComponent,
    ForwardRef,
    MemoComponent,
    SimpleMemoComponent,
    Profiler,
} from './ReactWorkTags';
import { ConcurrentRoot, LegacyRoot } from './ReactRootTags';
import {
    NoFlags,
    Incomplete,
    StoreConsistency,
    HostEffectMask,
    ForceClientRender,
    BeforeMutationMask,
    MutationMask,
    LayoutMask,
    PassiveMask,
    PlacementDEV,
    Visibility,
    MountPassiveDev,
    MountLayoutDev,
} from './ReactFiberFlags';
import {
    NoLanes,
    NoLane,
    SyncLane,
    NoTimestamp,
    claimNextTransitionLane,
    claimNextRetryLane,
    includesSyncLane,
    isSubsetOfLanes,
    mergeLanes,
    removeLanes,
    pickArbitraryLane,
    includesNonIdleWork,
    includesOnlyRetries,
    includesOnlyTransitions,
    includesBlockingLane,
    includesExpiredLane,
    getNextLanes,
    markStarvedLanesAsExpired,
    getLanesToRetrySynchronouslyOnError,
    getMostRecentEventTime,
    markRootUpdated,
    markRootSuspended as markRootSuspended_dontCallThisOneDirectly,
    markRootPinged,
    markRootEntangled,
    markRootFinished,
    getHighestPriorityLane,
    addFiberToLanesMap,
    movePendingFibersToMemoized,
    addTransitionToLanesMap,
    getTransitionsForLanes,
} from './ReactFiberLane';
import {
    DiscreteEventPriority,
    ContinuousEventPriority,
    DefaultEventPriority,
    IdleEventPriority,
    getCurrentUpdatePriority,
    setCurrentUpdatePriority,
    lowerEventPriority,
    lanesToEventPriority,
} from './ReactEventPriorities';
import { requestCurrentTransition, NoTransition } from './ReactFiberTransition';
import {
    SelectiveHydrationException,
    beginWork as originalBeginWork,
    replayFunctionComponent,
} from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { unwindWork, unwindInterruptedWork } from './ReactFiberUnwindWork';
import {
    throwException,
    createRootErrorUpdate,
    createClassErrorUpdate,
} from './ReactFiberThrow';
import {
    commitBeforeMutationEffects,
    commitLayoutEffects,
    commitMutationEffects,
    commitPassiveEffectDurations,
    commitPassiveMountEffects,
    commitPassiveUnmountEffects,
    disappearLayoutEffects,
    reconnectPassiveEffects,
    reappearLayoutEffects,
    disconnectPassiveEffect,
    reportUncaughtErrorInDEV,
    invokeLayoutEffectMountInDEV,
    invokePassiveEffectMountInDEV,
    invokeLayoutEffectUnmountInDEV,
    invokePassiveEffectUnmountInDEV,
} from './ReactFiberCommitWork';
import { enqueueUpdate } from './ReactFiberClassUpdateQueue';
import { resetContextDependencies } from './ReactFiberNewContext';
import {
    resetHooksAfterThrow,
    resetHooksOnUnwind,
    ContextOnlyDispatcher,
} from './ReactFiberHooks';
import { DefaultCacheDispatcher } from './ReactFiberCache';
import { createCapturedValueAtFiber } from './ReactCapturedValue';
import {
    enqueueConcurrentRenderForLane,
    finishQueueingConcurrentUpdates,
    getConcurrentlyUpdatedLanes,
} from './ReactFiberConcurrentUpdates';
import {
    markNestedUpdateScheduled,
    recordCommitTime,
    resetNestedUpdateFlag,
    startProfilerTimer,
    stopProfilerTimerIfRunningAndRecordDelta,
    syncNestedUpdateFlag,
} from './ReactProfilerTimer'; // DEV stuff

import getComponentNameFromFiber from './getComponentNameFromFiber';
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
import {
    isRendering as ReactCurrentDebugFiberIsRenderingInDEV,
    current as ReactCurrentFiberCurrent,
    resetCurrentFiber as resetCurrentDebugFiberInDEV,
    setCurrentFiber as setCurrentDebugFiberInDEV,
} from './ReactCurrentFiber';
import {
    invokeGuardedCallback,
    hasCaughtError,
    clearCaughtError,
} from '../../shared/ReactErrorUtils';
import {
    isDevToolsPresent,
    markCommitStarted,
    markCommitStopped,
    markComponentRenderStopped,
    markComponentSuspended,
    markComponentErrored,
    markLayoutEffectsStarted,
    markLayoutEffectsStopped,
    markPassiveEffectsStarted,
    markPassiveEffectsStopped,
    markRenderStarted,
    markRenderYielded,
    markRenderStopped,
    onCommitRoot as onCommitRootDevTools,
    onPostCommitRoot as onPostCommitRootDevTools,
} from './ReactFiberDevToolsHook';
import { onCommitRoot as onCommitRootTestSelector } from './ReactTestSelectors';
import { releaseCache } from './ReactFiberCacheComponent';
import {
    isLegacyActEnvironment,
    isConcurrentActEnvironment,
} from './ReactFiberAct';
import { processTransitionCallbacks } from './ReactFiberTracingMarkerComponent';
import {
    SuspenseException,
    getSuspendedThenable,
    isThenableResolved,
} from './ReactFiberThenable';
import { schedulePostPaintCallback } from './ReactPostPaintCallback';
import {
    getSuspenseHandler,
    getShellBoundary,
} from './ReactFiberSuspenseContext';
import { resolveDefaultProps } from './ReactFiberLazyComponent';
var ceil = Math.ceil;
var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
    ReactCurrentCache = ReactSharedInternals.ReactCurrentCache,
    ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner,
    ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig,
    ReactCurrentActQueue = ReactSharedInternals.ReactCurrentActQueue;
export var NoContext = /*             */ 0;
var BatchedContext = /*               */ 1;
export var RenderContext = /*         */ 2;
export var CommitContext = /*         */ 4;
var RootInProgress = 0;
var RootFatalErrored = 1;
var RootErrored = 2;
var RootSuspended = 3;
var RootSuspendedWithDelay = 4;
var RootCompleted = 5;
var RootDidNotComplete = 6; // Describes where we are in the React execution stack

var executionContext = NoContext; // The root we're working on

var workInProgressRoot = null; // The fiber we're working on

var workInProgress = null; // The lanes we're rendering

var workInProgressRootRenderLanes = NoLanes;
var NotSuspended = 0;
var SuspendedOnError = 1;
var SuspendedOnData = 2;
var SuspendedOnImmediate = 3;
var SuspendedOnDeprecatedThrowPromise = 4;
var SuspendedAndReadyToUnwind = 5;
var SuspendedOnHydration = 6; // When this is true, the work-in-progress fiber just suspended (or errored) and
// we've yet to unwind the stack. In some cases, we may yield to the main thread
// after this happens. If the fiber is pinged before we resume, we can retry
// immediately instead of unwinding the stack.

var workInProgressSuspendedReason = NotSuspended;
var workInProgressThrownValue = null; // Whether a ping listener was attached during this render. This is slightly
// different that whether something suspended, because we don't add multiple
// listeners to a promise we've already seen (per root and lane).

var workInProgressRootDidAttachPingListener = false; // A contextual version of workInProgressRootRenderLanes. It is a superset of
// the lanes that we started working on at the root. When we enter a subtree
// that is currently hidden, we add the lanes that would have committed if
// the hidden tree hadn't been deferred. This is modified by the
// HiddenContext module.
//
// Most things in the work loop should deal with workInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with renderLanes.

export var renderLanes = NoLanes; // Whether to root completed, errored, suspended, etc.

var workInProgressRootExitStatus = RootInProgress; // A fatal error, if one is thrown

var workInProgressRootFatalError = null; // The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.

var workInProgressRootSkippedLanes = NoLanes; // Lanes that were updated (in an interleaved event) during this render.

var workInProgressRootInterleavedUpdatedLanes = NoLanes; // Lanes that were updated during the render phase (*not* an interleaved event).

var workInProgressRootRenderPhaseUpdatedLanes = NoLanes; // Lanes that were pinged (in an interleaved event) during this render.

var workInProgressRootPingedLanes = NoLanes; // Errors that are thrown during the render phase.

var workInProgressRootConcurrentErrors = null; // These are errors that we recovered from without surfacing them to the UI.
// We will log them once the tree commits.

var workInProgressRootRecoverableErrors = null; // The most recent time we committed a fallback. This lets us ensure a train
// model where we don't commit new loading states in too quick succession.

var globalMostRecentFallbackTime = 0;
var FALLBACK_THROTTLE_MS = 500; // The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.

var workInProgressRootRenderTargetTime = Infinity; // How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.

var RENDER_TIMEOUT_MS = 500;
var workInProgressTransitions = null;
export function getWorkInProgressTransitions() {
    return workInProgressTransitions;
}
var currentPendingTransitionCallbacks = null;
var currentEndTime = null;
export function addTransitionStartCallbackToPendingTransition(transition) {
    if (enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: [],
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null,
            };
        }
        if (currentPendingTransitionCallbacks.transitionStart === null) {
            currentPendingTransitionCallbacks.transitionStart = [];
        }
        currentPendingTransitionCallbacks.transitionStart.push(transition);
    }
}
export function addMarkerProgressCallbackToPendingTransition(
    markerName,
    transitions,
    pendingBoundaries
) {
    if (enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: new Map(),
                markerIncomplete: null,
                markerComplete: null,
            };
        }
        if (currentPendingTransitionCallbacks.markerProgress === null) {
            currentPendingTransitionCallbacks.markerProgress = new Map();
        }
        currentPendingTransitionCallbacks.markerProgress.set(markerName, {
            pendingBoundaries: pendingBoundaries,
            transitions: transitions,
        });
    }
}
export function addMarkerIncompleteCallbackToPendingTransition(
    markerName,
    transitions,
    aborts
) {
    if (enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: new Map(),
                markerComplete: null,
            };
        }
        if (currentPendingTransitionCallbacks.markerIncomplete === null) {
            currentPendingTransitionCallbacks.markerIncomplete = new Map();
        }
        currentPendingTransitionCallbacks.markerIncomplete.set(markerName, {
            transitions: transitions,
            aborts: aborts,
        });
    }
}
export function addMarkerCompleteCallbackToPendingTransition(
    markerName,
    transitions
) {
    if (enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: new Map(),
            };
        }
        if (currentPendingTransitionCallbacks.markerComplete === null) {
            currentPendingTransitionCallbacks.markerComplete = new Map();
        }
        currentPendingTransitionCallbacks.markerComplete.set(
            markerName,
            transitions
        );
    }
}
export function addTransitionProgressCallbackToPendingTransition(
    transition,
    boundaries
) {
    if (enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: new Map(),
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null,
            };
        }
        if (currentPendingTransitionCallbacks.transitionProgress === null) {
            currentPendingTransitionCallbacks.transitionProgress = new Map();
        }
        currentPendingTransitionCallbacks.transitionProgress.set(
            transition,
            boundaries
        );
    }
}
export function addTransitionCompleteCallbackToPendingTransition(transition) {
    if (enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: [],
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null,
            };
        }
        if (currentPendingTransitionCallbacks.transitionComplete === null) {
            currentPendingTransitionCallbacks.transitionComplete = [];
        }
        currentPendingTransitionCallbacks.transitionComplete.push(transition);
    }
}
function resetRenderTimer() {
    workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS;
}
export function getRenderTargetTime() {
    return workInProgressRootRenderTargetTime;
}
var hasUncaughtError = false;
var firstUncaughtError = null;
var legacyErrorBoundariesThatAlreadyFailed = null; // Only used when enableProfilerNestedUpdateScheduledHook is true;
// to track which root is currently committing layout effects.

var rootCommittingMutationOrLayoutEffects = null;
var rootDoesHavePassiveEffects = false;
var rootWithPendingPassiveEffects = null;
var pendingPassiveEffectsLanes = NoLanes;
var pendingPassiveProfilerEffects = [];
var pendingPassiveEffectsRemainingLanes = NoLanes;
var pendingPassiveTransitions = null; // Use these to prevent an infinite loop of nested updates

var NESTED_UPDATE_LIMIT = 50;
var nestedUpdateCount = 0;
var rootWithNestedUpdates = null;
var isFlushingPassiveEffects = false;
var didScheduleUpdateDuringPassiveEffects = false;
var NESTED_PASSIVE_UPDATE_LIMIT = 50;
var nestedPassiveUpdateCount = 0;
var rootWithPassiveNestedUpdates = null; // If two updates are scheduled within the same event, we should treat their
// event times as simultaneous, even if the actual clock time has advanced
// between the first and second call.

var currentEventTime = NoTimestamp;
var currentEventTransitionLane = NoLanes;
var isRunningInsertionEffect = false;
export function getWorkInProgressRoot() {
    return workInProgressRoot;
}
export function getWorkInProgressRootRenderLanes() {
    return workInProgressRootRenderLanes;
}
export function requestEventTime() {
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        // We're inside React, so it's fine to read the actual time.
        return now();
    } // We're not inside React, so we may be in the middle of a browser event.

    if (currentEventTime !== NoTimestamp) {
        // Use the same start time for all updates until we enter React again.
        return currentEventTime;
    } // This is the first update since React yielded. Compute a new start time.

    currentEventTime = now();
    return currentEventTime;
}
export function getCurrentTime() {
    return now();
}
export function requestUpdateLane(fiber) {
    // Special cases
    var mode = fiber.mode;
    if ((mode & ConcurrentMode) === NoMode) {
        return SyncLane;
    } else if (
        !deferRenderPhaseUpdateToNextBatch &&
        (executionContext & RenderContext) !== NoContext &&
        workInProgressRootRenderLanes !== NoLanes
    ) {
        // This is a render phase update. These are not officially supported. The
        // old behavior is to give this the same "thread" (lanes) as
        // whatever is currently rendering. So if you call `setState` on a component
        // that happens later in the same render, it will flush. Ideally, we want to
        // remove the special case and treat them as if they came from an
        // interleaved event. Regardless, this pattern is not officially supported.
        // This behavior is only a fallback. The flag only exists until we can roll
        // out the setState warning, since existing code might accidentally rely on
        // the current behavior.
        return pickArbitraryLane(workInProgressRootRenderLanes);
    }
    var isTransition = requestCurrentTransition() !== NoTransition;
    if (isTransition) {
        // The algorithm for assigning an update to a lane should be stable for all
        // updates at the same priority within the same event. To do this, the
        // inputs to the algorithm must be the same.
        //
        // The trick we use is to cache the first of each of these inputs within an
        // event. Then reset the cached values once we can be sure the event is
        // over. Our heuristic for that is whenever we enter a concurrent work loop.

        if (currentEventTransitionLane === NoLane) {
            // All transitions within the same event are assigned the same lane.
            currentEventTransitionLane = claimNextTransitionLane();
        }
        return currentEventTransitionLane;
    } // Updates originating inside certain React methods, like flushSync, have
    // their priority set by tracking it with a context variable.
    //
    // The opaque type returned by the host config is internally a lane, so we can
    // use that directly.
    // TODO: Move this type conversion to the event priority module.

    var updateLane = getCurrentUpdatePriority();
    if (updateLane !== NoLane) {
        return updateLane;
    } // This update originated outside React. Ask the host environment for an
    // appropriate priority, based on the type of event.
    //
    // The opaque type returned by the host config is internally a lane, so we can
    // use that directly.
    // TODO: Move this type conversion to the event priority module.

    var eventLane = getCurrentEventPriority();
    return eventLane;
}
function requestRetryLane(fiber) {
    // This is a fork of `requestUpdateLane` designed specifically for Suspense
    // "retries" — a special update that attempts to flip a Suspense boundary
    // from its placeholder state to its primary/resolved state.
    // Special cases
    var mode = fiber.mode;
    if ((mode & ConcurrentMode) === NoMode) {
        return SyncLane;
    }
    return claimNextRetryLane();
}
export function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
    // Check if the work loop is currently suspended and waiting for data to
    // finish loading.

    if (
        workInProgressSuspendedReason === SuspendedOnData &&
        root === workInProgressRoot
    ) {
        // The incoming update might unblock the current render. Interrupt the
        // current attempt and restart from the top.
        prepareFreshStack(root, NoLanes);
        markRootSuspended(root, workInProgressRootRenderLanes);
    } // Mark that the root has a pending update.

    markRootUpdated(root, lane, eventTime);
    if (
        (executionContext & RenderContext) !== NoLanes &&
        root === workInProgressRoot
    ) {
        // This update was dispatched during the render phase. This is a mistake
        // if the update originates from user space (with the exception of local
        // hook updates, which are handled differently and don't reach this
        // function), but there are some internal React features that use this as
        // an implementation detail, like selective hydration.
        warnAboutRenderPhaseUpdatesInDEV(fiber); // Track lanes that were updated during the render phase

        workInProgressRootRenderPhaseUpdatedLanes = mergeLanes(
            workInProgressRootRenderPhaseUpdatedLanes,
            lane
        );
    } else {
        // This is a normal update, scheduled from outside the render phase. For
        // example, during an input event.
        if (enableUpdaterTracking) {
            if (isDevToolsPresent) {
                addFiberToLanesMap(root, fiber, lane);
            }
        }
        warnIfUpdatesNotWrappedWithActDEV(fiber);
        if (enableProfilerTimer && enableProfilerNestedUpdateScheduledHook) {
            if (
                (executionContext & CommitContext) !== NoContext &&
                root === rootCommittingMutationOrLayoutEffects
            ) {
                if (fiber.mode & ProfileMode) {
                    var current = fiber;
                    while (current !== null) {
                        if (current.tag === Profiler) {
                            var _current$memoizedProp = current.memoizedProps,
                                id = _current$memoizedProp.id,
                                onNestedUpdateScheduled =
                                    _current$memoizedProp.onNestedUpdateScheduled;
                            if (typeof onNestedUpdateScheduled === 'function') {
                                onNestedUpdateScheduled(id);
                            }
                        }
                        current = current.return;
                    }
                }
            }
        }
        if (enableTransitionTracing) {
            var transition = ReactCurrentBatchConfig.transition;
            if (transition !== null && transition.name != null) {
                if (transition.startTime === -1) {
                    transition.startTime = now();
                }
                addTransitionToLanesMap(root, transition, lane);
            }
        }
        if (root === workInProgressRoot) {
            // Received an update to a tree that's in the middle of rendering. Mark
            // that there was an interleaved update work on this root. Unless the
            // `deferRenderPhaseUpdateToNextBatch` flag is off and this is a render
            // phase update. In that case, we don't treat render phase updates as if
            // they were interleaved, for backwards compat reasons.
            if (
                deferRenderPhaseUpdateToNextBatch ||
                (executionContext & RenderContext) === NoContext
            ) {
                workInProgressRootInterleavedUpdatedLanes = mergeLanes(
                    workInProgressRootInterleavedUpdatedLanes,
                    lane
                );
            }
            if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
                // The root already suspended with a delay, which means this render
                // definitely won't finish. Since we have a new update, let's mark it as
                // suspended now, right before marking the incoming update. This has the
                // effect of interrupting the current render and switching to the update.
                // TODO: Make sure this doesn't override pings that happen while we've
                // already started rendering.
                markRootSuspended(root, workInProgressRootRenderLanes);
            }
        }
        ensureRootIsScheduled(root, eventTime);
        if (
            lane === SyncLane &&
            executionContext === NoContext &&
            (fiber.mode & ConcurrentMode) === NoMode &&
            // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
            !(false && ReactCurrentActQueue.isBatchingLegacy)
        ) {
            // Flush the synchronous work now, unless we're already working or inside
            // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
            // scheduleCallbackForFiber to preserve the ability to schedule a callback
            // without immediately flushing it. We only do this for user-initiated
            // updates, to preserve historical behavior of legacy mode.
            resetRenderTimer();
            flushSyncCallbacksOnlyInLegacyMode();
        }
    }
}
export function scheduleInitialHydrationOnRoot(root, lane, eventTime) {
    // This is a special fork of scheduleUpdateOnFiber that is only used to
    // schedule the initial hydration of a root that has just been created. Most
    // of the stuff in scheduleUpdateOnFiber can be skipped.
    //
    // The main reason for this separate path, though, is to distinguish the
    // initial children from subsequent updates. In fully client-rendered roots
    // (createRoot instead of hydrateRoot), all top-level renders are modeled as
    // updates, but hydration roots are special because the initial render must
    // match what was rendered on the server.
    var current = root.current;
    current.lanes = lane;
    markRootUpdated(root, lane, eventTime);
    ensureRootIsScheduled(root, eventTime);
}
export function isUnsafeClassRenderPhaseUpdate(fiber) {
    // Check if this is a render phase update. Only called by class components,
    // which special (deprecated) behavior for UNSAFE_componentWillReceive props.
    return (
        // TODO: Remove outdated deferRenderPhaseUpdateToNextBatch experiment. We
        // decided not to enable it.
        (!deferRenderPhaseUpdateToNextBatch ||
            (fiber.mode & ConcurrentMode) === NoMode) &&
        (executionContext & RenderContext) !== NoContext
    );
} // Use this function to schedule a task for a root. There's only one task per
// root; if a task was already scheduled, we'll check to make sure the priority
// of the existing task is the same as the priority of the next level that the
// root has work on. This function is called on every update, and right before
// exiting a task.

function ensureRootIsScheduled(root, currentTime) {
    var existingCallbackNode = root.callbackNode; // Check if any lanes are being starved by other work. If so, mark them as
    // expired so we know to work on those next.

    markStarvedLanesAsExpired(root, currentTime); // Determine the next lanes to work on, and their priority.

    var nextLanes = getNextLanes(
        root,
        root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
    );
    if (nextLanes === NoLanes) {
        // Special case: There's nothing to work on.
        if (existingCallbackNode !== null) {
            cancelCallback(existingCallbackNode);
        }
        root.callbackNode = null;
        root.callbackPriority = NoLane;
        return;
    } // We use the highest priority lane to represent the priority of the callback.

    var newCallbackPriority = getHighestPriorityLane(nextLanes); // Check if there's an existing task. We may be able to reuse it.

    var existingCallbackPriority = root.callbackPriority;
    if (
        existingCallbackPriority === newCallbackPriority &&
        // Special case related to `act`. If the currently scheduled task is a
        // Scheduler task, rather than an `act` task, cancel it and re-scheduled
        // on the `act` queue.
        !(
            false &&
            ReactCurrentActQueue.current !== null &&
            existingCallbackNode !== fakeActCallbackNode
        )
    ) {
        // The priority hasn't changed. We can reuse the existing task. Exit.

        return;
    }
    if (existingCallbackNode != null) {
        // Cancel the existing callback. We'll schedule a new one below.
        cancelCallback(existingCallbackNode);
    } // Schedule a new callback.

    var newCallbackNode;
    if (includesSyncLane(newCallbackPriority)) {
        // Special case: Sync React callbacks are scheduled on a special
        // internal queue
        if (root.tag === LegacyRoot) {
            scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root));
        } else {
            scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
        }
        if (supportsMicrotasks) {
            // Flush the queue in a microtask.

            {
                scheduleMicrotask(function () {
                    // In Safari, appending an iframe forces microtasks to run.
                    // https://github.com/facebook/react/issues/22459
                    // We don't support running callbacks in the middle of render
                    // or commit so we need to check against that.
                    if (
                        (executionContext & (RenderContext | CommitContext)) ===
                        NoContext
                    ) {
                        // Note that this would still prematurely flush the callbacks
                        // if this happens outside render or commit phase (e.g. in an event).
                        flushSyncCallbacks();
                    }
                });
            }
        } else {
            // Flush the queue in an Immediate task.
            scheduleCallback(ImmediateSchedulerPriority, flushSyncCallbacks);
        }
        newCallbackNode = null;
    } else {
        var schedulerPriorityLevel;
        switch (lanesToEventPriority(nextLanes)) {
            case DiscreteEventPriority:
                schedulerPriorityLevel = ImmediateSchedulerPriority;
                break;
            case ContinuousEventPriority:
                schedulerPriorityLevel = UserBlockingSchedulerPriority;
                break;
            case DefaultEventPriority:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;
            case IdleEventPriority:
                schedulerPriorityLevel = IdleSchedulerPriority;
                break;
            default:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;
        }
        newCallbackNode = scheduleCallback(
            schedulerPriorityLevel,
            performConcurrentWorkOnRoot.bind(null, root)
        );
    }
    root.callbackPriority = newCallbackPriority;
    root.callbackNode = newCallbackNode;
} // This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.

function performConcurrentWorkOnRoot(root, didTimeout) {
    if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
        resetNestedUpdateFlag();
    } // Since we know we're in a React event, we can clear the current
    // event time. The next update will compute a new event time.

    currentEventTime = NoTimestamp;
    currentEventTransitionLane = NoLanes;
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error('Should not already be working.');
    } // Flush any pending passive effects before deciding which lanes to work on,
    // in case they schedule additional work.

    var originalCallbackNode = root.callbackNode;
    var didFlushPassiveEffects = flushPassiveEffects();  // flush是冲洗冲刷的意思
    if (didFlushPassiveEffects) {
        // Something in the passive effect phase may have canceled the current task.
        // Check if the task node for this root was changed.
        if (root.callbackNode !== originalCallbackNode) {
            // The current task was canceled. Exit. We don't need to call
            // `ensureRootIsScheduled` because the check above implies either that
            // there's a new task, or that there's no remaining work on this root.
            return null;
        } else {
            // Current task was not canceled. Continue.
        }
    } // Determine the next lanes to work on, using the fields stored
    // on the root.

    var lanes = getNextLanes(
        root,
        root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
    );
    if (lanes === NoLanes) {
        // Defensive coding. This is never expected to happen.
        return null;
    } // We disable time-slicing in some cases: if the work has been CPU-bound
    // for too long ("expired" work, to prevent starvation), or we're in
    // sync-updates-by-default mode.
    // TODO: We only check `didTimeout` defensively, to account for a Scheduler
    // bug we're still investigating. Once the bug in Scheduler is fixed,
    // we can remove this, since we track expiration ourselves.

    var shouldTimeSlice =
        !includesBlockingLane(root, lanes) &&
        !includesExpiredLane(root, lanes) &&
        (disableSchedulerTimeoutInWorkLoop || !didTimeout);
    var exitStatus = shouldTimeSlice
        ? renderRootConcurrent(root, lanes)
        : renderRootSync(root, lanes);
    if (exitStatus !== RootInProgress) {
        if (exitStatus === RootErrored) {
            // If something threw an error, try rendering one more time. We'll
            // render synchronously to block concurrent data mutations, and we'll
            // includes all pending updates are included. If it still fails after
            // the second attempt, we'll give up and commit the resulting tree.
            var originallyAttemptedLanes = lanes;
            var errorRetryLanes = getLanesToRetrySynchronouslyOnError(
                root,
                originallyAttemptedLanes
            );
            if (errorRetryLanes !== NoLanes) {
                lanes = errorRetryLanes;
                exitStatus = recoverFromConcurrentError(
                    root,
                    originallyAttemptedLanes,
                    errorRetryLanes
                );
            }
        }
        if (exitStatus === RootFatalErrored) {
            var fatalError = workInProgressRootFatalError;
            prepareFreshStack(root, NoLanes);
            markRootSuspended(root, lanes);
            ensureRootIsScheduled(root, now());
            throw fatalError;
        }
        if (exitStatus === RootDidNotComplete) {
            // The render unwound without completing the tree. This happens in special
            // cases where need to exit the current render without producing a
            // consistent tree or committing.
            markRootSuspended(root, lanes);
        } else {
            // The render completed.
            // Check if this render may have yielded to a concurrent event, and if so,
            // confirm that any newly rendered stores are consistent.
            // TODO: It's possible that even a concurrent render may never have yielded
            // to the main thread, if it was fast enough, or if it expired. We could
            // skip the consistency check in that case, too.
            var renderWasConcurrent = !includesBlockingLane(root, lanes);
            var finishedWork = root.current.alternate;
            if (
                renderWasConcurrent &&
                !isRenderConsistentWithExternalStores(finishedWork)
            ) {
                // A store was mutated in an interleaved event. Render again,
                // synchronously, to block further mutations.
                exitStatus = renderRootSync(root, lanes); // We need to check again if something threw

                if (exitStatus === RootErrored) {
                    var _originallyAttemptedLanes = lanes;
                    var _errorRetryLanes = getLanesToRetrySynchronouslyOnError(
                        root,
                        _originallyAttemptedLanes
                    );
                    if (_errorRetryLanes !== NoLanes) {
                        lanes = _errorRetryLanes;
                        exitStatus = recoverFromConcurrentError(
                            root,
                            _originallyAttemptedLanes,
                            _errorRetryLanes
                        ); // We assume the tree is now consistent because we didn't yield to any
                        // concurrent events.
                    }
                }

                if (exitStatus === RootFatalErrored) {
                    var _fatalError = workInProgressRootFatalError;
                    prepareFreshStack(root, NoLanes);
                    markRootSuspended(root, lanes);
                    ensureRootIsScheduled(root, now());
                    throw _fatalError;
                } // FIXME: Need to check for RootDidNotComplete again. The factoring here
                // isn't ideal.
            } // We now have a consistent tree. The next step is either to commit it,
            // or, if something suspended, wait to commit it after a timeout.

            root.finishedWork = finishedWork;
            root.finishedLanes = lanes;
            finishConcurrentRender(root, exitStatus, lanes);
        }
    }
    ensureRootIsScheduled(root, now());
    if (root.callbackNode === originalCallbackNode) {
        // The task node scheduled for this root is the same one that's
        // currently executed. Need to return a continuation.
        if (
            workInProgressSuspendedReason === SuspendedOnData &&
            workInProgressRoot === root
        ) {
            // Special case: The work loop is currently suspended and waiting for
            // data to resolve. Unschedule the current task.
            //
            // TODO: The factoring is a little weird. Arguably this should be checked
            // in ensureRootIsScheduled instead. I went back and forth, not totally
            // sure yet.
            root.callbackPriority = NoLane;
            root.callbackNode = null;
            return null;
        }
        return performConcurrentWorkOnRoot.bind(null, root);
    }
    return null;
}
function recoverFromConcurrentError(
    root,
    originallyAttemptedLanes,
    errorRetryLanes
) {
    // If an error occurred during hydration, discard server response and fall
    // back to client side render.
    // Before rendering again, save the errors from the previous attempt.
    var errorsFromFirstAttempt = workInProgressRootConcurrentErrors;
    var wasRootDehydrated = isRootDehydrated(root);
    if (wasRootDehydrated) {
        // The shell failed to hydrate. Set a flag to force a client rendering
        // during the next attempt. To do this, we call prepareFreshStack now
        // to create the root work-in-progress fiber. This is a bit weird in terms
        // of factoring, because it relies on renderRootSync not calling
        // prepareFreshStack again in the call below, which happens because the
        // root and lanes haven't changed.
        //
        // TODO: I think what we should do is set ForceClientRender inside
        // throwException, like we do for nested Suspense boundaries. The reason
        // it's here instead is so we can switch to the synchronous work loop, too.
        // Something to consider for a future refactor.
        var rootWorkInProgress = prepareFreshStack(root, errorRetryLanes);
        rootWorkInProgress.flags |= ForceClientRender;
    }
    var exitStatus = renderRootSync(root, errorRetryLanes);
    if (exitStatus !== RootErrored) {
        // Successfully finished rendering on retry
        if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
            // During the synchronous render, we attached additional ping listeners.
            // This is highly suggestive of an uncached promise (though it's not the
            // only reason this would happen). If it was an uncached promise, then
            // it may have masked a downstream error from ocurring without actually
            // fixing it. Example:
            //
            //    use(Promise.resolve('uncached'))
            //    throw new Error('Oops!')
            //
            // When this happens, there's a conflict between blocking potential
            // concurrent data races and unwrapping uncached promise values. We
            // have to choose one or the other. Because the data race recovery is
            // a last ditch effort, we'll disable it.
            root.errorRecoveryDisabledLanes = mergeLanes(
                root.errorRecoveryDisabledLanes,
                originallyAttemptedLanes
            ); // Mark the current render as suspended and force it to restart. Once
            // these lanes finish successfully, we'll re-enable the error recovery
            // mechanism for subsequent updates.

            workInProgressRootInterleavedUpdatedLanes |=
                originallyAttemptedLanes;
            return RootSuspendedWithDelay;
        } // The errors from the failed first attempt have been recovered. Add
        // them to the collection of recoverable errors. We'll log them in the
        // commit phase.

        var errorsFromSecondAttempt = workInProgressRootRecoverableErrors;
        workInProgressRootRecoverableErrors = errorsFromFirstAttempt; // The errors from the second attempt should be queued after the errors
        // from the first attempt, to preserve the causal sequence.

        if (errorsFromSecondAttempt !== null) {
            queueRecoverableErrors(errorsFromSecondAttempt);
        }
    } else {
        // The UI failed to recover.
    }
    return exitStatus;
}
export function queueRecoverableErrors(errors) {
    if (workInProgressRootRecoverableErrors === null) {
        workInProgressRootRecoverableErrors = errors;
    } else {
        // $FlowFixMe[method-unbinding]
        workInProgressRootRecoverableErrors.push.apply(
            workInProgressRootRecoverableErrors,
            errors
        );
    }
}
function finishConcurrentRender(root, exitStatus, lanes) {
    switch (exitStatus) {
        case RootInProgress:
        case RootFatalErrored: {
            throw new Error('Root did not complete. This is a bug in React.');
        }
        // Flow knows about invariant, so it complains if I add a break
        // statement, but eslint doesn't know about invariant, so it complains
        // if I do. eslint-disable-next-line no-fallthrough

        case RootErrored: {
            // We should have already attempted to retry this tree. If we reached
            // this point, it errored again. Commit it.
            commitRoot(
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
            );
            break;
        }
        case RootSuspended: {
            markRootSuspended(root, lanes); // We have an acceptable loading state. We need to figure out if we
            // should immediately commit it or wait a bit.

            if (
                includesOnlyRetries(lanes) &&
                // do not delay if we're inside an act() scope
                !shouldForceFlushFallbacksInDEV()
            ) {
                // This render only included retries, no updates. Throttle committing
                // retries so that we don't show too many loading states too quickly.
                var msUntilTimeout =
                    globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now(); // Don't bother with a very short suspense time.

                if (msUntilTimeout > 10) {
                    var nextLanes = getNextLanes(root, NoLanes);
                    if (nextLanes !== NoLanes) {
                        // There's additional work on this root.
                        break;
                    } // The render is suspended, it hasn't timed out, and there's no
                    // lower priority work to do. Instead of committing the fallback
                    // immediately, wait for more data to arrive.

                    root.timeoutHandle = scheduleTimeout(
                        commitRoot.bind(
                            null,
                            root,
                            workInProgressRootRecoverableErrors,
                            workInProgressTransitions
                        ),
                        msUntilTimeout
                    );
                    break;
                }
            } // The work expired. Commit immediately.

            commitRoot(
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
            );
            break;
        }
        case RootSuspendedWithDelay: {
            markRootSuspended(root, lanes);
            if (includesOnlyTransitions(lanes)) {
                // This is a transition, so we should exit without committing a
                // placeholder and without scheduling a timeout. Delay indefinitely
                // until we receive more data.
                break;
            }
            if (!shouldForceFlushFallbacksInDEV()) {
                // This is not a transition, but we did trigger an avoided state.
                // Schedule a placeholder to display after a short delay, using the Just
                // Noticeable Difference.
                // TODO: Is the JND optimization worth the added complexity? If this is
                // the only reason we track the event time, then probably not.
                // Consider removing.
                var mostRecentEventTime = getMostRecentEventTime(root, lanes);
                var eventTimeMs = mostRecentEventTime;
                var timeElapsedMs = now() - eventTimeMs;
                var _msUntilTimeout = jnd(timeElapsedMs) - timeElapsedMs; // Don't bother with a very short suspense time.

                if (_msUntilTimeout > 10) {
                    // Instead of committing the fallback immediately, wait for more data
                    // to arrive.
                    root.timeoutHandle = scheduleTimeout(
                        commitRoot.bind(
                            null,
                            root,
                            workInProgressRootRecoverableErrors,
                            workInProgressTransitions
                        ),
                        _msUntilTimeout
                    );
                    break;
                }
            } // Commit the placeholder.

            commitRoot(
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
            );
            break;
        }
        case RootCompleted: {
            // The work completed. Ready to commit.
            commitRoot(
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
            );
            break;
        }
        default: {
            throw new Error('Unknown root exit status.');
        }
    }
}
function isRenderConsistentWithExternalStores(finishedWork) {
    // Search the rendered tree for external store reads, and check whether the
    // stores were mutated in a concurrent event. Intentionally using an iterative
    // loop instead of recursion so we can exit early.
    var node = finishedWork;
    while (true) {
        if (node.flags & StoreConsistency) {
            var updateQueue = node.updateQueue;
            if (updateQueue !== null) {
                var checks = updateQueue.stores;
                if (checks !== null) {
                    for (var i = 0; i < checks.length; i++) {
                        var check = checks[i];
                        var getSnapshot = check.getSnapshot;
                        var renderedValue = check.value;
                        try {
                            if (!is(getSnapshot(), renderedValue)) {
                                // Found an inconsistent store.
                                return false;
                            }
                        } catch (error) {
                            // If `getSnapshot` throws, return `false`. This will schedule
                            // a re-render, and the error will be rethrown during render.
                            return false;
                        }
                    }
                }
            }
        }
        var child = node.child;
        if (node.subtreeFlags & StoreConsistency && child !== null) {
            child.return = node;
            node = child;
            continue;
        }
        if (node === finishedWork) {
            return true;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === finishedWork) {
                return true;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    } // Flow doesn't know this is unreachable, but eslint does
    // eslint-disable-next-line no-unreachable

    return true;
}
function markRootSuspended(root, suspendedLanes) {
    // When suspending, we should always exclude lanes that were pinged or (more
    // rarely, since we try to avoid it) updated during the render phase.
    // TODO: Lol maybe there's a better way to factor this besides this
    // obnoxiously named function :)
    suspendedLanes = removeLanes(suspendedLanes, workInProgressRootPingedLanes);
    suspendedLanes = removeLanes(
        suspendedLanes,
        workInProgressRootInterleavedUpdatedLanes
    );
    markRootSuspended_dontCallThisOneDirectly(root, suspendedLanes);
} // This is the entry point for synchronous tasks that don't go
// through Scheduler

function performSyncWorkOnRoot(root) {
    if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
        syncNestedUpdateFlag();
    }
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error('Should not already be working.');
    }
    flushPassiveEffects();
    var lanes = getNextLanes(root, NoLanes);
    if (!includesSyncLane(lanes)) {
        // There's no remaining sync work left.
        ensureRootIsScheduled(root, now());
        return null;
    }
    var exitStatus = renderRootSync(root, lanes);
    if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
        // If something threw an error, try rendering one more time. We'll render
        // synchronously to block concurrent data mutations, and we'll includes
        // all pending updates are included. If it still fails after the second
        // attempt, we'll give up and commit the resulting tree.
        var originallyAttemptedLanes = lanes;
        var errorRetryLanes = getLanesToRetrySynchronouslyOnError(
            root,
            originallyAttemptedLanes
        );
        if (errorRetryLanes !== NoLanes) {
            lanes = errorRetryLanes;
            exitStatus = recoverFromConcurrentError(
                root,
                originallyAttemptedLanes,
                errorRetryLanes
            );
        }
    }
    if (exitStatus === RootFatalErrored) {
        var fatalError = workInProgressRootFatalError;
        prepareFreshStack(root, NoLanes);
        markRootSuspended(root, lanes);
        ensureRootIsScheduled(root, now());
        throw fatalError;
    }
    if (exitStatus === RootDidNotComplete) {
        // The render unwound without completing the tree. This happens in special
        // cases where need to exit the current render without producing a
        // consistent tree or committing.
        markRootSuspended(root, lanes);
        ensureRootIsScheduled(root, now());
        return null;
    } // We now have a consistent tree. Because this is a sync render, we
    // will commit it even if something suspended.

    var finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    root.finishedLanes = lanes;
    commitRoot(
        root,
        workInProgressRootRecoverableErrors,
        workInProgressTransitions
    ); // Before exiting, make sure there's a callback scheduled for the next
    // pending level.

    ensureRootIsScheduled(root, now());
    return null;
}
export function flushRoot(root, lanes) {
    if (lanes !== NoLanes) {
        markRootEntangled(root, mergeLanes(lanes, SyncLane));
        ensureRootIsScheduled(root, now());
        if (
            (executionContext & (RenderContext | CommitContext)) ===
            NoContext
        ) {
            resetRenderTimer();
            flushSyncCallbacks();
        }
    }
}
export function getExecutionContext() {
    return executionContext;
}
export function deferredUpdates(fn) {
    var previousPriority = getCurrentUpdatePriority();
    var prevTransition = ReactCurrentBatchConfig.transition;
    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority(DefaultEventPriority);
        return fn();
    } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}
export function batchedUpdates(fn, a) {
    var prevExecutionContext = executionContext;
    executionContext |= BatchedContext;
    try {
        return fn(a);
    } finally {
        executionContext = prevExecutionContext; // If there were legacy sync updates, flush them at the end of the outer
        // most batchedUpdates-like method.

        if (
            executionContext === NoContext &&
            // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
            !(false && ReactCurrentActQueue.isBatchingLegacy)
        ) {
            resetRenderTimer();
            flushSyncCallbacksOnlyInLegacyMode();
        }
    }
}
export function discreteUpdates(fn, a, b, c, d) {
    var previousPriority = getCurrentUpdatePriority();
    var prevTransition = ReactCurrentBatchConfig.transition;
    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);
        return fn(a, b, c, d);
    } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
        if (executionContext === NoContext) {
            resetRenderTimer();
        }
    }
} // Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-redeclare
// eslint-disable-next-line no-redeclare

export function flushSync(fn) {
    // In legacy mode, we flush pending passive effects at the beginning of the
    // next event, not at the end of the previous one.
    if (
        rootWithPendingPassiveEffects !== null &&
        rootWithPendingPassiveEffects.tag === LegacyRoot &&
        (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
        flushPassiveEffects();
    }
    var prevExecutionContext = executionContext;
    executionContext |= BatchedContext;
    var prevTransition = ReactCurrentBatchConfig.transition;
    var previousPriority = getCurrentUpdatePriority();
    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);
        if (fn) {
            return fn();
        } else {
            return undefined;
        }
    } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
        executionContext = prevExecutionContext; // Flush the immediate callbacks that were scheduled during this batch.
        // Note that this will happen even if batchedUpdates is higher up
        // the stack.

        if (
            (executionContext & (RenderContext | CommitContext)) ===
            NoContext
        ) {
            flushSyncCallbacks();
        }
    }
}
export function isAlreadyRendering() {
    // Used by the renderer to print a warning if certain APIs are called from
    // the wrong context.
    return (
        false &&
        (executionContext & (RenderContext | CommitContext)) !== NoContext
    );
}
export function isInvalidExecutionContextForEventFunction() {
    // Used to throw if certain APIs are called from the wrong context.
    return (executionContext & RenderContext) !== NoContext;
}
export function flushControlled(fn) {
    var prevExecutionContext = executionContext;
    executionContext |= BatchedContext;
    var prevTransition = ReactCurrentBatchConfig.transition;
    var previousPriority = getCurrentUpdatePriority();
    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);
        fn();
    } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
        executionContext = prevExecutionContext;
        if (executionContext === NoContext) {
            // Flush the immediate callbacks that were scheduled during this batch
            resetRenderTimer();
            flushSyncCallbacks();
        }
    }
} // This is called by the HiddenContext module when we enter or leave a
// hidden subtree. The stack logic is managed there because that's the only
// place that ever modifies it. Which module it lives in doesn't matter for
// performance because this function will get inlined regardless

export function setRenderLanes(subtreeRenderLanes) {
    renderLanes = subtreeRenderLanes;
}
export function getRenderLanes() {
    return renderLanes;
}
function resetWorkInProgressStack() {
    if (workInProgress === null) return;
    var interruptedWork;
    if (workInProgressSuspendedReason === NotSuspended) {
        // Normal case. Work-in-progress hasn't started yet. Unwind all
        // its parents.
        interruptedWork = workInProgress.return;
    } else {
        // Work-in-progress is in suspended state. Reset the work loop and unwind
        // both the suspended fiber and all its parents.
        resetSuspendedWorkLoopOnUnwind();
        interruptedWork = workInProgress;
    }
    while (interruptedWork !== null) {
        var current = interruptedWork.alternate;
        unwindInterruptedWork(
            current,
            interruptedWork,
            workInProgressRootRenderLanes
        );
        interruptedWork = interruptedWork.return;
    }
    workInProgress = null;
}
function prepareFreshStack(root, lanes) {
    root.finishedWork = null;
    root.finishedLanes = NoLanes;
    var timeoutHandle = root.timeoutHandle;
    if (timeoutHandle !== noTimeout) {
        // The root previous suspended and scheduled a timeout to commit a fallback
        // state. Now that we have additional work, cancel the timeout.
        root.timeoutHandle = noTimeout; // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above

        cancelTimeout(timeoutHandle);
    }
    resetWorkInProgressStack();
    workInProgressRoot = root;
    var rootWorkInProgress = createWorkInProgress(root.current, null);
    workInProgress = rootWorkInProgress;
    workInProgressRootRenderLanes = renderLanes = lanes;
    workInProgressSuspendedReason = NotSuspended;
    workInProgressThrownValue = null;
    workInProgressRootDidAttachPingListener = false;
    workInProgressRootExitStatus = RootInProgress;
    workInProgressRootFatalError = null;
    workInProgressRootSkippedLanes = NoLanes;
    workInProgressRootInterleavedUpdatedLanes = NoLanes;
    workInProgressRootRenderPhaseUpdatedLanes = NoLanes;
    workInProgressRootPingedLanes = NoLanes;
    workInProgressRootConcurrentErrors = null;
    workInProgressRootRecoverableErrors = null;
    finishQueueingConcurrentUpdates();
    return rootWorkInProgress;
}
function resetSuspendedWorkLoopOnUnwind() {
    // Reset module-level state that was set during the render phase.
    resetContextDependencies();
    resetHooksOnUnwind();
}
function handleThrow(root, thrownValue) {
    // A component threw an exception. Usually this is because it suspended, but
    // it also includes regular program errors.
    //
    // We're either going to unwind the stack to show a Suspense or error
    // boundary, or we're going to replay the component again. Like after a
    // promise resolves.
    //
    // Until we decide whether we're going to unwind or replay, we should preserve
    // the current state of the work loop without resetting anything.
    //
    // If we do decide to unwind the stack, module-level variables will be reset
    // in resetSuspendedWorkLoopOnUnwind.
    // These should be reset immediately because they're only supposed to be set
    // when React is executing user code.
    resetHooksAfterThrow();
    resetCurrentDebugFiberInDEV();
    ReactCurrentOwner.current = null;
    if (thrownValue === SuspenseException) {
        // This is a special type of exception used for Suspense. For historical
        // reasons, the rest of the Suspense implementation expects the thrown value
        // to be a thenable, because before `use` existed that was the (unstable)
        // API for suspending. This implementation detail can change later, once we
        // deprecate the old API in favor of `use`.
        thrownValue = getSuspendedThenable();
        workInProgressSuspendedReason =
            shouldAttemptToSuspendUntilDataResolves()
                ? SuspendedOnData
                : SuspendedOnImmediate;
    } else if (thrownValue === SelectiveHydrationException) {
        // An update flowed into a dehydrated boundary. Before we can apply the
        // update, we need to finish hydrating. Interrupt the work-in-progress
        // render so we can restart at the hydration lane.
        //
        // The ideal implementation would be able to switch contexts without
        // unwinding the current stack.
        //
        // We could name this something more general but as of now it's the only
        // case where we think this should happen.
        workInProgressSuspendedReason = SuspendedOnHydration;
    } else {
        // This is a regular error.
        var isWakeable =
            thrownValue !== null &&
            typeof thrownValue === 'object' &&
            typeof thrownValue.then === 'function';
        workInProgressSuspendedReason = isWakeable
            ? // A wakeable object was thrown by a legacy Suspense implementation.
              // This has slightly different behavior than suspending with `use`.
              SuspendedOnDeprecatedThrowPromise
            : // This is a regular error. If something earlier in the component already
              // suspended, we must clear the thenable state to unblock the work loop.
              SuspendedOnError;
    }
    workInProgressThrownValue = thrownValue;
    var erroredWork = workInProgress;
    if (erroredWork === null) {
        // This is a fatal error
        workInProgressRootExitStatus = RootFatalErrored;
        workInProgressRootFatalError = thrownValue;
        return;
    }
    if (enableProfilerTimer && erroredWork.mode & ProfileMode) {
        // Record the time spent rendering before an error was thrown. This
        // avoids inaccurate Profiler durations in the case of a
        // suspended render.
        stopProfilerTimerIfRunningAndRecordDelta(erroredWork, true);
    }
    if (enableSchedulingProfiler) {
        markComponentRenderStopped();
        if (workInProgressSuspendedReason !== SuspendedOnError) {
            var wakeable = thrownValue;
            markComponentSuspended(
                erroredWork,
                wakeable,
                workInProgressRootRenderLanes
            );
        } else {
            markComponentErrored(
                erroredWork,
                thrownValue,
                workInProgressRootRenderLanes
            );
        }
    }
}
function shouldAttemptToSuspendUntilDataResolves() {
    // Check if there are other pending updates that might possibly unblock this
    // component from suspending. This mirrors the check in
    // renderDidSuspendDelayIfPossible. We should attempt to unify them somehow.
    // TODO: Consider unwinding immediately, using the
    // SuspendedOnHydration mechanism.
    if (
        includesNonIdleWork(workInProgressRootSkippedLanes) ||
        includesNonIdleWork(workInProgressRootInterleavedUpdatedLanes)
    ) {
        // Suspend normally. renderDidSuspendDelayIfPossible will handle
        // interrupting the work loop.
        return false;
    } // TODO: We should be able to remove the equivalent check in
    // finishConcurrentRender, and rely just on this one.

    if (includesOnlyTransitions(workInProgressRootRenderLanes)) {
        // If we're rendering inside the "shell" of the app, it's better to suspend
        // rendering and wait for the data to resolve. Otherwise, we should switch
        // to a fallback and continue rendering.
        return getShellBoundary() === null;
    }
    var handler = getSuspenseHandler();
    if (handler === null) {
        // TODO: We should support suspending in the case where there's no
        // parent Suspense boundary, even outside a transition. Somehow. Otherwise,
        // an uncached promise can fall into an infinite loop.
    } else {
        if (includesOnlyRetries(workInProgressRootRenderLanes)) {
            // During a retry, we can suspend rendering if the nearest Suspense boundary
            // is the boundary of the "shell", because we're guaranteed not to block
            // any new content from appearing.
            return handler === getShellBoundary();
        }
    } // For all other Lanes besides Transitions and Retries, we should not wait
    // for the data to load.
    // TODO: We should wait during Offscreen prerendering, too.

    return false;
}
function pushDispatcher(container) {
    prepareRendererToRender(container);
    var prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = ContextOnlyDispatcher;
    if (prevDispatcher === null) {
        // The React isomorphic package does not include a default dispatcher.
        // Instead the first renderer will lazily attach one, in order to give
        // nicer error messages.
        return ContextOnlyDispatcher;
    } else {
        return prevDispatcher;
    }
}
function popDispatcher(prevDispatcher) {
    resetRendererAfterRender();
    ReactCurrentDispatcher.current = prevDispatcher;
}
function pushCacheDispatcher() {
    if (enableCache) {
        var prevCacheDispatcher = ReactCurrentCache.current;
        ReactCurrentCache.current = DefaultCacheDispatcher;
        return prevCacheDispatcher;
    } else {
        return null;
    }
}
function popCacheDispatcher(prevCacheDispatcher) {
    if (enableCache) {
        ReactCurrentCache.current = prevCacheDispatcher;
    }
}
export function markCommitTimeOfFallback() {
    globalMostRecentFallbackTime = now();
}
export function markSkippedUpdateLanes(lane) {
    workInProgressRootSkippedLanes = mergeLanes(
        lane,
        workInProgressRootSkippedLanes
    );
}
export function renderDidSuspend() {
    if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootSuspended;
    }
}
export function renderDidSuspendDelayIfPossible() {
    workInProgressRootExitStatus = RootSuspendedWithDelay; // Check if there are updates that we skipped tree that might have unblocked
    // this render.

    if (
        workInProgressRoot !== null &&
        (includesNonIdleWork(workInProgressRootSkippedLanes) ||
            includesNonIdleWork(workInProgressRootInterleavedUpdatedLanes))
    ) {
        // Mark the current render as suspended so that we switch to working on
        // the updates that were skipped. Usually we only suspend at the end of
        // the render phase.
        // TODO: We should probably always mark the root as suspended immediately
        // (inside this function), since by suspending at the end of the render
        // phase introduces a potential mistake where we suspend lanes that were
        // pinged or updated while we were rendering.
        // TODO: Consider unwinding immediately, using the
        // SuspendedOnHydration mechanism.
        // $FlowFixMe[incompatible-call] need null check workInProgressRoot
        markRootSuspended(workInProgressRoot, workInProgressRootRenderLanes);
    }
}
export function renderDidError(error) {
    if (workInProgressRootExitStatus !== RootSuspendedWithDelay) {
        workInProgressRootExitStatus = RootErrored;
    }
    if (workInProgressRootConcurrentErrors === null) {
        workInProgressRootConcurrentErrors = [error];
    } else {
        workInProgressRootConcurrentErrors.push(error);
    }
} // Called during render to determine if anything has suspended.
// Returns false if we're not sure.

export function renderHasNotSuspendedYet() {
    // If something errored or completed, we can't really be sure,
    // so those are false.
    return workInProgressRootExitStatus === RootInProgress;
} // TODO: Over time, this function and renderRootConcurrent have become more
// and more similar. Not sure it makes sense to maintain forked paths. Consider
// unifying them again.

function renderRootSync(root, lanes) {
    var prevExecutionContext = executionContext;
    executionContext |= RenderContext;
    var prevDispatcher = pushDispatcher(root.containerInfo);
    var prevCacheDispatcher = pushCacheDispatcher(); // If the root or lanes have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.

    if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
    ) {
        if (enableUpdaterTracking) {
            if (isDevToolsPresent) {
                var memoizedUpdaters = root.memoizedUpdaters;
                if (memoizedUpdaters.size > 0) {
                    restorePendingUpdaters(root, workInProgressRootRenderLanes);
                    memoizedUpdaters.clear();
                } // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
                // If we bailout on this work, we'll move them back (like above).
                // It's important to move them now in case the work spawns more work at the same priority with different updaters.
                // That way we can keep the current update and future updates separate.

                movePendingFibersToMemoized(root, lanes);
            }
        }
        workInProgressTransitions = getTransitionsForLanes(root, lanes);
        prepareFreshStack(root, lanes);
    }
    if (enableSchedulingProfiler) {
        markRenderStarted(lanes);
    }
    outer: do {
        try {
            if (
                workInProgressSuspendedReason !== NotSuspended &&
                workInProgress !== null
            ) {
                // The work loop is suspended. During a synchronous render, we don't
                // yield to the main thread. Immediately unwind the stack. This will
                // trigger either a fallback or an error boundary.
                // TODO: For discrete and "default" updates (anything that's not
                // flushSync), we want to wait for the microtasks the flush before
                // unwinding. Will probably implement this using renderRootConcurrent,
                // or merge renderRootSync and renderRootConcurrent into the same
                // function and fork the behavior some other way.
                var unitOfWork = workInProgress;
                var thrownValue = workInProgressThrownValue;
                switch (workInProgressSuspendedReason) {
                    case SuspendedOnHydration: {
                        // Selective hydration. An update flowed into a dehydrated tree.
                        // Interrupt the current render so the work loop can switch to the
                        // hydration lane.
                        resetWorkInProgressStack();
                        workInProgressRootExitStatus = RootDidNotComplete;
                        break outer;
                    }
                    default: {
                        // Continue with the normal work loop.
                        workInProgressSuspendedReason = NotSuspended;
                        workInProgressThrownValue = null;
                        unwindSuspendedUnitOfWork(unitOfWork, thrownValue);
                        break;
                    }
                }
            }
            workLoopSync();
            break;
        } catch (thrownValue) {
            handleThrow(root, thrownValue);
        }
    } while (true);
    resetContextDependencies();
    executionContext = prevExecutionContext;
    popDispatcher(prevDispatcher);
    popCacheDispatcher(prevCacheDispatcher);
    if (workInProgress !== null) {
        // This is a sync render, so we should have finished the whole tree.
        throw new Error(
            'Cannot commit an incomplete root. This error is likely caused by a ' +
                'bug in React. Please file an issue.'
        );
    }
    if (enableSchedulingProfiler) {
        markRenderStopped();
    } // Set this to null to indicate there's no in-progress render.

    workInProgressRoot = null;
    workInProgressRootRenderLanes = NoLanes; // It's safe to process the queue now that the render phase is complete.

    finishQueueingConcurrentUpdates();
    return workInProgressRootExitStatus;
} // The work loop is an extremely hot path. Tell Closure not to inline it.

/** @noinline */

function workLoopSync() {
    // Perform work without checking if we need to yield between fiber.
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}
function renderRootConcurrent(root, lanes) {
    var prevExecutionContext = executionContext;
    executionContext |= RenderContext;
    var prevDispatcher = pushDispatcher(root.containerInfo);
    var prevCacheDispatcher = pushCacheDispatcher(); // If the root or lanes have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.

    if (
        workInProgressRoot !== root ||
        workInProgressRootRenderLanes !== lanes
    ) {
        if (enableUpdaterTracking) {
            if (isDevToolsPresent) {
                var memoizedUpdaters = root.memoizedUpdaters;
                if (memoizedUpdaters.size > 0) {
                    restorePendingUpdaters(root, workInProgressRootRenderLanes);
                    memoizedUpdaters.clear();
                } // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
                // If we bailout on this work, we'll move them back (like above).
                // It's important to move them now in case the work spawns more work at the same priority with different updaters.
                // That way we can keep the current update and future updates separate.

                movePendingFibersToMemoized(root, lanes);
            }
        }
        workInProgressTransitions = getTransitionsForLanes(root, lanes);
        resetRenderTimer();
        prepareFreshStack(root, lanes);
    }
    if (enableSchedulingProfiler) {
        markRenderStarted(lanes);
    }
    outer: do {
        try {
            if (
                workInProgressSuspendedReason !== NotSuspended &&
                workInProgress !== null
            ) {
                // The work loop is suspended. We need to either unwind the stack or
                // replay the suspended component.
                var unitOfWork = workInProgress;
                var thrownValue = workInProgressThrownValue;
                switch (workInProgressSuspendedReason) {
                    case SuspendedOnError: {
                        // Unwind then continue with the normal work loop.
                        workInProgressSuspendedReason = NotSuspended;
                        workInProgressThrownValue = null;
                        unwindSuspendedUnitOfWork(unitOfWork, thrownValue);
                        break;
                    }
                    case SuspendedOnData: {
                        var thenable = thrownValue;
                        if (isThenableResolved(thenable)) {
                            // The data resolved. Try rendering the component again.
                            workInProgressSuspendedReason = NotSuspended;
                            workInProgressThrownValue = null;
                            replaySuspendedUnitOfWork(unitOfWork);
                            break;
                        } // The work loop is suspended on data. We should wait for it to
                        // resolve before continuing to render.
                        // TODO: Handle the case where the promise resolves synchronously.
                        // Usually this is handled when we instrument the promise to add a
                        // `status` field, but if the promise already has a status, we won't
                        // have added a listener until right here.

                        var onResolution = function () {
                            ensureRootIsScheduled(root, now());
                        };
                        thenable.then(onResolution, onResolution);
                        break outer;
                    }
                    case SuspendedOnImmediate: {
                        // If this fiber just suspended, it's possible the data is already
                        // cached. Yield to the main thread to give it a chance to ping. If
                        // it does, we can retry immediately without unwinding the stack.
                        workInProgressSuspendedReason =
                            SuspendedAndReadyToUnwind;
                        break outer;
                    }
                    case SuspendedAndReadyToUnwind: {
                        var _thenable = thrownValue;
                        if (isThenableResolved(_thenable)) {
                            // The data resolved. Try rendering the component again.
                            workInProgressSuspendedReason = NotSuspended;
                            workInProgressThrownValue = null;
                            replaySuspendedUnitOfWork(unitOfWork);
                        } else {
                            // Otherwise, unwind then continue with the normal work loop.
                            workInProgressSuspendedReason = NotSuspended;
                            workInProgressThrownValue = null;
                            unwindSuspendedUnitOfWork(unitOfWork, thrownValue);
                        }
                        break;
                    }
                    case SuspendedOnDeprecatedThrowPromise: {
                        // Suspended by an old implementation that uses the `throw promise`
                        // pattern. The newer replaying behavior can cause subtle issues
                        // like infinite ping loops. So we maintain the old behavior and
                        // always unwind.
                        workInProgressSuspendedReason = NotSuspended;
                        workInProgressThrownValue = null;
                        unwindSuspendedUnitOfWork(unitOfWork, thrownValue);
                        break;
                    }
                    case SuspendedOnHydration: {
                        // Selective hydration. An update flowed into a dehydrated tree.
                        // Interrupt the current render so the work loop can switch to the
                        // hydration lane.
                        resetWorkInProgressStack();
                        workInProgressRootExitStatus = RootDidNotComplete;
                        break outer;
                    }
                    default: {
                        throw new Error(
                            'Unexpected SuspendedReason. This is a bug in React.'
                        );
                    }
                }
            }
            workLoopConcurrent();
            break;
        } catch (thrownValue) {
            handleThrow(root, thrownValue);
        }
    } while (true);
    resetContextDependencies();
    popDispatcher(prevDispatcher);
    popCacheDispatcher(prevCacheDispatcher);
    executionContext = prevExecutionContext;
    // Check if the tree has completed.

    if (workInProgress !== null) {
        // Still work remaining.
        if (enableSchedulingProfiler) {
            markRenderYielded();
        }
        return RootInProgress;
    } else {
        // Completed the tree.
        if (enableSchedulingProfiler) {
            markRenderStopped();
        } // Set this to null to indicate there's no in-progress render.

        workInProgressRoot = null;
        workInProgressRootRenderLanes = NoLanes; // It's safe to process the queue now that the render phase is complete.

        finishQueueingConcurrentUpdates(); // Return the final exit status.

        return workInProgressRootExitStatus;
    }
}
/** @noinline */

function workLoopConcurrent() {
    // Perform work until Scheduler asks us to yield
    while (workInProgress !== null && !shouldYield()) {
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        performUnitOfWork(workInProgress);
    }
}
function performUnitOfWork(unitOfWork) {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    var current = unitOfWork.alternate;
    setCurrentDebugFiberInDEV(unitOfWork);
    var next;
    if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
        startProfilerTimer(unitOfWork);
        next = beginWork(current, unitOfWork, renderLanes);
        stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
    } else {
        next = beginWork(current, unitOfWork, renderLanes);
    }
    resetCurrentDebugFiberInDEV();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
    ReactCurrentOwner.current = null;
}
function replaySuspendedUnitOfWork(unitOfWork) {
    // This is a fork of performUnitOfWork specifcally for replaying a fiber that
    // just suspended.
    //
    var current = unitOfWork.alternate;
    setCurrentDebugFiberInDEV(unitOfWork);
    var next;
    setCurrentDebugFiberInDEV(unitOfWork);
    var isProfilingMode =
        enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode;
    if (isProfilingMode) {
        startProfilerTimer(unitOfWork);
    }
    switch (unitOfWork.tag) {
        case IndeterminateComponent: {
            // Because it suspended with `use`, we can assume it's a
            // function component.
            unitOfWork.tag = FunctionComponent; // Fallthrough to the next branch.
        }
        // eslint-disable-next-line no-fallthrough

        case FunctionComponent:
        case ForwardRef: {
            // Resolve `defaultProps`. This logic is copied from `beginWork`.
            // TODO: Consider moving this switch statement into that module. Also,
            // could maybe use this as an opportunity to say `use` doesn't work with
            // `defaultProps` :)
            var Component = unitOfWork.type;
            var unresolvedProps = unitOfWork.pendingProps;
            var resolvedProps =
                unitOfWork.elementType === Component
                    ? unresolvedProps
                    : resolveDefaultProps(Component, unresolvedProps);
            next = replayFunctionComponent(
                current,
                unitOfWork,
                resolvedProps,
                Component,
                workInProgressRootRenderLanes
            );
            break;
        }
        case SimpleMemoComponent: {
            var _Component = unitOfWork.type;
            var nextProps = unitOfWork.pendingProps;
            next = replayFunctionComponent(
                current,
                unitOfWork,
                nextProps,
                _Component,
                workInProgressRootRenderLanes
            );
            break;
        }
        default: {
            resetSuspendedWorkLoopOnUnwind();
            unwindInterruptedWork(
                current,
                unitOfWork,
                workInProgressRootRenderLanes
            );
            unitOfWork = workInProgress = resetWorkInProgress(
                unitOfWork,
                renderLanes
            );
            next = beginWork(current, unitOfWork, renderLanes);
            break;
        }
    }
    if (isProfilingMode) {
        stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
    } // The begin phase finished successfully without suspending. Return to the
    // normal work loop.

    resetCurrentDebugFiberInDEV();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
    ReactCurrentOwner.current = null;
}
function unwindSuspendedUnitOfWork(unitOfWork, thrownValue) {
    // This is a fork of performUnitOfWork specifcally for unwinding a fiber
    // that threw an exception.
    //
    // Return to the normal work loop. This will unwind the stack, and potentially
    // result in showing a fallback.
    resetSuspendedWorkLoopOnUnwind();
    var returnFiber = unitOfWork.return;
    if (returnFiber === null || workInProgressRoot === null) {
        // Expected to be working on a non-root fiber. This is a fatal error
        // because there's no ancestor that can handle it; the root is
        // supposed to capture all errors that weren't caught by an error
        // boundary.
        workInProgressRootExitStatus = RootFatalErrored;
        workInProgressRootFatalError = thrownValue; // Set `workInProgress` to null. This represents advancing to the next
        // sibling, or the parent if there are no siblings. But since the root
        // has no siblings nor a parent, we set it to null. Usually this is
        // handled by `completeUnitOfWork` or `unwindWork`, but since we're
        // intentionally not calling those, we need set it here.
        // TODO: Consider calling `unwindWork` to pop the contexts.

        workInProgress = null;
        return;
    }
    try {
        // Find and mark the nearest Suspense or error boundary that can handle
        // this "exception".
        throwException(
            workInProgressRoot,
            returnFiber,
            unitOfWork,
            thrownValue,
            workInProgressRootRenderLanes
        );
    } catch (error) {
        // We had trouble processing the error. An example of this happening is
        // when accessing the `componentDidCatch` property of an error boundary
        // throws an error. A weird edge case. There's a regression test for this.
        // To prevent an infinite loop, bubble the error up to the next parent.
        workInProgress = returnFiber;
        throw error;
    } // Return to the normal work loop.

    completeUnitOfWork(unitOfWork);
}
function completeUnitOfWork(unitOfWork) {
    // Attempt to complete the current unit of work, then move to the next
    // sibling. If there are no more siblings, return to the parent fiber.
    var completedWork = unitOfWork;
    do {
        // The current, flushed, state of this fiber is the alternate. Ideally
        // nothing should rely on this, but relying on it here means that we don't
        // need an additional field on the work in progress.
        var current = completedWork.alternate;
        var returnFiber = completedWork.return; // Check if the work completed or if something threw.

        if ((completedWork.flags & Incomplete) === NoFlags) {
            setCurrentDebugFiberInDEV(completedWork);
            var next = void 0;
            if (
                !enableProfilerTimer ||
                (completedWork.mode & ProfileMode) === NoMode
            ) {
                next = completeWork(current, completedWork, renderLanes);
            } else {
                startProfilerTimer(completedWork);
                next = completeWork(current, completedWork, renderLanes); // Update render duration assuming we didn't error.

                stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
            }
            resetCurrentDebugFiberInDEV();
            if (next !== null) {
                // Completing this fiber spawned new work. Work on that next.
                workInProgress = next;
                return;
            }
        } else {
            // This fiber did not complete because something threw. Pop values off
            // the stack without entering the complete phase. If this is a boundary,
            // capture values if possible.
            var _next = unwindWork(current, completedWork, renderLanes); // Because this fiber did not complete, don't reset its lanes.

            if (_next !== null) {
                // If completing this work spawned new work, do that next. We'll come
                // back here again.
                // Since we're restarting, remove anything that is not a host effect
                // from the effect tag.
                _next.flags &= HostEffectMask;
                workInProgress = _next;
                return;
            }
            if (
                enableProfilerTimer &&
                (completedWork.mode & ProfileMode) !== NoMode
            ) {
                // Record the render duration for the fiber that errored.
                stopProfilerTimerIfRunningAndRecordDelta(completedWork, false); // Include the time spent working on failed children before continuing.

                var actualDuration = completedWork.actualDuration;
                var child = completedWork.child;
                while (child !== null) {
                    // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
                    actualDuration += child.actualDuration;
                    child = child.sibling;
                }
                completedWork.actualDuration = actualDuration;
            }
            if (returnFiber !== null) {
                // Mark the parent fiber as incomplete and clear its subtree flags.
                returnFiber.flags |= Incomplete;
                returnFiber.subtreeFlags = NoFlags;
                returnFiber.deletions = null;
            } else {
                // We've unwound all the way to the root.
                workInProgressRootExitStatus = RootDidNotComplete;
                workInProgress = null;
                return;
            }
        }
        var siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            // If there is more work to do in this returnFiber, do that next.
            workInProgress = siblingFiber;
            return;
        } // Otherwise, return to the parent
        // $FlowFixMe[incompatible-type] we bail out when we get a null

        completedWork = returnFiber; // Update the next thing we're working on in case something throws.

        workInProgress = completedWork;
    } while (completedWork !== null); // We've reached the root.

    if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootCompleted;
    }
}
function commitRoot(root, recoverableErrors, transitions) {
    // TODO: This no longer makes any sense. We already wrap the mutation and
    // layout phases. Should be able to remove.
    var previousUpdateLanePriority = getCurrentUpdatePriority();
    var prevTransition = ReactCurrentBatchConfig.transition;
    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);
        commitRootImpl(
            root,
            recoverableErrors,
            transitions,
            previousUpdateLanePriority
        );
    } finally {
        ReactCurrentBatchConfig.transition = prevTransition;
        setCurrentUpdatePriority(previousUpdateLanePriority);
    }
    return null;
}
function commitRootImpl(
    root,
    recoverableErrors,
    transitions,
    renderPriorityLevel
) {
    do {
        // `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
        // means `flushPassiveEffects` will sometimes result in additional
        // passive effects. So we need to keep flushing in a loop until there are
        // no more pending effects.
        // TODO: Might be better if `flushPassiveEffects` did not automatically
        // flush synchronous work at the end, to avoid factoring hazards like this.
        flushPassiveEffects();
    } while (rootWithPendingPassiveEffects !== null);
    flushRenderPhaseStrictModeWarningsInDEV();
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error('Should not already be working.');
    }
    var finishedWork = root.finishedWork;
    var lanes = root.finishedLanes;
    if (enableSchedulingProfiler) {
        markCommitStarted(lanes);
    }
    if (finishedWork === null) {
        if (enableSchedulingProfiler) {
            markCommitStopped();
        }
        return null;
    } else {
    }
    root.finishedWork = null;
    root.finishedLanes = NoLanes;
    if (finishedWork === root.current) {
        throw new Error(
            'Cannot commit the same tree as before. This error is likely caused by ' +
                'a bug in React. Please file an issue.'
        );
    } // commitRoot never returns a continuation; it always finishes synchronously.
    // So we can clear these now to allow a new callback to be scheduled.

    root.callbackNode = null;
    root.callbackPriority = NoLane; // Check which lanes no longer have any work scheduled on them, and mark
    // those as finished.

    var remainingLanes = mergeLanes(
        finishedWork.lanes,
        finishedWork.childLanes
    ); // Make sure to account for lanes that were updated by a concurrent event
    // during the render phase; don't mark them as finished.

    var concurrentlyUpdatedLanes = getConcurrentlyUpdatedLanes();
    remainingLanes = mergeLanes(remainingLanes, concurrentlyUpdatedLanes);
    markRootFinished(root, remainingLanes);
    if (root === workInProgressRoot) {
        // We can reset these now that they are finished.
        workInProgressRoot = null;
        workInProgress = null;
        workInProgressRootRenderLanes = NoLanes;
    } else {
        // This indicates that the last root we worked on is not the same one that
        // we're committing now. This most commonly happens when a suspended root
        // times out.
    } // If there are pending passive effects, schedule a callback to process them.
    // Do this as early as possible, so it is queued before anything else that
    // might get scheduled in the commit phase. (See #16714.)
    // TODO: Delete all other places that schedule the passive effect callback
    // They're redundant.

    if (
        (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
        (finishedWork.flags & PassiveMask) !== NoFlags
    ) {
        if (!rootDoesHavePassiveEffects) {
            rootDoesHavePassiveEffects = true;
            pendingPassiveEffectsRemainingLanes = remainingLanes; // workInProgressTransitions might be overwritten, so we want
            // to store it in pendingPassiveTransitions until they get processed
            // We need to pass this through as an argument to commitRoot
            // because workInProgressTransitions might have changed between
            // the previous render and commit if we throttle the commit
            // with setTimeout

            pendingPassiveTransitions = transitions;
            scheduleCallback(NormalSchedulerPriority, function () {
                flushPassiveEffects(); // This render triggered passive effects: release the root cache pool
                // *after* passive effects fire to avoid freeing a cache pool that may
                // be referenced by a node in the tree (HostRoot, Cache boundary etc)

                return null;
            });
        }
    } // Check if there are any effects in the whole tree.
    // TODO: This is left over from the effect list implementation, where we had
    // to check for the existence of `firstEffect` to satisfy Flow. I think the
    // only other reason this optimization exists is because it affects profiling.
    // Reconsider whether this is necessary.

    var subtreeHasEffects =
        (finishedWork.subtreeFlags &
            (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
        NoFlags;
    var rootHasEffect =
        (finishedWork.flags &
            (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
        NoFlags;
    if (subtreeHasEffects || rootHasEffect) {
        var prevTransition = ReactCurrentBatchConfig.transition;
        ReactCurrentBatchConfig.transition = null;
        var previousPriority = getCurrentUpdatePriority();
        setCurrentUpdatePriority(DiscreteEventPriority);
        var prevExecutionContext = executionContext;
        executionContext |= CommitContext; // Reset this to null before calling lifecycles

        ReactCurrentOwner.current = null; // The commit phase is broken into several sub-phases. We do a separate pass
        // of the effect list for each phase: all mutation effects come before all
        // layout effects, and so on.
        // The first phase a "before mutation" phase. We use this phase to read the
        // state of the host tree right before we mutate it. This is where
        // getSnapshotBeforeUpdate is called.

        var shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(
            root,
            finishedWork
        );
        if (enableProfilerTimer) {
            // Mark the current commit time to be shared by all Profilers in this
            // batch. This enables them to be grouped later.
            recordCommitTime();
        }
        if (enableProfilerTimer && enableProfilerNestedUpdateScheduledHook) {
            // Track the root here, rather than in commitLayoutEffects(), because of ref setters.
            // Updates scheduled during ref detachment should also be flagged.
            rootCommittingMutationOrLayoutEffects = root;
        } // The next phase is the mutation phase, where we mutate the host tree.

        commitMutationEffects(root, finishedWork, lanes);
        if (enableCreateEventHandleAPI) {
            if (shouldFireAfterActiveInstanceBlur) {
                afterActiveInstanceBlur();
            }
        }
        resetAfterCommit(root.containerInfo); // The work-in-progress tree is now the current tree. This must come after
        // the mutation phase, so that the previous tree is still current during
        // componentWillUnmount, but before the layout phase, so that the finished
        // work is current during componentDidMount/Update.

        root.current = finishedWork; // The next phase is the layout phase, where we call effects that read
        // the host tree after it's been mutated. The idiomatic use case for this is
        // layout, but class component lifecycles also fire here for legacy reasons.

        if (enableSchedulingProfiler) {
            markLayoutEffectsStarted(lanes);
        }
        commitLayoutEffects(finishedWork, root, lanes);
        if (enableSchedulingProfiler) {
            markLayoutEffectsStopped();
        }
        if (enableProfilerTimer && enableProfilerNestedUpdateScheduledHook) {
            rootCommittingMutationOrLayoutEffects = null;
        } // Tell Scheduler to yield at the end of the frame, so the browser has an
        // opportunity to paint.

        requestPaint();
        executionContext = prevExecutionContext; // Reset the priority to the previous non-sync value.

        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
    } else {
        // No effects.
        root.current = finishedWork; // Measure these anyway so the flamegraph explicitly shows that there were
        // no effects.
        // TODO: Maybe there's a better way to report this.

        if (enableProfilerTimer) {
            recordCommitTime();
        }
    }
    var rootDidHavePassiveEffects = rootDoesHavePassiveEffects;
    if (rootDoesHavePassiveEffects) {
        // This commit has passive effects. Stash a reference to them. But don't
        // schedule a callback until after flushing layout work.
        rootDoesHavePassiveEffects = false;
        rootWithPendingPassiveEffects = root;
        pendingPassiveEffectsLanes = lanes;
    } else {
        // There were no passive effects, so we can immediately release the cache
        // pool for this render.
        releaseRootPooledCache(root, remainingLanes);
    } // Read this again, since an effect might have updated it

    remainingLanes = root.pendingLanes; // Check if there's remaining work on this root
    // TODO: This is part of the `componentDidCatch` implementation. Its purpose
    // is to detect whether something might have called setState inside
    // `componentDidCatch`. The mechanism is known to be flawed because `setState`
    // inside `componentDidCatch` is itself flawed — that's why we recommend
    // `getDerivedStateFromError` instead. However, it could be improved by
    // checking if remainingLanes includes Sync work, instead of whether there's
    // any work remaining at all (which would also include stuff like Suspense
    // retries or transitions). It's been like this for a while, though, so fixing
    // it probably isn't that urgent.

    if (remainingLanes === NoLanes) {
        // If there's no remaining work, we can clear the set of already failed
        // error boundaries.
        legacyErrorBoundariesThatAlreadyFailed = null;
    }
    onCommitRootDevTools(finishedWork.stateNode, renderPriorityLevel);
    if (enableUpdaterTracking) {
        if (isDevToolsPresent) {
            root.memoizedUpdaters.clear();
        }
    }
    // Always call this before exiting `commitRoot`, to ensure that any
    // additional work on this root is scheduled.

    ensureRootIsScheduled(root, now());
    if (recoverableErrors !== null) {
        // There were errors during this render, but recovered from them without
        // needing to surface it to the UI. We log them here.
        var onRecoverableError = root.onRecoverableError;
        for (var i = 0; i < recoverableErrors.length; i++) {
            var recoverableError = recoverableErrors[i];
            var errorInfo = makeErrorInfo(
                recoverableError.digest,
                recoverableError.stack
            );
            onRecoverableError(recoverableError.value, errorInfo);
        }
    }
    if (hasUncaughtError) {
        hasUncaughtError = false;
        var error = firstUncaughtError;
        firstUncaughtError = null;
        throw error;
    } // If the passive effects are the result of a discrete render, flush them
    // synchronously at the end of the current task so that the result is
    // immediately observable. Otherwise, we assume that they are not
    // order-dependent and do not need to be observed by external systems, so we
    // can wait until after paint.
    // TODO: We can optimize this by not scheduling the callback earlier. Since we
    // currently schedule the callback in multiple places, will wait until those
    // are consolidated.

    if (
        includesSyncLane(pendingPassiveEffectsLanes) &&
        root.tag !== LegacyRoot
    ) {
        flushPassiveEffects();
    } // Read this again, since a passive effect might have updated it

    remainingLanes = root.pendingLanes;
    if (includesSyncLane(remainingLanes)) {
        if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
            markNestedUpdateScheduled();
        } // Count the number of times the root synchronously re-renders without
        // finishing. If there are too many, it indicates an infinite update loop.

        if (root === rootWithNestedUpdates) {
            nestedUpdateCount++;
        } else {
            nestedUpdateCount = 0;
            rootWithNestedUpdates = root;
        }
    } else {
        nestedUpdateCount = 0;
    } // If layout work was scheduled, flush it now.

    flushSyncCallbacks();
    if (enableSchedulingProfiler) {
        markCommitStopped();
    }
    if (enableTransitionTracing) {
        // We process transitions during passive effects. However, passive effects can be
        // processed synchronously during the commit phase as well as asynchronously after
        // paint. At the end of the commit phase, we schedule a callback that will be called
        // after the next paint. If the transitions have already been processed (passive
        // effect phase happened synchronously), we will schedule a callback to process
        // the transitions. However, if we don't have any pending transition callbacks, this
        // means that the transitions have yet to be processed (passive effects processed after paint)
        // so we will store the end time of paint so that we can process the transitions
        // and then call the callback via the correct end time.
        var prevRootTransitionCallbacks = root.transitionCallbacks;
        if (prevRootTransitionCallbacks !== null) {
            schedulePostPaintCallback(function (endTime) {
                var prevPendingTransitionCallbacks =
                    currentPendingTransitionCallbacks;
                if (prevPendingTransitionCallbacks !== null) {
                    currentPendingTransitionCallbacks = null;
                    scheduleCallback(IdleSchedulerPriority, function () {
                        processTransitionCallbacks(
                            prevPendingTransitionCallbacks,
                            endTime,
                            prevRootTransitionCallbacks
                        );
                    });
                } else {
                    currentEndTime = endTime;
                }
            });
        }
    }
    return null;
}
function makeErrorInfo(digest, componentStack) {
    {
        return {
            digest: digest,
            componentStack: componentStack,
        };
    }
}
function releaseRootPooledCache(root, remainingLanes) {
    if (enableCache) {
        var pooledCacheLanes = (root.pooledCacheLanes &= remainingLanes);
        if (pooledCacheLanes === NoLanes) {
            // None of the remaining work relies on the cache pool. Clear it so
            // subsequent requests get a new cache
            var pooledCache = root.pooledCache;
            if (pooledCache != null) {
                root.pooledCache = null;
                releaseCache(pooledCache);
            }
        }
    }
}
export function flushPassiveEffects() {
    // Returns whether passive effects were flushed.
    // TODO: Combine this check with the one in flushPassiveEFfectsImpl. We should
    // probably just combine the two functions. I believe they were only separate
    // in the first place because we used to wrap it with
    // `Scheduler.runWithPriority`, which accepts a function. But now we track the
    // priority within React itself, so we can mutate the variable directly.
    if (rootWithPendingPassiveEffects !== null) {
        // Cache the root since rootWithPendingPassiveEffects is cleared in
        // flushPassiveEffectsImpl
        var root = rootWithPendingPassiveEffects; // Cache and clear the remaining lanes flag; it must be reset since this
        // method can be called from various places, not always from commitRoot
        // where the remaining lanes are known

        var remainingLanes = pendingPassiveEffectsRemainingLanes;
        pendingPassiveEffectsRemainingLanes = NoLanes;
        var renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes);
        var priority = lowerEventPriority(DefaultEventPriority, renderPriority);
        var prevTransition = ReactCurrentBatchConfig.transition;
        var previousPriority = getCurrentUpdatePriority();
        try {
            ReactCurrentBatchConfig.transition = null;
            setCurrentUpdatePriority(priority);
            return flushPassiveEffectsImpl();
        } finally {
            setCurrentUpdatePriority(previousPriority);
            ReactCurrentBatchConfig.transition = prevTransition; // Once passive effects have run for the tree - giving components a
            // chance to retain cache instances they use - release the pooled
            // cache at the root (if there is one)

            releaseRootPooledCache(root, remainingLanes);
        }
    }
    return false;
}
export function enqueuePendingPassiveProfilerEffect(fiber) {
    if (enableProfilerTimer && enableProfilerCommitHooks) {
        pendingPassiveProfilerEffects.push(fiber);
        if (!rootDoesHavePassiveEffects) {
            rootDoesHavePassiveEffects = true;
            scheduleCallback(NormalSchedulerPriority, function () {
                flushPassiveEffects();
                return null;
            });
        }
    }
}
function flushPassiveEffectsImpl() {
    if (rootWithPendingPassiveEffects === null) {
        return false;
    } // Cache and clear the transitions flag

    var transitions = pendingPassiveTransitions;
    pendingPassiveTransitions = null;
    var root = rootWithPendingPassiveEffects;
    var lanes = pendingPassiveEffectsLanes;
    rootWithPendingPassiveEffects = null; // TODO: This is sometimes out of sync with rootWithPendingPassiveEffects.
    // Figure out why and fix it. It's not causing any known issues (probably
    // because it's only used for profiling), but it's a refactor hazard.

    pendingPassiveEffectsLanes = NoLanes;
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error(
            'Cannot flush passive effects while already rendering.'
        );
    }
    if (enableSchedulingProfiler) {
        markPassiveEffectsStarted(lanes);
    }
    var prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    commitPassiveUnmountEffects(root.current);
    commitPassiveMountEffects(root, root.current, lanes, transitions); // TODO: Move to commitPassiveMountEffects

    if (enableProfilerTimer && enableProfilerCommitHooks) {
        var profilerEffects = pendingPassiveProfilerEffects;
        pendingPassiveProfilerEffects = [];
        for (var i = 0; i < profilerEffects.length; i++) {
            var fiber = profilerEffects[i];
            commitPassiveEffectDurations(root, fiber);
        }
    }
    if (enableSchedulingProfiler) {
        markPassiveEffectsStopped();
    }
    executionContext = prevExecutionContext;
    flushSyncCallbacks();
    if (enableTransitionTracing) {
        var prevPendingTransitionCallbacks = currentPendingTransitionCallbacks;
        var prevRootTransitionCallbacks = root.transitionCallbacks;
        var prevEndTime = currentEndTime;
        if (
            prevPendingTransitionCallbacks !== null &&
            prevRootTransitionCallbacks !== null &&
            prevEndTime !== null
        ) {
            currentPendingTransitionCallbacks = null;
            currentEndTime = null;
            scheduleCallback(IdleSchedulerPriority, function () {
                processTransitionCallbacks(
                    prevPendingTransitionCallbacks,
                    prevEndTime,
                    prevRootTransitionCallbacks
                );
            });
        }
    }
    // TODO: Move to commitPassiveMountEffects

    onPostCommitRootDevTools(root);
    if (enableProfilerTimer && enableProfilerCommitHooks) {
        var stateNode = root.current.stateNode;
        stateNode.effectDuration = 0;
        stateNode.passiveEffectDuration = 0;
    }
    return true;
}
export function isAlreadyFailedLegacyErrorBoundary(instance) {
    return (
        legacyErrorBoundariesThatAlreadyFailed !== null &&
        legacyErrorBoundariesThatAlreadyFailed.has(instance)
    );
}
export function markLegacyErrorBoundaryAsFailed(instance) {
    if (legacyErrorBoundariesThatAlreadyFailed === null) {
        legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
    } else {
        legacyErrorBoundariesThatAlreadyFailed.add(instance);
    }
}
function prepareToThrowUncaughtError(error) {
    if (!hasUncaughtError) {
        hasUncaughtError = true;
        firstUncaughtError = error;
    }
}
export var onUncaughtError = prepareToThrowUncaughtError;
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
    var errorInfo = createCapturedValueAtFiber(error, sourceFiber);
    var update = createRootErrorUpdate(rootFiber, errorInfo, SyncLane);
    var root = enqueueUpdate(rootFiber, update, SyncLane);
    var eventTime = requestEventTime();
    if (root !== null) {
        markRootUpdated(root, SyncLane, eventTime);
        ensureRootIsScheduled(root, eventTime);
    }
}
export function captureCommitPhaseError(
    sourceFiber,
    nearestMountedAncestor,
    error
) {
    if (sourceFiber.tag === HostRoot) {
        // Error was thrown at the root. There is no parent, so the root
        // itself should capture it.
        captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
        return;
    }
    var fiber = null;
    if (skipUnmountedBoundaries) {
        fiber = nearestMountedAncestor;
    } else {
        fiber = sourceFiber.return;
    }
    while (fiber !== null) {
        if (fiber.tag === HostRoot) {
            captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error);
            return;
        } else if (fiber.tag === ClassComponent) {
            var ctor = fiber.type;
            var instance = fiber.stateNode;
            if (
                typeof ctor.getDerivedStateFromError === 'function' ||
                (typeof instance.componentDidCatch === 'function' &&
                    !isAlreadyFailedLegacyErrorBoundary(instance))
            ) {
                var errorInfo = createCapturedValueAtFiber(error, sourceFiber);
                var update = createClassErrorUpdate(fiber, errorInfo, SyncLane);
                var root = enqueueUpdate(fiber, update, SyncLane);
                var eventTime = requestEventTime();
                if (root !== null) {
                    markRootUpdated(root, SyncLane, eventTime);
                    ensureRootIsScheduled(root, eventTime);
                }
                return;
            }
        }
        fiber = fiber.return;
    }
}
export function attachPingListener(root, wakeable, lanes) {
    // Attach a ping listener
    //
    // The data might resolve before we have a chance to commit the fallback. Or,
    // in the case of a refresh, we'll never commit a fallback. So we need to
    // attach a listener now. When it resolves ("pings"), we can decide whether to
    // try rendering the tree again.
    //
    // Only attach a listener if one does not already exist for the lanes
    // we're currently rendering (which acts like a "thread ID" here).
    //
    // We only need to do this in concurrent mode. Legacy Suspense always
    // commits fallbacks synchronously, so there are no pings.
    var pingCache = root.pingCache;
    var threadIDs;
    if (pingCache === null) {
        pingCache = root.pingCache = new PossiblyWeakMap();
        threadIDs = new Set();
        pingCache.set(wakeable, threadIDs);
    } else {
        threadIDs = pingCache.get(wakeable);
        if (threadIDs === undefined) {
            threadIDs = new Set();
            pingCache.set(wakeable, threadIDs);
        }
    }
    if (!threadIDs.has(lanes)) {
        workInProgressRootDidAttachPingListener = true; // Memoize using the thread ID to prevent redundant listeners.

        threadIDs.add(lanes);
        var ping = pingSuspendedRoot.bind(null, root, wakeable, lanes);
        if (enableUpdaterTracking) {
            if (isDevToolsPresent) {
                // If we have pending work still, restore the original updaters
                restorePendingUpdaters(root, lanes);
            }
        }
        wakeable.then(ping, ping);
    }
}
function pingSuspendedRoot(root, wakeable, pingedLanes) {
    var pingCache = root.pingCache;
    if (pingCache !== null) {
        // The wakeable resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        pingCache.delete(wakeable);
    }
    var eventTime = requestEventTime();
    markRootPinged(root, pingedLanes);
    warnIfSuspenseResolutionNotWrappedWithActDEV(root);
    if (
        workInProgressRoot === root &&
        isSubsetOfLanes(workInProgressRootRenderLanes, pingedLanes)
    ) {
        // Received a ping at the same priority level at which we're currently
        // rendering. We might want to restart this render. This should mirror
        // the logic of whether or not a root suspends once it completes.
        // TODO: If we're rendering sync either due to Sync, Batched or expired,
        // we should probably never restart.
        // If we're suspended with delay, or if it's a retry, we'll always suspend
        // so we can always restart.
        if (
            workInProgressRootExitStatus === RootSuspendedWithDelay ||
            (workInProgressRootExitStatus === RootSuspended &&
                includesOnlyRetries(workInProgressRootRenderLanes) &&
                now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
        ) {
            // Force a restart from the root by unwinding the stack. Unless this is
            // being called from the render phase, because that would cause a crash.
            if ((executionContext & RenderContext) === NoContext) {
                prepareFreshStack(root, NoLanes);
            } else {
                // TODO: If this does happen during the render phase, we should throw
                // the special internal exception that we use to interrupt the stack for
                // selective hydration. That was temporarily reverted but we once we add
                // it back we can use it here.
            }
        } else {
            // Even though we can't restart right now, we might get an
            // opportunity later. So we mark this render as having a ping.
            workInProgressRootPingedLanes = mergeLanes(
                workInProgressRootPingedLanes,
                pingedLanes
            );
        }
    }
    ensureRootIsScheduled(root, eventTime);
}
function retryTimedOutBoundary(boundaryFiber, retryLane) {
    // The boundary fiber (a Suspense component or SuspenseList component)
    // previously was rendered in its fallback state. One of the promises that
    // suspended it has resolved, which means at least part of the tree was
    // likely unblocked. Try rendering again, at a new lanes.
    if (retryLane === NoLane) {
        // TODO: Assign this to `suspenseState.retryLane`? to avoid
        // unnecessary entanglement?
        retryLane = requestRetryLane(boundaryFiber);
    } // TODO: Special case idle priority?

    var eventTime = requestEventTime();
    var root = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
    if (root !== null) {
        markRootUpdated(root, retryLane, eventTime);
        ensureRootIsScheduled(root, eventTime);
    }
}
export function retryDehydratedSuspenseBoundary(boundaryFiber) {
    var suspenseState = boundaryFiber.memoizedState;
    var retryLane = NoLane;
    if (suspenseState !== null) {
        retryLane = suspenseState.retryLane;
    }
    retryTimedOutBoundary(boundaryFiber, retryLane);
}
export function resolveRetryWakeable(boundaryFiber, wakeable) {
    var retryLane = NoLane; // Default

    var retryCache;
    switch (boundaryFiber.tag) {
        case SuspenseComponent:
            retryCache = boundaryFiber.stateNode;
            var suspenseState = boundaryFiber.memoizedState;
            if (suspenseState !== null) {
                retryLane = suspenseState.retryLane;
            }
            break;
        case SuspenseListComponent:
            retryCache = boundaryFiber.stateNode;
            break;
        case OffscreenComponent: {
            var instance = boundaryFiber.stateNode;
            retryCache = instance._retryCache;
            break;
        }
        default:
            throw new Error(
                'Pinged unknown suspense boundary type. ' +
                    'This is probably a bug in React.'
            );
    }
    if (retryCache !== null) {
        // The wakeable resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        retryCache.delete(wakeable);
    }
    retryTimedOutBoundary(boundaryFiber, retryLane);
} // Computes the next Just Noticeable Difference (JND) boundary.
// The theory is that a person can't tell the difference between small differences in time.
// Therefore, if we wait a bit longer than necessary that won't translate to a noticeable
// difference in the experience. However, waiting for longer might mean that we can avoid
// showing an intermediate loading state. The longer we have already waited, the harder it
// is to tell small differences in time. Therefore, the longer we've already waited,
// the longer we can wait additionally. At some point we have to give up though.
// We pick a train model where the next boundary commits at a consistent schedule.
// These particular numbers are vague estimates. We expect to adjust them based on research.

function jnd(timeElapsed) {
    return timeElapsed < 120
        ? 120
        : timeElapsed < 480
        ? 480
        : timeElapsed < 1080
        ? 1080
        : timeElapsed < 1920
        ? 1920
        : timeElapsed < 3000
        ? 3000
        : timeElapsed < 4320
        ? 4320
        : ceil(timeElapsed / 1960) * 1960;
}
export function throwIfInfiniteUpdateLoopDetected() {
    if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
        nestedUpdateCount = 0;
        nestedPassiveUpdateCount = 0;
        rootWithNestedUpdates = null;
        rootWithPassiveNestedUpdates = null;
        throw new Error(
            'Maximum update depth exceeded. This can happen when a component ' +
                'repeatedly calls setState inside componentWillUpdate or ' +
                'componentDidUpdate. React limits the number of nested updates to ' +
                'prevent infinite loops.'
        );
    }
}
function flushRenderPhaseStrictModeWarningsInDEV() {}
function recursivelyTraverseAndDoubleInvokeEffectsInDEV(
    root,
    parentFiber,
    isInStrictMode
) {
    if ((parentFiber.subtreeFlags & (PlacementDEV | Visibility)) === NoFlags) {
        // Parent's descendants have already had effects double invoked.
        // Early exit to avoid unnecessary tree traversal.
        return;
    }
    var child = parentFiber.child;
    while (child !== null) {
        doubleInvokeEffectsInDEVIfNecessary(root, child, isInStrictMode);
        child = child.sibling;
    }
} // Unconditionally disconnects and connects passive and layout effects.

function doubleInvokeEffectsOnFiber(root, fiber) {
    disappearLayoutEffects(fiber);
    disconnectPassiveEffect(fiber);
    reappearLayoutEffects(root, fiber.alternate, fiber, false);
    reconnectPassiveEffects(root, fiber, NoLanes, null, false);
}
function doubleInvokeEffectsInDEVIfNecessary(
    root,
    fiber,
    parentIsInStrictMode
) {
    var isStrictModeFiber = fiber.type === REACT_STRICT_MODE_TYPE;
    var isInStrictMode = parentIsInStrictMode || isStrictModeFiber; // First case: the fiber **is not** of type OffscreenComponent. No
    // special rules apply to double invoking effects.

    if (fiber.tag !== OffscreenComponent) {
        if (fiber.flags & PlacementDEV) {
            setCurrentDebugFiberInDEV(fiber);
            if (isInStrictMode) {
                doubleInvokeEffectsOnFiber(root, fiber);
            }
            resetCurrentDebugFiberInDEV();
        } else {
            recursivelyTraverseAndDoubleInvokeEffectsInDEV(
                root,
                fiber,
                isInStrictMode
            );
        }
        return;
    } // Second case: the fiber **is** of type OffscreenComponent.
    // This branch contains cases specific to Offscreen.

    if (fiber.memoizedState === null) {
        // Only consider Offscreen that is visible.
        // TODO (Offscreen) Handle manual mode.
        setCurrentDebugFiberInDEV(fiber);
        if (isInStrictMode && fiber.flags & Visibility) {
            // Double invoke effects on Offscreen's subtree only
            // if it is visible and its visibility has changed.
            doubleInvokeEffectsOnFiber(root, fiber);
        } else if (fiber.subtreeFlags & PlacementDEV) {
            // Something in the subtree could have been suspended.
            // We need to continue traversal and find newly inserted fibers.
            recursivelyTraverseAndDoubleInvokeEffectsInDEV(
                root,
                fiber,
                isInStrictMode
            );
        }
        resetCurrentDebugFiberInDEV();
    }
}
function commitDoubleInvokeEffectsInDEV(root, hasPassiveEffects) {}
function legacyCommitDoubleInvokeEffectsInDEV(fiber, hasPassiveEffects) {
    // TODO (StrictEffects) Should we set a marker on the root if it contains strict effects
    // so we don't traverse unnecessarily? similar to subtreeFlags but just at the root level.
    // Maybe not a big deal since this is DEV only behavior.
    setCurrentDebugFiberInDEV(fiber);
    invokeEffectsInDev(fiber, MountLayoutDev, invokeLayoutEffectUnmountInDEV);
    if (hasPassiveEffects) {
        invokeEffectsInDev(
            fiber,
            MountPassiveDev,
            invokePassiveEffectUnmountInDEV
        );
    }
    invokeEffectsInDev(fiber, MountLayoutDev, invokeLayoutEffectMountInDEV);
    if (hasPassiveEffects) {
        invokeEffectsInDev(
            fiber,
            MountPassiveDev,
            invokePassiveEffectMountInDEV
        );
    }
    resetCurrentDebugFiberInDEV();
}
function invokeEffectsInDev(firstChild, fiberFlags, invokeEffectFn) {
    var current = firstChild;
    var subtreeRoot = null;
    while (current != null) {
        var primarySubtreeFlag = current.subtreeFlags & fiberFlags;
        if (
            current !== subtreeRoot &&
            current.child != null &&
            primarySubtreeFlag !== NoFlags
        ) {
            current = current.child;
        } else {
            if ((current.flags & fiberFlags) !== NoFlags) {
                invokeEffectFn(current);
            }
            if (current.sibling !== null) {
                current = current.sibling;
            } else {
                current = subtreeRoot = current.return;
            }
        }
    }
}
var didWarnStateUpdateForNotYetMountedComponent = null;
export function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {}
var beginWork;
{
    beginWork = originalBeginWork;
}
var didWarnAboutUpdateInRender = false;
var didWarnAboutUpdateInRenderForAnotherComponent;
function warnAboutRenderPhaseUpdatesInDEV(fiber) {}
export function restorePendingUpdaters(root, lanes) {
    if (enableUpdaterTracking) {
        if (isDevToolsPresent) {
            var memoizedUpdaters = root.memoizedUpdaters;
            memoizedUpdaters.forEach(function (schedulingFiber) {
                addFiberToLanesMap(root, schedulingFiber, lanes);
            }); // This function intentionally does not clear memoized updaters.
            // Those may still be relevant to the current commit
            // and a future one (e.g. Suspense).
        }
    }
}

var fakeActCallbackNode = {}; // $FlowFixMe[missing-local-annot]

function scheduleCallback(priorityLevel, callback) {
    {
        // In production, always call Scheduler. This function will be stripped out.
        return Scheduler_scheduleCallback(priorityLevel, callback);
    }
}
function cancelCallback(callbackNode) {
    // In production, always call Scheduler. This function will be stripped out.

    return Scheduler_cancelCallback(callbackNode);
}
function shouldForceFlushFallbacksInDEV() {
    // Never force flush in production. This function should get stripped out.
    return false && ReactCurrentActQueue.current !== null;
}
function warnIfUpdatesNotWrappedWithActDEV(fiber) {}
function warnIfSuspenseResolutionNotWrappedWithActDEV(root) {}
export function setIsRunningInsertionEffect(isRunning) {}
