import { useQuery } from "@tanstack/react-query";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import {
  Check,
  ChevronUp,
  Library,
  Loader2,
  Minus,
  Music,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FaMusic } from "react-icons/fa";
import { IoMdHand } from "react-icons/io";
import type { IconType } from "react-icons/lib";

import {
  formatPracticed,
  MAX_SESSION_SONGS,
  MAX_SONG_CATEGORY_MINUTES,
  MINUTE_STEP,
  type PickedSong,
  type SessionSong,
  sumSongMinutes,
} from "./helpers/sessionSongs";
import { SKILL_COLORS } from "./helpers/skillColors";

export type { SessionSong } from "./helpers/sessionSongs";

export type SongCategory = "technique" | "hearing";

interface SessionSongPickerProps {
  userId: string | null;
  /** Songs picked for this session, in pick order. */
  selected: PickedSong[];
  onToggle: (song: SessionSong) => void;
  onSetMinutes: (songId: string, category: SongCategory, minutes: number) => void;
}

/** Snaps to the next/previous multiple of the step, so 7m → 10m → 5m → 0m. */
const stepUp = (minutes: number) =>
  Math.min(
    MAX_SONG_CATEGORY_MINUTES,
    Math.floor(minutes / MINUTE_STEP) * MINUTE_STEP + MINUTE_STEP
  );
const stepDown = (minutes: number) =>
  Math.max(0, Math.ceil(minutes / MINUTE_STEP) * MINUTE_STEP - MINUTE_STEP);

