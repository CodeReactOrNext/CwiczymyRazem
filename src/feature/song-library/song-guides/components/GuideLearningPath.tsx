import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type {
  CrossGuideDifficultyMap,
  GuidePathSong,
  PathSongLiveDataMap,
  SongGuide,
} from "../types";
import { GuideSection } from "./GuideSection";

interface GuideLearningPathProps {
  guide: SongGuide;
  crossGuideDifficulty: CrossGuideDifficultyMap;
  pathSongLiveData: PathSongLiveDataMap;
}

const PathSongCard = ({
  song,
  crossGuideDifficulty,
  live,
}: {
  song: GuidePathSong;
  crossGuideDifficulty: CrossGuideDifficultyMap;
  live: PathSongLiveDataMap[string] | undefined;
}) => {
  // Prefer the linked guide's own live number, then the song doc's live
  // rating, then fall back to the hand-written editorial estimate — same
  // "don't trust a stale guess once real data exists" rule as elsewhere.
  const guideLive = song.guideSlug
    ? crossGuideDifficulty[song.guideSlug]
    : undefined;
  const liveDifficulty =
    guideLive ?? (live && live.avgDifficulty > 0 ? live : undefined);
  const tier = getSongTier(liveDifficulty ? liveDifficulty.tier : song.difficulty);
  const coverUrl = live?.coverUrl ?? null;

  const body = (
    <div className='h-full rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-900/70'>
      <div className='mb-3 flex items-start gap-3'>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=''
            width={44}
            height={44}
            className='h-11 w-11 shrink-0 rounded-md object-cover'
          />
        ) : (
          <div className='h-11 w-11 shrink-0 rounded-md bg-zinc-800/60' />
        )}
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <h4 translate='no' className='font-semibold text-zinc-100'>
              {song.title}
            </h4>
            {song.guideSlug && (
              <span className='shrink-0 text-xs font-medium text-cyan-400'>
                Full guide
              </span>
            )}
          </div>
          <p translate='no' className='truncate text-sm text-zinc-500'>
            {song.artist}
          </p>
        </div>
      </div>
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
  pathSongLiveData,
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
                live={song.songId ? pathSongLiveData[song.songId] : undefined}
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
                live={song.songId ? pathSongLiveData[song.songId] : undefined}
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
