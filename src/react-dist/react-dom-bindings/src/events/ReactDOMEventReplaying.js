import { enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay } from "../../../shared/ReactFeatureFlags";
import { unstable_scheduleCallback as scheduleCallback, unstable_NormalPriority as NormalPriority } from "../../../scheduler";
import { getNearestMountedFiber, getContainerFromFiber, getSuspenseInstanceFromFiber } from "../../../react-reconciler/src/ReactFiberTreeReflection";
import { findInstanceBlockingEvent, return_targetInst } from './ReactDOMEventListener';
import { setReplayingEvent, resetReplayingEvent } from './CurrentReplayingEvent';
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem';
import { getInstanceFromNode, getClosestInstanceFromNode } from '../client/ReactDOMComponentTree';
import { HostRoot, SuspenseComponent } from "../../../react-reconciler/src/ReactWorkTags";
import { isHigherEventPriority } from "../../../react-reconciler/src/ReactEventPriorities";
import { isRootDehydrated } from "../../../react-reconciler/src/ReactFiberShellHydration";
var _attemptSynchronousHydration;
export function setAttemptSynchronousHydration(fn) {
  _attemptSynchronousHydration = fn;
}
export function attemptSynchronousHydration(fiber) {
  _attemptSynchronousHydration(fiber);
}
var attemptDiscreteHydration;
export function setAttemptDiscreteHydration(fn) {
  attemptDiscreteHydration = fn;
}
var attemptContinuousHydration;
export function setAttemptContinuousHydration(fn) {
  attemptContinuousHydration = fn;
}
var attemptHydrationAtCurrentPriority;
export function setAttemptHydrationAtCurrentPriority(fn) {
  attemptHydrationAtCurrentPriority = fn;
}
var getCurrentUpdatePriority;
export function setGetCurrentUpdatePriority(fn) {
  getCurrentUpdatePriority = fn;
}
var attemptHydrationAtPriority;
export function setAttemptHydrationAtPriority(fn) {
  attemptHydrationAtPriority = fn;
} // TODO: Upgrade this definition once we're on a newer version of Flow that
// has this definition built-in.

var hasScheduledReplayAttempt = false; // The queue of discrete events to be replayed.

var queuedDiscreteEvents = []; // Indicates if any continuous event targets are non-null for early bailout.

var hasAnyQueuedContinuousEvents = false; // The last of each continuous event type. We only need to replay the last one
// if the last target was dehydrated.

var queuedFocus = null;
var queuedDrag = null;
var queuedMouse = null; // For pointer events there can be one latest event per pointerId.

var queuedPointers = new Map();
var queuedPointerCaptures = new Map(); // We could consider replaying selectionchange and touchmoves too.

var queuedExplicitHydrationTargets = [];
export function hasQueuedDiscreteEvents() {
  return queuedDiscreteEvents.length > 0;
}
export function hasQueuedContinuousEvents() {
  return hasAnyQueuedContinuousEvents;
}
var discreteReplayableEvents = ['mousedown', 'mouseup', 'touchcancel', 'touchend', 'touchstart', 'auxclick', 'dblclick', 'pointercancel', 'pointerdown', 'pointerup', 'dragend', 'dragstart', 'drop', 'compositionend', 'compositionstart', 'keydown', 'keypress', 'keyup', 'input', 'textInput',
// Intentionally camelCase
'copy', 'cut', 'paste', 'click', 'change', 'contextmenu', 'reset', 'submit'];
export function isDiscreteEventThatRequiresHydration(eventType) {
  return discreteReplayableEvents.indexOf(eventType) > -1;
}
function createQueuedReplayableEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  return {
    blockedOn: blockedOn,
    domEventName: domEventName,
    eventSystemFlags: eventSystemFlags,
    nativeEvent: nativeEvent,
    targetContainers: [targetContainer]
  };
}
export function queueDiscreteEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  if (enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay) {
    return;
  }
  var queuedEvent = createQueuedReplayableEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent);
  queuedDiscreteEvents.push(queuedEvent);
  if (queuedDiscreteEvents.length === 1) {
    // If this was the first discrete event, we might be able to
    // synchronously unblock it so that preventDefault still works.
    while (queuedEvent.blockedOn !== null) {
      var fiber = getInstanceFromNode(queuedEvent.blockedOn);
      if (fiber === null) {
        break;
      }
      attemptSynchronousHydration(fiber);
      if (queuedEvent.blockedOn === null) {
        // We got unblocked by hydration. Let's try again.
        replayUnblockedEvents(); // If we're reblocked, on an inner boundary, we might need
        // to attempt hydrating that one.

        continue;
      } else {
        // We're still blocked from hydration, we have to give up
        // and replay later.
        break;
      }
    }
  }
} // Resets the replaying for this type of continuous event to no event.