const SongCover = ({ coverUrl }: { coverUrl?: string }) => (
  <div className='h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-800'>
    {coverUrl ? (
      <img src={coverUrl} alt='' className='h-full w-full object-cover' />
    ) : (
      <div className='flex h-full w-full items-center justify-center text-zinc-600'>
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

/**
 * One category's minutes on one song. It borrows the time boxes' signature —
 * the category's colored icon disc and its value in the same color — at a third
 * of the size, so a stack of songs stays readable without a wheel picker each.
 */
const CategoryTime = ({
  skill,
  label,
  Icon,
  minutes,
  onChange,
}: {
  skill: SongCategory;
  label: string;
  Icon: IconType;
  minutes: number;
  onChange: (minutes: number) => void;
}) => {
  // While the field is focused the raw text wins, so clearing it to type a new
  // number doesn't snap back to "0" under the cursor.
  const [draft, setDraft] = useState<string | null>(null);
  const color = SKILL_COLORS[skill];
  const hasValue = minutes > 0;

  return (
    <div className='flex items-center gap-2.5'>
      <span
        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full'
        style={{
          background: hasValue
            ? `linear-gradient(135deg, ${color}20, ${color}10)`
            : "linear-gradient(135deg, #52525b40, #3f3f4630)",
        }}>
        <Icon
          className='text-base'
          style={{ color: hasValue ? color : "#a1a1aa" }}
          aria-hidden
        />
      </span>

      <span className='w-16 shrink-0 font-sans text-xs text-zinc-300'>{label}</span>

      <div className='flex items-center gap-1'>
        <button
          type='button'
          aria-label={`5 minutes less of ${label.toLowerCase()}`}
          disabled={minutes <= 0}
          onClick={() => onChange(stepDown(minutes))}
          className='flex h-8 w-8 items-center justify-center rounded bg-zinc-900/60 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40 disabled:pointer-events-none disabled:opacity-40'>
          <Minus className='h-3.5 w-3.5' />
        </button>

        <div className='relative'>
          <input
            inputMode='numeric'
            aria-label={`Minutes of ${label.toLowerCase()} on this song`}
            value={draft ?? String(minutes)}
            onChange={(event) => {
              const cleaned = event.target.value.replace(/\D/g, "").slice(0, 3);
              setDraft(cleaned);
              onChange(Math.min(Number(cleaned || 0), MAX_SONG_CATEGORY_MINUTES));
            }}
            onFocus={(event) => event.target.select()}
            onBlur={() => setDraft(null)}
            style={{ color: hasValue ? color : undefined }}
            className='h-8 w-14 rounded bg-zinc-900/60 pr-4 text-right font-mono text-sm font-bold text-zinc-500 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'
          />
          <span className='pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-500'>
            m
          </span>
        </div>

        <button
          type='button'
          aria-label={`5 minutes more of ${label.toLowerCase()}`}
          onClick={() => onChange(stepUp(minutes))}
          className='flex h-8 w-8 items-center justify-center rounded bg-zinc-900/60 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'>
          <Plus className='h-3.5 w-3.5' />
        </button>
      </div>
    </div>
  );
};

const PickedSongRow = ({
  song,
  coverUrl,
  onSetMinutes,
  onRemove,
}: {
  song: PickedSong;
  coverUrl?: string;
  onSetMinutes: (category: SongCategory, minutes: number) => void;
  onRemove: () => void;
}) => (
  <div className='rounded-lg bg-zinc-800/40 p-3'>
    <div className='flex items-center gap-3'>
      <SongCover coverUrl={coverUrl ?? song.coverUrl} />
      <div className='min-w-0 flex-1'>
        <p translate='no' className='truncate text-sm font-bold text-zinc-100'>
          {song.title}
        </p>
        <p translate='no' className='truncate text-xs text-zinc-400'>
          {song.artist}
        </p>
      </div>
      <button
        type='button'
        onClick={onRemove}
        aria-label={`Remove ${song.title} from this session`}
        className='flex h-9 w-9 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-900/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'>
        <X className='h-4 w-4' />
      </button>
    </div>

    {/* The two categories sit side by side once there is room, and stack below. */}
    <div className='mt-3 flex flex-wrap gap-x-8 gap-y-2.5'>
      <CategoryTime
        skill='technique'
        label='Technique'
        Icon={IoMdHand}
        minutes={song.techniqueMinutes}
        onChange={(minutes) => onSetMinutes("technique", minutes)}
      />
      <CategoryTime
        skill='hearing'
        label='Hearing'
        Icon={FaMusic}
        minutes={song.hearingMinutes}
        onChange={(minutes) => onSetMinutes("hearing", minutes)}
      />
    </div>
  </div>
);

const SongRow = ({
  song,
  practicedMs,
  isSelected,
  isDisabled,
  onPick,
}: {
  song: Song;
  practicedMs: number;
  isSelected: boolean;
  isDisabled: boolean;
  onPick: () => void;
}) => (
  <button
    type='button'
    onClick={onPick}
    disabled={isDisabled}
    aria-pressed={isSelected}
    className={cn(
      "group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40",
      isSelected ? "bg-cyan-500/5" : "hover:bg-zinc-800/60",
      isDisabled && "pointer-events-none opacity-40"
    )}>
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
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
        isSelected
          ? "bg-cyan-500/15 text-cyan-400"
          : "bg-zinc-800/60 text-zinc-500 group-hover:bg-cyan-500/10 group-hover:text-cyan-400"
      )}>
      <Check className='h-3.5 w-3.5' />
    </span>
  </button>
);

/**
 * The whole time input for a song session: pick songs from the library and give
 * each one its own technique/hearing minutes. The report's category totals are
 * the sum over these songs, and each song's slice also lands on its own
 * progress (see `recordPracticeSession`).
 */
const SessionSongPicker = ({
  userId,
  selected,
  onToggle,
  onSetMinutes,
}: SessionSongPickerProps) => {
  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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

  const coverById = useMemo(() => {
    const map = new Map<string, string | undefined>();
    [
      ...(userSongs?.learning ?? []),
      ...(userSongs?.wantToLearn ?? []),
      ...(userSongs?.learned ?? []),
    ].forEach((song) => map.set(song.id, song.coverUrl));
    return map;
  }, [userSongs]);

  const selectedIds = useMemo(
    () => new Set(selected.map((song) => song.id)),
    [selected]
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

  const totals = sumSongMinutes(selected);
  const isAtLimit = selected.length >= MAX_SESSION_SONGS;
  // With nothing picked yet the library list is the only thing worth showing.
  const isLibraryOpen = selected.length === 0 || isAdding;

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
    <div className='space-y-4'>
      {selected.length > 0 && (
        <>
          <div className='space-y-2'>
            {selected.map((song) => (
              <PickedSongRow
                key={song.id}
                song={song}
                coverUrl={coverById.get(song.id)}
                onSetMinutes={(category, minutes) =>
                  onSetMinutes(song.id, category, minutes)
                }
                onRemove={() => onToggle(song)}
              />
            ))}
          </div>

          <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1'>
            <p className='text-xs text-zinc-500'>
              Technique{" "}
              <span className='font-semibold text-zinc-300'>{totals.technique}m</span> ·
              Hearing{" "}
              <span className='font-semibold text-zinc-300'>{totals.hearing}m</span>
            </p>

            <button
              type='button'
              onClick={() => setIsAdding((open) => !open)}
              disabled={isAtLimit && !isAdding}
              className='flex items-center gap-1.5 rounded bg-zinc-800/60 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40 disabled:pointer-events-none disabled:opacity-40'>
              {isAdding ? (
                <>
                  <ChevronUp className='h-3.5 w-3.5' />
                  Done adding
                </>
              ) : (
                <>
                  <Plus className='h-3.5 w-3.5' />
                  Add song
                </>
              )}
            </button>
          </div>
        </>
      )}

      {isLibraryOpen && (
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

          {isAtLimit && (
            <p className='px-2 text-xs font-semibold text-amber-400'>
              {MAX_SESSION_SONGS} songs is the most one session can hold.
            </p>
          )}

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
                  {group.songs.map((song) => {
                    const isSelected = selectedIds.has(song.id);
                    return (
                      <SongRow
                        key={song.id}
                        song={song}
                        practicedMs={practicedMsById.get(song.id) ?? 0}
                        isSelected={isSelected}
                        isDisabled={isAtLimit && !isSelected}
                        onPick={() =>
                          onToggle({
                            id: song.id,
                            title: song.title,
                            artist: song.artist,
                            coverUrl: song.coverUrl,
                          })
                        }
                      />
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionSongPicker;
