import { error as _consoleError } from "../../../shared/consoleWithStackDev";
import _assign from "../../../shared/assign";
import ReactDOMSharedInternals from "../../../react-dom/src/ReactDOMSharedInternals";
var Dispatcher = ReactDOMSharedInternals.Dispatcher;
import { DOCUMENT_NODE } from '../shared/HTMLNodeType';
import { warnOnMissingHrefAndRel, validatePreloadResourceDifference, validateURLKeyedUpdatedProps, validateStyleResourceDifference, validateScriptResourceDifference, validateLinkPropsForStyleResource, validateLinkPropsForPreloadResource, validatePreloadArguments, validatePreinitArguments } from '../shared/ReactDOMResourceValidation';
import { createElement, setInitialProperties } from './ReactDOMComponent';
import { getResourcesFromRoot, markNodeAsResource } from './ReactDOMComponentTree';
import { HTML_NAMESPACE, SVG_NAMESPACE } from '../shared/DOMNamespaces';
import { getCurrentRootHostContainer } from "../../../react-reconciler/src/ReactFiberHostContext"; // The resource types we support. currently they match the form for the as argument.
// In the future this may need to change, especially when modules / scripts are supported
// Brief on purpose due to insertion by script when streaming late boundaries
// s = Status
// l = loaded
// e = errored
// It is valid to preload even when we aren't actively rendering. For cases where Float functions are
// called when there is no rendering we track the last used document. It is not safe to insert
// arbitrary resources into the lastCurrentDocument b/c it may not actually be the document
// that the resource is meant to apply too (for example stylesheets or scripts). This is only
// appropriate for resources that don't really have a strict tie to the document itself for example
// preloads

var lastCurrentDocument = null;
var previousDispatcher = null;
export function prepareToRenderResources(rootContainer) {
  var rootNode = getRootNode(rootContainer);
  lastCurrentDocument = getDocumentFromRoot(rootNode);
  previousDispatcher = Dispatcher.current;
  Dispatcher.current = ReactDOMClientDispatcher;
}
export function cleanupAfterRenderResources() {
  Dispatcher.current = previousDispatcher;
  previousDispatcher = null;
} // We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> FloatClient -> Internals so this doesn't introduce a new one.

export var ReactDOMClientDispatcher = {
  preload: preload,
  preinit: preinit
}; // global maps of Resources

var preloadResources = new Map(); // getRootNode is missing from IE and old jsdom versions

function getRootNode(container) {
  // $FlowFixMe[method-unbinding]
  return typeof container.getRootNode === 'function' ?
  /* $FlowFixMe[incompatible-return] Flow types this as returning a `Node`,
   * but it's either a `Document` or `ShadowRoot`. */
  container.getRootNode() : container.ownerDocument;
}
function getCurrentResourceRoot() {
  var currentContainer = getCurrentRootHostContainer();
  return currentContainer ? getRootNode(currentContainer) : null;
} // This resource type constraint can be loosened. It really is everything except PreloadResource
// because that is the only one that does not have an optional instance type. Expand as needed.

function resetInstance(resource) {
  resource.instance = undefined;
}
export function clearRootResources(rootContainer) {
  var rootNode = getRootNode(rootContainer);
  var resources = getResourcesFromRoot(rootNode); // We can't actually delete the resource cache because this function is called
  // during commit after we have rendered. Instead we detatch any instances from
  // the Resource object if they are going to be cleared
  // Styles stay put
  // Scripts get reset

  resources.scripts.forEach(resetInstance); // Head Resources get reset

  resources.head.forEach(resetInstance); // lastStructuredMeta stays put
} // Preloads are somewhat special. Even if we don't have the Document
// used by the root that is rendering a component trying to insert a preload
// we can still seed the file cache by doing the preload on any document we have
// access to. We prefer the currentDocument if it exists, we also prefer the
// lastCurrentDocument if that exists. As a fallback we will use the window.document
// if available.

function getDocumentForPreloads() {
  var root = getCurrentResourceRoot();
  if (root) {
    return root.ownerDocument || root;
  } else {
    try {
      return lastCurrentDocument || window.document;
    } catch (error) {
      return null;
    }
  }
}
function getDocumentFromRoot(root) {
  return root.ownerDocument || root;
} // --------------------------------------
//      ReactDOM.Preload
// --------------------------------------

