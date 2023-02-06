import { enableDebugTracing } from "../../shared/ReactFeatureFlags";
var nativeConsole = console;
var nativeConsoleLog = null;
var pendingGroupArgs = [];
var printedGroupIndex = -1;
function formatLanes(laneOrLanes) {
  return '0b' + laneOrLanes.toString(2).padStart(31, '0');
}
function group() {
  for (var _len = arguments.length, groupArgs = new Array(_len), _key = 0; _key < _len; _key++) {
    groupArgs[_key] = arguments[_key];
  }
  pendingGroupArgs.push(groupArgs);
  if (nativeConsoleLog === null) {
    nativeConsoleLog = nativeConsole.log;
    nativeConsole.log = log;
  }
}
function groupEnd() {
  pendingGroupArgs.pop();
  while (printedGroupIndex >= pendingGroupArgs.length) {
    nativeConsole.groupEnd();
    printedGroupIndex--;
  }
  if (pendingGroupArgs.length === 0) {
    nativeConsole.log = nativeConsoleLog;
    nativeConsoleLog = null;
  }
}
function log() {
  if (printedGroupIndex < pendingGroupArgs.length - 1) {
    for (var i = printedGroupIndex + 1; i < pendingGroupArgs.length; i++) {
      var groupArgs = pendingGroupArgs[i];
      nativeConsole.group.apply(nativeConsole, groupArgs);
    }
    printedGroupIndex = pendingGroupArgs.length - 1;
  }
  if (typeof nativeConsoleLog === 'function') {
    nativeConsoleLog.apply(void 0, arguments);
  } else {
    nativeConsole.log.apply(nativeConsole, arguments);
  }
}
var REACT_LOGO_STYLE = 'background-color: #20232a; color: #61dafb; padding: 0 2px;';
export function logCommitStarted(lanes) {}
export function logCommitStopped() {}
var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map; // $FlowFixMe: Flow cannot handle polymorphic WeakMaps

var wakeableIDs = new PossiblyWeakMap();
var wakeableID = 0;
function getWakeableID(wakeable) {
  if (!wakeableIDs.has(wakeable)) {
    wakeableIDs.set(wakeable, wakeableID++);
  }
  return wakeableIDs.get(wakeable);
}
export function logComponentSuspended(componentName, wakeable) {}
export function logLayoutEffectsStarted(lanes) {}
export function logLayoutEffectsStopped() {}
export function logPassiveEffectsStarted(lanes) {}
export function logPassiveEffectsStopped() {}
export function logRenderStarted(lanes) {}
export function logRenderStopped() {}
export function logForceUpdateScheduled(componentName, lane) {}
export function logStateUpdateScheduled(componentName, lane, payloadOrAction) {}