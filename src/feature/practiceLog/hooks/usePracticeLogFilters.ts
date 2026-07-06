import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";

import type {
  DateRangeKey,
  DurationKey,
  PracticeLogFilters,
  SessionType,
  SortKey,
} from "../types/practiceLog.types";

const DEFAULT_FILTERS: PracticeLogFilters = {
  range: "all",
  date: null,
  type: "all",
  duration: "all",
  sort: "date_desc",
};

const RANGE_VALUES: DateRangeKey[] = ["7d", "30d", "90d", "all"];
const TYPE_VALUES: (SessionType | "all")[] = ["all", "manual", "plan", "song"];
const DURATION_VALUES: DurationKey[] = ["all", "short", "medium", "long"];
const SORT_VALUES: SortKey[] = [
  "date_desc",
  "date_asc",
  "time_desc",
  "points_desc",
];

const pickParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parseEnum = <T extends string>(
  value: string | undefined,
  allowed: T[],
  fallback: T
): T => (value && allowed.includes(value as T) ? (value as T) : fallback);

export const usePracticeLogFilters = () => {
  const router = useRouter();

  const filters = useMemo<PracticeLogFilters>(() => {
    const date = pickParam(router.query.date);
    return {
      range: parseEnum(
        pickParam(router.query.range),
        RANGE_VALUES,
        DEFAULT_FILTERS.range
      ),
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
      type: parseEnum(
        pickParam(router.query.type),
        TYPE_VALUES,
        DEFAULT_FILTERS.type
      ),
      duration: parseEnum(
        pickParam(router.query.duration),
        DURATION_VALUES,
        DEFAULT_FILTERS.duration
      ),
      sort: parseEnum(
        pickParam(router.query.sort),
        SORT_VALUES,
        DEFAULT_FILTERS.sort
      ),
    };
  }, [router.query]);

  const setFilters = useCallback(
    (changes: Partial<PracticeLogFilters>) => {
      const next = { ...filters, ...changes };
      const query: Record<string, string> = {};

      if (next.date) query.date = next.date;
      else if (next.range !== DEFAULT_FILTERS.range) query.range = next.range;
      if (next.type !== DEFAULT_FILTERS.type) query.type = next.type;
      if (next.duration !== DEFAULT_FILTERS.duration)
        query.duration = next.duration;
      if (next.sort !== DEFAULT_FILTERS.sort) query.sort = next.sort;

      router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [filters, router]
  );

  const isFiltered = useMemo(
    () =>
      filters.date !== null ||
      filters.range !== DEFAULT_FILTERS.range ||
      filters.type !== DEFAULT_FILTERS.type ||
      filters.duration !== DEFAULT_FILTERS.duration,
    [filters]
  );

  return { filters, setFilters, isFiltered };
};
