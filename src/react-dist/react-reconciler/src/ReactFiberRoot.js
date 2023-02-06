import {
    noTimeout,
    supportsHydration,
} from '../../react-dom-bindings/src/client/ReactDOMHostConfig';
import { createHostRootFiber } from './ReactFiber';
import {
    NoLane,
    NoLanes,
    NoTimestamp,
    TotalLanes,
    createLaneMap,
} from './ReactFiberLane';
import {
    enableSuspenseCallback,
    enableCache,
    enableProfilerCommitHooks,
    enableProfilerTimer,
    enableUpdaterTracking,
    enableTransitionTracing,
} from '../../shared/ReactFeatureFlags';
import { initializeUpdateQueue } from './ReactFiberClassUpdateQueue';
import { LegacyRoot, ConcurrentRoot } from './ReactRootTags';
import { createCache, retainCache } from './ReactFiberCacheComponent';
function FiberRootNode(
    containerInfo,
    // $FlowFixMe[missing-local-annot]
    tag,
    hydrate,
    identifierPrefix,
    onRecoverableError
) {
    this.tag = tag;
    this.containerInfo = containerInfo;
    this.pendingChildren = null;
    this.current = null;
    this.pingCache = null;
    this.finishedWork = null;
    this.timeoutHandle = noTimeout;
    this.context = null;
    this.pendingContext = null;
    this.callbackNode = null;
    this.callbackPriority = NoLane;
    this.eventTimes = createLaneMap(NoLanes);
    this.expirationTimes = createLaneMap(NoTimestamp);
    this.pendingLanes = NoLanes;
    this.suspendedLanes = NoLanes;
    this.pingedLanes = NoLanes;
    this.expiredLanes = NoLanes;
    this.mutableReadLanes = NoLanes;
    this.finishedLanes = NoLanes;
    this.errorRecoveryDisabledLanes = NoLanes;
    this.entangledLanes = NoLanes;
    this.entanglements = createLaneMap(NoLanes);
    this.hiddenUpdates = createLaneMap(null);
    this.identifierPrefix = identifierPrefix;
    this.onRecoverableError = onRecoverableError;
    if (enableCache) {
        this.pooledCache = null;
        this.pooledCacheLanes = NoLanes;
    }
    if (supportsHydration) {
        this.mutableSourceEagerHydrationData = null;
    }
    if (enableSuspenseCallback) {
        this.hydrationCallbacks = null;
    }
    this.incompleteTransitions = new Map();
    if (enableTransitionTracing) {
        this.transitionCallbacks = null;
        var transitionLanesMap = (this.transitionLanes = []);
        for (var i = 0; i < TotalLanes; i++) {
            transitionLanesMap.push(null);
        }
    }
    if (enableProfilerTimer && enableProfilerCommitHooks) {
        this.effectDuration = 0;
        this.passiveEffectDuration = 0;
    }
    if (enableUpdaterTracking) {
        this.memoizedUpdaters = new Set();
        var pendingUpdatersLaneMap = (this.pendingUpdatersLaneMap = []);
        for (var _i = 0; _i < TotalLanes; _i++) {
            pendingUpdatersLaneMap.push(new Set());
        }
    }
}
export function createFiberRoot(
    containerInfo,
    tag,
    hydrate,
    initialChildren,
    hydrationCallbacks,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
    // TODO: We have several of these arguments that are conceptually part of the
    // host config, but because they are passed in at runtime, we have to thread
    // them through the root constructor. Perhaps we should put them all into a
    // single type, like a DynamicHostConfig that is defined by the renderer.
    identifierPrefix,
    onRecoverableError,
    transitionCallbacks
) {
    // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
    var root = new FiberRootNode(
        containerInfo,
        tag,
        hydrate,
        identifierPrefix,
        onRecoverableError
    );
    if (enableSuspenseCallback) {
        root.hydrationCallbacks = hydrationCallbacks;
    }
    if (enableTransitionTracing) {
        root.transitionCallbacks = transitionCallbacks;
    } // Cyclic construction. This cheats the type system right now because
    // stateNode is any.

    var uninitializedFiber = createHostRootFiber(
        tag,
        isStrictMode,
        concurrentUpdatesByDefaultOverride
    );
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    if (enableCache) {
        var initialCache = createCache();
        retainCache(initialCache); // The pooledCache is a fresh cache instance that is used temporarily
        // for newly mounted boundaries during a render. In general, the
        // pooledCache is always cleared from the root at the end of a render:
        // it is either released when render commits, or moved to an Offscreen
        // component if rendering suspends. Because the lifetime of the pooled
        // cache is distinct from the main memoizedState.cache, it must be
        // retained separately.

        root.pooledCache = initialCache;
        retainCache(initialCache);
        var initialState = {
            element: initialChildren,
            isDehydrated: hydrate,
            cache: initialCache,
        };
        uninitializedFiber.memoizedState = initialState;
    } else {
        var _initialState = {
            element: initialChildren,
            isDehydrated: hydrate,
            cache: null, // not enabled yet
        };

        uninitializedFiber.memoizedState = _initialState;
    }
    initializeUpdateQueue(uninitializedFiber);
    return root;
}