function preload(href, options) {
  var ownerDocument = getDocumentForPreloads();
  if (typeof href === 'string' && href && typeof options === 'object' && options !== null && ownerDocument) {
    var as = options.as;
    var resource = preloadResources.get(href);
    if (resource) {} else {
      var resourceProps = preloadPropsFromPreloadOptions(href, as, options);
      createPreloadResource(ownerDocument, href, resourceProps);
    }
  }
}
function preloadPropsFromPreloadOptions(href, as, options) {
  return {
    href: href,
    rel: 'preload',
    as: as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity
  };
} // --------------------------------------
//      ReactDOM.preinit
// --------------------------------------

function preinit(href, options) {
  if (typeof href === 'string' && href && typeof options === 'object' && options !== null) {
    var resourceRoot = getCurrentResourceRoot();
    var as = options.as;
    if (!resourceRoot) {
      // We are going to emit a preload as a best effort fallback since this preinit
      // was called outside of a render. Given the passive nature of this fallback
      // we do not warn in dev when props disagree if there happens to already be a
      // matching preload with this href
      var preloadDocument = getDocumentForPreloads();
      if (preloadDocument) {
        var preloadResource = preloadResources.get(href);
        if (!preloadResource) {
          var preloadProps = preloadPropsFromPreinitOptions(href, as, options);
          createPreloadResource(preloadDocument, href, preloadProps);
        }
      }
      return;
    }
    switch (as) {
      case 'style':
        {
          var styleResources = getResourcesFromRoot(resourceRoot).styles;
          var precedence = options.precedence || 'default';
          var resource = styleResources.get(href);
          if (resource) {} else {
            var resourceProps = stylePropsFromPreinitOptions(href, precedence, options);
            resource = createStyleResource(styleResources, resourceRoot, href, precedence, resourceProps);
          }
          acquireResource(resource);
          return;
        }
      case 'script':
        {
          var src = href;
          var scriptResources = getResourcesFromRoot(resourceRoot).scripts;
          var _resource = scriptResources.get(src);
          if (_resource) {} else {
            var _resourceProps = scriptPropsFromPreinitOptions(src, options);
            _resource = createScriptResource(scriptResources, resourceRoot, src, _resourceProps);
          }
          acquireResource(_resource);
          return;
        }
    }
  }
}
function preloadPropsFromPreinitOptions(href, as, options) {
  return {
    href: href,
    rel: 'preload',
    as: as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity
  };
}
function stylePropsFromPreinitOptions(href, precedence, options) {
  return {
    rel: 'stylesheet',
    href: href,
    'data-precedence': precedence,
    crossOrigin: options.crossOrigin
  };
}
function scriptPropsFromPreinitOptions(src, options) {
  return {
    src: src,
    async: true,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity
  };
} // --------------------------------------
//      Resources from render
// --------------------------------------

function getTitleKey(child) {
  return 'title:' + child;
} // This function is called in begin work and we should always have a currentDocument set

