import type { Song } from "feature/songs/types/songs.type";

import { ProfileSongRow } from "./SongSkillShowcase";

/** The player's own words. Renders nothing until they write something. */
export const AboutSection = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <div className='h-full rounded-2xl bg-zinc-900/30 p-6'>
      <h2 className='text-2xl font-bold text-white'>About me</h2>
      <p className='mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-zinc-300'>
        {text}
      </p>
    </div>
  );
};

/** Songs on the "learning" list, newest effort first as stored. */
export const LearningSection = ({
  songs,
  practiceTimes,
}: {
  songs: Song[] | undefined;
  practiceTimes?: Record<string, number>;
}) => {
  if (!songs || songs.length === 0) return null;
  return (
    <div className='h-full rounded-2xl bg-zinc-900/30 p-6'>
      <h2 className='text-2xl font-bold text-white'>Currently learning</h2>
      <p className='mt-1 text-sm text-zinc-400'>
        {songs.length} {songs.length === 1 ? "song" : "songs"} in progress
      </p>
      <div className='mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {songs.slice(0, 8).map((song) => (
          <ProfileSongRow
            key={song.id}
            song={song}
            practiceMs={practiceTimes?.[song.id]}
          />
        ))}
      </div>
    </div>
  );
};
