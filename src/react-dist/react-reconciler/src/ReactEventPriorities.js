import { NoLane, SyncLane, InputContinuousLane, DefaultLane, IdleLane, getHighestPriorityLane, includesNonIdleWork } from './ReactFiberLane';
export var DiscreteEventPriority = SyncLane;
export var ContinuousEventPriority = InputContinuousLane;
export var DefaultEventPriority = DefaultLane;
export var IdleEventPriority = IdleLane;
var currentUpdatePriority = NoLane;
export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}
export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority;
}
export function runWithPriority(priority, fn) {
  var previousPriority = currentUpdatePriority;
  try {
    currentUpdatePriority = priority;
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}
export function higherEventPriority(a, b) {
  return a !== 0 && a < b ? a : b;
}
export function lowerEventPriority(a, b) {
  return a === 0 || a > b ? a : b;
}
export function isHigherEventPriority(a, b) {
  return a !== 0 && a < b;
}
export function lanesToEventPriority(lanes) {
  var lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}