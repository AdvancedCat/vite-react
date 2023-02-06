import { error as _consoleError } from "../../../shared/consoleWithStackDev";
// This exists to avoid circular dependency between ReactDOMEventReplaying
// and DOMPluginEventSystem.
var currentReplayingEvent = null;
export function setReplayingEvent(event) {
  currentReplayingEvent = event;
}
export function resetReplayingEvent() {
  currentReplayingEvent = null;
}
export function isReplayingEvent(event) {
  return event === currentReplayingEvent;
}