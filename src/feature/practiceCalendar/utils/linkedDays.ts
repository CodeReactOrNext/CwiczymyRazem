import type {
  CalendarDays,
  CalendarItem,
  CalendarLinks,
} from "../types/calendar.types";

/** The other days in the group `date` belongs to, oldest first. */
export const linkedSiblings = (links: CalendarLinks, date: string) => {
  const group = links[date];
  if (!group) return [];
  return Object.keys(links)
    .filter((other) => other !== date && links[other] === group)
    .sort();
};

/**
 * A linked day's copy of another day's slots: the same slots with the same
 * ids, but its own ticks — playing Monday's copy doesn't play Thursday's.
 */
export const copySlots = (
  items: CalendarItem[],
  target: CalendarItem[],
): CalendarItem[] => {
  const doneIds = new Set(
    target.filter((item) => item.done).map((item) => item.id),
  );
  return items.map((item) => ({ ...item, done: doneIds.has(item.id) }));
};

const sameSlots = (a: CalendarItem[], b: CalendarItem[]) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Adds to a patch the linked days its edits reach: each day written gets its
 * siblings rewritten to match it. Siblings already in the patch are left as
 * the patch has them — when two days of a group are written at once, the
 * first one leads — and ones that would come out the same are not written.
 */
export const syncLinkedDays = (
  patch: CalendarDays,
  links: CalendarLinks,
  days: CalendarDays,
): CalendarDays => {
  const synced: CalendarDays = { ...patch };
  const reached = new Set<string>();
  Object.entries(patch).forEach(([date, items]) => {
    linkedSiblings(links, date).forEach((sibling) => {
      if (sibling in patch || reached.has(sibling)) return;
      reached.add(sibling);
      const current = days[sibling] ?? [];
      const next = copySlots(items, current);
      if (!sameSlots(next, current)) synced[sibling] = next;
    });
  });
  return synced;
};

/** A group of one is no link at all. */
const dropLoneDays = (links: CalendarLinks): CalendarLinks => {
  const sizes = new Map<string, number>();
  Object.values(links).forEach((group) =>
    sizes.set(group, (sizes.get(group) ?? 0) + 1),
  );
  return Object.fromEntries(
    Object.entries(links).filter(([, group]) => (sizes.get(group) ?? 0) > 1),
  );
};

/** Takes days out of their groups; a group left with one day dissolves. */
export const unlinkDates = (
  links: CalendarLinks,
  dates: string[],
): CalendarLinks =>
  dropLoneDays(
    Object.fromEntries(
      Object.entries(links).filter(([date]) => !dates.includes(date)),
    ),
  );

/**
 * Puts `targets` in the group of `source` (opening one when it has none).
 * Targets leave whatever group they were in before.
 */
export const linkDates = (
  links: CalendarLinks,
  source: string,
  targets: string[],
  newGroupId: () => string,
): CalendarLinks => {
  const group = links[source] ?? newGroupId();
  const rest = Object.fromEntries(
    Object.entries(links).filter(([date]) => !targets.includes(date)),
  );
  return dropLoneDays({
    ...rest,
    [source]: group,
    ...Object.fromEntries(targets.map((date) => [date, group])),
  });
};

/** What to write to turn `before` into `after`: changed days, `null` for dropped ones. */
export const diffLinks = (
  before: CalendarLinks,
  after: CalendarLinks,
): Record<string, string | null> => ({
  ...Object.fromEntries(
    Object.keys(before)
      .filter((date) => !(date in after))
      .map((date) => [date, null]),
  ),
  ...Object.fromEntries(
    Object.entries(after).filter(([date, group]) => before[date] !== group),
  ),
});
