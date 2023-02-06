import { error as _consoleError } from "../../shared/consoleWithStackDev";
var valueStack = [];
var fiberStack;
var index = -1;
function createCursor(defaultValue) {
  return {
    current: defaultValue
  };
}
function isEmpty() {
  return index === -1;
}
function pop(cursor, fiber) {
  if (index < 0) {
    return;
  }
  cursor.current = valueStack[index];
  valueStack[index] = null;
  index--;
}
function push(cursor, value, fiber) {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
function checkThatStackIsEmpty() {}
function resetStackAfterFatalErrorInDev() {}
export { createCursor, isEmpty, pop, push // DEV only:
, checkThatStackIsEmpty, resetStackAfterFatalErrorInDev };