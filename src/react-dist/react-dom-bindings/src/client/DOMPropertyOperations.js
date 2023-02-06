import { getPropertyInfo, shouldIgnoreAttribute, shouldRemoveAttribute, isAttributeNameSafe, BOOLEAN, OVERLOADED_BOOLEAN } from '../shared/DOMProperty';
import sanitizeURL from '../shared/sanitizeURL';
import { disableJavaScriptURLs, enableTrustedTypesIntegration, enableCustomElementPropertySupport } from "../../../shared/ReactFeatureFlags";
import { checkAttributeStringCoercion } from "../../../shared/CheckStringCoercion";
import { getFiberCurrentPropsFromNode } from './ReactDOMComponentTree';
/**
 * Get the value for a property on a node. Only used in DEV for SSR validation.
 * The "expected" argument is used as a hint of what the expected value is.
 * Some properties have multiple equivalent values.
 */

export function getValueForProperty(node, name, expected, propertyInfo) {}
/**
 * Get the value for a attribute on a node. Only used in DEV for SSR validation.
 * The third argument is used as a hint of what the expected value is. Some
 * attributes have multiple equivalent values.
 */

export function getValueForAttribute(node, name, expected, isCustomComponentTag) {}
/**
 * Sets the value for a property on a node.
 *
 * @param {DOMElement} node
 * @param {string} name
 * @param {*} value
 */

export function setValueForProperty(node, name, value, isCustomComponentTag) {
  var propertyInfo = getPropertyInfo(name);
  if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
    return;
  }
  if (enableCustomElementPropertySupport && isCustomComponentTag && name[0] === 'o' && name[1] === 'n') {
    var eventName = name.replace(/Capture$/, '');
    var useCapture = name !== eventName;
    eventName = eventName.slice(2);
    var prevProps = getFiberCurrentPropsFromNode(node);
    var prevValue = prevProps != null ? prevProps[name] : null;
    if (typeof prevValue === 'function') {
      node.removeEventListener(eventName, prevValue, useCapture);
    }
    if (typeof value === 'function') {
      if (typeof prevValue !== 'function' && prevValue !== null) {
        // If we previously assigned a non-function type into this node, then
        // remove it when switching to event listener mode.
        if (name in node) {
          node[name] = null;
        } else if (node.hasAttribute(name)) {
          node.removeAttribute(name);
        }
      } // $FlowFixMe value can't be casted to EventListener.

      node.addEventListener(eventName, value, useCapture);
      return;
    }
  }
  if (enableCustomElementPropertySupport && isCustomComponentTag && name in node) {
    node[name] = value;
    return;
  }
  if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
    value = null;
  }
  if (enableCustomElementPropertySupport) {
    if (isCustomComponentTag && value === true) {
      value = '';
    }
  } // If the prop isn't in the special list, treat it as a simple attribute.

  if (isCustomComponentTag || propertyInfo === null) {
    if (isAttributeNameSafe(name)) {
      var _attributeName = name;
      if (value === null) {
        node.removeAttribute(_attributeName);
      } else {
        node.setAttribute(_attributeName, enableTrustedTypesIntegration ? value : '' + value);
      }
    }
    return;
  }
  var mustUseProperty = propertyInfo.mustUseProperty;
  if (mustUseProperty) {
    var propertyName = propertyInfo.propertyName;
    if (value === null) {
      var type = propertyInfo.type;
      node[propertyName] = type === BOOLEAN ? false : '';
    } else {
      // Contrary to `setAttribute`, object properties are properly
      // `toString`ed by IE8/9.
      node[propertyName] = value;
    }
    return;
  } // The rest are treated as attributes with special cases.

  var attributeName = propertyInfo.attributeName,
    attributeNamespace = propertyInfo.attributeNamespace;
  if (value === null) {
    node.removeAttribute(attributeName);
  } else {
    var _type = propertyInfo.type;
    var attributeValue;
    if (_type === BOOLEAN || _type === OVERLOADED_BOOLEAN && value === true) {
      // If attribute type is boolean, we know for sure it won't be an execution sink
      // and we won't require Trusted Type here.
      attributeValue = '';
    } else {
      // `setAttribute` with objects becomes only `[object]` in IE8/9,
      // ('' + value) makes it output the correct toString()-value.
      if (enableTrustedTypesIntegration) {
        attributeValue = value;
      } else {
        attributeValue = '' + value;
      }
      if (propertyInfo.sanitizeURL) {
        sanitizeURL(attributeValue.toString());
      }
    }
    if (attributeNamespace) {
      node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
    } else {
      node.setAttribute(attributeName, attributeValue);
    }
  }
}