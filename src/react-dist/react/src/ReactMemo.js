import { error as _consoleError } from "../../shared/consoleWithStackDev";
import { REACT_MEMO_TYPE } from "../../shared/ReactSymbols";
import isValidElementType from "../../shared/isValidElementType";
export function memo(type, compare) {
  var elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: compare === undefined ? null : compare
  };
  return elementType;
}