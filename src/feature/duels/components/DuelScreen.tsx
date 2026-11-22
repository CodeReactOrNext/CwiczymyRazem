import { Button, buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import Avatar from "components/UI/Avatar";
import {
  AttemptTicks,
  DuelCountdown,
  DuelFuse,
} from "feature/duels/components/DuelBits";
import { getDuelExercise } from "feature/duels/data/duelPool";
import { useMarkDuelReady } from "feature/duels/hooks/useDuels";
import { duelErrorCode } from "feature/duels/services/duels.service";
import type { DuelView } from "feature/duels/types/duel.types";
import { DUEL_REMIND_BEFORE_MS } from "feature/duels/utils/duelRules";
import { TabPreviewGlyph } from "feature/landing/components/TabPreviewGlyph";
import { getTabPreview } from "feature/landing/lib/tabPreview";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { ArrowLeft, Check, Play, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/** "3 attempts · Ready" under a side's score — or one line before the first run. */
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
    return <p className='text-xs text-zinc-500'>{emptyText}</p>;
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        isOpponent ? "items-end" : "items-start",
      )}>
      <AttemptTicks
        count={attempts}
        align={isOpponent ? "end" : "start"}
        tone={isOpponent ? "muted" : "light"}
      />
      <p className='text-xs tabular-nums text-zinc-400'>
        {t("active.attempts", { count: attempts })}
        {isReady && (
          <span className='font-semibold text-emerald-400'>
            {" "}
            · {t("ready.badge")}
          </span>
        )}
      </p>
    </div>
  );
};

interface DuelScreenProps {
  uid: string | null;
  duel: DuelView;
  now: number;
  myName: string;
  myAvatar: string;
  /** Both pressed Ready and the duel settled on the spot. */
  onSettledEarly: (duelId: string) => void;
}

/**
 * One running duel on its own screen, like the start of a Duolingo lesson:
 * the clock burning down along the top, the exercise, the face-off, and Play
 * at the bottom. Ready — the one irreversible step — asks first.
 */
