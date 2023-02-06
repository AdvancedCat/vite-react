import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import { allNativeEvents } from './EventRegistry';
import { SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE, IS_LEGACY_FB_SUPPORT_MODE, SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS, IS_CAPTURE_PHASE, IS_EVENT_HANDLE_NON_MANAGED_NODE, IS_NON_DELEGATED } from './EventSystemFlags';
import { isReplayingEvent } from './CurrentReplayingEvent';
import { HostRoot, HostPortal, HostComponent, HostResource, HostSingleton, HostText, ScopeComponent } from "../../../react-reconciler/src/ReactWorkTags";
import getEventTarget from './getEventTarget';
import { getClosestInstanceFromNode, getEventListenerSet, getEventHandlerListeners } from '../client/ReactDOMComponentTree';
import { COMMENT_NODE, DOCUMENT_NODE } from '../shared/HTMLNodeType';
import { batchedUpdates } from './ReactDOMUpdateBatching';
import getListener from './getListener';
import { passiveBrowserEventsSupported } from './checkPassiveEvents';
import { enableLegacyFBSupport, enableCreateEventHandleAPI, enableScopeAPI, enableFloat, enableHostSingletons } from "../../../shared/ReactFeatureFlags";
import { invokeGuardedCallbackAndCatchFirstError, rethrowCaughtError } from "../../../shared/ReactErrorUtils";
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import { removeEventListener, addEventCaptureListener, addEventBubbleListener, addEventBubbleListenerWithPassiveFlag, addEventCaptureListenerWithPassiveFlag } from './EventListener';
import * as BeforeInputEventPlugin from './plugins/BeforeInputEventPlugin';
import * as ChangeEventPlugin from './plugins/ChangeEventPlugin';
import * as EnterLeaveEventPlugin from './plugins/EnterLeaveEventPlugin';
import * as SelectEventPlugin from './plugins/SelectEventPlugin';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin'; // TODO: remove top-level side effect.

SimpleEventPlugin.registerEvents();
EnterLeaveEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();
SelectEventPlugin.registerEvents();
BeforeInputEventPlugin.registerEvents();
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
  // TODO: we should remove the concept of a "SimpleEventPlugin".
  // This is the basic functionality of the event system. All
  // the other plugins are essentially polyfills. So the plugin
  // should probably be inlined somewhere and have its logic
  // be core the to event system. This would potentially allow
  // us to ship builds of React without the polyfilled plugins below.
  SimpleEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
  var shouldProcessPolyfillPlugins = (eventSystemFlags & SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS) === 0; // We don't process these events unless we are in the
  // event's native "bubble" phase, which means that we're
  // not in the capture phase. That's because we emulate
  // the capture phase here still. This is a trade-off,
  // because in an ideal world we would not emulate and use
  // the phases properly, like we do with the SimpleEvent
  // plugin. However, the plugins below either expect
  // emulation (EnterLeave) or use state localized to that
  // plugin (BeforeInput, Change, Select). The state in
  // these modules complicates things, as you'll essentially
  // get the case where the capture phase event might change
  // state, only for the following bubble event to come in
  // later and not trigger anything as the state now
  // invalidates the heuristics of the event plugin. We
  // could alter all these plugins to work in such ways, but
  // that might cause other unknown side-effects that we
  // can't foresee right now.

  if (shouldProcessPolyfillPlugins) {
    EnterLeaveEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    ChangeEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    SelectEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    BeforeInputEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
  }
} // List of events that need to be individually attached to media elements.

