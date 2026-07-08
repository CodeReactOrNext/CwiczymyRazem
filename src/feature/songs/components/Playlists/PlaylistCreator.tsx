import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import {
  createPlaylist,
  songToEntry,
} from "feature/songs/services/playlists.service";
import type {
  PlaylistKind,
  PlaylistSongEntry,
} from "feature/songs/types/playlist.types";
import { TOP_LIST_LIMIT } from "feature/songs/types/playlist.types";
import type { Song } from "feature/songs/types/songs.type";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { ArrowLeft, ArrowRight, Globe, Lock, Music, X } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { getPlaylistGradient, KIND_META } from "./playlistVisuals";
import { SongPickerPanel } from "./SongPickerPanel";

type CreatorStep = "kind" | "details" | "songs";

interface PlaylistCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (playlistId: string) => void;
  collectionSongs: Song[];
}

export const PlaylistCreator = ({
  isOpen,
  onClose,
  onCreated,
  collectionSongs,
}: PlaylistCreatorProps) => {
  const userAuth = useAppSelector(selectUserAuth);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

  const [step, setStep] = useState<CreatorStep>("kind");
  const [kind, setKind] = useState<PlaylistKind>("playlist");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [entries, setEntries] = useState<PlaylistSongEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const isTop = kind === "top";
  const atCapacity = isTop && entries.length >= TOP_LIST_LIMIT;

  const handleReset = () => {
    setStep("kind");
    setKind("playlist");
    setName("");
    setDescription("");
    setIsPublic(false);
    setEntries([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handlePickKind = (picked: PlaylistKind) => {
    setKind(picked);
    setStep("details");
  };

  const handleAddSong = (song: Song) => {
    if (entries.some((e) => e.songId === song.id)) return;
    if (isTop && entries.length >= TOP_LIST_LIMIT) return;
    setEntries((prev) => [...prev, songToEntry(song)]);
  };

  const handleCreate = async () => {
    if (!userAuth || !name.trim()) return;
    setIsSaving(true);
    try {
      const playlistId = await createPlaylist(userAuth, userName, userAvatar, {
        name: name.trim(),
        description: description.trim(),
        kind,
        isPublic,
        songs: entries,
      });
      posthog.capture("playlist_action", {
        action: "create",
        kind,
        song_count: entries.length,
        is_public: isPublic,
      });
      toast.success(`${KIND_META[kind].label} created`);
      handleClose();
      onCreated(playlistId);
    } catch (error) {
      console.error("Failed to create playlist:", error);
      toast.error("Couldn't create the playlist. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const stepTitle =
    step === "kind"
      ? "What are you making?"
      : step === "details"
      ? `New ${KIND_META[kind].label.toLowerCase()}`
      : "Add songs";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="h-full max-w-none overflow-hidden border-white/5 bg-zinc-950 p-0 sm:h-auto sm:max-w-lg sm:rounded-2xl">
        <div className="flex h-full flex-col overflow-y-auto p-6 pb-24 sm:max-h-[85vh] sm:pb-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 font-openSans text-2xl font-bold text-white">
              {step !== "kind" && (
                <button
                  type="button"
                  onClick={() => setStep(step === "songs" ? "details" : "kind")}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {stepTitle}
            </DialogTitle>
          </DialogHeader>

          {step === "kind" && (
            <div className="grid gap-3">
              {(Object.keys(KIND_META) as PlaylistKind[]).map((k) => {
                const meta = KIND_META[k];
                const Icon = meta.icon;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handlePickKind(k)}
                    className="group flex items-center gap-4 rounded-xl bg-white/[0.03] p-4 text-left transition-all hover:bg-white/[0.07] active:scale-[0.98]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 transition-colors group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white">{meta.label}</p>
                      <p className="mt-0.5 text-xs font-medium leading-snug text-zinc-500">
                        {meta.hint}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
                  </button>
                );
              })}
            </div>
          )}

          {step === "details" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg shadow-lg"
                  style={{ background: getPlaylistGradient(name || kind) }}
                >
                  {(() => {
                    const Icon = KIND_META[kind].icon;
                    return <Icon className="h-8 w-8 text-white/40" />;
                  })()}
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="playlist-name" className="ml-1 font-bold text-zinc-400">
                    Name
                  </Label>
                  <Input
                    id="playlist-name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      kind === "top"
                        ? "e.g. Top 10 riffs of the 90s"
                        : kind === "path"
                        ? "e.g. From campfire to Hendrix"
                        : "e.g. Slow blues evenings"
                    }
                    maxLength={80}
                    className="h-12 border-white/5 bg-white/5 font-medium transition-all focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="playlist-desc" className="ml-1 font-bold text-zinc-400">
                  Description <span className="font-medium text-zinc-600">(optional)</span>
                </Label>
                <Textarea
                  id="playlist-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this list about?"
                  maxLength={300}
                  rows={3}
                  className="resize-none border-white/5 bg-white/5 font-medium transition-all focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="ml-1 font-bold text-zinc-400">Visibility</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-xl p-3.5 text-left transition-all",
                      !isPublic ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/[0.06]"
                    )}
                  >
                    <Lock className={cn("h-4 w-4 shrink-0", !isPublic ? "text-white" : "text-zinc-500")} />
                    <div>
                      <p className={cn("text-sm font-bold", !isPublic ? "text-white" : "text-zinc-400")}>
                        Private
                      </p>
                      <p className="text-[11px] font-medium text-zinc-500">Only you can see it</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-xl p-3.5 text-left transition-all",
                      isPublic ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/[0.06]"
                    )}
                  >
                    <Globe className={cn("h-4 w-4 shrink-0", isPublic ? "text-white" : "text-zinc-500")} />
                    <div>
                      <p className={cn("text-sm font-bold", isPublic ? "text-white" : "text-zinc-400")}>
                        Public
                      </p>
                      <p className="text-[11px] font-medium text-zinc-500">
                        Anyone can find and save it
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep("songs")}
                  disabled={!name.trim()}
                  className="h-11 px-6"
                >
                  <span className="flex items-center gap-2">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            </div>
          )}

          {step === "songs" && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              {entries.length > 0 && (
                <div className="space-y-0.5">
                  <p className="px-1 pb-1 text-xs font-bold text-zinc-500">
                    {isTop
                      ? `Picked ${entries.length}/${TOP_LIST_LIMIT}`
                      : `${entries.length} added`}
                  </p>
                  <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
                    {entries.map((entry, index) => (
                      <div
                        key={entry.songId}
                        className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
                      >
                        {isTop && (
                          <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-zinc-500">
                            {index + 1}
                          </span>
                        )}
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-[4px] bg-zinc-800">
                          {entry.coverUrl ? (
                            <img src={entry.coverUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-600">
                              <Music className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p translate="no" className="truncate text-xs font-semibold text-white">
                            {entry.title}
                          </p>
                          <p translate="no" className="truncate text-[11px] text-zinc-500">
                            {entry.artist}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEntries((prev) => prev.filter((e) => e.songId !== entry.songId))
                          }
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {atCapacity ? (
                <p className="rounded-lg bg-amber-400/10 px-3 py-2.5 text-xs font-semibold text-amber-300">
                  That’s the full top {TOP_LIST_LIMIT} — remove a song to swap one in.
                </p>
              ) : (
                <SongPickerPanel
                  existingIds={new Set(entries.map((e) => e.songId))}
                  onAdd={handleAddSong}
                  collectionSongs={collectionSongs}
                  canAdd={!atCapacity}
                  className="min-h-0 flex-1"
                />
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs font-medium text-zinc-600">
                  You can keep adding songs later.
                </p>
                <Button
                  onClick={handleCreate}
                  disabled={isSaving || !name.trim()}
                  className="h-11 px-6"
                >
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : entries.length > 0 ? (
                    `Create with ${entries.length} ${entries.length === 1 ? "song" : "songs"}`
                  ) : (
                    "Create empty"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
