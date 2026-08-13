import { useQuery } from "@tanstack/react-query";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Check, Library, Loader2, Music, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/** The subset of a song the report form needs — mirrors the songId/songTitle/songArtist trio. */
export interface SessionSong {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

interface SessionSongPickerProps {
  userId: string | null;
  selected: SessionSong | null;
  onSelect: (song: SessionSong | null) => void;
}

/** "1h 20m" / "45m" — friendlier than the HH:MM the timer boxes use. */
const formatPracticed = (ms: number) => {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

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

const SongCover = ({
  coverUrl,
  size = "sm",
}: {
  coverUrl?: string;
  size?: "sm" | "lg";
}) => (
  <div
    className={cn(
      "shrink-0 overflow-hidden rounded bg-zinc-800",
      size === "lg" ? "h-14 w-14" : "h-10 w-10"
    )}>
    {coverUrl ? (
      <img src={coverUrl} alt='' className='h-full w-full object-cover' />
    ) : (
      <div className='flex h-full w-full items-center justify-center text-zinc-600'>
        <Music className={size === "lg" ? "h-6 w-6" : "h-4 w-4"} />
      </div>
    )}
  </div>
);

const SongRow = ({
  song,
  practicedMs,
  onPick,
}: {
  song: Song;
  practicedMs: number;
  onPick: () => void;
}) => (
  <button
    type='button'
    onClick={onPick}
    className='group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'>
    <SongCover coverUrl={song.coverUrl} />
    <div className='min-w-0 flex-1'>
      <p translate='no' className='truncate text-sm font-semibold text-zinc-100'>
        {song.title}
      </p>
      <p translate='no' className='truncate text-xs text-zinc-500'>
        {song.artist}
        {practicedMs > 0 && (
          <span className='text-zinc-600'> · {formatPracticed(practicedMs)} logged</span>
        )}
      </p>
    </div>
    <TierChip song={song} />
    <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-400'>
      <Check className='h-3.5 w-3.5' />
    </span>
  </button>
);

/**
 * Picks one song from the user's own library so a manual log can be attributed
 * to it — the practice time then lands on that song's progress (see
 * `recordPracticeSession`) instead of only in the daily totals.
 */
const SessionSongPicker = ({ userId, selected, onSelect }: SessionSongPickerProps) => {
  const [query, setQuery] = useState("");

  const { data: userSongs, isLoading } = useQuery({
    // Same key as useSongs so the songs page and this picker share one fetch.
    queryKey: ["user-songs", userId],
    queryFn: () => getUserSongs(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: progressList } = useQuery({
    queryKey: ["user-song-progress", userId],
    queryFn: () => getAllUserSongProgress(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const practicedMsById = useMemo(() => {
    const map = new Map<string, number>();
    (progressList ?? []).forEach((p) => map.set(p.songId, p.totalPracticeMs ?? 0));
    return map;
  }, [progressList]);

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

  if (selected) {
    const practicedMs = practicedMsById.get(selected.id) ?? 0;

    return (
      <div className='space-y-3'>
        <div className='flex items-center gap-4 rounded-lg bg-cyan-500/5 p-4'>
          <SongCover coverUrl={selected.coverUrl} size='lg' />
          <div className='min-w-0 flex-1'>
            <p translate='no' className='truncate text-base font-bold text-zinc-100'>
              {selected.title}
            </p>
            <p translate='no' className='truncate text-sm text-zinc-400'>
              {selected.artist}
            </p>
            <p className='mt-1 text-xs font-medium text-cyan-400'>
              {practicedMs > 0
                ? `${formatPracticed(practicedMs)} logged so far`
                : "First logged session for this song"}
            </p>
          </div>
          <button
            type='button'
            onClick={() => onSelect(null)}
            aria-label='Remove song from this session'
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
            <X className='h-4 w-4' />
          </button>
        </div>
        <p className='text-xs text-zinc-500'>
          This session&apos;s time is added to the song&apos;s practice stats, and the song
          moves to <span className='text-zinc-300'>Learning</span> if it isn&apos;t there yet.
        </p>
      </div>
    );
  }

  if (!userId || isLoading) {
    return (
      <div className='flex items-center justify-center py-10 text-zinc-600'>
        <Loader2 className='h-5 w-5 animate-spin' />
      </div>
    );
  }

  if (!hasAnySong) {
    return (
      <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/40 py-10 text-center'>
        <Library className='h-8 w-8 text-zinc-700' />
        <p className='text-sm font-semibold text-zinc-300'>Your library is empty</p>
        <p className='max-w-xs text-xs text-zinc-500'>
          Add songs you are working on and you will be able to log practice time straight
          onto them.
        </p>
        <Link
          href='/songs'
          className='mt-1 rounded-lg bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-400 transition-colors hover:bg-cyan-500/20'>
          Browse songs
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='group relative'>
        <div className='pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3.5'>
          <Search className='h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-zinc-200' />
        </div>
        <Input
          placeholder='Search your library...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className='h-11 border-none bg-zinc-900/40 pl-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-cyan-500/40'
        />
      </div>

      <div className='max-h-80 space-y-4 overflow-y-auto pr-1'>
        {groups.length === 0 ? (
          <p className='py-8 text-center text-xs font-medium text-zinc-500'>
            Nothing in your library matches that.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className='space-y-1'>
              <p className='px-2 text-[10px] font-bold tracking-wide text-zinc-500'>
                {group.label}
              </p>
              {group.songs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  practicedMs={practicedMsById.get(song.id) ?? 0}
                  onPick={() =>
                    onSelect({
                      id: song.id,
                      title: song.title,
                      artist: song.artist,
                      coverUrl: song.coverUrl,
                    })
                  }
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SessionSongPicker;
