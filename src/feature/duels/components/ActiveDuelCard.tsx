import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { AttemptTicks, DuelCountdown } from "feature/duels/components/DuelBits";
import { getDuelExercise } from "feature/duels/data/duelPool";
import { useMarkDuelReady } from "feature/duels/hooks/useDuels";
import { duelErrorCode } from "feature/duels/services/duels.service";
import type { DuelView } from "feature/duels/types/duel.types";
import { DUEL_REMIND_BEFORE_MS } from "feature/duels/utils/duelRules";
import { TabPreviewGlyph } from "feature/landing/components/TabPreviewGlyph";
import { getTabPreview } from "feature/landing/lib/tabPreview";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Check, Loader2, Play, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/** "Ready" next to an attempt count — that side's best is final. */
const ReadyMark = () => {
  const { t } = useTranslation("duels");
  return (
    <>
      <span className='text-zinc-700' aria-hidden='true'>
        ·
      </span>
      <span className='inline-flex items-center gap-1 font-medium text-emerald-400'>
        <Check size={12} className='shrink-0' />
        {t("ready.badge")}
      </span>
    </>
  );
};

/**
 * One side's line under the score: ticks, the count and "Ready" — or, before
 * the first run, a single line saying so. The opponent's side is mirrored.
 */
const SideStatus = ({
  attempts,
  isReady,
  emptyText,
  isOpponent = false,
}: {
  attempts: number;
  isReady: boolean;
  emptyText: string;
  isOpponent?: boolean;
}) => {
  const { t } = useTranslation("duels");
  if (attempts === 0) {
    return <p className='mt-2 truncate text-xs text-zinc-500'>{emptyText}</p>;
  }
  return (
    <p
      className={cn(
        "mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs tabular-nums text-zinc-400",
        isOpponent && "flex-row-reverse",
      )}>
      <span className={isOpponent ? "ml-0.5" : "mr-0.5"}>
        <AttemptTicks
          count={attempts}
          align={isOpponent ? "end" : "start"}
          tone={isOpponent ? "muted" : "light"}
        />
      </span>
      <span>{t("active.attempts", { count: attempts })}</span>
      {isReady && <ReadyMark />}
    </p>
  );
};

interface ActiveDuelCardProps {
  uid: string | null;
  duel: DuelView;
  now: number;
  myName: string;
  myAvatar: string;
  /** Opened from a notification — drawn a shade brighter. */
  isHighlighted?: boolean;
  /** Paired a moment ago — slides in and says so. */
  isNew?: boolean;
  /** Both pressed Ready and the duel settled on the spot. */
  onSettledEarly?: (duelId: string) => void;
}

/**
 * One running duel as a face-off: you on the left with your best run, the
 * opponent on the right as nothing but a silhouette and a row of attempts,
 * the clock burning down along the top edge until the time is up. Ready locks
 * your best in; when both sides are ready the duel ends early.
 */
