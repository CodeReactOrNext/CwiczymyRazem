import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import { SongCardMenu, STATUS_META } from "feature/songs/components/SongsGrid/SongCardMenu";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Music, Play, Star } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

interface SongCardRowProps {
  song: Song;
  onOpenDetails: () => void;
  userStatus?: SongStatus;
  onStatusChange?: (status: SongStatus | undefined) => void;
  onPlay?: () => void;
}

/**
 * Spotify-style horizontal row used for the song library on phones, where the
 * two-column grid of vertical cards gets too cramped to read. Thumbnail on the
 * left, title/artist in the middle, tier + actions on the right.
 */
export const SongCardRow = ({
  song,
  onOpenDetails,
  userStatus,
  onStatusChange,
  onPlay,
}: SongCardRowProps) => {
  const userId = useAppSelector(selectUserAuth);
  const isRated = song.difficulties?.some((d) => d.userId === userId);
  const statusMeta = userStatus ? STATUS_META[userStatus] : null;
  const StatusIcon = statusMeta?.icon;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      onClick={onOpenDetails}
      onContextMenu={(e) => {
        e.preventDefault();
        setIsMenuOpen(true);
      }}
      className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-lg p-2 transition-background click-behavior hover:bg-zinc-800/40 active:bg-zinc-800/60"
    >
      <Ripple />

      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={`${song.title} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-white/30">
            <Music className="h-6 w-6" />
          </div>
        )}
        {statusMeta && StatusIcon && (
          <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/60 to-transparent p-1">
            <StatusIcon className={cn("h-3.5 w-3.5 drop-shadow", statusMeta.color)} />
          </div>
        )}
      </div>

      {/* Title / artist */}
      <div className="min-w-0 flex-1">
        <p translate="no" className="truncate text-[15px] font-bold text-white">
          {song.title}
        </p>
        <div className="flex min-w-0 items-center gap-1.5">
          <p translate="no" className="min-w-0 truncate text-sm text-zinc-400">
            {song.artist}
          </p>
          {isRated && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <TierBadge song={song} className="h-8 w-8 text-xs" />

        {onPlay && (
          <button
            aria-label="Practice"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-90"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
        )}

        <SongCardMenu
          song={song}
          userStatus={userStatus}
          onStatusChange={onStatusChange}
          onPlay={onPlay}
          open={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          triggerClassName="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white"
        />
      </div>
    </div>
  );
};

interface SongRowSkeletonProps {
  className?: string;
}

export const SongRowSkeleton = ({ className }: SongRowSkeletonProps) => (
  <div className={cn("flex items-center gap-3 p-2", className)}>
    <div className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-zinc-800" />
    <div className="min-w-0 flex-1 space-y-2">
      <div className="h-3.5 w-2/3 animate-pulse rounded-[4px] bg-zinc-800" />
      <div className="h-3 w-1/3 animate-pulse rounded-[4px] bg-zinc-800" />
    </div>
    <div className="h-8 w-8 shrink-0 animate-pulse rounded-[4px] bg-zinc-800" />
  </div>
);
