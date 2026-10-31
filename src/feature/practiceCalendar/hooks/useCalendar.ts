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
  PlannerPrefs,
} from "../types/calendar.types";
import { addDays, toDateKey } from "../utils/calendarDates";

export const calendarQueryKey = (uid: string | null) =>
  ["practice-calendar", uid] as const;

/** Days further back than this drop off the doc on the next write. */
const KEEP_DAYS_BACK = 90;

/**
 * The player's calendar and their auto-planner settings. Edits are written
 * per day, optimistically, and roll back if the write fails. Every write also
 * prunes the days that fell out of the window, so the doc stays small.
 */
export const useCalendar = (uid: string | null) => {
  const queryClient = useQueryClient();
  const key = calendarQueryKey(uid);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getCalendar(uid!),
    enabled: !!uid,
  });

  const current = () =>
    queryClient.getQueryData<CalendarDoc>(key) ?? { days: {}, prefs: null };

  const daysMutation = useMutation({
    mutationFn: (patch: CalendarDays) => {
      const cutoff = addDays(toDateKey(new Date()), -KEEP_DAYS_BACK);
      const prune = Object.keys(current().days).filter((date) => date < cutoff);
      return saveCalendarDays(uid!, patch, prune);
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CalendarDoc>(key);
      const base = previous ?? { days: {}, prefs: null };
      queryClient.setQueryData<CalendarDoc>(key, {
        ...base,
        days: { ...base.days, ...patch },
      });
      return { previous };
    },
    onError: (_error, _patch, context) => {
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

  const setDays = (patch: CalendarDays) => daysMutation.mutateAsync(patch);

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
    isLoading: !uid || query.isLoading,
    setDays,
    savePrefs: (prefs: PlannerPrefs) => prefsMutation.mutateAsync(prefs),
    addItem: (date: string, item: CalendarItem) =>
      setDays({ [date]: [...dayItems(date), item] }),
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
    clearDays: (dates: string[], onlyAuto: boolean) =>
      setDays(
        Object.fromEntries(
          dates.map((date) => [
            date,
            dayItems(date).filter(
              (item) => item.done || (onlyAuto && !item.auto),
            ),
          ]),
        ),
      ),
  };
};
