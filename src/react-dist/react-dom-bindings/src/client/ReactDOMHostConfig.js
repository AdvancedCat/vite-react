import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import { precacheFiberNode, updateFiberProps, getClosestInstanceFromNode, getFiberFromScopeInstance, getInstanceFromNode as getInstanceFromNodeDOMTree, isContainerMarkedAsRoot, detachDeletedInstance, isMarkedResource } from './ReactDOMComponentTree';
export { detachDeletedInstance };
import { hasRole } from './DOMAccessibilityRoles';
import { createElement, createTextNode, setInitialProperties, diffProperties, updateProperties, diffHydratedProperties, diffHydratedText, trapClickOnNonInteractiveElement, checkForUnmatchedText, warnForDeletedHydratableElement, warnForDeletedHydratableText, warnForInsertedHydratedElement, warnForInsertedHydratedText, getOwnerDocumentFromRootContainer } from './ReactDOMComponent';
import { getSelectionInformation, restoreSelection } from './ReactInputSelection';
import setTextContent from './setTextContent';
import { validateDOMNesting, updatedAncestorInfoDev } from './validateDOMNesting';
import { isEnabled as ReactBrowserEventEmitterIsEnabled, setEnabled as ReactBrowserEventEmitterSetEnabled, getEventPriority } from '../events/ReactDOMEventListener';
import { getChildNamespace, SVG_NAMESPACE } from '../shared/DOMNamespaces';
import { ELEMENT_NODE, TEXT_NODE, COMMENT_NODE, DOCUMENT_NODE, DOCUMENT_TYPE_NODE, DOCUMENT_FRAGMENT_NODE } from '../shared/HTMLNodeType';
import dangerousStyleValue from '../shared/dangerousStyleValue';
import { retryIfBlockedOn } from '../events/ReactDOMEventReplaying';
import { enableCreateEventHandleAPI, enableScopeAPI, enableFloat, enableHostSingletons } from "../../../shared/ReactFeatureFlags";
import { HostComponent, HostResource, HostText, HostSingleton } from "../../../react-reconciler/src/ReactWorkTags";
import { listenToAllSupportedEvents } from '../events/DOMPluginEventSystem';
import { DefaultEventPriority } from "../../../react-reconciler/src/ReactEventPriorities"; // TODO: Remove this deep import when we delete the legacy root API

import { ConcurrentMode, NoMode } from "../../../react-reconciler/src/ReactTypeOfMode";
import { prepareToRenderResources, cleanupAfterRenderResources, clearRootResources } from './ReactDOMFloatClient';
import { validateLinkPropsForStyleResource } from '../shared/ReactDOMResourceValidation'; // Unused

var SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
var SUSPENSE_START_DATA = '$';
var SUSPENSE_END_DATA = '/$';
var SUSPENSE_PENDING_START_DATA = '$?';
var SUSPENSE_FALLBACK_START_DATA = '$!';
var STYLE = 'style';
var eventsEnabled = null;
var selectionInformation = null;
export * from "../../../react-reconciler/src/ReactFiberHostConfigWithNoPersistence";
export function getRootHostContext(rootContainerInstance) {
  var type;
  var namespace;
  var nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      {
        type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
        var root = rootContainerInstance.documentElement;
        namespace = root ? root.namespaceURI : getChildNamespace(null, '');
        break;
      }
    default:
      {
        var container = nodeType === COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
        var ownNamespace = container.namespaceURI || null;
        type = container.tagName;
        namespace = getChildNamespace(ownNamespace, type);
        break;
      }
  }
  return namespace;
}
export function getChildHostContext(parentHostContext, type) {
  var parentNamespace = parentHostContext;
  return getChildNamespace(parentNamespace, type);
}
export function getPublicInstance(instance) {
  return instance;
}
export function prepareForCommit(containerInfo) {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation();
  var activeInstance = null;
  if (enableCreateEventHandleAPI) {
    var focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      activeInstance = getClosestInstanceFromNode(focusedElem);
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}
export function beforeActiveInstanceBlur(internalInstanceHandle) {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchBeforeDetachedBlur(selectionInformation.focusedElem, internalInstanceHandle);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}
export function afterActiveInstanceBlur() {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchAfterDetachedBlur(selectionInformation.focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}
export function resetAfterCommit(containerInfo) {
  restoreSelection(selectionInformation);
  ReactBrowserEventEmitterSetEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
}
export function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
  var parentNamespace;
  {
    parentNamespace = hostContext;
  }
  var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}
export function appendInitialChild(parentInstance, child) {
  parentInstance.appendChild(child);
}
export function finalizeInitialChildren(domElement, type, props, hostContext) {
  setInitialProperties(domElement, type, props);
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
    case 'img':
      return true;
    default:
      return false;
  }
}
export function prepareUpdate(domElement, type, oldProps, newProps, hostContext) {
  return diffProperties(domElement, type, oldProps, newProps);
}
export function shouldSetTextContent(type, props) {
  return type === 'textarea' || type === 'noscript' || typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
}
export function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
  var textNode = createTextNode(text, rootContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}