export const ActiveDuelCard = ({
  uid,
  duel,
  now,
  myName,
  myAvatar,
  isHighlighted,
  isNew,
  onSettledEarly,
}: ActiveDuelCardProps) => {
  const { t } = useTranslation("duels");
  const ready = useMarkDuelReady(uid, onSettledEarly);
  const [isConfirming, setIsConfirming] = useState(false);
  const intlLocale = useIntlLocale();
  const exercise = getDuelExercise(duel.exerciseId);
  const tabPreview = useMemo(
    () => getTabPreview(exercise?.tablature),
    [exercise],
  );

  const msLeft = duel.endsAt - now;
  const isOver = msLeft <= 0;
  const isEnding = !isOver && msLeft <= DUEL_REMIND_BEFORE_MS;
  // From the duel's own length, so one paired under an older limit reads right.
  const share = Math.max(
    0,
    Math.min(1, msLeft / Math.max(1, duel.endsAt - duel.createdAt)),
  );
  const hasPlayed = duel.me.attempts > 0;
  const isReady = duel.me.isReady;
  const opponentAttempts = duel.opponent.attempts;
  const isOpponentReady = !duel.opponent.revealed && duel.opponent.isReady;

  const readyErrorCode = ready.isError ? duelErrorCode(ready.error) : null;
  const readyErrorText =
    readyErrorCode === "NO_RUN"
      ? t("ready.error_no_run")
      : readyErrorCode === "CLOSED"
        ? t("ready.error_closed")
        : ready.isError
          ? t("ready.error")
          : null;

  // Runs after the refetch, so the card goes straight from the question to "locked in".
  const lockIn = () =>
    ready.mutate(duel.id, { onSuccess: () => setIsConfirming(false) });
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
        {/* The fuse: what is left of the duel, orange once the reminder is due. */}
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

          {/* One compact block, so the two sides read as a face-off rather than two ends of the card. */}
          <div className='mt-6 grid max-w-lg grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-8'>
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
              <p className='mt-3 flex flex-wrap items-baseline gap-x-2.5'>
                <span
                  className={cn(
                    "font-teko text-5xl font-semibold tabular-nums leading-none",
                    hasPlayed ? "text-zinc-50" : "text-zinc-700",
                  )}>
                  {hasPlayed
                    ? duel.me.bestScore.toLocaleString(intlLocale)
                    : "—"}
                </span>
                {hasPlayed && myRunDetails && (
                  <span className='text-xs tabular-nums text-zinc-400'>
                    {myRunDetails}
                  </span>
                )}
              </p>
              <SideStatus
                attempts={duel.me.attempts}
                isReady={isReady}
                emptyText={t("active.no_run")}
              />
            </div>

            <span
              className='self-center font-teko text-4xl font-semibold leading-none text-zinc-700'
              aria-hidden='true'>
              vs
            </span>

            {/* The opponent — attempts only; "???" once there is a score to hide. */}
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
              <p className='mt-3 font-teko text-5xl font-semibold leading-none text-zinc-700'>
                <span aria-hidden='true'>
                  {opponentAttempts > 0 ? "???" : "—"}
                </span>
                {opponentAttempts > 0 && (
                  <span className='sr-only'>{t("active.hidden")}</span>
                )}
              </p>
              <SideStatus
                attempts={opponentAttempts}
                isReady={isOpponentReady}
                emptyText={t("active.not_played")}
                isOpponent
              />
            </div>
          </div>

          <div className='mt-6'>
            {isOver || (isReady && isOpponentReady) ? (
              <span className='inline-flex h-11 items-center rounded-lg bg-zinc-800/60 px-5 text-sm font-semibold text-zinc-400'>
                {t("active.settling_short")}
              </span>
            ) : isReady ? (
              <p className='max-w-lg rounded-lg bg-zinc-800/40 px-4 py-3 text-sm leading-relaxed text-zinc-300'>
                {t("ready.locked")}
              </p>
            ) : isConfirming ? (
              // Ready can't be taken back, so it asks once — in place, not in a dialog.
              <div className='rounded-lg bg-zinc-800/40 p-4 sm:p-5'>
                <p className='text-sm font-semibold text-zinc-100'>
                  {t("ready.confirm_title", {
                    score: duel.me.bestScore.toLocaleString(intlLocale),
                  })}
                </p>
                <p className='mt-1.5 max-w-lg text-sm leading-relaxed text-zinc-400'>
                  {isOpponentReady
                    ? t("ready.confirm_body_last")
                    : t("ready.confirm_body")}
                </p>
                <div className='mt-4 flex flex-wrap items-center gap-3'>
                  <button
                    type='button'
                    onClick={lockIn}
                    disabled={ready.isPending}
                    className='inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:pointer-events-none disabled:opacity-50 hover:bg-zinc-200'>
                    {ready.isPending ? (
                      <Loader2 size={16} className='animate-spin' />
                    ) : (
                      <Check size={16} />
                    )}
                    {t("ready.confirm")}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setIsConfirming(false);
                      ready.reset();
                    }}
                    disabled={ready.isPending}
                    className='inline-flex h-11 items-center rounded-lg px-4 text-sm font-semibold text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50 hover:bg-zinc-800 hover:text-zinc-100'>
                    {t("ready.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className='flex flex-wrap items-center gap-3'>
                <Link
                  href={`/practice/duel/${duel.id}`}
                  className='inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 hover:bg-zinc-200'>
                  <Play size={16} className='fill-current' />
                  {hasPlayed ? t("active.beat_best") : t("active.play")}
                </Link>
                {/* Only with a run to lock in — Ready with nothing played would just hand over a walkover. */}
                {hasPlayed && (
                  <button
                    type='button'
                    onClick={() => setIsConfirming(true)}
                    className='inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-800 px-5 text-sm font-semibold text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 hover:bg-zinc-700'>
                    <Check size={16} />
                    {t("ready.button")}
                  </button>
                )}
              </div>
            )}
            {readyErrorText && (
              <p role='alert' className='mt-3 text-sm text-orange-300'>
                {readyErrorText}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
