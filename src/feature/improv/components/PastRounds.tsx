import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { TakeGrid } from "feature/improv/components/TakeCard";
import { TrackPlayer } from "feature/improv/components/TrackPlayer";
import { useImprovRoundTakes } from "feature/improv/hooks/useImprov";
import type { ImprovRound } from "feature/improv/types/improv.types";
import { improvDateRange } from "feature/improv/utils/improvRound";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa6";

interface PastRoundsProps {
  rounds: ImprovRound[];
  uid: string | null;
  isAdmin: boolean;
}

const PastRoundTakes = ({
  round,
  uid,
  isAdmin,
}: {
  round: ImprovRound;
  uid: string | null;
  isAdmin: boolean;
}) => {
  const { t } = useTranslation("improv");
  const { data: takes, isLoading } = useImprovRoundTakes(round.id);

  if (isLoading || !takes) {
    return (
      <div className='grid gap-4 sm:grid-cols-2'>
        <Skeleton variant='block' className='aspect-video w-full' />
        <Skeleton variant='block' className='aspect-video w-full' />
      </div>
    );
  }
  if (takes.length === 0) {
    return <p className='text-sm text-zinc-400'>{t("past.no_takes")}</p>;
  }
  return <TakeGrid takes={takes} uid={uid} canModerate={isAdmin} />;
};

/** Closed rounds: still playable, still watchable, and their threads are still open. */
export const PastRounds = ({ rounds, uid, isAdmin }: PastRoundsProps) => {
  const { t } = useTranslation("improv");
  const [openId, setOpenId] = useState<string | null>(null);

  if (rounds.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500'>
          <History size={26} />
        </div>
        <h3 className='mb-1 text-lg font-bold text-zinc-100'>
          {t("past.empty_title")}
        </h3>
        <p className='max-w-sm text-sm text-zinc-400'>{t("past.empty_body")}</p>
      </div>
    );
  }

  return (
    <ol className='flex flex-col gap-3'>
      {rounds.map((round) => {
        const isOpen = openId === round.id;
        return (
          <li key={round.id}>
            <div className='flex flex-wrap items-center gap-4 rounded-lg bg-zinc-800/40 p-4'>
              <TrackPlayer
                variant='thumb'
                youtubeId={round.youtubeId}
                title={round.title}
              />
              <div className='min-w-0 flex-1 basis-48'>
                <p className='truncate text-base font-semibold text-zinc-100'>
                  {round.title}
                </p>
                <p className='mt-0.5 text-sm text-zinc-400'>
                  #{String(round.number).padStart(2, "0")}
                  {" · "}
                  {improvDateRange(round.startsAt, round.endsAt)}
                  {" · "}
                  {t("side.takes", { count: round.takeCount })}
                </p>
              </div>

              <div className='ml-auto flex items-center gap-2'>
                {round.discordThreadUrl && (
                  <Button asChild variant='ghost' size='icon'>
                    <a
                      href={round.discordThreadUrl}
                      target='_blank'
                      rel='noreferrer'
                      aria-label={t("hero.discord_thread")}
                      title={t("hero.discord_thread")}>
                      <FaDiscord size='1em' />
                    </a>
                  </Button>
                )}
                <Button
                  type='button'
                  variant='ghost'
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : round.id)}
                  className='h-10 px-4'>
                  <span className='flex items-center gap-2'>
                    {t("past.view_takes")}
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </span>
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className='mb-5 mt-4'>
                <PastRoundTakes round={round} uid={uid} isAdmin={isAdmin} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};
