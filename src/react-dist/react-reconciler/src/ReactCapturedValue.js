import { getStackByFiberInDevAndProd } from './ReactFiberComponentStack';
export function createCapturedValueAtFiber(value, source) {
  // If the value is an error, call this function immediately after it is thrown
  // so the stack is accurate.
  return {
    value: value,
    source: source,
    stack: getStackByFiberInDevAndProd(source),
    digest: null
  };
}
export function createCapturedValue(value, digest, stack) {
  return {
    value: value,
    source: null,
    stack: stack != null ? stack : null,
    digest: digest != null ? digest : null
  };
}