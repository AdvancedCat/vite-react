import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import { ATTRIBUTE_NAME_CHAR, BOOLEAN, RESERVED, shouldRemoveAttributeWithWarning, getPropertyInfo } from './DOMProperty';
import isCustomComponent from './isCustomComponent';
import possibleStandardNames from './possibleStandardNames';
import hasOwnProperty from "../../../shared/hasOwnProperty";
var validateProperty = function () {};
var warnUnknownProperties = function (type, props, eventRegistry) {};
export function validateProperties(type, props, eventRegistry) {
  if (isCustomComponent(type, props)) {
    return;
  }
  warnUnknownProperties(type, props, eventRegistry);
}