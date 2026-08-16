import { cn } from "assets/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type ChevronProps,
  type CustomComponents,
  DayPicker,
  type DayPickerProps,
} from "react-day-picker";

export type CalendarProps = DayPickerProps;

const navButtonClass =
  "flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-25";

// Defined at module scope so DayPicker keeps the same component identity across
// renders instead of remounting the whole grid.
const CalendarChevron = ({ orientation, className }: ChevronProps) =>
  orientation === "left" ? (
    <ChevronLeft size={16} className={className} />
  ) : (
    <ChevronRight size={16} className={className} />
  );

const BASE_COMPONENTS: Partial<CustomComponents> = { Chevron: CalendarChevron };

/**
 * Date picker built on react-day-picker, styled for the app's dark palette.
 *
 * Day state lands on the *cell*, never on the inner button, so a caller can
 * layer its own `modifiers` (e.g. a practice heatmap) there. Two rules keep
 * those modifiers from being overridden, since every class ends up on one
 * element and Tailwind — not the class order — decides which wins:
 *
 * - the resting text colour is inherited from the root, never declared on the
 *   cell, because inheritance always loses to a direct declaration;
 * - selection is expressed with rings and font weight only, leaving `bg-*` and
 *   `text-*` free for the caller.
 */
export const Calendar = ({
  className,
  classNames,
  components,
  showOutsideDays = false,
  ...props
}: CalendarProps) => (
  <DayPicker
    showOutsideDays={showOutsideDays}
    weekStartsOn={1}
    className={cn("relative w-full text-zinc-600", className)}
    classNames={{
      months: "flex flex-col gap-4",
      month: "flex flex-col gap-3",
      month_caption: "flex h-7 items-center",
      caption_label: "font-display text-sm font-semibold text-zinc-100",
      nav: "absolute right-0 top-0 flex items-center gap-0.5",
      button_previous: navButtonClass,
      button_next: navButtonClass,
      month_grid: "w-full border-collapse",
      weekdays: "flex",
      weekday:
        "flex-1 pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-600",
      weeks: "flex flex-col gap-1",
      week: "flex w-full gap-1",
      day: "h-9 flex-1 rounded-lg text-[13px] tabular-nums transition-colors",
      // Hover lives on the button so it never competes with the cell's own
      // background or rings.
      day_button:
        "flex h-full w-full items-center justify-center rounded-lg hover:bg-white/[0.07] disabled:pointer-events-none",
      // Marked with an outline rather than a colour, so a day that is both
      // today and a busy practice day keeps its heatmap shade.
      today: "outline outline-1 -outline-offset-1 outline-white/25",
      selected: "",
      range_start:
        "font-semibold text-cyan-100 ring-2 ring-inset ring-cyan-300",
      range_end: "font-semibold text-cyan-100 ring-2 ring-inset ring-cyan-300",
      range_middle: "ring-1 ring-inset ring-cyan-300/40",
      outside: "text-zinc-700",
      disabled: "text-zinc-800",
      hidden: "invisible",
      ...classNames,
    }}
    components={{ ...BASE_COMPONENTS, ...components }}
    {...props}
  />
);
