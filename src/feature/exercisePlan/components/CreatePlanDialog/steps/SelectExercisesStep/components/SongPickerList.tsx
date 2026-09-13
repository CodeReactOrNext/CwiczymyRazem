import { useQuery } from "@tanstack/react-query";
import { cn } from "assets/lib/utils";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { songExerciseId } from "feature/exercisePlan/utils/songToExercise";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Check, FileMusic, Library, ListVideo, Loader2, Music, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface SongPickerListProps {
  userId: string | null;
  selectedExercises: Exercise[];
  /** Songs the player has a Guitar Pro file attached to. */
  gpSongIds: ReadonlySet<string>;
  /** Adds the song to the plan (the caller asks how, and for how long, first). */
  onPickSong: (song: Song) => void;
  /** Takes the song's item back out of the plan. */
  onRemoveSong: (exercise: Exercise) => void;
}

const SongCover = ({ coverUrl }: { coverUrl?: string }) => (
  <div className='h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-800'>
    {coverUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt='' className='h-full w-full object-cover' />
    ) : (
      <div className='flex h-full w-full items-center justify-center text-zinc-500'>
        <Music className='h-4 w-4' />
      </div>
    )}
  </div>
);

const TierChip = ({ song }: { song: Song }) => {
  const tier = getSongTier(
    (song.avgDifficulty ?? 0) === 0 ? "?" : song.tier || song.avgDifficulty || "?"
  );
  return (
    <span
      className='shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold'
      style={{ backgroundColor: `${tier.color}14`, color: tier.color }}>
      {tier.tier}
    </span>
  );
};

const SongRow = ({
  song,
  hasGpFile,
  isSelected,
  onClick,
}: {
  song: Song;
  hasGpFile: boolean;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={isSelected}
    className={cn(
      "group flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40",
      isSelected ? "bg-cyan-500/5" : "bg-zinc-900/20 hover:bg-zinc-800/40"
    )}>
    <SongCover coverUrl={song.coverUrl} />
    <div className='min-w-0 flex-1'>
      <p translate='no' className='truncate text-sm font-semibold text-zinc-100'>
        {song.title}
      </p>
      <p translate='no' className='truncate text-xs text-zinc-400'>
        {song.artist}
      </p>
    </div>
    {/* What the song can be practised with — the same choice the dialog offers. */}
    {hasGpFile && (
      <span
        className='hidden shrink-0 items-center gap-1 rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 sm:inline-flex'
        title='Guitar Pro file attached'>
        <FileMusic className='h-3 w-3 text-zinc-400' />
        Tab
      </span>
    )}
    {(song.totalSections ?? 0) > 0 && (
      <span
        className='hidden shrink-0 items-center gap-1 rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 sm:inline-flex'
        title='Sections marked on the video'>
        <ListVideo className='h-3 w-3 text-zinc-400' />
        {song.totalSections}
      </span>
    )}
    <TierChip song={song} />
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
        isSelected
          ? "bg-cyan-500/15 text-cyan-400"
          : "bg-zinc-800/60 text-zinc-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400"
      )}>
      {isSelected ? <Check className='h-3.5 w-3.5' /> : <Plus className='h-3.5 w-3.5' />}
    </span>
  </button>
);

/**
 * The "Songs" source of the plan wizard: the player's own library (learning /
 * want to learn / learned), so a routine can hold the songs being worked on
 * next to its technical exercises. Picking a song adds it as a plan item —
 * see songToExercise — timed and ordered like any other.
 */
export const SongPickerList = ({
  userId,
  selectedExercises,
  gpSongIds,
  onPickSong,
  onRemoveSong,
}: SongPickerListProps) => {
  const [query, setQuery] = useState("");

  const { data: userSongs, isLoading } = useQuery({
    // Same key as the songs page, so both share one fetch.
    queryKey: ["user-songs", userId],
    queryFn: () => getUserSongs(userId as string),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const selectedById = useMemo(
    () => new Map(selectedExercises.map((exercise) => [exercise.id, exercise])),
    [selectedExercises]
  );

  const groups = useMemo(() => {
    const all = [
      { label: "Learning now", songs: userSongs?.learning ?? [] },
      { label: "Want to learn", songs: userSongs?.wantToLearn ?? [] },
      { label: "Learned", songs: userSongs?.learned ?? [] },
    ];
    const q = query.trim().toLowerCase();
    if (!q) return all.filter((group) => group.songs.length > 0);
    return all
      .map((group) => ({
        ...group,
        songs: group.songs.filter(
          (song) =>
            song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.songs.length > 0);
  }, [userSongs, query]);

  const hasAnySong =
    (userSongs?.learning.length ?? 0) +
      (userSongs?.wantToLearn.length ?? 0) +
      (userSongs?.learned.length ?? 0) >
    0;

  if (!userId || isLoading) {
    return (
      <div className='flex h-40 items-center justify-center text-zinc-500'>
        <Loader2 className='h-5 w-5 animate-spin' />
      </div>
    );
  }

  if (!hasAnySong) {
    return (
      <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/40 py-12 text-center'>
        <Library className='h-8 w-8 text-zinc-500' />
        <p className='text-sm font-semibold text-zinc-300'>Your library is empty</p>
        <p className='max-w-xs text-xs leading-relaxed text-zinc-400'>
          Add the songs you are working on and you will be able to put them into a
          routine, right between the exercises.
        </p>
        <Link
          href='/songs'
          className='mt-1 rounded-lg bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-400 transition-colors hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'>
          Browse songs
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <input
        type='text'
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder='Search your songs…'
        className='h-10 w-full rounded-lg bg-zinc-900 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'
      />

      {groups.length === 0 ? (
        <p className='py-12 text-center text-[13px] text-zinc-500'>
          No songs match your search.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className='space-y-2'>
            <p className='px-1 text-[11px] font-bold tracking-wide text-zinc-500'>
              {group.label}
            </p>
            {group.songs.map((song) => {
              const selected = selectedById.get(songExerciseId(song.id));
              return (
                <SongRow
                  key={song.id}
                  song={song}
                  hasGpFile={gpSongIds.has(song.id)}
                  isSelected={!!selected}
                  onClick={() => (selected ? onRemoveSong(selected) : onPickSong(song))}
                />
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};
