import { enableTransitionTracing } from "../../shared/ReactFeatureFlags";
import { createCursor, push, pop } from './ReactFiberStack';
import { getWorkInProgressTransitions } from './ReactFiberWorkLoop'; // TODO: Is there a way to not include the tag or name here?

export var TransitionRoot = 0;
export var TransitionTracingMarker = 1;
export function processTransitionCallbacks(pendingTransitions, endTime, callbacks) {
  if (enableTransitionTracing) {
    if (pendingTransitions !== null) {
      var transitionStart = pendingTransitions.transitionStart;
      var onTransitionStart = callbacks.onTransitionStart;
      if (transitionStart !== null && onTransitionStart != null) {
        transitionStart.forEach(function (transition) {
          return onTransitionStart(transition.name, transition.startTime);
        });
      }
      var markerProgress = pendingTransitions.markerProgress;
      var onMarkerProgress = callbacks.onMarkerProgress;
      if (onMarkerProgress != null && markerProgress !== null) {
        markerProgress.forEach(function (markerInstance, markerName) {
          if (markerInstance.transitions !== null) {
            // TODO: Clone the suspense object so users can't modify it
            var pending = markerInstance.pendingBoundaries !== null ? Array.from(markerInstance.pendingBoundaries.values()) : [];
            markerInstance.transitions.forEach(function (transition) {
              onMarkerProgress(transition.name, markerName, transition.startTime, endTime, pending);
            });
          }
        });
      }
      var markerComplete = pendingTransitions.markerComplete;
      var onMarkerComplete = callbacks.onMarkerComplete;
      if (markerComplete !== null && onMarkerComplete != null) {
        markerComplete.forEach(function (transitions, markerName) {
          transitions.forEach(function (transition) {
            onMarkerComplete(transition.name, markerName, transition.startTime, endTime);
          });
        });
      }
      var markerIncomplete = pendingTransitions.markerIncomplete;
      var onMarkerIncomplete = callbacks.onMarkerIncomplete;
      if (onMarkerIncomplete != null && markerIncomplete !== null) {
        markerIncomplete.forEach(function (_ref, markerName) {
          var transitions = _ref.transitions,
            aborts = _ref.aborts;
          transitions.forEach(function (transition) {
            var filteredAborts = [];
            aborts.forEach(function (abort) {
              switch (abort.reason) {
                case 'marker':
                  {
                    filteredAborts.push({
                      type: 'marker',
                      name: abort.name,
                      endTime: endTime
                    });
                    break;
                  }
                case 'suspense':
                  {
                    filteredAborts.push({
                      type: 'suspense',
                      name: abort.name,
                      endTime: endTime
                    });
                    break;
                  }
                default:
                  {
                    break;
                  }
              }
            });
            if (filteredAborts.length > 0) {
              onMarkerIncomplete(transition.name, markerName, transition.startTime, filteredAborts);
            }
          });
        });
      }
      var transitionProgress = pendingTransitions.transitionProgress;
      var onTransitionProgress = callbacks.onTransitionProgress;
      if (onTransitionProgress != null && transitionProgress !== null) {
        transitionProgress.forEach(function (pending, transition) {
          onTransitionProgress(transition.name, transition.startTime, endTime, Array.from(pending.values()));
        });
      }
      var transitionComplete = pendingTransitions.transitionComplete;
      var onTransitionComplete = callbacks.onTransitionComplete;
      if (transitionComplete !== null && onTransitionComplete != null) {
        transitionComplete.forEach(function (transition) {
          return onTransitionComplete(transition.name, transition.startTime, endTime);
        });
      }
    }
  }
} // For every tracing marker, store a pointer to it. We will later access it
// to get the set of suspense boundaries that need to resolve before the
// tracing marker can be logged as complete
// This code lives separate from the ReactFiberTransition code because
// we push and pop on the tracing marker, not the suspense boundary

var markerInstanceStack = createCursor(null);
export function pushRootMarkerInstance(workInProgress) {
  if (enableTransitionTracing) {
    // On the root, every transition gets mapped to it's own map of
    // suspense boundaries. The transition is marked as complete when
    // the suspense boundaries map is empty. We do this because every
    // transition completes at different times and depends on different
    // suspense boundaries to complete. We store all the transitions
    // along with its map of suspense boundaries in the root incomplete
    // transitions map. Each entry in this map functions like a tracing
    // marker does, so we can push it onto the marker instance stack
    var transitions = getWorkInProgressTransitions();
    var root = workInProgress.stateNode;
    if (transitions !== null) {
      transitions.forEach(function (transition) {
        if (!root.incompleteTransitions.has(transition)) {
          var markerInstance = {
            tag: TransitionRoot,
            transitions: new Set([transition]),
            pendingBoundaries: null,
            aborts: null,
            name: null
          };
          root.incompleteTransitions.set(transition, markerInstance);
        }
      });
    }
    var markerInstances = []; // For ever transition on the suspense boundary, we push the transition
    // along with its map of pending suspense boundaries onto the marker
    // instance stack.

    root.incompleteTransitions.forEach(function (markerInstance) {
      markerInstances.push(markerInstance);
    });
    push(markerInstanceStack, markerInstances, workInProgress);
  }
}
export function popRootMarkerInstance(workInProgress) {
  if (enableTransitionTracing) {
    pop(markerInstanceStack, workInProgress);
  }
}
export function pushMarkerInstance(workInProgress, markerInstance) {
  if (enableTransitionTracing) {
    if (markerInstanceStack.current === null) {
      push(markerInstanceStack, [markerInstance], workInProgress);
    } else {
      push(markerInstanceStack, markerInstanceStack.current.concat(markerInstance), workInProgress);
    }
  }
}
export function popMarkerInstance(workInProgress) {
  if (enableTransitionTracing) {
    pop(markerInstanceStack, workInProgress);
  }
}
export function getMarkerInstances() {
  if (enableTransitionTracing) {
    return markerInstanceStack.current;
  }
  return null;
}