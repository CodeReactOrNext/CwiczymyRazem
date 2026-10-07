import { ChallengeCover } from "feature/challenges/components/ChallengeCover";
import type { Challenge } from "feature/challenges/types/challenge.types";
import { challengeMonthLabel } from "feature/challenges/utils/challengeMonth";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { History, Trophy } from "lucide-react";

interface PastChallengesProps {
  challenges: Challenge[];
  onOpen: (challenge: Challenge) => void;
}

/** Closed boards — still browsable, but no longer accepting runs. */
export const PastChallenges = ({ challenges, onOpen }: PastChallengesProps) => {
  const { t } = useTranslation("challenges");
  const intlLocale = useIntlLocale();
  if (challenges.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-24 text-center'>
        <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500'>
          <History size={26} />
        </div>
        <h3 className='mb-1 text-lg font-bold text-white'>{t("archive.empty_title")}</h3>
        <p className='max-w-xs text-sm text-zinc-500'>
          {t("archive.empty_body")}
        </p>
      </div>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {challenges.map((challenge) => (
        <button
          key={challenge.id}
          type='button'
          onClick={() => onOpen(challenge)}
          className='flex items-center gap-4 rounded-xl bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.07]'>
          <ChallengeCover
            songs={challenge.songs}
            className='h-20 w-20 shrink-0 rounded-lg'
            iconSize={24}
          />
          <div className='min-w-0 flex-1 space-y-1'>
            <p className='truncate text-sm font-bold text-white'>
              {challengeMonthLabel(challenge.id, intlLocale)}
            </p>
            <p className='truncate text-xs font-medium text-zinc-500'>
              {t("archive.songs_runs", { songs: challenge.songs.length, runs: challenge.submissionCount ?? 0 })}
            </p>
            {(challenge.finisherCount ?? 0) > 0 && (
              <p className='flex items-center gap-1.5 text-xs font-bold text-amber-300'>
                <Trophy className='h-3 w-3' />
                {t("archive.cleared_it", { count: challenge.finisherCount })}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
