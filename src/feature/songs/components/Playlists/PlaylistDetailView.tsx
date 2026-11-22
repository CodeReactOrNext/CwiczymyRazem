import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { pageTitleClass } from "components/PageTitle/PageTitle";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { placeKeyClass } from "feature/leadboard/components/rankRowStyles";
import {
  SONG_ARTIST_SM_CLASS,
  SONG_TITLE_SM_CLASS,
  SongThumb,
} from "feature/songs/components/SongRow/SongRow";
import { TierPick } from "feature/songs/components/SongsGrid/TierBadge";
import {
  deletePlaylist,
  importPlaylist,
  setPlaylistSongs,
  songToEntry,
  togglePlaylistLike,
  updatePlaylistMeta,
} from "feature/songs/services/playlists.service";
import type {
  Playlist,
  PlaylistSongEntry,
} from "feature/songs/types/playlist.types";
import {
  getPlaylistPopularity,
  TOP_LIST_LIMIT,
} from "feature/songs/types/playlist.types";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowDownToLine,
  Check,
  Flag,
  Flame,
  GitFork,
  Globe,
  GripVertical,
  Heart,
  Lock,
  MoreHorizontal,
  Music,
  Pencil,
  Play,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { PlaylistCover } from "./PlaylistCover";
import { getPlaylistAccent, KIND_META } from "./playlistVisuals";
import { SongPickerPanel } from "./SongPickerPanel";

interface PlaylistDetailViewProps {
  playlist: Playlist;
  isOwner: boolean;
  /** Ids of songs the user has fully learned — drives path progress. */
  learnedSongIds: Set<string>;
  /** User's collection, used as quick-add suggestions when adding songs. */
  collectionSongs: Song[];
  onBack: () => void;
  /** Optimistic mirror — parent owns the playlist object. */
  onChanged: (updated: Playlist) => void;
  onDeleted: () => void;
  /** Called with the id of the freshly imported copy. */
  onImported: (newPlaylistId: string) => void;
  onPracticeSong: (songId: string) => void;
  onOpenSong: (songId: string) => void;
}

interface TrackRowProps {
  entry: PlaylistSongEntry;
  index: number;
  kind: Playlist["kind"];
  isOwner: boolean;
  isLearned: boolean;
  /** Whether the previous step is learned — colors the incoming road segment. */
  isPrevLearned: boolean;
  isNextUp: boolean;
  onOpen: () => void;
  onPractice: () => void;
  onRemove: () => void;
}

