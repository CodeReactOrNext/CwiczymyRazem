import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCalendar,
  saveCalendarDays,
  saveCalendarPrefs,
} from "../services/calendar.service";
import type {
  CalendarDays,
  CalendarDoc,
  CalendarItem,
  CalendarLinks,
  PlannerPrefs,
} from "../types/calendar.types";
import { addDays, toDateKey } from "../utils/calendarDates";
import { newItemId } from "../utils/calendarItems";
import {
  copySlots,
  diffLinks,
  linkDates,
  linkedSiblings,
  syncLinkedDays,
  unlinkDates,
} from "../utils/linkedDays";

export const calendarQueryKey = (uid: string | null) =>
  ["practice-calendar", uid] as const;

/** Days further back than this drop off the doc on the next write. */
const KEEP_DAYS_BACK = 90;

const EMPTY: CalendarDoc = { days: {}, prefs: null, links: {} };

interface CalendarWrite {
  days: CalendarDays;
  /** The days whose group changed; `null` takes a day out of its group. */
  links?: Record<string, string | null>;
}

const applyLinks = (
  links: CalendarLinks,
  patch: Record<string, string | null> = {},
): CalendarLinks => {
  const next = { ...links };
  Object.entries(patch).forEach(([date, group]) => {
    if (group) next[date] = group;
    else delete next[date];
  });
  return next;
};

/**
 * The player's calendar and their auto-planner settings. Edits are written
 * per day, optimistically, and roll back if the write fails. Every write also
 * prunes the days that fell out of the window, so the doc stays small.
 * An edit to a linked day is copied to the other days of its group.
 */
