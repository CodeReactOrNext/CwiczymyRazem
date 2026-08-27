import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * A set of exercises that are one drill with different settings — the 34
 * Strumming patterns, the 24 finger permutations, the fretboard hunts per
 * string. They all carry identical category/difficulty/skill metadata, so no
 * filter can ever tell them apart; the browse list groups them instead.
 *
 * Derived from the title rather than stored on the exercise, so adding a
 * variant needs no extra field: "Strumming 12 — Starts on Up" and
 * "Strumming — Funk 16ths" both land in the "Strumming" set. Exercises whose
 * titles don't follow the "Family — Variant" shape are their own set of one.
 */
export interface ExerciseFamily {
  /** Stable slug, used as a React key and for remembering what is expanded. */
  id: string;
  /** Player-facing set name. */
  title: string;
}

/**
 * Exercises whose titles the rule below can't group correctly. Keyed by
 * exercise id so a title tweak can't silently move an exercise between sets.
 */
const FAMILY_OVERRIDES: Record<string, string> = {
  // "Pentatonic Box 1 — Up and Down" would otherwise become a "Pentatonic Box"
  // set of one, sitting next to "Pentatonic — String Crossing".
  pentatonic_box1_up_down: "Pentatonic",
  pentatonic_string_crossing_3: "Pentatonic",
  // No separator in the title, but it is the same chord-building drill.
  build_the_chord: "Chords",
  // "Fretboard — Move the Melody" would name a set of one "Fretboard", which
  // collides with the Fretboard practice mode.
  fretboard_mastery: "Move the Melody",
};

/**
 * Variant labels the title rule can't produce, for exercises moved between sets
 * by FAMILY_OVERRIDES — without this "Pentatonic Box 1 — Up and Down" would sit
 * under Pentatonic labelled just "1 — Up and Down".
 */
const VARIANT_OVERRIDES: Record<string, string> = {
  pentatonic_box1_up_down: "Box 1 — Up and Down",
  build_the_chord: "Build the Chord",
};

/** Titles that end in a variant number: "Strumming 12", "Spider 3". */
const TRAILING_INDEX = /\s+\d+$/;

/** Em dash, en dash or a spaced hyphen — the library uses all three. */
const VARIANT_SEPARATOR = /\s+[—–-]\s+/;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const exerciseTitle = (exercise: Pick<Exercise, "id" | "title">): string =>
  typeof exercise.title === "string" ? exercise.title : exercise.id;

export const getExerciseFamily = (
  exercise: Pick<Exercise, "id" | "title">
): ExerciseFamily => {
  const override = FAMILY_OVERRIDES[exercise.id];
  if (override) return { id: slugify(override), title: override };

  const title = exerciseTitle(exercise);
  const [head] = title.split(VARIANT_SEPARATOR);

  // No separator means the whole title is the name — a set of one.
  const name = (head === title ? title : head.replace(TRAILING_INDEX, "")).trim();

  return { id: slugify(name), title: name };
};

/**
 * The variant label shown inside an expanded set: the part of the title that
 * actually differs. Falls back to the full title for sets of one, so a row is
 * never blank.
 */
export const getVariantLabel = (
  exercise: Pick<Exercise, "id" | "title">
): string => {
  const override = VARIANT_OVERRIDES[exercise.id];
  if (override) return override;

  const title = exerciseTitle(exercise);
  const parts = title.split(VARIANT_SEPARATOR);
  if (parts.length < 2) return title;

  // "Strumming 12 — Starts on Up" keeps its number: it is how players refer to
  // the pattern, and without it the labels collide.
  const index = parts[0].match(TRAILING_INDEX)?.[0].trim();
  const variant = parts.slice(1).join(" — ");
  return index ? `${index} — ${variant}` : variant;
};