export function getCurrentEventPriority() {
  var currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}
export var isPrimaryRenderer = true;
export var warnsIfNotActing = true; // This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.

export var scheduleTimeout = typeof setTimeout === 'function' ? setTimeout : undefined;
export var cancelTimeout = typeof clearTimeout === 'function' ? clearTimeout : undefined;
export var noTimeout = -1;
var localPromise = typeof Promise === 'function' ? Promise : undefined;
var localRequestAnimationFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : scheduleTimeout;
export function getInstanceFromNode(node) {
  return getClosestInstanceFromNode(node) || null;
}
export function preparePortalMount(portalInstance) {
  listenToAllSupportedEvents(portalInstance);
}
export function prepareScopeUpdate(scopeInstance, internalInstanceHandle) {
  if (enableScopeAPI) {
    precacheFiberNode(internalInstanceHandle, scopeInstance);
  }
}
export function getInstanceFromScope(scopeInstance) {
  if (enableScopeAPI) {
    return getFiberFromScopeInstance(scopeInstance);
  }
  return null;
} // -------------------
//     Microtasks
// -------------------

export var supportsMicrotasks = true;
export var scheduleMicrotask = typeof queueMicrotask === 'function' ? queueMicrotask : typeof localPromise !== 'undefined' ? function (callback) {
  return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
} : scheduleTimeout; // TODO: Determine the best fallback here.

function handleErrorInNextTick(error) {
  setTimeout(function () {
    throw error;
  });
} // -------------------
//     Mutation
// -------------------

