import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { convertMsToHM, getLocalDateKey } from "utils/converter";

import type { DayGroup } from "../types/practiceLog.types";

interface PracticeCalendarProps {
  /** All practice days (any order) — used to mark & measure the grid. */
  days: DayGroup[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Practice-time buckets → single-hue intensity, like a heatmap. */
const intensityClass = (totalMs: number): string => {
  const minutes = totalMs / 60000;
  if (minutes < 15) return "bg-cyan-500/15 text-cyan-100";
  if (minutes < 45) return "bg-cyan-500/25 text-cyan-50";
  if (minutes < 90) return "bg-cyan-500/40 text-white";
  return "bg-cyan-500/60 text-white";
};

const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

export const PracticeCalendar = ({
  days,
  selectedDate,
  onSelect,
}: PracticeCalendarProps) => {
  const { t } = useTranslation("practice_log");

  const byKey = useMemo(() => {
    const map = new Map<string, DayGroup>();
    days.forEach((day) => map.set(day.dateKey, day));
    return map;
  }, [days]);

  // Navigable range: from the oldest practice month up to the current month.
  const { minMonth, maxMonth } = useMemo(() => {
    const now = new Date();
    const max = monthIndex(now);
    let min = max;
    days.forEach((day) => {
      const idx = monthIndex(day.date);
      if (idx < min) min = idx;
    });
    return { minMonth: min, maxMonth: max };
  }, [days]);

  const initialMonth = () => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    if (days.length > 0) {
      const recent = days.reduce((a, b) => (a.date > b.date ? a : b));
      return new Date(recent.date.getFullYear(), recent.date.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const [viewMonth, setViewMonth] = useState<Date>(initialMonth);

  // Jump the grid to a selected day set from outside (e.g. URL).
  const [prevSelected, setPrevSelected] = useState(selectedDate);
  if (selectedDate !== prevSelected) {
    setPrevSelected(selectedDate);
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      setViewMonth(new Date(y, m - 1, 1));
    }
  }

  const viewIdx = monthIndex(viewMonth);
  const canPrev = viewIdx > minMonth;
  const canNext = viewIdx < maxMonth;

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = getLocalDateKey(new Date());

    const result: {
      key: string;
      day: number;
      group?: DayGroup;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < firstDow; i += 1) {
      result.push({ key: `pad-${i}`, day: 0, isToday: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = getLocalDateKey(new Date(year, month, day));
      result.push({
        key,
        day,
        group: byKey.get(key),
        isToday: key === todayKey,
      });
    }
    while (result.length % 7 !== 0) {
      result.push({ key: `pad-end-${result.length}`, day: 0, isToday: false });
    }
    return result;
  }, [viewMonth, byKey]);

  const shift = (delta: number) => {
    setViewMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const navButtonClass =
    "flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-25";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-zinc-100">
          {viewMonth.toLocaleDateString("en", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => shift(-1)}
            disabled={!canPrev}
            className={navButtonClass}
            aria-label={t("calendar.prev_month")}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => shift(1)}
            disabled={!canNext}
            className={navButtonClass}
            aria-label={t("calendar.next_month")}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((label) => (
          <span
            key={label}
            className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-600"
          >
            {label.slice(0, 2)}
          </span>
        ))}

        {cells.map((cell) => {
          if (cell.day === 0) {
            return <span key={cell.key} aria-hidden="true" />;
          }

          const selected = cell.key === selectedDate;
          const practiced = !!cell.group;

          if (!practiced) {
            return (
              <span
                key={cell.key}
                className={cn(
                  "flex h-9 items-center justify-center rounded-lg text-[13px] tabular-nums",
                  cell.isToday
                    ? "text-zinc-300 ring-1 ring-inset ring-white/15"
                    : "text-zinc-600"
                )}
              >
                {cell.day}
              </span>
            );
          }

          return (
            <button
              key={cell.key}
              onClick={() => onSelect(selected ? null : cell.key)}
              aria-pressed={selected}
              title={`${t("page.day_sessions", {
                count: cell.group!.sessions.length,
              })} · ${convertMsToHM(cell.group!.totalTimeMs)}h`}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-[13px] font-medium tabular-nums transition-all",
                selected
                  ? "bg-cyan-400 font-semibold text-zinc-950"
                  : cn(
                      intensityClass(cell.group!.totalTimeMs),
                      "hover:ring-1 hover:ring-inset hover:ring-cyan-300/60",
                      cell.isToday && "ring-1 ring-inset ring-white/40"
                    )
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        {selectedDate ? (
          <button
            onClick={() => onSelect(null)}
            className="flex items-center gap-1 text-[11px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          >
            <X size={12} />
            {t("calendar.clear_day")}
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-zinc-600">
            {t("calendar.hint")}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">{t("calendar.less")}</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500/15" />
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500/25" />
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500/40" />
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500/60" />
          <span className="text-[10px] text-zinc-600">{t("calendar.more")}</span>
        </div>
      </div>
    </div>
  );
};
