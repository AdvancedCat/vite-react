import { error as _consoleError } from "../../shared/consoleWithStackDev";
// TODO: Ideally these types would be opaque but that doesn't work well with
// our reconciler fork infra, since these leak into non-reconciler packages.
import { enableSchedulingProfiler, enableUpdaterTracking, allowConcurrentByDefault, enableTransitionTracing, enableUnifiedSyncLane } from "../../shared/ReactFeatureFlags";
import { isDevToolsPresent } from './ReactFiberDevToolsHook';
import { ConcurrentUpdatesByDefaultMode, NoMode } from './ReactTypeOfMode';
import { clz32 } from './clz32'; // Lane values below should be kept in sync with getLabelForLane(), used by react-devtools-timeline.
// If those values are changed that package should be rebuilt and redeployed.

export var TotalLanes = 31;
export var NoLanes = /*                        */
0;
export var NoLane = /*                          */
0;
export var SyncHydrationLane = /*               */
1;
export var SyncLane = /*                        */
2;
export var InputContinuousHydrationLane = /*    */
4;
export var InputContinuousLane = /*             */
8;
export var DefaultHydrationLane = /*            */
16;
export var DefaultLane = /*                     */
32;
export var SyncUpdateLanes = /*                */
42;
var TransitionHydrationLane = /*                */
64;
var TransitionLanes = /*                       */
8388480;
var TransitionLane1 = /*                        */
128;
var TransitionLane2 = /*                        */
256;
var TransitionLane3 = /*                        */
512;
var TransitionLane4 = /*                        */
1024;
var TransitionLane5 = /*                        */
2048;
var TransitionLane6 = /*                        */
4096;
var TransitionLane7 = /*                        */
8192;
var TransitionLane8 = /*                        */
16384;
var TransitionLane9 = /*                        */
32768;
var TransitionLane10 = /*                       */
65536;
var TransitionLane11 = /*                       */
131072;
var TransitionLane12 = /*                       */
262144;
var TransitionLane13 = /*                       */
524288;
var TransitionLane14 = /*                       */
1048576;
var TransitionLane15 = /*                       */
2097152;
var TransitionLane16 = /*                       */
4194304;
var RetryLanes = /*                            */
125829120;
var RetryLane1 = /*                             */
8388608;
var RetryLane2 = /*                             */
16777216;
var RetryLane3 = /*                             */
33554432;
var RetryLane4 = /*                             */
67108864;
export var SomeRetryLane = RetryLane1;
export var SelectiveHydrationLane = /*          */
134217728;
var NonIdleLanes = /*                          */
268435455;
export var IdleHydrationLane = /*               */
268435456;
export var IdleLane = /*                        */
536870912;
export var OffscreenLane = /*                   */
1073741824; // This function is used for the experimental timeline (react-devtools-timeline)
// It should be kept in sync with the Lanes values above.