export function getResource(type, pendingProps, currentProps) {
  var resourceRoot = getCurrentResourceRoot();
  if (!resourceRoot) {
    throw new Error('"resourceRoot" was expected to exist. This is a bug in React.');
  }
  switch (type) {
    case 'base':
      {
        var headRoot = getDocumentFromRoot(resourceRoot);
        var headResources = getResourcesFromRoot(headRoot).head;
        var target = pendingProps.target,
          href = pendingProps.href;
        var matcher = 'base';
        matcher += typeof href === 'string' ? "[href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"]" : ':not([href])';
        matcher += typeof target === 'string' ? "[target=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(target) + "\"]" : ':not([target])';
        var resource = headResources.get(matcher);
        if (!resource) {
          resource = {
            type: 'base',
            matcher: matcher,
            props: _assign({}, pendingProps),
            count: 0,
            instance: null,
            root: headRoot
          };
          headResources.set(matcher, resource);
        }
        return resource;
      }
    case 'meta':
      {
        var _matcher, propertyString, parentResource;
        var charSet = pendingProps.charSet,
          content = pendingProps.content,
          httpEquiv = pendingProps.httpEquiv,
          name = pendingProps.name,
          itemProp = pendingProps.itemProp,
          property = pendingProps.property;
        var _headRoot = getDocumentFromRoot(resourceRoot);
        var _getResourcesFromRoot = getResourcesFromRoot(_headRoot),
          _headResources = _getResourcesFromRoot.head,
          lastStructuredMeta = _getResourcesFromRoot.lastStructuredMeta;
        if (typeof charSet === 'string') {
          _matcher = 'meta[charset]';
        } else if (typeof content === 'string') {
          if (typeof httpEquiv === 'string') {
            _matcher = "meta[http-equiv=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(httpEquiv) + "\"][content=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(content) + "\"]";
          } else if (typeof property === 'string') {
            propertyString = property;
            _matcher = "meta[property=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(property) + "\"][content=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(content) + "\"]";
            var parentPropertyPath = property.split(':').slice(0, -1).join(':');
            parentResource = lastStructuredMeta.get(parentPropertyPath);
            if (parentResource) {
              // When using parentResource the matcher is not functional for locating
              // the instance in the DOM but it still serves as a unique key.
              _matcher = parentResource.matcher + _matcher;
            }
          } else if (typeof name === 'string') {
            _matcher = "meta[name=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(name) + "\"][content=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(content) + "\"]";
          } else if (typeof itemProp === 'string') {
            _matcher = "meta[itemprop=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(itemProp) + "\"][content=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(content) + "\"]";
          }
        }
        if (_matcher) {
          var _resource2 = _headResources.get(_matcher);
          if (!_resource2) {
            _resource2 = {
              type: 'meta',
              matcher: _matcher,
              property: propertyString,
              parentResource: parentResource,
              props: _assign({}, pendingProps),
              count: 0,
              instance: null,
              root: _headRoot
            };
            _headResources.set(_matcher, _resource2);
          }
          if (typeof _resource2.property === 'string') {
            // We cast because flow doesn't know that this resource must be a Meta resource
            lastStructuredMeta.set(_resource2.property, _resource2);
          }
          return _resource2;
        }
        return null;
      }
    case 'title':
      {
        var children = pendingProps.children;
        var child;
        if (Array.isArray(children)) {
          child = children.length === 1 ? children[0] : null;
        } else {
          child = children;
        }
        if (typeof child !== 'function' && typeof child !== 'symbol' && child !== null && child !== undefined) {
          // eslint-disable-next-line react-internal/safe-string-coercion
          var childString = '' + child;
          var _headRoot2 = getDocumentFromRoot(resourceRoot);
          var _headResources2 = getResourcesFromRoot(_headRoot2).head;
          var key = getTitleKey(childString);
          var _resource3 = _headResources2.get(key);
          if (!_resource3) {
            var titleProps = titlePropsFromRawProps(childString, pendingProps);
            _resource3 = {
              type: 'title',
              props: titleProps,
              count: 0,
              instance: null,
              root: _headRoot2
            };
            _headResources2.set(key, _resource3);
          }
          return _resource3;
        }
        return null;
      }
    case 'link':
      {
        var rel = pendingProps.rel;
        switch (rel) {
          case 'stylesheet':
            {
              var styleResources = getResourcesFromRoot(resourceRoot).styles;
              var didWarn;
              var precedence = pendingProps.precedence,
                _href = pendingProps.href;
              if (typeof _href === 'string' && typeof precedence === 'string') {
                // We've asserted all the specific types for StyleQualifyingProps
                var styleRawProps = pendingProps; // We construct or get an existing resource for the style itself and return it

                var _resource4 = styleResources.get(_href);
                if (_resource4) {} else {
                  var resourceProps = stylePropsFromRawProps(styleRawProps);
                  _resource4 = createStyleResource(styleResources, resourceRoot, _href, precedence, resourceProps);
                  immediatelyPreloadStyleResource(_resource4);
                }
                return _resource4;
              }
              return null;
            }
          case 'preload':
            {
              var _href2 = pendingProps.href;
              if (typeof _href2 === 'string') {
                // We've asserted all the specific types for PreloadQualifyingProps
                var preloadRawProps = pendingProps;
                var _resource5 = preloadResources.get(_href2);
                if (_resource5) {} else {
                  var _resourceProps2 = preloadPropsFromRawProps(preloadRawProps);
                  _resource5 = createPreloadResource(getDocumentFromRoot(resourceRoot), _href2, _resourceProps2);
                }
                return _resource5;
              }
              return null;
            }
          default:
            {
              var _href3 = pendingProps.href,
                sizes = pendingProps.sizes,
                media = pendingProps.media;
              if (typeof rel === 'string' && typeof _href3 === 'string') {
                var sizeKey = '::sizes:' + (typeof sizes === 'string' ? sizes : '');
                var mediaKey = '::media:' + (typeof media === 'string' ? media : '');
                var _key = 'rel:' + rel + '::href:' + _href3 + sizeKey + mediaKey;
                var _headRoot3 = getDocumentFromRoot(resourceRoot);
                var _headResources3 = getResourcesFromRoot(_headRoot3).head;
                var _resource6 = _headResources3.get(_key);
                if (!_resource6) {
                  _resource6 = {
                    type: 'link',
                    props: _assign({}, pendingProps),
                    count: 0,
                    instance: null,
                    root: _headRoot3
                  };
                  _headResources3.set(_key, _resource6);
                }
                return _resource6;
              }
              return null;
            }
        }
      }
    case 'script':
      {
        var scriptResources = getResourcesFromRoot(resourceRoot).scripts;
        var _didWarn;
        var src = pendingProps.src,
          async = pendingProps.async;
        if (async && typeof src === 'string') {
          var scriptRawProps = pendingProps;
          var _resource7 = scriptResources.get(src);
          if (_resource7) {} else {
            var _resourceProps3 = scriptPropsFromRawProps(scriptRawProps);
            _resource7 = createScriptResource(scriptResources, resourceRoot, src, _resourceProps3);
          }
          return _resource7;
        }
        return null;
      }
    default:
      {
        throw new Error("getResource encountered a resource type it did not expect: \"" + type + "\". this is a bug in React.");
      }
  }
}
function preloadPropsFromRawProps(rawBorrowedProps) {
  // $FlowFixMe[prop-missing] - recommended fix is to use object spread operator
  return _assign({}, rawBorrowedProps);
}
function titlePropsFromRawProps(child, rawProps) {
  var props = _assign({}, rawProps);
  props.children = child;
  return props;
}
function stylePropsFromRawProps(rawProps) {
  // $FlowFixMe[prop-missing] - recommended fix is to use object spread operator
  var props = _assign({}, rawProps);
  props['data-precedence'] = rawProps.precedence;
  props.precedence = null;
  return props;
}
function scriptPropsFromRawProps(rawProps) {
  // $FlowFixMe[prop-missing] - recommended fix is to use object spread operator
  var props = _assign({}, rawProps);
  return props;
} // --------------------------------------
//      Resource Reconciliation
// --------------------------------------

