import { requestPostPaintCallback } from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
var postPaintCallbackScheduled = false;
var callbacks = [];
export function schedulePostPaintCallback(callback) {
  callbacks.push(callback);
  if (!postPaintCallbackScheduled) {
    postPaintCallbackScheduled = true;
    requestPostPaintCallback(function (endTime) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](endTime);
      }
      postPaintCallbackScheduled = false;
      callbacks = [];
    });
  }
}