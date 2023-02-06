// an immutable object with a single mutable value
export function createRef() {
  var refObject = {
    current: null
  };
  return refObject;
}