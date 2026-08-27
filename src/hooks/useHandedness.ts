import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HandednessState {
  /** Player holds the guitar the other way round — every neck diagram mirrors. */
  leftHanded: boolean;
  setLeftHanded: (next: boolean) => void;
}

/**
 * Handedness of the player, persisted per device.
 *
 * Kept outside the tablature settings on purpose: it is a property of the person,
 * not of one viewer, and it drives every fretboard/chord diagram the app draws
 * rather than the tab renderer.
 */
export const useHandednessStore = create<HandednessState>()(
  persist(
    (set) => ({
      leftHanded: false,
      setLeftHanded: (leftHanded) => set({ leftHanded }),
    }),
    {
      name: "riffquest-handedness",
      version: 1,
      partialize: ({ leftHanded }) => ({ leftHanded }),
    },
  ),
);

const subscribeHandedness = (onChange: () => void) =>
  useHandednessStore.subscribe(onChange);

const getHandednessSnapshot = () => useHandednessStore.getState().leftHanded;

/** The server has no idea which hand this player uses — it renders right-handed. */
const getServerHandednessSnapshot = () => false;

/**
 * Whether diagrams should be drawn mirrored. Right-handed through hydration so
 * the markup React renders on the server matches the one it hydrates, then
 * flipped from the stored preference on the render straight after.
 */
export function useIsLeftHanded(): boolean {
  return useSyncExternalStore(
    subscribeHandedness,
    getHandednessSnapshot,
    getServerHandednessSnapshot,
  );
}

/**
 * CSS transform that mirrors a whole diagram about its vertical centre line —
 * the nut moves to the right and the frets run right-to-left, which is what a
 * left-handed player sees looking down at their own neck. Strings keep their
 * rows: only the fret axis is handed.
 *
 * Applied to the `<svg>` element itself rather than to an inner `<g>`, so hit
 * testing, sizing and the existing coordinate maths all stay untouched.
 */
export function mirrorStyle(leftHanded: boolean): "scaleX(-1)" | undefined {
  return leftHanded ? "scaleX(-1)" : undefined;
}

/**
 * Counter-transform for anything inside a mirrored diagram that must not read
 * backwards (labels, fret numbers, tooltips).
 *
 * `translate(2x) scale(-1 1)` composed with the outer mirror is a pure
 * translation, so the content draws in its normal orientation while its anchor
 * — and, for content laid out symmetrically around `anchorX`, its whole box —
 * still lands on the mirrored position.
 */
export function uprightTransform(
  anchorX: number,
  leftHanded: boolean,
): string | undefined {
  return leftHanded ? `translate(${2 * anchorX} 0) scale(-1 1)` : undefined;
}

/** Where an x coordinate ends up once a diagram `width` wide is mirrored. */
export function mirroredX(x: number, width: number, leftHanded: boolean): number {
  return leftHanded ? width - x : x;
}
