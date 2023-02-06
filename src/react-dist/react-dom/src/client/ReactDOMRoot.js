import { warn as _consoleWarn } from "../../../shared/consoleWithStackDev";
import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import ReactDOMSharedInternals from '../ReactDOMSharedInternals';
var Dispatcher = ReactDOMSharedInternals.Dispatcher;
import { ReactDOMClientDispatcher } from "../../../react-dom-bindings/src/client/ReactDOMFloatClient";
import { queueExplicitHydrationTarget } from "../../../react-dom-bindings/src/events/ReactDOMEventReplaying";
import { REACT_ELEMENT_TYPE } from "../../../shared/ReactSymbols";
import { enableFloat, enableHostSingletons, allowConcurrentByDefault, disableCommentsAsDOMContainers } from "../../../shared/ReactFeatureFlags";
import { isContainerMarkedAsRoot, markContainerAsRoot, unmarkContainerAsRoot } from "../../../react-dom-bindings/src/client/ReactDOMComponentTree";
import { listenToAllSupportedEvents } from "../../../react-dom-bindings/src/events/DOMPluginEventSystem";
import { ELEMENT_NODE, COMMENT_NODE, DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE } from "../../../react-dom-bindings/src/shared/HTMLNodeType";
import { createContainer, createHydrationContainer, updateContainer, findHostInstanceWithNoPortals, registerMutableSourceForHydration, flushSync, isAlreadyRendering } from "../../../react-reconciler/src/ReactFiberReconciler";
import { ConcurrentRoot } from "../../../react-reconciler/src/ReactRootTags";
/* global reportError */

var defaultOnRecoverableError = typeof reportError === 'function' ?
// In modern browsers, reportError will dispatch an error event,
// emulating an uncaught JavaScript error.
reportError : function (error) {
  // In older browsers and test environments, fallback to console.error.
  // eslint-disable-next-line react-internal/no-production-logging
  console['error'](error);
}; // $FlowFixMe[missing-this-annot]

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
} // $FlowFixMe[prop-missing] found when upgrading Flow
// $FlowFixMe[missing-this-annot]

ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function (children) {
  var root = this._internalRoot;
  if (root === null) {
    throw new Error('Cannot update an unmounted root.');
  }
  updateContainer(children, root, null, null);
}; // $FlowFixMe[prop-missing] found when upgrading Flow
// $FlowFixMe[missing-this-annot]

ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function () {
  var root = this._internalRoot;
  if (root !== null) {
    this._internalRoot = null;
    var container = root.containerInfo;
    flushSync(function () {
      updateContainer(null, root, null, null);
    });
    unmarkContainerAsRoot(container);
  }
};
export function createRoot(container, options) {
  if (!isValidContainer(container)) {
    throw new Error('createRoot(...): Target container is not a DOM element.');
  }
  warnIfReactDOMContainerInDEV(container);
  var isStrictMode = false;
  var concurrentUpdatesByDefaultOverride = false;
  var identifierPrefix = '';
  var onRecoverableError = defaultOnRecoverableError;
  var transitionCallbacks = null;
  if (options !== null && options !== undefined) {
    if (options.unstable_strictMode === true) {
      isStrictMode = true;
    }
    if (allowConcurrentByDefault && options.unstable_concurrentUpdatesByDefault === true) {
      concurrentUpdatesByDefaultOverride = true;
    }
    if (options.identifierPrefix !== undefined) {
      identifierPrefix = options.identifierPrefix;
    }
    if (options.onRecoverableError !== undefined) {
      onRecoverableError = options.onRecoverableError;
    }
    if (options.unstable_transitionCallbacks !== undefined) {
      transitionCallbacks = options.unstable_transitionCallbacks;
    }
  }
  var root = createContainer(container, ConcurrentRoot, null, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
  markContainerAsRoot(root.current, container);
  if (enableFloat) {
    // Set the default dispatcher to the client dispatcher
    Dispatcher.current = ReactDOMClientDispatcher;
  }
  var rootContainerElement = container.nodeType === COMMENT_NODE ? container.parentNode : container;
  listenToAllSupportedEvents(rootContainerElement); // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions

  return new ReactDOMRoot(root);
} // $FlowFixMe[missing-this-annot]

function ReactDOMHydrationRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
function scheduleHydration(target) {
  if (target) {
    queueExplicitHydrationTarget(target);
  }
} // $FlowFixMe[prop-missing] found when upgrading Flow

ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = scheduleHydration;
export function hydrateRoot(container, initialChildren, options) {
  if (!isValidContainer(container)) {
    throw new Error('hydrateRoot(...): Target container is not a DOM element.');
  }
  warnIfReactDOMContainerInDEV(container);
  // For now we reuse the whole bag of options since they contain
  // the hydration callbacks.

  var hydrationCallbacks = options != null ? options : null; // TODO: Delete this option

  var mutableSources = options != null && options.hydratedSources || null;
  var isStrictMode = false;
  var concurrentUpdatesByDefaultOverride = false;
  var identifierPrefix = '';
  var onRecoverableError = defaultOnRecoverableError;
  var transitionCallbacks = null;
  if (options !== null && options !== undefined) {
    if (options.unstable_strictMode === true) {
      isStrictMode = true;
    }
    if (allowConcurrentByDefault && options.unstable_concurrentUpdatesByDefault === true) {
      concurrentUpdatesByDefaultOverride = true;
    }
    if (options.identifierPrefix !== undefined) {
      identifierPrefix = options.identifierPrefix;
    }
    if (options.onRecoverableError !== undefined) {
      onRecoverableError = options.onRecoverableError;
    }
    if (options.unstable_transitionCallbacks !== undefined) {
      transitionCallbacks = options.unstable_transitionCallbacks;
    }
  }
  var root = createHydrationContainer(initialChildren, null, container, ConcurrentRoot, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
  markContainerAsRoot(root.current, container);
  if (enableFloat) {
    // Set the default dispatcher to the client dispatcher
    Dispatcher.current = ReactDOMClientDispatcher;
  } // This can't be a comment node since hydration doesn't work on comment nodes anyway.

  listenToAllSupportedEvents(container);
  if (mutableSources) {
    for (var i = 0; i < mutableSources.length; i++) {
      var mutableSource = mutableSources[i];
      registerMutableSourceForHydration(root, mutableSource);
    }
  } // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions

  return new ReactDOMHydrationRoot(root);
}
export function isValidContainer(node) {
  return !!(node && (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE || !disableCommentsAsDOMContainers && node.nodeType === COMMENT_NODE && node.nodeValue === ' react-mount-point-unstable '));
} // TODO: Remove this function which also includes comment nodes.
// We only use it in places that are currently more relaxed.

export function isValidContainerLegacy(node) {
  return !!(node && (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE || node.nodeType === COMMENT_NODE && node.nodeValue === ' react-mount-point-unstable '));
}
function warnIfReactDOMContainerInDEV(container) {}