export function getLabelForLane(lane) {
  if (enableSchedulingProfiler) {
    if (lane & SyncHydrationLane) {
      return 'SyncHydrationLane';
    }
    if (lane & SyncLane) {
      return 'Sync';
    }
    if (lane & InputContinuousHydrationLane) {
      return 'InputContinuousHydration';
    }
    if (lane & InputContinuousLane) {
      return 'InputContinuous';
    }
    if (lane & DefaultHydrationLane) {
      return 'DefaultHydration';
    }
    if (lane & DefaultLane) {
      return 'Default';
    }
    if (lane & TransitionHydrationLane) {
      return 'TransitionHydration';
    }
    if (lane & TransitionLanes) {
      return 'Transition';
    }
    if (lane & RetryLanes) {
      return 'Retry';
    }
    if (lane & SelectiveHydrationLane) {
      return 'SelectiveHydration';
    }
    if (lane & IdleHydrationLane) {
      return 'IdleHydration';
    }
    if (lane & IdleLane) {
      return 'Idle';
    }
    if (lane & OffscreenLane) {
      return 'Offscreen';
    }
  }
}
export var NoTimestamp = -1;
var nextTransitionLane = TransitionLane1;
var nextRetryLane = RetryLane1;
function getHighestPriorityLanes(lanes) {
  if (enableUnifiedSyncLane) {
    var pendingSyncLanes = lanes & SyncUpdateLanes;
    if (pendingSyncLanes !== 0) {
      return pendingSyncLanes;
    }
  }
  switch (getHighestPriorityLane(lanes)) {
    case SyncHydrationLane:
      return SyncHydrationLane;
    case SyncLane:
      return SyncLane;
    case InputContinuousHydrationLane:
      return InputContinuousHydrationLane;
    case InputContinuousLane:
      return InputContinuousLane;
    case DefaultHydrationLane:
      return DefaultHydrationLane;
    case DefaultLane:
      return DefaultLane;
    case TransitionHydrationLane:
      return TransitionHydrationLane;
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
    case TransitionLane15:
    case TransitionLane16:
      return lanes & TransitionLanes;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
      return lanes & RetryLanes;
    case SelectiveHydrationLane:
      return SelectiveHydrationLane;
    case IdleHydrationLane:
      return IdleHydrationLane;
    case IdleLane:
      return IdleLane;
    case OffscreenLane:
      return OffscreenLane;
    default:
      // This shouldn't be reachable, but as a fallback, return the entire bitmask.

      return lanes;
  }
}
export function getNextLanes(root, wipLanes) {
  // Early bailout if there's no pending work left.
  var pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }
  var nextLanes = NoLanes;
  var suspendedLanes = root.suspendedLanes;
  var pingedLanes = root.pingedLanes; // Do not work on any idle work until all the non-idle work has finished,
  // even if the work is suspended.

  var nonIdlePendingLanes = pendingLanes & NonIdleLanes;
  if (nonIdlePendingLanes !== NoLanes) {
    var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
    if (nonIdleUnblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
    } else {
      var nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
      if (nonIdlePingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
      }
    }
  } else {
    // The only remaining work is Idle.
    var unblockedLanes = pendingLanes & ~suspendedLanes;
    if (unblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(unblockedLanes);
    } else {
      if (pingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(pingedLanes);
      }
    }
  }
  if (nextLanes === NoLanes) {
    // This should only be reachable if we're suspended
    // TODO: Consider warning in this path if a fallback timer is not scheduled.
    return NoLanes;
  } // If we're already in the middle of a render, switching lanes will interrupt
  // it and we'll lose our progress. We should only do this if the new lanes are
  // higher priority.

  if (wipLanes !== NoLanes && wipLanes !== nextLanes &&
  // If we already suspended with a delay, then interrupting is fine. Don't
  // bother waiting until the root is complete.
  (wipLanes & suspendedLanes) === NoLanes) {
    var nextLane = getHighestPriorityLane(nextLanes);
    var wipLane = getHighestPriorityLane(wipLanes);
    if (
    // Tests whether the next lane is equal or lower priority than the wip
    // one. This works because the bits decrease in priority as you go left.
    nextLane >= wipLane ||
    // Default priority updates should not interrupt transition updates. The
    // only difference between default updates and transition updates is that
    // default updates do not support refresh transitions.
    nextLane === DefaultLane && (wipLane & TransitionLanes) !== NoLanes) {
      // Keep working on the existing in-progress tree. Do not interrupt.
      return wipLanes;
    }
  }
  if (allowConcurrentByDefault && (root.current.mode & ConcurrentUpdatesByDefaultMode) !== NoMode) {// Do nothing, use the lanes as they were assigned.
  } else if ((nextLanes & InputContinuousLane) !== NoLanes) {
    // When updates are sync by default, we entangle continuous priority updates
    // and default updates, so they render in the same batch. The only reason
    // they use separate lanes is because continuous updates should interrupt
    // transitions, but default updates should not.
    nextLanes |= pendingLanes & DefaultLane;
  } // Check for entangled lanes and add them to the batch.
  //
  // A lane is said to be entangled with another when it's not allowed to render
  // in a batch that does not also include the other lane. Typically we do this
  // when multiple updates have the same source, and we only want to respond to
  // the most recent event from that source.
  //
  // Note that we apply entanglements *after* checking for partial work above.
  // This means that if a lane is entangled during an interleaved event while
  // it's already rendering, we won't interrupt it. This is intentional, since
  // entanglement is usually "best effort": we'll try our best to render the
  // lanes in the same batch, but it's not worth throwing out partially
  // completed work in order to do it.
  // TODO: Reconsider this. The counter-argument is that the partial work
  // represents an intermediate state, which we don't want to show to the user.
  // And by spending extra time finishing it, we're increasing the amount of
  // time it takes to show the final state, which is what they are actually
  // waiting for.
  //
  // For those exceptions where entanglement is semantically important, like
  // useMutableSource, we should ensure that there is no partial work at the
  // time we apply the entanglement.

  var entangledLanes = root.entangledLanes;
  if (entangledLanes !== NoLanes) {
    var entanglements = root.entanglements;
    var lanes = nextLanes & entangledLanes;
    while (lanes > 0) {
      var index = pickArbitraryLaneIndex(lanes);
      var lane = 1 << index;
      nextLanes |= entanglements[index];
      lanes &= ~lane;
    }
  }
  return nextLanes;
}
export function getMostRecentEventTime(root, lanes) {
  var eventTimes = root.eventTimes;
  var mostRecentEventTime = NoTimestamp;
  while (lanes > 0) {
    var index = pickArbitraryLaneIndex(lanes);
    var lane = 1 << index;
    var eventTime = eventTimes[index];
    if (eventTime > mostRecentEventTime) {
      mostRecentEventTime = eventTime;
    }
    lanes &= ~lane;
  }
  return mostRecentEventTime;
}
function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case SyncHydrationLane:
    case SyncLane:
    case InputContinuousHydrationLane:
    case InputContinuousLane:
      // User interactions should expire slightly more quickly.
      //
      // NOTE: This is set to the corresponding constant as in Scheduler.js.
      // When we made it larger, a product metric in www regressed, suggesting
      // there's a user interaction that's being starved by a series of
      // synchronous updates. If that theory is correct, the proper solution is
      // to fix the starvation. However, this scenario supports the idea that
      // expiration times are an important safeguard when starvation
      // does happen.
      return currentTime + 250;
    case DefaultHydrationLane:
    case DefaultLane:
    case TransitionHydrationLane:
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
    case TransitionLane15:
    case TransitionLane16:
      return currentTime + 5000;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
      // TODO: Retries should be allowed to expire if they are CPU bound for
      // too long, but when I made this change it caused a spike in browser
      // crashes. There must be some other underlying bug; not super urgent but
      // ideally should figure out why and fix it. Unfortunately we don't have
      // a repro for the crashes, only detected via production metrics.
      return NoTimestamp;
    case SelectiveHydrationLane:
    case IdleHydrationLane:
    case IdleLane:
    case OffscreenLane:
      // Anything idle priority or lower should never expire.
      return NoTimestamp;
    default:
      return NoTimestamp;
  }
}
export function markStarvedLanesAsExpired(root, currentTime) {
  // TODO: This gets called every time we yield. We can optimize by storing
  // the earliest expiration time on the root. Then use that to quickly bail out
  // of this function.
  var pendingLanes = root.pendingLanes;
  var suspendedLanes = root.suspendedLanes;
  var pingedLanes = root.pingedLanes;
  var expirationTimes = root.expirationTimes; // Iterate through the pending lanes and check if we've reached their
  // expiration time. If so, we'll assume the update is being starved and mark
  // it as expired to force it to finish.
  //
  // We exclude retry lanes because those must always be time sliced, in order
  // to unwrap uncached promises.
  // TODO: Write a test for this

  var lanes = pendingLanes & ~RetryLanes;
  while (lanes > 0) {
    var index = pickArbitraryLaneIndex(lanes);
    var lane = 1 << index;
    var expirationTime = expirationTimes[index];
    if (expirationTime === NoTimestamp) {
      // Found a pending lane with no expiration time. If it's not suspended, or
      // if it's pinged, assume it's CPU-bound. Compute a new expiration time
      // using the current time.
      if ((lane & suspendedLanes) === NoLanes || (lane & pingedLanes) !== NoLanes) {
        // Assumes timestamps are monotonically increasing.
        expirationTimes[index] = computeExpirationTime(lane, currentTime);
      }
    } else if (expirationTime <= currentTime) {
      // This lane expired
      root.expiredLanes |= lane;
    }
    lanes &= ~lane;
  }
} // This returns the highest priority pending lanes regardless of whether they
// are suspended.

