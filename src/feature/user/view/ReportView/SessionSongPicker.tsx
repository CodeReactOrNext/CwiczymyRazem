import { useQuery } from "@tanstack/react-query";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { useSongSuggestions } from "feature/songs/hooks/useSongSuggestions";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { inkAccent, inkWash } from "lib/colorTheme/colorTheme";
import { Check, Loader2, Music, Search } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";

import {
  formatPracticed,
  MAX_SESSION_SONGS,
  type PickedSong,
  type SessionSong,
} from "./helpers/sessionSongs";

export type { SessionSong } from "./helpers/sessionSongs";

/** How many last-played songs lead the list. */
const RECENT_SONGS = 4;

interface SessionSongPickerProps {
  userId: string | null;
  /** Songs picked for this session, in pick order. */
  selected: PickedSong[];
  onToggle: (song: SessionSong) => void;
}

export const SongCover = ({
  coverUrl,
  size = "md",
}: {
  coverUrl?: string;
  size?: "sm" | "md";
}) => (
  <div
    className={cn(
      "shrink-0 overflow-hidden rounded bg-zinc-800",
      size === "sm" ? "h-8 w-8" : "h-11 w-11",
    )}>
    {coverUrl ? (
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
    (song.avgDifficulty ?? 0) === 0
      ? "?"
      : song.tier || song.avgDifficulty || "?",
  );
  return (
    <span
      className='shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold'
      style={{
        backgroundColor: inkWash(tier.color, 12),
        color: inkAccent(tier.color),
      }}>
      {tier.tier}
    </span>
  );
};

const SongRow = ({
  song,
  practicedLabel,
  chip,
  isSelected,
  isDisabled,
  onPick,
}: {
  song: SessionSong;
  /** "45 min logged" — only for songs that already have time on them. */
  practicedLabel?: string;
  chip?: ReactNode;
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
      "group flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      isSelected ? "bg-zinc-800" : "hover:bg-zinc-800/60",
      isDisabled && "pointer-events-none opacity-40",
    )}>
    <SongCover coverUrl={song.coverUrl} />
    <div className='min-w-0 flex-1'>
      <p
        translate='no'
        className='truncate text-sm font-semibold text-zinc-100'>
        {song.title}
      </p>
      <p translate='no' className='truncate text-xs text-zinc-400'>
        {song.artist}
        {practicedLabel && <span> · {practicedLabel}</span>}
      </p>
    </div>
    {chip}
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-fast",
        isSelected
          ? "bg-zinc-100 text-zinc-950"
          : "bg-zinc-800/60 text-transparent group-hover:text-zinc-500",
      )}>
      <Check className='h-3.5 w-3.5' strokeWidth={3} />
    </span>
  </button>
);

const GroupLabel = ({ children }: { children: ReactNode }) => (
  <p className='px-2.5 text-xs font-semibold text-zinc-400'>{children}</p>
);

/**
 * "Which songs?" — any number ticked at once. One search field covers the
 * player's own library and, by title, the whole catalog, so an empty library
 * is not a dead end: a catalog song is logged like any other and joins the
 * library as "learning" when the session is saved. The time each song got is
 * the next question's job (see `TimeBlock`).
 */
