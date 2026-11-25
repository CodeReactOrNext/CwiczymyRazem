import { Button, buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { formatPracticed } from "feature/user/view/ReportView/helpers/sessionSongs";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Pencil, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useId, useState } from "react";
import { convertMsToHM } from "utils/converter";

import { SESSION_TYPE_CONFIG } from "../config/sessionType";
import type { PracticeLogSession } from "../types/practiceLog.types";
import { CategorySplit, getCategoryParts } from "./CategorySplit";

interface SessionCardProps {
  session: PracticeLogSession;
  onEdit: (session: PracticeLogSession) => void;
  onDelete: (session: PracticeLogSession) => void;
  /** Dashboard widget: one tight row, edit and delete on hover, nothing to open. */
  compact?: boolean;
  /** 1-based order badge shown when a single day is selected (matches the timeline). */
  index?: number;
}

/**
 * One logged session. The row says what, when and how much; the note, the
 * split, the songs and the actions open under it.
 */
export const SessionCard = ({
  session,
  onEdit,
  onDelete,
  compact = false,
  index,
}: SessionCardProps) => {
  const { t } = useTranslation(["practice_log", "common"]);
  const locale = useIntlLocale() ?? "en";
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();

  const config = SESSION_TYPE_CONFIG[session.type];
  const TypeIcon = config.icon;
  const { isManual } = session;
  const isBackdated =
    !!session.isDateBackReport && session.isDateBackReport !== "0";

  const parts = session.timeSumary ? getCategoryParts(session.timeSumary) : [];
  // The title of a multi-song session lists the songs but not their times —
  // that split is the whole point of logging a repeat run.
  const songs = (session.songs?.length ?? 0) > 1 ? session.songs! : [];

  const time = session.date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasDetails =
    !compact &&
    (isManual ||
      !!session.replayHref ||
      !!session.description ||
      parts.length > 1 ||
      songs.length > 0);

  const row = (
    <>
      {/* Same neutral tile as the /timer hub rows and the feed thumbs. */}
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300",
          compact ? "h-9 w-9" : "h-11 w-11",
        )}>
        <TypeIcon
          className={compact ? "h-4 w-4" : "h-5 w-5"}
          aria-label={t(config.labelKey)}
        />
        {index !== undefined && (
          <span
            className={cn(
              "absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ring-2 ring-zinc-900",
              config.accentSolid,
              config.accentText,
            )}>
            {index}
          </span>
        )}
      </span>

      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span
          className={cn(
            "text-zinc-100",
            compact
              ? "truncate text-[13px] font-medium"
              : "line-clamp-2 text-[15px] font-semibold sm:line-clamp-1",
          )}>
          {session.title}
        </span>
        <span
          className={cn(
            "truncate tabular-nums text-zinc-400",
            compact ? "text-xs" : "text-[13px]",
          )}>
          {time}
          {isBackdated && ` · ${t("card.backdated")}`}
          {!compact &&
            parts.map(({ key, labelKey, ms }) => (
              <Fragment key={key}>
                {` · ${t(labelKey)}`}
                {/* A single category is the whole session: its time is already
                    on the right. On a phone the split waits under the row. */}
                {parts.length > 1 && (
                  <span className='hidden sm:inline'>
                    {` ${convertMsToHM(ms)}`}
                  </span>
                )}
              </Fragment>
            ))}
        </span>
      </span>

      <span className='flex shrink-0 flex-col items-end gap-0.5 tabular-nums sm:flex-row sm:items-center sm:gap-3'>
        <span
          title={t("card.duration")}
          className={cn(
            "text-right font-bold text-zinc-50 sm:min-w-[62px]",
            compact ? "text-sm" : "text-[15px]",
          )}>
          {convertMsToHM(session.timeMs)}
        </span>
        <span
          title={t("card.points")}
          className='flex items-center justify-end gap-1.5 text-sm font-semibold text-zinc-300 sm:min-w-[52px]'>
          <img
            src='/images/tokens/pick.png'
            alt=''
            aria-hidden
            className='h-4 w-4 shrink-0 object-contain'
          />
          {session.points}
        </span>
      </span>
    </>
  );

  const rowClass = cn(
    "flex w-full min-w-0 items-center rounded-lg text-left",
    compact ? "gap-3.5" : "gap-3 px-2 py-2.5 sm:gap-3.5 sm:px-3",
  );

  if (compact)
    return (
      <div className='group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/5'>
        <div className={rowClass}>{row}</div>
        {isManual && (
          <div className='flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => onEdit(session)}
              title={t("card.edit")}
              aria-label={t("card.edit")}>
              <Pencil />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => onDelete(session)}
              className='hover:text-rose-400'
              title={t("card.delete")}
              aria-label={t("card.delete")}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
    );

  if (!hasDetails) return <div className={rowClass}>{row}</div>;

  return (
    <div>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={detailsId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          rowClass,
          "transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}>
        {row}
      </button>

      {isOpen && (
        <div
          id={detailsId}
          className='flex flex-col gap-4 px-2 pb-4 pt-1 sm:pl-[70px] sm:pr-3'>
          {session.description && (
            <p className='whitespace-pre-line text-[13px] leading-relaxed text-zinc-300'>
              {session.description}
            </p>
          )}
          {parts.length > 1 && session.timeSumary && (
            <CategorySplit split={session.timeSumary} wide />
          )}
          {songs.length > 0 && (
            <ul className='flex flex-col gap-1.5' translate='no'>
              {songs.map((song, i) => (
                <li
                  key={`${song.songId}-${i}`}
                  className='flex items-baseline justify-between gap-4 text-[13px]'>
                  <span className='min-w-0 truncate text-zinc-300'>
                    {song.songTitle}
                  </span>
                  <span className='shrink-0 font-semibold tabular-nums text-zinc-100'>
                    {formatPracticed(song.practiceMs)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(isManual || session.replayHref) && (
            <div className='flex flex-wrap gap-2'>
              {session.replayHref && (
                <Link
                  href={session.replayHref}
                  className={buttonVariants({ size: "sm" })}>
                  <Play />
                  {t("card.play_again")}
                </Link>
              )}
              {isManual && (
                <>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => onEdit(session)}>
                    <Pencil />
                    {t("card.edit")}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => onDelete(session)}
                    className='hover:text-rose-400'>
                    <Trash2 />
                    {t("card.delete")}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
