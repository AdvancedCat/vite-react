import { error as _consoleError } from "../../shared/consoleWithStackDev";
import { isPrimaryRenderer } from "../../react-dom-bindings/src/client/ReactDOMHostConfig"; // Work in progress version numbers only apply to a single render,
// and should be reset before starting a new render.
// This tracks which mutable sources need to be reset after a render.

var workInProgressSources = [];
var rendererSigil;
export function markSourceAsDirty(mutableSource) {
  workInProgressSources.push(mutableSource);
}
export function resetWorkInProgressVersions() {
  for (var i = 0; i < workInProgressSources.length; i++) {
    var mutableSource = workInProgressSources[i];
    if (isPrimaryRenderer) {
      mutableSource._workInProgressVersionPrimary = null;
    } else {
      mutableSource._workInProgressVersionSecondary = null;
    }
  }
  workInProgressSources.length = 0;
}
export function getWorkInProgressVersion(mutableSource) {
  if (isPrimaryRenderer) {
    return mutableSource._workInProgressVersionPrimary;
  } else {
    return mutableSource._workInProgressVersionSecondary;
  }
}
export function setWorkInProgressVersion(mutableSource, version) {
  if (isPrimaryRenderer) {
    mutableSource._workInProgressVersionPrimary = version;
  } else {
    mutableSource._workInProgressVersionSecondary = version;
  }
  workInProgressSources.push(mutableSource);
}
export function warnAboutMultipleRenderersDEV(mutableSource) {} // Eager reads the version of a mutable source and stores it on the root.
// This ensures that the version used for server rendering matches the one
// that is eventually read during hydration.
// If they don't match there's a potential tear and a full deopt render is required.

export function registerMutableSourceForHydration(root, mutableSource) {
  var getVersion = mutableSource._getVersion;
  var version = getVersion(mutableSource._source); // TODO Clear this data once all pending hydration work is finished.
  // Retaining it forever may interfere with GC.

  if (root.mutableSourceEagerHydrationData == null) {
    root.mutableSourceEagerHydrationData = [mutableSource, version];
  } else {
    root.mutableSourceEagerHydrationData.push(mutableSource, version);
  }
}