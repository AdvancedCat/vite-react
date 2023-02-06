import { warn as _consoleWarn } from '../../shared/consoleWithStackDev';
import { error as _consoleError } from '../../shared/consoleWithStackDev';
import ReactSharedInternals from '../../react/src/ReactSharedInternals';
import {
    enableDebugTracing,
    enableSchedulingProfiler,
    enableCache,
    enableUseRefAccessWarning,
    enableLazyContextPropagation,
    enableUseMutableSource,
    enableTransitionTracing,
    enableUseHook,
    enableUseMemoCacheHook,
    enableUseEffectEventHook,
    enableLegacyCache,
    debugRenderPhaseSideEffectsForStrictMode,
} from '../../shared/ReactFeatureFlags';
import {
    REACT_CONTEXT_TYPE,
    REACT_SERVER_CONTEXT_TYPE,
    REACT_MEMO_CACHE_SENTINEL,
} from '../../shared/ReactSymbols';
import {
    NoMode,
    ConcurrentMode,
    DebugTracingMode,
    StrictEffectsMode,
    StrictLegacyMode,
} from './ReactTypeOfMode';
import {
    NoLane,
    SyncLane,
    OffscreenLane,
    NoLanes,
    isSubsetOfLanes,
    includesBlockingLane,
    includesOnlyNonUrgentLanes,
    claimNextTransitionLane,
    mergeLanes,
    removeLanes,
    intersectLanes,
    isTransitionLane,
    markRootEntangled,
    markRootMutableRead,
    NoTimestamp,
} from './ReactFiberLane';
import {
    ContinuousEventPriority,
    getCurrentUpdatePriority,
    setCurrentUpdatePriority,
    higherEventPriority,
} from './ReactEventPriorities';
import { readContext, checkIfContextChanged } from './ReactFiberNewContext';
import { HostRoot, CacheComponent } from './ReactWorkTags';
import {
    LayoutStatic as LayoutStaticEffect,
    Passive as PassiveEffect,
    PassiveStatic as PassiveStaticEffect,
    StaticMask as StaticMaskEffect,
    Update as UpdateEffect,
    StoreConsistency,
    MountLayoutDev as MountLayoutDevEffect,
    MountPassiveDev as MountPassiveDevEffect,
} from './ReactFiberFlags';
import {
    HasEffect as HookHasEffect,
    Layout as HookLayout,
    Passive as HookPassive,
    Insertion as HookInsertion,
} from './ReactHookEffectTags';
import {
    getWorkInProgressRoot,
    getWorkInProgressRootRenderLanes,
    scheduleUpdateOnFiber,
    requestUpdateLane,
    requestEventTime,
    markSkippedUpdateLanes,
    isInvalidExecutionContextForEventFunction,
} from './ReactFiberWorkLoop';
import getComponentNameFromFiber from './getComponentNameFromFiber';
import is from '../../shared/objectIs';
import isArray from '../../shared/isArray';
import {
    markWorkInProgressReceivedUpdate,
    checkIfWorkInProgressReceivedUpdate,
} from './ReactFiberBeginWork';
import { getIsHydrating } from './ReactFiberHydrationContext';
import {
    getWorkInProgressVersion,
    markSourceAsDirty,
    setWorkInProgressVersion,
    warnAboutMultipleRenderersDEV,
} from './ReactMutableSource';
import { logStateUpdateScheduled } from './DebugTracing';
import {
    markStateUpdateScheduled,
    setIsStrictModeForDevtools,
} from './ReactFiberDevToolsHook';
import { createCache } from './ReactFiberCacheComponent';
import {
    createUpdate as createLegacyQueueUpdate,
    enqueueUpdate as enqueueLegacyQueueUpdate,
    entangleTransitions as entangleLegacyQueueTransitions,
} from './ReactFiberClassUpdateQueue';
import {
    enqueueConcurrentHookUpdate,
    enqueueConcurrentHookUpdateAndEagerlyBailout,
    enqueueConcurrentRenderForLane,
} from './ReactFiberConcurrentUpdates';
import { getTreeId } from './ReactFiberTreeContext';
import { now } from './Scheduler';
import {
    trackUsedThenable,
    checkIfUseWrappedInTryCatch,
    createThenableState,
} from './ReactFiberThenable';
var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
    ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig;
var didWarnAboutMismatchedHooksForComponent;
var didWarnUncachedGetSnapshot;
var didWarnAboutUseWrappedInTryCatch;
// These are set right before calling the component.

var renderLanes = NoLanes; // The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.

var currentlyRenderingFiber = null; // Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.

var currentHook = null;
var workInProgressHook = null; // Whether an update was scheduled at any point during the render phase. This
// does not get reset if we do another render pass; only when we're completely
// finished evaluating this component. This is an optimization so we know
// whether we need to clear render phase updates after a throw.

var didScheduleRenderPhaseUpdate = false; // Where an update was scheduled only during the current render pass. This
// gets reset after each attempt.
// TODO: Maybe there's some way to consolidate this with
// `didScheduleRenderPhaseUpdate`. Or with `numberOfReRenders`.

var didScheduleRenderPhaseUpdateDuringThisPass = false;
var shouldDoubleInvokeUserFnsInHooksDEV = false; // Counts the number of useId hooks in this component.

var localIdCounter = 0; // Counts number of `use`-d thenables

var thenableIndexCounter = 0;
var thenableState = null; // Used for ids that are generated completely client-side (i.e. not during
// hydration). This counter is global, so client ids are not stable across
// render attempts.

var globalClientIdCounter = 0;
var RE_RENDER_LIMIT = 25; // In DEV, this is the name of the currently executing primitive hook

var currentHookNameInDev = null; // In DEV, this list ensures that hooks are called in the same order between renders.
// The list stores the order of hooks used during the initial render (mount).
// Subsequent renders (updates) reference this list.

var hookTypesDev = null;
var hookTypesUpdateIndexDev = -1; // In DEV, this tracks whether currently rendering component needs to ignore
// the dependencies for Hooks that need them (e.g. useEffect or useMemo).
// When true, such Hooks will always be "remounted". Only used during hot reload.

