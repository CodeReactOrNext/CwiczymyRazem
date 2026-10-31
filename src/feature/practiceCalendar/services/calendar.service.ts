import { deleteField, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type {
  CalendarDays,
  CalendarDoc,
  CalendarItem,
  CalendarItemKind,
  PlannerPrefs,
  PracticeArea,
} from "../types/calendar.types";
import { PLAYER_LEVELS, PRACTICE_AREAS } from "../types/calendar.types";
import { DEFAULT_PLANNER_PREFS } from "../utils/planner";

/** Owner-only like the rest of `settings` — the plan pays nothing out, so the client writes it. */
const calendarRef = (uid: string) =>
  doc(db, "users", uid, "settings", "calendar");

const KINDS: CalendarItemKind[] = [
  "exercise",
  "song",
  "goal",
  "roadmap",
  "custom",
];
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const str = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;

const parseItem = (raw: unknown): CalendarItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const kind = KINDS.find((candidate) => candidate === data.kind);
  const area = PRACTICE_AREAS.find((candidate) => candidate === data.area);
  if (!kind || !area || typeof data.id !== "string") return null;
  if (typeof data.minutes !== "number" || data.minutes <= 0) return null;

  const song = data.song as Record<string, unknown> | undefined;
  return {
    id: data.id,
    kind,
    area,
    minutes: Math.round(data.minutes),
    role: data.role === "warmup" ? "warmup" : "main",
    auto: data.auto === true,
    done: data.done === true,
    ...(str(data.exerciseId) && { exerciseId: str(data.exerciseId) }),
    ...(song &&
      str(song.id) && {
        song: {
          id: song.id as string,
          title: str(song.title) ?? "",
          artist: str(song.artist) ?? "",
          ...(str(song.coverUrl) && { coverUrl: str(song.coverUrl) }),
        },
      }),
    ...(str(data.goalId) && { goalId: str(data.goalId) }),
    ...(typeof data.bpm === "number" && { bpm: data.bpm }),
    ...(str(data.roadmapId) && { roadmapId: str(data.roadmapId) }),
    ...(str(data.stepId) && { stepId: str(data.stepId) }),
    ...(str(data.title) && { title: str(data.title) }),
    ...(str(data.note) && { note: str(data.note) }),
  };
};

const parseDays = (raw: unknown): CalendarDays => {
  const days: CalendarDays = {};
  if (!raw || typeof raw !== "object") return days;
  Object.entries(raw as Record<string, unknown>).forEach(([key, items]) => {
    if (!DATE_KEY.test(key) || !Array.isArray(items)) return;
    days[key] = items
      .map(parseItem)
      .filter((item): item is CalendarItem => item !== null);
  });
  return days;
};

const parsePrefs = (raw: unknown): PlannerPrefs | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<PlannerPrefs>;
  const sources = (data.sources ?? {}) as Partial<PlannerPrefs["sources"]>;
  return {
    ...DEFAULT_PLANNER_PREFS,
    ...(typeof data.minutesPerDay === "number" && {
      minutesPerDay: data.minutesPerDay,
    }),
    ...(PLAYER_LEVELS.includes(data.level as PlannerPrefs["level"]) && {
      level: data.level as PlannerPrefs["level"],
    }),
    focus: Array.isArray(data.focus)
      ? data.focus.filter((area): area is PracticeArea =>
          PRACTICE_AREAS.includes(area),
        )
      : [],
    sources: {
      songs: sources.songs !== false,
      goals: sources.goals !== false,
      roadmaps: sources.roadmaps !== false,
    },
    minutesByWeekday:
      data.minutesByWeekday && typeof data.minutesByWeekday === "object"
        ? data.minutesByWeekday
        : {},
    warmup: data.warmup !== false,
    ...(["steady", "balanced", "explore"].includes(data.variety as string) && {
      variety: data.variety as PlannerPrefs["variety"],
    }),
    ...(["light", "steady", "push"].includes(data.intensity as string) && {
      intensity: data.intensity as PlannerPrefs["intensity"],
    }),
    ...(typeof data.maxItemsPerDay === "number" && {
      maxItemsPerDay: data.maxItemsPerDay,
    }),
    lightDay: data.lightDay === true,
    keepManual: data.keepManual !== false,
    skills: Array.isArray(data.skills)
      ? data.skills.filter(
          (skill): skill is string => typeof skill === "string",
        )
      : [],
  };
};

export const getCalendar = async (uid: string): Promise<CalendarDoc> => {
  const snap = await getDoc(calendarRef(uid));
  const data = snap.exists() ? snap.data() : {};
  return { days: parseDays(data.days), prefs: parsePrefs(data.prefs) };
};

/** Firestore rejects `undefined`, so optional fields are only written when set. */
const toStored = (item: CalendarItem) =>
  Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined),
  );

/**
 * Writes the given days and drops the ones in `prune` — old days fall off the
 * doc so it never grows past what the calendar shows. Days not named are left
 * alone by the merge.
 */
export const saveCalendarDays = (
  uid: string,
  days: CalendarDays,
  prune: string[] = [],
) =>
  setDoc(
    calendarRef(uid),
    {
      days: {
        ...Object.fromEntries(
          Object.entries(days).map(([key, items]) => [
            key,
            items.map(toStored),
          ]),
        ),
        ...Object.fromEntries(prune.map((key) => [key, deleteField()])),
      },
    },
    { merge: true },
  );

export const saveCalendarPrefs = (uid: string, prefs: PlannerPrefs) =>
  setDoc(calendarRef(uid), { prefs }, { merge: true });