export const useCalendar = (uid: string | null) => {
  const queryClient = useQueryClient();
  const key = calendarQueryKey(uid);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getCalendar(uid!),
    enabled: !!uid,
  });

  const current = () => queryClient.getQueryData<CalendarDoc>(key) ?? EMPTY;

  const daysMutation = useMutation({
    mutationFn: ({ days, links = {} }: CalendarWrite) => {
      const cutoff = addDays(toDateKey(new Date()), -KEEP_DAYS_BACK);
      const { days: stored, links: storedLinks } = current();
      const prune = Object.keys(stored).filter((date) => date < cutoff);
      const prunedLinks = Object.keys(storedLinks)
        .filter((date) => date < cutoff && !(date in links))
        .map((date) => [date, null] as const);
      return saveCalendarDays(uid!, days, prune, {
        ...Object.fromEntries(prunedLinks),
        ...links,
      });
    },
    onMutate: async ({ days, links }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CalendarDoc>(key);
      const base = previous ?? EMPTY;
      queryClient.setQueryData<CalendarDoc>(key, {
        ...base,
        days: { ...base.days, ...days },
        links: applyLinks(base.links, links),
      });
      return { previous };
    },
    onError: (_error, _write, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });

  const prefsMutation = useMutation({
    mutationFn: (prefs: PlannerPrefs) => saveCalendarPrefs(uid!, prefs),
    onMutate: (prefs) => {
      queryClient.setQueryData<CalendarDoc>(key, { ...current(), prefs });
    },
  });

  // Read from the cache, not the render: quick taps must build on each other.
  const dayItems = (date: string) => current().days[date] ?? [];

  /** Writes days as given; with `nextLinks`, the groups become exactly that. */
  const write = (days: CalendarDays, nextLinks?: CalendarLinks) =>
    daysMutation.mutateAsync({
      days,
      ...(nextLinks && { links: diffLinks(current().links, nextLinks) }),
    });

  /** Writes days and copies each one to the days linked with it. */
  const setDays = (patch: CalendarDays) => {
    const { days, links } = current();
    return write(syncLinkedDays(patch, links, days));
  };

  const updateItem = (
    date: string,
    itemId: string,
    change: Partial<CalendarItem>,
  ) =>
    setDays({
      [date]: dayItems(date).map((item) =>
        item.id === itemId ? { ...item, ...change } : item,
      ),
    });

  return {
    days: query.data?.days ?? {},
    prefs: query.data?.prefs ?? null,
    links: query.data?.links ?? {},
    isLoading: !uid || query.isLoading,
    setDays,
    /** Puts days and groups back exactly as they were — for undo. */
    restore: (days: CalendarDays, links: CalendarLinks) => write(days, links),
    /**
     * Writes what the auto-planner laid out. A linked day it changed now
     * differs from its group, so it leaves the group rather than rewrite it.
     */
    applyPlan: (patch: CalendarDays) => {
      const { days, links } = current();
      const changed = Object.keys(patch).filter(
        (date) =>
          JSON.stringify(patch[date]) !== JSON.stringify(days[date] ?? []),
      );
      return write(patch, unlinkDates(links, changed));
    },
    savePrefs: (prefs: PlannerPrefs) => prefsMutation.mutateAsync(prefs),
    addItem: (date: string, item: CalendarItem) =>
      setDays({ [date]: [...dayItems(date), item] }),
    addItems: (date: string, items: CalendarItem[]) =>
      setDays({ [date]: [...dayItems(date), ...items] }),
    removeItem: (date: string, itemId: string) =>
      setDays({ [date]: dayItems(date).filter((item) => item.id !== itemId) }),
    updateItem,
    toggleDone: (date: string, itemId: string) => {
      const item = dayItems(date).find((candidate) => candidate.id === itemId);
      return updateItem(date, itemId, { done: !item?.done });
    },
    /** Moves a slot to another day, at its end. Moved by hand, it stops being the planner's. */
    moveItem: (from: string, to: string, itemId: string) => {
      const item = dayItems(from).find((candidate) => candidate.id === itemId);
      if (!item || from === to) return Promise.resolve();
      return setDays({
        [from]: dayItems(from).filter((candidate) => candidate.id !== itemId),
        [to]: [...dayItems(to), { ...item, auto: false }],
      });
    },
    markDone: (date: string, itemIds: string[]) =>
      setDays({
        [date]: dayItems(date).map((item) =>
          itemIds.includes(item.id) ? { ...item, done: true } : item,
        ),
      }),
    /**
     * Copies a day onto other days, replacing what was on them. Linked, the
     * group becomes exactly the source and `targets` — a day of it left out
     * keeps its slots but goes its own way. Copied once, each target does.
     * Either way the slots become the player's own, out of the planner's reach.
     */
    duplicateDay: (source: string, targets: string[], link: boolean) => {
      const items = dayItems(source).map((item) => ({ ...item, auto: false }));
      const { days, links } = current();
      const leaving = linkedSiblings(links, source).filter(
        (date) => !targets.includes(date),
      );
      const nextLinks = link
        ? linkDates(unlinkDates(links, leaving), source, targets, newItemId)
        : unlinkDates(links, targets);
      const copies = Object.fromEntries(
        targets.map((date) => [
          date,
          link
            ? // Same ids, so a day already in the group keeps its ticks.
              copySlots(items, days[date] ?? [])
            : items.map((item) => ({ ...item, id: newItemId(), done: false })),
        ]),
      );
      // The source's older group members pick up the slots' new ownership too.
      return write(
        syncLinkedDays({ [source]: items, ...copies }, nextLinks, days),
        nextLinks,
      );
    },
    unlinkDay: (date: string) =>
      write({}, unlinkDates(current().links, [date])),
    /** Clearing a day takes it out of its group, so the rest of the group keeps its plan. */
    clearDays: (dates: string[], onlyAuto: boolean) =>
      write(
        Object.fromEntries(
          dates.map((date) => [
            date,
            dayItems(date).filter(
              (item) => item.done || (onlyAuto && !item.auto),
            ),
          ]),
        ),
        unlinkDates(current().links, dates),
      ),
  };
};