var ignorePreviousDependencies = false;
function mountHookTypesDev() {}
function updateHookTypesDev() {}
function checkDepsAreArrayDev(deps) {}
function warnOnHookMismatchInDev(currentHookName) {}
function throwInvalidHookError() {
    throw new Error(
        'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
            ' one of the following reasons:\n' +
            '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
            '2. You might be breaking the Rules of Hooks\n' +
            '3. You might have more than one copy of React in the same app\n' +
            'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.'
    );
}
function areHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) {
        return false;
    }
    // $FlowFixMe[incompatible-use] found when upgrading Flow

    for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        if (is(nextDeps[i], prevDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
}
export function renderWithHooks(
    current,
    workInProgress,
    Component,
    props,
    secondArg,
    nextRenderLanes
) {
    renderLanes = nextRenderLanes;
    currentlyRenderingFiber = workInProgress;
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;
    workInProgress.lanes = NoLanes; // The following should have already been reset
    // currentHook = null;
    // workInProgressHook = null;
    // didScheduleRenderPhaseUpdate = false;
    // localIdCounter = 0;
    // thenableIndexCounter = 0;
    // thenableState = null;
    // TODO Warn if no hooks are used at all during mount, then some are used during update.
    // Currently we will identify the update render as a mount because memoizedState === null.
    // This is tricky because it's valid for certain types of components (e.g. React.lazy)
    // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
    // Non-stateful hooks (e.g. context) don't get added to memoizedState,
    // so memoizedState would be null during updates and mounts.

    {
        ReactCurrentDispatcher.current =
            current === null || current.memoizedState === null
                ? HooksDispatcherOnMount
                : HooksDispatcherOnUpdate;
    } // In Strict Mode, during development, user functions are double invoked to
    // help detect side effects. The logic for how this is implemented for in
    // hook components is a bit complex so let's break it down.
    //
    // We will invoke the entire component function twice. However, during the
    // second invocation of the component, the hook state from the first
    // invocation will be reused. That means things like `useMemo` functions won't
    // run again, because the deps will match and the memoized result will
    // be reused.
    //
    // We want memoized functions to run twice, too, so account for this, user
    // functions are double invoked during the *first* invocation of the component
    // function, and are *not* double invoked during the second incovation:
    //
    // - First execution of component function: user functions are double invoked
    // - Second execution of component function (in Strict Mode, during
    //   development): user functions are not double invoked.
    //
    // This is intentional for a few reasons; most importantly, it's because of
    // how `use` works when something suspends: it reuses the promise that was
    // passed during the first attempt. This is itself a form of memoization.
    // We need to be able to memoize the reactive inputs to the `use` call using
    // a hook (i.e. `useMemo`), which means, the reactive inputs to `use` must
    // come from the same component invocation as the output.
    //
    // There are plenty of tests to ensure this behavior is correct.

    var shouldDoubleRenderDEV =
        false &&
        debugRenderPhaseSideEffectsForStrictMode &&
        (workInProgress.mode & StrictLegacyMode) !== NoMode;
    shouldDoubleInvokeUserFnsInHooksDEV = shouldDoubleRenderDEV;
    var children = Component(props, secondArg);
    shouldDoubleInvokeUserFnsInHooksDEV = false; // Check if there was a render phase update

    if (didScheduleRenderPhaseUpdateDuringThisPass) {
        // Keep rendering until the component stabilizes (there are no more render
        // phase updates).
        children = renderWithHooksAgain(
            workInProgress,
            Component,
            props,
            secondArg
        );
    }
    if (shouldDoubleRenderDEV) {
        // In development, components are invoked twice to help detect side effects.
        setIsStrictModeForDevtools(true);
        try {
            children = renderWithHooksAgain(
                workInProgress,
                Component,
                props,
                secondArg
            );
        } finally {
            setIsStrictModeForDevtools(false);
        }
    }
    finishRenderingHooks(current, workInProgress);
    return children;
}
function finishRenderingHooks(current, workInProgress) {
    // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrance.
    ReactCurrentDispatcher.current = ContextOnlyDispatcher;
    // This check uses currentHook so that it works the same in DEV and prod bundles.
    // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.

    var didRenderTooFewHooks =
        currentHook !== null && currentHook.next !== null;
    renderLanes = NoLanes;
    currentlyRenderingFiber = null;
    currentHook = null;
    workInProgressHook = null;
    didScheduleRenderPhaseUpdate = false; // This is reset by checkDidRenderIdHook
    // localIdCounter = 0;

    thenableIndexCounter = 0;
    thenableState = null;
    if (didRenderTooFewHooks) {
        throw new Error(
            'Rendered fewer hooks than expected. This may be caused by an accidental ' +
                'early return statement.'
        );
    }
    if (enableLazyContextPropagation) {
        if (current !== null) {
            if (!checkIfWorkInProgressReceivedUpdate()) {
                // If there were no changes to props or state, we need to check if there
                // was a context change. We didn't already do this because there's no
                // 1:1 correspondence between dependencies and hooks. Although, because
                // there almost always is in the common case (`readContext` is an
                // internal API), we could compare in there. OTOH, we only hit this case
                // if everything else bails out, so on the whole it might be better to
                // keep the comparison out of the common path.
                var currentDependencies = current.dependencies;
                if (
                    currentDependencies !== null &&
                    checkIfContextChanged(currentDependencies)
                ) {
                    markWorkInProgressReceivedUpdate();
                }
            }
        }
    }
}
export function replaySuspendedComponentWithHooks(
    current,
    workInProgress,
    Component,
    props,
    secondArg
) {
    // This function is used to replay a component that previously suspended,
    // after its data resolves.
    //
    // It's a simplified version of renderWithHooks, but it doesn't need to do
    // most of the set up work because they weren't reset when we suspended; they
    // only get reset when the component either completes (finishRenderingHooks)
    // or unwinds (resetHooksOnUnwind).

    var children = renderWithHooksAgain(
        workInProgress,
        Component,
        props,
        secondArg
    );
    finishRenderingHooks(current, workInProgress);
    return children;
}
function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
    // This is used to perform another render pass. It's used when setState is
    // called during render, and for double invoking components in Strict Mode
    // during development.
    //
    // The state from the previous pass is reused whenever possible. So, state
    // updates that were already processed are not processed again, and memoized
    // functions (`useMemo`) are not invoked again.
    //
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    var numberOfReRenders = 0;
    var children;
    do {
        didScheduleRenderPhaseUpdateDuringThisPass = false;
        thenableIndexCounter = 0;
        if (numberOfReRenders >= RE_RENDER_LIMIT) {
            throw new Error(
                'Too many re-renders. React limits the number of renders to prevent ' +
                    'an infinite loop.'
            );
        }
        numberOfReRenders += 1;
        // Start over from the beginning of the list

        currentHook = null;
        workInProgressHook = null;
        workInProgress.updateQueue = null;
        ReactCurrentDispatcher.current = HooksDispatcherOnRerender;
        children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
    return children;
}
export function checkDidRenderIdHook() {
    // This should be called immediately after every renderWithHooks call.
    // Conceptually, it's part of the return value of renderWithHooks; it's only a
    // separate function to avoid using an array tuple.
    var didRenderIdHook = localIdCounter !== 0;
    localIdCounter = 0;
    return didRenderIdHook;
}
export function bailoutHooks(current, workInProgress, lanes) {
    workInProgress.updateQueue = current.updateQueue; // TODO: Don't need to reset the flags here, because they're reset in the
    // complete phase (bubbleProperties).

    {
        workInProgress.flags &= ~(PassiveEffect | UpdateEffect);
    }
    current.lanes = removeLanes(current.lanes, lanes);
}
export function resetHooksAfterThrow() {
    // This is called immediaetly after a throw. It shouldn't reset the entire
    // module state, because the work loop might decide to replay the component
    // again without rewinding.
    //
    // It should only reset things like the current dispatcher, to prevent hooks
    // from being called outside of a component.
    // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrance.
    ReactCurrentDispatcher.current = ContextOnlyDispatcher;
}
export function resetHooksOnUnwind() {
    if (didScheduleRenderPhaseUpdate) {
        // There were render phase updates. These are only valid for this render
        // phase, which we are now aborting. Remove the updates from the queues so
        // they do not persist to the next render. Do not remove updates from hooks
        // that weren't processed.
        //
        // Only reset the updates from the queue if it has a clone. If it does
        // not have a clone, that means it wasn't processed, and the updates were
        // scheduled before we entered the render phase.
        var hook = currentlyRenderingFiber.memoizedState;
        while (hook !== null) {
            var queue = hook.queue;
            if (queue !== null) {
                queue.pending = null;
            }
            hook = hook.next;
        }
        didScheduleRenderPhaseUpdate = false;
    }
    renderLanes = NoLanes;
    currentlyRenderingFiber = null;
    currentHook = null;
    workInProgressHook = null;
    didScheduleRenderPhaseUpdateDuringThisPass = false;
    localIdCounter = 0;
    thenableIndexCounter = 0;
    thenableState = null;
}
function mountWorkInProgressHook() {
    var hook = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null,
    };
    if (workInProgressHook === null) {
        // This is the first hook in the list
        currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
    } else {
        // Append to the end of the list
        workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook;
}
function updateWorkInProgressHook() {
    // This function is used both for updates and for re-renders triggered by a
    // render phase update. It assumes there is either a current hook we can
    // clone, or a work-in-progress hook from a previous render pass that we can
    // use as a base. When we reach the end of the base list, we must switch to
    // the dispatcher used for mounts.
    var nextCurrentHook;
    if (currentHook === null) {
        var current = currentlyRenderingFiber.alternate;
        if (current !== null) {
            nextCurrentHook = current.memoizedState;
        } else {
            nextCurrentHook = null;
        }
    } else {
        nextCurrentHook = currentHook.next;
    }
    var nextWorkInProgressHook;
    if (workInProgressHook === null) {
        nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
    } else {
        nextWorkInProgressHook = workInProgressHook.next;
    }
    if (nextWorkInProgressHook !== null) {
        // There's already a work-in-progress. Reuse it.
        workInProgressHook = nextWorkInProgressHook;
        nextWorkInProgressHook = workInProgressHook.next;
        currentHook = nextCurrentHook;
    } else {
        // Clone from the current hook.
        if (nextCurrentHook === null) {
            var currentFiber = currentlyRenderingFiber.alternate;
            if (currentFiber === null) {
                // This is the initial render. This branch is reached when the component
                // suspends, resumes, then renders an additional hook.
                var _newHook = {
                    memoizedState: null,
                    baseState: null,
                    baseQueue: null,
                    queue: null,
                    next: null,
                };
                nextCurrentHook = _newHook;
            } else {
                // This is an update. We should always have a current hook.
                throw new Error(
                    'Rendered more hooks than during the previous render.'
                );
            }
        }
        currentHook = nextCurrentHook;
        var newHook = {
            memoizedState: currentHook.memoizedState,
            baseState: currentHook.baseState,
            baseQueue: currentHook.baseQueue,
            queue: currentHook.queue,
            next: null,
        };
        if (workInProgressHook === null) {
            // This is the first hook in the list.
            currentlyRenderingFiber.memoizedState = workInProgressHook =
                newHook;
        } else {
            // Append to the end of the list.
            workInProgressHook = workInProgressHook.next = newHook;
        }
    }
    return workInProgressHook;
} // NOTE: defining two versions of this function to avoid size impact when this feature is disabled.
// Previously this function was inlined, the additional `memoCache` property makes it not inlined.

var createFunctionComponentUpdateQueue;
if (enableUseMemoCacheHook) {
    createFunctionComponentUpdateQueue = function () {
        return {
            lastEffect: null,
            events: null,
            stores: null,
            memoCache: null,
        };
    };
} else {
    createFunctionComponentUpdateQueue = function () {
        return {
            lastEffect: null,
            events: null,
            stores: null,
        };
    };
}
function use(usable) {
    if (usable !== null && typeof usable === 'object') {
        // $FlowFixMe[method-unbinding]
        if (typeof usable.then === 'function') {
            // This is a thenable.
            var thenable = usable; // Track the position of the thenable within this fiber.

            var index = thenableIndexCounter;
            thenableIndexCounter += 1;
            if (thenableState === null) {
                thenableState = createThenableState();
            }
            return trackUsedThenable(thenableState, thenable, index);
        } else if (
            usable.$$typeof === REACT_CONTEXT_TYPE ||
            usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
        ) {
            var context = usable;
            return readContext(context);
        }
    } // eslint-disable-next-line react-internal/safe-string-coercion

    throw new Error(
        'An unsupported type was passed to use(): ' + String(usable)
    );
}
function useMemoCache(size) {
    var memoCache = null; // Fast-path, load memo cache from wip fiber if already prepared

    var updateQueue = currentlyRenderingFiber.updateQueue;
    if (updateQueue !== null) {
        memoCache = updateQueue.memoCache;
    } // Otherwise clone from the current fiber

    if (memoCache == null) {
        var current = currentlyRenderingFiber.alternate;
        if (current !== null) {
            var currentUpdateQueue = current.updateQueue;
            if (currentUpdateQueue !== null) {
                var currentMemoCache = currentUpdateQueue.memoCache;
                if (currentMemoCache != null) {
                    memoCache = {
                        data: currentMemoCache.data.map(function (array) {
                            return array.slice();
                        }),
                        index: 0,
                    };
                }
            }
        }
    } // Finally fall back to allocating a fresh instance of the cache

    if (memoCache == null) {
        memoCache = {
            data: [],
            index: 0,
        };
    }
    if (updateQueue === null) {
        updateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber.updateQueue = updateQueue;
    }
    updateQueue.memoCache = memoCache;
    var data = memoCache.data[memoCache.index];
    if (data === undefined) {
        data = memoCache.data[memoCache.index] = new Array(size);
        for (var i = 0; i < size; i++) {
            data[i] = REACT_MEMO_CACHE_SENTINEL;
        }
    } else if (data.length !== size) {
    }
    memoCache.index++;
    return data;
}
function basicStateReducer(state, action) {
    // $FlowFixMe: Flow doesn't like mixed types
    return typeof action === 'function' ? action(state) : action;
}
function mountReducer(reducer, initialArg, init) {
    var hook = mountWorkInProgressHook();
    var initialState;
    if (init !== undefined) {
        initialState = init(initialArg);
    } else {
        initialState = initialArg;
    }
    hook.memoizedState = hook.baseState = initialState;
    var queue = {
        pending: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialState,
    };
    hook.queue = queue;
    var dispatch = (queue.dispatch = dispatchReducerAction.bind(
        null,
        currentlyRenderingFiber,
        queue
    ));
    return [hook.memoizedState, dispatch];
}
function updateReducer(reducer, initialArg, init) {
    var hook = updateWorkInProgressHook();
    var queue = hook.queue;
    if (queue === null) {
        throw new Error(
            'Should have a queue. This is likely a bug in React. Please file an issue.'
        );
    }
    queue.lastRenderedReducer = reducer;
    var current = currentHook; // The last rebase update that is NOT part of the base state.

    var baseQueue = current.baseQueue; // The last pending update that hasn't been processed yet.

    var pendingQueue = queue.pending;
    if (pendingQueue !== null) {
        // We have new updates that haven't been processed yet.
        // We'll add them to the base queue.
        if (baseQueue !== null) {
            // Merge the pending queue and the base queue.
            var baseFirst = baseQueue.next;
            var pendingFirst = pendingQueue.next;
            baseQueue.next = pendingFirst;
            pendingQueue.next = baseFirst;
        }
        current.baseQueue = baseQueue = pendingQueue;
        queue.pending = null;
    }
    if (baseQueue !== null) {
        // We have a queue to process.
        var first = baseQueue.next;
        var newState = current.baseState;
        var newBaseState = null;
        var newBaseQueueFirst = null;
        var newBaseQueueLast = null;
        var update = first;
        do {
            // An extra OffscreenLane bit is added to updates that were made to
            // a hidden tree, so that we can distinguish them from updates that were
            // already there when the tree was hidden.
            var updateLane = removeLanes(update.lane, OffscreenLane);
            var isHiddenUpdate = updateLane !== update.lane; // Check if this update was made while the tree was hidden. If so, then
            // it's not a "base" update and we should disregard the extra base lanes
            // that were added to renderLanes when we entered the Offscreen tree.

            var shouldSkipUpdate = isHiddenUpdate
                ? !isSubsetOfLanes(
                      getWorkInProgressRootRenderLanes(),
                      updateLane
                  )
                : !isSubsetOfLanes(renderLanes, updateLane);
            if (shouldSkipUpdate) {
                // Priority is insufficient. Skip this update. If this is the first
                // skipped update, the previous update/state is the new base
                // update/state.
                var clone = {
                    lane: updateLane,
                    action: update.action,
                    hasEagerState: update.hasEagerState,
                    eagerState: update.eagerState,
                    next: null,
                };
                if (newBaseQueueLast === null) {
                    newBaseQueueFirst = newBaseQueueLast = clone;
                    newBaseState = newState;
                } else {
                    newBaseQueueLast = newBaseQueueLast.next = clone;
                } // Update the remaining priority in the queue.
                // TODO: Don't need to accumulate this. Instead, we can remove
                // renderLanes from the original lanes.

                currentlyRenderingFiber.lanes = mergeLanes(
                    currentlyRenderingFiber.lanes,
                    updateLane
                );
                markSkippedUpdateLanes(updateLane);
            } else {
                // This update does have sufficient priority.
                if (newBaseQueueLast !== null) {
                    var _clone = {
                        // This update is going to be committed so we never want uncommit
                        // it. Using NoLane works because 0 is a subset of all bitmasks, so
                        // this will never be skipped by the check above.
                        lane: NoLane,
                        action: update.action,
                        hasEagerState: update.hasEagerState,
                        eagerState: update.eagerState,
                        next: null,
                    };
                    newBaseQueueLast = newBaseQueueLast.next = _clone;
                } // Process this update.

                var action = update.action;
                if (shouldDoubleInvokeUserFnsInHooksDEV) {
                    reducer(newState, action);
                }
                if (update.hasEagerState) {
                    // If this update is a state update (not a reducer) and was processed eagerly,
                    // we can use the eagerly computed state
                    newState = update.eagerState;
                } else {
                    newState = reducer(newState, action);
                }
            }
            update = update.next;
        } while (update !== null && update !== first);
        if (newBaseQueueLast === null) {
            newBaseState = newState;
        } else {
            newBaseQueueLast.next = newBaseQueueFirst;
        } // Mark that the fiber performed work, but only if the new state is
        // different from the current state.

        if (!is(newState, hook.memoizedState)) {
            markWorkInProgressReceivedUpdate();
        }
        hook.memoizedState = newState;
        hook.baseState = newBaseState;
        hook.baseQueue = newBaseQueueLast;
        queue.lastRenderedState = newState;
    }
    if (baseQueue === null) {
        // `queue.lanes` is used for entangling transitions. We can set it back to
        // zero once the queue is empty.
        queue.lanes = NoLanes;
    }
    var dispatch = queue.dispatch;
    return [hook.memoizedState, dispatch];
}
function rerenderReducer(reducer, initialArg, init) {
    var hook = updateWorkInProgressHook();
    var queue = hook.queue;
    if (queue === null) {
        throw new Error(
            'Should have a queue. This is likely a bug in React. Please file an issue.'
        );
    }
    queue.lastRenderedReducer = reducer; // This is a re-render. Apply the new render phase updates to the previous
    // work-in-progress hook.

    var dispatch = queue.dispatch;
    var lastRenderPhaseUpdate = queue.pending;
    var newState = hook.memoizedState;
    if (lastRenderPhaseUpdate !== null) {
        // The queue doesn't persist past this render pass.
        queue.pending = null;
        var firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        var update = firstRenderPhaseUpdate;
        do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            var action = update.action;
            newState = reducer(newState, action);
            update = update.next;
        } while (update !== firstRenderPhaseUpdate); // Mark that the fiber performed work, but only if the new state is
        // different from the current state.

        if (!is(newState, hook.memoizedState)) {
            markWorkInProgressReceivedUpdate();
        }
        hook.memoizedState = newState; // Don't persist the state accumulated from the render phase updates to
        // the base state unless the queue is empty.
        // TODO: Not sure if this is the desired semantics, but it's what we
        // do for gDSFP. I can't remember why.

        if (hook.baseQueue === null) {
            hook.baseState = newState;
        }
        queue.lastRenderedState = newState;
    }
    return [newState, dispatch];
}
function readFromUnsubscribedMutableSource(root, source, getSnapshot) {
    var getVersion = source._getVersion;
    var version = getVersion(source._source); // Is it safe for this component to read from this source during the current render?

    var isSafeToReadFromSource = false; // Check the version first.
    // If this render has already been started with a specific version,
    // we can use it alone to determine if we can safely read from the source.

    var currentRenderVersion = getWorkInProgressVersion(source);
    if (currentRenderVersion !== null) {
        // It's safe to read if the store hasn't been mutated since the last time
        // we read something.
        isSafeToReadFromSource = currentRenderVersion === version;
    } else {
        // If there's no version, then this is the first time we've read from the
        // source during the current render pass, so we need to do a bit more work.
        // What we need to determine is if there are any hooks that already
        // subscribed to the source, and if so, whether there are any pending
        // mutations that haven't been synchronized yet.
        //
        // If there are no pending mutations, then `root.mutableReadLanes` will be
        // empty, and we know we can safely read.
        //
        // If there *are* pending mutations, we may still be able to safely read
        // if the currently rendering lanes are inclusive of the pending mutation
        // lanes, since that guarantees that the value we're about to read from
        // the source is consistent with the values that we read during the most
        // recent mutation.
        isSafeToReadFromSource = isSubsetOfLanes(
            renderLanes,
            root.mutableReadLanes
        );
        if (isSafeToReadFromSource) {
            // If it's safe to read from this source during the current render,
            // store the version in case other components read from it.
            // A changed version number will let those components know to throw and restart the render.
            setWorkInProgressVersion(source, version);
        }
    }
    if (isSafeToReadFromSource) {
        var snapshot = getSnapshot(source._source);
        return snapshot;
    } else {
        // This handles the special case of a mutable source being shared between renderers.
        // In that case, if the source is mutated between the first and second renderer,
        // The second renderer don't know that it needs to reset the WIP version during unwind,
        // (because the hook only marks sources as dirty if it's written to their WIP version).
        // That would cause this tear check to throw again and eventually be visible to the user.
        // We can avoid this infinite loop by explicitly marking the source as dirty.
        //
        // This can lead to tearing in the first renderer when it resumes,
        // but there's nothing we can do about that (short of throwing here and refusing to continue the render).
        markSourceAsDirty(source); // Intentioally throw an error to force React to retry synchronously. During
        // the synchronous retry, it will block interleaved mutations, so we should
        // get a consistent read. Therefore, the following error should never be
        // visible to the user.
        // We expect this error not to be thrown during the synchronous retry,
        // because we blocked interleaved mutations.

        throw new Error(
            'Cannot read from mutable source during the current render without tearing. This may be a bug in React. Please file an issue.'
        );
    }
}
function useMutableSource(hook, source, getSnapshot, subscribe) {
    if (!enableUseMutableSource) {
        return undefined;
    }
    var root = getWorkInProgressRoot();
    if (root === null) {
        throw new Error(
            'Expected a work-in-progress root. This is a bug in React. Please file an issue.'
        );
    }
    var getVersion = source._getVersion;
    var version = getVersion(source._source);
    var dispatcher = ReactCurrentDispatcher.current; // eslint-disable-next-line prefer-const

    var _dispatcher$useState = dispatcher.useState(function () {
            return readFromUnsubscribedMutableSource(root, source, getSnapshot);
        }),
        currentSnapshot = _dispatcher$useState[0],
        setSnapshot = _dispatcher$useState[1];
    var snapshot = currentSnapshot; // Grab a handle to the state hook as well.
    // We use it to clear the pending update queue if we have a new source.

    var stateHook = workInProgressHook;
    var memoizedState = hook.memoizedState;
    var refs = memoizedState.refs;
    var prevGetSnapshot = refs.getSnapshot;
    var prevSource = memoizedState.source;
    var prevSubscribe = memoizedState.subscribe;
    var fiber = currentlyRenderingFiber;
    hook.memoizedState = {
        refs: refs,
        source: source,
        subscribe: subscribe,
    }; // Sync the values needed by our subscription handler after each commit.

    dispatcher.useEffect(
        function () {
            refs.getSnapshot = getSnapshot; // Normally the dispatch function for a state hook never changes,
            // but this hook recreates the queue in certain cases  to avoid updates from stale sources.
            // handleChange() below needs to reference the dispatch function without re-subscribing,
            // so we use a ref to ensure that it always has the latest version.

            refs.setSnapshot = setSnapshot; // Check for a possible change between when we last rendered now.

            var maybeNewVersion = getVersion(source._source);
            if (!is(version, maybeNewVersion)) {
                var maybeNewSnapshot = getSnapshot(source._source);
                if (!is(snapshot, maybeNewSnapshot)) {
                    setSnapshot(maybeNewSnapshot);
                    var lane = requestUpdateLane(fiber);
                    markRootMutableRead(root, lane);
                } // If the source mutated between render and now,
                // there may be state updates already scheduled from the old source.
                // Entangle the updates so that they render in the same batch.

                markRootEntangled(root, root.mutableReadLanes);
            }
        },
        [getSnapshot, source, subscribe]
    ); // If we got a new source or subscribe function, re-subscribe in a passive effect.

    dispatcher.useEffect(
        function () {
            var handleChange = function () {
                var latestGetSnapshot = refs.getSnapshot;
                var latestSetSnapshot = refs.setSnapshot;
                try {
                    latestSetSnapshot(latestGetSnapshot(source._source)); // Record a pending mutable source update with the same expiration time.

                    var lane = requestUpdateLane(fiber);
                    markRootMutableRead(root, lane);
                } catch (error) {
                    // A selector might throw after a source mutation.
                    // e.g. it might try to read from a part of the store that no longer exists.
                    // In this case we should still schedule an update with React.
                    // Worst case the selector will throw again and then an error boundary will handle it.
                    latestSetSnapshot(function () {
                        throw error;
                    });
                }
            };
            var unsubscribe = subscribe(source._source, handleChange);
            return unsubscribe;
        },
        [source, subscribe]
    ); // If any of the inputs to useMutableSource change, reading is potentially unsafe.
    //
    // If either the source or the subscription have changed we can't can't trust the update queue.
    // Maybe the source changed in a way that the old subscription ignored but the new one depends on.
    //
    // If the getSnapshot function changed, we also shouldn't rely on the update queue.
    // It's possible that the underlying source was mutated between the when the last "change" event fired,
    // and when the current render (with the new getSnapshot function) is processed.
    //
    // In both cases, we need to throw away pending updates (since they are no longer relevant)
    // and treat reading from the source as we do in the mount case.

    if (
        !is(prevGetSnapshot, getSnapshot) ||
        !is(prevSource, source) ||
        !is(prevSubscribe, subscribe)
    ) {
        // Create a new queue and setState method,
        // So if there are interleaved updates, they get pushed to the older queue.
        // When this becomes current, the previous queue and dispatch method will be discarded,
        // including any interleaving updates that occur.
        var newQueue = {
            pending: null,
            lanes: NoLanes,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: snapshot,
        };
        newQueue.dispatch = setSnapshot = dispatchSetState.bind(
            null,
            currentlyRenderingFiber,
            newQueue
        );
        stateHook.queue = newQueue;
        stateHook.baseQueue = null;
        snapshot = readFromUnsubscribedMutableSource(root, source, getSnapshot);
        stateHook.memoizedState = stateHook.baseState = snapshot;
    }
    return snapshot;
}
function mountMutableSource(source, getSnapshot, subscribe) {
    if (!enableUseMutableSource) {
        return undefined;
    }
    var hook = mountWorkInProgressHook();
    hook.memoizedState = {
        refs: {
            getSnapshot: getSnapshot,
            setSnapshot: null,
        },
        source: source,
        subscribe: subscribe,
    };
    return useMutableSource(hook, source, getSnapshot, subscribe);
}
function updateMutableSource(source, getSnapshot, subscribe) {
    if (!enableUseMutableSource) {
        return undefined;
    }
    var hook = updateWorkInProgressHook();
    return useMutableSource(hook, source, getSnapshot, subscribe);
}
function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
    var fiber = currentlyRenderingFiber;
    var hook = mountWorkInProgressHook();
    var nextSnapshot;
    var isHydrating = getIsHydrating();
    if (isHydrating) {
        if (getServerSnapshot === undefined) {
            throw new Error(
                'Missing getServerSnapshot, which is required for ' +
                    'server-rendered content. Will revert to client rendering.'
            );
        }
        nextSnapshot = getServerSnapshot();
    } else {
        nextSnapshot = getSnapshot();
        // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.
        //
        // We won't do this if we're hydrating server-rendered content, because if
        // the content is stale, it's already visible anyway. Instead we'll patch
        // it up in a passive effect.

        var root = getWorkInProgressRoot();
        if (root === null) {
            throw new Error(
                'Expected a work-in-progress root. This is a bug in React. Please file an issue.'
            );
        }
        if (!includesBlockingLane(root, renderLanes)) {
            pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
    } // Read the current snapshot from the store on every render. This breaks the
    // normal rules of React, and only works because store updates are
    // always synchronous.

    hook.memoizedState = nextSnapshot;
    var inst = {
        value: nextSnapshot,
        getSnapshot: getSnapshot,
    };
    hook.queue = inst; // Schedule an effect to subscribe to the store.

    mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
        subscribe,
    ]); // Schedule an effect to update the mutable instance fields. We will update
    // this whenever subscribe, getSnapshot, or value changes. Because there's no
    // clean-up function, and we track the deps correctly, we can call pushEffect
    // directly, without storing any additional state. For the same reason, we
    // don't need to set a static flag, either.
    // TODO: We can move this to the passive phase once we add a pre-commit
    // consistency check. See the next comment.

    fiber.flags |= PassiveEffect;
    pushEffect(
        HookHasEffect | HookPassive,
        updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot),
        undefined,
        null
    );
    return nextSnapshot;
}
function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
    var fiber = currentlyRenderingFiber;
    var hook = updateWorkInProgressHook(); // Read the current snapshot from the store on every render. This breaks the
    // normal rules of React, and only works because store updates are
    // always synchronous.

    var nextSnapshot = getSnapshot();
    var prevSnapshot = (currentHook || hook).memoizedState;
    var snapshotChanged = !is(prevSnapshot, nextSnapshot);
    if (snapshotChanged) {
        hook.memoizedState = nextSnapshot;
        markWorkInProgressReceivedUpdate();
    }
    var inst = hook.queue;
    updateEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
        subscribe,
    ]); // Whenever getSnapshot or subscribe changes, we need to check in the
    // commit phase if there was an interleaved mutation. In concurrent mode
    // this can happen all the time, but even in synchronous mode, an earlier
    // effect may have mutated the store.

    if (
        inst.getSnapshot !== getSnapshot ||
        snapshotChanged ||
        // Check if the susbcribe function changed. We can save some memory by
        // checking whether we scheduled a subscription effect above.
        (workInProgressHook !== null &&
            workInProgressHook.memoizedState.tag & HookHasEffect)
    ) {
        fiber.flags |= PassiveEffect;
        pushEffect(
            HookHasEffect | HookPassive,
            updateStoreInstance.bind(
                null,
                fiber,
                inst,
                nextSnapshot,
                getSnapshot
            ),
            undefined,
            null
        ); // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.

        var root = getWorkInProgressRoot();
        if (root === null) {
            throw new Error(
                'Expected a work-in-progress root. This is a bug in React. Please file an issue.'
            );
        }
        if (!includesBlockingLane(root, renderLanes)) {
            pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
    }
    return nextSnapshot;
}
function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
    fiber.flags |= StoreConsistency;
    var check = {
        getSnapshot: getSnapshot,
        value: renderedSnapshot,
    };
    var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.stores = [check];
    } else {
        var stores = componentUpdateQueue.stores;
        if (stores === null) {
            componentUpdateQueue.stores = [check];
        } else {
            stores.push(check);
        }
    }
}
function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
    // These are updated in the passive phase
    inst.value = nextSnapshot;
    inst.getSnapshot = getSnapshot; // Something may have been mutated in between render and commit. This could
    // have been in an event that fired before the passive effects, or it could
    // have been in a layout effect. In that case, we would have used the old
    // snapsho and getSnapshot values to bail out. We need to check one more time.

    if (checkIfSnapshotChanged(inst)) {
        // Force a re-render.
        forceStoreRerender(fiber);
    }
}
function subscribeToStore(fiber, inst, subscribe) {
    var handleStoreChange = function () {
        // The store changed. Check if the snapshot changed since the last time we
        // read from the store.
        if (checkIfSnapshotChanged(inst)) {
            // Force a re-render.
            forceStoreRerender(fiber);
        }
    }; // Subscribe to the store and return a clean-up function.

    return subscribe(handleStoreChange);
}
function checkIfSnapshotChanged(inst) {
    var latestGetSnapshot = inst.getSnapshot;
    var prevValue = inst.value;
    try {
        var nextValue = latestGetSnapshot();
        return !is(prevValue, nextValue);
    } catch (error) {
        return true;
    }
}
function forceStoreRerender(fiber) {
    var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
    if (root !== null) {
        scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
    }
}
function mountState(initialState) {
    var hook = mountWorkInProgressHook();
    if (typeof initialState === 'function') {
        // $FlowFixMe: Flow doesn't like mixed types
        initialState = initialState();
    }
    hook.memoizedState = hook.baseState = initialState;
    var queue = {
        pending: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: initialState,
    };
    hook.queue = queue;
    var dispatch = (queue.dispatch = dispatchSetState.bind(
        null,
        currentlyRenderingFiber,
        queue
    ));
    return [hook.memoizedState, dispatch];
}
function updateState(initialState) {
    return updateReducer(basicStateReducer, initialState);
}
function rerenderState(initialState) {
    return rerenderReducer(basicStateReducer, initialState);
}
function pushEffect(tag, create, destroy, deps) {
    var effect = {
        tag: tag,
        create: create,
        destroy: destroy,
        deps: deps,
        // Circular
        next: null,
    };
    var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        var lastEffect = componentUpdateQueue.lastEffect;
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            var firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
}
var stackContainsErrorMessage = null;
function getCallerStackFrame() {
    // eslint-disable-next-line react-internal/prod-error-codes
    var stackFrames = new Error('Error message').stack.split('\n'); // Some browsers (e.g. Chrome) include the error message in the stack
    // but others (e.g. Firefox) do not.

    if (stackContainsErrorMessage === null) {
        stackContainsErrorMessage = stackFrames[0].includes('Error message');
    }
    return stackContainsErrorMessage
        ? stackFrames.slice(3, 4).join('\n')
        : stackFrames.slice(2, 3).join('\n');
}
function mountRef(initialValue) {
    var hook = mountWorkInProgressHook();
    if (enableUseRefAccessWarning) {
        {
            var _ref = {
                current: initialValue,
            };
            hook.memoizedState = _ref;
            return _ref;
        }
    } else {
        var _ref2 = {
            current: initialValue,
        };
        hook.memoizedState = _ref2;
        return _ref2;
    }
}
function updateRef(initialValue) {
    var hook = updateWorkInProgressHook();
    return hook.memoizedState;
}
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
    var hook = mountWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        undefined,
        nextDeps
    );
}
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
    var hook = updateWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    var destroy = undefined;
    if (currentHook !== null) {
        var prevEffect = currentHook.memoizedState;
        destroy = prevEffect.destroy;
        if (nextDeps !== null) {
            var prevDeps = prevEffect.deps;
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                hook.memoizedState = pushEffect(
                    hookFlags,
                    create,
                    destroy,
                    nextDeps
                );
                return;
            }
        }
    }
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        destroy,
        nextDeps
    );
}
function mountEffect(create, deps) {
    {
        mountEffectImpl(
            PassiveEffect | PassiveStaticEffect,
            HookPassive,
            create,
            deps
        );
    }
}
function updateEffect(create, deps) {
    updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}
