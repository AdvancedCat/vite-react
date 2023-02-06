import ReactDOMSharedInternals from "../../../react-dom/src/ReactDOMSharedInternals";
export function preinit() {
  var dispatcher = ReactDOMSharedInternals.Dispatcher.current;
  if (dispatcher) {
    dispatcher.preinit.apply(this, arguments);
  } // We don't error because preinit needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

export function preload() {
  var dispatcher = ReactDOMSharedInternals.Dispatcher.current;
  if (dispatcher) {
    dispatcher.preload.apply(this, arguments);
  } // We don't error because preload needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}