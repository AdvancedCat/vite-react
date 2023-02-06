import { error as _consoleError } from "../../shared/consoleWithStackDev";
import ReactCurrentActQueue from './ReactCurrentActQueue';
import queueMacrotask from "../../shared/enqueueTask"; // `act` calls can be nested, so we track the depth. This represents the
// number of `act` scopes on the stack.

var actScopeDepth = 0; // We only warn the first time you neglect to await an async `act` scope.

var didWarnNoAwaitAct = false;
export function act(callback) {
  {
    throw new Error('act(...) is not supported in production builds of React.');
  }
}
function popActScope(prevActQueue, prevActScopeDepth) {}
function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {}
var isFlushing = false;
function flushActQueue(queue) {} // Some of our warnings attempt to detect if the `act` call is awaited by
// checking in an asynchronous task. Wait a few microtasks before checking. The
// only reason one isn't sufficient is we want to accommodate the case where an
// `act` call is returned from an async function without first being awaited,
// since that's a somewhat common pattern. If you do this too many times in a
// nested sequence, you might get a warning, but you can always fix by awaiting
// the call.
//
// A macrotask would also work (and is the fallback) but depending on the test
// environment it may cause the warning to fire too late.

var queueSeveralMicrotasks = typeof queueMicrotask === 'function' ? function (callback) {
  queueMicrotask(function () {
    return queueMicrotask(callback);
  });
} : queueMacrotask;