import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { convertMsToHM } from "utils/converter";

import { CATEGORY_META } from "../config/sessionType";
import type { PracticeLogSummaryData } from "../types/practiceLog.types";

interface CategorySplitProps {
  split: PracticeLogSummaryData["perCategoryMs"];
  /** Lays the legend out side by side where there is room for it. */
  wide?: boolean;
}

/** The categories with any time in them, biggest first. */
export const getCategoryParts = (split: CategorySplitProps["split"]) =>
  CATEGORY_META.map((meta) => ({ ...meta, ms: split[meta.key] }))
    .filter(({ ms }) => ms > 0)
    .sort((a, b) => b.ms - a.ms);

/** Time per category as one bar with its legend. */
export const CategorySplit = ({ split, wide = false }: CategorySplitProps) => {
  const { t } = useTranslation("common");
  const parts = getCategoryParts(split);

  return (
    <div className='flex flex-col gap-3.5'>
      <div
        className='flex h-3.5 gap-[3px] overflow-hidden rounded-full'
        aria-hidden>
        {parts.map(({ key, dot, ms }) => (
          <span
            key={key}
            className={cn("relative min-w-2 rounded", dot)}
            style={{ flexGrow: ms, flexBasis: 0 }}>
            <span className='light-hide absolute inset-x-1.5 top-[3px] h-[3px] rounded-full bg-white/30' />
          </span>
        ))}
      </div>
      <ul
        className={cn(
          "grid gap-x-8 gap-y-2",
          wide && "sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]",
        )}>
        {parts.map(({ key, labelKey, dot, ms }) => (
          <li key={key} className='flex items-center gap-2.5 text-[13px]'>
            <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
            <span className='text-zinc-300'>{t(labelKey)}</span>
            <span className='ml-auto font-semibold tabular-nums text-zinc-100'>
              {convertMsToHM(ms)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
