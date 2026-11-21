import { Button, buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Kostek } from "components/Mascot/Kostek";
import {
  DuelCountdown,
  DuelFuse,
  SearchingDots,
} from "feature/duels/components/DuelBits";
import { getDuelExercise } from "feature/duels/data/duelPool";
import type { DuelView } from "feature/duels/types/duel.types";
import { formatTimeLeft } from "feature/duels/utils/duelFormat";
import { DUEL_REMIND_BEFORE_MS } from "feature/duels/utils/duelRules";
import type { DuelSlot } from "feature/duels/utils/duelScreens";
import { isFreshDuel } from "feature/duels/utils/duelScreens";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Check, Play, Swords } from "lucide-react";
import Link from "next/link";

/** Roomier from `lg` up: on a desktop the three tiles are the page, so they get the space. */
const TILE =
  "flex min-h-[15.5rem] flex-col gap-4 rounded-2xl p-5 lg:min-h-[19rem] lg:gap-6 lg:p-6";

/**
 * One running duel, cut down to what decides the next tap: what to play, how
 * long is left, your best and how hard the opponent is trying — and one key.
 * The whole tile opens the duel screen; the key goes straight to playing.
 */
const ActiveTile = ({ duel, now }: { duel: DuelView; now: number }) => {
  const { t } = useTranslation("duels");
  const intlLocale = useIntlLocale();
  const exercise = getDuelExercise(duel.exerciseId);
  const title = exercise?.title ?? duel.exerciseId;
  const msLeft = duel.endsAt - now;
  const isOver = msLeft <= 0;
  const isEnding = !isOver && msLeft <= DUEL_REMIND_BEFORE_MS;
  const hasPlayed = duel.me.attempts > 0;
  const opponentReady = !duel.opponent.revealed && duel.opponent.isReady;
  const isNew = isFreshDuel(duel, now);

  return (
    <div
      className={cn(
        TILE,
        "group relative bg-zinc-900/60 transition-colors hover:bg-zinc-900",
      )}>
      <div>
        <p className='flex items-center gap-1.5 text-xs font-medium text-zinc-400 lg:text-sm'>
          {isNew && (
            <>
              <span className='font-semibold text-cyan-400'>
                {t("slots.new")}
              </span>
              <span aria-hidden='true'>·</span>
            </>
          )}
          {t(`category.${exercise?.category ?? "technique"}`)}
        </p>
        {/* The stretched link: the whole tile opens the duel, the key below sits above it. */}
        <Link
          href={{ pathname: "/duels", query: { duel: duel.id } }}
          shallow
          aria-label={t("slots.open_aria", { title })}
          className='mt-1 block text-lg font-semibold leading-tight text-zinc-50 [text-wrap:balance] after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-zinc-500 lg:mt-1.5 lg:text-2xl'>
          {title}
        </Link>
      </div>

      <div>
        <DuelFuse
          createdAt={duel.createdAt}
          endsAt={duel.endsAt}
          now={now}
          isEnding={isEnding}
        />
        <p className='mt-1.5 flex items-baseline justify-between text-xs text-zinc-400 lg:mt-2 lg:text-sm'>
          {isOver ? (
            <span className='font-semibold text-zinc-400'>
              {t("active.settling")}
            </span>
          ) : (
            <DuelCountdown
              endsAt={duel.endsAt}
              isEnding={isEnding}
              className={cn(
                "font-openSans text-xs font-semibold lg:text-sm",
                isEnding ? "text-orange-400" : "text-zinc-300",
              )}
            />
          )}
          <span>{isOver ? t("active.settling_short") : t("slots.left")}</span>
        </p>
      </div>

      <div className='mt-auto flex items-end justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs text-zinc-400 lg:text-sm'>{t("slots.you")}</p>
          <p
            className={cn(
              "font-teko text-4xl font-semibold tabular-nums leading-[0.9] lg:mt-1 lg:text-5xl",
              hasPlayed ? "text-zinc-50" : "text-zinc-700",
            )}>
            {hasPlayed ? duel.me.bestScore.toLocaleString(intlLocale) : "—"}
          </p>
        </div>
        <span
          className='pb-1 font-teko text-2xl leading-none text-zinc-600 lg:text-3xl'
          aria-hidden='true'>
          vs
        </span>
        <div className='min-w-0 text-right'>
          <p className='truncate text-xs text-zinc-400 lg:text-sm'>
            {t("slots.opp_attempts", { count: duel.opponent.attempts })}
            {opponentReady && ` · ${t("slots.opp_ready")}`}
          </p>
          <p
            className='font-teko text-4xl font-semibold leading-[0.9] text-zinc-700 lg:mt-1 lg:text-5xl'
            aria-hidden='true'>
            {duel.opponent.attempts > 0 ? "???" : "—"}
          </p>
        </div>
      </div>

      {isOver || duel.me.isReady ? (
        <p className='flex h-11 items-center gap-2 text-sm font-semibold text-emerald-400 lg:h-12 lg:text-base'>
          {duel.me.isReady && (
            <>
              <Check size={16} />
              {t("slots.locked")}
            </>
          )}
        </p>
      ) : (
        <Link
          href={`/practice/duel/${duel.id}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "relative z-10 h-11 w-full border-b-zinc-400 bg-white text-zinc-950 hover:bg-zinc-200 lg:h-12 lg:text-base",
          )}>
          <Play className='fill-current' />
          {hasPlayed ? t("active.beat_best") : t("active.play")}
        </Link>
      )}
    </div>
  );
};

/** A ticket still out: Kostek drums his fingers until someone joins. */
const SearchingTile = ({
  expiresAt,
  now,
  onCancel,
  isCancelling,
}: {
  expiresAt: number;
  now: number;
  onCancel: () => void;
  isCancelling: boolean;
}) => {
  const { t } = useTranslation("duels");
  return (
    <div
      className={cn(
        TILE,
        "items-center justify-center bg-zinc-900/60 text-center",
      )}>
      <Kostek mood='wait' className='h-16 lg:h-20' />
      <p className='flex items-center gap-2 font-semibold text-zinc-100 lg:text-lg'>
        {t("slots.searching")}
        <SearchingDots />
      </p>
      <p className='max-w-[16rem] text-sm text-zinc-400 lg:text-base'>
        {t("slots.searching_expires", {
          time: formatTimeLeft(expiresAt - now),
        })}
      </p>
      <Button
        variant='ghost'
        size='sm'
        onClick={onCancel}
        disabled={isCancelling}>
        {t("slots.cancel")}
      </Button>
    </div>
  );
};

/** An empty seat: the key that starts a duel, and whether someone is already waiting. */
const FreeTile = ({
  waitingOthers,
  onJoin,
  disabled,
}: {
  waitingOthers: number;
  onJoin: () => void;
  disabled: boolean;
}) => {
  const { t } = useTranslation("duels");
  return (
    <div
      className={cn(
        TILE,
        "items-center justify-center text-center outline-dashed outline-2 -outline-offset-2 outline-zinc-800",
      )}>
      <p className='text-sm text-zinc-400 lg:text-base'>{t("slots.free")}</p>
      <Button
        size='lg'
        onClick={onJoin}
        disabled={disabled}
        className='h-11 border-b-zinc-400 bg-white text-zinc-950 hover:bg-zinc-200 lg:h-12 lg:px-6 lg:text-base'>
        <Swords />
        {t("join.confirm")}
      </Button>
      {waitingOthers > 0 && (
        <p className='flex items-center gap-2 text-xs text-zinc-400 lg:text-sm'>
          <span className='size-1.5 rounded-full bg-cyan-400' />
          {t("queue.waiting", { count: waitingOthers })}
        </p>
      )}
    </div>
  );
};

interface DuelSlotTileProps {
  slot: DuelSlot;
  now: number;
  waitingOthers: number;
  onJoin: () => void;
  joinDisabled: boolean;
  onCancel: (ticketId: string) => void;
  isCancelling: boolean;
}

export const DuelSlotTile = ({
  slot,
  now,
  waitingOthers,
  onJoin,
  joinDisabled,
  onCancel,
  isCancelling,
}: DuelSlotTileProps) => {
  if (slot.kind === "active") return <ActiveTile duel={slot.duel} now={now} />;
  if (slot.kind === "searching") {
    return (
      <SearchingTile
        expiresAt={slot.expiresAt}
        now={now}
        onCancel={() => onCancel(slot.ticketId)}
        isCancelling={isCancelling}
      />
    );
  }
  return (
    <FreeTile
      waitingOthers={waitingOthers}
      onJoin={onJoin}
      disabled={joinDisabled}
    />
  );
};
