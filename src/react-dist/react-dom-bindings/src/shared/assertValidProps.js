import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import voidElementTags from './voidElementTags';
var HTML = '__html';
function assertValidProps(tag, props) {
  if (!props) {
    return;
  } // Note the use of `==` which checks for null or undefined.

  if (voidElementTags[tag]) {
    if (props.children != null || props.dangerouslySetInnerHTML != null) {
      throw new Error(tag + " is a void element tag and must neither have `children` nor " + 'use `dangerouslySetInnerHTML`.');
    }
  }
  if (props.dangerouslySetInnerHTML != null) {
    if (props.children != null) {
      throw new Error('Can only set one of `children` or `props.dangerouslySetInnerHTML`.');
    }
    if (typeof props.dangerouslySetInnerHTML !== 'object' || !(HTML in props.dangerouslySetInnerHTML)) {
      throw new Error('`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' + 'Please visit https://reactjs.org/link/dangerously-set-inner-html ' + 'for more information.');
    }
  }
  if (props.style != null && typeof props.style !== 'object') {
    throw new Error('The `style` prop expects a mapping from style properties to values, ' + "not a string. For example, style={{marginRight: spacing + 'em'}} when " + 'using JSX.');
  }
}
export default assertValidProps;