import { Button } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { useTranslation } from "hooks/useTranslation";
import { X } from "lucide-react";

import type {
  DateRangeKey,
  DurationKey,
  PracticeLogFilters as Filters,
  SessionType,
  SortKey,
} from "../types/practiceLog.types";

const RANGE_OPTIONS: Exclude<DateRangeKey, "custom">[] = [
  "7d",
  "30d",
  "90d",
  "all",
];

const formatBound = (dateKey: string, withYear: boolean) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
  });
};

/** "12 Aug" for one day, "3 – 15 Aug" style for a span; years shown when needed. */
const formatCustomRange = (from: string, to: string) => {
  const currentYear = String(new Date().getFullYear());
  const withYear =
    from.slice(0, 4) !== currentYear || to.slice(0, 4) !== currentYear;
  const start = formatBound(from, withYear);
  return from === to ? start : `${start} – ${formatBound(to, withYear)}`;
};

interface PracticeLogFiltersProps {
  filters: Filters;
  setFilters: (changes: Partial<Filters>) => void;
  isFiltered: boolean;
}

const selectTriggerClass =
  "h-8 w-auto gap-1.5 px-3 py-0 text-xs font-medium text-zinc-300";
const selectContentClass = "rounded-xl border-none bg-zinc-900 shadow-dark-lg";
const selectItemClass =
  "rounded-lg text-xs text-zinc-300 focus:bg-white/10 focus:text-zinc-50";

export const PracticeLogFilters = ({
  filters,
  setFilters,
  isFiltered,
}: PracticeLogFiltersProps) => {
  const { t } = useTranslation("practice_log");

  return (
    <section className='flex flex-wrap items-center gap-x-3 gap-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <SegmentedControl
          label={t("filters.range_label")}
          options={RANGE_OPTIONS.map((range) => ({
            value: range,
            label: t(`filters.range_${range}`),
          }))}
          selected={filters.range === "custom" ? [] : [filters.range]}
          onSelect={(range) => setFilters({ range })}
        />

        {filters.range === "custom" && filters.from && filters.to && (
          <span className='flex items-center gap-1'>
            <Chip size='sm' color='gray' className='tabular-nums'>
              {formatCustomRange(filters.from, filters.to)}
            </Chip>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => setFilters({ range: "all" })}
              title={t("filters.clear_custom")}
              aria-label={t("filters.clear_custom")}>
              <X />
            </Button>
          </span>
        )}
      </div>

      <div className='ml-auto flex flex-wrap items-center gap-1.5'>
        <Select
          value={filters.type}
          onValueChange={(value) =>
            setFilters({ type: value as SessionType | "all" })
          }>
          <SelectTrigger
            className={selectTriggerClass}
            aria-label={t("filters.type_label")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value='all' className={selectItemClass}>
              {t("filters.type_all")}
            </SelectItem>
            <SelectItem value='manual' className={selectItemClass}>
              {t("filters.type_manual")}
            </SelectItem>
            <SelectItem value='plan' className={selectItemClass}>
              {t("filters.type_plan")}
            </SelectItem>
            <SelectItem value='song' className={selectItemClass}>
              {t("filters.type_song")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.duration}
          onValueChange={(value) =>
            setFilters({ duration: value as DurationKey })
          }>
          <SelectTrigger
            className={selectTriggerClass}
            aria-label={t("filters.duration_label")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value='all' className={selectItemClass}>
              {t("filters.duration_all")}
            </SelectItem>
            <SelectItem value='short' className={selectItemClass}>
              {t("filters.duration_short")}
            </SelectItem>
            <SelectItem value='medium' className={selectItemClass}>
              {t("filters.duration_medium")}
            </SelectItem>
            <SelectItem value='long' className={selectItemClass}>
              {t("filters.duration_long")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => setFilters({ sort: value as SortKey })}>
          <SelectTrigger
            className={selectTriggerClass}
            aria-label={t("filters.sort_label")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value='date_desc' className={selectItemClass}>
              {t("filters.sort_date_desc")}
            </SelectItem>
            <SelectItem value='date_asc' className={selectItemClass}>
              {t("filters.sort_date_asc")}
            </SelectItem>
            <SelectItem value='time_desc' className={selectItemClass}>
              {t("filters.sort_time_desc")}
            </SelectItem>
            <SelectItem value='points_desc' className={selectItemClass}>
              {t("filters.sort_points_desc")}
            </SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() =>
              setFilters({ range: "all", type: "all", duration: "all" })
            }>
            <X />
            {t("filters.clear_all")}
          </Button>
        )}
      </div>
    </section>
  );
};
