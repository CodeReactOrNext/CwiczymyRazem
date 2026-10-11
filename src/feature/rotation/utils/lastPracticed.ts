import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import type { LastPracticedMap } from "../types/rotation.types";

const MAX_ID_LENGTH = 100;
const MAX_IDS_PER_TYPE = 30;
/** Played for at least this long before a song counts as played — the same bar an exercise has. */
export const MIN_SONG_PRACTICE_MS = 20_000;

/** Plan-item id of a timed custom rotation item; what follows is the item's own id. */
export const CUSTOM_EXERCISE_PREFIX = "rotation-custom-";

/** Firestore reserves `__name__`-shaped field names, so they can't be map keys. */
const RESERVED_FIELD = /^__.*__$/;

const cleanIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const ids = value.filter(
    (id): id is string =>
      typeof id === "string" &&
      id.length > 0 &&
      id.length <= MAX_ID_LENGTH &&
      !RESERVED_FIELD.test(id),
  );
  return [...new Set(ids)].slice(0, MAX_IDS_PER_TYPE);
};

export interface PracticedPayload {
  exerciseIds: string[];
  skillIds: string[];
  /** Custom rotation items, by their own id. */
  customIds?: string[];
}

/**
 * The report's `practiced` field: the exercises the session played for the
 * 20 s that count as practised (`completedIndexes`) and the skills they train.
 * Song items are left out — their time reaches the report as `songs`. Custom
 * rotation items come back as `customIds`, by their own id. Spread into the
 * report; empty when nothing qualifies.
 */
export const collectPracticed = (
  exercises: Pick<Exercise, "id" | "relatedSkills" | "songData">[],
  completedIndexes: number[],
): { practiced?: PracticedPayload } => {
  const played = exercises.filter(
    (exercise, index) => !exercise.songData && completedIndexes.includes(index),
  );
  if (played.length === 0) return {};

  const isCustom = (id: string) => id.startsWith(CUSTOM_EXERCISE_PREFIX);
  const ids = [...new Set(played.map((exercise) => exercise.id))];
  const customIds = ids
    .filter(isCustom)
    .map((id) => id.slice(CUSTOM_EXERCISE_PREFIX.length));

  return {
    practiced: {
      exerciseIds: ids.filter((id) => !isCustom(id)),
      skillIds: [
        ...new Set(played.flatMap((exercise) => exercise.relatedSkills ?? [])),
      ],
      ...(customIds.length > 0 && { customIds }),
    },
  };
};

interface PracticedInput {
  /** Single-song sessions and manual logs name their song here. */
  songId?: unknown;
  /** A routine's per-song breakdown, as sanitized by the report route. */
  songs?: { songId: string; practiceMs: number }[];
  /** `inputData.practiced` — see `PracticedPayload`. */
  practiced?: unknown;
}

/**
 * The "last played" stamps one session report leaves behind, as a nested
 * update for `users/{uid}/settings/rotation`. Nested rather than dotted keys:
 * it goes out through `set(..., { merge: true })`, which merges maps field by
 * field and would take a dotted key literally. `null` when nothing was played.
 *
 * Client-reported, like the rest of the session — nothing is paid out on it.
 */
export const buildLastPracticedUpdate = (
  input: PracticedInput,
  now: number,
): { lastPracticed: Partial<LastPracticedMap> } | null => {
  const songIds =
    input.songs && input.songs.length > 0
      ? input.songs
          .filter((song) => song.practiceMs >= MIN_SONG_PRACTICE_MS)
          .map((song) => song.songId)
      : [input.songId];

  const practiced =
    input.practiced && typeof input.practiced === "object"
      ? (input.practiced as Record<string, unknown>)
      : {};

  const byType = {
    song: cleanIds(songIds),
    exercise: cleanIds(practiced.exerciseIds),
    skill: cleanIds(practiced.skillIds),
    custom: cleanIds(practiced.customIds),
  };

  const lastPracticed: Partial<LastPracticedMap> = {};
  (Object.keys(byType) as (keyof typeof byType)[]).forEach((type) => {
    if (byType[type].length === 0) return;
    lastPracticed[type] = Object.fromEntries(
      byType[type].map((id) => [id, now]),
    );
  });

  return Object.keys(lastPracticed).length > 0 ? { lastPracticed } : null;
};
