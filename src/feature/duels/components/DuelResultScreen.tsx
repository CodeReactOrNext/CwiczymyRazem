import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Kostek } from "components/Mascot/Kostek";
import { getDuelExercise } from "feature/duels/data/duelPool";
import type {
  DuelOpponentRevealed,
  DuelOverview,
  DuelView,
} from "feature/duels/types/duel.types";
import { formatRatingDelta } from "feature/duels/utils/duelFormat";
import { animate, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { useEffect, useRef } from "react";

/** The rating rolling from before to after, once the bars have filled. */
const RatingCountUp = ({ from, to }: { from: number; to: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (reduceMotion || from === to) {
      node.textContent = String(to);
      return undefined;
    }
    const controls = animate(from, to, {
      duration: 1.1,
      delay: 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        node.textContent = String(Math.round(value));
      },
    });
    return () => controls.stop();
  }, [from, to, reduceMotion]);
  return <span ref={ref}>{reduceMotion ? to : from}</span>;
};

/** One side's best run as a bar, the longer one full width. */
const ScoreBar = ({
  label,
  value,
  max,
  barClass,
  isMuted,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
  isMuted?: boolean;
}) => {
  const intlLocale = useIntlLocale();
  return (
    <div className='grid grid-cols-[6rem_minmax(0,1fr)_4rem] items-center gap-3 text-sm'>
      <span
        className={cn("truncate", isMuted ? "text-zinc-400" : "text-zinc-200")}>
        {label}
      </span>
      <span className='h-3 overflow-hidden rounded-full bg-zinc-800'>
        <motion.span
          className={cn("block h-full rounded-full", barClass)}
          initial={{ width: 0 }}
          animate={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </span>
      <span className='text-right font-semibold tabular-nums text-zinc-50'>
        {value.toLocaleString(intlLocale)}
      </span>
    </div>
  );
};

interface DuelResultScreenProps {
  duel: DuelView;
  overview: Pick<DuelOverview, "rank" | "rankedPlayers" | "isRated">;
  onContinue: () => void;
}

/**
 * A settled duel gets its moment, like the end of a Duolingo lesson: who won,
 * both best runs side by side, the rating rolling to its new value and the
 * place it buys. Shown once per result; History opens it again.
 */
export const DuelResultScreen = ({
  duel,
  overview,
  onContinue,
}: DuelResultScreenProps) => {
  const { t } = useTranslation("duels");
  const result = duel.result ?? "void";
  const opponent = duel.opponent.revealed
    ? (duel.opponent as DuelOpponentRevealed)
    : null;
  const opponentName = opponent?.displayName ?? t("active.anonymous");
  const exercise = getDuelExercise(duel.exerciseId);
  const mine = duel.me.bestScore;
  const theirs = opponent?.bestScore ?? 0;
  const max = Math.max(mine, theirs);
  const delta = duel.ratingDelta ?? 0;
  const before = duel.me.ratingBefore;
  const after = duel.me.ratingAfter ?? before + delta;
  const isWin = result === "won";

  // Why a walkover went the way it did.
  const note =
    result === "void"
      ? null
      : duel.me.attempts === 0
        ? t("recent.no_show_me")
        : opponent && opponent.attempts === 0
          ? t("recent.no_show_them")
          : null;

  return (
    <div className='mx-auto flex w-full max-w-md flex-col items-center gap-7 py-6 text-center sm:py-10'>
      {/* A lost duel is lost to another player: sad, like a failed exam. A draw
          or a void duel has nothing to mourn. (MASCOT.md, `sad`) */}
      <Kostek
        mood={isWin ? "celebrate" : result === "lost" ? "sad" : "idle"}
        className='h-28'
      />

      <div>
        <h2
          className={cn(
            "text-4xl font-bold leading-none",
            isWin ? "text-zinc-50" : "text-zinc-200",
          )}>
          {t(`result.${result}`)}
        </h2>
        <p className='mt-3 text-sm text-zinc-400'>
          {t("result.vs", { name: opponentName })}
          {exercise && ` · ${exercise.title}`}
        </p>
        {note && <p className='mt-1 text-sm text-zinc-500'>{note}</p>}
      </div>

      {result !== "void" && (
        <div className='flex w-full flex-col gap-3 text-left'>
          <ScoreBar
            label={t("active.you")}
            value={mine}
            max={max}
            barClass={isWin ? "bg-emerald-400" : "bg-zinc-300"}
          />
          <ScoreBar
            label={opponentName}
            value={theirs}
            max={max}
            barClass={result === "lost" ? "bg-zinc-300" : "bg-zinc-600"}
            isMuted
          />
        </div>
      )}

      <div className='grid w-full grid-cols-2 gap-3 text-left'>
        <div className='rounded-lg bg-zinc-800/40 p-5 sm:p-6'>
          <p className='text-xs font-semibold text-zinc-500'>
            {t("result.elo")}
          </p>
          <p className='mt-2 flex items-baseline gap-2'>
            <span className='font-teko text-4xl font-semibold tabular-nums leading-none text-zinc-50'>
              <RatingCountUp from={before} to={after} />
            </span>
            {result !== "void" && (
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  delta > 0 ? "text-emerald-400" : "text-zinc-400",
                )}>
                {formatRatingDelta(delta)}
              </span>
            )}
          </p>
          <p className='mt-1 text-xs tabular-nums text-zinc-500'>
            {t("result.was", { rating: before })}
          </p>
        </div>
        <div className='rounded-lg bg-zinc-800/40 p-5 sm:p-6'>
          <p className='text-xs font-semibold text-zinc-500'>
            {t("result.place")}
          </p>
          {overview.isRated && overview.rank ? (
            <>
              <p className='mt-2 font-teko text-4xl font-semibold tabular-nums leading-none text-zinc-50'>
                #{overview.rank}
              </p>
              <p className='mt-1 text-xs tabular-nums text-zinc-500'>
                {t("result.place_of", { total: overview.rankedPlayers })}
              </p>
            </>
          ) : (
            <p className='mt-2 text-sm text-zinc-400'>{t("result.unranked")}</p>
          )}
        </div>
      </div>

      <Button
        size='lg'
        onClick={onContinue}
        className='w-full'>
        {t("result.continue")}
      </Button>
    </div>
  );
};
