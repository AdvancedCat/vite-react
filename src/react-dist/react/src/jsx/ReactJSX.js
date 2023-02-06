import { REACT_FRAGMENT_TYPE } from "../../../shared/ReactSymbols";
import { jsxWithValidationStatic, jsxWithValidationDynamic, jsxWithValidation } from './ReactJSXElementValidator';
import { jsx as jsxProd } from './ReactJSXElement';
var jsx = jsxProd; // we may want to special case jsxs internally to take advantage of static children.
// for now we can ship identical prod functions

var jsxs = jsxProd;
var jsxDEV = undefined;
export { REACT_FRAGMENT_TYPE as Fragment, jsx, jsxs, jsxDEV };