const TrackRow = ({
  entry,
  index,
  kind,
  isOwner,
  isLearned,
  isPrevLearned,
  isNextUp,
  onOpen,
  onPractice,
  onRemove,
}: TrackRowProps) => {
  const { t } = useTranslation("playlists");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.songId, disabled: !isOwner });

  const tier = getSongTier(
    (entry.avgDifficulty ?? 0) === 0 ? "?" : entry.tier || entry.avgDifficulty || "?"
  );

  const cover = <SongThumb coverUrl={entry.coverUrl} size="sm" />;

  const info = (
    <div className="min-w-0 flex-1">
      <p translate="no" className={SONG_TITLE_SM_CLASS}>
        {entry.title}
      </p>
      <p translate="no" className={SONG_ARTIST_SM_CLASS}>
        {entry.artist}
      </p>
    </div>
  );

  const tierChip = <TierPick tier={tier} className="hidden h-5 w-5 sm:block" />;

  const actions = (
    <div
      className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      {kind !== "playlist" && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t("practice")}
          onClick={onPractice}
          className="text-zinc-400"
        >
          <Play className="fill-current" />
        </Button>
      )}
      {isOwner && (
        <>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t("remove_from_playlist")}
            onClick={onRemove}
            className="text-zinc-400 hover:text-red-400"
          >
            <Trash2 />
          </Button>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t("reorder")}
            {...attributes}
            {...listeners}
            className="hidden cursor-grab touch-none text-zinc-400 hover:text-zinc-200 active:cursor-grabbing sm:flex"
          >
            <GripVertical />
          </Button>
        </>
      )}
    </div>
  );

  // ── Learning path: roadmap checkpoint — spine, road segments, station ────
  if (kind === "path") {
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        onClick={onOpen}
        className={cn("group relative flex cursor-pointer items-stretch", isDragging && "z-20")}
      >
        {/* Road: dashed while untraveled, solid green once behind you */}
        <div className="relative w-10 shrink-0 sm:w-12">
          {index > 0 && (
            <span
              className={cn(
                "absolute left-1/2 top-0 h-1/2 -translate-x-1/2",
                isPrevLearned ? "w-0.5 bg-green-500" : "w-0 border-l border-dashed border-white/20"
              )}
            />
          )}
          <span
            className={cn(
              "absolute bottom-0 left-1/2 top-1/2 -translate-x-1/2",
              isLearned ? "w-0.5 bg-green-500" : "w-0 border-l border-dashed border-white/20"
            )}
          />
          <span
            className={cn(
              "absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
              isLearned
                ? "bg-green-500 text-black"
                : isNextUp
                ? "bg-zinc-950 text-cyan-300 ring-2 ring-cyan-400"
                : "bg-zinc-800 text-zinc-400 ring-1 ring-white/10"
            )}
          >
            {isLearned ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
          </span>
        </div>

        {/* Branch from the spine to the station */}
        <span
          className={cn(
            "hidden h-px w-3 shrink-0 self-center sm:block",
            isLearned ? "bg-green-500/50" : "bg-white/10"
          )}
        />

        {/* Station */}
        <div
          className={cn(
            "my-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 transition-colors sm:px-3",
            isDragging ? "bg-zinc-800/90 shadow-xl" : "bg-zinc-800/40 group-hover:bg-zinc-800/60",
            isLearned && "opacity-75 group-hover:opacity-100"
          )}
        >
          {cover}
          {info}
          {isNextUp && (
            <Chip color='cyan' size='sm' className="hidden shrink-0 sm:inline-flex">
              {t("up_next")}
            </Chip>
          )}
          {tierChip}
          {actions}
        </div>
      </div>
    );
  }

  // ── Ranked top list & plain playlist rows ────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors sm:px-3",
        isDragging ? "z-20 bg-zinc-800/90 shadow-xl" : "hover:bg-white/5"
      )}
    >
      {kind === "top" ? (
        <span
          translate='no'
          className={cn("h-7 w-8 text-xl", placeKeyClass(index + 1, false))}>
          {index + 1}
        </span>
      ) : (
        <span className="relative w-6 shrink-0 text-center sm:w-8">
          <span className="text-sm font-semibold tabular-nums text-zinc-500 group-hover:invisible">
            {index + 1}
          </span>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t("practice")}
            onClick={(e) => {
              e.stopPropagation();
              onPractice();
            }}
            className="invisible absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white group-hover:visible"
          >
            <Play className="fill-current" />
          </Button>
        </span>
      )}

      {cover}
      {info}
      {tierChip}
      {actions}
    </div>
  );
};

