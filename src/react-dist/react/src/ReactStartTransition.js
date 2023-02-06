import { warn as _consoleWarn } from "../../shared/consoleWithStackDev";
import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
import { enableTransitionTracing } from "../../shared/ReactFeatureFlags";
export function startTransition(scope, options) {
  var prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  var currentTransition = ReactCurrentBatchConfig.transition;
  if (enableTransitionTracing) {
    if (options !== undefined && options.name !== undefined) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      ReactCurrentBatchConfig.transition.name = options.name; // $FlowFixMe[incompatible-use] found when upgrading Flow

      ReactCurrentBatchConfig.transition.startTime = -1;
    }
  }
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}