import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { Check, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";

import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { CalendarItem } from "../types/calendar.types";
import { AREA_DOT } from "../utils/areaStyles";
import { itemHref } from "../utils/calendarItems";

interface CalendarItemRowProps {
  item: CalendarItem;
  done: boolean;
  /** The day the slot is on. */
  date: string;
  /** The days of the shown week, Monday first — where a slot can be moved. */
  weekDates: string[];
  onToggleDone: () => void;
  onMove: (date: string) => void;
  onRemove: () => void;
}

/**
 * One slot of a day: the area's dot, what it plays and for how long. A tap
 * opens its menu — tick it off, move it, open its goal or roadmap step.
 */
export const CalendarItemRow = ({
  item,
  done,
  date,
  weekDates,
  onToggleDone,
  onMove,
  onRemove,
}: CalendarItemRowProps) => {
  const { describe, formatDate, t } = useCalendarDisplay();
  const display = describe(item);
  const href = itemHref(item);

  return (
    <li>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label={t("item.menu", { title: display.title })}
            className={cn(
              "group flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 data-[state=open]:bg-zinc-800/60 hover:bg-zinc-800/60 lg:gap-2.5 lg:py-2",
              done && "opacity-50",
            )}>
            {done ? (
              <Check
                className='mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400'
                aria-hidden
              />
            ) : (
              <span
                className={cn(
                  "mt-[5px] h-2 w-2 shrink-0 rounded-full",
                  AREA_DOT[item.area],
                )}
                aria-hidden
              />
            )}
            <span className='min-w-0 flex-1'>
              <span className='line-clamp-2 text-sm font-medium leading-snug text-zinc-100 lg:text-[13px]'>
                {display.title}
              </span>
              <span className='mt-1 flex items-center gap-1.5 text-xs text-zinc-400'>
                <span className='tabular-nums'>
                  {t("time.minutes_short", { count: item.minutes })}
                </span>
                <span className='truncate text-zinc-500'>
                  {item.role === "warmup" ? t("item.warmup") : display.subtitle}
                </span>
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='start'
          className='w-64 border-0 bg-zinc-900 p-1.5 text-zinc-200'>
          {/* Played elsewhere in the app counts as done by itself — there is nothing to undo. */}
          {(!done || item.done) && (
            <DropdownMenuItem
              onSelect={onToggleDone}
              className='gap-2.5 rounded-lg py-2 focus:bg-zinc-800'>
              {done ? (
                <RotateCcw className='h-4 w-4 text-zinc-400' />
              ) : (
                <Check className='h-4 w-4 text-zinc-400' />
              )}
              {done ? t("item.undo_done") : t("item.mark_done")}
            </DropdownMenuItem>
          )}
          {href && (
            <DropdownMenuItem
              asChild
              className='gap-2.5 rounded-lg py-2 focus:bg-zinc-800'>
              <Link href={href}>
                <ExternalLink className='h-4 w-4 text-zinc-400' />
                {item.kind === "goal"
                  ? t("item.open_goal")
                  : t("item.open_step")}
              </Link>
            </DropdownMenuItem>
          )}
          {/* The days sit in the menu itself: a submenu would open off the
              side of a phone screen. */}
          <div className='px-2 pb-1.5 pt-3'>
            <p className='text-xs text-zinc-500'>{t("item.move")}</p>
            <div className='mt-2 grid grid-cols-7 gap-0.5'>
              {weekDates.map((target) => (
                <DropdownMenuItem
                  key={target}
                  disabled={target === date}
                  onSelect={() => onMove(target)}
                  aria-label={formatDate(target, {
                    weekday: "long",
                    day: "numeric",
                  })}
                  className='flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg p-0 focus:bg-zinc-800 data-[disabled]:bg-zinc-800/60 data-[disabled]:opacity-100'>
                  <span className='text-[10px] text-zinc-500'>
                    {formatDate(target, { weekday: "narrow" })}
                  </span>
                  <span className='text-sm tabular-nums text-zinc-200'>
                    {formatDate(target, { day: "numeric" })}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </div>
          <DropdownMenuItem
            onSelect={onRemove}
            className='gap-2.5 rounded-lg py-2 text-zinc-300 focus:bg-zinc-800'>
            <Trash2 className='h-4 w-4 text-zinc-400' />
            {t("item.remove")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};
