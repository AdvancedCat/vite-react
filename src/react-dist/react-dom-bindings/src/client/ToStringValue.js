import { checkFormFieldValueStringCoercion } from "../../../shared/CheckStringCoercion"; // Flow does not allow string concatenation of most non-string types. To work
// around this limitation, we use an opaque type that can only be obtained by
// passing the value through getToStringValue first.

export function toString(value) {
  // The coercion safety check is performed in getToStringValue().
  // eslint-disable-next-line react-internal/safe-string-coercion
  return '' + value;
}
export function getToStringValue(value) {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return value;
    case 'object':
      return value;
    default:
      // function, symbol are assigned as empty strings
      return '';
  }
}