const SessionSongPicker = ({
  userId,
  selected,
  onToggle,
}: SessionSongPickerProps) => {
  const { t } = useTranslation(["report", "plans"]);
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

  const { suggestions, isLoading: isSearching } = useSongSuggestions(
    "title",
    query,
    !!userId,
  );

  const practicedMsById = useMemo(() => {
    const map = new Map<string, number>();
    (progressList ?? []).forEach((p) =>
      map.set(p.songId, p.totalPracticeMs ?? 0),
    );
    return map;
  }, [progressList]);

  const selectedIds = useMemo(
    () => new Set(selected.map((song) => song.id)),
    [selected],
  );

  const libraryIds = useMemo(
    () =>
      new Set(
        [
          ...(userSongs?.learning ?? []),
          ...(userSongs?.wantToLearn ?? []),
          ...(userSongs?.learned ?? []),
        ].map((song) => song.id),
      ),
    [userSongs],
  );

  const groups = useMemo(() => {
    const all = [
      {
        label: t("plans:song_picker.learning"),
        songs: userSongs?.learning ?? [],
      },
      {
        label: t("plans:song_picker.want_to_learn"),
        songs: userSongs?.wantToLearn ?? [],
      },
      {
        label: t("plans:song_picker.learned"),
        songs: userSongs?.learned ?? [],
      },
    ];
    const q = query.trim().toLowerCase();
    if (!q) {
      // The songs played last come first — most sessions return to the same
      // few. Read off the progress list this picker loads anyway, so it costs
      // no extra request. They leave their own group so no song shows twice.
      const lastPlayedAt = new Map(
        (progressList ?? []).map((p) => [
          p.songId,
          p.lastPracticedAt?.getTime() ?? 0,
        ]),
      );
      const recent = all
        .flatMap((group) => group.songs)
        .filter((song) => (lastPlayedAt.get(song.id) ?? 0) > 0)
        .sort(
          (a, b) =>
            (lastPlayedAt.get(b.id) ?? 0) - (lastPlayedAt.get(a.id) ?? 0),
        )
        .slice(0, RECENT_SONGS);
      const recentIds = new Set(recent.map((song) => song.id));

      return [
        { label: t("flow.recent_group"), songs: recent },
        ...all.map((group) => ({
          ...group,
          songs: group.songs.filter((song) => !recentIds.has(song.id)),
        })),
      ].filter((group) => group.songs.length > 0);
    }
    return all
      .map((group) => ({
        ...group,
        songs: group.songs.filter(
          (song) =>
            song.title.toLowerCase().includes(q) ||
            song.artist.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.songs.length > 0);
  }, [userSongs, progressList, query, t]);

  const hasQuery = query.trim().length > 0;
  const catalogSongs = hasQuery
    ? suggestions.filter((song) => !libraryIds.has(song.id))
    : [];
  // Picked from the catalog earlier: they are in no library group, and must
  // not vanish from the list once the search that found them changes.
  const pickedOutsideLibrary = selected.filter(
    (song) =>
      !libraryIds.has(song.id) &&
      !catalogSongs.some((match) => match.id === song.id),
  );

  const isAtLimit = selected.length >= MAX_SESSION_SONGS;
  const isEmptyLibrary = libraryIds.size === 0;
  const hasNothingToShow =
    groups.length === 0 &&
    catalogSongs.length === 0 &&
    pickedOutsideLibrary.length === 0 &&
    !isSearching;

  if (!userId || isLoading) {
    return (
      <div className='flex items-center justify-center rounded-lg bg-zinc-900/40 py-12 text-zinc-500'>
        <Loader2 className='h-5 w-5 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-3 sm:p-4'>
      <div className='group relative'>
        <div className='pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3.5'>
          {isSearching ? (
            <Loader2 className='h-4 w-4 animate-spin text-zinc-400' />
          ) : (
            <Search className='h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-zinc-200' />
          )}
        </div>
        <Input
          placeholder={t("flow.song_search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // The field lives inside the report form; Enter must not save it.
            if (event.key === "Enter") event.preventDefault();
          }}
          className='h-11 border-none bg-zinc-950/40 pl-10 text-base text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-cyan-500/40 sm:text-sm'
        />
      </div>

      {isAtLimit && (
        <p className='px-2 text-xs font-semibold text-amber-400'>
          {t("songs.limit", { max: MAX_SESSION_SONGS })}
        </p>
      )}

      <div className='flex max-h-[26rem] flex-col gap-5 overflow-y-auto pr-1'>
        {pickedOutsideLibrary.length > 0 && (
          <div className='flex flex-col gap-1'>
            <GroupLabel>{t("flow.picked_group")}</GroupLabel>
            {pickedOutsideLibrary.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                isSelected
                isDisabled={false}
                onPick={() => onToggle(song)}
              />
            ))}
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label} className='flex flex-col gap-1'>
            <GroupLabel>{group.label}</GroupLabel>
            {group.songs.map((song) => {
              const isSelected = selectedIds.has(song.id);
              return (
                <SongRow
                  key={song.id}
                  song={song}
                  practicedLabel={
                    (practicedMsById.get(song.id) ?? 0) > 0
                      ? t("flow.logged", {
                          time: formatPracticed(
                            practicedMsById.get(song.id) ?? 0,
                          ),
                        })
                      : undefined
                  }
                  chip={<TierChip song={song} />}
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
        ))}

        {catalogSongs.length > 0 && (
          <div className='flex flex-col gap-1'>
            <GroupLabel>{t("flow.catalog_group")}</GroupLabel>
            {catalogSongs.map((song) => {
              const isSelected = selectedIds.has(song.id);
              return (
                <SongRow
                  key={song.id}
                  song={song}
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
            <p className='px-2.5 pt-1 text-xs text-zinc-400'>
              {t("flow.catalog_hint")}
            </p>
          </div>
        )}

        {hasNothingToShow && (
          <div className='flex flex-col items-center gap-3 px-4 py-8 text-center'>
            <p className='max-w-sm text-sm text-zinc-400'>
              {hasQuery
                ? t("flow.no_song_match")
                : isEmptyLibrary
                  ? t("flow.empty_library_hint")
                  : t("songs.no_match")}
            </p>
            {hasQuery && (
              <Link
                href='/songs'
                className='rounded-lg bg-zinc-800/60 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
                {t("songs.browse")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSongPicker;
