import { error as _consoleError } from '../../../shared/consoleWithStackDev';
import {
    findDOMNode,
    render,
    hydrate,
    unstable_renderSubtreeIntoContainer,
    unmountComponentAtNode,
} from './ReactDOMLegacy';
import {
    createRoot as createRootImpl,
    hydrateRoot as hydrateRootImpl,
    isValidContainer,
} from './ReactDOMRoot';
import { createEventHandle } from '../../../react-dom-bindings/src/client/ReactDOMEventHandle';
import {
    batchedUpdates,
    discreteUpdates,
    flushSync as flushSyncWithoutWarningIfAlreadyRendering,
    isAlreadyRendering,
    flushControlled,
    injectIntoDevTools,
    attemptSynchronousHydration,
    attemptDiscreteHydration,
    attemptContinuousHydration,
    attemptHydrationAtCurrentPriority,
} from '../../../react-reconciler/src/ReactFiberReconciler';
import {
    runWithPriority,
    getCurrentUpdatePriority,
} from '../../../react-reconciler/src/ReactEventPriorities';
import { createPortal as createPortalImpl } from '../../../react-reconciler/src/ReactPortal';
import { canUseDOM } from '../../../shared/ExecutionEnvironment';
import ReactVersion from '../../../shared/ReactVersion';
import {
    getClosestInstanceFromNode,
    getInstanceFromNode,
    getNodeFromInstance,
    getFiberCurrentPropsFromNode,
} from '../../../react-dom-bindings/src/client/ReactDOMComponentTree';
import { restoreControlledState } from '../../../react-dom-bindings/src/client/ReactDOMComponent';
import {
    setAttemptSynchronousHydration,
    setAttemptDiscreteHydration,
    setAttemptContinuousHydration,
    setAttemptHydrationAtCurrentPriority,
    setGetCurrentUpdatePriority,
    setAttemptHydrationAtPriority,
} from '../../../react-dom-bindings/src/events/ReactDOMEventReplaying';
import { setBatchingImplementation } from '../../../react-dom-bindings/src/events/ReactDOMUpdateBatching';
import {
    setRestoreImplementation,
    enqueueStateRestore,
    restoreStateIfNeeded,
} from '../../../react-dom-bindings/src/events/ReactDOMControlledComponent';
import Internals from '../ReactDOMSharedInternals';
export {
    preinit,
    preload,
} from '../../../react-dom-bindings/src/shared/ReactDOMFloat';
setAttemptSynchronousHydration(attemptSynchronousHydration);
setAttemptDiscreteHydration(attemptDiscreteHydration);
setAttemptContinuousHydration(attemptContinuousHydration);
setAttemptHydrationAtCurrentPriority(attemptHydrationAtCurrentPriority);
setGetCurrentUpdatePriority(getCurrentUpdatePriority);
setAttemptHydrationAtPriority(runWithPriority);
setRestoreImplementation(restoreControlledState);
setBatchingImplementation(
    batchedUpdates,
    discreteUpdates,
    flushSyncWithoutWarningIfAlreadyRendering
);
function createPortal(children, container) {
    var key =
        arguments.length > 2 && arguments[2] !== undefined
            ? arguments[2]
            : null;
    if (!isValidContainer(container)) {
        throw new Error('Target container is not a DOM element.');
    } // TODO: pass ReactDOM portal implementation as third argument
    // $FlowFixMe The Flow type is opaque but there's no way to actually create it.

    return createPortalImpl(children, container, null, key);
}
function renderSubtreeIntoContainer(
    parentComponent,
    element,
    containerNode,
    callback
) {
    return unstable_renderSubtreeIntoContainer(
        parentComponent,
        element,
        containerNode,
        callback
    );
}
function createRoot(container, options) {
    return createRootImpl(container, options);
}
function hydrateRoot(container, initialChildren, options) {
    return hydrateRootImpl(container, initialChildren, options);
} // Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
// eslint-disable-next-line no-redeclare
// eslint-disable-next-line no-redeclare

function flushSync(fn) {
    return flushSyncWithoutWarningIfAlreadyRendering(fn);
}
export {
    createPortal,
    batchedUpdates as unstable_batchedUpdates,
    flushSync,
    ReactVersion as version, // Disabled behind disableLegacyReactDOMAPIs
    findDOMNode,
    hydrate,
    render,
    unmountComponentAtNode, // exposeConcurrentModeAPIs
    createRoot,
    hydrateRoot,
    flushControlled as unstable_flushControlled, // Disabled behind disableUnstableRenderSubtreeIntoContainer
    renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer, // enableCreateEventHandleAPI
    createEventHandle as unstable_createEventHandle, // TODO: Remove this once callers migrate to alternatives.
    // This should only be used by React internals.
    runWithPriority as unstable_runWithPriority,
}; // Keep in sync with ReactTestUtils.js.
// This is an array for better minification.

Internals.Events = [
    getInstanceFromNode,
    getNodeFromInstance,
    getFiberCurrentPropsFromNode,
    enqueueStateRestore,
    restoreStateIfNeeded,
    batchedUpdates,
];
var foundDevTools = injectIntoDevTools({
    findFiberByHostInstance: getClosestInstanceFromNode,
    bundleType: 0,
    version: ReactVersion,
    rendererPackageName: 'react-dom',
});
