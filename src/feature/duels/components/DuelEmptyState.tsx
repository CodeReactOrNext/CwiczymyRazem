import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { useTranslation } from "hooks/useTranslation";
import { UserRound } from "lucide-react";

const STEP_COUNT = 3;

interface DuelEmptyStateProps {
  myName: string;
  myAvatar: string;
  /** A ticket is out — the empty seat is being looked for, not just empty. */
  isSearching: boolean;
}

/**
 * No duel running: the face-off with an empty seat across from you. While a
 * ticket waits the seat breathes; before the first duel the three steps that
 * fill it sit underneath.
 */
export const DuelEmptyState = ({
  myName,
  myAvatar,
  isSearching,
}: DuelEmptyStateProps) => {
  const { t } = useTranslation("duels");
  return (
    <Card className='bg-zinc-900/60 p-6 sm:p-8'>
      <div className='flex items-center justify-center gap-6 sm:gap-10'>
        <div className='flex flex-col items-center gap-2'>
          <Avatar avatarURL={myAvatar || undefined} name={myName} size='md' />
          <span className='text-xs font-semibold text-zinc-300'>
            {t("active.you")}
          </span>
        </div>
        <span
          className='font-teko text-5xl font-semibold leading-none text-zinc-700'
          aria-hidden='true'>
          vs
        </span>
        <div className='flex flex-col items-center gap-2'>
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500",
              isSearching && "animate-pulse",
            )}
            aria-hidden='true'>
            <UserRound size={22} />
          </span>
          <span className='text-xs font-semibold text-zinc-500'>?</span>
        </div>
      </div>

      {isSearching ? (
        <p className='mx-auto mt-6 max-w-sm text-center text-sm leading-relaxed text-zinc-400'>
          {t("empty.searching")}
        </p>
      ) : (
        <ol className='mt-8 grid gap-5 sm:grid-cols-3 sm:gap-6'>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <li key={i} className='flex gap-3 sm:flex-col sm:gap-1.5'>
              <span className='font-teko text-2xl font-semibold tabular-nums leading-none text-zinc-500'>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className='text-sm leading-relaxed text-zinc-300'>
                {t(`empty.steps.${i}`)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};