function useEffectEventImpl(payload) {
    currentlyRenderingFiber.flags |= UpdateEffect;
    var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.events = [payload];
    } else {
        var events = componentUpdateQueue.events;
        if (events === null) {
            componentUpdateQueue.events = [payload];
        } else {
            events.push(payload);
        }
    }
}
function mountEvent(callback) {
    var hook = mountWorkInProgressHook();
    var ref = {
        impl: callback,
    };
    hook.memoizedState = ref; // $FlowIgnore[incompatible-return]

    return function eventFn() {
        if (isInvalidExecutionContextForEventFunction()) {
            throw new Error(
                "A function wrapped in useEffectEvent can't be called during rendering."
            );
        }
        return ref.impl.apply(undefined, arguments);
    };
}
function updateEvent(callback) {
    var hook = updateWorkInProgressHook();
    var ref = hook.memoizedState;
    useEffectEventImpl({
        ref: ref,
        nextImpl: callback,
    }); // $FlowIgnore[incompatible-return]

    return function eventFn() {
        if (isInvalidExecutionContextForEventFunction()) {
            throw new Error(
                "A function wrapped in useEffectEvent can't be called during rendering."
            );
        }
        return ref.impl.apply(undefined, arguments);
    };
}
function mountInsertionEffect(create, deps) {
    mountEffectImpl(UpdateEffect, HookInsertion, create, deps);
}
function updateInsertionEffect(create, deps) {
    return updateEffectImpl(UpdateEffect, HookInsertion, create, deps);
}
function mountLayoutEffect(create, deps) {
    var fiberFlags = UpdateEffect | LayoutStaticEffect;
    return mountEffectImpl(fiberFlags, HookLayout, create, deps);
}
function updateLayoutEffect(create, deps) {
    return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}