export var supportsMutation = true;
export function commitMount(domElement, type, newProps, internalInstanceHandle) {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      if (newProps.autoFocus) {
        domElement.focus();
      }
      return;
    case 'img':
      {
        if (newProps.src) {
          domElement.src = newProps.src;
        }
        return;
      }
  }
}
export function commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps); // Update the props handle so that we know which props are the ones with
  // with current event handlers.

  updateFiberProps(domElement, newProps);
}
export function resetTextContent(domElement) {
  setTextContent(domElement, '');
}
export function commitTextUpdate(textInstance, oldText, newText) {
  textInstance.nodeValue = newText;
}
export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}
export function appendChildToContainer(container, child) {
  var parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = container.parentNode;
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  } // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918

  var reactRootContainer = container._reactRootContainer;
  if ((reactRootContainer === null || reactRootContainer === undefined) && parentNode.onclick === null) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(parentNode);
  }
}
export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}
export function insertInContainerBefore(container, child, beforeChild) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}
function createEvent(type, bubbles) {
  var event = document.createEvent('Event');
  event.initEvent(type, bubbles, false);
  return event;
}
function dispatchBeforeDetachedBlur(target, internalInstanceHandle) {
  if (enableCreateEventHandleAPI) {
    var event = createEvent('beforeblur', true); // Dispatch "beforeblur" directly on the target,
    // so it gets picked up by the event system and
    // can propagate through the React internal tree.
    // $FlowFixMe: internal field

    event._detachedInterceptFiber = internalInstanceHandle;
    target.dispatchEvent(event);
  }
}
function dispatchAfterDetachedBlur(target) {
  if (enableCreateEventHandleAPI) {
    var event = createEvent('afterblur', false); // So we know what was detached, make the relatedTarget the
    // detached target on the "afterblur" event.

    event.relatedTarget = target; // Dispatch the event on the document.

    document.dispatchEvent(event);
  }
}
export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
}
export function removeChildFromContainer(container, child) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.removeChild(child);
  } else {
    container.removeChild(child);
  }
}
export function clearSuspenseBoundary(parentInstance, suspenseInstance) {
  var node = suspenseInstance; // Delete all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.

  var depth = 0;
  do {
    var nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && nextNode.nodeType === COMMENT_NODE) {
      var data = nextNode.data;
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          parentInstance.removeChild(nextNode); // Retry if any event replaying was blocked on this.

          retryIfBlockedOn(suspenseInstance);
          return;
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_START_DATA || data === SUSPENSE_PENDING_START_DATA || data === SUSPENSE_FALLBACK_START_DATA) {
        depth++;
      }
    } // $FlowFixMe[incompatible-type] we bail out when we get a null

    node = nextNode;
  } while (node); // TODO: Warn, we didn't find the end comment boundary.
  // Retry if any event replaying was blocked on this.

  retryIfBlockedOn(suspenseInstance);
}
export function clearSuspenseBoundaryFromContainer(container, suspenseInstance) {
  if (container.nodeType === COMMENT_NODE) {
    clearSuspenseBoundary(container.parentNode, suspenseInstance);
  } else if (container.nodeType === ELEMENT_NODE) {
    clearSuspenseBoundary(container, suspenseInstance);
  } else {// Document nodes should never contain suspense boundaries.
  } // Retry if any event replaying was blocked on this.

  retryIfBlockedOn(container);
}
export function hideInstance(instance) {
  // TODO: Does this work for all element types? What about MathML? Should we
  // pass host context to this method?
  instance = instance;
  var style = instance.style; // $FlowFixMe[method-unbinding]

  if (typeof style.setProperty === 'function') {
    style.setProperty('display', 'none', 'important');
  } else {
    style.display = 'none';
  }
}
export function hideTextInstance(textInstance) {
  textInstance.nodeValue = '';
}
export function unhideInstance(instance, props) {
  instance = instance;
  var styleProp = props[STYLE];
  var display = styleProp !== undefined && styleProp !== null && styleProp.hasOwnProperty('display') ? styleProp.display : null;
  instance.style.display = dangerousStyleValue('display', display);
}
export function unhideTextInstance(textInstance, text) {
  textInstance.nodeValue = text;
}
export function clearContainer(container) {
  if (enableHostSingletons) {
    var nodeType = container.nodeType;
    if (nodeType === DOCUMENT_NODE) {
      clearRootResources(container);
      clearContainerSparingly(container);
    } else if (nodeType === ELEMENT_NODE) {
      switch (container.nodeName) {
        case 'HEAD':
          {
            // If we are clearing document.head as a container we are essentially clearing everything
            // that was hoisted to the head and should forget the instances that will no longer be in the DOM
            clearRootResources(container); // fall through to clear child contents
          }
        // eslint-disable-next-line-no-fallthrough

        case 'HTML':
        case 'BODY':
          clearContainerSparingly(container);
          return;
        default:
          {
            container.textContent = '';
          }
      }
    }
  } else {
    if (container.nodeType === ELEMENT_NODE) {
      // We have refined the container to Element type
      var element = container;
      element.textContent = '';
    } else if (container.nodeType === DOCUMENT_NODE) {
      // We have refined the container to Document type
      var doc = container;
      if (doc.documentElement) {
        doc.removeChild(doc.documentElement);
      }
    }
  }
}
function clearContainerSparingly(container) {
  var node;
  var nextNode = container.firstChild;
  if (nextNode && nextNode.nodeType === DOCUMENT_TYPE_NODE) {
    nextNode = nextNode.nextSibling;
  }
  while (nextNode) {
    node = nextNode;
    nextNode = nextNode.nextSibling;
    switch (node.nodeName) {
      case 'HTML':
      case 'HEAD':
      case 'BODY':
        {
          var element = node;
          clearContainerSparingly(element); // If these singleton instances had previously been rendered with React they
          // may still hold on to references to the previous fiber tree. We detatch them
          // prospectively to reset them to a baseline starting state since we cannot create
          // new instances.

          detachDeletedInstance(element);
          continue;
        }
      case 'STYLE':
        {
          continue;
        }
      case 'LINK':
        {
          if (node.rel.toLowerCase() === 'stylesheet') {
            continue;
          }
        }
    }
    container.removeChild(node);
  }
  return;
} // Making this so we can eventually move all of the instance caching to the commit phase.
// Currently this is only used to associate fiber and props to instances for hydrating
// HostSingletons. The reason we need it here is we only want to make this binding on commit
// because only one fiber can own the instance at a time and render can fail/restart

