import { warn as _consoleWarn } from "../../shared/consoleWithStackDev";
import { enableCache } from "../../shared/ReactFeatureFlags";
import { REACT_CONTEXT_TYPE } from "../../shared/ReactSymbols";
import { pushProvider, popProvider } from './ReactFiberNewContext';
import * as Scheduler from "../../scheduler"; // In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.

var AbortControllerLocal = enableCache ? typeof AbortController !== 'undefined' ? AbortController :
// $FlowFixMe[missing-this-annot]
function AbortControllerShim() {
  var listeners = [];
  var signal = this.signal = {
    aborted: false,
    addEventListener: function (type, listener) {
      listeners.push(listener);
    }
  };
  this.abort = function () {
    signal.aborted = true;
    listeners.forEach(function (listener) {
      return listener();
    });
  };
} : null; // Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.

var scheduleCallback = Scheduler.unstable_scheduleCallback,
  NormalPriority = Scheduler.unstable_NormalPriority;
export var CacheContext = enableCache ? {
  $$typeof: REACT_CONTEXT_TYPE,
  // We don't use Consumer/Provider for Cache components. So we'll cheat.
  Consumer: null,
  Provider: null,
  // We'll initialize these at the root.
  _currentValue: null,
  _currentValue2: null,
  _threadCount: 0,
  _defaultValue: null,
  _globalName: null
} : null;
// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).

export function createCache() {
  if (!enableCache) {
    return null;
  }
  var cache = {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0
  };
  return cache;
}
export function retainCache(cache) {
  if (!enableCache) {
    return;
  }
  cache.refCount++;
} // Cleanup a cache instance, potentially freeing it if there are no more references

export function releaseCache(cache) {
  if (!enableCache) {
    return;
  }
  cache.refCount--;
  if (cache.refCount === 0) {
    scheduleCallback(NormalPriority, function () {
      cache.controller.abort();
    });
  }
}
export function pushCacheProvider(workInProgress, cache) {
  if (!enableCache) {
    return;
  }
  pushProvider(workInProgress, CacheContext, cache);
}
export function popCacheProvider(workInProgress, cache) {
  if (!enableCache) {
    return;
  }
  popProvider(CacheContext, workInProgress);
}