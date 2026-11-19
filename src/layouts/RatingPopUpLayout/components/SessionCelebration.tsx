import { AnimeChip, AnimeMoment } from "components/AnimeMoment/AnimeMoment";
import { useTranslation } from "hooks/useTranslation";
import { Flame } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Full-screen "session complete" transition shown before the summary — the
 * shared anime moment with the session's headline numbers. Riff shares a
 * layoutId with the summary card, so on the way out he flies (and shrinks)
 * straight into his place there.
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

export const RIFF_LAYOUT_ID = "session-summary-riff";

// The full moment plays once a day; later sessions that day get the short cut,
// so the third session in a row does not sit through the whole show again.
const FULL_SHOWN_KEY = "riff-moment-full-day";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const fullShownToday = () => {
  try {
    return window.localStorage.getItem(FULL_SHOWN_KEY) === today();
  } catch {
    return false;
  }
};

export const SessionCelebration = ({ points, fame, streak, levelUp = false, streakMilestone = false, onDone }: SessionCelebrationProps) => {
  const { t } = useTranslation("session_summary");
  // A new level or a streak milestone always gets the full show.
  const [brief] = useState(() => !levelUp && !streakMilestone && fullShownToday());
  useEffect(() => {
    if (brief) return;
    try {
      window.localStorage.setItem(FULL_SHOWN_KEY, today());
    } catch {
      // Storage blocked: every session gets the full moment, which is fine.
    }
  }, [brief]);

  return (
    <AnimeMoment
      title={levelUp ? t("level_up") : streakMilestone ? t("celebrate.streak_milestone", { days: streak }) : t("celebrate.title")}
      mood={levelUp ? "levelUp" : "celebrate"}
      layoutId={RIFF_LAYOUT_ID}
      brief={brief}
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