export function bindInstance(instance, props, internalInstanceHandle) {
  precacheFiberNode(internalInstanceHandle, instance);
  updateFiberProps(instance, props);
} // -------------------
//     Hydration
// -------------------

export var supportsHydration = true; // With Resources, some HostComponent types will never be server rendered and need to be
// inserted without breaking hydration

export function isHydratable(type, props) {
  if (enableFloat) {
    if (type === 'link') {
      if (props.rel === 'stylesheet' && typeof props.precedence !== 'string') {
        return true;
      }
      return false;
    } else if (type === 'script') {
      var async = props.async,
        onLoad = props.onLoad,
        onError = props.onError;
      return !(async && (onLoad || onError));
    }
    return true;
  } else {
    return true;
  }
}
export function canHydrateInstance(instance, type, props) {
  if (instance.nodeType !== ELEMENT_NODE || type.toLowerCase() !== instance.nodeName.toLowerCase()) {
    return null;
  } // This has now been refined to an element node.

  return instance;
}
export function canHydrateTextInstance(instance, text) {
  if (text === '' || instance.nodeType !== TEXT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  } // This has now been refined to a text node.

  return instance;
}
export function canHydrateSuspenseInstance(instance) {
  if (instance.nodeType !== COMMENT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  } // This has now been refined to a suspense node.

  return instance;
}
export function isSuspenseInstancePending(instance) {
  return instance.data === SUSPENSE_PENDING_START_DATA;
}
export function isSuspenseInstanceFallback(instance) {
  return instance.data === SUSPENSE_FALLBACK_START_DATA;
}
export function getSuspenseInstanceFallbackErrorDetails(instance) {
  var dataset = instance.nextSibling && instance.nextSibling.dataset;
  var digest, message, stack;
  if (dataset) {
    digest = dataset.dgst;
  }
  {
    // Object gets DCE'd if constructed in tail position and matches callsite destructuring
    return {
      digest: digest
    };
  }
}
export function registerSuspenseInstanceRetry(instance, callback) {
  instance._reactRetry = callback;
}
function getNextHydratable(node) {
  // Skip non-hydratable nodes.
  for (; node != null; node = node.nextSibling) {
    var nodeType = node.nodeType;
    if (enableFloat && enableHostSingletons) {
      if (nodeType === ELEMENT_NODE) {
        var element = node;
        switch (element.tagName) {
          // This is subtle. in SVG scope the title tag is case sensitive. we don't want to skip
          // titles in svg but we do want to skip them outside of svg. there is an edge case where
          // you could do `React.createElement('TITLE', ...)` inside an svg scope but the SSR serializer
          // will still emit lowercase. Practically speaking the only time the DOM will have a non-uppercased
          // title tagName is if it is inside an svg.
          // Other Resource types like META, BASE, LINK, and SCRIPT should be treated as resources even inside
          // svg scope because they are invalid otherwise. We still don't need to handle the lowercase variant
          // because if they are present in the DOM already they would have been hoisted outside the SVG scope
          // as Resources. So while it would be correct to skip a <link> inside <svg> and this algorithm won't
          // skip that link because the tagName will not be uppercased it functionally is irrelevant. If one
          // tries to render incompatible types such as a non-resource stylesheet inside an svg the server will
          // emit that invalid html and hydration will fail. In Dev this will present warnings guiding the
          // developer on how to fix.
          case 'TITLE':
          case 'META':
          case 'BASE':
          case 'HTML':
          case 'HEAD':
          case 'BODY':
            {
              continue;
            }
          case 'LINK':
            {
              var linkEl = element; // All links that are server rendered are resources except
              // stylesheets that do not have a precedence

              if (linkEl.rel === 'stylesheet' && !linkEl.hasAttribute('data-precedence')) {
                break;
              }
              continue;
            }
          case 'STYLE':
            {
              var styleEl = element;
              if (styleEl.hasAttribute('data-precedence')) {
                continue;
              }
              break;
            }
          case 'SCRIPT':
            {
              var scriptEl = element;
              if (scriptEl.hasAttribute('async')) {
                continue;
              }
              break;
            }
        }
        break;
      } else if (nodeType === TEXT_NODE) {
        break;
      }
    } else if (enableFloat) {
      if (nodeType === ELEMENT_NODE) {
        var _element = node;
        switch (_element.tagName) {
          case 'TITLE':
          case 'META':
          case 'BASE':
            {
              continue;
            }
          case 'LINK':
            {
              var _linkEl = _element; // All links that are server rendered are resources except
              // stylesheets that do not have a precedence

              if (_linkEl.rel === 'stylesheet' && !_linkEl.hasAttribute('data-precedence')) {
                break;
              }
              continue;
            }
          case 'STYLE':
            {
              var _styleEl = _element;
              if (_styleEl.hasAttribute('data-precedence')) {
                continue;
              }
              break;
            }
          case 'SCRIPT':
            {
              var _scriptEl = _element;
              if (_scriptEl.hasAttribute('async')) {
                continue;
              }
              break;
            }
        }
        break;
      } else if (nodeType === TEXT_NODE) {
        break;
      }
    } else if (enableHostSingletons) {
      if (nodeType === ELEMENT_NODE) {
        var tag = node.tagName;
        if (tag === 'HTML' || tag === 'HEAD' || tag === 'BODY') {
          continue;
        }
        break;
      } else if (nodeType === TEXT_NODE) {
        break;
      }
    } else {
      if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
        break;
      }
    }
    if (nodeType === COMMENT_NODE) {
      var nodeData = node.data;
      if (nodeData === SUSPENSE_START_DATA || nodeData === SUSPENSE_FALLBACK_START_DATA || nodeData === SUSPENSE_PENDING_START_DATA) {
        break;
      }
      if (nodeData === SUSPENSE_END_DATA) {
        return null;
      }
    }
  }
  return node;
}
export function getNextHydratableSibling(instance) {
  return getNextHydratable(instance.nextSibling);
}
export function getFirstHydratableChild(parentInstance) {
  return getNextHydratable(parentInstance.firstChild);
}
export function getFirstHydratableChildWithinContainer(parentContainer) {
  return getNextHydratable(parentContainer.firstChild);
}
export function getFirstHydratableChildWithinSuspenseInstance(parentInstance) {
  return getNextHydratable(parentInstance.nextSibling);
}
export function hydrateInstance(instance, type, props, hostContext, internalInstanceHandle, shouldWarnDev) {
  precacheFiberNode(internalInstanceHandle, instance); // TODO: Possibly defer this until the commit phase where all the events
  // get attached.

  updateFiberProps(instance, props);
  var parentNamespace;
  {
    parentNamespace = hostContext;
  } // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.

  var isConcurrentMode = (internalInstanceHandle.mode & ConcurrentMode) !== NoMode;
  return diffHydratedProperties(instance, type, props, parentNamespace, isConcurrentMode, shouldWarnDev);
}
export function hydrateTextInstance(textInstance, text, internalInstanceHandle, shouldWarnDev) {
  precacheFiberNode(internalInstanceHandle, textInstance); // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.

  var isConcurrentMode = (internalInstanceHandle.mode & ConcurrentMode) !== NoMode;
  return diffHydratedText(textInstance, text, isConcurrentMode);
}
export function hydrateSuspenseInstance(suspenseInstance, internalInstanceHandle) {
  precacheFiberNode(internalInstanceHandle, suspenseInstance);
}
export function getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance) {
  var node = suspenseInstance.nextSibling; // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.

  var depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      var data = node.data;
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          return getNextHydratableSibling(node);
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
        depth++;
      }
    }
    node = node.nextSibling;
  } // TODO: Warn, we didn't find the end comment boundary.

  return null;
} // Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.

