import { getSongTier } from "feature/songs/utils/getSongTier";
import { Clock, Gauge, Star, Users } from "lucide-react";

import type { GuideLiveData, SongGuide } from "../types";

interface GuideStatsBarProps {
  guide: SongGuide;
  liveData: GuideLiveData;
}

export const GuideStatsBar = ({ guide, liveData }: GuideStatsBarProps) => {
  const live = liveData.song;
  const difficulty = live?.avgDifficulty || guide.editorial.difficulty;
  const tier = getSongTier(difficulty);
  const isLive = Boolean(live && live.avgDifficulty > 0);

  const stats = [
    {
      icon: Gauge,
      label: "Difficulty",
      value: `${difficulty.toFixed(1)} / 10`,
      color: tier.color,
    },
    {
      icon: Star,
      label: isLive ? "Community ratings" : "Rating source",
      value: isLive ? `${live?.ratingsCount}` : "Riff Quest editors",
      color: undefined,
    },
    {
      icon: Users,
      label: "Guitarists tracking it",
      value:
        live && live.popularity > 0 ? `${live.popularity}` : "Join the first",
      color: undefined,
    },
    {
      icon: Clock,
      label: "Typical time to learn",
      value: guide.editorial.timeToLearn,
      color: undefined,
    },
  ];

  return (
    <section className='mx-auto w-full max-w-5xl px-6 py-6'>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {stats.map((stat) => (
          <div key={stat.label} className='rounded-lg bg-zinc-900/40 p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <stat.icon className='h-4 w-4 text-zinc-400' />
              <span className='text-xs text-zinc-500'>{stat.label}</span>
            </div>
            <p
              className='text-lg font-bold text-zinc-100'
              style={stat.color ? { color: stat.color } : undefined}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <p className='mt-3 text-xs text-zinc-500'>
        {isLive
          ? "Live data from the Riff Quest community — difficulty is the average of real player ratings."
          : "Editorial estimates — community ratings take over as Riff Quest players rate this song."}
      </p>
    </section>
  );
};
