import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { AttemptTicks, DuelCountdown } from "feature/duels/components/DuelBits";
import { getDuelExercise } from "feature/duels/data/duelPool";
import type { DuelView } from "feature/duels/types/duel.types";
import {
  DUEL_DURATION_MS,
  DUEL_REMIND_BEFORE_MS,
} from "feature/duels/utils/duelRules";
import { TabPreviewGlyph } from "feature/landing/components/TabPreviewGlyph";
import { getTabPreview } from "feature/landing/lib/tabPreview";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { EyeOff, Play, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface ActiveDuelCardProps {
  duel: DuelView;
  now: number;
  myName: string;
  myAvatar: string;
  /** Opened from a notification — drawn a shade brighter. */
  isHighlighted?: boolean;
  /** Paired a moment ago — slides in and says so. */
  isNew?: boolean;
}

/**
 * One running duel as a face-off: you on the left with your best run, the
 * opponent on the right as nothing but a silhouette and a row of attempts,
 * the clock burning down along the top edge until the 24 hours are up.
 */
export const ActiveDuelCard = ({
  duel,
  now,
  myName,
  myAvatar,
  isHighlighted,
  isNew,
}: ActiveDuelCardProps) => {
  const { t } = useTranslation("duels");
  const intlLocale = useIntlLocale();
  const exercise = getDuelExercise(duel.exerciseId);
  const tabPreview = useMemo(
    () => getTabPreview(exercise?.tablature),
    [exercise],
  );

  const msLeft = duel.endsAt - now;
  const isOver = msLeft <= 0;
  const isEnding = !isOver && msLeft <= DUEL_REMIND_BEFORE_MS;
  const share = Math.max(0, Math.min(1, msLeft / DUEL_DURATION_MS));
  const hasPlayed = duel.me.attempts > 0;
  const opponentAttempts = duel.opponent.attempts;
  const myRunDetails = [
    duel.me.bestAccuracy > 0 ? `${duel.me.bestAccuracy}%` : null,
    duel.me.bestBpm ? `${duel.me.bestBpm} BPM` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}>
      <Card
        id={`duel-${duel.id}`}
        className={cn(
          "scroll-mt-24 overflow-hidden p-0 transition-colors",
          isHighlighted || isNew ? "bg-zinc-800/60" : "bg-zinc-900/60",
        )}>
        {/* The fuse: what is left of the 24 hours, orange once the reminder is due. */}
        <div className='h-1 w-full bg-zinc-800/80'>
          <div
            className={cn(
              "h-full transition-[width] duration-1000",
              isEnding ? "bg-orange-400" : "bg-cyan-400",
            )}
            style={{ width: `${share * 100}%` }}
          />
        </div>

        <div className='p-5 sm:p-7'>
          <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-4'>
            <div className='min-w-0'>
              <p className='flex items-center gap-2 text-xs font-medium text-zinc-400'>
                {isNew && (
                  <>
                    <span className='font-semibold text-cyan-400'>
                      {t("active.new")}
                    </span>
                    <span className='text-zinc-600'>·</span>
                  </>
                )}
                {t(`category.${exercise?.category ?? "technique"}`)}
              </p>
              <h3 className='mt-1.5 text-xl font-semibold leading-tight text-zinc-50 sm:text-2xl'>
                {exercise?.title ?? duel.exerciseId}
              </h3>
              {tabPreview.length > 0 && (
                <TabPreviewGlyph
                  notes={tabPreview}
                  className='mt-4 h-auto w-full max-w-[15rem]'
                />
              )}
            </div>

            <div className='flex shrink-0 flex-col items-start sm:items-end'>
              {isOver ? (
                <span className='font-teko text-3xl font-semibold tabular-nums leading-none text-zinc-500'>
                  00:00:00
                </span>
              ) : (
                <DuelCountdown endsAt={duel.endsAt} isEnding={isEnding} />
              )}
              <span className='mt-1 text-[11px] text-zinc-500'>
                {isOver ? t("active.settling") : t("active.left")}
              </span>
            </div>
          </div>

          <div className='mt-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-8'>
            {/* You */}
            <div className='min-w-0'>
              <div className='flex items-center gap-2.5'>
                <Avatar
                  avatarURL={myAvatar || undefined}
                  name={myName}
                  size='sm'
                  className='shrink-0'
                />
                <span className='truncate text-sm font-semibold text-zinc-200'>
                  {t("active.you")}
                </span>
              </div>
              <p
                className={cn(
                  "mt-3 font-teko text-5xl font-semibold tabular-nums leading-none",
                  hasPlayed ? "text-zinc-50" : "text-zinc-700",
                )}>
                {hasPlayed ? duel.me.bestScore.toLocaleString(intlLocale) : "—"}
              </p>
              <p className='mt-1.5 truncate text-xs tabular-nums text-zinc-400'>
                {hasPlayed
                  ? myRunDetails || t("active.best")
                  : t("active.no_run")}
              </p>
              <div className='mt-3 flex min-h-2.5 items-center'>
                <AttemptTicks count={duel.me.attempts} />
              </div>
              <p className='mt-1.5 text-xs tabular-nums text-zinc-500'>
                {t("active.attempts", { count: duel.me.attempts })}
              </p>
            </div>

            <span
              className='font-teko text-4xl font-semibold leading-none text-zinc-700'
              aria-hidden='true'>
              vs
            </span>

            {/* The opponent — attempts only */}
            <div className='min-w-0 text-right'>
              <div className='flex flex-row-reverse items-center gap-2.5'>
                <span
                  className='flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500'
                  aria-hidden='true'>
                  <UserRound size={18} />
                </span>
                <span className='truncate text-sm font-semibold text-zinc-400'>
                  {t("active.anonymous")}
                </span>
              </div>
              <p
                className='mt-3 font-teko text-5xl font-semibold leading-none text-zinc-700'
                aria-hidden='true'>
                ???
              </p>
              <p className='mt-1.5 flex items-center justify-end gap-1.5 truncate text-xs text-zinc-400'>
                <EyeOff size={12} className='shrink-0 text-zinc-500' />
                {t("active.hidden")}
              </p>
              <div className='mt-3 flex min-h-2.5 items-center justify-end'>
                <AttemptTicks
                  count={opponentAttempts}
                  align='end'
                  tone='muted'
                />
              </div>
              <p
                className={cn(
                  "mt-1.5 text-xs tabular-nums",
                  opponentAttempts > 0 ? "text-zinc-400" : "text-zinc-500",
                )}>
                {opponentAttempts > 0
                  ? t("active.attempts", { count: opponentAttempts })
                  : t("active.not_played")}
              </p>
            </div>
          </div>

          <div className='mt-8'>
            {isOver ? (
              <span className='inline-flex h-11 items-center rounded-lg bg-zinc-800/60 px-5 text-sm font-semibold text-zinc-400'>
                {t("active.settling_short")}
              </span>
            ) : (
              <Link
                href={`/practice/duel/${duel.id}`}
                className='inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 hover:bg-zinc-200'>
                <Play size={16} className='fill-current' />
                {hasPlayed ? t("active.beat_best") : t("active.play")}
              </Link>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
