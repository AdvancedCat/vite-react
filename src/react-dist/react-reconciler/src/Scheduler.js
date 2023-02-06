// This module only exists as an ESM wrapper around the external CommonJS
// Scheduler dependency. Notice that we're intentionally not using named imports
// because Rollup would use dynamic dispatch for CommonJS interop named imports.
// When we switch to ESM, we can delete this module.
import * as Scheduler from '../../scheduler';
export var scheduleCallback = Scheduler.unstable_scheduleCallback;
export var cancelCallback = Scheduler.unstable_cancelCallback;
export var shouldYield = Scheduler.unstable_shouldYield;
export var requestPaint = Scheduler.unstable_requestPaint;
export var now = Scheduler.unstable_now;
export var getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
export var ImmediatePriority = Scheduler.unstable_ImmediatePriority;
export var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
export var NormalPriority = Scheduler.unstable_NormalPriority;
export var LowPriority = Scheduler.unstable_LowPriority;
export var IdlePriority = Scheduler.unstable_IdlePriority; // this doesn't actually exist on the scheduler, but it *does*
// on scheduler/unstable_mock, which we'll need for internal testing

export var unstable_yieldValue = Scheduler.unstable_yieldValue;
export var unstable_setDisableYieldValue =
    Scheduler.unstable_setDisableYieldValue;
