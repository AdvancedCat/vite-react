// -----------------------------------------------------------------------------
// Land or remove (zero effort)
//
// Flags that can likely be deleted or landed without consequences
// -----------------------------------------------------------------------------
export var enableComponentStackLocations = true;
export var disableSchedulerTimeoutBasedOnReactExpirationTime = false; // -----------------------------------------------------------------------------
// Land or remove (moderate effort)
//
// Flags that can be probably deleted or landed, but might require extra effort
// like migrating internal callers or performance testing.
// -----------------------------------------------------------------------------
// This rolled out to 10% public in www, so we should be able to land, but some
// internal tests need to be updated. The open source behavior is correct.

export var skipUnmountedBoundaries = true; // TODO: Finish rolling out in www

export var enableClientRenderFallbackOnTextMismatch = true; // TODO: Need to review this code one more time before landing

export var enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay = true; // Recoil still uses useMutableSource in www, need to delete

export var enableUseMutableSource = false; // Not sure if www still uses this. We don't have a replacement but whatever we
// replace it with will likely be different than what's already there, so we
// probably should just delete it as long as nothing in www relies on it.

export var enableSchedulerDebugging = false; // Need to remove didTimeout argument from Scheduler before landing

export var disableSchedulerTimeoutInWorkLoop = false; // -----------------------------------------------------------------------------
// Slated for removal in the future (significant effort)
//
// These are experiments that didn't work out, and never shipped, but we can't
// delete from the codebase until we migrate internal callers.
// -----------------------------------------------------------------------------
// Add a callback property to suspense to notify which promises are currently
// in the update queue. This allows reporting and tracing of what is causing
// the user to see a loading state.
//
// Also allows hydration callbacks to fire when a dehydrated boundary gets
// hydrated or deleted.
//
// This will eventually be replaced by the Transition Tracing proposal.

export var enableSuspenseCallback = false; // Experimental Scope support.

export var enableScopeAPI = false; // Experimental Create Event Handle API.

export var enableCreateEventHandleAPI = false; // Support legacy Primer support on internal FB www

export var enableLegacyFBSupport = false; // -----------------------------------------------------------------------------
// Ongoing experiments
//
// These are features that we're either actively exploring or are reasonably
// likely to include in an upcoming release.
// -----------------------------------------------------------------------------

export var enableCache = true;
export var enableLegacyCache = false;
export var enableCacheElement = false;
export var enableFetchInstrumentation = true;
export var enableTransitionTracing = false; // No known bugs, but needs performance testing

export var enableLazyContextPropagation = false; // FB-only usage. The new API has different semantics.

export var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber

export var enableSuspenseAvoidThisFallback = false; // Enables unstable_avoidThisFallback feature in Fizz

export var enableSuspenseAvoidThisFallbackFizz = false;
export var enableCPUSuspense = false;
export var enableHostSingletons = true;
export var enableFloat = true; // When a node is unmounted, recurse into the Fiber subtree and clean out
// references. Each level cleans up more fiber fields than the previous level.
// As far as we know, React itself doesn't leak, but because the Fiber contains
// cycles, even a single leak in product code can cause us to retain large
// amounts of memory.
//
// The long term plan is to remove the cycles, but in the meantime, we clear
// additional fields to mitigate.
//
// It's an enum so that we can experiment with different levels of
// aggressiveness.

export var deletedTreeCleanUpLevel = 3;
export var enableUseHook = true; // Enables unstable_useMemoCache hook, intended as a compilation target for
// auto-memoization.

export var enableUseMemoCacheHook = false;
export var enableUseEffectEventHook = false; // Test in www before enabling in open source.
// Enables DOM-server to stream its instruction set as data-attributes
// (handled with an MutationObserver) instead of inline-scripts

export var enableFizzExternalRuntime = false; // -----------------------------------------------------------------------------
// Chopping Block
//
// Planned feature deprecations and breaking changes. Sorted roughly in order of
// when we plan to enable them.
// -----------------------------------------------------------------------------
// This flag enables Strict Effects by default. We're not turning this on until
// after 18 because it requires migration work. Recommendation is to use
// <StrictMode /> to gradually upgrade components.
// If TRUE, trees rendered with createRoot will be StrictEffectsMode.
// If FALSE, these trees will be StrictLegacyMode.

