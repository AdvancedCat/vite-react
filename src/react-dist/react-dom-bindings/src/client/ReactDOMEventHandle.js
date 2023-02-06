import { allNativeEvents } from '../events/EventRegistry';
import { getEventHandlerListeners, setEventHandlerListeners, doesTargetHaveEventHandle, addEventHandleToTarget } from './ReactDOMComponentTree';
import { ELEMENT_NODE } from '../shared/HTMLNodeType';
import { listenToNativeEventForNonManagedEventTarget } from '../events/DOMPluginEventSystem';
import { enableScopeAPI, enableCreateEventHandleAPI } from "../../../shared/ReactFeatureFlags";
function isValidEventTarget(target) {
  return typeof target.addEventListener === 'function';
}
function isReactScope(target) {
  return typeof target.getChildContextValues === 'function';
}
function createEventHandleListener(type, isCapturePhaseListener, callback) {
  return {
    callback: callback,
    capture: isCapturePhaseListener,
    type: type
  };
}
function registerReactDOMEvent(target, domEventName, isCapturePhaseListener) {
  if (target.nodeType === ELEMENT_NODE) {// Do nothing. We already attached all root listeners.
  } else if (enableScopeAPI && isReactScope(target)) {// Do nothing. We already attached all root listeners.
  } else if (isValidEventTarget(target)) {
    var eventTarget = target; // These are valid event targets, but they are also
    // non-managed React nodes.

    listenToNativeEventForNonManagedEventTarget(domEventName, isCapturePhaseListener, eventTarget);
  } else {
    throw new Error('ReactDOM.createEventHandle: setter called on an invalid ' + 'target. Provide a valid EventTarget or an element managed by React.');
  }
}
export function createEventHandle(type, options) {
  if (enableCreateEventHandleAPI) {
    var domEventName = type; // We cannot support arbitrary native events with eager root listeners
    // because the eager strategy relies on knowing the whole list ahead of time.
    // If we wanted to support this, we'd have to add code to keep track
    // (or search) for all portal and root containers, and lazily add listeners
    // to them whenever we see a previously unknown event. This seems like a lot
    // of complexity for something we don't even have a particular use case for.
    // Unfortunately, the downside of this invariant is that *removing* a native
    // event from the list of known events has now become a breaking change for
    // any code relying on the createEventHandle API.

    if (!allNativeEvents.has(domEventName)) {
      throw new Error("Cannot call unstable_createEventHandle with \"" + domEventName + "\", as it is not an event known to React.");
    }
    var isCapturePhaseListener = false;
    if (options != null) {
      var optionsCapture = options.capture;
      if (typeof optionsCapture === 'boolean') {
        isCapturePhaseListener = optionsCapture;
      }
    }
    var eventHandle = function (target, callback) {
      if (typeof callback !== 'function') {
        throw new Error('ReactDOM.createEventHandle: setter called with an invalid ' + 'callback. The callback must be a function.');
      }
      if (!doesTargetHaveEventHandle(target, eventHandle)) {
        addEventHandleToTarget(target, eventHandle);
        registerReactDOMEvent(target, domEventName, isCapturePhaseListener);
      }
      var listener = createEventHandleListener(domEventName, isCapturePhaseListener, callback);
      var targetListeners = getEventHandlerListeners(target);
      if (targetListeners === null) {
        targetListeners = new Set();
        setEventHandlerListeners(target, targetListeners);
      }
      targetListeners.add(listener);
      return function () {
        targetListeners.delete(listener);
      };
    };
    return eventHandle;
  }
  return null;
}