export var mediaEventTypes = ['abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'encrypted', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'progress', 'ratechange', 'resize', 'seeked', 'seeking', 'stalled', 'suspend', 'timeupdate', 'volumechange', 'waiting']; // We should not delegate these events to the container, but rather
// set them on the actual target element itself. This is primarily
// because these events do not consistently bubble in the DOM.

export var nonDelegatedEvents = new Set(['cancel', 'close', 'invalid', 'load', 'scroll', 'toggle'].concat(mediaEventTypes));
function executeDispatch(event, listener, currentTarget) {
  var type = event.type || 'unknown-event';
  event.currentTarget = currentTarget;
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
  event.currentTarget = null;
}
function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
  var previousInstance;
  if (inCapturePhase) {
    for (var i = dispatchListeners.length - 1; i >= 0; i--) {
      var _dispatchListeners$i = dispatchListeners[i],
        instance = _dispatchListeners$i.instance,
        currentTarget = _dispatchListeners$i.currentTarget,
        listener = _dispatchListeners$i.listener;
      if (instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      previousInstance = instance;
    }
  } else {
    for (var _i = 0; _i < dispatchListeners.length; _i++) {
      var _dispatchListeners$_i = dispatchListeners[_i],
        _instance = _dispatchListeners$_i.instance,
        _currentTarget = _dispatchListeners$_i.currentTarget,
        _listener = _dispatchListeners$_i.listener;
      if (_instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, _listener, _currentTarget);
      previousInstance = _instance;
    }
  }
}
export function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  var inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (var i = 0; i < dispatchQueue.length; i++) {
    var _dispatchQueue$i = dispatchQueue[i],
      event = _dispatchQueue$i.event,
      listeners = _dispatchQueue$i.listeners;
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase); //  event system doesn't use pooling.
  } // This would be a good time to rethrow if any of the event handlers threw.

  rethrowCaughtError();
}
function dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
  var nativeEventTarget = getEventTarget(nativeEvent);
  var dispatchQueue = [];
  extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}
export function listenToNonDelegatedEvent(domEventName, targetElement) {
  var isCapturePhaseListener = false;
  var listenerSet = getEventListenerSet(targetElement);
  var listenerSetKey = getListenerSetKey(domEventName, isCapturePhaseListener);
  if (!listenerSet.has(listenerSetKey)) {
    addTrappedEventListener(targetElement, domEventName, IS_NON_DELEGATED, isCapturePhaseListener);
    listenerSet.add(listenerSetKey);
  }
}
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  var eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
} // This is only used by createEventHandle when the
// target is not a DOM element. E.g. window.