export function clearIfContinuousEvent(domEventName, nativeEvent) {
  switch (domEventName) {
    case 'focusin':
    case 'focusout':
      queuedFocus = null;
      break;
    case 'dragenter':
    case 'dragleave':
      queuedDrag = null;
      break;
    case 'mouseover':
    case 'mouseout':
      queuedMouse = null;
      break;
    case 'pointerover':
    case 'pointerout':
      {
        var pointerId = nativeEvent.pointerId;
        queuedPointers.delete(pointerId);
        break;
      }
    case 'gotpointercapture':
    case 'lostpointercapture':
      {
        var _pointerId = nativeEvent.pointerId;
        queuedPointerCaptures.delete(_pointerId);
        break;
      }
  }
}
function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  if (existingQueuedEvent === null || existingQueuedEvent.nativeEvent !== nativeEvent) {
    var queuedEvent = createQueuedReplayableEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent);
    if (blockedOn !== null) {
      var fiber = getInstanceFromNode(blockedOn);
      if (fiber !== null) {
        // Attempt to increase the priority of this target.
        attemptContinuousHydration(fiber);
      }
    }
    return queuedEvent;
  } // If we have already queued this exact event, then it's because
  // the different event systems have different DOM event listeners.
  // We can accumulate the flags, and the targetContainers, and
  // store a single event to be replayed.

  existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
  var targetContainers = existingQueuedEvent.targetContainers;
  if (targetContainer !== null && targetContainers.indexOf(targetContainer) === -1) {
    targetContainers.push(targetContainer);
  }
  return existingQueuedEvent;
}
export function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  // These set relatedTarget to null because the replayed event will be treated as if we
  // moved from outside the window (no target) onto the target once it hydrates.
  // Instead of mutating we could clone the event.
  switch (domEventName) {
    case 'focusin':
      {
        var focusEvent = nativeEvent;
        queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(queuedFocus, blockedOn, domEventName, eventSystemFlags, targetContainer, focusEvent);
        return true;
      }
    case 'dragenter':
      {
        var dragEvent = nativeEvent;
        queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(queuedDrag, blockedOn, domEventName, eventSystemFlags, targetContainer, dragEvent);
        return true;
      }
    case 'mouseover':
      {
        var mouseEvent = nativeEvent;
        queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(queuedMouse, blockedOn, domEventName, eventSystemFlags, targetContainer, mouseEvent);
        return true;
      }
    case 'pointerover':
      {
        var pointerEvent = nativeEvent;
        var pointerId = pointerEvent.pointerId;
        queuedPointers.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointers.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, pointerEvent));
        return true;
      }
    case 'gotpointercapture':
      {
        var _pointerEvent = nativeEvent;
        var _pointerId2 = _pointerEvent.pointerId;
        queuedPointerCaptures.set(_pointerId2, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointerCaptures.get(_pointerId2) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, _pointerEvent));
        return true;
      }
  }
  return false;
} // Check if this target is unblocked. Returns true if it's unblocked.

