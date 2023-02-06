import { enableCache } from "../../shared/ReactFeatureFlags";
import { readContext } from './ReactFiberNewContext';
import { CacheContext } from './ReactFiberCacheComponent';
function getCacheSignal() {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  var cache = readContext(CacheContext);
  return cache.controller.signal;
}
function getCacheForType(resourceType) {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  var cache = readContext(CacheContext);
  var cacheForType = cache.data.get(resourceType);
  if (cacheForType === undefined) {
    cacheForType = resourceType();
    cache.data.set(resourceType, cacheForType);
  }
  return cacheForType;
}
export var DefaultCacheDispatcher = {
  getCacheSignal: getCacheSignal,
  getCacheForType: getCacheForType
};