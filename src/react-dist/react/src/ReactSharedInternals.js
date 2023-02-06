import ReactCurrentDispatcher from './ReactCurrentDispatcher';
import ReactCurrentCache from './ReactCurrentCache';
import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
import ReactCurrentActQueue from './ReactCurrentActQueue';
import ReactCurrentOwner from './ReactCurrentOwner';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';
import { enableServerContext } from "../../shared/ReactFeatureFlags";
import { ContextRegistry } from './ReactServerContextRegistry';
var ReactSharedInternals = {
  ReactCurrentDispatcher: ReactCurrentDispatcher,
  ReactCurrentCache: ReactCurrentCache,
  ReactCurrentBatchConfig: ReactCurrentBatchConfig,
  ReactCurrentOwner: ReactCurrentOwner
};
if (enableServerContext) {
  ReactSharedInternals.ContextRegistry = ContextRegistry;
}
export default ReactSharedInternals;