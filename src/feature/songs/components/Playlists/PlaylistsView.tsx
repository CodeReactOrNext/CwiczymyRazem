import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import {
  getPlaylistById,
  getPublicPlaylists,
  getUserPlaylists,
} from "feature/songs/services/playlists.service";
import type { Playlist } from "feature/songs/types/playlist.types";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Compass, ListMusic, Plus } from "lucide-react";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import { PlaylistCard } from "./PlaylistCard";
import { PlaylistCreator } from "./PlaylistCreator";
import { PlaylistDetailView } from "./PlaylistDetailView";
import { KIND_META } from "./playlistVisuals";

type PlaylistTab = "mine" | "discover";

interface PlaylistsViewProps {
  /** Playlist id from the URL — deep links land here. */
  activePlaylistId: string | null;
  /** Push/clear the playlistId query param (shallow routing). */
  onOpenPlaylist: (playlistId: string | null) => void;
  /** User's collection (all three lists merged) for quick-add suggestions. */
  collectionSongs: Song[];
  learnedSongIds: Set<string>;
  onPracticeSong: (songId: string) => void;
  onOpenSong: (songId: string) => void;
}

const GRID_CLASS =
  "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5";

const CardSkeleton = () => (
  <div className="flex flex-col p-3">
    <div className="aspect-square w-full animate-pulse rounded-md bg-zinc-800/60" />
    <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-zinc-800/60" />
    <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-800/40" />
  </div>
);

