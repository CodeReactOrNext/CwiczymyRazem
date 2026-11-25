import { AnimeChip, AnimeMoment } from "components/AnimeMoment/AnimeMoment";
import { useTranslation } from "hooks/useTranslation";
import { Flame } from "lucide-react";

/**
 * Full-screen "session complete" transition shown before the summary — the
 * shared anime moment with the session's headline numbers. Kostek shares a
 * layoutId with the summary, so on the way out it flies (and shrinks) straight
 * into its place there.
 */

interface SessionCelebrationProps {
  points: number;
  fame: number;
  streak: number;
  /** A level was gained: knobs "to 11" instead of the party, and the title says so. */
  levelUp?: boolean;
  /** The streak just reached 7, 30, 100 or 365 days — that is the headline. */
  streakMilestone?: boolean;
  onDone: () => void;
}

export const MASCOT_LAYOUT_ID = "session-summary-mascot";

/**
 * Above every screen the summary opens in. After a session the summary lives
 * inside the session's own fixed layer (z-[999999] on a computer,
 * z-[999999999] for the phone summary); at AnimeMoment's default 60 the
 * celebration played underneath it, unseen, and only Kostek's fly-in showed.
 */
export const CELEBRATION_Z_INDEX = 2_000_000_000;

export const SessionCelebration = ({ points, fame, streak, levelUp = false, streakMilestone = false, onDone }: SessionCelebrationProps) => {
  const { t } = useTranslation("session_summary");
  // An ordinary session ends calmly; the full show is kept for what is rare —
  // a new level or a streak milestone — so it still means something then.
  const calm = !levelUp && !streakMilestone;

  return (
    <AnimeMoment
      title={levelUp ? t("level_up") : streakMilestone ? t("celebrate.streak_milestone", { days: streak }) : t("celebrate.title")}
      mood={levelUp ? "levelUp" : "celebrate"}
      layoutId={MASCOT_LAYOUT_ID}
      calm={calm}
      zIndex={CELEBRATION_Z_INDEX}
      onDone={onDone}>
      <AnimeChip index={0} className='text-cyan-400'>
        <img src='/images/tokens/pick.png' alt='' className='h-6 w-6 object-contain' />
        <span className='font-teko text-4xl font-bold leading-none tabular-nums'>+{points}</span>
      </AnimeChip>
      {fame > 0 && (
        <AnimeChip index={1} className='text-amber-400'>
          <img src='/images/tokens/coin.png' alt='' className='h-6 w-6 object-contain' />
          <span className='font-teko text-4xl font-bold leading-none tabular-nums'>+{fame}</span>
        </AnimeChip>
      )}
      {streak > 0 && (
        <AnimeChip index={2} className='text-orange-400'>
          <Flame className='h-6 w-6' aria-hidden />
          <span className='font-teko text-4xl font-bold leading-none tabular-nums'>{t("celebrate.days", { days: streak })}</span>
        </AnimeChip>
      )}
    </AnimeMoment>
  );
};
