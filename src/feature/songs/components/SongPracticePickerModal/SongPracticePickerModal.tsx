import { Button, buttonVariants, PRESSABLE } from "assets/components/ui/button";
import { Dialog, DialogContent } from "assets/components/ui/dialog";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import type { BackingTrack,TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { ArrangementPicker } from "feature/songs/components/Arrangements/ArrangementPicker";
import { ImportTablature } from "feature/songs/components/ImportTablature/ImportTablature";
import {
  getUserGpFiles,
  isLocalGpFileId,
  isLocalGpLibraryAvailable,
  saveUserGpFile,
  type UserGpFile,
} from "feature/songs/services/userGpFiles.service";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song, SongArrangement } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowLeft,
  CassetteTape,
  ChevronRight,
  FileMusic,
  FolderOpen,
  Link2Off,
  Loader2,
  Monitor,
  NotebookPen,
  Upload,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SiGuitarpro } from "react-icons/si";
import { toast } from "sonner";

// Each mode is one big key — the subtle face with its lip, like the app's other
// buttons — rather than a bordered card. The icons keep their colour.
const MODE_KEY = cn(
  PRESSABLE,
  "group flex w-full items-center gap-4 rounded-lg border-b-black/30 bg-white/10 p-4 text-left transition-colors hover:bg-white/15",
);

type Phase = "pick" | "attach";
type AttachTab = "library" | "import";

interface SongPracticePickerModalProps {
  song: Song;
  userId: string;
  progress: UserSongProgress | null;
  onAttachGpFile: (songId: string, gpFileId: string, gpFileName: string, trackIndex?: number) => Promise<void>;
  onDetachGpFile: (songId: string) => Promise<void>;
  onClose: () => void;
}

export function SongPracticePickerModal({
  song,
  userId,
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
  // Saved by the desktop app, which keeps GP files on that computer only.
  const isDesktopOnlyGpFile = isLocalGpFileId(progress?.gpFileId);
  const isGpFileElsewhere = isDesktopOnlyGpFile && !isLocalGpLibraryAvailable();
  const arrangementQuery = arrangement ? `?arrangement=${arrangement}` : "";

  const handleFreePractice = () => {
    onClose();
    router.push(`/timer/song/${song.id}${arrangementQuery}`);
  };

  const handleGp5Practice = () => {
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
      <DialogContent className="sm:max-w-md bg-zinc-950 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5">
          {phase === "attach" && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={t("common:back")}
              onClick={() => setPhase("pick")}>
              <ArrowLeft />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-zinc-500">
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
              className={MODE_KEY}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-500/15">
                <CassetteTape size='1em' className="h-5 w-5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{t("picker.free_practice")}</p>
                <p className="text-[11px] text-zinc-400">{t("picker.free_practice_hint")}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
            </button>

            {/* GP5 practice */}
            <button
              onClick={handleGp5Practice}
              className={MODE_KEY}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
                <SiGuitarpro className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{t("picker.gp_practice")}</p>
                {hasGpFile && isGpFileElsewhere ? (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Monitor className="h-3 w-3 shrink-0 text-amber-300/90" />
                    <span className="text-[11px] text-amber-300/90">{t("picker.desktop_only_missing")}</span>
                  </div>
                ) : hasGpFile ? (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {isDesktopOnlyGpFile ? (
                      <Monitor className="h-3 w-3 shrink-0 text-amber-300/90" />
                    ) : (
                      <FileMusic className="h-3 w-3 shrink-0 text-cyan-400/70" />
                    )}
                    <span className="truncate text-[11px] text-cyan-400/70">{progress?.gpFileName}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400">{t("picker.gp_practice_hint")}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
            </button>

            {/* Change / detach GP file */}
            {hasGpFile && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setPhase("attach")}
                  className={cn(buttonVariants({ variant: "subtle", size: "sm" }), "flex-1 font-bold text-zinc-400")}
                >
                  {t("picker.change_gp")}
                </button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDetach}
                  loading={isDetaching}
                  className="gap-1.5"
                >
                  {!isDetaching && <Link2Off />}
                  Detach
                </Button>
              </div>
            )}

            {/* Manual log — for practice that happened outside the app */}
            <button
              onClick={handleManualLog}
              className={cn(MODE_KEY, "mt-2")}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                <NotebookPen className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{t("picker.log_practice")}</p>
                <p className="text-[11px] text-zinc-400">{t("picker.log_practice_hint")}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
            </button>
          </div>
        )}

        {/* Attach phase */}
        {phase === "attach" && (
          <div className="space-y-4 p-5">
            {/* Tabs */}
            <SegmentedControl<AttachTab>
              label={t("picker.attach_gp")}
              selected={[attachTab]}
              onSelect={setAttachTab}
              options={[
                {
                  value: "library",
                  label: t("picker.my_files"),
                  icon: <FolderOpen className="h-3.5 w-3.5 shrink-0" />,
                },
                {
                  value: "import",
                  label: t("picker.import"),
                  icon: <Upload className="h-3.5 w-3.5 shrink-0" />,
                },
              ]}
            />

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
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-zinc-900/40 p-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-zinc-600">
        <FolderOpen className="h-8 w-8 opacity-40" />
        <p className="text-xs font-bold">{t("picker.no_files")}</p>
        <p className="text-xs text-zinc-500">{t("picker.no_files_hint")}</p>
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
          className="flex w-full items-center gap-3 rounded-lg bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
            <FileMusic className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{file.name}</p>
            {file.location === "local" && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-300/90">
                <Monitor className="h-3 w-3 shrink-0" />
                {t("picker.desktop_only")}
              </p>
            )}
          </div>
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
      const uploaded = await saveUserGpFile(userId, rawFile);
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
            <span className="text-xs font-bold">{t("detail.saving")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
