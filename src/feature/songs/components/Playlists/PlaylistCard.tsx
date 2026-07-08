import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import type { Playlist } from "feature/songs/types/playlist.types";
import { getPlaylistPopularity } from "feature/songs/types/playlist.types";
import { Flame, Globe, Heart } from "lucide-react";

import { PlaylistCover } from "./PlaylistCover";
import { KIND_META } from "./playlistVisuals";

interface PlaylistCardProps {
  playlist: Playlist;
  onOpen: () => void;
  /** Discover grid shows the author instead of visibility. */
  showOwner?: boolean;
  /** When provided, learning paths render their mastery progress. */
  learnedSongIds?: Set<string>;
}

export const PlaylistCard = ({
  playlist,
  onOpen,
  showOwner,
  learnedSongIds,
}: PlaylistCardProps) => {
  const meta = KIND_META[playlist.kind] ?? KIND_META.playlist;
  const KindIcon = meta.icon;
  const songCount = playlist.songs.length;

  const learnedCount =
    playlist.kind === "path" && learnedSongIds
      ? playlist.songs.filter((s) => learnedSongIds.has(s.songId)).length
      : 0;
  const showPathProgress = playlist.kind === "path" && !!learnedSongIds && songCount > 0;

  const popularity = getPlaylistPopularity(playlist);
  const likeCount = playlist.likeCount ?? 0;

  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-md p-3",
        "transition-all duration-300 ease-out hover:bg-zinc-800/40"
      )}
    >
      <Ripple />

      <div className="relative z-10 aspect-square w-full overflow-hidden rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        <PlaylistCover playlist={playlist} className="h-full w-full" iconSize={32} />

        {/* Kind badge for special playlists (mirrors the song status badge) */}
        {meta.badge && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent" />
            <div
              className={cn(
                "absolute left-2 top-2 flex h-7 items-center gap-1.5 rounded-[4px] bg-zinc-900/80 px-2 shadow-md ring-1 backdrop-blur-md",
                meta.badge.className
              )}
            >
              <KindIcon className={cn("h-3.5 w-3.5", meta.badge.iconClassName)} />
              <span className="text-[10px] font-bold leading-none">{meta.badge.label}</span>
            </div>
          </>
        )}
      </div>

      <div className="relative z-10 flex flex-col pt-3">
        <h3 translate="no" className="w-full truncate text-base font-bold text-white">
          {playlist.name}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-zinc-400">
          <span className="text-zinc-300">{meta.label}</span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
          <span>{songCount === 1 ? "1 song" : `${songCount} songs`}</span>
          {showOwner && playlist.ownerName ? (
            <>
              <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
              <span className="flex min-w-0 items-center gap-1.5">
                {playlist.ownerAvatar ? (
                  <img
                    src={playlist.ownerAvatar}
                    alt=""
                    className="h-4 w-4 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[8px] font-bold text-zinc-300">
                    {playlist.ownerName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate">{playlist.ownerName}</span>
              </span>
            </>
          ) : (
            playlist.isPublic && (
              <>
                <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                <span className="flex items-center gap-1 text-zinc-500">
                  <Globe className="h-3 w-3" />
                  public
                </span>
              </>
            )
          )}
        </p>

        {showPathProgress && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${(learnedCount / songCount) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-zinc-500">
              {learnedCount}/{songCount}
            </span>
          </div>
        )}

        {showOwner && popularity > 0 && (
          <div className="mt-1.5 flex items-center gap-2.5 text-[11px] font-medium text-zinc-500">
            <span className="flex items-center gap-1">
              <Flame
                className={cn(
                  "h-3 w-3",
                  popularity >= 30
                    ? "text-orange-400"
                    : popularity >= 10
                    ? "text-amber-400"
                    : "text-zinc-500"
                )}
              />
              {popularity}
            </span>
            {likeCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-rose-400/80 text-rose-400/80" />
                {likeCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
