import { Calendar } from "assets/components/ui/calendar";
import { useTranslation } from "hooks/useTranslation";
import { X } from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react";
import { DayButton, type DayButtonProps } from "react-day-picker";
import { convertMsToHM, getLocalDateKey } from "utils/converter";

import type { DayGroup } from "../types/practiceLog.types";
import { parseDateKey } from "../utils/practiceLog.utils";

interface PracticeCalendarProps {
  /** All practice days (any order) — used to mark & measure the grid. */
  days: DayGroup[];
  /** Inclusive `YYYY-MM-DD` bounds of the picked range; a day is from === to. */
  from: string | null;
  to: string | null;
  onSelect: (from: string | null, to: string | null) => void;
}

/**
 * Practice-time buckets → single-hue intensity, like a heatmap. Each bucket
 * carries its own text colour: the cell inherits a muted grey otherwise, and a
 * declared colour always beats an inherited one.
 */
const INTENSITY_CLASSES = {
  intensity1: "bg-cyan-500/15 font-medium text-cyan-100",
  intensity2: "bg-cyan-500/25 font-medium text-cyan-50",
  intensity3: "bg-cyan-500/40 font-medium text-white",
  intensity4: "bg-cyan-500/60 font-medium text-white",
} as const;

type IntensityKey = keyof typeof INTENSITY_CLASSES;

const intensityKey = (totalMs: number): IntensityKey => {
  const minutes = totalMs / 60000;
  if (minutes < 15) return "intensity1";
  if (minutes < 45) return "intensity2";
  if (minutes < 90) return "intensity3";
  return "intensity4";
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * Per-day hover summary, passed through context so the day button stays a
 * single stable component instead of being redefined on every render.
 */
const DayTitleContext = createContext<(date: Date) => string | undefined>(
  () => undefined,
);

const PracticeDayButton = (props: DayButtonProps) => {
  const getTitle = useContext(DayTitleContext);
  return <DayButton {...props} title={getTitle(props.day.date)} />;
};

const CALENDAR_COMPONENTS = { DayButton: PracticeDayButton };

export const PracticeCalendar = ({
  days,
  from,
  to,
  onSelect,
}: PracticeCalendarProps) => {
  const { t } = useTranslation("practice_log");

  const byKey = useMemo(() => {
    const map = new Map<string, DayGroup>();
    days.forEach((day) => map.set(day.dateKey, day));
    return map;
  }, [days]);

  const modifiers = useMemo(() => {
    const buckets: Record<IntensityKey, Date[]> = {
      intensity1: [],
      intensity2: [],
      intensity3: [],
      intensity4: [],
    };
    days.forEach((day) =>
      buckets[intensityKey(day.totalTimeMs)].push(parseDateKey(day.dateKey)),
    );
    return buckets;
  }, [days]);

  // Navigable range: from the oldest practice month up to the current month.
  const { startMonth, endMonth } = useMemo(() => {
    const end = startOfMonth(new Date());
    let start = end;
    days.forEach((day) => {
      const month = startOfMonth(day.date);
      if (month < start) start = month;
    });
    return { startMonth: start, endMonth: end };
  }, [days]);

  const selected = useMemo(
    () =>
      from
        ? { from: parseDateKey(from), to: parseDateKey(to ?? from) }
        : undefined,
    [from, to],
  );

  // Open on the picked range, else on the most recent month with practice.
  const [month, setMonth] = useState<Date>(() => {
    if (from) return startOfMonth(parseDateKey(from));
    if (days.length > 0) {
      const recent = days.reduce((a, b) => (a.date > b.date ? a : b));
      return startOfMonth(recent.date);
    }
    return startOfMonth(new Date());
  });

  // Jump the grid to a range set from outside (e.g. an activity-log link).
  const [prevFrom, setPrevFrom] = useState(from);
  if (from !== prevFrom) {
    setPrevFrom(from);
    if (from) setMonth(startOfMonth(parseDateKey(from)));
  }

  const getDayTitle = useMemo(
    () => (date: Date) => {
      const group = byKey.get(getLocalDateKey(date));
      if (!group) return undefined;
      return `${t("page.day_sessions", {
        count: group.sessions.length,
      })} · ${convertMsToHM(group.totalTimeMs)}h`;
    },
    [byKey, t],
  );

  return (
    <div className='flex flex-col gap-3'>
      <DayTitleContext.Provider value={getDayTitle}>
        <Calendar
          mode='range'
          selected={selected}
          onSelect={(range) =>
            onSelect(
              range?.from ? getLocalDateKey(range.from) : null,
              range?.to ? getLocalDateKey(range.to) : null,
            )
          }
          month={month}
          onMonthChange={setMonth}
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={{ after: new Date() }}
          modifiers={modifiers}
          modifiersClassNames={INTENSITY_CLASSES}
          components={CALENDAR_COMPONENTS}
          labels={{
            labelPrevious: () => t("calendar.prev_month"),
            labelNext: () => t("calendar.next_month"),
          }}
        />
      </DayTitleContext.Provider>

      <div className='flex items-center justify-between gap-2'>
        {from ? (
          <button
            onClick={() => onSelect(null, null)}
            className='flex items-center gap-1 text-[11px] font-medium text-cyan-300 transition-colors hover:text-cyan-200'>
            <X size={12} />
            {t("calendar.clear_range")}
          </button>
        ) : (
          <span className='text-[10px] uppercase tracking-wide text-zinc-600'>
            {t("calendar.hint")}
          </span>
        )}
        <div className='flex items-center gap-1.5'>
          <span className='text-[10px] text-zinc-600'>
            {t("calendar.less")}
          </span>
          <span className='h-2.5 w-2.5 rounded-sm bg-cyan-500/15' />
          <span className='h-2.5 w-2.5 rounded-sm bg-cyan-500/25' />
          <span className='h-2.5 w-2.5 rounded-sm bg-cyan-500/40' />
          <span className='h-2.5 w-2.5 rounded-sm bg-cyan-500/60' />
          <span className='text-[10px] text-zinc-600'>
            {t("calendar.more")}
          </span>
        </div>
      </div>
    </div>
  );
};
