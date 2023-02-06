import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import hasOwnProperty from "../../../shared/hasOwnProperty";
export function warnOnMissingHrefAndRel(pendingProps, currentProps) {}
export function validatePreloadResourceDifference(originalProps, originalImplicit, latestProps, latestImplicit) {}
export function validateStyleResourceDifference(originalProps, latestProps) {}
export function validateScriptResourceDifference(originalProps, latestProps) {}
export function validateStyleAndHintProps(preloadProps, styleProps, implicitPreload) {}
export function validateScriptAndHintProps(preloadProps, scriptProps, implicitPreload) {}
function warnDifferentProps(url, urlPropKey, originalName, latestName, extraProps, missingProps, differentProps) {}
function getResourceNameForWarning(type, props, implicit) {
  return 'Resource';
}
export function validateURLKeyedUpdatedProps(pendingProps, currentProps, resourceType, urlPropKey) {
  return false;
}
export function validateLinkPropsForStyleResource(props) {
  return false;
}
function propNamesListJoin(list, combinator) {
  switch (list.length) {
    case 0:
      return '';
    case 1:
      return list[0];
    case 2:
      return list[0] + ' ' + combinator + ' ' + list[1];
    default:
      return list.slice(0, -1).join(', ') + ', ' + combinator + ' ' + list[list.length - 1];
  }
}
export function validateLinkPropsForPreloadResource(linkProps) {}
export function validatePreloadArguments(href, options) {}
export function validatePreinitArguments(href, options) {}
function getValueDescriptorExpectingObjectForWarning(thing) {
  return thing === null ? 'null' : thing === undefined ? 'undefined' : thing === '' ? 'an empty string' : "something with type \"" + typeof thing + "\"";
}
function getValueDescriptorExpectingEnumForWarning(thing) {
  return thing === null ? 'null' : thing === undefined ? 'undefined' : thing === '' ? 'an empty string' : typeof thing === 'string' ? JSON.stringify(thing) : "something with type \"" + typeof thing + "\"";
}