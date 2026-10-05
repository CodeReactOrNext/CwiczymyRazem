import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/** What `LessonPracticeModal` puts before a lesson's title in the session's report title. */
export const LESSON_TITLE_PREFIX = "Lesson: ";

/** Well past any routine's length — keeps one log doc a sane size whatever the client sends. */
const MAX_LOGGED_EXERCISES = 30;
const MAX_EXERCISE_ID_LENGTH = 100;
const YOUTUBE_VIDEO_ID = /^[\w-]{11}$/;

/**
 * The exercises a session ran, as the client reported them. Order and repeats are kept — a routine
 * may run the same exercise twice — but anything that isn't a short string is dropped.
 */
export const sanitizeLoggedExerciseIds = (
  value: unknown,
): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const ids = value
    .filter(
      (id): id is string =>
        typeof id === "string" &&
        id.length > 0 &&
        id.length <= MAX_EXERCISE_ID_LENGTH,
    )
    .slice(0, MAX_LOGGED_EXERCISES);

  return ids.length > 0 ? ids : undefined;
};

/** A lesson's YouTube id, or `undefined` for anything that isn't shaped like one. */
export const sanitizeLessonVideoId = (value: unknown): string | undefined =>
  typeof value === "string" && YOUTUBE_VIDEO_ID.test(value) ? value : undefined;

/** The lesson's own title when a session's title names one, otherwise `null`. */
export const getLessonTitle = (
  sessionTitle: string | undefined,
): string | null => {
  if (!sessionTitle?.startsWith(LESSON_TITLE_PREFIX)) return null;

  return sessionTitle.slice(LESSON_TITLE_PREFIX.length).trim() || null;
};

/**
 * The catalog exercises a log names, in the order the session ran them. Ids the catalog doesn't
 * know — a player's own custom exercises, drills generated on the fly, songs placed in a routine —
 * are dropped, since there is nothing to open for them.
 */
export const resolveLoggedExercises = (
  ids: string[] | undefined,
  catalog: ReadonlyMap<string, Exercise>,
): Exercise[] =>
  (ids ?? []).flatMap((id) => {
    const exercise = catalog.get(id);
    return exercise ? [exercise] : [];
  });
