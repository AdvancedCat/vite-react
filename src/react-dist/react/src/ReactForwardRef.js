import { error as _consoleError } from "../../shared/consoleWithStackDev";
import { REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE } from "../../shared/ReactSymbols";
export function forwardRef(render) {
  var elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render: render
  };
  return elementType;
}