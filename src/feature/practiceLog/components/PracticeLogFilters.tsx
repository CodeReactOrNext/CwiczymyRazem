import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { X } from "lucide-react";

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
  "h-8 w-auto gap-1.5 rounded-lg border-none bg-white/5 px-3 py-0 text-xs font-medium text-zinc-300 shadow-none transition-colors hover:bg-white/10 focus:ring-0 ring-offset-0";
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
    <section className="flex flex-wrap items-center gap-x-3 gap-y-3">
      <div className="flex items-center gap-0.5">
        {RANGE_OPTIONS.map((range) => {
          const active = !filters.date && filters.range === range;
          return (
            <button
              key={range}
              onClick={() => setFilters({ range, date: null })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              {t(`filters.range_${range}`)}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
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
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <X size={12} />
            {t("filters.clear_all")}
          </button>
        )}
      </div>
    </section>
  );
};
