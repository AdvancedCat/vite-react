import ReactSharedInternals from "../react/src/ReactSharedInternals";
var suppressWarning = false;
export function setSuppressWarning(newSuppressWarning) {} // In DEV, calls to console.warn and console.error get replaced
// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.

export function warn(format) {}
export function error(format) {}
function printWarning(level, format, args) {}