export function getParentSuspenseInstance(targetInstance) {
  var node = targetInstance.previousSibling; // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.

  var depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      var data = node.data;
      if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
        if (depth === 0) {
          return node;
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_END_DATA) {
        depth++;
      }
    }
    node = node.previousSibling;
  }
  return null;
}
export function commitHydratedContainer(container) {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}
export function commitHydratedSuspenseInstance(suspenseInstance) {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
} // @TODO remove this function once float lands and hydrated tail nodes
// are controlled by HostSingleton fibers

export function shouldDeleteUnhydratedTailInstances(parentType) {
  return parentType !== 'head' && parentType !== 'body';
}
export function didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, text, isConcurrentMode, shouldWarnDev) {
  checkForUnmatchedText(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
}
export function didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, text, isConcurrentMode, shouldWarnDev) {
  if (parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    checkForUnmatchedText(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
  }
}
export function didNotHydrateInstanceWithinContainer(parentContainer, instance) {}
export function didNotHydrateInstanceWithinSuspenseInstance(parentInstance, instance) {}
export function didNotHydrateInstance(parentType, parentProps, parentInstance, instance, isConcurrentMode) {}
export function didNotFindHydratableInstanceWithinContainer(parentContainer, type, props) {}
export function didNotFindHydratableTextInstanceWithinContainer(parentContainer, text) {}
export function didNotFindHydratableSuspenseInstanceWithinContainer(parentContainer) {}
export function didNotFindHydratableInstanceWithinSuspenseInstance(parentInstance, type, props) {}
export function didNotFindHydratableTextInstanceWithinSuspenseInstance(parentInstance, text) {}
export function didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(parentInstance) {}
export function didNotFindHydratableInstance(parentType, parentProps, parentInstance, type, props, isConcurrentMode) {}
export function didNotFindHydratableTextInstance(parentType, parentProps, parentInstance, text, isConcurrentMode) {}
export function didNotFindHydratableSuspenseInstance(parentType, parentProps, parentInstance) {}
export function errorHydratingContainer(parentContainer) {} // -------------------
//     Test Selectors
// -------------------

export var supportsTestSelectors = true;
export function findFiberRoot(node) {
  var stack = [node];
  var index = 0;
  while (index < stack.length) {
    var current = stack[index++];
    if (isContainerMarkedAsRoot(current)) {
      return getInstanceFromNodeDOMTree(current);
    }
    stack.push.apply(stack, current.children);
  }
  return null;
}
export function getBoundingRect(node) {
  var rect = node.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
}
export function matchAccessibilityRole(node, role) {
  if (hasRole(node, role)) {
    return true;
  }
  return false;
}
export function getTextContent(fiber) {
  switch (fiber.tag) {
    case HostResource:
    case HostSingleton:
    case HostComponent:
      var textContent = '';
      var childNodes = fiber.stateNode.childNodes;
      for (var i = 0; i < childNodes.length; i++) {
        var childNode = childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          textContent += childNode.textContent;
        }
      }
      return textContent;
    case HostText:
      return fiber.stateNode.textContent;
  }
  return null;
}
export function isHiddenSubtree(fiber) {
  return fiber.tag === HostComponent && fiber.memoizedProps.hidden === true;
}
export function setFocusIfFocusable(node) {
  // The logic for determining if an element is focusable is kind of complex,
  // and since we want to actually change focus anyway- we can just skip it.
  // Instead we'll just listen for a "focus" event to verify that focus was set.
  //
  // We could compare the node to document.activeElement after focus,
  // but this would not handle the case where application code managed focus to automatically blur.
  var didFocus = false;
  var handleFocus = function () {
    didFocus = true;
  };
  var element = node;
  try {
    element.addEventListener('focus', handleFocus); // $FlowFixMe[method-unbinding]

    (element.focus || HTMLElement.prototype.focus).call(element);
  } finally {
    element.removeEventListener('focus', handleFocus);
  }
  return didFocus;
}
export function setupIntersectionObserver(targets, callback, options) {
  var rectRatioCache = new Map();
  targets.forEach(function (target) {
    rectRatioCache.set(target, {
      rect: getBoundingRect(target),
      ratio: 0
    });
  });
  var handleIntersection = function (entries) {
    entries.forEach(function (entry) {
      var boundingClientRect = entry.boundingClientRect,
        intersectionRatio = entry.intersectionRatio,
        target = entry.target;
      rectRatioCache.set(target, {
        rect: {
          x: boundingClientRect.left,
          y: boundingClientRect.top,
          width: boundingClientRect.width,
          height: boundingClientRect.height
        },
        ratio: intersectionRatio
      });
    });
    callback(Array.from(rectRatioCache.values()));
  };
  var observer = new IntersectionObserver(handleIntersection, options);
  targets.forEach(function (target) {
    observer.observe(target);
  });
  return {
    disconnect: function () {
      return observer.disconnect();
    },
    observe: function (target) {
      rectRatioCache.set(target, {
        rect: getBoundingRect(target),
        ratio: 0
      });
      observer.observe(target);
    },
    unobserve: function (target) {
      rectRatioCache.delete(target);
      observer.unobserve(target);
    }
  };
}
export function requestPostPaintCallback(callback) {
  localRequestAnimationFrame(function () {
    localRequestAnimationFrame(function (time) {
      return callback(time);
    });
  });
} // -------------------
//     Resources
// -------------------

