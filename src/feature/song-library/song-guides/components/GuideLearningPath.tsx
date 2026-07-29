import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { CrossGuideDifficultyMap, GuidePathSong, SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideLearningPathProps {
  guide: SongGuide;
  crossGuideDifficulty: CrossGuideDifficultyMap;
}

const PathSongCard = ({
  song,
  crossGuideDifficulty,
}: {
  song: GuidePathSong;
  crossGuideDifficulty: CrossGuideDifficultyMap;
}) => {
  const live = song.guideSlug ? crossGuideDifficulty[song.guideSlug] : undefined;
  const tier = getSongTier(live ? live.tier : song.difficulty);

  const body = (
    <div className='h-full rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-900/70'>
      <div className='mb-1 flex items-start justify-between gap-3'>
        <h4 translate='no' className='font-semibold text-zinc-100'>
          {song.title}
        </h4>
        {song.guideSlug && (
          <span className='shrink-0 text-xs font-medium text-cyan-400'>
            Full guide
          </span>
        )}
      </div>
      <p translate='no' className='mb-3 text-sm text-zinc-500'>
        {song.artist}
      </p>
      <span
        className={`mb-3 inline-block rounded px-2 py-0.5 text-xs font-bold ${tier.bgColor}`}
        style={{ color: tier.color }}>
        {tier.label}
      </span>
      <p className='text-sm leading-relaxed text-zinc-400'>{song.why}</p>
    </div>
  );

  return song.guideSlug ? (
    <Link href={`/song-library/${song.guideSlug}`} className='block h-full'>
      {body}
    </Link>
  ) : (
    body
  );
};

export const GuideLearningPath = ({
  guide,
  crossGuideDifficulty,
}: GuideLearningPathProps) => {
  return (
    <GuideSection
      heading={guide.learningPath.heading}
      intro={guide.learningPath.intro}>
      <div className='space-y-10'>
        <div>
          <div className='mb-4 flex items-center gap-2'>
            <ArrowDownRight className='h-4 w-4 text-emerald-400' />
            <h3 className='font-semibold text-zinc-100'>
              Play these first — one step easier
            </h3>
          </div>
          <div className='grid gap-4 md:grid-cols-3'>
            {guide.learningPath.easier.map((song) => (
              <PathSongCard
                key={song.title}
                song={song}
                crossGuideDifficulty={crossGuideDifficulty}
              />
            ))}
          </div>
        </div>

        <div>
          <div className='mb-4 flex items-center gap-2'>
            <ArrowUpRight className='h-4 w-4 text-orange-400' />
            <h3 className='font-semibold text-zinc-100'>
              Where to go next — one step harder
            </h3>
          </div>
          <div className='grid gap-4 md:grid-cols-3'>
            {guide.learningPath.harder.map((song) => (
              <PathSongCard
                key={song.title}
                song={song}
                crossGuideDifficulty={crossGuideDifficulty}
              />
            ))}
          </div>
        </div>

        <p className='text-sm text-zinc-500'>
          Browse the full{" "}
          <Link
            href='/song-library'
            className='text-cyan-400 transition-colors hover:text-cyan-300'>
            song library ranked by community difficulty
          </Link>{" "}
          to build your own path.
        </p>
      </div>
    </GuideSection>
  );
};