function imperativeHandleEffect(create, ref) {
    if (typeof ref === 'function') {
        var refCallback = ref;
        var inst = create();
        refCallback(inst);
        return function () {
            refCallback(null);
        };
    } else if (ref !== null && ref !== undefined) {
        var refObject = ref;
        var _inst = create();
        refObject.current = _inst;
        return function () {
            refObject.current = null;
        };
    }
}
function mountImperativeHandle(ref, create, deps) {
    // TODO: If deps are provided, should we skip comparing the ref itself?

    var effectDeps =
        deps !== null && deps !== undefined ? deps.concat([ref]) : null;
    var fiberFlags = UpdateEffect | LayoutStaticEffect;
    mountEffectImpl(
        fiberFlags,
        HookLayout,
        imperativeHandleEffect.bind(null, create, ref),
        effectDeps
    );
}
function updateImperativeHandle(ref, create, deps) {
    // TODO: If deps are provided, should we skip comparing the ref itself?

    var effectDeps =
        deps !== null && deps !== undefined ? deps.concat([ref]) : null;
    updateEffectImpl(
        UpdateEffect,
        HookLayout,
        imperativeHandleEffect.bind(null, create, ref),
        effectDeps
    );
}
function mountDebugValue(value, formatterFn) {
    // This hook is normally a no-op.
    // The react-debug-hooks package injects its own implementation
    // so that e.g. DevTools can display custom hook values.
}
var updateDebugValue = mountDebugValue;
function mountCallback(callback, deps) {
    var hook = mountWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    hook.memoizedState = [callback, nextDeps];
    return callback;
}
function updateCallback(callback, deps) {
    var hook = updateWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    var prevState = hook.memoizedState;
    if (prevState !== null) {
        if (nextDeps !== null) {
            var prevDeps = prevState[1];
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                return prevState[0];
            }
        }
    }
    hook.memoizedState = [callback, nextDeps];
    return callback;
}
function mountMemo(nextCreate, deps) {
    var hook = mountWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    if (shouldDoubleInvokeUserFnsInHooksDEV) {
        nextCreate();
    }
    var nextValue = nextCreate();
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
}
function updateMemo(nextCreate, deps) {
    var hook = updateWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    var prevState = hook.memoizedState;
    if (prevState !== null) {
        // Assume these are defined. If they're not, areHookInputsEqual will warn.
        if (nextDeps !== null) {
            var prevDeps = prevState[1];
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                return prevState[0];
            }
        }
    }
    if (shouldDoubleInvokeUserFnsInHooksDEV) {
        nextCreate();
    }
    var nextValue = nextCreate();
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
}
function mountDeferredValue(value) {
    var hook = mountWorkInProgressHook();
    hook.memoizedState = value;
    return value;
}
function updateDeferredValue(value) {
    var hook = updateWorkInProgressHook();
    var resolvedCurrentHook = currentHook;
    var prevValue = resolvedCurrentHook.memoizedState;
    return updateDeferredValueImpl(hook, prevValue, value);
}
function rerenderDeferredValue(value) {
    var hook = updateWorkInProgressHook();
    if (currentHook === null) {
        // This is a rerender during a mount.
        hook.memoizedState = value;
        return value;
    } else {
        // This is a rerender during an update.
        var prevValue = currentHook.memoizedState;
        return updateDeferredValueImpl(hook, prevValue, value);
    }
}
function updateDeferredValueImpl(hook, prevValue, value) {
    var shouldDeferValue = !includesOnlyNonUrgentLanes(renderLanes);
    if (shouldDeferValue) {
        // This is an urgent update. If the value has changed, keep using the
        // previous value and spawn a deferred render to update it later.
        if (!is(value, prevValue)) {
            // Schedule a deferred render
            var deferredLane = claimNextTransitionLane();
            currentlyRenderingFiber.lanes = mergeLanes(
                currentlyRenderingFiber.lanes,
                deferredLane
            );
            markSkippedUpdateLanes(deferredLane); // Set this to true to indicate that the rendered value is inconsistent
            // from the latest value. The name "baseState" doesn't really match how we
            // use it because we're reusing a state hook field instead of creating a
            // new one.

            hook.baseState = true;
        } // Reuse the previous value

        return prevValue;
    } else {
        // This is not an urgent update, so we can use the latest value regardless
        // of what it is. No need to defer it.
        // However, if we're currently inside a spawned render, then we need to mark
        // this as an update to prevent the fiber from bailing out.
        //
        // `baseState` is true when the current value is different from the rendered
        // value. The name doesn't really match how we use it because we're reusing
        // a state hook field instead of creating a new one.
        if (hook.baseState) {
            // Flip this back to false.
            hook.baseState = false;
            markWorkInProgressReceivedUpdate();
        }
        hook.memoizedState = value;
        return value;
    }
}
function startTransition(setPending, callback, options) {
    var previousPriority = getCurrentUpdatePriority();
    setCurrentUpdatePriority(
        higherEventPriority(previousPriority, ContinuousEventPriority)
    );
    setPending(true);
    var prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = {};
    var currentTransition = ReactCurrentBatchConfig.transition;
    if (enableTransitionTracing) {
        if (options !== undefined && options.name !== undefined) {
            ReactCurrentBatchConfig.transition.name = options.name;
            ReactCurrentBatchConfig.transition.startTime = now();
        }
    }
    try {
        setPending(false);
        callback();
    } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}
