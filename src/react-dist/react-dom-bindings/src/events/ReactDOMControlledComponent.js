import { getInstanceFromNode, getFiberCurrentPropsFromNode } from '../client/ReactDOMComponentTree'; // Use to restore controlled state after a change event has fired.

var restoreImpl = null;
var restoreTarget = null;
var restoreQueue = null;
function restoreStateOfTarget(target) {
  // We perform this translation at the end of the event loop so that we
  // always receive the correct fiber here
  var internalInstance = getInstanceFromNode(target);
  if (!internalInstance) {
    // Unmounted
    return;
  }
  if (typeof restoreImpl !== 'function') {
    throw new Error('setRestoreImplementation() needs to be called to handle a target for controlled ' + 'events. This error is likely caused by a bug in React. Please file an issue.');
  }
  var stateNode = internalInstance.stateNode; // Guard against Fiber being unmounted.

  if (stateNode) {
    var props = getFiberCurrentPropsFromNode(stateNode);
    restoreImpl(internalInstance.stateNode, internalInstance.type, props);
  }
}
export function setRestoreImplementation(impl) {
  restoreImpl = impl;
}
export function enqueueStateRestore(target) {
  if (restoreTarget) {
    if (restoreQueue) {
      restoreQueue.push(target);
    } else {
      restoreQueue = [target];
    }
  } else {
    restoreTarget = target;
  }
}
export function needsStateRestore() {
  return restoreTarget !== null || restoreQueue !== null;
}
export function restoreStateIfNeeded() {
  if (!restoreTarget) {
    return;
  }
  var target = restoreTarget;
  var queuedTargets = restoreQueue;
  restoreTarget = null;
  restoreQueue = null;
  restoreStateOfTarget(target);
  if (queuedTargets) {
    for (var i = 0; i < queuedTargets.length; i++) {
      restoreStateOfTarget(queuedTargets[i]);
    }
  }
}