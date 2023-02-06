import _assign from "../../shared/assign";
import { error as _consoleError } from "../../shared/consoleWithStackDev";
// import type {DevToolsProfilingHooks} from 'react-devtools-shared/src/backend/types';
// TODO: This import doesn't work because the DevTools depend on the DOM version of React
// and to properly type check against DOM React we can't also type check again non-DOM
// React which this hook might be in.
import { getLabelForLane, TotalLanes } from "./ReactFiberLane";
import { DidCapture } from './ReactFiberFlags';
import { consoleManagedByDevToolsDuringStrictMode, enableProfilerTimer, enableSchedulingProfiler } from "../../shared/ReactFeatureFlags";
import { DiscreteEventPriority, ContinuousEventPriority, DefaultEventPriority, IdleEventPriority } from './ReactEventPriorities';
import { ImmediatePriority as ImmediateSchedulerPriority, UserBlockingPriority as UserBlockingSchedulerPriority, NormalPriority as NormalSchedulerPriority, IdlePriority as IdleSchedulerPriority, unstable_yieldValue, unstable_setDisableYieldValue } from './Scheduler';
import { setSuppressWarning } from "../../shared/consoleWithStackDev";
import { disableLogs, reenableLogs } from "../../shared/ConsolePatchingDev";
var rendererID = null;
var injectedHook = null;
var injectedProfilingHooks = null;
var hasLoggedError = false;
export var isDevToolsPresent = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
export function injectInternals(internals) {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
    // No DevTools
    return false;
  }
  var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook.isDisabled) {
    // This isn't a real property on the hook, but it can be set to opt out
    // of DevTools integration and associated warnings and logs.
    // https://github.com/facebook/react/issues/3877
    return true;
  }
  if (!hook.supportsFiber) {
    // DevTools exists, even though it doesn't support Fiber.

    return true;
  }
  try {
    if (enableSchedulingProfiler) {
      // Conditionally inject these hooks only if Timeline profiler is supported by this build.
      // This gives DevTools a way to feature detect that isn't tied to version number
      // (since profiling and timeline are controlled by different feature flags).
      internals = _assign({}, internals, {
        getLaneLabelMap: getLaneLabelMap,
        injectProfilingHooks: injectProfilingHooks
      });
    }
    rendererID = hook.inject(internals); // We have successfully injected, so now it is safe to set up hooks.

    injectedHook = hook;
  } catch (err) {}
  if (hook.checkDCE) {
    // This is the real DevTools.
    return true;
  } else {
    // This is likely a hook installed by Fast Refresh runtime.
    return false;
  }
}
export function onScheduleRoot(root, children) {}
export function onCommitRoot(root, eventPriority) {
  if (injectedHook && typeof injectedHook.onCommitFiberRoot === 'function') {
    try {
      var didError = (root.current.flags & DidCapture) === DidCapture;
      if (enableProfilerTimer) {
        var schedulerPriority;
        switch (eventPriority) {
          case DiscreteEventPriority:
            schedulerPriority = ImmediateSchedulerPriority;
            break;
          case ContinuousEventPriority:
            schedulerPriority = UserBlockingSchedulerPriority;
            break;
          case DefaultEventPriority:
            schedulerPriority = NormalSchedulerPriority;
            break;
          case IdleEventPriority:
            schedulerPriority = IdleSchedulerPriority;
            break;
          default:
            schedulerPriority = NormalSchedulerPriority;
            break;
        }
        injectedHook.onCommitFiberRoot(rendererID, root, schedulerPriority, didError);
      } else {
        injectedHook.onCommitFiberRoot(rendererID, root, undefined, didError);
      }
    } catch (err) {}
  }
}
export function onPostCommitRoot(root) {
  if (injectedHook && typeof injectedHook.onPostCommitFiberRoot === 'function') {
    try {
      injectedHook.onPostCommitFiberRoot(rendererID, root);
    } catch (err) {}
  }
}
export function onCommitUnmount(fiber) {
  if (injectedHook && typeof injectedHook.onCommitFiberUnmount === 'function') {
    try {
      injectedHook.onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {}
  }
}
export function setIsStrictModeForDevtools(newIsStrictMode) {
  if (consoleManagedByDevToolsDuringStrictMode) {
    if (typeof unstable_yieldValue === 'function') {
      // We're in a test because Scheduler.unstable_yieldValue only exists
      // in SchedulerMock. To reduce the noise in strict mode tests,
      // suppress warnings and disable scheduler yielding during the double render
      unstable_setDisableYieldValue(newIsStrictMode);
      setSuppressWarning(newIsStrictMode);
    }
    if (injectedHook && typeof injectedHook.setStrictMode === 'function') {
      try {
        injectedHook.setStrictMode(rendererID, newIsStrictMode);
      } catch (err) {}
    }
  } else {
    if (newIsStrictMode) {
      disableLogs();
    } else {
      reenableLogs();
    }
  }
} // Profiler API hooks

function injectProfilingHooks(profilingHooks) {
  injectedProfilingHooks = profilingHooks;
}
function getLaneLabelMap() {
  if (enableSchedulingProfiler) {
    var map = new Map();
    var lane = 1;
    for (var index = 0; index < TotalLanes; index++) {
      var label = getLabelForLane(lane);
      map.set(lane, label);
      lane *= 2;
    }
    return map;
  } else {
    return null;
  }
}
export function markCommitStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStarted === 'function') {
      injectedProfilingHooks.markCommitStarted(lanes);
    }
  }
}
export function markCommitStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStopped === 'function') {
      injectedProfilingHooks.markCommitStopped();
    }
  }
}
export function markComponentRenderStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentRenderStarted === 'function') {
      injectedProfilingHooks.markComponentRenderStarted(fiber);
    }
  }
}
export function markComponentRenderStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentRenderStopped === 'function') {
      injectedProfilingHooks.markComponentRenderStopped();
    }
  }
}
export function markComponentPassiveEffectMountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStarted === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectMountStarted(fiber);
    }
  }
}
export function markComponentPassiveEffectMountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStopped === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectMountStopped();
    }
  }
}
export function markComponentPassiveEffectUnmountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStarted === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectUnmountStarted(fiber);
    }
  }
}
export function markComponentPassiveEffectUnmountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStopped === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectUnmountStopped();
    }
  }
}
export function markComponentLayoutEffectMountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStarted === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectMountStarted(fiber);
    }
  }
}
export function markComponentLayoutEffectMountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStopped === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectMountStopped();
    }
  }
}
export function markComponentLayoutEffectUnmountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStarted === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectUnmountStarted(fiber);
    }
  }
}
export function markComponentLayoutEffectUnmountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStopped === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectUnmountStopped();
    }
  }
}
export function markComponentErrored(fiber, thrownValue, lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentErrored === 'function') {
      injectedProfilingHooks.markComponentErrored(fiber, thrownValue, lanes);
    }
  }
}
export function markComponentSuspended(fiber, wakeable, lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentSuspended === 'function') {
      injectedProfilingHooks.markComponentSuspended(fiber, wakeable, lanes);
    }
  }
}
export function markLayoutEffectsStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStarted === 'function') {
      injectedProfilingHooks.markLayoutEffectsStarted(lanes);
    }
  }
}
export function markLayoutEffectsStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStopped === 'function') {
      injectedProfilingHooks.markLayoutEffectsStopped();
    }
  }
}
export function markPassiveEffectsStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStarted === 'function') {
      injectedProfilingHooks.markPassiveEffectsStarted(lanes);
    }
  }
}
export function markPassiveEffectsStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStopped === 'function') {
      injectedProfilingHooks.markPassiveEffectsStopped();
    }
  }
}
export function markRenderStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStarted === 'function') {
      injectedProfilingHooks.markRenderStarted(lanes);
    }
  }
}
export function markRenderYielded() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderYielded === 'function') {
      injectedProfilingHooks.markRenderYielded();
    }
  }
}
export function markRenderStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStopped === 'function') {
      injectedProfilingHooks.markRenderStopped();
    }
  }
}
export function markRenderScheduled(lane) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderScheduled === 'function') {
      injectedProfilingHooks.markRenderScheduled(lane);
    }
  }
}
export function markForceUpdateScheduled(fiber, lane) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markForceUpdateScheduled === 'function') {
      injectedProfilingHooks.markForceUpdateScheduled(fiber, lane);
    }
  }
}
export function markStateUpdateScheduled(fiber, lane) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markStateUpdateScheduled === 'function') {
      injectedProfilingHooks.markStateUpdateScheduled(fiber, lane);
    }
  }
}