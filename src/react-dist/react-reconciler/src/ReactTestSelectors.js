import { HostComponent, HostResource, HostSingleton, HostText } from "./ReactWorkTags";
import getComponentNameFromType from "../../shared/getComponentNameFromType";
import { findFiberRoot, getBoundingRect, getInstanceFromNode, getTextContent, isHiddenSubtree, matchAccessibilityRole, setFocusIfFocusable, setupIntersectionObserver, supportsTestSelectors } from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
var COMPONENT_TYPE = 0;
var HAS_PSEUDO_CLASS_TYPE = 1;
var ROLE_TYPE = 2;
var TEST_NAME_TYPE = 3;
var TEXT_TYPE = 4;
if (typeof Symbol === 'function' && Symbol.for) {
  var symbolFor = Symbol.for;
  COMPONENT_TYPE = symbolFor('selector.component');
  HAS_PSEUDO_CLASS_TYPE = symbolFor('selector.has_pseudo_class');
  ROLE_TYPE = symbolFor('selector.role');
  TEST_NAME_TYPE = symbolFor('selector.test_id');
  TEXT_TYPE = symbolFor('selector.text');
}
export function createComponentSelector(component) {
  return {
    $$typeof: COMPONENT_TYPE,
    value: component
  };
}
export function createHasPseudoClassSelector(selectors) {
  return {
    $$typeof: HAS_PSEUDO_CLASS_TYPE,
    value: selectors
  };
}
export function createRoleSelector(role) {
  return {
    $$typeof: ROLE_TYPE,
    value: role
  };
}
export function createTextSelector(text) {
  return {
    $$typeof: TEXT_TYPE,
    value: text
  };
}
export function createTestNameSelector(id) {
  return {
    $$typeof: TEST_NAME_TYPE,
    value: id
  };
}
function findFiberRootForHostRoot(hostRoot) {
  var maybeFiber = getInstanceFromNode(hostRoot);
  if (maybeFiber != null) {
    if (typeof maybeFiber.memoizedProps['data-testname'] !== 'string') {
      throw new Error('Invalid host root specified. Should be either a React container or a node with a testname attribute.');
    }
    return maybeFiber;
  } else {
    var fiberRoot = findFiberRoot(hostRoot);
    if (fiberRoot === null) {
      throw new Error('Could not find React container within specified host subtree.');
    } // The Flow type for FiberRoot is a little funky.
    // createFiberRoot() cheats this by treating the root as :any and adding stateNode lazily.

    return fiberRoot.stateNode.current;
  }
}
function matchSelector(fiber, selector) {
  var tag = fiber.tag;
  switch (selector.$$typeof) {
    case COMPONENT_TYPE:
      if (fiber.type === selector.value) {
        return true;
      }
      break;
    case HAS_PSEUDO_CLASS_TYPE:
      return hasMatchingPaths(fiber, selector.value);
    case ROLE_TYPE:
      if (tag === HostComponent || tag === HostResource || tag === HostSingleton) {
        var node = fiber.stateNode;
        if (matchAccessibilityRole(node, selector.value)) {
          return true;
        }
      }
      break;
    case TEXT_TYPE:
      if (tag === HostComponent || tag === HostText || tag === HostResource || tag === HostSingleton) {
        var textContent = getTextContent(fiber);
        if (textContent !== null && textContent.indexOf(selector.value) >= 0) {
          return true;
        }
      }
      break;
    case TEST_NAME_TYPE:
      if (tag === HostComponent || tag === HostResource || tag === HostSingleton) {
        var dataTestID = fiber.memoizedProps['data-testname'];
        if (typeof dataTestID === 'string' && dataTestID.toLowerCase() === selector.value.toLowerCase()) {
          return true;
        }
      }
      break;
    default:
      throw new Error('Invalid selector type specified.');
  }
  return false;
}
function selectorToString(selector) {
  switch (selector.$$typeof) {
    case COMPONENT_TYPE:
      var displayName = getComponentNameFromType(selector.value) || 'Unknown';
      return "<" + displayName + ">";
    case HAS_PSEUDO_CLASS_TYPE:
      return ":has(" + (selectorToString(selector) || '') + ")";
    case ROLE_TYPE:
      return "[role=\"" + selector.value + "\"]";
    case TEXT_TYPE:
      return "\"" + selector.value + "\"";
    case TEST_NAME_TYPE:
      return "[data-testname=\"" + selector.value + "\"]";
    default:
      throw new Error('Invalid selector type specified.');
  }
}
function findPaths(root, selectors) {
  var matchingFibers = [];
  var stack = [root, 0];
  var index = 0;
  while (index < stack.length) {
    var fiber = stack[index++];
    var tag = fiber.tag;
    var selectorIndex = stack[index++];
    var selector = selectors[selectorIndex];
    if ((tag === HostComponent || tag === HostResource || tag === HostSingleton) && isHiddenSubtree(fiber)) {
      continue;
    } else {
      while (selector != null && matchSelector(fiber, selector)) {
        selectorIndex++;
        selector = selectors[selectorIndex];
      }
    }
    if (selectorIndex === selectors.length) {
      matchingFibers.push(fiber);
    } else {
      var child = fiber.child;
      while (child !== null) {
        stack.push(child, selectorIndex);
        child = child.sibling;
      }
    }
  }
  return matchingFibers;
} // Same as findPaths but with eager bailout on first match

