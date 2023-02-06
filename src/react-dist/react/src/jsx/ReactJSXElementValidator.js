import { error as _consoleError } from "../../../shared/consoleWithStackDev";

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */
import isValidElementType from "../../../shared/isValidElementType";
import getComponentNameFromType from "../../../shared/getComponentNameFromType";
import checkPropTypes from "../../../shared/checkPropTypes";
import { getIteratorFn, REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE, REACT_FRAGMENT_TYPE, REACT_ELEMENT_TYPE } from "../../../shared/ReactSymbols";
import { warnAboutSpreadingKeyToJSX } from "../../../shared/ReactFeatureFlags";
import hasOwnProperty from "../../../shared/hasOwnProperty";
import isArray from "../../../shared/isArray";
import { jsxDEV } from './ReactJSXElement';
import { describeUnknownElementTypeFrameInDEV } from "../../../shared/ReactComponentStackFrame";
import ReactSharedInternals from "../ReactSharedInternals";
var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
function setCurrentlyValidatingElement(element) {}
var propTypesMisspellWarningShown;
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */

export function isValidElement(object) {}
function getDeclarationErrorAddendum() {}
function getSourceInfoErrorAddendum(source) {}
/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */

var ownerHasKeyUseWarning = {};
function getCurrentComponentErrorInfo(parentType) {}
/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */

function validateExplicitKey(element, parentType) {}
/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */

function validateChildKeys(node, parentType) {}
/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */

function validatePropTypes(element) {}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */

function validateFragmentProps(fragment) {}
var didWarnAboutKeySpread = {};
export function jsxWithValidation(type, props, key, isStaticChildren, source, self) {} // These two functions exist to still get child warnings in dev
// even with the prod transform. This means that jsxDEV is purely
// opt-in behavior for better messages but that we won't stop
// giving you warnings if you use production apis.

export function jsxWithValidationStatic(type, props, key) {}
export function jsxWithValidationDynamic(type, props, key) {}