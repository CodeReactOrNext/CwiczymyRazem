import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { AddToPlaylistSub } from "feature/songs/components/Playlists/AddToPlaylistSub";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoriteSong } from "feature/user/store/userSlice.favoriteActions";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  Heart,
  ListMusic,
  MoreVertical,
  Play,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const STATUS_META = {
  wantToLearn: { label: "Want to Learn", icon: ListMusic, color: "text-zinc-300", ring: "ring-zinc-400/40" },
  learning: { label: "Learning", icon: BookOpen, color: "text-amber-400", ring: "ring-amber-400/50" },
  learned: { label: "Learned", icon: CheckCircle2, color: "text-green-400", ring: "ring-green-400/50" },
} as const;

interface SongCardMenuProps {
  song: Song;
  userStatus?: SongStatus;
  onStatusChange?: (status: SongStatus | undefined) => void;
  onPlay?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Styling for the trigger button — differs between the grid card and the mobile row. */
  triggerClassName?: string;
}

/**
 * Shared "…" actions menu for a song (open in board, practice, favorite,
 * add to playlist, move between lists, remove). Used by both the grid card
 * and the mobile list row so the actions stay in one place.
 */
export const SongCardMenu = ({
  song,
  userStatus,
  onStatusChange,
  onPlay,
  open,
  onOpenChange,
  triggerClassName,
}: SongCardMenuProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const isFavorite = (userInfo?.favoriteSongIds ?? []).includes(song.id);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Song actions"
          className={triggerClassName}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 space-y-1 rounded-lg bg-zinc-950 p-2 text-zinc-400 shadow-2xl backdrop-blur-xl"
      >
        <DropdownMenuItem
          onClick={() => router.push(`/songs?view=board&songId=${song.id}`)}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          Open in board
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => (onPlay ? onPlay() : router.push(`/timer/song/${song.id}`))}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white"
        >
          <Play className="h-3 w-3 fill-current" />
          Practice
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            dispatch(toggleFavoriteSong({ songId: song.id, isFavorite: !isFavorite }))
          }
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isFavorite ? "text-rose-400 hover:bg-zinc-800" : "hover:bg-zinc-800 hover:text-white"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
          {isFavorite ? "Remove from favorites" : "Add to favorites"}
        </DropdownMenuItem>
        <AddToPlaylistSub song={song} />

        <div className="my-1 h-px bg-white/5" />

        {(["wantToLearn", "learning", "learned"] as const).map((status) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          const isActive = status === userStatus;
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => onStatusChange?.(status)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-zinc-800/50 text-white" : "hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", meta.color)} />
              <span className="flex-1">
                {isActive ? meta.label : `Move to ${meta.label}`}
              </span>
              {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
            </DropdownMenuItem>
          );
        })}

        {userStatus && (
          <>
            <div className="my-1 h-px bg-white/5" />
            <DropdownMenuItem
              onClick={() => onStatusChange?.(undefined)}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove from collection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