export function getHighestPriorityPendingLanes(root) {
  return getHighestPriorityLanes(root.pendingLanes);
}
export function getLanesToRetrySynchronouslyOnError(root, originallyAttemptedLanes) {
  if (root.errorRecoveryDisabledLanes & originallyAttemptedLanes) {
    // The error recovery mechanism is disabled until these lanes are cleared.
    return NoLanes;
  }
  var everythingButOffscreen = root.pendingLanes & ~OffscreenLane;
  if (everythingButOffscreen !== NoLanes) {
    return everythingButOffscreen;
  }
  if (everythingButOffscreen & OffscreenLane) {
    return OffscreenLane;
  }
  return NoLanes;
}
export function includesSyncLane(lanes) {
  return (lanes & (SyncLane | SyncHydrationLane)) !== NoLanes;
}
export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes;
}
export function includesOnlyRetries(lanes) {
  return (lanes & RetryLanes) === lanes;
}
export function includesOnlyNonUrgentLanes(lanes) {
  // TODO: Should hydration lanes be included here? This function is only
  // used in `updateDeferredValueImpl`.
  var UrgentLanes = SyncLane | InputContinuousLane | DefaultLane;
  return (lanes & UrgentLanes) === NoLanes;
}
export function includesOnlyTransitions(lanes) {
  return (lanes & TransitionLanes) === lanes;
}
export function includesBlockingLane(root, lanes) {
  if (allowConcurrentByDefault && (root.current.mode & ConcurrentUpdatesByDefaultMode) !== NoMode) {
    // Concurrent updates by default always use time slicing.
    return false;
  }
  var SyncDefaultLanes = InputContinuousHydrationLane | InputContinuousLane | DefaultHydrationLane | DefaultLane;
  return (lanes & SyncDefaultLanes) !== NoLanes;
}
export function includesExpiredLane(root, lanes) {
  // This is a separate check from includesBlockingLane because a lane can
  // expire after a render has already started.
  return (lanes & root.expiredLanes) !== NoLanes;
}
export function isTransitionLane(lane) {
  return (lane & TransitionLanes) !== NoLanes;
}
export function claimNextTransitionLane() {
  // Cycle through the lanes, assigning each new transition to the next lane.
  // In most cases, this means every transition gets its own lane, until we
  // run out of lanes and cycle back to the beginning.
  var lane = nextTransitionLane;
  nextTransitionLane <<= 1;
  if ((nextTransitionLane & TransitionLanes) === NoLanes) {
    nextTransitionLane = TransitionLane1;
  }
  return lane;
}
export function claimNextRetryLane() {
  var lane = nextRetryLane;
  nextRetryLane <<= 1;
  if ((nextRetryLane & RetryLanes) === NoLanes) {
    nextRetryLane = RetryLane1;
  }
  return lane;
}
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}
export function pickArbitraryLane(lanes) {
  // This wrapper function gets inlined. Only exists so to communicate that it
  // doesn't matter which bit is selected; you can pick any bit without
  // affecting the algorithms where its used. Here I'm using
  // getHighestPriorityLane because it requires the fewest operations.
  return getHighestPriorityLane(lanes);
}
function pickArbitraryLaneIndex(lanes) {
  return 31 - clz32(lanes);
}
function laneToIndex(lane) {
  return pickArbitraryLaneIndex(lane);
}
export function includesSomeLane(a, b) {
  return (a & b) !== NoLanes;
}
export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}
export function mergeLanes(a, b) {
  return a | b;
}
export function removeLanes(set, subset) {
  return set & ~subset;
}
export function intersectLanes(a, b) {
  return a & b;
} // Seems redundant, but it changes the type from a single lane (used for
// updates) to a group of lanes (used for flushing work).

