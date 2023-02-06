import ReactCurrentCache from './ReactCurrentCache';
var UNTERMINATED = 0;
var TERMINATED = 1;
var ERRORED = 2;
function createCacheRoot() {
  return new WeakMap();
}
function createCacheNode() {
  return {
    s: UNTERMINATED,
    // status, represents whether the cached computation returned a value or threw an error
    v: undefined,
    // value, either the cached result or an error, depending on s
    o: null,
    // object cache, a WeakMap where non-primitive arguments are stored
    p: null // primitive cache, a regular Map where primitive arguments are stored.
  };
}

export function cache(fn) {
  return function () {
    var dispatcher = ReactCurrentCache.current;
    if (!dispatcher) {
      // If there is no dispatcher, then we treat this as not being cached.
      // $FlowFixMe: We don't want to use rest arguments since we transpile the code.
      return fn.apply(null, arguments);
    }
    var fnMap = dispatcher.getCacheForType(createCacheRoot);
    var fnNode = fnMap.get(fn);
    var cacheNode;
    if (fnNode === undefined) {
      cacheNode = createCacheNode();
      fnMap.set(fn, cacheNode);
    } else {
      cacheNode = fnNode;
    }
    for (var i = 0, l = arguments.length; i < l; i++) {
      var arg = arguments[i];
      if (typeof arg === 'function' || typeof arg === 'object' && arg !== null) {
        // Objects go into a WeakMap
        var objectCache = cacheNode.o;
        if (objectCache === null) {
          cacheNode.o = objectCache = new WeakMap();
        }
        var objectNode = objectCache.get(arg);
        if (objectNode === undefined) {
          cacheNode = createCacheNode();
          objectCache.set(arg, cacheNode);
        } else {
          cacheNode = objectNode;
        }
      } else {
        // Primitives go into a regular Map
        var primitiveCache = cacheNode.p;
        if (primitiveCache === null) {
          cacheNode.p = primitiveCache = new Map();
        }
        var primitiveNode = primitiveCache.get(arg);
        if (primitiveNode === undefined) {
          cacheNode = createCacheNode();
          primitiveCache.set(arg, cacheNode);
        } else {
          cacheNode = primitiveNode;
        }
      }
    }
    if (cacheNode.s === TERMINATED) {
      return cacheNode.v;
    }
    if (cacheNode.s === ERRORED) {
      throw cacheNode.v;
    }
    try {
      // $FlowFixMe: We don't want to use rest arguments since we transpile the code.
      var result = fn.apply(null, arguments);
      var terminatedNode = cacheNode;
      terminatedNode.s = TERMINATED;
      terminatedNode.v = result;
      return result;
    } catch (error) {
      // We store the first error that's thrown and rethrow it.
      var erroredNode = cacheNode;
      erroredNode.s = ERRORED;
      erroredNode.v = error;
      throw error;
    }
  };
}