export var createRootStrictEffectsByDefault = false;
export var disableModulePatternComponents = false;
export var disableLegacyContext = false;
export var enableUseRefAccessWarning = false; // Enables time slicing for updates that aren't wrapped in startTransition.

export var enableSyncDefaultUpdates = true;
export var enableUnifiedSyncLane = false; // Adds an opt-in to time slicing for updates that aren't wrapped in
// startTransition. Only relevant when enableSyncDefaultUpdates is disabled.

export var allowConcurrentByDefault = false; // Updates that occur in the render phase are not officially supported. But when
// they do occur, we defer them to a subsequent render by picking a lane that's
// not currently rendering. We treat them the same as if they came from an
// interleaved event. Remove this flag once we have migrated to the
// new behavior.
// NOTE: Not sure if we'll end up doing this or not.

export var deferRenderPhaseUpdateToNextBatch = false; // -----------------------------------------------------------------------------
// React DOM Chopping Block
//
// Similar to main Chopping Block but only flags related to React DOM. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------
// Disable support for comment nodes as React DOM containers. Already disabled
// in open source, but www codebase still relies on it. Need to remove.

export var disableCommentsAsDOMContainers = true; // Disable javascript: URL strings in href for XSS protection.

export var disableJavaScriptURLs = false;
export var enableTrustedTypesIntegration = false; // Prevent the value and checked attributes from syncing with their related
// DOM properties

export var disableInputAttributeSyncing = false; // Filter certain DOM attributes (e.g. src, href) if their values are empty
// strings. This prevents e.g. <img src=""> from making an unnecessary HTTP
// request for certain browsers.

export var enableFilterEmptyStringAttributesDOM = false; // Changes the behavior for rendering custom elements in both server rendering
// and client rendering, mostly to allow JSX attributes to apply to the custom
// element's object properties instead of only HTML attributes.
// https://github.com/facebook/react/issues/11347

export var enableCustomElementPropertySupport = false; // Disables children for <textarea> elements

export var disableTextareaChildren = false; // -----------------------------------------------------------------------------
// JSX Chopping Block
//
// Similar to main Chopping Block but only flags related to JSX. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------
// New API for JSX transforms to target - https://github.com/reactjs/rfcs/pull/107
// Part of the simplification of React.createElement so we can eventually move
// from React.createElement to React.jsx
// https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md

export var warnAboutDefaultPropsOnFunctionComponents = true; // deprecate later, not 18.0
// Enables a warning when trying to spread a 'key' to an element;
// a deprecated pattern we want to get rid of in the future

export var warnAboutSpreadingKeyToJSX = true;
export var warnAboutStringRefs = true; // -----------------------------------------------------------------------------
// Debugging and DevTools
// -----------------------------------------------------------------------------
// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.

export var enableSchedulingProfiler = true; // Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.

export var debugRenderPhaseSideEffectsForStrictMode = false; // To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.

export var replayFailedUnitOfWorkWithInvokeGuardedCallback = false; // Gather advanced timing metrics for Profiler subtrees.

export var enableProfilerTimer = true; // Record durations for commit and passive effects phases.

export var enableProfilerCommitHooks = true; // Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".

export var enableProfilerNestedUpdatePhase = true; // Adds verbose console logging for e.g. state updates, suspense, and work loop
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.

export var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

export var enableUpdaterTracking = true; // Only enabled in RN, related to enableComponentStackLocations

export var disableNativeComponentFrames = false;
export var enableServerContext = true; // Internal only.

export var enableGetInspectorDataForInstanceInProduction = false; // Profiler API accepts a function to be called when a nested update is scheduled.
// This callback accepts the component type (class instance or function) the update is scheduled for.

export var enableProfilerNestedUpdateScheduledHook = false;
export var consoleManagedByDevToolsDuringStrictMode = true; // Modern <StrictMode /> behaviour aligns more with what components
// components will encounter in production, especially when used With <Offscreen />.
// TODO: clean up legacy <StrictMode /> once tests pass WWW.

export var useModernStrictMode = false;
