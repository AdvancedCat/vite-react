import { error as _consoleError } from "../../../shared/consoleWithStackDev";
// TODO: direct imports like some-package/src/* are bad. Fix me.
import { getCurrentFiberOwnerNameInDevOrNull } from "../../../react-reconciler/src/ReactCurrentFiber";
import { checkControlledValueProps } from '../shared/ReactControlledValuePropTypes';
import { getToStringValue, toString } from './ToStringValue';
import assign from "../../../shared/assign";
import isArray from "../../../shared/isArray";
var didWarnValueDefaultValue;
function getDeclarationErrorAddendum() {
  var ownerName = getCurrentFiberOwnerNameInDevOrNull();
  if (ownerName) {
    return '\n\nCheck the render method of `' + ownerName + '`.';
  }
  return '';
}
var valuePropNames = ['value', 'defaultValue'];
/**
 * Validation function for `value` and `defaultValue`.
 */

function checkSelectPropTypes(props) {}
function updateOptions(node, multiple, propValue, setDefaultSelected) {
  var options = node.options;
  if (multiple) {
    var selectedValues = propValue;
    var selectedValue = {};
    for (var i = 0; i < selectedValues.length; i++) {
      // Prefix to avoid chaos with special keys.
      selectedValue['$' + selectedValues[i]] = true;
    }
    for (var _i = 0; _i < options.length; _i++) {
      var selected = selectedValue.hasOwnProperty('$' + options[_i].value);
      if (options[_i].selected !== selected) {
        options[_i].selected = selected;
      }
      if (selected && setDefaultSelected) {
        options[_i].defaultSelected = true;
      }
    }
  } else {
    // Do not set `select.value` as exact behavior isn't consistent across all
    // browsers for all cases.
    var _selectedValue = toString(getToStringValue(propValue));
    var defaultSelected = null;
    for (var _i2 = 0; _i2 < options.length; _i2++) {
      if (options[_i2].value === _selectedValue) {
        options[_i2].selected = true;
        if (setDefaultSelected) {
          options[_i2].defaultSelected = true;
        }
        return;
      }
      if (defaultSelected === null && !options[_i2].disabled) {
        defaultSelected = options[_i2];
      }
    }
    if (defaultSelected !== null) {
      defaultSelected.selected = true;
    }
  }
}
/**
 * Implements a <select> host component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * stringable. If `multiple` is true, the prop must be an array of stringables.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */

export function getHostProps(element, props) {
  return assign({}, props, {
    value: undefined
  });
}
export function initWrapperState(element, props) {
  var node = element;
  node._wrapperState = {
    wasMultiple: !!props.multiple
  };
}
export function postMountWrapper(element, props) {
  var node = element;
  node.multiple = !!props.multiple;
  var value = props.value;
  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  } else if (props.defaultValue != null) {
    updateOptions(node, !!props.multiple, props.defaultValue, true);
  }
}
export function postUpdateWrapper(element, props) {
  var node = element;
  var wasMultiple = node._wrapperState.wasMultiple;
  node._wrapperState.wasMultiple = !!props.multiple;
  var value = props.value;
  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  } else if (wasMultiple !== !!props.multiple) {
    // For simplicity, reapply `defaultValue` if `multiple` is toggled.
    if (props.defaultValue != null) {
      updateOptions(node, !!props.multiple, props.defaultValue, true);
    } else {
      // Revert the select back to its default unselected state.
      updateOptions(node, !!props.multiple, props.multiple ? [] : '', false);
    }
  }
}
export function restoreControlledState(element, props) {
  var node = element;
  var value = props.value;
  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  }
}