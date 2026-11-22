import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import { SongPartMarks } from "feature/songs/components/SongPartMarks/SongPartMarks";
import { SongRow, SongThumb } from "feature/songs/components/SongRow/SongRow";
import { SongCardMenu, STATUS_META } from "feature/songs/components/SongsGrid/SongCardMenu";
import { TierPick } from "feature/songs/components/SongsGrid/TierBadge";
import type { Song, SongPart, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { songCoverLayoutId } from "feature/songs/utils/songCoverLayout";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useSharedElement } from "lib/motion/useSharedElement";
import { Star } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

interface SongCardRowProps {
  song: Song;
  onOpenDetails: () => void;
  userStatus?: SongStatus;
  onStatusChange?: (status: SongStatus | undefined) => void;
  onPlay?: () => void;
  /** Parts of the song the user marked as playable (riff / solo / whole song). */
  parts?: SongPart[];
  onPartsChange?: (parts: SongPart[]) => void;
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
  parts,
  onPartsChange,
}: SongCardRowProps) => {
  const userId = useAppSelector(selectUserAuth);
  const isRated = song.difficulties?.some((d) => d.userId === userId);
  const statusMeta = userStatus ? STATUS_META[userStatus] : null;
  const StatusIcon = statusMeta?.icon;
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty === 0 ? "?" : song.tier || avgDifficulty);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { layoutDependency, runAfterSnapshot } = useSharedElement();

  return (
    <SongRow
      onClick={() => runAfterSnapshot(onOpenDetails)}
      onContextMenu={(e) => {
        e.preventDefault();
        setIsMenuOpen(true);
      }}
      className="click-behavior active:bg-zinc-800/80"
      leading={<Ripple />}
      cover={
        <SongThumb
          coverUrl={song.coverUrl}
          alt={`${song.title} cover`}
          layoutId={songCoverLayoutId(song.id)}
          layoutDependency={layoutDependency}>
          {/* Tier pinned to the cover so it never squeezes the title */}
          <TierPick tier={tier} className="absolute right-1 top-1 h-5 w-5" />
          {statusMeta && StatusIcon && (
            <span className="force-dark absolute inset-x-0 bottom-0 flex items-end justify-start bg-gradient-to-t from-black/60 to-transparent p-1">
              <StatusIcon className={cn("h-3.5 w-3.5 drop-shadow", statusMeta.color)} />
            </span>
          )}
        </SongThumb>
      }
      title={song.title}
      artist={
        <>
          {song.artist}
          {isRated && (
            <Star className="ml-1.5 inline h-3.5 w-3.5 fill-amber-400 align-[-2px] text-amber-400" />
          )}
        </>
      }
      meta={
        // Part marks: what of this song the user can already play
        userStatus && onPartsChange ? (
          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <SongPartMarks parts={parts ?? []} onChange={onPartsChange} />
          </div>
        ) : undefined
      }
      trailing={
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <SongCardMenu
            song={song}
            userStatus={userStatus}
            onStatusChange={onStatusChange}
            onPlay={onPlay}
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            triggerClassName="text-zinc-400 data-[state=open]:bg-zinc-800 data-[state=open]:text-white"
          />
        </div>
      }
    />
  );
};

interface SongRowSkeletonProps {
  className?: string;
}

export const SongRowSkeleton = ({ className }: SongRowSkeletonProps) => (
  <div className={cn("flex items-center gap-3 rounded-lg bg-zinc-800/40 p-3", className)}>
    <Skeleton className="h-12 w-12 shrink-0 rounded-lg md:h-14 md:w-14" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-8 w-8 shrink-0" />
  </div>
);
