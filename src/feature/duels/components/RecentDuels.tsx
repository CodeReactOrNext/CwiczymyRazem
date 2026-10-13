import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { FormGuide } from "feature/duels/components/DuelBits";
import { getDuelExercise } from "feature/duels/data/duelPool";
import type {
  DuelOpponentRevealed,
  DuelView,
} from "feature/duels/types/duel.types";
import {
  formatRatingDelta,
  recentForm,
  scoreShare,
} from "feature/duels/utils/duelFormat";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { History } from "lucide-react";
import { useMemo } from "react";

interface RecentDuelsProps {
  duels: DuelView[];
  highlightedId?: string | null;
}

/** How many results the header's form guide covers. */
const FORM_LENGTH = 10;

const RESULT_STYLE: Record<NonNullable<DuelView["result"]>, string> = {
  won: "bg-emerald-500/10 text-emerald-400",
  lost: "bg-zinc-800/60 text-zinc-300",
  draw: "bg-zinc-800/60 text-zinc-300",
  void: "bg-zinc-800/40 text-zinc-500",
};

/** Your segment of the split, coloured by how the duel went. */
const MY_SEGMENT: Record<"won" | "lost" | "draw", string> = {
  won: "bg-emerald-400",
  lost: "bg-zinc-400",
  draw: "bg-zinc-300",
};

/**
 * The two best runs as one split bar — yours from the left, theirs from the
 * right — so a landslide and a photo finish look different at a glance.
 */
const ScoreSplit = ({
  mine,
  theirs,
  result,
}: {
  mine: number;
  theirs: number;
  result: "won" | "lost" | "draw";
}) => {
  const share = scoreShare(mine, theirs);
  if (share === null) return null;
  return (
    <span
      className='flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full'
      aria-hidden='true'>
      {share > 0 && (
        <span
          className={cn("h-full", MY_SEGMENT[result])}
          style={{ width: `${share * 100}%` }}
        />
      )}
      {share < 1 && <span className='h-full flex-1 bg-zinc-700' />}
    </span>
  );
};

const RecentDuelRow = ({
  duel,
  isHighlighted,
}: {
  duel: DuelView;
  isHighlighted: boolean;
}) => {
  const { t } = useTranslation("duels");
  const intlLocale = useIntlLocale();
  const result = duel.result ?? "void";
  const opponent = duel.opponent.revealed
    ? (duel.opponent as DuelOpponentRevealed)
    : null;
  const exercise = getDuelExercise(duel.exerciseId);
  const delta = duel.ratingDelta ?? 0;
  const score = (value: number) => value.toLocaleString(intlLocale);

  // Who never sent a run — the reason a walkover went the way it did.
  const note =
    result === "void"
      ? t("recent.nobody_played")
      : duel.me.attempts === 0
        ? t("recent.no_show_me")
        : opponent && opponent.attempts === 0
          ? t("recent.no_show_them")
          : null;

  return (
    <li
      id={`duel-${duel.id}`}
      className={cn(
        "-mx-3 flex scroll-mt-24 flex-wrap items-center gap-x-5 gap-y-3 rounded-lg px-3 py-3.5 transition-colors hover:bg-zinc-800/30",
        isHighlighted && "bg-zinc-800/60 hover:bg-zinc-800/60",
      )}>
      <span
        className={cn(
          "w-[4.5rem] shrink-0 rounded px-2 py-1 text-center text-xs font-semibold",
          RESULT_STYLE[result],
        )}>
        {t(`recent.${result}`)}
      </span>

      <div className='flex min-w-0 flex-[1_1_11rem] items-center gap-3'>
        {opponent ? (
          <Avatar
            avatarURL={opponent.avatar || undefined}
            name={opponent.displayName}
            size='xs'
            className='shrink-0'
          />
        ) : (
          <span
            className='size-8 shrink-0 rounded-full bg-zinc-800'
            aria-hidden='true'
          />
        )}
        <div className='min-w-0'>
          <p className='truncate text-sm text-zinc-200'>
            <span className='text-zinc-500'>{t("recent.vs")} </span>
            <span className='font-semibold'>
              {opponent?.displayName ?? t("active.anonymous")}
            </span>
          </p>
          <p className='truncate text-xs text-zinc-400'>
            {note ?? exercise?.title ?? duel.exerciseId}
          </p>
        </div>
      </div>

      {result !== "void" && (
        <div className='w-full shrink-0 sm:w-44'>
          <p className='flex items-baseline justify-between gap-2 text-sm tabular-nums'>
            <span
              className={cn(
                "font-semibold",
                result === "lost" ? "text-zinc-300" : "text-zinc-50",
              )}>
              {score(duel.me.bestScore)}
            </span>
            <span
              className={cn(
                "font-semibold",
                result === "lost" ? "text-zinc-50" : "text-zinc-500",
              )}>
              {score(opponent?.bestScore ?? 0)}
            </span>
          </p>
          <div className='mt-1.5'>
            <ScoreSplit
              mine={duel.me.bestScore}
              theirs={opponent?.bestScore ?? 0}
              result={result}
            />
          </div>
        </div>
      )}

      <span
        className={cn(
          "ml-auto w-14 shrink-0 text-right font-teko text-2xl font-semibold tabular-nums leading-none",
          delta > 0 ? "text-emerald-400" : "text-zinc-500",
        )}>
        {result === "void" ? "—" : formatRatingDelta(delta)}
      </span>
    </li>
  );
};

/** Settled duels, newest first — the opponent finally has a name. */
export const RecentDuels = ({ duels, highlightedId }: RecentDuelsProps) => {
  const { t } = useTranslation("duels");
  const form = useMemo(() => recentForm(duels, FORM_LENGTH), [duels]);
  return (
    <Card className='p-5 sm:p-7'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='flex items-center gap-2 text-base font-semibold text-zinc-100'>
          <History size={16} className='text-zinc-400' />
          {t("recent.title")}
        </h2>
        <FormGuide form={form} />
      </div>
      {duels.length === 0 ? (
        <p className='mt-4 text-sm text-zinc-400'>{t("recent.empty")}</p>
      ) : (
        <ul className='mt-5 space-y-1'>
          {duels.map((duel) => (
            <RecentDuelRow
              key={duel.id}
              duel={duel}
              isHighlighted={duel.id === highlightedId}
            />
          ))}
        </ul>
      )}
    </Card>
  );
};
