import { Bookmark, ExternalLink } from "lucide-react";

import { useRotationDisplay } from "../hooks/useRotationDisplay";
import type { RotationItem } from "../types/rotation.types";
import { linkLabel } from "../utils/rotation.utils";

/**
 * Sits above the Free Timer when it was opened for a custom rotation item
 * (`?rotation=<id>`): what you're practising and its link, so the course page
 * is one tap away while the stopwatch runs.
 */
export const RotationTimerBanner = ({ item }: { item: RotationItem }) => {
  const { t } = useRotationDisplay();

  return (
    <div className='mx-3 mt-6 flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-5 sm:flex-row sm:items-center sm:justify-between md:mx-6 lg:mx-8'>
      <div className='flex min-w-0 items-center gap-4'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400'>
          <Bookmark className='h-5 w-5' />
        </div>
        <div className='min-w-0'>
          <p className='text-xs text-zinc-400'>{t("timer.from_rotation")}</p>
          <p className='mt-1 truncate text-base font-semibold text-zinc-100'>
            {item.title}
          </p>
          {item.note && (
            <p className='mt-1 truncate text-sm text-zinc-400'>{item.note}</p>
          )}
        </div>
      </div>
      {item.link && (
        <a
          href={item.link}
          target='_blank'
          rel='noopener noreferrer'
          className='flex shrink-0 items-center justify-center gap-2.5 rounded-lg bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
          {t("timer.open_link", { site: linkLabel(item.link) })}
          <ExternalLink className='h-4 w-4 text-zinc-400' />
        </a>
      )}
    </div>
  );
};
