import type {
  Exercise,
  ExercisePlan,
  SongPracticeMode,
} from "feature/exercisePlan/types/exercise.types";
import { songToExercise } from "feature/exercisePlan/utils/songToExercise";
import type { LastPracticedMap } from "feature/rotation/types/rotation.types";

import type { CalendarItem, PracticeArea } from "../types/calendar.types";
import { toDateKey } from "./calendarDates";

/** Plan-item id of a slot that plays no catalog exercise (a custom slot, a roadmap step with nothing linked). */
export const CALENDAR_EXERCISE_PREFIX = "calendar-";

export const newItemId = () =>
  `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const sumMinutes = (items: Pick<CalendarItem, "minutes">[]) =>
  items.reduce((sum, item) => sum + item.minutes, 0);

/**
 * Whether a slot counts as played: ticked off by hand or by a session started
 * from the calendar — or, for a slot of a past or present day, played that
 * day anywhere in the app, going by the stamps the report leaves.
 */
export const isItemDone = (
  item: CalendarItem,
  date: string,
  lastPracticed: LastPracticedMap | null,
) => {
  if (item.done) return true;
  if (!lastPracticed) return false;
  const stamp = item.song
    ? lastPracticed.song[item.song.id]
    : item.exerciseId
      ? lastPracticed.exercise[item.exerciseId]
      : undefined;
  return typeof stamp === "number" && toDateKey(new Date(stamp)) === date;
};

/**
 * How a song is practised when nobody picked: an attached tab was attached on
 * purpose, so it wins (as in routines); without one only the section map can
 * be played.
 */
export const defaultSongMode = (hasGpFile: boolean): SongPracticeMode =>
  hasGpFile ? "gp" : "sections";

const textSlot = (item: CalendarItem, area: PracticeArea): Exercise => ({
  id: `${CALENDAR_EXERCISE_PREFIX}${item.id}`,
  title: item.title ?? "",
  description: item.note ?? "",
  difficulty: "medium",
  category: area === "songs" ? "technique" : area,
  timeInMinutes: item.minutes,
  instructions: item.note ? [item.note] : [],
  tips: [],
  metronomeSpeed: null,
  relatedSkills: [],
});

/**
 * Turns a day's slots into one practice session, in their order and at their
 * lengths. A goal slot opens with the metronome at the goal's milestone; a
 * slot that no longer resolves (an exercise gone from the catalog) is left out.
 * Song slots saved before the tab / section map choice get the default mode,
 * going by the songs the player attached a tab to.
 */
export const buildDayPlan = (
  date: string,
  items: CalendarItem[],
  catalog: ReadonlyMap<string, Exercise>,
  gpSongIds: ReadonlySet<string> = new Set(),
): ExercisePlan | null => {
  const exercises: Exercise[] = [];
  const used = new Set<string>();

  items.forEach((item) => {
    let exercise: Exercise | null = null;
    if (item.song && (item.kind === "song" || item.kind === "roadmap")) {
      exercise = songToExercise(
        item.song,
        item.minutes,
        item.songMode ?? defaultSongMode(gpSongIds.has(item.song.id)),
      );
    } else if (item.exerciseId && catalog.has(item.exerciseId)) {
      const base = catalog.get(item.exerciseId)!;
      exercise = {
        ...base,
        timeInMinutes: item.minutes,
        ...(item.kind === "goal" &&
          item.bpm &&
          base.metronomeSpeed && {
            metronomeSpeed: { ...base.metronomeSpeed, recommended: item.bpm },
          }),
      };
    } else if (item.kind === "custom" || item.kind === "roadmap") {
      exercise = textSlot(item, item.area);
    }
    if (!exercise || used.has(exercise.id)) return;
    used.add(exercise.id);
    exercises.push(exercise);
  });

  if (exercises.length === 0) return null;
  return {
    id: `calendar-${date}`,
    title: "Calendar",
    description: "",
    difficulty: "medium",
    category: "mixed",
    exercises,
    userId: "system",
    image: null,
  };
};

/** Where a slot's own page lives — the goal's panel, the roadmap step. */
export const itemHref = (item: CalendarItem) => {
  if (item.kind === "goal" && item.goalId)
    return `/practice/goal/${item.goalId}`;
  if (item.kind === "roadmap" && item.roadmapId)
    return `/ai-coach?roadmapId=${item.roadmapId}${item.stepId ? `&step=${item.stepId}` : ""}`;
  return null;
};