export const PlaylistsView = ({
  activePlaylistId,
  onOpenPlaylist,
  collectionSongs,
  learnedSongIds,
  onPracticeSong,
  onOpenSong,
}: PlaylistsViewProps) => {
  const userAuth = useAppSelector(selectUserAuth);

  const [tab, setTab] = useState<PlaylistTab>("mine");
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Detail resolution: prefer the copy in the loaded lists; fall back to a
  // direct fetch for deep links to playlists we don't have locally.
  const [fetchedPlaylist, setFetchedPlaylist] = useState<Playlist | null>(null);
  const [notFoundId, setNotFoundId] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    if (!userAuth) return;
    try {
      const [mine, pub] = await Promise.all([
        getUserPlaylists(userAuth),
        getPublicPlaylists(),
      ]);
      setMyPlaylists(mine);
      setPublicPlaylists(pub);
    } finally {
      setIsLoading(false);
    }
  }, [userAuth]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const localPlaylist = useMemo(
    () =>
      activePlaylistId
        ? [...myPlaylists, ...publicPlaylists].find((p) => p.id === activePlaylistId) ?? null
        : null,
    [activePlaylistId, myPlaylists, publicPlaylists]
  );

  const activePlaylist =
    localPlaylist ??
    (fetchedPlaylist?.id === activePlaylistId ? fetchedPlaylist : null);

  const detailNotFound =
    !!activePlaylistId && !activePlaylist && notFoundId === activePlaylistId;

  // Deep-link fetch for playlists we don't have locally (shared-link case).
  useEffect(() => {
    if (!activePlaylistId || localPlaylist) return;

    let cancelled = false;
    getPlaylistById(activePlaylistId).then((fetched) => {
      if (cancelled) return;
      if (fetched) setFetchedPlaylist(fetched);
      else setNotFoundId(activePlaylistId);
    });
    return () => {
      cancelled = true;
    };
  }, [activePlaylistId, localPlaylist]);

  const discoverPlaylists = useMemo(
    () => publicPlaylists.filter((p) => p.ownerId !== userAuth),
    [publicPlaylists, userAuth]
  );

  const handleChanged = (updated: Playlist) => {
    setMyPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setPublicPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setFetchedPlaylist((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleDeleted = () => {
    setMyPlaylists((prev) => prev.filter((p) => p.id !== activePlaylist?.id));
    setPublicPlaylists((prev) => prev.filter((p) => p.id !== activePlaylist?.id));
    setFetchedPlaylist(null);
    onOpenPlaylist(null);
  };

  const handleCreated = async (playlistId: string) => {
    await loadPlaylists();
    setTab("mine");
    onOpenPlaylist(playlistId);
  };

  const handleImported = async (newPlaylistId: string) => {
    await loadPlaylists();
    setTab("mine");
    onOpenPlaylist(newPlaylistId);
  };

  // ── Detail ──────────────────────────────────────────────────────────────
  if (activePlaylistId) {
    if (detailNotFound) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-10 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500">
            <ListMusic size={26} />
          </div>
          <h3 className="mb-1 text-lg font-bold text-white">Playlist not available</h3>
          <p className="max-w-xs text-sm text-zinc-500">
            It may have been deleted, or it’s private and only its owner can open it.
          </p>
          <Button
            variant="ghost"
            onClick={() => onOpenPlaylist(null)}
            className="mt-6 h-10 bg-white/5 px-5 font-bold text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Back to playlists
          </Button>
        </div>
      );
    }

    if (!activePlaylist) {
      return (
        <div className="space-y-6 p-4 sm:p-6 md:p-10">
          <div className="flex items-end gap-6">
            <div className="h-40 w-40 animate-pulse rounded-md bg-zinc-800/60 md:h-48 md:w-48" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-800/60" />
              <div className="h-10 w-2/3 animate-pulse rounded bg-zinc-800/60" />
              <div className="h-3 w-40 animate-pulse rounded bg-zinc-800/40" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <PlaylistDetailView
        playlist={activePlaylist}
        isOwner={activePlaylist.ownerId === userAuth}
        learnedSongIds={learnedSongIds}
        collectionSongs={collectionSongs}
        onBack={() => onOpenPlaylist(null)}
        onChanged={handleChanged}
        onDeleted={handleDeleted}
        onImported={handleImported}
        onPracticeSong={onPracticeSong}
        onOpenSong={onOpenSong}
      />
    );
  }

  // ── Grid ────────────────────────────────────────────────────────────────
  const shownPlaylists = tab === "mine" ? myPlaylists : discoverPlaylists;

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-10 animate-in fade-in-50 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Playlists</h1>
          <div className="flex w-fit rounded-xl bg-zinc-900/50 p-1">
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={cn(
                "relative flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                tab === "mine"
                  ? "bg-zinc-800 text-white shadow-lg"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Ripple />
              <ListMusic size={14} className={tab === "mine" ? "text-white" : ""} />
              Your playlists
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("discover");
                posthog.capture("playlist_action", { action: "open_discover" });
              }}
              className={cn(
                "relative flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                tab === "discover"
                  ? "bg-zinc-800 text-white shadow-lg"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Ripple />
              <Compass size={14} className={tab === "discover" ? "text-white" : ""} />
              Discover
            </button>
          </div>
        </div>

        <Button
          onClick={() => setIsCreatorOpen(true)}
          className="h-10 px-5 font-bold"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New playlist
          </span>
        </Button>
      </div>

      {isLoading && userAuth ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tab === "mine" && myPlaylists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <h3 className="mb-2 text-xl font-bold text-white">Make your first playlist</h3>
          <p className="mb-8 max-w-sm text-sm text-zinc-400">
            Group songs into anything — a mood, a set for the next jam, a learning
            roadmap or a top 10 you’d defend in an argument.
          </p>
          <div className="mb-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
            {(Object.keys(KIND_META) as (keyof typeof KIND_META)[]).map((k) => {
              const meta = KIND_META[k];
              const Icon = meta.icon;
              return (
                <div
                  key={k}
                  className="flex flex-col items-start gap-2 rounded-xl bg-white/[0.03] p-4 text-left"
                >
                  <Icon className="h-4 w-4 text-zinc-400" />
                  <p className="text-sm font-bold text-white">{meta.label}</p>
                  <p className="text-xs font-medium leading-snug text-zinc-500">
                    {meta.tagline}
                  </p>
                </div>
              );
            })}
          </div>
          <Button
            onClick={() => setIsCreatorOpen(true)}
            className="h-11 px-6 font-bold"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create one
            </span>
          </Button>
        </div>
      ) : tab === "discover" && discoverPlaylists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500">
            <ListMusic size={26} />
          </div>
          <h3 className="mb-1 text-lg font-bold text-white">Nothing public yet</h3>
          <p className="max-w-xs text-sm text-zinc-500">
            When players share their playlists, they’ll show up here. Make one of
            yours public to get things going.
          </p>
        </div>
      ) : (
        <div className={GRID_CLASS}>
          {tab === "mine" && (
            <button
              type="button"
              onClick={() => setIsCreatorOpen(true)}
              className="group relative flex flex-col rounded-md p-3 text-left transition-all duration-300 hover:bg-zinc-800/40"
            >
              <Ripple />
              <div className="flex aspect-square w-full items-center justify-center rounded-md bg-white/[0.04] text-zinc-500 transition-colors group-hover:text-white">
                <Plus className="h-8 w-8" />
              </div>
              <p className="pt-3 text-base font-bold text-white">New playlist</p>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                Playlist, path or top 10
              </p>
            </button>
          )}
          {shownPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              showOwner={tab === "discover"}
              learnedSongIds={learnedSongIds}
              onOpen={() => {
                posthog.capture("playlist_action", {
                  action: "open",
                  playlist_id: playlist.id,
                  source: tab,
                });
                onOpenPlaylist(playlist.id);
              }}
            />
          ))}
        </div>
      )}

      <PlaylistCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onCreated={handleCreated}
        collectionSongs={collectionSongs}
      />
    </div>
  );
};