export function acquireResource(resource) {
  switch (resource.type) {
    case 'base':
    case 'title':
    case 'link':
    case 'meta':
      {
        return acquireHeadResource(resource);
      }
    case 'style':
      {
        return acquireStyleResource(resource);
      }
    case 'script':
      {
        return acquireScriptResource(resource);
      }
    case 'preload':
      {
        return resource.instance;
      }
    default:
      {
        throw new Error("acquireResource encountered a resource type it did not expect: \"" + resource.type + "\". this is a bug in React.");
      }
  }
}
export function releaseResource(resource) {
  switch (resource.type) {
    case 'link':
    case 'title':
    case 'meta':
      {
        return releaseHeadResource(resource);
      }
    case 'style':
      {
        resource.count--;
        return;
      }
  }
}
function releaseHeadResource(resource) {
  if (--resource.count === 0) {
    // the instance will have existed since we acquired it
    var instance = resource.instance;
    var parent = instance.parentNode;
    if (parent) {
      parent.removeChild(instance);
    }
    resource.instance = null;
  }
}
function createResourceInstance(type, props, ownerDocument) {
  var element = createElement(type, props, ownerDocument, HTML_NAMESPACE);
  setInitialProperties(element, type, props);
  markNodeAsResource(element);
  return element;
}
function createStyleResource(styleResources, root, href, precedence, props) {
  var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
  var existingEl = root.querySelector("link[rel=\"stylesheet\"][href=\"" + limitedEscapedHref + "\"]");
  var resource = {
    type: 'style',
    count: 0,
    href: href,
    precedence: precedence,
    props: props,
    hint: null,
    preloaded: false,
    loaded: false,
    error: false,
    root: root,
    instance: null
  };
  styleResources.set(href, resource);
  if (existingEl) {
    // If we have an existing element in the DOM we don't need to preload this resource nor can we
    // adopt props from any preload that might exist already for this resource. We do need to try
    // to reify the Resource loading state the best we can.
    var loadingState = existingEl._p;
    if (loadingState) {
      switch (loadingState.s) {
        case 'l':
          {
            resource.loaded = true;
            break;
          }
        case 'e':
          {
            resource.error = true;
            break;
          }
        default:
          {
            attachLoadListeners(existingEl, resource);
          }
      }
    } else {
      // This is unfortunately just an assumption. The rationale here is that stylesheets without
      // a loading state must have been flushed in the shell and would have blocked until loading
      // or error. we can't know afterwards which happened for all types of stylesheets (cross origin)
      // for instance) and the techniques for determining if a sheet has loaded that we do have still
      // fail if the sheet loaded zero rules. At the moment we are going to just opt to assume the
      // sheet is loaded if it was flushed in the shell
      resource.loaded = true;
    }
  } else {
    var hint = preloadResources.get(href);
    if (hint) {
      // $FlowFixMe[incompatible-type]: found when upgrading Flow
      resource.hint = hint; // If a preload for this style Resource already exists there are certain props we want to adopt
      // on the style Resource, primarily focussed on making sure the style network pathways utilize
      // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
      // and a stylesheet the stylesheet will make a new request even if the preload had already loaded

      var preloadProps = hint.props;
      adoptPreloadPropsForStyle(resource.props, hint.props);
    }
  }
  return resource;
}
function adoptPreloadPropsForStyle(styleProps, preloadProps) {
  if (styleProps.crossOrigin == null) styleProps.crossOrigin = preloadProps.crossOrigin;
  if (styleProps.referrerPolicy == null) styleProps.referrerPolicy = preloadProps.referrerPolicy;
  if (styleProps.title == null) styleProps.title = preloadProps.title;
}
function immediatelyPreloadStyleResource(resource) {
  // This function must be called synchronously after creating a styleResource otherwise it may
  // violate assumptions around the existence of a preload. The reason it is extracted out is we
  // don't always want to preload a style, in particular when we are going to synchronously insert
  // that style. We confirm the style resource has no preload already and then construct it. If
  // we wait and call this later it is possible a preload will already exist for this href
  if (resource.loaded === false && resource.hint === null) {
    var href = resource.href,
      props = resource.props;
    var preloadProps = preloadPropsFromStyleProps(props);
    resource.hint = createPreloadResource(getDocumentFromRoot(resource.root), href, preloadProps);
  }
}
function preloadPropsFromStyleProps(props) {
  return {
    rel: 'preload',
    as: 'style',
    href: props.href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy
  };
}
function createScriptResource(scriptResources, root, src, props) {
  var limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(src);
  var existingEl = root.querySelector("script[async][src=\"" + limitedEscapedSrc + "\"]");
  var resource = {
    type: 'script',
    src: src,
    props: props,
    root: root,
    instance: existingEl || null
  };
  scriptResources.set(src, resource);
  if (!existingEl) {
    var hint = preloadResources.get(src);
    if (hint) {
      // If a preload for this style Resource already exists there are certain props we want to adopt
      // on the style Resource, primarily focussed on making sure the style network pathways utilize
      // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
      // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
      var preloadProps = hint.props;
      adoptPreloadPropsForScript(props, hint.props);
    }
  } else {
    markNodeAsResource(existingEl);
  }
  return resource;
}
function adoptPreloadPropsForScript(scriptProps, preloadProps) {
  if (scriptProps.crossOrigin == null) scriptProps.crossOrigin = preloadProps.crossOrigin;
  if (scriptProps.referrerPolicy == null) scriptProps.referrerPolicy = preloadProps.referrerPolicy;
  if (scriptProps.integrity == null) scriptProps.referrerPolicy = preloadProps.integrity;
}
function createPreloadResource(ownerDocument, href, props) {
  var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
  var element = ownerDocument.querySelector("link[rel=\"preload\"][href=\"" + limitedEscapedHref + "\"]");
  if (!element) {
    element = createResourceInstance('link', props, ownerDocument);
    insertResourceInstanceBefore(ownerDocument, element, null);
  } else {
    markNodeAsResource(element);
  }
  return {
    type: 'preload',
    href: href,
    ownerDocument: ownerDocument,
    props: props,
    instance: element
  };
}
function acquireHeadResource(resource) {
  resource.count++;
  var instance = resource.instance;
  if (!instance) {
    var props = resource.props,
      root = resource.root,
      type = resource.type;
    switch (type) {
      case 'title':
        {
          var titles = root.querySelectorAll('title');
          for (var i = 0; i < titles.length; i++) {
            if (titles[i].textContent === props.children) {
              instance = resource.instance = titles[i];
              markNodeAsResource(instance);
              return instance;
            }
          }
          instance = resource.instance = createResourceInstance(type, props, root);
          var firstTitle = titles[0];
          insertResourceInstanceBefore(root, instance, firstTitle && firstTitle.namespaceURI !== SVG_NAMESPACE ? firstTitle : null);
          break;
        }
      case 'meta':
        {
          var insertBefore = null;
          var metaResource = resource;
          var matcher = metaResource.matcher,
            property = metaResource.property,
            parentResource = metaResource.parentResource;
          if (parentResource && typeof property === 'string') {
            // This resoruce is a structured meta type with a parent.
            // Instead of using the matcher we just traverse forward
            // siblings of the parent instance until we find a match
            // or exhaust.
            var parent = parentResource.instance;
            if (parent) {
              var node = null;
              var nextNode = insertBefore = parent.nextSibling;
              while (node = nextNode) {
                nextNode = node.nextSibling;
                if (node.nodeName === 'META') {
                  var meta = node;
                  var propertyAttr = meta.getAttribute('property');
                  if (typeof propertyAttr !== 'string') {
                    continue;
                  } else if (propertyAttr === property && meta.getAttribute('content') === props.content) {
                    resource.instance = meta;
                    markNodeAsResource(meta);
                    return meta;
                  } else if (property.startsWith(propertyAttr + ':')) {
                    // This meta starts a new instance of a parent structure for this meta type
                    // We need to halt our search here because even if we find a later match it
                    // is for a different parent element
                    break;
                  }
                }
              }
            }
          } else if (instance = root.querySelector(matcher)) {
            resource.instance = instance;
            markNodeAsResource(instance);
            return instance;
          }
          instance = resource.instance = createResourceInstance(type, props, root);
          insertResourceInstanceBefore(root, instance, insertBefore);
          break;
        }
      case 'link':
        {
          var linkProps = props;
          var limitedEscapedRel = escapeSelectorAttributeValueInsideDoubleQuotes(linkProps.rel);
          var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(linkProps.href);
          var selector = "link[rel=\"" + limitedEscapedRel + "\"][href=\"" + limitedEscapedHref + "\"]";
          if (typeof linkProps.sizes === 'string') {
            var limitedEscapedSizes = escapeSelectorAttributeValueInsideDoubleQuotes(linkProps.sizes);
            selector += "[sizes=\"" + limitedEscapedSizes + "\"]";
          }
          if (typeof linkProps.media === 'string') {
            var limitedEscapedMedia = escapeSelectorAttributeValueInsideDoubleQuotes(linkProps.media);
            selector += "[media=\"" + limitedEscapedMedia + "\"]";
          }
          var existingEl = root.querySelector(selector);
          if (existingEl) {
            instance = resource.instance = existingEl;
            markNodeAsResource(instance);
            return instance;
          }
          instance = resource.instance = createResourceInstance(type, props, root);
          insertResourceInstanceBefore(root, instance, null);
          return instance;
        }
      case 'base':
        {
          var baseResource = resource;
          var _matcher2 = baseResource.matcher;
          var base = root.querySelector(_matcher2);
          if (base) {
            instance = resource.instance = base;
            markNodeAsResource(instance);
          } else {
            instance = resource.instance = createResourceInstance(type, props, root);
            insertResourceInstanceBefore(root, instance, root.querySelector('base'));
          }
          return instance;
        }
      default:
        {
          throw new Error("acquireHeadResource encountered a resource type it did not expect: \"" + type + "\". This is a bug in React.");
        }
    }
  }
  return instance;
}
function acquireStyleResource(resource) {
  var instance = resource.instance;
  if (!instance) {
    var props = resource.props,
      root = resource.root,
      precedence = resource.precedence;
    var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(props.href);
    var existingEl = root.querySelector("link[rel=\"stylesheet\"][data-precedence][href=\"" + limitedEscapedHref + "\"]");
    if (existingEl) {
      instance = resource.instance = existingEl;
      markNodeAsResource(instance);
      resource.preloaded = true;
      var loadingState = existingEl._p;
      if (loadingState) {
        // if an existingEl is found there should always be a loadingState because if
        // the resource was flushed in the head it should have already been found when
        // the resource was first created. Still defensively we gate this
        switch (loadingState.s) {
          case 'l':
            {
              resource.loaded = true;
              resource.error = false;
              break;
            }
          case 'e':
            {
              resource.error = true;
              break;
            }
          default:
            {
              attachLoadListeners(existingEl, resource);
            }
        }
      } else {
        resource.loaded = true;
      }
    } else {
      instance = resource.instance = createResourceInstance('link', resource.props, getDocumentFromRoot(root));
      attachLoadListeners(instance, resource);
      insertStyleInstance(instance, precedence, root);
    }
  }
  resource.count++;
  return instance;
}
function acquireScriptResource(resource) {
  var instance = resource.instance;
  if (!instance) {
    var props = resource.props,
      root = resource.root;
    var limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(props.src);
    var existingEl = root.querySelector("script[async][src=\"" + limitedEscapedSrc + "\"]");
    if (existingEl) {
      instance = resource.instance = existingEl;
      markNodeAsResource(instance);
    } else {
      instance = resource.instance = createResourceInstance('script', resource.props, getDocumentFromRoot(root));
      insertResourceInstanceBefore(getDocumentFromRoot(root), instance, null);
    }
  }
  return instance;
}
function attachLoadListeners(instance, resource) {
  var listeners = {};
  listeners.load = onResourceLoad.bind(null, instance, resource, listeners, loadAndErrorEventListenerOptions);
  listeners.error = onResourceError.bind(null, instance, resource, listeners, loadAndErrorEventListenerOptions);
  instance.addEventListener('load', listeners.load, loadAndErrorEventListenerOptions);
  instance.addEventListener('error', listeners.error, loadAndErrorEventListenerOptions);
}
var loadAndErrorEventListenerOptions = {
  passive: true
};
function onResourceLoad(instance, resource, listeners, listenerOptions) {
  resource.loaded = true;
  resource.error = false;
  for (var event in listeners) {
    instance.removeEventListener(event, listeners[event], listenerOptions);
  }
}
function onResourceError(instance, resource, listeners, listenerOptions) {
  resource.loaded = false;
  resource.error = true;
  for (var event in listeners) {
    instance.removeEventListener(event, listeners[event], listenerOptions);
  }
}
function insertStyleInstance(instance, precedence, root) {
  var nodes = root.querySelectorAll('link[rel="stylesheet"][data-precedence]');
  var last = nodes.length ? nodes[nodes.length - 1] : null;
  var prior = last;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var nodePrecedence = node.dataset.precedence;
    if (nodePrecedence === precedence) {
      prior = node;
    } else if (prior !== last) {
      break;
    }
  }
  if (prior) {
    // We get the prior from the document so we know it is in the tree.
    // We also know that links can't be the topmost Node so the parentNode
    // must exist.
    prior.parentNode.insertBefore(instance, prior.nextSibling);
  } else {
    var parent = root.nodeType === DOCUMENT_NODE ? root.head : root;
    if (parent) {
      parent.insertBefore(instance, parent.firstChild);
    } else {
      throw new Error('While attempting to insert a Resource, React expected the Document to contain' + ' a head element but it was not found.');
    }
  }
}
function insertResourceInstanceBefore(ownerDocument, instance, before) {
  var parent = before && before.parentNode || ownerDocument.head;
  if (parent) {
    parent.insertBefore(instance, before);
  } else {
    throw new Error('While attempting to insert a Resource, React expected the Document to contain' + ' a head element but it was not found.');
  }
} // When passing user input into querySelector(All) the embedded string must not alter
// the semantics of the query. This escape function is safe to use when we know the
// provided value is going to be wrapped in double quotes as part of an attribute selector
// Do not use it anywhere else
// we escape double quotes and backslashes

var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n\"\\]/g;
function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
  return value.replace(escapeSelectorAttributeValueInsideDoubleQuotesRegex, function (ch) {
    return '\\' + ch.charCodeAt(0).toString(16);
  });
}