export const PlaylistDetailView = ({
  playlist,
  isOwner,
  learnedSongIds,
  collectionSongs,
  onBack,
  onChanged,
  onDeleted,
  onImported,
  onPracticeSong,
  onOpenSong,
}: PlaylistDetailViewProps) => {
  const { t } = useTranslation("playlists");
  const userAuth = useAppSelector(selectUserAuth);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDescription, setEditDescription] = useState(playlist.description ?? "");
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const meta = KIND_META[playlist.kind] ?? KIND_META.playlist;
  const accent = getPlaylistAccent(playlist.id);
  const songs = playlist.songs;
  const isTop = playlist.kind === "top";
  const atCapacity = isTop && songs.length >= TOP_LIST_LIMIT;

  const popularity = getPlaylistPopularity(playlist);
  const likeCount = playlist.likeCount ?? 0;
  const hasLiked = !!userAuth && (playlist.likes ?? []).includes(userAuth);
  const [isLiking, setIsLiking] = useState(false);

  const learnedCount = useMemo(
    () => songs.filter((s) => learnedSongIds.has(s.songId)).length,
    [songs, learnedSongIds]
  );
  const nextUpIndex = useMemo(
    () => songs.findIndex((s) => !learnedSongIds.has(s.songId)),
    [songs, learnedSongIds]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const persistSongs = async (updatedSongs: PlaylistSongEntry[]) => {
    const prev = playlist;
    onChanged({ ...playlist, songs: updatedSongs });
    try {
      await setPlaylistSongs(playlist.id, updatedSongs);
    } catch (error) {
      console.error("Failed to update playlist songs:", error);
      onChanged(prev);
      toast.error(t("errors.save_changes"));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = songs.findIndex((s) => s.songId === active.id);
    const newIndex = songs.findIndex((s) => s.songId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    persistSongs(arrayMove(songs, oldIndex, newIndex));
  };

  const handleAddSong = (song: Song) => {
    if (songs.some((s) => s.songId === song.id)) return;
    if (atCapacity) return;
    persistSongs([...songs, songToEntry(song)]);
    posthog.capture("playlist_action", { action: "add_song", playlist_id: playlist.id });
  };

  const handleRemoveSong = (songId: string) => {
    persistSongs(songs.filter((s) => s.songId !== songId));
  };

  const handleToggleVisibility = async (nextPublic: boolean) => {
    if (nextPublic === playlist.isPublic) return;
    const prev = playlist;
    onChanged({ ...playlist, isPublic: nextPublic });
    try {
      await updatePlaylistMeta(playlist.id, { isPublic: nextPublic });
      posthog.capture("playlist_action", {
        action: nextPublic ? "make_public" : "make_private",
        playlist_id: playlist.id,
      });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      onChanged(prev);
      toast.error(t("errors.visibility"));
    }
  };

  const handleSaveMeta = async () => {
    if (!editName.trim()) return;
    setIsSavingMeta(true);
    const prev = playlist;
    const updated = {
      ...playlist,
      name: editName.trim(),
      description: editDescription.trim(),
    };
    onChanged(updated);
    try {
      await updatePlaylistMeta(playlist.id, {
        name: updated.name,
        description: updated.description,
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error("Failed to update playlist meta:", error);
      onChanged(prev);
      toast.error(t("errors.save_details"));
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlist.id);
      posthog.capture("playlist_action", { action: "delete", playlist_id: playlist.id });
      toast.success(t("deleted"));
      onDeleted();
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      toast.error(t("errors.delete"));
    }
  };

  const handleImport = async () => {
    if (!userAuth) return;
    setIsImporting(true);
    try {
      const newId = await importPlaylist(playlist, userAuth, userName, userAvatar);
      posthog.capture("playlist_action", { action: "import", playlist_id: playlist.id });
      toast.success(t("saved_copy"));
      onImported(newId);
    } catch (error) {
      console.error("Failed to import playlist:", error);
      toast.error(t("errors.save_copy"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!userAuth || isLiking) return;
    const nextLiked = !hasLiked;

    // Optimistic — reflect the like and count immediately.
    const optimisticLikes = nextLiked
      ? [...(playlist.likes ?? []), userAuth]
      : (playlist.likes ?? []).filter((id) => id !== userAuth);
    onChanged({
      ...playlist,
      likes: optimisticLikes,
      likeCount: Math.max(0, likeCount + (nextLiked ? 1 : -1)),
    });

    setIsLiking(true);
    try {
      await togglePlaylistLike(playlist, userAuth);
      posthog.capture("playlist_action", {
        action: nextLiked ? "like" : "unlike",
        playlist_id: playlist.id,
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      onChanged(playlist); // revert to the pre-click snapshot
      toast.error(t("errors.like"));
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="relative min-h-full">
      {/* Hue wash behind the header, like a dominant-color album header */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px]"
        style={{
          background: `linear-gradient(to bottom, ${accent}2e 0%, ${accent}14 45%, transparent 100%)`,
        }}
      />

      <div className={cn("relative z-10 space-y-7", PAGE_CONTENT)}>
        <BackLink label='Back to playlists' onClick={onBack} />

        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          <PlaylistCover
            playlist={playlist}
            className="h-40 w-40 shrink-0 rounded-md shadow-2xl md:h-48 md:w-48"
            iconSize={48}
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold">
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  playlist.kind === "path"
                    ? "text-cyan-300"
                    : playlist.kind === "top"
                    ? "text-amber-300"
                    : "text-zinc-300"
                )}
              >
                <meta.icon className="h-3.5 w-3.5" />
                {t(`kinds.${playlist.kind}.label`, meta.label)}
              </span>
              {playlist.isPublic ? (
                <span className="flex items-center gap-1 font-medium text-zinc-500">
                  <Globe className="h-3 w-3" /> public
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium text-zinc-500">
                  <Lock className="h-3 w-3" /> private
                </span>
              )}
              {playlist.kind !== "playlist" && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-zinc-600 sm:block" />
                  <span className="w-full font-medium text-zinc-500 sm:w-auto">
                    {t(`kinds.${playlist.kind}.tagline`, meta.tagline)}
                  </span>
                </>
              )}
            </div>

            <h1
              translate="no"
              className={cn("break-words", pageTitleClass)}
            >
              {playlist.name}
            </h1>

            {playlist.description && (
              <p className="max-w-xl text-sm font-medium leading-relaxed text-zinc-400">
                {playlist.description}
              </p>
            )}

            <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-400">
              {playlist.ownerName && (
                <>
                  <UserTooltip userId={playlist.ownerId}>
                    <Link
                      href={`/user/${playlist.ownerId}`}
                      className="flex items-center gap-1.5 hover:opacity-80"
                    >
                      <Avatar
                        size="2xs"
                        name={playlist.ownerName}
                        avatarURL={playlist.ownerAvatar || undefined}
                      />
                      <span className="font-bold text-white">{playlist.ownerName}</span>
                    </Link>
                  </UserTooltip>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                </>
              )}
              <span>{songs.length === 1 ? "1 song" : `${songs.length} songs`}</span>
              {playlist.importCount > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span>
                    saved {playlist.importCount === 1 ? "once" : `${playlist.importCount} times`}
                  </span>
                </>
              )}
              {likeCount > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                    {likeCount}
                  </span>
                </>
              )}
              {playlist.importedFrom?.ownerName && (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <UserTooltip userId={playlist.importedFrom.ownerId ?? null}>
                    <Link
                      href={
                        playlist.importedFrom.ownerId
                          ? `/user/${playlist.importedFrom.ownerId}`
                          : "#"
                      }
                      onClick={(e) => {
                        if (!playlist.importedFrom?.ownerId) e.preventDefault();
                      }}
                      className={cn(
                        "flex items-center gap-1.5 text-zinc-500",
                        playlist.importedFrom.ownerId && "hover:text-zinc-300"
                      )}
                    >
                      <GitFork className="h-3 w-3" />
                      <Avatar
                        size="2xs"
                        name={playlist.importedFrom.ownerName}
                        avatarURL={playlist.importedFrom.ownerAvatar || undefined}
                      />
                      {t("from_owner", { name: playlist.importedFrom.ownerName })}
                    </Link>
                  </UserTooltip>
                </>
              )}
            </p>

            {/* Popularity — a single trending signal blending saves and likes */}
            {popularity > 0 && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5">
                <Flame
                  className={cn(
                    "h-4 w-4",
                    popularity >= 30
                      ? "text-orange-400"
                      : popularity >= 10
                      ? "text-amber-400"
                      : "text-zinc-400"
                  )}
                />
                <span className="text-xs font-bold text-white">{popularity}</span>
                <span className="text-xs font-medium text-zinc-500">popularity</span>
              </div>
            )}

            {playlist.kind === "path" && songs.length > 0 && (
              <div className="max-w-sm space-y-1.5 pt-1">
                <div className="flex items-baseline justify-between text-xs font-semibold">
                  <span className="text-zinc-400">
                    {t("mastered_of", { done: learnedCount, total: songs.length })}
                  </span>
                  <span className="tabular-nums text-zinc-500">
                    {Math.round((learnedCount / songs.length) * 100)}%
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-slow"
                    style={{ width: `${(learnedCount / songs.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwner ? (
            <>
              <Button
                onClick={() => setIsAddOpen(true)}
                size="lg"
              >
                <Plus />
                {t("add_songs")}
              </Button>
              <Button
                variant="subtle"
                size="lg"
                onClick={() => setIsShareOpen(true)}
              >
                <Share2 />
                {t("share")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={t("options")}
                    className="text-zinc-300"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-52 space-y-1"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setEditName(playlist.name);
                      setEditDescription(playlist.description ?? "");
                      setIsEditOpen(true);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t("edit_details")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleToggleVisibility(!playlist.isPublic)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white"
                  >
                    {playlist.isPublic ? (
                      <>
                        <Lock className="h-3.5 w-3.5" /> Make private
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5" /> Make public
                      </>
                    )}
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-white/5" />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteOpen(true)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                onClick={handleImport}
                loading={isImporting}
                size="lg"
              >
                {!isImporting && <ArrowDownToLine />}
                {t("save_to_yours")}
              </Button>
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={isLiking}
                aria-pressed={hasLiked}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-60",
                  hasLiked
                    ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Heart className={cn("h-4 w-4", hasLiked && "fill-current")} />
                {likeCount > 0 ? likeCount : t("like")}
              </button>
            </>
          )}
        </div>

        {/* Track list */}
        {songs.length === 0 ? (
          <EmptyState
            icon={<Music />}
            title={t("empty.title")}
            description={
              isOwner
                ? isTop
                  ? t("empty.owner_top", { count: TOP_LIST_LIMIT })
                  : t("empty.owner")
                : t("empty.other")
            }
            action={
              isOwner && (
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus />
                  {t("add_songs")}
                </Button>
              )
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={songs.map((s) => s.songId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-w-4xl">
                {songs.map((entry, index) => (
                  <TrackRow
                    key={entry.songId}
                    entry={entry}
                    index={index}
                    kind={playlist.kind}
                    isOwner={isOwner}
                    isLearned={learnedSongIds.has(entry.songId)}
                    isPrevLearned={
                      index > 0 && learnedSongIds.has(songs[index - 1].songId)
                    }
                    isNextUp={playlist.kind === "path" && index === nextUpIndex}
                    onOpen={() => onOpenSong(entry.songId)}
                    onPractice={() => onPracticeSong(entry.songId)}
                    onRemove={() => handleRemoveSong(entry.songId)}
                  />
                ))}

                {/* Roadmap finish flag — lights up once every song is mastered */}
                {playlist.kind === "path" && (
                  <div className="flex items-stretch">
                    <div className="relative h-16 w-10 shrink-0 sm:w-12">
                      <span
                        className={cn(
                          "absolute left-1/2 top-0 h-1/2 -translate-x-1/2",
                          learnedSongIds.has(songs[songs.length - 1].songId)
                            ? "w-0.5 bg-green-500"
                            : "w-0 border-l border-dashed border-white/20"
                        )}
                      />
                      <span
                        className={cn(
                          "absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors",
                          learnedCount === songs.length
                            ? "bg-amber-400 text-black"
                            : "bg-zinc-900 text-zinc-500 ring-1 ring-white/10"
                        )}
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <span className="hidden w-3 shrink-0 sm:block" />
                    <div className="flex flex-col justify-center">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          learnedCount === songs.length ? "text-amber-300" : "text-white"
                        )}
                      >
                        {learnedCount === songs.length ? t("path_complete") : t("final_stop")}
                      </p>
                      <p className="text-xs font-medium text-zinc-500">
                        {learnedCount === songs.length
                          ? t("every_mastered")
                          : songs.length - learnedCount === 1
                            ? t("more_to_master_one")
                            : t("more_to_master", { count: songs.length - learnedCount })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Share dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="bg-zinc-950 sm:max-w-md">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-white">
              {t(`share_title.${playlist.kind}`)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleVisibility(false)}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-xl p-3.5 text-left transition-all",
                  !playlist.isPublic ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/[0.06]"
                )}
              >
                <Lock className={cn("h-4 w-4 shrink-0", !playlist.isPublic ? "text-white" : "text-zinc-500")} />
                <div>
                  <p className={cn("text-sm font-bold", !playlist.isPublic ? "text-white" : "text-zinc-400")}>
                    {t("private")}
                  </p>
                  <p className="text-[11px] font-medium text-zinc-500">{t("private_hint")}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleToggleVisibility(true)}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-xl p-3.5 text-left transition-all",
                  playlist.isPublic ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/[0.06]"
                )}
              >
                <Globe className={cn("h-4 w-4 shrink-0", playlist.isPublic ? "text-white" : "text-zinc-500")} />
                <div>
                  <p className={cn("text-sm font-bold", playlist.isPublic ? "text-white" : "text-zinc-400")}>
                    {t("public")}
                  </p>
                  <p className="text-[11px] font-medium text-zinc-500">
                    {t("public_hint")}
                  </p>
                </div>
              </button>
            </div>

            {playlist.isPublic ? (
              <p className="rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-500">
                {t(`live_in_discover.${playlist.kind}`)}
              </p>
            ) : (
              <p className="rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-500">
                {t("private_note")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit details dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-zinc-950 sm:max-w-md">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-white">
              {t("edit_details")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="ml-1 font-bold text-zinc-400">
                {t("name")}
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc" className="ml-1 font-bold text-zinc-400">
                {t("description")}
              </Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={300}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveMeta} disabled={!editName.trim()} loading={isSavingMeta}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add songs dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="flex h-full flex-col bg-zinc-950 sm:h-[560px]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-white">
              {t("add_songs")}
              {isTop && (
                <span className="ml-2 text-sm font-semibold text-zinc-500">
                  {songs.length}/{TOP_LIST_LIMIT}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {atCapacity && (
            <p className="mb-2 rounded-lg bg-amber-400/10 px-3 py-2.5 text-xs font-semibold text-amber-300">
              {t("top_full", { count: TOP_LIST_LIMIT })}
            </p>
          )}
          <SongPickerPanel
            existingIds={new Set(songs.map((s) => s.songId))}
            onAdd={handleAddSong}
            collectionSongs={collectionSongs}
            canAdd={!atCapacity}
            allowCreate
            className="min-h-0 flex-1"
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t("delete_title", { name: playlist.name })}
        description={t(`delete_body.${playlist.kind}`)}
        cancelLabel={t("keep_it")}
        confirmLabel={t("delete")}
        onConfirm={() => {
          setIsDeleteOpen(false);
          void handleDelete();
        }}
        destructive
      />
    </div>
  );
};
