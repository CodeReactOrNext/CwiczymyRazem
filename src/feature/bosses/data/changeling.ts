import type { BossDefinition, ChangesMode } from "../types/boss.types";

/**
 * The changeling. One endless fight like the others, but nothing to read:
 * every phase it takes on a new progression and becomes each chord in turn,
 * and the player solos over it — a note of the chord sounding wounds it, a
 * note from outside the key wounds the player.
 */
export const CHANGELING: BossDefinition = {
  id: "changeling",
  name: "The Changeling",
  title: "Wears every chord it hears",
  drill: "changes",
};

/**
 * Keys a guitarist meets every day, per mode — the open strings ring in
 * them and the shapes sit low on the neck. Tonics as pitch classes, C = 0.
 */
export const CHANGES_TONICS: Readonly<Record<ChangesMode, readonly number[]>> = {
  // C, G, D, A, E, F
  ionian: [0, 7, 2, 9, 4, 5],
  // A, E, D, B, G, C
  aeolian: [9, 4, 2, 11, 7, 0],
  // A, E, D
  dorian: [9, 4, 2],
  // G, A, D, E
  mixolydian: [7, 9, 2, 4],
  // A, E, D
  harmonicMinor: [9, 4, 2],
  // A, E, G
  blues: [9, 4, 7],
};
