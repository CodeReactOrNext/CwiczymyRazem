import { isAtLeast } from "feature/arsenal/utils/pity";
import { type ChimeNote, playChime } from "lib/uiSounds/uiSounds";

import type { GuitarRarity } from "../types/arsenal.types";

/**
 * The case opening's sounds, in the app's own synthesised voice (`playChime`),
 * so they follow the same on/off switch as every other UI cue. None of them
 * goes through `playUiSound`: its dedupe window would swallow all but the first
 * tick of a spinning reel.
 */

/** C5 E5 G5 C6 E6 G6: a major arpeggio that climbs further for a better pull. */
const REVEAL_NOTES = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];

const revealSteps = (rarity: GuitarRarity): number =>
  isAtLeast(rarity, "Mythic")
    ? 6
    : isAtLeast(rarity, "Legendary")
      ? 5
      : isAtLeast(rarity, "Epic")
        ? 4
        : isAtLeast(rarity, "Rare")
          ? 3
          : 2;

/** The notes of the reveal chime, for a rarity. The last one rings longest. */
export const revealNotes = (rarity: GuitarRarity): ChimeNote[] => {
  const steps = revealSteps(rarity);
  return REVEAL_NOTES.slice(0, steps).map((freq, i) => ({
    freq,
    at: i * 0.085,
    length: i === steps - 1 ? 0.9 : 0.4,
  }));
};

export const caseSounds = {
  /** An item passing the pointer: a short, high click. */
  tick: () => playChime([{ freq: 1760, at: 0, length: 0.035 }], 0.025),
  /** The case being shaken; `n` raises it a little each time. */
  knock: (n = 0) => playChime([{ freq: 130 + n * 30, at: 0, length: 0.16 }], 0.18),
  /** The drum running into its stop. */
  land: () => playChime([{ freq: 180, at: 0, length: 0.2 }], 0.16),
  reveal: (rarity: GuitarRarity) => playChime(revealNotes(rarity), 0.07),
};