export function listenToNativeEventForNonManagedEventTarget(domEventName, isCapturePhaseListener, target) {
  var eventSystemFlags = IS_EVENT_HANDLE_NON_MANAGED_NODE;
  var listenerSet = getEventListenerSet(target);
  var listenerSetKey = getListenerSetKey(domEventName, isCapturePhaseListener);
  if (!listenerSet.has(listenerSetKey)) {
    if (isCapturePhaseListener) {
      eventSystemFlags |= IS_CAPTURE_PHASE;
    }
    addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
    listenerSet.add(listenerSetKey);
  }
}
var listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);
export function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    allNativeEvents.forEach(function (domEventName) {
      // We handle selectionchange separately because it
      // doesn't bubble and needs to be on the document.
      if (domEventName !== 'selectionchange') {
        if (!nonDelegatedEvents.has(domEventName)) {
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });
    var ownerDocument = rootContainerElement.nodeType === DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
    if (ownerDocument !== null) {
      // The selectionchange event also needs deduplication
      // but it is attached to the document.
      if (!ownerDocument[listeningMarker]) {
        ownerDocument[listeningMarker] = true;
        listenToNativeEvent('selectionchange', false, ownerDocument);
      }
    }
  }
}
function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener, isDeferredListenerForLegacyFBSupport) {
  var listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags); // If passive option is not supported, then the event will be
  // active and not passive.

  var isPassiveListener = undefined;
  if (passiveBrowserEventsSupported) {
    // Browsers introduced an intervention, making these events
    // passive by default on document. React doesn't bind them
    // to document anymore, but changing this now would undo
    // the performance wins from the change. So we emulate
    // the existing behavior manually on the roots now.
    // https://github.com/facebook/react/issues/19651
    if (domEventName === 'touchstart' || domEventName === 'touchmove' || domEventName === 'wheel') {
      isPassiveListener = true;
    }
  }
  targetContainer = enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport ? targetContainer.ownerDocument : targetContainer;
  var unsubscribeListener; // When legacyFBSupport is enabled, it's for when we
  // want to add a one time event listener to a container.
  // This should only be used with enableLegacyFBSupport
  // due to requirement to provide compatibility with
  // internal FB www event tooling. This works by removing
  // the event listener as soon as it is invoked. We could
  // also attempt to use the {once: true} param on
  // addEventListener, but that requires support and some
  // browsers do not support this today, and given this is
  // to support legacy code patterns, it's likely they'll
  // need support for such browsers.

  if (enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport) {
    var originalListener = listener; // $FlowFixMe[missing-this-annot]

    listener = function () {
      removeEventListener(targetContainer, domEventName, unsubscribeListener, isCapturePhaseListener);
      for (var _len = arguments.length, p = new Array(_len), _key = 0; _key < _len; _key++) {
        p[_key] = arguments[_key];
      }
      return originalListener.apply(this, p);
    };
  } // TODO: There are too many combinations here. Consolidate them.

  if (isCapturePhaseListener) {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventCaptureListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
    } else {
      unsubscribeListener = addEventCaptureListener(targetContainer, domEventName, listener);
    }
  } else {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventBubbleListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
    } else {
      unsubscribeListener = addEventBubbleListener(targetContainer, domEventName, listener);
    }
  }
}
function deferClickToDocumentForLegacyFBSupport(domEventName, targetContainer) {
  // We defer all click events with legacy FB support mode on.
  // This means we add a one time event listener to trigger
  // after the FB delegated listeners fire.
  var isDeferredListenerForLegacyFBSupport = true;
  addTrappedEventListener(targetContainer, domEventName, IS_LEGACY_FB_SUPPORT_MODE, false, isDeferredListenerForLegacyFBSupport);
}
function isMatchingRootContainer(grandContainer, targetContainer) {
  return grandContainer === targetContainer || grandContainer.nodeType === COMMENT_NODE && grandContainer.parentNode === targetContainer;
}
export function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
  var ancestorInst = targetInst;
  if ((eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE) === 0 && (eventSystemFlags & IS_NON_DELEGATED) === 0) {
    var targetContainerNode = targetContainer; // If we are using the legacy FB support flag, we
    // defer the event to the null with a one
    // time event listener so we can defer the event.

    if (enableLegacyFBSupport &&
    // If our event flags match the required flags for entering
    // FB legacy mode and we are processing the "click" event,
    // then we can defer the event to the "document", to allow
    // for legacy FB support, where the expected behavior was to
    // match React < 16 behavior of delegated clicks to the doc.
    domEventName === 'click' && (eventSystemFlags & SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE) === 0 && !isReplayingEvent(nativeEvent)) {
      deferClickToDocumentForLegacyFBSupport(domEventName, targetContainer);
      return;
    }
    if (targetInst !== null) {
      // The below logic attempts to work out if we need to change
      // the target fiber to a different ancestor. We had similar logic
      // in the legacy event system, except the big difference between
      // systems is that the modern event system now has an event listener
      // attached to each React Root and React Portal Root. Together,
      // the DOM nodes representing these roots are the "rootContainer".
      // To figure out which ancestor instance we should use, we traverse
      // up the fiber tree from the target instance and attempt to find
      // root boundaries that match that of our current "rootContainer".
      // If we find that "rootContainer", we find the parent fiber
      // sub-tree for that root and make that our ancestor instance.
      var node = targetInst;
      mainLoop: while (true) {
        if (node === null) {
          return;
        }
        var nodeTag = node.tag;
        if (nodeTag === HostRoot || nodeTag === HostPortal) {
          var container = node.stateNode.containerInfo;
          if (isMatchingRootContainer(container, targetContainerNode)) {
            break;
          }
          if (nodeTag === HostPortal) {
            // The target is a portal, but it's not the rootContainer we're looking for.
            // Normally portals handle their own events all the way down to the root.
            // So we should be able to stop now. However, we don't know if this portal
            // was part of *our* root.
            var grandNode = node.return;
            while (grandNode !== null) {
              var grandTag = grandNode.tag;
              if (grandTag === HostRoot || grandTag === HostPortal) {
                var grandContainer = grandNode.stateNode.containerInfo;
                if (isMatchingRootContainer(grandContainer, targetContainerNode)) {
                  // This is the rootContainer we're looking for and we found it as
                  // a parent of the Portal. That means we can ignore it because the
                  // Portal will bubble through to us.
                  return;
                }
              }
              grandNode = grandNode.return;
            }
          } // Now we need to find it's corresponding host fiber in the other
          // tree. To do this we can use getClosestInstanceFromNode, but we
          // need to validate that the fiber is a host instance, otherwise
          // we need to traverse up through the DOM till we find the correct
          // node that is from the other tree.

          while (container !== null) {
            var parentNode = getClosestInstanceFromNode(container);
            if (parentNode === null) {
              return;
            }
            var parentTag = parentNode.tag;
            if (parentTag === HostComponent || parentTag === HostText || (enableFloat ? parentTag === HostResource : false) || (enableHostSingletons ? parentTag === HostSingleton : false)) {
              node = ancestorInst = parentNode;
              continue mainLoop;
            }
            container = container.parentNode;
          }
        }
        node = node.return;
      }
    }
  }
  batchedUpdates(function () {
    return dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, ancestorInst, targetContainer);
  });
}
function createDispatchListener(instance, listener, currentTarget) {
  return {
    instance: instance,
    listener: listener,
    currentTarget: currentTarget
  };
}
export function accumulateSinglePhaseListeners(targetFiber, reactName, nativeEventType, inCapturePhase, accumulateTargetOnly, nativeEvent) {
  var captureName = reactName !== null ? reactName + 'Capture' : null;
  var reactEventName = inCapturePhase ? captureName : reactName;
  var listeners = [];
  var instance = targetFiber;
  var lastHostComponent = null; // Accumulate all instances and listeners via the target -> root path.

  while (instance !== null) {
    var _instance2 = instance,
      stateNode = _instance2.stateNode,
      tag = _instance2.tag; // Handle listeners that are on HostComponents (i.e. <div>)

    if ((tag === HostComponent || (enableFloat ? tag === HostResource : false) || (enableHostSingletons ? tag === HostSingleton : false)) && stateNode !== null) {
      lastHostComponent = stateNode; // createEventHandle listeners

      if (enableCreateEventHandleAPI) {
        var eventHandlerListeners = getEventHandlerListeners(lastHostComponent);
        if (eventHandlerListeners !== null) {
          eventHandlerListeners.forEach(function (entry) {
            if (entry.type === nativeEventType && entry.capture === inCapturePhase) {
              listeners.push(createDispatchListener(instance, entry.callback, lastHostComponent));
            }
          });
        }
      } // Standard React on* listeners, i.e. onClick or onClickCapture

      if (reactEventName !== null) {
        var listener = getListener(instance, reactEventName);
        if (listener != null) {
          listeners.push(createDispatchListener(instance, listener, lastHostComponent));
        }
      }
    } else if (enableCreateEventHandleAPI && enableScopeAPI && tag === ScopeComponent && lastHostComponent !== null && stateNode !== null) {
      // Scopes
      var reactScopeInstance = stateNode;
      var _eventHandlerListeners = getEventHandlerListeners(reactScopeInstance);
      if (_eventHandlerListeners !== null) {
        _eventHandlerListeners.forEach(function (entry) {
          if (entry.type === nativeEventType && entry.capture === inCapturePhase) {
            listeners.push(createDispatchListener(instance, entry.callback, lastHostComponent));
          }
        });
      }
    } // If we are only accumulating events for the target, then we don't
    // continue to propagate through the React fiber tree to find other
    // listeners.

    if (accumulateTargetOnly) {
      break;
    } // If we are processing the onBeforeBlur event, then we need to take
    // into consideration that part of the React tree might have been hidden
    // or deleted (as we're invoking this event during commit). We can find
    // this out by checking if intercept fiber set on the event matches the
    // current instance fiber. In which case, we should clear all existing
    // listeners.

    if (enableCreateEventHandleAPI && nativeEvent.type === 'beforeblur') {
      // $FlowFixMe[prop-missing] internal field
      var detachedInterceptFiber = nativeEvent._detachedInterceptFiber;
      if (detachedInterceptFiber !== null && (detachedInterceptFiber === instance || detachedInterceptFiber === instance.alternate)) {
        listeners = [];
      }
    }
    instance = instance.return;
  }
  return listeners;
} // We should only use this function for:
// - BeforeInputEventPlugin
// - ChangeEventPlugin
// - SelectEventPlugin
// This is because we only process these plugins
// in the bubble phase, so we need to accumulate two
// phase event listeners (via emulation).

