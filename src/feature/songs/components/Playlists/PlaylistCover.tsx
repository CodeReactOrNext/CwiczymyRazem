import { cn } from "assets/lib/utils";
import type { Playlist } from "feature/songs/types/playlist.types";

import { getPlaylistGradient, KIND_META } from "./playlistVisuals";

interface PlaylistCoverProps {
  playlist: Playlist;
  className?: string;
  /** Icon size for the gradient fallback. */
  iconSize?: number;
}

/**
 * Spotify-style cover: a 2×2 mosaic of the first four song covers, a single
 * cover when there aren't enough, or a deterministic gradient with the kind
 * icon when the playlist has no artwork at all.
 */
export const PlaylistCover = ({ playlist, className, iconSize = 28 }: PlaylistCoverProps) => {
  const covers = playlist.songs
    .map((s) => s.coverUrl)
    .filter((url): url is string => !!url)
    .slice(0, 4);

  const KindIcon = KIND_META[playlist.kind]?.icon ?? KIND_META.playlist.icon;

  if (covers.length >= 4) {
    return (
      <div className={cn("grid grid-cols-2 grid-rows-2 overflow-hidden", className)}>
        {covers.map((url, i) => (
          <img key={i} src={url} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
    );
  }

  if (covers.length > 0) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <img src={covers[0]} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden", className)}
      style={{ background: getPlaylistGradient(playlist.id) }}
    >
      <KindIcon size={iconSize} className="text-white/40" />
    </div>
  );
};
