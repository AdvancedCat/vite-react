// Renderers that don't support persistence
// can re-export everything from this module.
function shim() {
  throw new Error('The current renderer does not support persistence. ' + 'This error is likely caused by a bug in React. ' + 'Please file an issue.');
} // Persistence (when unsupported)

export var supportsPersistence = false;
export var cloneInstance = shim;
export var createContainerChildSet = shim;
export var appendChildToContainerChildSet = shim;
export var finalizeContainerChildren = shim;
export var replaceContainerChildren = shim;
export var cloneHiddenInstance = shim;
export var cloneHiddenTextInstance = shim;