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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
import { Button } from "assets/components/ui/button";
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
import {
  ArrowDownToLine,
  ArrowLeft,
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
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { PlaylistCover } from "./PlaylistCover";
import { getPlaylistAccent, KIND_META } from "./playlistVisuals";
import { SongPickerPanel } from "./SongPickerPanel";

const RANK_TINTS: Record<number, string> = {
  0: "text-amber-300",
  1: "text-zinc-300",
  2: "text-orange-400/90",
};

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.songId, disabled: !isOwner });

  const tier = getSongTier(
    (entry.avgDifficulty ?? 0) === 0 ? "?" : entry.tier || entry.avgDifficulty || "?"
  );

  const cover = (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[4px] bg-zinc-800">
      {entry.coverUrl ? (
        <img src={entry.coverUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-600">
          <Music className="h-4 w-4" />
        </div>
      )}
    </div>
  );

  const info = (
    <div className="min-w-0 flex-1">
      <p translate="no" className="truncate text-sm font-semibold text-white">
        {entry.title}
      </p>
      <p translate="no" className="truncate text-xs text-zinc-500">
        {entry.artist}
      </p>
    </div>
  );

  const tierChip = (
    <span
      className="hidden shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold sm:inline"
      style={{ backgroundColor: `${tier.color}14`, color: tier.color }}
    >
      {tier.tier}
    </span>
  );

  const actions = (
    <div
      className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      {kind !== "playlist" && (
        <button
          aria-label="Practice"
          onClick={onPractice}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
        </button>
      )}
      {isOwner && (
        <>
          <button
            aria-label="Remove from playlist"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Reorder"
            {...attributes}
            {...listeners}
            className="hidden h-8 w-8 cursor-grab touch-none items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-white/10 hover:text-zinc-300 active:cursor-grabbing sm:flex"
          >
            <GripVertical className="h-4 w-4" />
          </button>
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
            isDragging ? "bg-zinc-800/90 shadow-xl" : "bg-white/[0.02] group-hover:bg-white/[0.06]",
            isLearned && "opacity-75 group-hover:opacity-100"
          )}
        >
          {cover}
          {info}
          {isNextUp && (
            <span className="hidden shrink-0 rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 sm:inline">
              up next
            </span>
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
          className={cn(
            "w-8 shrink-0 text-center text-2xl font-black tabular-nums leading-none sm:w-10",
            RANK_TINTS[index] ?? "text-zinc-600"
          )}
        >
          {index + 1}
        </span>
      ) : (
        <span className="relative w-6 shrink-0 text-center sm:w-8">
          <span className="text-sm font-semibold tabular-nums text-zinc-500 group-hover:invisible">
            {index + 1}
          </span>
          <button
            aria-label="Practice"
            onClick={(e) => {
              e.stopPropagation();
              onPractice();
            }}
            className="invisible absolute inset-0 flex items-center justify-center text-white group-hover:visible"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
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
      toast.error("Couldn't save changes. Try again.");
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
      toast.error("Couldn't change visibility.");
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
      toast.error("Couldn't save details.");
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlist.id);
      posthog.capture("playlist_action", { action: "delete", playlist_id: playlist.id });
      toast.success("Playlist deleted");
      onDeleted();
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      toast.error("Couldn't delete the playlist.");
    }
  };

  const handleImport = async () => {
    if (!userAuth) return;
    setIsImporting(true);
    try {
      const newId = await importPlaylist(playlist, userAuth, userName, userAvatar);
      posthog.capture("playlist_action", { action: "import", playlist_id: playlist.id });
      toast.success("Saved to your playlists");
      onImported(newId);
    } catch (error) {
      console.error("Failed to import playlist:", error);
      toast.error("Couldn't save this playlist.");
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
      toast.error("Couldn't update your like.");
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

      <div className="relative z-10 space-y-7 p-4 sm:p-6 md:p-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="bg-white/5 px-4 text-zinc-400 backdrop-blur-md hover:text-white"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft size={16} />
            <span className="text-xs font-bold">Back to playlists</span>
          </span>
        </Button>

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
                {meta.label}
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
                    {meta.tagline}
                  </span>
                </>
              )}
            </div>

            <h1
              translate="no"
              className={cn(
                "break-words font-black tracking-tight text-white",
                playlist.name.length > 40 ? "text-2xl md:text-4xl" : "text-3xl md:text-5xl"
              )}
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
                  <span className="flex items-center gap-1.5">
                    {playlist.ownerAvatar ? (
                      <img
                        src={playlist.ownerAvatar}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-bold text-zinc-300">
                        {playlist.ownerName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="font-bold text-white">{playlist.ownerName}</span>
                  </span>
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
                  <span className="flex items-center gap-1 text-zinc-500">
                    <GitFork className="h-3 w-3" />
                    from {playlist.importedFrom.ownerName}
                  </span>
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
                    {learnedCount} of {songs.length} mastered
                  </span>
                  <span className="tabular-nums text-zinc-500">
                    {Math.round((learnedCount / songs.length) * 100)}%
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-700"
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
                className="h-10 px-5 font-bold"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add songs
                </span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsShareOpen(true)}
                className="h-10 bg-white/5 px-5 font-bold text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Playlist options"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-52 space-y-1 rounded-lg bg-zinc-950 p-2 text-zinc-400 shadow-2xl"
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
                    Edit details
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
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="h-10 px-5 font-bold"
              >
                <span className="flex items-center gap-2">
                  {isImporting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <ArrowDownToLine className="h-4 w-4" />
                  )}
                  Save to your playlists
                </span>
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
                {likeCount > 0 ? likeCount : "Like"}
              </button>
            </>
          )}
        </div>

        {/* Track list */}
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500">
              <Music size={26} />
            </div>
            <h3 className="mb-1 text-lg font-bold text-white">Nothing here yet</h3>
            <p className="max-w-xs text-sm text-zinc-500">
              {isOwner
                ? isTop
                  ? `Pick your top ${TOP_LIST_LIMIT} — the order is the ranking.`
                  : "Add songs from the library or your collection to fill this in."
                : "The author hasn't added any songs yet."}
            </p>
            {isOwner && (
              <Button
                onClick={() => setIsAddOpen(true)}
                variant="ghost"
                className="mt-6 h-10 bg-white/5 px-5 font-bold text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add songs
                </span>
              </Button>
            )}
          </div>
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
                            ? "bg-amber-400 text-black shadow-[0_0_24px_rgba(251,191,36,0.35)]"
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
                        {learnedCount === songs.length ? "Path complete" : "Final stop"}
                      </p>
                      <p className="text-xs font-medium text-zinc-500">
                        {learnedCount === songs.length
                          ? "Every song mastered — take a bow."
                          : `${songs.length - learnedCount} more ${
                              songs.length - learnedCount === 1 ? "song" : "songs"
                            } to master`}
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
        <DialogContent className="max-w-md border-white/5 bg-zinc-950 p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-openSans text-xl font-bold text-white">
              Share this {meta.label.toLowerCase()}
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
                    Private
                  </p>
                  <p className="text-[11px] font-medium text-zinc-500">Only you can see it</p>
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
                    Public
                  </p>
                  <p className="text-[11px] font-medium text-zinc-500">
                    Listed in Discover for everyone
                  </p>
                </div>
              </button>
            </div>

            {playlist.isPublic ? (
              <p className="rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-500">
                This {meta.label.toLowerCase()} is live in Discover — other players can
                open it and save a copy to their library.
              </p>
            ) : (
              <p className="rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-500">
                Only you can see it. Switch to public to share it in Discover.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit details dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md border-white/5 bg-zinc-950 p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-openSans text-xl font-bold text-white">
              Edit details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="ml-1 font-bold text-zinc-400">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                className="h-12 border-white/5 bg-white/5 font-medium transition-all focus:border-cyan-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc" className="ml-1 font-bold text-zinc-400">
                Description
              </Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={300}
                rows={3}
                className="resize-none border-white/5 bg-white/5 font-medium transition-all focus:border-cyan-500/50"
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
              <Button onClick={handleSaveMeta} disabled={isSavingMeta || !editName.trim()}>
                {isSavingMeta ? <span className="loading loading-spinner loading-sm" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add songs dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="flex h-full max-w-none flex-col border-white/5 bg-zinc-950 p-6 sm:h-[560px] sm:max-w-lg sm:rounded-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-openSans text-xl font-bold text-white">
              Add songs
              {isTop && (
                <span className="ml-2 text-sm font-semibold text-zinc-500">
                  {songs.length}/{TOP_LIST_LIMIT}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {atCapacity && (
            <p className="mb-2 rounded-lg bg-amber-400/10 px-3 py-2.5 text-xs font-semibold text-amber-300">
              That’s the full top {TOP_LIST_LIMIT} — remove a song from the list to swap one in.
            </p>
          )}
          <SongPickerPanel
            existingIds={new Set(songs.map((s) => s.songId))}
            onAdd={handleAddSong}
            collectionSongs={collectionSongs}
            canAdd={!atCapacity}
            className="min-h-0 flex-1"
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="border-white/5 bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete “{playlist.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This removes the {meta.label.toLowerCase()} for good. Songs themselves stay in the
              library and your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-none bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/90 text-white hover:bg-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
