import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import { disableJavaScriptURLs } from "../../../shared/ReactFeatureFlags"; // A javascript: URL can contain leading C0 control or \u0020 SPACE,
// and any newline or tab are filtered out as if they're not part of the URL.
// https://url.spec.whatwg.org/#url-parsing
// Tab or newline are defined as \r\n\t:
// https://infra.spec.whatwg.org/#ascii-tab-or-newline
// A C0 control is a code point in the range \u0000 NULL to \u001F
// INFORMATION SEPARATOR ONE, inclusive:
// https://infra.spec.whatwg.org/#c0-control-or-space

/* eslint-disable max-len */

var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;
var didWarn = false;
function sanitizeURL(url) {
  if (disableJavaScriptURLs) {
    if (isJavaScriptProtocol.test(url)) {
      throw new Error('React has blocked a javascript: URL as a security precaution.');
    }
  } else {}
}
export default sanitizeURL;