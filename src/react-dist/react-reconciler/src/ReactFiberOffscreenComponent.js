// We use the existence of the state object as an indicator that the component
// is hidden.
export var OffscreenVisible = /*                     */
1;
export var OffscreenDetached = /*                    */
2;
export var OffscreenPassiveEffectsConnected = /*     */
4;
export function isOffscreenManual(offscreenFiber) {
  return offscreenFiber.memoizedProps !== null && offscreenFiber.memoizedProps.mode === 'manual';
}