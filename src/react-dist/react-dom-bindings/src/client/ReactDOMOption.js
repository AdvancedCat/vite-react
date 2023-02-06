import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import { Children } from "../../../react";
import { getToStringValue, toString } from './ToStringValue';
var didWarnSelectedSetOnOption = false;
var didWarnInvalidChild = false;
var didWarnInvalidInnerHTML = false;
/**
 * Implements an <option> host component that warns when `selected` is set.
 */

export function validateProps(element, props) {}
export function postMountWrapper(element, props) {
  // value="" should make a value attribute (#6219)
  if (props.value != null) {
    element.setAttribute('value', toString(getToStringValue(props.value)));
  }
}