function mountTransition() {
    var _mountState = mountState(false),
        isPending = _mountState[0],
        setPending = _mountState[1]; // The `start` method never changes.

    var start = startTransition.bind(null, setPending);
    var hook = mountWorkInProgressHook();
    hook.memoizedState = start;
    return [isPending, start];
}
function updateTransition() {
    var _updateState = updateState(false),
        isPending = _updateState[0];
    var hook = updateWorkInProgressHook();
    var start = hook.memoizedState;
    return [isPending, start];
}
function rerenderTransition() {
    var _rerenderState = rerenderState(false),
        isPending = _rerenderState[0];
    var hook = updateWorkInProgressHook();
    var start = hook.memoizedState;
    return [isPending, start];
}
function mountId() {
    var hook = mountWorkInProgressHook();
    var root = getWorkInProgressRoot(); // TODO: In Fizz, id generation is specific to each server config. Maybe we
    // should do this in Fiber, too? Deferring this decision for now because
    // there's no other place to store the prefix except for an internal field on
    // the public createRoot object, which the fiber tree does not currently have
    // a reference to.

    var identifierPrefix = root.identifierPrefix;
    var id;
    if (getIsHydrating()) {
        var treeId = getTreeId(); // Use a captial R prefix for server-generated ids.

        id = ':' + identifierPrefix + 'R' + treeId; // Unless this is the first id at this level, append a number at the end
        // that represents the position of this useId hook among all the useId
        // hooks for this fiber.

        var localId = localIdCounter++;
        if (localId > 0) {
            id += 'H' + localId.toString(32);
        }
        id += ':';
    } else {
        // Use a lowercase r prefix for client-generated ids.
        var globalClientId = globalClientIdCounter++;
        id = ':' + identifierPrefix + 'r' + globalClientId.toString(32) + ':';
    }
    hook.memoizedState = id;
    return id;
}
function updateId() {
    var hook = updateWorkInProgressHook();
    var id = hook.memoizedState;
    return id;
}
function mountRefresh() {
    var hook = mountWorkInProgressHook();
    var refresh = (hook.memoizedState = refreshCache.bind(
        null,
        currentlyRenderingFiber
    ));
    return refresh;
}
function updateRefresh() {
    var hook = updateWorkInProgressHook();
    return hook.memoizedState;
}
function refreshCache(fiber, seedKey, seedValue) {
    if (!enableCache) {
        return;
    } // TODO: Does Cache work in legacy mode? Should decide and write a test.
    // TODO: Consider warning if the refresh is at discrete priority, or if we
    // otherwise suspect that it wasn't batched properly.

    var provider = fiber.return;
    while (provider !== null) {
        switch (provider.tag) {
            case CacheComponent:
            case HostRoot: {
                // Schedule an update on the cache boundary to trigger a refresh.
                var lane = requestUpdateLane(provider);
                var eventTime = requestEventTime();
                var refreshUpdate = createLegacyQueueUpdate(eventTime, lane);
                var root = enqueueLegacyQueueUpdate(
                    provider,
                    refreshUpdate,
                    lane
                );
                if (root !== null) {
                    scheduleUpdateOnFiber(root, provider, lane, eventTime);
                    entangleLegacyQueueTransitions(root, provider, lane);
                } // TODO: If a refresh never commits, the new cache created here must be
                // released. A simple case is start refreshing a cache boundary, but then
                // unmount that boundary before the refresh completes.

                var seededCache = createCache();
                if (
                    seedKey !== null &&
                    seedKey !== undefined &&
                    root !== null
                ) {
                    if (enableLegacyCache) {
                        // Seed the cache with the value passed by the caller. This could be
                        // from a server mutation, or it could be a streaming response.
                        seededCache.data.set(seedKey, seedValue);
                    } else {
                    }
                }
                var payload = {
                    cache: seededCache,
                };
                refreshUpdate.payload = payload;
                return;
            }
        }
        provider = provider.return;
    } // TODO: Warn if unmounted?
}