export const DuelScreen = ({
  uid,
  duel,
  now,
  myName,
  myAvatar,
  onSettledEarly,
}: DuelScreenProps) => {
  const { t } = useTranslation("duels");
  const intlLocale = useIntlLocale();
  const ready = useMarkDuelReady(uid, onSettledEarly);
  const [isConfirming, setIsConfirming] = useState(false);
  const exercise = getDuelExercise(duel.exerciseId);
  const tabPreview = useMemo(
    () => getTabPreview(exercise?.tablature),
    [exercise],
  );

  const msLeft = duel.endsAt - now;
  const isOver = msLeft <= 0;
  const isEnding = !isOver && msLeft <= DUEL_REMIND_BEFORE_MS;
  const hasPlayed = duel.me.attempts > 0;
  const isReady = duel.me.isReady;
  const isOpponentReady = !duel.opponent.revealed && duel.opponent.isReady;
  const opponentAttempts = duel.opponent.attempts;
  const score = (value: number) => value.toLocaleString(intlLocale);

  const readyErrorCode = ready.isError ? duelErrorCode(ready.error) : null;
  const readyErrorText =
    readyErrorCode === "NO_RUN"
      ? t("ready.error_no_run")
      : readyErrorCode === "CLOSED"
        ? t("ready.error_closed")
        : ready.isError
          ? t("ready.error")
          : null;

  const lockIn = () =>
    ready.mutate(duel.id, { onSuccess: () => setIsConfirming(false) });

  return (
    <div className='mx-auto flex w-full max-w-xl flex-col gap-8'>
      <div className='flex items-center gap-4'>
        <Link
          href='/duels'
          shallow
          aria-label={t("duel.back")}
          title={t("duel.back")}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "shrink-0",
          )}>
          <ArrowLeft />
        </Link>
        <DuelFuse
          createdAt={duel.createdAt}
          endsAt={duel.endsAt}
          now={now}
          isEnding={isEnding}
          className='h-2.5 flex-1'
        />
      </div>

      <div>
        <p className='text-xs font-medium text-zinc-500'>
          {t(`category.${exercise?.category ?? "technique"}`)}
        </p>
        <h2 className='mt-1.5 text-2xl font-semibold leading-tight text-zinc-50 [text-wrap:balance] sm:text-3xl'>
          {exercise?.title ?? duel.exerciseId}
        </h2>
        {tabPreview.length > 0 && (
          <TabPreviewGlyph
            notes={tabPreview}
            className='mt-5 h-auto w-full max-w-[16rem]'
          />
        )}
      </div>

      <div>
        {isOver ? (
          <span className='font-teko text-6xl font-semibold tabular-nums leading-[0.85] text-zinc-500'>
            00:00:00
          </span>
        ) : (
          <DuelCountdown
            endsAt={duel.endsAt}
            isEnding={isEnding}
            className='text-6xl leading-[0.85]'
          />
        )}
        <p className='mt-1 text-xs text-zinc-500'>
          {isOver ? t("active.settling") : t("duel.left")}
        </p>
      </div>

      {/* The face-off: you with your best, the opponent as a silhouette and a row of attempts. */}
      <div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-zinc-800/40 p-5 sm:gap-6 sm:p-6'>
        <div className='flex min-w-0 flex-col gap-3'>
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
          <div>
            <p
              className={cn(
                "font-teko text-5xl font-semibold tabular-nums leading-none sm:text-6xl",
                hasPlayed ? "text-zinc-50" : "text-zinc-700",
              )}>
              {hasPlayed ? score(duel.me.bestScore) : "—"}
            </p>
            {hasPlayed && duel.me.bestAccuracy > 0 && (
              <p className='mt-1 text-xs tabular-nums text-zinc-400'>
                {duel.me.bestBpm
                  ? t("duel.run_details", {
                      accuracy: duel.me.bestAccuracy,
                      bpm: duel.me.bestBpm,
                    })
                  : `${duel.me.bestAccuracy}%`}
              </p>
            )}
          </div>
          <SideStatus
            attempts={duel.me.attempts}
            isReady={isReady}
            emptyText={t("active.no_run")}
          />
        </div>

        <span
          className='font-teko text-4xl font-semibold leading-none text-zinc-700'
          aria-hidden='true'>
          vs
        </span>

        <div className='flex min-w-0 flex-col items-end gap-3 text-right'>
          <div className='flex flex-row-reverse items-center gap-2.5'>
            <span
              className='flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500'
              aria-hidden='true'>
              <UserRound className='h-5 w-5' />
            </span>
            <span className='truncate text-sm font-semibold text-zinc-400'>
              {t("active.anonymous")}
            </span>
          </div>
          <p className='font-teko text-5xl font-semibold leading-none text-zinc-700 sm:text-6xl'>
            <span aria-hidden='true'>{opponentAttempts > 0 ? "???" : "—"}</span>
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

      <div className='flex flex-col gap-3'>
        {isOver || (isReady && isOpponentReady) ? (
          <p className='rounded-lg bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300'>
            {t("active.settling_short")}
          </p>
        ) : isReady ? (
          <p className='flex items-start gap-3 rounded-lg bg-zinc-800/40 px-4 py-3 text-sm leading-relaxed text-zinc-300'>
            <Check size={16} className='mt-0.5 shrink-0 text-emerald-400' />
            {t("ready.locked")}
          </p>
        ) : (
          <>
            <Link
              href={`/practice/duel/${duel.id}`}
              className={cn(
                buttonVariants({ size: "xl" }),
                "w-full",
              )}>
              <Play className='fill-current' />
              {hasPlayed ? t("active.beat_best") : t("active.play")}
            </Link>
            {/* Only with a run to lock in — Ready with nothing played would just hand over a walkover. */}
            {hasPlayed && (
              <Button
                variant='ghost'
                size='lg'
                className='w-full'
                onClick={() => setIsConfirming(true)}>
                <Check />
                {t("ready.button")}
              </Button>
            )}
          </>
        )}
        {readyErrorText && !isConfirming && (
          <p role='alert' className='text-sm text-orange-300'>
            {readyErrorText}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={(open) => {
          setIsConfirming(open);
          if (!open) ready.reset();
        }}
        title={t("ready.confirm_title", { score: score(duel.me.bestScore) })}
        description={
          isOpponentReady
            ? t("ready.confirm_body_last")
            : t("ready.confirm_body")
        }
        cancelLabel={t("ready.cancel")}
        confirmLabel={t("ready.confirm")}
        loading={ready.isPending}
        onConfirm={lockIn}>
        {readyErrorText && (
          <p role='alert' className='text-sm text-orange-300'>
            {readyErrorText}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
};
