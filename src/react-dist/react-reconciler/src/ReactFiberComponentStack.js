import { HostComponent, HostResource, HostSingleton, LazyComponent, SuspenseComponent, SuspenseListComponent, FunctionComponent, IndeterminateComponent, ForwardRef, SimpleMemoComponent, ClassComponent } from './ReactWorkTags';
import { describeBuiltInComponentFrame, describeFunctionComponentFrame, describeClassComponentFrame } from "../../shared/ReactComponentStackFrame";
function describeFiber(fiber) {
  var owner = null;
  var source = null;
  switch (fiber.tag) {
    case HostResource:
    case HostSingleton:
    case HostComponent:
      return describeBuiltInComponentFrame(fiber.type, source, owner);
    case LazyComponent:
      return describeBuiltInComponentFrame('Lazy', source, owner);
    case SuspenseComponent:
      return describeBuiltInComponentFrame('Suspense', source, owner);
    case SuspenseListComponent:
      return describeBuiltInComponentFrame('SuspenseList', source, owner);
    case FunctionComponent:
    case IndeterminateComponent:
    case SimpleMemoComponent:
      return describeFunctionComponentFrame(fiber.type, source, owner);
    case ForwardRef:
      return describeFunctionComponentFrame(fiber.type.render, source, owner);
    case ClassComponent:
      return describeClassComponentFrame(fiber.type, source, owner);
    default:
      return '';
  }
}
export function getStackByFiberInDevAndProd(workInProgress) {
  try {
    var info = '';
    var node = workInProgress;
    do {
      info += describeFiber(node); // $FlowFixMe[incompatible-type] we bail out when we get a null

      node = node.return;
    } while (node);
    return info;
  } catch (x) {
    return '\nError generating stack: ' + x.message + '\n' + x.stack;
  }
}