function dispatchReducerAction(fiber, queue, action) {
    var lane = requestUpdateLane(fiber);
    var update = {
        lane: lane,
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null,
    };
    if (isRenderPhaseUpdate(fiber)) {
        enqueueRenderPhaseUpdate(queue, update);
    } else {
        var root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
        if (root !== null) {
            var eventTime = requestEventTime();
            scheduleUpdateOnFiber(root, fiber, lane, eventTime);
            entangleTransitionUpdate(root, queue, lane);
        }
    }
    markUpdateInDevTools(fiber, lane, action);
}
function dispatchSetState(fiber, queue, action) {
    var lane = requestUpdateLane(fiber);
    var update = {
        lane: lane,
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null,
    };
    if (isRenderPhaseUpdate(fiber)) {
        enqueueRenderPhaseUpdate(queue, update);
    } else {
        var alternate = fiber.alternate;
        if (
            fiber.lanes === NoLanes &&
            (alternate === null || alternate.lanes === NoLanes)
        ) {
            // The queue is currently empty, which means we can eagerly compute the
            // next state before entering the render phase. If the new state is the
            // same as the current state, we may be able to bail out entirely.
            var lastRenderedReducer = queue.lastRenderedReducer;
            if (lastRenderedReducer !== null) {
                var prevDispatcher;
                try {
                    var currentState = queue.lastRenderedState;
                    var eagerState = lastRenderedReducer(currentState, action); // Stash the eagerly computed state, and the reducer used to compute
                    // it, on the update object. If the reducer hasn't changed by the
                    // time we enter the render phase, then the eager state can be used
                    // without calling the reducer again.

                    update.hasEagerState = true;
                    update.eagerState = eagerState;
                    if (is(eagerState, currentState)) {
                        // Fast path. We can bail out without scheduling React to re-render.
                        // It's still possible that we'll need to rebase this update later,
                        // if the component re-renders for a different reason and by that
                        // time the reducer has changed.
                        // TODO: Do we still need to entangle transitions in this case?
                        enqueueConcurrentHookUpdateAndEagerlyBailout(
                            fiber,
                            queue,
                            update
                        );
                        return;
                    }
                } catch (error) {
                    // Suppress the error. It will throw again in the render phase.
                } finally {
                }
            }
        }
        var root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
        if (root !== null) {
            var eventTime = requestEventTime();
            scheduleUpdateOnFiber(root, fiber, lane, eventTime);
            entangleTransitionUpdate(root, queue, lane);
        }
    }
    markUpdateInDevTools(fiber, lane, action);
}
function isRenderPhaseUpdate(fiber) {
    var alternate = fiber.alternate;
    return (
        fiber === currentlyRenderingFiber ||
        (alternate !== null && alternate === currentlyRenderingFiber)
    );
}
function enqueueRenderPhaseUpdate(queue, update) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdateDuringThisPass =
        didScheduleRenderPhaseUpdate = true;
    var pending = queue.pending;
    if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }
    queue.pending = update;
} // TODO: Move to ReactFiberConcurrentUpdates?