function attemptExplicitHydrationTarget(queuedTarget) {
  // TODO: This function shares a lot of logic with findInstanceBlockingEvent.
  // Try to unify them. It's a bit tricky since it would require two return
  // values.
  var targetInst = getClosestInstanceFromNode(queuedTarget.target);
  if (targetInst !== null) {
    var nearestMounted = getNearestMountedFiber(targetInst);
    if (nearestMounted !== null) {
      var tag = nearestMounted.tag;
      if (tag === SuspenseComponent) {
        var instance = getSuspenseInstanceFromFiber(nearestMounted);
        if (instance !== null) {
          // We're blocked on hydrating this boundary.
          // Increase its priority.
          queuedTarget.blockedOn = instance;
          attemptHydrationAtPriority(queuedTarget.priority, function () {
            attemptHydrationAtCurrentPriority(nearestMounted);
          });
          return;
        }
      } else if (tag === HostRoot) {
        var root = nearestMounted.stateNode;
        if (isRootDehydrated(root)) {
          queuedTarget.blockedOn = getContainerFromFiber(nearestMounted); // We don't currently have a way to increase the priority of
          // a root other than sync.

          return;
        }
      }
    }
  }
  queuedTarget.blockedOn = null;
}
export function queueExplicitHydrationTarget(target) {
  // TODO: This will read the priority if it's dispatched by the React
  // event system but not native events. Should read window.event.type, like
  // we do for updates (getCurrentEventPriority).
  var updatePriority = getCurrentUpdatePriority();
  var queuedTarget = {
    blockedOn: null,
    target: target,
    priority: updatePriority
  };
  var i = 0;
  for (; i < queuedExplicitHydrationTargets.length; i++) {
    // Stop once we hit the first target with lower priority than
    if (!isHigherEventPriority(updatePriority, queuedExplicitHydrationTargets[i].priority)) {
      break;
    }
  }
  queuedExplicitHydrationTargets.splice(i, 0, queuedTarget);
  if (i === 0) {
    attemptExplicitHydrationTarget(queuedTarget);
  }
}
function attemptReplayContinuousQueuedEvent(queuedEvent) {
  if (queuedEvent.blockedOn !== null) {
    return false;
  }
  var targetContainers = queuedEvent.targetContainers;
  while (targetContainers.length > 0) {
    var targetContainer = targetContainers[0];
    var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.domEventName, queuedEvent.eventSystemFlags, targetContainer, queuedEvent.nativeEvent);
    if (nextBlockedOn === null) {
      if (enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay) {
        var nativeEvent = queuedEvent.nativeEvent;
        var nativeEventClone = new nativeEvent.constructor(nativeEvent.type, nativeEvent);
        setReplayingEvent(nativeEventClone);
        nativeEvent.target.dispatchEvent(nativeEventClone);
        resetReplayingEvent();
      } else {
        setReplayingEvent(queuedEvent.nativeEvent);
        dispatchEventForPluginEventSystem(queuedEvent.domEventName, queuedEvent.eventSystemFlags, queuedEvent.nativeEvent, return_targetInst, targetContainer);
        resetReplayingEvent();
      }
    } else {
      // We're still blocked. Try again later.
      var fiber = getInstanceFromNode(nextBlockedOn);
      if (fiber !== null) {
        attemptContinuousHydration(fiber);
      }
      queuedEvent.blockedOn = nextBlockedOn;
      return false;
    } // This target container was successfully dispatched. Try the next.

    targetContainers.shift();
  }
  return true;
}
function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
  if (attemptReplayContinuousQueuedEvent(queuedEvent)) {
    map.delete(key);
  }
}
function replayUnblockedEvents() {
  hasScheduledReplayAttempt = false;
  if (!enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay) {
    // First replay discrete events.
    while (queuedDiscreteEvents.length > 0) {
      var nextDiscreteEvent = queuedDiscreteEvents[0];
      if (nextDiscreteEvent.blockedOn !== null) {
        // We're still blocked.
        // Increase the priority of this boundary to unblock
        // the next discrete event.
        var fiber = getInstanceFromNode(nextDiscreteEvent.blockedOn);
        if (fiber !== null) {
          attemptDiscreteHydration(fiber);
        }
        break;
      }
      var targetContainers = nextDiscreteEvent.targetContainers;
      while (targetContainers.length > 0) {
        var targetContainer = targetContainers[0];
        var nextBlockedOn = findInstanceBlockingEvent(nextDiscreteEvent.domEventName, nextDiscreteEvent.eventSystemFlags, targetContainer, nextDiscreteEvent.nativeEvent);
        if (nextBlockedOn === null) {
          // This whole function is in !enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
          // so we don't need the new replay behavior code branch.
          setReplayingEvent(nextDiscreteEvent.nativeEvent);
          dispatchEventForPluginEventSystem(nextDiscreteEvent.domEventName, nextDiscreteEvent.eventSystemFlags, nextDiscreteEvent.nativeEvent, return_targetInst, targetContainer);
          resetReplayingEvent();
        } else {
          // We're still blocked. Try again later.
          nextDiscreteEvent.blockedOn = nextBlockedOn;
          break;
        } // This target container was successfully dispatched. Try the next.

        targetContainers.shift();
      }
      if (nextDiscreteEvent.blockedOn === null) {
        // We've successfully replayed the first event. Let's try the next one.
        queuedDiscreteEvents.shift();
      }
    }
  } // Next replay any continuous events.

  if (queuedFocus !== null && attemptReplayContinuousQueuedEvent(queuedFocus)) {
    queuedFocus = null;
  }
  if (queuedDrag !== null && attemptReplayContinuousQueuedEvent(queuedDrag)) {
    queuedDrag = null;
  }
  if (queuedMouse !== null && attemptReplayContinuousQueuedEvent(queuedMouse)) {
    queuedMouse = null;
  }
  queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
  queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
}
function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
  if (queuedEvent.blockedOn === unblocked) {
    queuedEvent.blockedOn = null;
    if (!hasScheduledReplayAttempt) {
      hasScheduledReplayAttempt = true; // Schedule a callback to attempt replaying as many events as are
      // now unblocked. This first might not actually be unblocked yet.
      // We could check it early to avoid scheduling an unnecessary callback.

      scheduleCallback(NormalPriority, replayUnblockedEvents);
    }
  }
}
export function retryIfBlockedOn(unblocked) {
  // Mark anything that was blocked on this as no longer blocked
  // and eligible for a replay.
  if (queuedDiscreteEvents.length > 0) {
    scheduleCallbackIfUnblocked(queuedDiscreteEvents[0], unblocked); // This is a exponential search for each boundary that commits. I think it's
    // worth it because we expect very few discrete events to queue up and once
    // we are actually fully unblocked it will be fast to replay them.

    for (var i = 1; i < queuedDiscreteEvents.length; i++) {
      var queuedEvent = queuedDiscreteEvents[i];
      if (queuedEvent.blockedOn === unblocked) {
        queuedEvent.blockedOn = null;
      }
    }
  }
  if (queuedFocus !== null) {
    scheduleCallbackIfUnblocked(queuedFocus, unblocked);
  }
  if (queuedDrag !== null) {
    scheduleCallbackIfUnblocked(queuedDrag, unblocked);
  }
  if (queuedMouse !== null) {
    scheduleCallbackIfUnblocked(queuedMouse, unblocked);
  }
  var unblock = function (queuedEvent) {
    return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
  };
  queuedPointers.forEach(unblock);
  queuedPointerCaptures.forEach(unblock);
  for (var _i = 0; _i < queuedExplicitHydrationTargets.length; _i++) {
    var queuedTarget = queuedExplicitHydrationTargets[_i];
    if (queuedTarget.blockedOn === unblocked) {
      queuedTarget.blockedOn = null;
    }
  }
  while (queuedExplicitHydrationTargets.length > 0) {
    var nextExplicitTarget = queuedExplicitHydrationTargets[0];
    if (nextExplicitTarget.blockedOn !== null) {
      // We're still blocked.
      break;
    } else {
      attemptExplicitHydrationTarget(nextExplicitTarget);
      if (nextExplicitTarget.blockedOn === null) {
        // We're unblocked.
        queuedExplicitHydrationTargets.shift();
      }
    }
  }
}