export var supportsResources = true;
export function isHostResourceType(type, props, hostContext) {
  var outsideHostContainerContext;
  var namespace;
  {
    var hostContextProd = hostContext;
    namespace = hostContextProd;
  }
  switch (type) {
    case 'base':
    case 'meta':
      {
        return true;
      }
    case 'title':
      {
        return namespace !== SVG_NAMESPACE;
      }
    case 'link':
      {
        var onLoad = props.onLoad,
          onError = props.onError;
        if (onLoad || onError) {
          return false;
        }
        switch (props.rel) {
          case 'stylesheet':
            {
              var href = props.href,
                precedence = props.precedence,
                disabled = props.disabled;
              return typeof href === 'string' && typeof precedence === 'string' && disabled == null;
            }
          default:
            {
              var rel = props.rel,
                _href = props.href;
              return typeof _href === 'string' && typeof rel === 'string';
            }
        }
      }
    case 'script':
      {
        // We don't validate because it is valid to use async with onLoad/onError unlike combining
        // precedence with these for style resources
        var src = props.src,
          async = props.async,
          _onLoad = props.onLoad,
          _onError = props.onError;
        return async && typeof src === 'string' && !_onLoad && !_onError;
      }
    case 'noscript':
    case 'template':
    case 'style':
      {
        return false;
      }
  }
  return false;
}
export function prepareRendererToRender(rootContainer) {
  if (enableFloat) {
    prepareToRenderResources(rootContainer);
  }
}
export function resetRendererAfterRender() {
  if (enableFloat) {
    cleanupAfterRenderResources();
  }
}
export { getResource, acquireResource, releaseResource } from './ReactDOMFloatClient'; // -------------------
//     Singletons
// -------------------

