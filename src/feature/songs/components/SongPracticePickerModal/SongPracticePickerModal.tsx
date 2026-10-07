import { useTranslation } from "hooks/useTranslation";
import { Dialog, DialogContent } from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type { BackingTrack,TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { ArrangementPicker } from "feature/songs/components/Arrangements/ArrangementPicker";
import { ImportTablature } from "feature/songs/components/ImportTablature/ImportTablature";
import {
  getUserGpFiles,
  uploadUserGpFile,
  type UserGpFile,
} from "feature/songs/services/userGpFiles.service";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song, SongArrangement } from "feature/songs/types/songs.type";
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  FileMusic,
  FolderOpen,
  Link2Off,
  Loader2,
  NotebookPen,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PiCassetteTapeLight } from "react-icons/pi";
import { SiGuitarpro } from "react-icons/si";
import { toast } from "sonner";

type Phase = "pick" | "attach";
type AttachTab = "library" | "import";

interface SongPracticePickerModalProps {
  song: Song;
  userId: string;
  isPremium: boolean;
  progress: UserSongProgress | null;
  onAttachGpFile: (songId: string, gpFileId: string, gpFileName: string, trackIndex?: number) => Promise<void>;
  onDetachGpFile: (songId: string) => Promise<void>;
  onClose: () => void;
}

