import { enableCreateEventHandleAPI } from '../../shared/ReactFeatureFlags'; // Don't change these values. They're used by React Dev Tools.

export var NoFlags = /*                      */ 0;
export var PerformedWork = /*                */ 1;
export var Placement = /*                    */ 2;
export var DidCapture = /*                   */ 128;
export var Hydrating = /*                    */ 4096; // You can change the rest (and add more).

export var Update = /*                       */ 4;
/* Skipped value:                                 0b000000000000000000000001000; */

export var ChildDeletion = /*                */ 16;
export var ContentReset = /*                 */ 32;
export var Callback = /*                     */ 64;
/* Used by DidCapture:                            0b000000000000000000010000000; */

export var ForceClientRender = /*            */ 256;
export var Ref = /*                          */ 512;
export var Snapshot = /*                     */ 1024;
export var Passive = /*                      */ 2048;
/* Used by Hydrating:                             0b000000000000001000000000000; */

export var Visibility = /*                   */ 8192;
export var StoreConsistency = /*             */ 16384;
export var LifecycleEffectMask =
    Passive | Update | Callback | Ref | Snapshot | StoreConsistency; // Union of all commit flags (flags with the lifetime of a particular commit)

export var HostEffectMask = /*               */ 16383; // These are not really side effects, but we still reuse this field.

export var Incomplete = /*                   */ 32768;
export var ShouldCapture = /*                */ 65536;
export var ForceUpdateForLegacySuspense = /* */ 131072;
export var DidPropagateContext = /*          */ 262144;
export var NeedsPropagation = /*             */ 524288;
export var Forked = /*                       */ 1048576; // Static tags describe aspects of a fiber that are not specific to a render,
// e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
// This enables us to defer more work in the unmount case,
// since we can defer traversing the tree during layout to look for Passive effects,
// and instead rely on the static flag as a signal that there may be cleanup work.

export var RefStatic = /*                    */ 2097152;
export var LayoutStatic = /*                 */ 4194304;
export var PassiveStatic = /*                */ 8388608; // Flag used to identify newly inserted fibers. It isn't reset after commit unlike `Placement`.

export var PlacementDEV = /*                 */ 16777216;
export var MountLayoutDev = /*               */ 33554432;
export var MountPassiveDev = /*              */ 67108864; // Groups of flags that are used in the commit phase to skip over trees that
// don't contain effects, by checking subtreeFlags.

export var BeforeMutationMask =
    // TODO: Remove Update flag from before mutation phase by re-landing Visibility
    // flag logic (see #20043)
    Update |
    Snapshot |
    (enableCreateEventHandleAPI
        ? // createEventHandle needs to visit deleted and hidden trees to
          // fire beforeblur
          // TODO: Only need to visit Deletions during BeforeMutation phase if an
          // element is focused.
          ChildDeletion | Visibility
        : 0);
export var MutationMask =
    Placement |
    Update |
    ChildDeletion |
    ContentReset |
    Ref |
    Hydrating |
    Visibility;
export var LayoutMask = Update | Callback | Ref | Visibility; // TODO: Split into PassiveMountMask and PassiveUnmountMask

export var PassiveMask = Passive | Visibility | ChildDeletion; // Union of tags that don't get reset on clones.
// This allows certain concepts to persist without recalculating them,
// e.g. whether a subtree contains passive effects or portals.

export var StaticMask = LayoutStatic | PassiveStatic | RefStatic;