function entangleTransitionUpdate(root, queue, lane) {
    if (isTransitionLane(lane)) {
        var queueLanes = queue.lanes; // If any entangled lanes are no longer pending on the root, then they
        // must have finished. We can remove them from the shared queue, which
        // represents a superset of the actually pending lanes. In some cases we
        // may entangle more than we need to, but that's OK. In fact it's worse if
        // we *don't* entangle when we should.

        queueLanes = intersectLanes(queueLanes, root.pendingLanes); // Entangle the new transition lane with the other transition lanes.

        var newQueueLanes = mergeLanes(queueLanes, lane);
        queue.lanes = newQueueLanes; // Even if queue.lanes already include lane, we don't know for certain if
        // the lane finished since the last time we entangled it. So we need to
        // entangle it again, just to be sure.

        markRootEntangled(root, newQueueLanes);
    }
}
function markUpdateInDevTools(fiber, lane, action) {
    if (enableSchedulingProfiler) {
        markStateUpdateScheduled(fiber, lane);
    }
}
export var ContextOnlyDispatcher = {
    readContext: readContext,
    useCallback: throwInvalidHookError,
    useContext: throwInvalidHookError,
    useEffect: throwInvalidHookError,
    useImperativeHandle: throwInvalidHookError,
    useInsertionEffect: throwInvalidHookError,
    useLayoutEffect: throwInvalidHookError,
    useMemo: throwInvalidHookError,
    useReducer: throwInvalidHookError,
    useRef: throwInvalidHookError,
    useState: throwInvalidHookError,
    useDebugValue: throwInvalidHookError,
    useDeferredValue: throwInvalidHookError,
    useTransition: throwInvalidHookError,
    useMutableSource: throwInvalidHookError,
    useSyncExternalStore: throwInvalidHookError,
    useId: throwInvalidHookError,
};
if (enableCache) {
    ContextOnlyDispatcher.useCacheRefresh = throwInvalidHookError;
}
if (enableUseHook) {
    ContextOnlyDispatcher.use = throwInvalidHookError;
}
if (enableUseMemoCacheHook) {
    ContextOnlyDispatcher.useMemoCache = throwInvalidHookError;
}
if (enableUseEffectEventHook) {
    ContextOnlyDispatcher.useEffectEvent = throwInvalidHookError;
}
var HooksDispatcherOnMount = {
    readContext: readContext,
    useCallback: mountCallback,
    useContext: readContext,
    useEffect: mountEffect,
    useImperativeHandle: mountImperativeHandle,
    useLayoutEffect: mountLayoutEffect,
    useInsertionEffect: mountInsertionEffect,
    useMemo: mountMemo,
    useReducer: mountReducer,
    useRef: mountRef,
    useState: mountState,
    useDebugValue: mountDebugValue,
    useDeferredValue: mountDeferredValue,
    useTransition: mountTransition,
    useMutableSource: mountMutableSource,
    useSyncExternalStore: mountSyncExternalStore,
    useId: mountId,
};
if (enableCache) {
    HooksDispatcherOnMount.useCacheRefresh = mountRefresh;
}
if (enableUseHook) {
    HooksDispatcherOnMount.use = use;
}
if (enableUseMemoCacheHook) {
    HooksDispatcherOnMount.useMemoCache = useMemoCache;
}
if (enableUseEffectEventHook) {
    HooksDispatcherOnMount.useEffectEvent = mountEvent;
}
var HooksDispatcherOnUpdate = {
    readContext: readContext,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useInsertionEffect: updateInsertionEffect,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: updateReducer,
    useRef: updateRef,
    useState: updateState,
    useDebugValue: updateDebugValue,
    useDeferredValue: updateDeferredValue,
    useTransition: updateTransition,
    useMutableSource: updateMutableSource,
    useSyncExternalStore: updateSyncExternalStore,
    useId: updateId,
};
if (enableCache) {
    HooksDispatcherOnUpdate.useCacheRefresh = updateRefresh;
}
if (enableUseMemoCacheHook) {
    HooksDispatcherOnUpdate.useMemoCache = useMemoCache;
}
if (enableUseHook) {
    HooksDispatcherOnUpdate.use = use;
}
if (enableUseEffectEventHook) {
    HooksDispatcherOnUpdate.useEffectEvent = updateEvent;
}
var HooksDispatcherOnRerender = {
    readContext: readContext,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useInsertionEffect: updateInsertionEffect,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: rerenderReducer,
    useRef: updateRef,
    useState: rerenderState,
    useDebugValue: updateDebugValue,
    useDeferredValue: rerenderDeferredValue,
    useTransition: rerenderTransition,
    useMutableSource: updateMutableSource,
    useSyncExternalStore: updateSyncExternalStore,
    useId: updateId,
};
if (enableCache) {
    HooksDispatcherOnRerender.useCacheRefresh = updateRefresh;
}
if (enableUseHook) {
    HooksDispatcherOnRerender.use = use;
}
if (enableUseMemoCacheHook) {
    HooksDispatcherOnRerender.useMemoCache = useMemoCache;
}
if (enableUseEffectEventHook) {
    HooksDispatcherOnRerender.useEffectEvent = updateEvent;
}
var HooksDispatcherOnMountInDEV = null;
var HooksDispatcherOnMountWithHookTypesInDEV = null;
var HooksDispatcherOnUpdateInDEV = null;
var HooksDispatcherOnRerenderInDEV = null;
var InvalidNestedHooksDispatcherOnMountInDEV = null;
var InvalidNestedHooksDispatcherOnUpdateInDEV = null;
var InvalidNestedHooksDispatcherOnRerenderInDEV = null;