export function SongPracticePickerModal({
  song,
  userId,
  isPremium,
  progress,
  onAttachGpFile,
  onDetachGpFile,
  onClose,
}: SongPracticePickerModalProps) {
  const { t } = useTranslation("songs");
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick");
  const [attachTab, setAttachTab] = useState<AttachTab>("library");
  const [isDetaching, setIsDetaching] = useState(false);
  // Rocksmith-style: the part being played is picked before the mode, so every
  // route below books its time on that arrangement. Starts on the last one played.
  const [arrangement, setArrangement] = useState<SongArrangement | null>(
    progress?.lastArrangement ?? null
  );

  const hasGpFile = !!progress?.gpFileId;
  const arrangementQuery = arrangement ? `?arrangement=${arrangement}` : "";

  const handleFreePractice = () => {
    onClose();
    router.push(`/timer/song/${song.id}${arrangementQuery}`);
  };

  const handleGp5Practice = () => {
    if (!isPremium) return;
    if (hasGpFile) {
      onClose();
      router.push(`/songs/practice/${song.id}${arrangementQuery}`);
    } else {
      setPhase("attach");
    }
  };

  // Practice that already happened away from the app still belongs in the log —
  // the report form takes the song prefilled, so only the time is left to fill in.
  const handleManualLog = () => {
    onClose();
    router.push({
      pathname: "/report",
      query: {
        songId: song.id,
        songTitle: song.title,
        songArtist: song.artist,
        ...(arrangement && { arrangement }),
        returnTo: router.asPath,
      },
    });
  };

  const handleDetach = async () => {
    setIsDetaching(true);
    try {
      await onDetachGpFile(song.id);
      toast.success(t("picker.detached"));
    } catch {
      toast.error(t("picker.detach_error"));
    } finally {
      setIsDetaching(false);
    }
  };

  const handleFileAttached = async (gpFileId: string, gpFileName: string) => {
    await onAttachGpFile(song.id, gpFileId, gpFileName);
    toast.success(t("picker.attached"));
    onClose();
    router.push(`/songs/practice/${song.id}${arrangementQuery}`);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-white/5 bg-zinc-950 p-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          {phase === "attach" && (
            <button
              onClick={() => setPhase("pick")}
              className="mr-1 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              {phase === "pick" ? t("picker.choose_mode") : t("picker.attach_gp")}
            </p>
            <p className="truncate text-sm font-bold text-white">
              {song.title}
              <span className="ml-2 font-normal text-zinc-400">{song.artist}</span>
            </p>
          </div>
        </div>

        {/* Pick phase */}
        {phase === "pick" && (
          <div className="space-y-3 p-5">
            <div className="space-y-2 pb-3">
              <p className="text-xs font-semibold text-zinc-400">{t("picker.which_part")}</p>
              <ArrangementPicker
                value={arrangement}
                onChange={setArrangement}
                noneLabel={t("picker.any_part")}
              />
            </div>

            {/* Free practice */}
            <button
              onClick={handleFreePractice}
              className="group flex w-full items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-left transition-all hover:border-white/10 hover:bg-white/[0.06] active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-white/5 border-t-indigo-500/40 border-l-indigo-500/20 shadow-lg transition-all duration-300 group-hover:scale-105">
                <PiCassetteTapeLight className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{t("picker.free_practice")}</p>
                <p className="text-[11px] text-zinc-500">{t("picker.free_practice_hint")}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
            </button>

            {/* GP5 practice */}
            {isPremium ? (
              <button
                onClick={handleGp5Practice}
                className="group flex w-full items-center gap-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-left transition-all hover:border-cyan-500/30 hover:bg-cyan-500/10 active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-white/5 border-t-cyan-500/40 border-l-cyan-500/20 shadow-lg transition-all duration-300 group-hover:scale-105">
                  <SiGuitarpro className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{t("picker.gp_practice")}</p>
                  {hasGpFile ? (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <FileMusic className="h-3 w-3 shrink-0 text-cyan-400/70" />
                      <span className="truncate text-[11px] text-cyan-400/70">{progress?.gpFileName}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500">{t("picker.gp_practice_hint")}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-cyan-600 transition-colors group-hover:text-cyan-400" />
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 opacity-70">
                {/* Locked overlay */}
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-white/5 border-t-cyan-500/20 border-l-cyan-500/10 shadow-lg">
                    <SiGuitarpro className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-zinc-400">{t("picker.gp_practice")}</p>
                      <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <Crown className="h-2.5 w-2.5" />
                        {t("picker.premium")}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600">{t("picker.gp_premium_hint")}</p>
                  </div>
                </div>
                <Link
                  href="/supporter"
                  onClick={onClose}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-400 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10"
                >
                  <Crown className="h-3 w-3" />
                  {t("picker.upgrade")}
                </Link>
              </div>
            )}

            {/* Change / detach GP file */}
            {isPremium && hasGpFile && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setPhase("attach")}
                  className="flex-1 rounded-lg border border-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-white/10 hover:text-zinc-300"
                >
                  {t("picker.change_gp")}
                </button>
                <button
                  onClick={handleDetach}
                  disabled={isDetaching}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-red-500/70 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
                >
                  {isDetaching ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Link2Off className="h-3 w-3" />
                  )}
                  Detach
                </button>
              </div>
            )}

            {/* Manual log — for practice that happened outside the app */}
            <button
              onClick={handleManualLog}
              className="group mt-2 flex w-full items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-left transition-all hover:border-white/10 hover:bg-white/[0.06] active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20 shadow-lg transition-all duration-300 group-hover:scale-105">
                <NotebookPen className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{t("picker.log_practice")}</p>
                <p className="text-[11px] text-zinc-500">{t("picker.log_practice_hint")}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
            </button>
          </div>
        )}

        {/* Attach phase */}
        {phase === "attach" && (
          <div className="space-y-4 p-5">
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-white/5 p-1">
              {(["library", "import"] as AttachTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAttachTab(tab)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-bold uppercase tracking-widest transition-all",
                    attachTab === tab
                      ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab === "library" ? (
                    <><FolderOpen className="h-3.5 w-3.5" /> {t("picker.my_files")}</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> {t("picker.import")}</>
                  )}
                </button>
              ))}
            </div>

            {attachTab === "library" && (
              <GpFileLibraryPicker userId={userId} onSelect={handleFileAttached} />
            )}

            {attachTab === "import" && (
              <GpFileImporter userId={userId} onAttached={handleFileAttached} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GpFileLibraryPicker({
  userId,
  onSelect,
}: {
  userId: string;
  onSelect: (gpFileId: string, gpFileName: string) => Promise<void>;
}) {
  const { t } = useTranslation("songs");
  const [files, setFiles] = useState<UserGpFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    getUserGpFiles(userId)
      .then(setFiles)
      .catch(() => toast.error(t("picker.load_error")))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-600">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-zinc-600">
        <FolderOpen className="h-8 w-8 opacity-40" />
        <p className="text-xs font-bold uppercase tracking-widest">{t("picker.no_files")}</p>
        <p className="text-[10px] text-zinc-700">{t("picker.no_files_hint")}</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
      {files.map((file) => (
        <button
          key={file.id}
          disabled={!!loadingId}
          onClick={async () => {
            setLoadingId(file.id);
            try {
              await onSelect(file.id, file.name);
            } catch {
              toast.error(t("picker.attach_error"));
              setLoadingId(null);
            }
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
            <FileMusic className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{file.name}</p>
          {loadingId === file.id ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
          )}
        </button>
      ))}
    </div>
  );
}

function GpFileImporter({
  userId,
  onAttached,
}: {
  userId: string;
  onAttached: (gpFileId: string, gpFileName: string) => Promise<void>;
}) {
  const { t } = useTranslation("songs");
  const [isSaving, setIsSaving] = useState(false);

  const handleImported = async (
    _measures: TablatureMeasure[],
    fileName: string,
    _tempo: number,
    _trackName: string,
    _backingTracks: BackingTrack[],
    rawFile: File
  ) => {
    setIsSaving(true);
    try {
      const uploaded = await uploadUserGpFile(userId, rawFile);
      await onAttached(uploaded.id, uploaded.name);
    } catch {
      toast.error(t("picker.save_error"));
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <ImportTablature onImported={handleImported} />
      {isSaving && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest">{t("detail.saving")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
