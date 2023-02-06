import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import { ATTRIBUTE_NAME_CHAR } from './DOMProperty';
import isCustomComponent from './isCustomComponent';
import validAriaProperties from './validAriaProperties';
import hasOwnProperty from "../../../shared/hasOwnProperty";
var warnedProperties = {};
var rARIA = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
var rARIACamel = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');
function validateProperty(tagName, name) {
  return true;
}
function warnInvalidARIAProps(type, props) {}
export function validateProperties(type, props) {
  if (isCustomComponent(type, props)) {
    return;
  }
  warnInvalidARIAProps(type, props);
}