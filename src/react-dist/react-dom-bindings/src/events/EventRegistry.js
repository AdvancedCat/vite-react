import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import { enableCreateEventHandleAPI } from "../../../shared/ReactFeatureFlags";
export var allNativeEvents = new Set();
if (enableCreateEventHandleAPI) {
  allNativeEvents.add('beforeblur');
  allNativeEvents.add('afterblur');
}
/**
 * Mapping from registration name to event name
 */

export var registrationNameDependencies = {};
/**
 * Mapping from lowercase registration names to the properly cased version,
 * used to warn in the case of missing event handlers. Available
 * only in false.
 * @type {Object}
 */

export var possibleRegistrationNames = null; // Trust the developer to only use possibleRegistrationNames in false

export function registerTwoPhaseEvent(registrationName, dependencies) {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + 'Capture', dependencies);
}
export function registerDirectEvent(registrationName, dependencies) {
  registrationNameDependencies[registrationName] = dependencies;
  for (var i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}