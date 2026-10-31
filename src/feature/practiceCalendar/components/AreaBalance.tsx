import { cn } from "assets/lib/utils";

import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { PracticeArea } from "../types/calendar.types";
import { PRACTICE_AREAS } from "../types/calendar.types";
import { AREA_DOT } from "../utils/areaStyles";

interface AreaBalanceProps {
  minutesByArea: Record<PracticeArea, number>;
  className?: string;
}

/** How the minutes split between the areas: one bar, and the areas named under it. */
export const AreaBalance = ({ minutesByArea, className }: AreaBalanceProps) => {
  const { formatMinutes, t } = useCalendarDisplay();
  const total = PRACTICE_AREAS.reduce(
    (sum, area) => sum + minutesByArea[area],
    0,
  );
  const present = PRACTICE_AREAS.filter((area) => minutesByArea[area] > 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className='flex h-2 gap-0.5 overflow-hidden rounded-full bg-zinc-800'
        aria-hidden>
        {present.map((area) => (
          <div
            key={area}
            className={cn(
              "h-full transition-[flex-grow] duration-500",
              AREA_DOT[area],
            )}
            style={{ flexGrow: minutesByArea[area] }}
          />
        ))}
      </div>
      <ul className='flex flex-wrap gap-x-6 gap-y-2'>
        {(total > 0 ? present : PRACTICE_AREAS).map((area) => (
          <li key={area} className='flex items-center gap-2 text-sm'>
            <span className={cn("h-2 w-2 rounded-full", AREA_DOT[area])} />
            <span className='text-zinc-300'>{t(`areas.${area}`)}</span>
            {total > 0 && (
              <span className='tabular-nums text-zinc-500'>
                {formatMinutes(minutesByArea[area])}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
