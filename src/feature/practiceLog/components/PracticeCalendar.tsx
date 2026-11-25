import { Button, buttonVariants } from "assets/components/ui/button";
import { Calendar } from "assets/components/ui/calendar";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import { Flag, X } from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react";
import { DayButton, type DayButtonProps } from "react-day-picker";
import { convertMsToHM, getLocalDateKey } from "utils/converter";

import type { DayGroup } from "../types/practiceLog.types";
import { parseDateKey } from "../utils/practiceLog.utils";
import { getRunEdges } from "../utils/practiceRuns";

interface PracticeCalendarProps {
  /** All practice days (any order) — used to mark & measure the grid. */
  days: DayGroup[];
  /** Inclusive `YYYY-MM-DD` bounds of the picked range; a day is from === to. */
  from: string | null;
  to: string | null;
  onSelect: (from: string | null, to: string | null) => void;
  /** The day the running streak reaches its next milestone, marked with a flag. */
  milestone?: { days: number; date: Date } | null;
}

/**
 * Practice-time buckets → single-hue intensity of the day's dot (the cell's
 * button), like a heatmap. Each bucket carries its own text colour: the cell
 * inherits a muted grey otherwise, and a declared colour always beats an
 * inherited one.
 */
const INTENSITY_CLASSES = {
  intensity1: "[&>button]:bg-cyan-500/15 font-semibold text-cyan-100",
  intensity2: "[&>button]:bg-cyan-500/25 font-semibold text-cyan-50",
  intensity3: "[&>button]:bg-cyan-500/40 font-semibold text-white",
  intensity4: "[&>button]:bg-cyan-500/60 font-semibold text-white",
} as const;

/**
 * The ribbon under the dots: days practised back to back join into one shape,
 * so a run is seen rather than counted. Drawn on the cell; the dot sits on top.
 * A day is exactly one of the four, so their offsets never compete.
 */
const RIBBON = "before:absolute before:inset-y-0.5 before:bg-cyan-500/15";
const RUN_CLASSES = {
  runSingle: "",
  runStart: cn(
    RIBBON,
    "before:left-[calc(50%-1rem)] before:right-0 before:rounded-l-full",
  ),
  runMiddle: cn(RIBBON, "before:inset-x-0"),
  runEnd: cn(
    RIBBON,
    "before:left-0 before:right-[calc(50%-1rem)] before:rounded-r-full",
  ),
} as const;

const NAV_KEY = cn(
  buttonVariants({ variant: "ghost", size: "icon-sm" }),
  "disabled:opacity-25",
);

/** Round dots in a row without gaps — the shared calendar draws square cells. */
const CALENDAR_CLASSES = {
  month_caption: "flex h-8 items-center",
  nav: "absolute right-0 top-0 flex items-center gap-1",
  button_previous: NAV_KEY,
  button_next: NAV_KEY,
  week: "flex w-full",
  day: "relative isolate flex h-9 flex-1 items-center justify-center text-[13px] tabular-nums",
  day_button:
    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none",
  today:
    "[&>button]:outline [&>button]:outline-2 [&>button]:-outline-offset-2 [&>button]:outline-white/70",
  range_start:
    "font-semibold text-cyan-100 [&>button]:ring-2 [&>button]:ring-inset [&>button]:ring-cyan-300",
  range_end:
    "font-semibold text-cyan-100 [&>button]:ring-2 [&>button]:ring-inset [&>button]:ring-cyan-300",
  range_middle:
    "[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-cyan-300/40",
};

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
const DayTitleContext = createContext<{
  getTitle: (date: Date) => string | undefined;
  /** Date key of the flagged day and what the flag stands for. */
  flag: { dateKey: string; label: string } | null;
}>({ getTitle: () => undefined, flag: null });

const PracticeDayButton = ({ children, ...props }: DayButtonProps) => {
  const { getTitle, flag } = useContext(DayTitleContext);
  const isFlagged = flag?.dateKey === getLocalDateKey(props.day.date);
  return (
    <DayButton
      {...props}
      title={isFlagged ? flag.label : getTitle(props.day.date)}>
      {children}
      {isFlagged && (
        <Flag
          aria-label={flag.label}
          className='absolute -right-0.5 -top-1 h-3.5 w-3.5 fill-orange-400 text-orange-400'
        />
      )}
    </DayButton>
  );
};

const CALENDAR_COMPONENTS = { DayButton: PracticeDayButton };

export const PracticeCalendar = ({
  days,
  from,
  to,
  onSelect,
  milestone,
}: PracticeCalendarProps) => {
  const { t } = useTranslation("practice_log");
  const dateLocale = useDateFnsLocale();

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
    const runs = getRunEdges(days.map((day) => day.dateKey));
    return {
      ...buckets,
      runSingle: runs.single,
      runStart: runs.start,
      runMiddle: runs.middle,
      runEnd: runs.end,
    };
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
      })} · ${convertMsToHM(group.totalTimeMs)}`;
    },
    [byKey, t],
  );

  const dayContext = useMemo(
    () => ({
      getTitle: getDayTitle,
      flag: milestone
        ? {
            dateKey: getLocalDateKey(milestone.date),
            label: t("calendar.streak_goal", { count: milestone.days }),
          }
        : null,
    }),
    [getDayTitle, milestone, t],
  );

  return (
    <div className='flex flex-col gap-3'>
      <DayTitleContext.Provider value={dayContext}>
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
          modifiersClassNames={{ ...INTENSITY_CLASSES, ...RUN_CLASSES }}
          classNames={CALENDAR_CLASSES}
          locale={dateLocale}
          components={CALENDAR_COMPONENTS}
          labels={{
            labelPrevious: () => t("calendar.prev_month"),
            labelNext: () => t("calendar.next_month"),
          }}
        />
      </DayTitleContext.Provider>

      {from && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='self-start'
          onClick={() => onSelect(null, null)}>
          <X />
          {t("calendar.clear_range")}
        </Button>
      )}
    </div>
  );
};
