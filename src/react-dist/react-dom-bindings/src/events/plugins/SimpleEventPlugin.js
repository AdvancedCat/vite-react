import { SyntheticEvent, SyntheticKeyboardEvent, SyntheticFocusEvent, SyntheticMouseEvent, SyntheticDragEvent, SyntheticTouchEvent, SyntheticAnimationEvent, SyntheticTransitionEvent, SyntheticUIEvent, SyntheticWheelEvent, SyntheticClipboardEvent, SyntheticPointerEvent } from '../../events/SyntheticEvent';
import { ANIMATION_END, ANIMATION_ITERATION, ANIMATION_START, TRANSITION_END } from '../DOMEventNames';
import { topLevelEventsToReactNames, registerSimpleEvents } from '../DOMEventProperties';
import { accumulateSinglePhaseListeners, accumulateEventHandleNonManagedNodeListeners } from '../DOMPluginEventSystem';
import { IS_EVENT_HANDLE_NON_MANAGED_NODE, IS_CAPTURE_PHASE } from '../EventSystemFlags';
import getEventCharCode from '../getEventCharCode';
import { enableCreateEventHandleAPI } from "../../../../shared/ReactFeatureFlags";
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
  var reactName = topLevelEventsToReactNames.get(domEventName);
  if (reactName === undefined) {
    return;
  }
  var SyntheticEventCtor = SyntheticEvent;
  var reactEventType = domEventName;
  switch (domEventName) {
    case 'keypress':
      // Firefox creates a keypress event for function keys too. This removes
      // the unwanted keypress events. Enter is however both printable and
      // non-printable. One would expect Tab to be as well (but it isn't).
      if (getEventCharCode(nativeEvent) === 0) {
        return;
      }

    /* falls through */

    case 'keydown':
    case 'keyup':
      SyntheticEventCtor = SyntheticKeyboardEvent;
      break;
    case 'focusin':
      reactEventType = 'focus';
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case 'focusout':
      reactEventType = 'blur';
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case 'beforeblur':
    case 'afterblur':
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case 'click':
      // Firefox creates a click event on right mouse clicks. This removes the
      // unwanted click events.
      if (nativeEvent.button === 2) {
        return;
      }

    /* falls through */

    case 'auxclick':
    case 'dblclick':
    case 'mousedown':
    case 'mousemove':
    case 'mouseup': // TODO: Disabled elements should not respond to mouse events

    /* falls through */

    case 'mouseout':
    case 'mouseover':
    case 'contextmenu':
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    case 'drag':
    case 'dragend':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'dragstart':
    case 'drop':
      SyntheticEventCtor = SyntheticDragEvent;
      break;
    case 'touchcancel':
    case 'touchend':
    case 'touchmove':
    case 'touchstart':
      SyntheticEventCtor = SyntheticTouchEvent;
      break;
    case ANIMATION_END:
    case ANIMATION_ITERATION:
    case ANIMATION_START:
      SyntheticEventCtor = SyntheticAnimationEvent;
      break;
    case TRANSITION_END:
      SyntheticEventCtor = SyntheticTransitionEvent;
      break;
    case 'scroll':
      SyntheticEventCtor = SyntheticUIEvent;
      break;
    case 'wheel':
      SyntheticEventCtor = SyntheticWheelEvent;
      break;
    case 'copy':
    case 'cut':
    case 'paste':
      SyntheticEventCtor = SyntheticClipboardEvent;
      break;
    case 'gotpointercapture':
    case 'lostpointercapture':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'pointerup':
      SyntheticEventCtor = SyntheticPointerEvent;
      break;
    default:
      // Unknown event. This is used by createEventHandle.
      break;
  }
  var inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  if (enableCreateEventHandleAPI && eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE) {
    var listeners = accumulateEventHandleNonManagedNodeListeners(
    // TODO: this cast may not make sense for events like
    // "focus" where React listens to e.g. "focusin".
    reactEventType, targetContainer, inCapturePhase);
    if (listeners.length > 0) {
      // Intentionally create event lazily.
      var event = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget);
      dispatchQueue.push({
        event: event,
        listeners: listeners
      });
    }
  } else {
    // Some events don't bubble in the browser.
    // In the past, React has always bubbled them, but this can be surprising.
    // We're going to try aligning closer to the browser behavior by not bubbling
    // them in React either. We'll start by not bubbling onScroll, and then expand.
    var accumulateTargetOnly = !inCapturePhase &&
    // TODO: ideally, we'd eventually add all events from
    // nonDelegatedEvents list in DOMPluginEventSystem.
    // Then we can remove this special list.
    // This is a breaking change that can wait until React 18.
    domEventName === 'scroll';
    var _listeners = accumulateSinglePhaseListeners(targetInst, reactName, nativeEvent.type, inCapturePhase, accumulateTargetOnly, nativeEvent);
    if (_listeners.length > 0) {
      // Intentionally create event lazily.
      var _event = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget);
      dispatchQueue.push({
        event: _event,
        listeners: _listeners
      });
    }
  }
}
export { registerSimpleEvents as registerEvents, extractEvents };