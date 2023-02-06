import { error as _consoleError } from '../../shared/consoleWithStackDev';
import {
    getChildHostContext,
    getRootHostContext,
} from '../../react-dom-bindings/src/client/ReactDOMHostConfig';
import { createCursor, push, pop } from './ReactFiberStack';
var contextStackCursor = createCursor(null);
var contextFiberStackCursor = createCursor(null);
var rootInstanceStackCursor = createCursor(null);
function requiredContext(c) {
    return c;
}
function getCurrentRootHostContainer() {
    return rootInstanceStackCursor.current;
}
function getRootHostContainer() {
    var rootInstance = requiredContext(rootInstanceStackCursor.current);
    return rootInstance;
}
function pushHostContainer(fiber, nextRootInstance) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, fiber); // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.

    push(contextFiberStackCursor, fiber, fiber); // Finally, we need to push the host context to the stack.
    // However, we can't just call getRootHostContext() and push it because
    // we'd have a different number of entries on the stack depending on
    // whether getRootHostContext() throws somewhere in renderer code or not.
    // So we push an empty value first. This lets us safely unwind on errors.

    push(contextStackCursor, null, fiber);
    var nextRootContext = getRootHostContext(nextRootInstance); // Now that we know this function doesn't throw, replace it.

    pop(contextStackCursor, fiber);
    push(contextStackCursor, nextRootContext, fiber);
}
function popHostContainer(fiber) {
    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
    pop(rootInstanceStackCursor, fiber);
}
function getHostContext() {
    var context = requiredContext(contextStackCursor.current);
    return context;
}
function pushHostContext(fiber) {
    var context = requiredContext(contextStackCursor.current);
    var nextContext = getChildHostContext(context, fiber.type); // Don't push this Fiber's context unless it's unique.

    if (context === nextContext) {
        return;
    } // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.

    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextContext, fiber);
}
function popHostContext(fiber) {
    // Do not pop unless this Fiber provided the current context.
    // pushHostContext() only pushes Fibers that provide unique contexts.
    if (contextFiberStackCursor.current !== fiber) {
        return;
    }
    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
}
export {
    getHostContext,
    getCurrentRootHostContainer,
    getRootHostContainer,
    popHostContainer,
    popHostContext,
    pushHostContainer,
    pushHostContext,
};
