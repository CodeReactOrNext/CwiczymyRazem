import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { GuideLiveData, GuidePathSong, SongGuide } from "../types";
import { DifficultyMeter } from "./DifficultyMeter";
import { GuideSection } from "./GuideSection";

interface GuideLearningPathProps {
  guide: SongGuide;
  liveData: GuideLiveData;
}

const PathSongCard = ({ song }: { song: GuidePathSong }) => {
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
      <div className='mb-3 max-w-[160px]'>
        <DifficultyMeter value={song.difficulty} />
      </div>
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

const LiveSimilarStrip = ({
  label,
  songs,
}: {
  label: string;
  songs: GuideLiveData["easierSongs"];
}) => {
  if (songs.length === 0) return null;

  return (
    <div className='mt-4 rounded-lg bg-zinc-900/40 p-4'>
      <p className='mb-3 text-xs text-zinc-500'>{label}</p>
      <div className='flex flex-wrap gap-2'>
        {songs.map((song) => (
          <span
            key={song.id}
            translate='no'
            className='rounded bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300'>
            {song.title} — {song.artist}
            <span className='ml-2 font-bold text-cyan-400'>
              {song.avgDifficulty.toFixed(1)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export const GuideLearningPath = ({
  guide,
  liveData,
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
              <PathSongCard key={song.title} song={song} />
            ))}
          </div>
          <LiveSimilarStrip
            label='Slightly easier songs the Riff Quest community is playing right now'
            songs={liveData.easierSongs}
          />
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
              <PathSongCard key={song.title} song={song} />
            ))}
          </div>
          <LiveSimilarStrip
            label='Harder songs the Riff Quest community is playing right now'
            songs={liveData.harderSongs}
          />
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
