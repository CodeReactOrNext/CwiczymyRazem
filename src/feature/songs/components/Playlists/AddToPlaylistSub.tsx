import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import {
  getUserPlaylists,
  setPlaylistSongs,
  songToEntry,
} from "feature/songs/services/playlists.service";
import type { Playlist } from "feature/songs/types/playlist.types";
import { TOP_LIST_LIMIT } from "feature/songs/types/playlist.types";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Check, ListPlus, Plus } from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { KIND_META } from "./playlistVisuals";

/**
 * "Add to playlist" submenu for song action menus. Mounts only while the
 * parent dropdown is open, so fetching in the effect is cheap (and served
 * from the playlists memory cache after the first open).
 */
export const AddToPlaylistSub = ({ song }: { song: Song }) => {
  const router = useRouter();
  const userId = useAppSelector(selectUserAuth);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    getUserPlaylists(userId).then(setPlaylists);
  }, [userId]);

  const handleAdd = async (playlist: Playlist) => {
    const isFullTop =
      playlist.kind === "top" && playlist.songs.length >= TOP_LIST_LIMIT;
    if (isFullTop) {
      toast.error(`“${playlist.name}” already has its top ${TOP_LIST_LIMIT}.`);
      return;
    }
    try {
      const updatedSongs = [...playlist.songs, songToEntry(song)];
      await setPlaylistSongs(playlist.id, updatedSongs);
      setPlaylists((prev) =>
        prev
          ? prev.map((p) => (p.id === playlist.id ? { ...p, songs: updatedSongs } : p))
          : prev
      );
      posthog.capture("playlist_action", {
        action: "add_song_from_menu",
        playlist_id: playlist.id,
      });
      toast.success(`Added to “${playlist.name}”`);
    } catch (error) {
      console.error("Failed to add song to playlist:", error);
      toast.error("Couldn't add the song. Try again.");
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white data-[state=open]:bg-zinc-800 data-[state=open]:text-white">
        <ListPlus className="h-3.5 w-3.5" />
        Add to playlist
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-56 space-y-1 rounded-lg border-white/5 bg-zinc-950 p-2 text-zinc-400 shadow-2xl">
        {playlists === null ? (
          <div className="px-3 py-2.5 text-xs font-medium text-zinc-500">Loading...</div>
        ) : (
          <>
            {playlists.length === 0 && (
              <div className="px-3 py-2.5 text-xs font-medium text-zinc-500">
                No playlists yet
              </div>
            )}
            {playlists.map((playlist) => {
              const isAdded = playlist.songs.some((s) => s.songId === song.id);
              const KindIcon = KIND_META[playlist.kind]?.icon ?? ListPlus;
              return (
                <DropdownMenuItem
                  key={playlist.id}
                  disabled={isAdded}
                  onClick={(e) => {
                    // Keep the menu open so several playlists can be picked in a row.
                    e.preventDefault();
                    handleAdd(playlist);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    isAdded ? "opacity-60" : "hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <KindIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">{playlist.name}</span>
                  {isAdded && <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />}
                </DropdownMenuItem>
              );
            })}
            <div className="my-1 h-px bg-white/5" />
            <DropdownMenuItem
              onClick={() => router.push("/songs?view=playlists")}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New playlist
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