function hasMatchingPaths(root, selectors) {
  var stack = [root, 0];
  var index = 0;
  while (index < stack.length) {
    var fiber = stack[index++];
    var tag = fiber.tag;
    var selectorIndex = stack[index++];
    var selector = selectors[selectorIndex];
    if ((tag === HostComponent || tag === HostResource || tag === HostSingleton) && isHiddenSubtree(fiber)) {
      continue;
    } else {
      while (selector != null && matchSelector(fiber, selector)) {
        selectorIndex++;
        selector = selectors[selectorIndex];
      }
    }
    if (selectorIndex === selectors.length) {
      return true;
    } else {
      var child = fiber.child;
      while (child !== null) {
        stack.push(child, selectorIndex);
        child = child.sibling;
      }
    }
  }
  return false;
}
export function findAllNodes(hostRoot, selectors) {
  if (!supportsTestSelectors) {
    throw new Error('Test selector API is not supported by this renderer.');
  }
  var root = findFiberRootForHostRoot(hostRoot);
  var matchingFibers = findPaths(root, selectors);
  var instanceRoots = [];
  var stack = Array.from(matchingFibers);
  var index = 0;
  while (index < stack.length) {
    var node = stack[index++];
    var tag = node.tag;
    if (tag === HostComponent || tag === HostResource || tag === HostSingleton) {
      if (isHiddenSubtree(node)) {
        continue;
      }
      instanceRoots.push(node.stateNode);
    } else {
      var child = node.child;
      while (child !== null) {
        stack.push(child);
        child = child.sibling;
      }
    }
  }
  return instanceRoots;
}
export function getFindAllNodesFailureDescription(hostRoot, selectors) {
  if (!supportsTestSelectors) {
    throw new Error('Test selector API is not supported by this renderer.');
  }
  var root = findFiberRootForHostRoot(hostRoot);
  var maxSelectorIndex = 0;
  var matchedNames = []; // The logic of this loop should be kept in sync with findPaths()

  var stack = [root, 0];
  var index = 0;
  while (index < stack.length) {
    var fiber = stack[index++];
    var tag = fiber.tag;
    var selectorIndex = stack[index++];
    var selector = selectors[selectorIndex];
    if ((tag === HostComponent || tag === HostResource || tag === HostSingleton) && isHiddenSubtree(fiber)) {
      continue;
    } else if (matchSelector(fiber, selector)) {
      matchedNames.push(selectorToString(selector));
      selectorIndex++;
      if (selectorIndex > maxSelectorIndex) {
        maxSelectorIndex = selectorIndex;
      }
    }
    if (selectorIndex < selectors.length) {
      var child = fiber.child;
      while (child !== null) {
        stack.push(child, selectorIndex);
        child = child.sibling;
      }
    }
  }
  if (maxSelectorIndex < selectors.length) {
    var unmatchedNames = [];
    for (var i = maxSelectorIndex; i < selectors.length; i++) {
      unmatchedNames.push(selectorToString(selectors[i]));
    }
    return 'findAllNodes was able to match part of the selector:\n' + ("  " + matchedNames.join(' > ') + "\n\n") + 'No matching component was found for:\n' + ("  " + unmatchedNames.join(' > '));
  }
  return null;
}
export function findBoundingRects(hostRoot, selectors) {
  if (!supportsTestSelectors) {
    throw new Error('Test selector API is not supported by this renderer.');
  }
  var instanceRoots = findAllNodes(hostRoot, selectors);
  var boundingRects = [];
  for (var i = 0; i < instanceRoots.length; i++) {
    boundingRects.push(getBoundingRect(instanceRoots[i]));
  }
  for (var _i = boundingRects.length - 1; _i > 0; _i--) {
    var targetRect = boundingRects[_i];
    var targetLeft = targetRect.x;
    var targetRight = targetLeft + targetRect.width;
    var targetTop = targetRect.y;
    var targetBottom = targetTop + targetRect.height;
    for (var j = _i - 1; j >= 0; j--) {
      if (_i !== j) {
        var otherRect = boundingRects[j];
        var otherLeft = otherRect.x;
        var otherRight = otherLeft + otherRect.width;
        var otherTop = otherRect.y;
        var otherBottom = otherTop + otherRect.height; // Merging all rects to the minimums set would be complicated,
        // but we can handle the most common cases:
        // 1. completely overlapping rects
        // 2. adjacent rects that are the same width or height (e.g. items in a list)
        //
        // Even given the above constraints,
        // we still won't end up with the fewest possible rects without doing multiple passes,
        // but it's good enough for this purpose.

        if (targetLeft >= otherLeft && targetTop >= otherTop && targetRight <= otherRight && targetBottom <= otherBottom) {
          // Complete overlapping rects; remove the inner one.
          boundingRects.splice(_i, 1);
          break;
        } else if (targetLeft === otherLeft && targetRect.width === otherRect.width && !(otherBottom < targetTop) && !(otherTop > targetBottom)) {
          // Adjacent vertical rects; merge them.
          if (otherTop > targetTop) {
            otherRect.height += otherTop - targetTop;
            otherRect.y = targetTop;
          }
          if (otherBottom < targetBottom) {
            otherRect.height = targetBottom - otherTop;
          }
          boundingRects.splice(_i, 1);
          break;
        } else if (targetTop === otherTop && targetRect.height === otherRect.height && !(otherRight < targetLeft) && !(otherLeft > targetRight)) {
          // Adjacent horizontal rects; merge them.
          if (otherLeft > targetLeft) {
            otherRect.width += otherLeft - targetLeft;
            otherRect.x = targetLeft;
          }
          if (otherRight < targetRight) {
            otherRect.width = targetRight - otherLeft;
          }
          boundingRects.splice(_i, 1);
          break;
        }
      }
    }
  }
  return boundingRects;
}
export function focusWithin(hostRoot, selectors) {
  if (!supportsTestSelectors) {
    throw new Error('Test selector API is not supported by this renderer.');
  }
  var root = findFiberRootForHostRoot(hostRoot);
  var matchingFibers = findPaths(root, selectors);
  var stack = Array.from(matchingFibers);
  var index = 0;
  while (index < stack.length) {
    var fiber = stack[index++];
    var tag = fiber.tag;
    if (isHiddenSubtree(fiber)) {
      continue;
    }
    if (tag === HostComponent || tag === HostResource || tag === HostSingleton) {
      var node = fiber.stateNode;
      if (setFocusIfFocusable(node)) {
        return true;
      }
    }
    var child = fiber.child;
    while (child !== null) {
      stack.push(child);
      child = child.sibling;
    }
  }
  return false;
}
var commitHooks = [];
export function onCommitRoot() {
  if (supportsTestSelectors) {
    commitHooks.forEach(function (commitHook) {
      return commitHook();
    });
  }
}
export function observeVisibleRects(hostRoot, selectors, callback, options) {
  if (!supportsTestSelectors) {
    throw new Error('Test selector API is not supported by this renderer.');
  }
  var instanceRoots = findAllNodes(hostRoot, selectors);
  var _setupIntersectionObs = setupIntersectionObserver(instanceRoots, callback, options),
    disconnect = _setupIntersectionObs.disconnect,
    observe = _setupIntersectionObs.observe,
    unobserve = _setupIntersectionObs.unobserve; // When React mutates the host environment, we may need to change what we're listening to.

  var commitHook = function () {
    var nextInstanceRoots = findAllNodes(hostRoot, selectors);
    instanceRoots.forEach(function (target) {
      if (nextInstanceRoots.indexOf(target) < 0) {
        unobserve(target);
      }
    });
    nextInstanceRoots.forEach(function (target) {
      if (instanceRoots.indexOf(target) < 0) {
        observe(target);
      }
    });
  };
  commitHooks.push(commitHook);
  return {
    disconnect: function () {
      // Stop listening for React mutations:
      var index = commitHooks.indexOf(commitHook);
      if (index >= 0) {
        commitHooks.splice(index, 1);
      } // Disconnect the host observer:

      disconnect();
    }
  };
}