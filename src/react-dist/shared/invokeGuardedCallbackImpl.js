// $FlowFixMe[missing-this-annot]
function invokeGuardedCallbackProd(name, func, context) {
  // $FlowFixMe[method-unbinding]
  var funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    // $FlowFixMe[incompatible-call] Flow doesn't understand the arguments splicing.
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
}
var invokeGuardedCallbackImpl = invokeGuardedCallbackProd;
export default invokeGuardedCallbackImpl;