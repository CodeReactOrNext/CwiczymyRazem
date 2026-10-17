import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { useRecordingLikers } from "feature/recordings/hooks/useRecordingLikers";
import { useTranslation } from "hooks/useTranslation";
import { type ReactNode, useMemo, useState } from "react";

/** Names shown before the rest collapse into "+N more". */
const MAX_LISTED = 10;

interface RecordingLikersTooltipProps {
  /** `recording.likes` — user ids, oldest like first. */
  likes: string[];
  /** The signed-in user, shown as "You" instead of being looked up. */
  userId?: string | null;
  /** The like button; the tooltip hangs off it. */
  children: ReactNode;
}

/**
 * Hover (or keyboard focus) on a like counter to see who liked the recording.
 * Names are fetched only once the tooltip opens, newest likes first.
 */
export const RecordingLikersTooltip = ({
  likes,
  userId,
  children,
}: RecordingLikersTooltipProps) => {
  const { t } = useTranslation("recordings");
  const [open, setOpen] = useState(false);

  const listedIds = useMemo(() => likes.slice(-MAX_LISTED).reverse(), [likes]);
  // The viewer's own like needs no read — their name is just "You".
  const lookupIds = useMemo(
    () => listedIds.filter((id) => id !== userId),
    [listedIds, userId],
  );
  const { data: likers, isError } = useRecordingLikers(lookupIds, open);

  const namesById = new Map(
    (likers ?? []).map((liker) => [liker.id, liker.displayName || "?"]),
  );
  const names = listedIds.flatMap((id) => {
    if (id === userId) return [t("likers.you")];
    const name = namesById.get(id);
    return name ? [name] : [];
  });

  const isResolving = lookupIds.length > 0 && !likers;
  // Likes from accounts that no longer exist stay in the count, so they stay in
  // the remainder too — the list and the number next to the heart add up.
  const hiddenCount = isResolving ? 0 : likes.length - names.length;

  return (
    <TooltipProvider delayDuration={200}>
      {/* Never swapped for a bare button when the count is 0: the first like would
          then remount the button and drop its focus mid-click. */}
      <Tooltip open={open && likes.length > 0 && !isError} onOpenChange={setOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side='top' className='max-w-[14rem] px-3 py-2'>
          <p className='text-[11px] font-medium text-zinc-500'>{t("likers.title")}</p>
          <ul className='mt-1 space-y-0.5'>
            {names.map((name, index) => (
              <li key={`${name}-${index}`} translate='no' className='truncate'>
                {name}
              </li>
            ))}
          </ul>
          {isResolving && (
            <p className='mt-1 text-[11px] font-medium text-zinc-500'>
              {t("likers.loading")}
            </p>
          )}
          {hiddenCount > 0 && (
            <p className='mt-1 text-[11px] font-medium text-zinc-500'>
              {t("likers.more", { count: hiddenCount })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