export function laneToLanes(lane) {
  return lane;
}
export function higherPriorityLane(a, b) {
  // This works because the bit ranges decrease in priority as you go left.
  return a !== NoLane && a < b ? a : b;
}
export function createLaneMap(initial) {
  // Intentionally pushing one by one.
  // https://v8.dev/blog/elements-kinds#avoid-creating-holes
  var laneMap = [];
  for (var i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}
export function markRootUpdated(root, updateLane, eventTime) {
  root.pendingLanes |= updateLane; // If there are any suspended transitions, it's possible this new update
  // could unblock them. Clear the suspended lanes so that we can try rendering
  // them again.
  //
  // TODO: We really only need to unsuspend only lanes that are in the
  // `subtreeLanes` of the updated fiber, or the update lanes of the return
  // path. This would exclude suspended updates in an unrelated sibling tree,
  // since there's no way for this update to unblock it.
  //
  // We don't do this if the incoming update is idle, because we never process
  // idle updates until after all the regular updates have finished; there's no
  // way it could unblock a transition.

  if (updateLane !== IdleLane) {
    root.suspendedLanes = NoLanes;
    root.pingedLanes = NoLanes;
  }
  var eventTimes = root.eventTimes;
  var index = laneToIndex(updateLane); // We can always overwrite an existing timestamp because we prefer the most
  // recent event, and we assume time is monotonically increasing.

  eventTimes[index] = eventTime;
}
export function markRootSuspended(root, suspendedLanes) {
  root.suspendedLanes |= suspendedLanes;
  root.pingedLanes &= ~suspendedLanes; // The suspended lanes are no longer CPU-bound. Clear their expiration times.

  var expirationTimes = root.expirationTimes;
  var lanes = suspendedLanes;
  while (lanes > 0) {
    var index = pickArbitraryLaneIndex(lanes);
    var lane = 1 << index;
    expirationTimes[index] = NoTimestamp;
    lanes &= ~lane;
  }
}
export function markRootPinged(root, pingedLanes) {
  root.pingedLanes |= root.suspendedLanes & pingedLanes;
}
export function markRootMutableRead(root, updateLane) {
  root.mutableReadLanes |= updateLane & root.pendingLanes;
}
export function markRootFinished(root, remainingLanes) {
  var noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  root.pendingLanes = remainingLanes; // Let's try everything again

  root.suspendedLanes = NoLanes;
  root.pingedLanes = NoLanes;
  root.expiredLanes &= remainingLanes;
  root.mutableReadLanes &= remainingLanes;
  root.entangledLanes &= remainingLanes;
  root.errorRecoveryDisabledLanes &= remainingLanes;
  var entanglements = root.entanglements;
  var eventTimes = root.eventTimes;
  var expirationTimes = root.expirationTimes;
  var hiddenUpdates = root.hiddenUpdates; // Clear the lanes that no longer have pending work

  var lanes = noLongerPendingLanes;
  while (lanes > 0) {
    var index = pickArbitraryLaneIndex(lanes);
    var lane = 1 << index;
    entanglements[index] = NoLanes;
    eventTimes[index] = NoTimestamp;
    expirationTimes[index] = NoTimestamp;
    var hiddenUpdatesForLane = hiddenUpdates[index];
    if (hiddenUpdatesForLane !== null) {
      hiddenUpdates[index] = null; // "Hidden" updates are updates that were made to a hidden component. They
      // have special logic associated with them because they may be entangled
      // with updates that occur outside that tree. But once the outer tree
      // commits, they behave like regular updates.

      for (var i = 0; i < hiddenUpdatesForLane.length; i++) {
        var update = hiddenUpdatesForLane[i];
        if (update !== null) {
          update.lane &= ~OffscreenLane;
        }
      }
    }
    lanes &= ~lane;
  }
}
export function markRootEntangled(root, entangledLanes) {
  // In addition to entangling each of the given lanes with each other, we also
  // have to consider _transitive_ entanglements. For each lane that is already
  // entangled with *any* of the given lanes, that lane is now transitively
  // entangled with *all* the given lanes.
  //
  // Translated: If C is entangled with A, then entangling A with B also
  // entangles C with B.
  //
  // If this is hard to grasp, it might help to intentionally break this
  // function and look at the tests that fail in ReactTransition-test.js. Try
  // commenting out one of the conditions below.
  var rootEntangledLanes = root.entangledLanes |= entangledLanes;
  var entanglements = root.entanglements;
  var lanes = rootEntangledLanes;
  while (lanes) {
    var index = pickArbitraryLaneIndex(lanes);
    var lane = 1 << index;
    if (
    // Is this one of the newly entangled lanes?
    lane & entangledLanes |
    // Is this lane transitively entangled with the newly entangled lanes?
    entanglements[index] & entangledLanes) {
      entanglements[index] |= entangledLanes;
    }
    lanes &= ~lane;
  }
}
export function markHiddenUpdate(root, update, lane) {
  var index = laneToIndex(lane);
  var hiddenUpdates = root.hiddenUpdates;
  var hiddenUpdatesForLane = hiddenUpdates[index];
  if (hiddenUpdatesForLane === null) {
    hiddenUpdates[index] = [update];
  } else {
    hiddenUpdatesForLane.push(update);
  }
  update.lane = lane | OffscreenLane;
}
export function getBumpedLaneForHydration(root, renderLanes) {
  var renderLane = getHighestPriorityLane(renderLanes);
  var lane;
  if (enableUnifiedSyncLane && (renderLane & SyncUpdateLanes) !== NoLane) {
    lane = SyncHydrationLane;
  } else {
    switch (renderLane) {
      case SyncLane:
        lane = SyncHydrationLane;
        break;
      case InputContinuousLane:
        lane = InputContinuousHydrationLane;
        break;
      case DefaultLane:
        lane = DefaultHydrationLane;
        break;
      case TransitionLane1:
      case TransitionLane2:
      case TransitionLane3:
      case TransitionLane4:
      case TransitionLane5:
      case TransitionLane6:
      case TransitionLane7:
      case TransitionLane8:
      case TransitionLane9:
      case TransitionLane10:
      case TransitionLane11:
      case TransitionLane12:
      case TransitionLane13:
      case TransitionLane14:
      case TransitionLane15:
      case TransitionLane16:
      case RetryLane1:
      case RetryLane2:
      case RetryLane3:
      case RetryLane4:
        lane = TransitionHydrationLane;
        break;
      case IdleLane:
        lane = IdleHydrationLane;
        break;
      default:
        // Everything else is already either a hydration lane, or shouldn't
        // be retried at a hydration lane.
        lane = NoLane;
        break;
    }
  } // Check if the lane we chose is suspended. If so, that indicates that we
  // already attempted and failed to hydrate at that level. Also check if we're
  // already rendering that lane, which is rare but could happen.

  if ((lane & (root.suspendedLanes | renderLanes)) !== NoLane) {
    // Give up trying to hydrate and fall back to client render.
    return NoLane;
  }
  return lane;
}
export function addFiberToLanesMap(root, fiber, lanes) {
  if (!enableUpdaterTracking) {
    return;
  }
  if (!isDevToolsPresent) {
    return;
  }
  var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
  while (lanes > 0) {
    var index = laneToIndex(lanes);
    var lane = 1 << index;
    var updaters = pendingUpdatersLaneMap[index];
    updaters.add(fiber);
    lanes &= ~lane;
  }
}
export function movePendingFibersToMemoized(root, lanes) {
  if (!enableUpdaterTracking) {
    return;
  }
  if (!isDevToolsPresent) {
    return;
  }
  var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
  var memoizedUpdaters = root.memoizedUpdaters;
  while (lanes > 0) {
    var index = laneToIndex(lanes);
    var lane = 1 << index;
    var updaters = pendingUpdatersLaneMap[index];
    if (updaters.size > 0) {
      updaters.forEach(function (fiber) {
        var alternate = fiber.alternate;
        if (alternate === null || !memoizedUpdaters.has(alternate)) {
          memoizedUpdaters.add(fiber);
        }
      });
      updaters.clear();
    }
    lanes &= ~lane;
  }
}
export function addTransitionToLanesMap(root, transition, lane) {
  if (enableTransitionTracing) {
    var transitionLanesMap = root.transitionLanes;
    var index = laneToIndex(lane);
    var transitions = transitionLanesMap[index];
    if (transitions === null) {
      transitions = new Set();
    }
    transitions.add(transition);
    transitionLanesMap[index] = transitions;
  }
}
export function getTransitionsForLanes(root, lanes) {
  if (!enableTransitionTracing) {
    return null;
  }
  var transitionsForLanes = [];
  while (lanes > 0) {
    var index = laneToIndex(lanes);
    var lane = 1 << index;
    var transitions = root.transitionLanes[index];
    if (transitions !== null) {
      transitions.forEach(function (transition) {
        transitionsForLanes.push(transition);
      });
    }
    lanes &= ~lane;
  }
  if (transitionsForLanes.length === 0) {
    return null;
  }
  return transitionsForLanes;
}
export function clearTransitionsForLanes(root, lanes) {
  if (!enableTransitionTracing) {
    return;
  }
  while (lanes > 0) {
    var index = laneToIndex(lanes);
    var lane = 1 << index;
    var transitions = root.transitionLanes[index];
    if (transitions !== null) {
      root.transitionLanes[index] = null;
    }
    lanes &= ~lane;
  }
}