import { deleteField, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type {
  CalendarDays,
  CalendarDoc,
  CalendarItem,
  PlannerPrefs,
  PracticeArea,
} from "../types/calendar.types";
import { PLAYER_LEVELS, PRACTICE_AREAS } from "../types/calendar.types";
import { parseDays, parseLinks } from "../utils/calendarParse";
import { DEFAULT_PLANNER_PREFS } from "../utils/planner";

/** Owner-only like the rest of `settings` — the plan pays nothing out, so the client writes it. */
const calendarRef = (uid: string) =>
  doc(db, "users", uid, "settings", "calendar");

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
  return {
    days: parseDays(data.days),
    prefs: parsePrefs(data.prefs),
    links: parseLinks(data.links),
  };
};

/** Firestore rejects `undefined`, so optional fields are only written when set. */
const toStored = (item: CalendarItem) =>
  Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined),
  );

/**
 * Writes the given days and drops the ones in `prune` — old days fall off the
 * doc so it never grows past what the calendar shows. Days not named are left
 * alone by the merge. `links` names the days whose group changed; `null`
 * takes a day out of its group.
 */
export const saveCalendarDays = (
  uid: string,
  days: CalendarDays,
  prune: string[] = [],
  links: Record<string, string | null> = {},
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
      ...(Object.keys(links).length > 0 && {
        links: Object.fromEntries(
          Object.entries(links).map(([key, group]) => [
            key,
            group ?? deleteField(),
          ]),
        ),
      }),
    },
    { merge: true },
  );

export const saveCalendarPrefs = (uid: string, prefs: PlannerPrefs) =>
  setDoc(calendarRef(uid), { prefs }, { merge: true });
