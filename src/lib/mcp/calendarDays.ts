import type {
  CalendarItem,
  CalendarSongRef,
} from "feature/practiceCalendar/types/calendar.types";
import {
  addDays,
  fromDateKey,
  toDateKey,
} from "feature/practiceCalendar/utils/calendarDates";

/** How far back and ahead the assistant may write — the app drops days older than 90. */
export const CALENDAR_DAYS_BACK = 14;
export const CALENDAR_DAYS_AHEAD = 120;

/** A slot the tool already resolved against the catalog and the player's songs. */
export type SlotDraft = Omit<CalendarItem, "id" | "auto" | "done">;

export type SlotPlan =
  | { type: "new"; draft: SlotDraft }
  /** Leave a slot already on that day in place — the only way to keep goal and roadmap slots. */
  | { type: "keep"; slotId: string; minutes?: number };

/** A real "YYYY-MM-DD" day, not just one shaped like it. */
export const isRealDateKey = (key: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(key) && toDateKey(fromDateKey(key)) === key;

/** Why a day can't be written, or null when it can. */
export const dateProblem = (date: string, today: string): string | null => {
  if (!isRealDateKey(date)) return `"${date}" isn't a date — use YYYY-MM-DD.`;
  if (date < addDays(today, -CALENDAR_DAYS_BACK))
    return `${date} is more than ${CALENDAR_DAYS_BACK} days ago.`;
  if (date > addDays(today, CALENDAR_DAYS_AHEAD))
    return `${date} is more than ${CALENDAR_DAYS_AHEAD} days ahead.`;
  return null;
};

/** What a slot plays, so a re-planned day can tell a slot it already had. */
const slotKey = (item: Pick<CalendarItem, "kind" | "exerciseId" | "title">) =>
  `${item.kind}:${item.exerciseId ?? ""}:${item.title ?? ""}`;

const songKey = (song: CalendarSongRef | undefined) => song?.id ?? "";

const sameSlot = (a: SlotDraft, b: CalendarItem) =>
  a.kind === b.kind &&
  (a.kind === "song"
    ? songKey(a.song) === songKey(b.song)
    : slotKey(a) === slotKey(b));

/**
 * A day's new slots, in the order asked. A new slot playing the same thing
 * as one already on the day takes over its id and tick, so re-planning a day
 * doesn't untick what was already played. Everything written here is the
 * player's own (approved through their assistant), out of the auto-planner's reach.
 */
export const buildDaySlots = (
  existing: CalendarItem[],
  plan: SlotPlan[],
  newId: () => string,
): { items: CalendarItem[] } | { error: string } => {
  const kept = new Set(
    plan.flatMap((slot) => (slot.type === "keep" ? [slot.slotId] : [])),
  );
  if (kept.size !== plan.filter((slot) => slot.type === "keep").length) {
    return { error: "The same slotId is kept twice." };
  }
  const free = existing.filter((item) => !kept.has(item.id));

  const items: CalendarItem[] = [];
  for (const slot of plan) {
    if (slot.type === "keep") {
      const item = existing.find((candidate) => candidate.id === slot.slotId);
      if (!item) {
        return { error: `No slot "${slot.slotId}" on that day.` };
      }
      items.push({ ...item, minutes: slot.minutes ?? item.minutes });
      continue;
    }
    const matchIndex = free.findIndex((item) => sameSlot(slot.draft, item));
    const match = matchIndex >= 0 ? free.splice(matchIndex, 1)[0] : null;
    items.push({
      ...slot.draft,
      id: match?.id ?? newId(),
      auto: false,
      done: match?.done ?? false,
    });
  }
  return { items };
};
