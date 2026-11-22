import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { Ripple } from "components/Ripple/Ripple";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { SongRowSkeleton } from "feature/songs/components/SongsGrid/SongCardRow";
import {
  getPlaylistById,
  getPublicPlaylists,
  getUserPlaylists,
} from "feature/songs/services/playlists.service";
import type { Playlist } from "feature/songs/types/playlist.types";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
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

/** Below this many playlists the grid's "New playlist" tile is the create entry. */
const FEW_PLAYLISTS = 4;

const GRID_CLASS =
  "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5";

const CardSkeleton = () => (
  <div className="flex flex-col p-3">
    <Skeleton className="aspect-square w-full rounded-lg" />
    <Skeleton className="mt-3 h-4 w-3/4" />
    <Skeleton className="mt-2 h-3 w-1/2" />
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
  const { t } = useTranslation("playlists");
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
        <div className={PAGE_CONTENT}>
          <EmptyState
            icon={<ListMusic />}
            title={t("view.not_available")}
            description={t("view.not_available_body")}
            action={
              <BackLink
                label={t("view.back")}
                onClick={() => onOpenPlaylist(null)}
              />
            }
          />
        </div>
      );
    }

    if (!activePlaylist) {
      return (
        <div className={cn("space-y-6", PAGE_CONTENT)} aria-busy="true">
          <div className="flex items-end gap-6">
            <Skeleton className="h-40 w-40 rounded-lg md:h-48 md:w-48" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <SongRowSkeleton key={i} className="bg-transparent px-2 py-2 sm:px-3" />
            ))}
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

  // One "new playlist" entry at a time: the tile in the grid while the list is
  // short, the header button once the tile would sit off among many cards.
  // The empty state carries its own "Create one", so neither shows there.
  const hasMine = !isLoading && myPlaylists.length > 0;
  const showCreateTile = tab === "mine" && myPlaylists.length < FEW_PLAYLISTS;
  const showCreateButton =
    tab === "discover" || (hasMine && myPlaylists.length >= FEW_PLAYLISTS);

  return (
    <div className={cn("space-y-8 animate-in fade-in-50 duration-base", PAGE_CONTENT)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="sr-only">{t("view.title")}</h1>
        <SegmentedControl<PlaylistTab>
          label={t("view.title")}
          selected={[tab]}
          onSelect={(value) => {
            setTab(value);
            if (value === "discover") {
              posthog.capture("playlist_action", { action: "open_discover" });
            }
          }}
          options={[
            {
              value: "mine",
              label: t("view.yours"),
              icon: <ListMusic size={15} className="shrink-0 text-zinc-400" />,
            },
            {
              value: "discover",
              label: t("view.discover"),
              icon: <Compass size={15} className="shrink-0 text-zinc-400" />,
            },
          ]}
        />

        {showCreateButton && (
          <Button
            onClick={() => setIsCreatorOpen(true)}
            size="lg"
          >
            <Plus />
            {t("view.new")}
          </Button>
        )}
      </div>

      {isLoading && userAuth ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tab === "mine" && myPlaylists.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            mood='lookAround'
            title={t("view.first_title")}
            description={t("view.first_body")}
            action={
              <Button
                onClick={() => setIsCreatorOpen(true)}
                size="lg"
              >
                <Plus />
                {t("view.create_one")}
              </Button>
            }
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(KIND_META) as (keyof typeof KIND_META)[]).map((k) => {
              const meta = KIND_META[k];
              const Icon = meta.icon;
              return (
                <div
                  key={k}
                  className="flex flex-col items-start gap-2 rounded-lg bg-zinc-800/40 p-4 text-left"
                >
                  <Icon className="h-4 w-4 text-zinc-400" />
                  <p className="text-sm font-bold text-white">{t(`kinds.${k}.label`, meta.label)}</p>
                  <p className="text-xs font-medium leading-snug text-zinc-500">
                    {t(`kinds.${k}.tagline`, meta.tagline)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : tab === "discover" && discoverPlaylists.length === 0 ? (
        <EmptyState
          mood='lookAround'
          title={t("view.nothing_public")}
          description={t("view.nothing_public_body")}
        />
      ) : (
        <div className={GRID_CLASS}>
          {showCreateTile && (
            <button
              type="button"
              onClick={() => setIsCreatorOpen(true)}
              className="group relative flex flex-col rounded-md p-3 text-left transition-all duration-base hover:bg-zinc-800/40"
            >
              <Ripple />
              <div className="flex aspect-square w-full items-center justify-center rounded-md bg-white/[0.04] text-zinc-500 transition-colors group-hover:text-white">
                <Plus className="h-8 w-8" />
              </div>
              <p className="pt-3 text-base font-bold text-white">{t("view.new")}</p>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {t("view.kinds_hint")}
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
