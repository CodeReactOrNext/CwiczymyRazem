import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { ArrowUpDown, CalendarRange, SlidersHorizontal, X } from "lucide-react";

import type {
  DateRangeKey,
  DurationKey,
  PracticeLogFilters as Filters,
  SessionType,
  SortKey,
} from "../types/practiceLog.types";

const RANGE_OPTIONS: DateRangeKey[] = ["7d", "30d", "90d", "all"];

interface PracticeLogFiltersProps {
  filters: Filters;
  setFilters: (changes: Partial<Filters>) => void;
  isFiltered: boolean;
}

const selectTriggerClass =
  "h-9 w-full sm:w-[150px] rounded-lg border-white/10 bg-white/5 text-xs font-semibold text-white";
const selectContentClass =
  "rounded-xl border-white/10 bg-zinc-900/90 backdrop-blur-xl";
const selectItemClass = "rounded-lg text-white hover:bg-white/10";

export const PracticeLogFilters = ({
  filters,
  setFilters,
  isFiltered,
}: PracticeLogFiltersProps) => {
  const { t } = useTranslation("practice_log");

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-zinc-800/30 p-4 ring-1 ring-white/5">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            {t("filters.heading")}
          </h2>
        </div>
        {isFiltered && (
          <button
            onClick={() =>
              setFilters({
                range: "all",
                date: null,
                type: "all",
                duration: "all",
              })
            }
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            <X size={12} />
            {t("filters.clear_all")}
          </button>
        )}
      </header>

      {/* Date row */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarRange size={14} className="text-zinc-500" />
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {RANGE_OPTIONS.map((range) => (
            <button
              key={range}
              onClick={() => setFilters({ range, date: null })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-bold transition-colors",
                !filters.date && filters.range === range
                  ? "bg-cyan-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              {t(`filters.range_${range}`)}
            </button>
          ))}
        </div>

        {filters.date ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400">
            {filters.date}
            <button
              onClick={() => setFilters({ date: null })}
              className="hover:text-cyan-200"
              aria-label={t("filters.clear_date")}
            >
              <X size={12} />
            </button>
          </span>
        ) : (
          <input
            type="date"
            value=""
            onChange={(event) =>
              event.target.value && setFilters({ date: event.target.value })
            }
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-400 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label={t("filters.pick_day")}
          />
        )}
      </div>

      {/* Selects row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.type}
          onValueChange={(value) =>
            setFilters({ type: value as SessionType | "all" })
          }
        >
          <SelectTrigger
            className={selectTriggerClass}
            aria-label={t("filters.type_label")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value="all" className={selectItemClass}>
              {t("filters.type_all")}
            </SelectItem>
            <SelectItem value="manual" className={selectItemClass}>
              {t("filters.type_manual")}
            </SelectItem>
            <SelectItem value="plan" className={selectItemClass}>
              {t("filters.type_plan")}
            </SelectItem>
            <SelectItem value="song" className={selectItemClass}>
              {t("filters.type_song")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.duration}
          onValueChange={(value) =>
            setFilters({ duration: value as DurationKey })
          }
        >
          <SelectTrigger
            className={selectTriggerClass}
            aria-label={t("filters.duration_label")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value="all" className={selectItemClass}>
              {t("filters.duration_all")}
            </SelectItem>
            <SelectItem value="short" className={selectItemClass}>
              {t("filters.duration_short")}
            </SelectItem>
            <SelectItem value="medium" className={selectItemClass}>
              {t("filters.duration_medium")}
            </SelectItem>
            <SelectItem value="long" className={selectItemClass}>
              {t("filters.duration_long")}
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-zinc-500" />
          <Select
            value={filters.sort}
            onValueChange={(value) => setFilters({ sort: value as SortKey })}
          >
            <SelectTrigger
              className={selectTriggerClass}
              aria-label={t("filters.sort_label")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="date_desc" className={selectItemClass}>
                {t("filters.sort_date_desc")}
              </SelectItem>
              <SelectItem value="date_asc" className={selectItemClass}>
                {t("filters.sort_date_asc")}
              </SelectItem>
              <SelectItem value="time_desc" className={selectItemClass}>
                {t("filters.sort_time_desc")}
              </SelectItem>
              <SelectItem value="points_desc" className={selectItemClass}>
                {t("filters.sort_points_desc")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};
