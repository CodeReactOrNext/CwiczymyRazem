import { useQuery } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { useAccountEmail } from "feature/supporterPanel/hooks/useAccountEmail";
import { fetchRoadmapTeaser } from "feature/supporterPanel/services/roadmapTeaser.service";
import type { RoadmapTeaserItem } from "feature/supporterPanel/types/userRoadmaps.types";
import { levelTone } from "feature/supporterPanel/utils/roadmapGoal";
import { Heart, Lock, Users } from "lucide-react";

/** Tiles past this many are drawn out of focus — enough to read the board, not to browse it. */
const CLEAR_TILES = 3;

const TeaserTile = ({
  item,
  blurred,
}: {
  item: RoadmapTeaserItem;
  blurred: boolean;
}) => (
  <div
    aria-hidden={blurred || undefined}
    className={cn(
      "flex h-full flex-col gap-4 rounded-lg bg-zinc-900/40 p-5",
      blurred && "pointer-events-none select-none blur-[3px]",
    )}>
    <span className='flex items-center justify-between gap-3'>
      {item.level ? (
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-bold",
            levelTone(item.level),
          )}>
          {item.level}
        </span>
      ) : (
        <span />
      )}
      <Lock size={14} className='shrink-0 text-zinc-600' />
    </span>
    <span className='line-clamp-3 text-base font-bold leading-snug text-zinc-100'>
      {item.goal}
    </span>
    <span className='mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500'>
      <span>
        {item.phaseCount} phases · {item.stepCount} steps
      </span>
      {item.followerCount > 0 && (
        <span className='flex items-center gap-1.5'>
          <Users size={13} />
          {item.followerCount} following
        </span>
      )}
    </span>
  </div>
);

/**
 * The board seen through the window: real goals other players are working on,
 * so the ask above is about something that visibly exists. Names stay off, and
 * nothing opens.
 */
const BoardPreview = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["roadmap-teaser"],
    queryFn: fetchRoadmapTeaser,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
        {Array.from({ length: CLEAR_TILES }, (_, index) => (
          <div
            key={index}
            className='h-40 animate-pulse rounded-lg bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }
  if (!data?.roadmaps.length) return null;

  return (
    <section className='space-y-4'>
      <div className='space-y-1'>
        <h2 className='text-sm font-bold text-zinc-200'>
          On the board right now
        </h2>
        <p className='text-sm text-zinc-500'>
          <span className='font-semibold tabular-nums text-zinc-300'>
            {data.total}
          </span>{" "}
          roadmaps from{" "}
          <span className='font-semibold tabular-nums text-zinc-300'>
            {data.players}
          </span>{" "}
          {data.players === 1 ? "player" : "players"}. As a supporter you can
          open any of them and start it for free.
        </p>
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
        {data.roadmaps.map((item, index) => (
          <TeaserTile
            key={`${item.goal}-${index}`}
            item={item}
            blurred={index >= CLEAR_TILES}
          />
        ))}
      </div>
    </section>
  );
};

/**
 * What a player without the badge sees on the Player Roadmaps tab.
 *
 * The curated roadmaps next door stay free; this tab is the one place where a
 * roadmap is written for a single goal by a model that costs money per run, so
 * the copy says so plainly instead of pretending it is a premium perk.
 */
export const PlayerRoadmapsLocked = () => {
  const email = useAccountEmail();

  return (
    <div className='space-y-10'>
      <section className='relative flex flex-col items-start gap-6 overflow-hidden rounded-lg bg-zinc-900/40 p-6 sm:p-8 md:p-10'>
        <HeroPattern
          variant='ai'
          className='opacity-[0.08]'
          maskImage='linear-gradient(to right, black 0%, transparent 55%)'
          gradient={["#fbbf24", "#f97316"]}
        />

        <span className='relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400'>
          <Lock size={22} />
        </span>

        <div className='relative space-y-3'>
          <h2 className='text-xl font-bold text-zinc-100'>
            Build a roadmap around your own goal
          </h2>
          <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
            Player Roadmaps are made to measure: you describe what you want to
            play, and the coach lays out the phases, exercises, lessons and
            songs that get you there. Other players&apos; roadmaps show up here
            too, so you can see what they are working towards.
          </p>
          <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
            Every one of these roadmaps is generated by an AI model, and every
            generation costs real money. riff.quest runs on donations, so this
            tab sits behind the supporter badge. The Mastery Roadmaps tab stays
            free for everyone.
          </p>
          <p className='max-w-2xl text-sm font-semibold leading-relaxed text-amber-200'>
            Any donation, even the smallest one, unlocks Player Roadmaps for
            life. No subscription.
          </p>
        </div>

        <Button asChild size='lg' className='relative'>
          <a href={BMC_URL} target='_blank' rel='noreferrer'>
            <span className='flex items-center gap-2'>
              <Heart size={16} fill='currentColor' />
              Support the project
            </span>
          </a>
        </Button>

        <p className='relative max-w-2xl text-sm leading-relaxed text-zinc-500'>
          Pay with the email this account is on
          {email ? (
            <>
              {" — "}
              <span className='font-bold text-zinc-300'>{email}</span>
            </>
          ) : null}
          , so the donation lands on the right account.
        </p>
      </section>

      <BoardPreview />
    </div>
  );
};
