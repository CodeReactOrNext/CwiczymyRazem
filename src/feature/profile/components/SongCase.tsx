import type { Song } from "feature/songs/types/songs.type";
import { formatPlayTime } from "feature/songs/utils/arrangements.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Clock } from "lucide-react";

import { ShinyCover } from "./ShinyCover";

interface SongCaseProps {
  songs: Song[];
  isPinned: boolean;
  isOwner: boolean;
  /** Milliseconds per song id — see useSongPracticeTimes. */
  practiceTimes?: Record<string, number>;
}

const tierOf = (song: Song) =>
  getSongTier(!song.avgDifficulty ? "?" : song.tier || song.avgDifficulty);

/**
 * The trophy case's twin for songs: the learned songs a player wants to be
 * known for, each cover printed like a foil card and lit from behind in its
 * tier colour. Without pins, the hardest songs they have learned.
 */
export const SongCase = ({
  songs,
  isPinned,
  isOwner,
  practiceTimes,
}: SongCaseProps) => {
  if (songs.length === 0) return null;

  return (
    <div className='rounded-2xl bg-zinc-900/30 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold text-white'>Signature songs</h2>
          {!isPinned && (
            <p className='mt-1 text-sm text-zinc-400'>Hardest songs learned</p>
          )}
        </div>
        {isOwner && !isPinned && (
          <p className='text-xs text-zinc-500'>
            Pin your own in Customize profile → Profile card.
          </p>
        )}
      </div>

      <div className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
        {songs.map((song) => {
          const tier = tierOf(song);
          return (
            <div
              key={song.id}
              className='flex flex-col items-center rounded-xl bg-zinc-800/40 px-4 pb-6 pt-8 text-center'
              style={{
                backgroundImage: `radial-gradient(ellipse 75% 55% at 50% 32%, ${tier.color}2e, transparent 75%)`,
              }}>
              <ShinyCover
                src={song.coverUrl}
                alt={song.title}
                tier={tier.tier}
                className='aspect-square w-full max-w-[128px] rounded-xl'
              />
              <p
                translate='no'
                className='mt-6 line-clamp-2 text-sm font-semibold text-zinc-100'>
                {song.title}
              </p>
              <p translate='no' className='mt-1 truncate text-xs text-zinc-400'>
                {song.artist}
              </p>
              <p
                className='mt-3 text-xs font-semibold'
                style={{ color: tier.color }}>
                {tier.label}
              </p>
              {(practiceTimes?.[song.id] ?? 0) > 0 && (
                <p
                  title='Time spent practising this song'
                  className='mt-2 flex items-center gap-1.5 text-xs tabular-nums text-zinc-300'>
                  <Clock size={12} className='text-zinc-500' />
                  {formatPlayTime(practiceTimes?.[song.id] ?? 0)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
