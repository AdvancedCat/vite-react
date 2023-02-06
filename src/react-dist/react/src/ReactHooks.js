import { error as _consoleError } from "../../shared/consoleWithStackDev";
import ReactCurrentDispatcher from './ReactCurrentDispatcher';
import ReactCurrentCache from './ReactCurrentCache';
function resolveDispatcher() {
  var dispatcher = ReactCurrentDispatcher.current;
  // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.

  return dispatcher;
}
export function getCacheSignal() {
  var dispatcher = ReactCurrentCache.current;
  if (!dispatcher) {
    // If we have no cache to associate with this call, then we don't know
    // its lifetime. We abort early since that's safer than letting it live
    // for ever. Unlike just caching which can be a functional noop outside
    // of React, these should generally always be associated with some React
    // render but we're not limiting quite as much as making it a Hook.
    // It's safer than erroring early at runtime.
    var controller = new AbortController();
    var reason = new Error('This CacheSignal was requested outside React which means that it is ' + 'immediately aborted.'); // $FlowFixMe Flow doesn't yet know about this argument.

    controller.abort(reason);
    return controller.signal;
  }
  return dispatcher.getCacheSignal();
}
export function getCacheForType(resourceType) {
  var dispatcher = ReactCurrentCache.current;
  if (!dispatcher) {
    // If there is no dispatcher, then we treat this as not being cached.
    return resourceType();
  }
  return dispatcher.getCacheForType(resourceType);
}
export function useContext(Context) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useContext(Context);
}
export function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
export function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
export function useRef(initialValue) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
export function useEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}
export function useInsertionEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useInsertionEffect(create, deps);
}
export function useLayoutEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}
export function useCallback(callback, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
}
export function useMemo(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, deps);
}
export function useImperativeHandle(ref, create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
}
export function useDebugValue(value, formatterFn) {}
export function useTransition() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
}
export function useDeferredValue(value) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value);
}
export function useId() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useId();
}
export function useMutableSource(source, getSnapshot, subscribe) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useMutableSource(source, getSnapshot, subscribe);
}
export function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export function useCacheRefresh() {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.useCacheRefresh();
}
export function use(usable) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.use(usable);
}
export function useMemoCache(size) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.useMemoCache(size);
}
export function useEffectEvent(callback) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.useEffectEvent(callback);
}