export function accumulateTwoPhaseListeners(targetFiber, reactName) {
  var captureName = reactName + 'Capture';
  var listeners = [];
  var instance = targetFiber; // Accumulate all instances and listeners via the target -> root path.

  while (instance !== null) {
    var _instance3 = instance,
      stateNode = _instance3.stateNode,
      tag = _instance3.tag; // Handle listeners that are on HostComponents (i.e. <div>)

    if ((tag === HostComponent || (enableFloat ? tag === HostResource : false) || (enableHostSingletons ? tag === HostSingleton : false)) && stateNode !== null) {
      var currentTarget = stateNode;
      var captureListener = getListener(instance, captureName);
      if (captureListener != null) {
        listeners.unshift(createDispatchListener(instance, captureListener, currentTarget));
      }
      var bubbleListener = getListener(instance, reactName);
      if (bubbleListener != null) {
        listeners.push(createDispatchListener(instance, bubbleListener, currentTarget));
      }
    }
    instance = instance.return;
  }
  return listeners;
}
function getParent(inst) {
  if (inst === null) {
    return null;
  }
  do {
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    inst = inst.return; // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (inst && inst.tag !== HostComponent && (!enableHostSingletons ? true : inst.tag !== HostSingleton));
  if (inst) {
    return inst;
  }
  return null;
}
/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */

function getLowestCommonAncestor(instA, instB) {
  var nodeA = instA;
  var nodeB = instB;
  var depthA = 0;
  for (var tempA = nodeA; tempA; tempA = getParent(tempA)) {
    depthA++;
  }
  var depthB = 0;
  for (var tempB = nodeB; tempB; tempB = getParent(tempB)) {
    depthB++;
  } // If A is deeper, crawl up.

  while (depthA - depthB > 0) {
    nodeA = getParent(nodeA);
    depthA--;
  } // If B is deeper, crawl up.

  while (depthB - depthA > 0) {
    nodeB = getParent(nodeB);
    depthB--;
  } // Walk in lockstep until we find a match.

  var depth = depthA;
  while (depth--) {
    if (nodeA === nodeB || nodeB !== null && nodeA === nodeB.alternate) {
      return nodeA;
    }
    nodeA = getParent(nodeA);
    nodeB = getParent(nodeB);
  }
  return null;
}
function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
  var registrationName = event._reactName;
  var listeners = [];
  var instance = target;
  while (instance !== null) {
    if (instance === common) {
      break;
    }
    var _instance4 = instance,
      alternate = _instance4.alternate,
      stateNode = _instance4.stateNode,
      tag = _instance4.tag;
    if (alternate !== null && alternate === common) {
      break;
    }
    if ((tag === HostComponent || (enableFloat ? tag === HostResource : false) || (enableHostSingletons ? tag === HostSingleton : false)) && stateNode !== null) {
      var currentTarget = stateNode;
      if (inCapturePhase) {
        var captureListener = getListener(instance, registrationName);
        if (captureListener != null) {
          listeners.unshift(createDispatchListener(instance, captureListener, currentTarget));
        }
      } else if (!inCapturePhase) {
        var bubbleListener = getListener(instance, registrationName);
        if (bubbleListener != null) {
          listeners.push(createDispatchListener(instance, bubbleListener, currentTarget));
        }
      }
    }
    instance = instance.return;
  }
  if (listeners.length !== 0) {
    dispatchQueue.push({
      event: event,
      listeners: listeners
    });
  }
} // We should only use this function for:
// - EnterLeaveEventPlugin
// This is because we only process this plugin
// in the bubble phase, so we need to accumulate two
// phase event listeners.

export function accumulateEnterLeaveTwoPhaseListeners(dispatchQueue, leaveEvent, enterEvent, from, to) {
  var common = from && to ? getLowestCommonAncestor(from, to) : null;
  if (from !== null) {
    accumulateEnterLeaveListenersForEvent(dispatchQueue, leaveEvent, from, common, false);
  }
  if (to !== null && enterEvent !== null) {
    accumulateEnterLeaveListenersForEvent(dispatchQueue, enterEvent, to, common, true);
  }
}
export function accumulateEventHandleNonManagedNodeListeners(reactEventType, currentTarget, inCapturePhase) {
  var listeners = [];
  var eventListeners = getEventHandlerListeners(currentTarget);
  if (eventListeners !== null) {
    eventListeners.forEach(function (entry) {
      if (entry.type === reactEventType && entry.capture === inCapturePhase) {
        listeners.push(createDispatchListener(null, entry.callback, currentTarget));
      }
    });
  }
  return listeners;
}
export function getListenerSetKey(domEventName, capture) {
  return domEventName + "__" + (capture ? 'capture' : 'bubble');
}