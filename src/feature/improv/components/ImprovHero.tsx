import { Button } from "assets/components/ui/button";
import {
  FameIcon,
  PointsIcon,
} from "feature/challenges/components/RewardIcons";
import {
  ImprovFaceStack,
  improvPlayers,
} from "feature/improv/components/ImprovFaces";
import { TrackPlayer } from "feature/improv/components/TrackPlayer";
import type {
  ImprovRound,
  ImprovTake,
} from "feature/improv/types/improv.types";
import {
  IMPROV_FAME_FOR_JOINING,
  IMPROV_POINTS_PER_TAKE,
} from "feature/improv/types/improv.types";
import {
  improvDateRange,
  improvTimeLeft,
} from "feature/improv/utils/improvRound";
import { useTranslation } from "hooks/useTranslation";
import { Link2, Music2 } from "lucide-react";
import type { ReactNode } from "react";
import { FaDiscord } from "react-icons/fa6";

interface ImprovHeroProps {
  round: ImprovRound;
  takes: ImprovTake[];
  now: number;
  discordUrl: string;
  onLinkTake: () => void;
}

const RewardChip = ({
  icon,
  amount,
  label,
}: {
  icon: ReactNode;
  amount: number;
  label: string;
}) => (
  <span className='inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-300'>
    {icon}
    <span className='font-bold text-white'>+{amount}</span>
    {label}
  </span>
);

/**
 * The live round: the backing track on the left, everything a player needs to
 * know about it on the right — how long it runs, what it is, what a
 * take pays, and the two things to do (link a take, go to the thread).
 *
 * Painted dark in both themes: the art behind it is a night scene.
 */
export const ImprovHero = ({
  round,
  takes,
  now,
  discordUrl,
  onLinkTake,
}: ImprovHeroProps) => {
  const { t } = useTranslation("improv");
  const left = improvTimeLeft(round.endsAt, now);
  const players = improvPlayers(takes);

  return (
    <section className='force-dark relative overflow-hidden rounded-lg bg-zinc-900'>
      <img
        src='/images/improv/hero.webp'
        alt=''
        className='absolute inset-0 hidden h-full w-full object-cover object-right lg:block'
      />
      <div className='absolute inset-0 hidden bg-gradient-to-r from-zinc-950 via-zinc-950/90 via-55% to-zinc-950/30 lg:block' />

      <div className='relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-10 lg:p-8'>
        <TrackPlayer
          youtubeId={round.youtubeId}
          title={round.title}
          label={t("hero.track_label", { number: round.number })}
        />

        <div className='flex min-w-0 flex-col gap-5'>
          <div className='flex flex-wrap items-start justify-between gap-x-8 gap-y-4'>
            <div className='min-w-0 space-y-2'>
              <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold'>
                <span className='flex items-center gap-1.5 text-amber-300'>
                  <Music2 className='h-3.5 w-3.5' />
                  {t("hero.eyebrow", { number: round.number })}
                </span>
                <span className='h-1 w-1 rounded-full bg-zinc-600' />
                <span className='font-medium text-zinc-400'>
                  {left.unit === "over"
                    ? t("hero.over")
                    : t(`hero.left_${left.unit}`, { count: left.count })}
                  {" · "}
                  {improvDateRange(round.startsAt, round.endsAt)}
                </span>
              </p>
              <h1 className='text-3xl font-bold leading-tight text-white md:text-4xl'>
                {round.title}
              </h1>
              {round.channel && (
                <p className='text-sm text-zinc-400'>{round.channel}</p>
              )}
            </div>

            <div className='flex shrink-0 flex-col gap-2 lg:items-end'>
              <span className='text-xs text-zinc-400'>
                {t("hero.takes_so_far")}
              </span>
              <span className='text-4xl font-black tabular-nums leading-none text-white'>
                {takes.length}
              </span>
              <span className='text-xs text-zinc-400'>
                {t("hero.players", { count: players.length })}
              </span>
              <ImprovFaceStack players={players} />
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            <RewardChip
              icon={<PointsIcon />}
              amount={IMPROV_POINTS_PER_TAKE}
              label={t("hero.points_per_take")}
            />
            <RewardChip
              icon={<FameIcon />}
              amount={IMPROV_FAME_FOR_JOINING}
              label={t("hero.fame_for_joining")}
            />
          </div>

          <div className='mt-auto flex flex-wrap gap-3 pt-1'>
            <Button onClick={onLinkTake} className='h-11 px-5'>
              <span className='flex items-center gap-2'>
                <Link2 />
                {t("hero.cta")}
              </span>
            </Button>
            <Button asChild variant='subtle' className='h-11 px-5'>
              <a href={discordUrl} target='_blank' rel='noreferrer'>
                <FaDiscord size='1em' />
                {round.discordThreadUrl
                  ? t("hero.discord_thread")
                  : t("hero.discord_join")}
              </a>
            </Button>
          </div>

          {round.uploadedByName && (
            <p className='text-xs text-zinc-500'>
              {t("hero.track_by", { name: round.uploadedByName })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