export var supportsSingletons = true;
export function isHostSingletonType(type) {
  return type === 'html' || type === 'head' || type === 'body';
}
export function resolveSingletonInstance(type, props, rootContainerInstance, hostContext, validateDOMNestingDev) {
  var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerInstance);
  switch (type) {
    case 'html':
      {
        var documentElement = ownerDocument.documentElement;
        if (!documentElement) {
          throw new Error('React expected an <html> element (document.documentElement) to exist in the Document but one was' + ' not found. React never removes the documentElement for any Document it renders into so' + ' the cause is likely in some other script running on this page.');
        }
        return documentElement;
      }
    case 'head':
      {
        var head = ownerDocument.head;
        if (!head) {
          throw new Error('React expected a <head> element (document.head) to exist in the Document but one was' + ' not found. React never removes the head for any Document it renders into so' + ' the cause is likely in some other script running on this page.');
        }
        return head;
      }
    case 'body':
      {
        var body = ownerDocument.body;
        if (!body) {
          throw new Error('React expected a <body> element (document.body) to exist in the Document but one was' + ' not found. React never removes the body for any Document it renders into so' + ' the cause is likely in some other script running on this page.');
        }
        return body;
      }
    default:
      {
        throw new Error('resolveSingletonInstance was called with an element type that is not supported. This is a bug in React.');
      }
  }
}
export function acquireSingletonInstance(type, props, instance, internalInstanceHandle) {
  var attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }
  setInitialProperties(instance, type, props);
  precacheFiberNode(internalInstanceHandle, instance);
  updateFiberProps(instance, props);
}
export function releaseSingletonInstance(instance) {
  var attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }
  detachDeletedInstance(instance);
}
export function clearSingleton(instance) {
  var element = instance;
  var node = element.firstChild;
  while (node) {
    var nextNode = node.nextSibling;
    var nodeName = node.nodeName;
    if (isMarkedResource(node) || nodeName === 'HEAD' || nodeName === 'BODY' || nodeName === 'STYLE' || nodeName === 'LINK' && node.rel.toLowerCase() === 'stylesheet') {// retain these nodes
    } else {
      element.removeChild(node);
    }
    node = nextNode;
  }
  return;
}