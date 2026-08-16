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
  from: null,
  to: null,
  type: "all",
  duration: "all",
  sort: "date_desc",
};

const RANGE_VALUES: DateRangeKey[] = ["7d", "30d", "90d", "all", "custom"];
const TYPE_VALUES: (SessionType | "all")[] = ["all", "manual", "plan", "song"];
const DURATION_VALUES: DurationKey[] = ["all", "short", "medium", "long"];
const SORT_VALUES: SortKey[] = [
  "date_desc",
  "date_asc",
  "time_desc",
  "points_desc",
];

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pickParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parseEnum = <T extends string>(
  value: string | undefined,
  allowed: T[],
  fallback: T,
): T => (value && allowed.includes(value as T) ? (value as T) : fallback);

const parseDateKey = (value: string | undefined): string | null =>
  value && DATE_KEY_PATTERN.test(value) ? value : null;

/**
 * Reconciles the range preset with the custom bounds so the two can never
 * disagree: any bound wins and forces `custom`, a `custom` without bounds falls
 * back to the default, and reversed bounds are swapped instead of dropped.
 */
export const normalizeRange = (
  range: DateRangeKey,
  from: string | null,
  to: string | null,
): Pick<PracticeLogFilters, "range" | "from" | "to"> => {
  // A lone bound means a single day was picked (or linked to).
  const start = from ?? to;
  const end = to ?? from;

  if (!start || !end) {
    return {
      range: range === "custom" ? DEFAULT_FILTERS.range : range,
      from: null,
      to: null,
    };
  }

  return start <= end
    ? { range: "custom", from: start, to: end }
    : { range: "custom", from: end, to: start };
};

export const usePracticeLogFilters = () => {
  const router = useRouter();

  const filters = useMemo<PracticeLogFilters>(() => {
    // `?date=` is the older single-day link shape (still emitted by the
    // activity log) — it maps onto a one-day custom range.
    const legacyDate = parseDateKey(pickParam(router.query.date));

    return {
      ...normalizeRange(
        parseEnum(
          pickParam(router.query.range),
          RANGE_VALUES,
          DEFAULT_FILTERS.range,
        ),
        parseDateKey(pickParam(router.query.from)) ?? legacyDate,
        parseDateKey(pickParam(router.query.to)) ?? legacyDate,
      ),
      type: parseEnum(
        pickParam(router.query.type),
        TYPE_VALUES,
        DEFAULT_FILTERS.type,
      ),
      duration: parseEnum(
        pickParam(router.query.duration),
        DURATION_VALUES,
        DEFAULT_FILTERS.duration,
      ),
      sort: parseEnum(
        pickParam(router.query.sort),
        SORT_VALUES,
        DEFAULT_FILTERS.sort,
      ),
    };
  }, [router.query]);

  const setFilters = useCallback(
    (changes: Partial<PracticeLogFilters>) => {
      const merged = { ...filters, ...changes };
      // Picking a preset drops any hand-picked bounds, and vice versa.
      const dropBounds =
        changes.range !== undefined && changes.range !== "custom";
      const next = {
        ...merged,
        ...normalizeRange(
          merged.range,
          dropBounds ? null : merged.from,
          dropBounds ? null : merged.to,
        ),
      };

      const query: Record<string, string> = {};

      if (next.range === "custom") {
        if (next.from) query.from = next.from;
        if (next.to && next.to !== next.from) query.to = next.to;
      } else if (next.range !== DEFAULT_FILTERS.range) {
        query.range = next.range;
      }
      if (next.type !== DEFAULT_FILTERS.type) query.type = next.type;
      if (next.duration !== DEFAULT_FILTERS.duration)
        query.duration = next.duration;
      if (next.sort !== DEFAULT_FILTERS.sort) query.sort = next.sort;

      router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [filters, router],
  );

  const isFiltered = useMemo(
    () =>
      filters.range !== DEFAULT_FILTERS.range ||
      filters.type !== DEFAULT_FILTERS.type ||
      filters.duration !== DEFAULT_FILTERS.duration,
    [filters],
  );

  return { filters, setFilters, isFiltered };
};
