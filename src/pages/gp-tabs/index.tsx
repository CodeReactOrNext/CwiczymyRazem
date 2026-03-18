import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page.d";
import AppLayout from "layouts/AppLayout";
import { HeroBanner } from "components/UI/HeroBanner";
import { useAppSelector } from "store/hooks";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import {
  deleteUserGpFile,
  fetchGpFileAsFile,
  getUserGpFiles,
  uploadUserGpFile,
  type UserGpFile,
} from "feature/songs/services/userGpFiles.service";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import {
  GP_EXTENSIONS,
  isGpFile,
  parseGpFile,
  type ParsedGp,
} from "feature/songs/services/gp5Parser.service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import {
  Clock,
  Drum,
  ExternalLink,
  FileMusic,
  FolderOpen,
  Infinity,
  Loader2,
  Music,
  Music2,
  Play,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/router";
import Link from "next/link";

interface LinkedSong {
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

interface StagedFile {
  gpFile: UserGpFile;
  rawFile: File;
  parsed: ParsedGp;
  selectedTrackIndex: number;
}

interface SessionConfig {
  freeMode: boolean;
  timeInMinutes: number;
}

const TIME_PRESETS = [5, 10, 15, 20, 30];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TrackTypeIcon({ type }: { type: string }) {
  if (type === "drums") return <Drum className="h-3 w-3" />;
  if (type === "bass") return <span className="text-[10px] font-black">𝄢</span>;
  return <Music className="h-3 w-3" />;
}

function buildExercise(fileName: string, tempo: number, trackName: string): Exercise {
  const title = trackName
    ? `${fileName.replace(/\.gp\w*$/i, "")} - ${trackName}`
    : fileName.replace(/\.gp\w*$/i, "");
  return {
    id: `custom-${Date.now()}`,
    title,
    description: `Custom practice session imported at ${tempo} BPM`,
    difficulty: "medium",
    category: "mixed",
    timeInMinutes: 10,
    instructions: ["Practice this imported tablature at your own pace."],
    tips: ["Slow down if you make mistakes.", "Focus on clean notes."],
    metronomeSpeed: { min: 40, max: 240, recommended: tempo },
    relatedSkills: [],
  };
}

const GpTabsPage: NextPageWithLayout = () => {
  const userId = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "premium" || userInfo?.role === "admin";
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UserGpFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedSongs, setLinkedSongs] = useState<Record<string, LinkedSong[]>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configFreeMode, setConfigFreeMode] = useState(false);
  const [configTimeMinutes, setConfigTimeMinutes] = useState(10);
  const [sessionPlan, setSessionPlan] = useState<ExercisePlan | null>(null);
  const [sessionRawFile, setSessionRawFile] = useState<File | null>(null);
  const [sessionFreeMode, setSessionFreeMode] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [gpFiles, progress] = await Promise.all([
          getUserGpFiles(userId),
          getAllUserSongProgress(userId),
        ]);
        setFiles(gpFiles);

        const linked = progress.filter((p) => p.gpFileId);
        const gpToSongs: Record<string, LinkedSong[]> = {};

        await Promise.all(
          linked.map(async (p) => {
            const songSnap = await getDoc(doc(db, "songs", p.songId));
            if (songSnap.exists()) {
              const data = songSnap.data();
              if (!gpToSongs[p.gpFileId!]) gpToSongs[p.gpFileId!] = [];
              gpToSongs[p.gpFileId!].push({
                songId: p.songId,
                title: data.title,
                artist: data.artist,
                coverUrl: data.coverUrl,
              });
            }
          })
        );
        setLinkedSongs(gpToSongs);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [userId]);

  const handleLoadForPractice = async (file: UserGpFile) => {
    setLoadingFileId(file.id);
    setStaged(null);
    try {
      const rawFile = await fetchGpFileAsFile(file.downloadUrl, file.name);
      const parsed = await parseGpFile(rawFile);
      setStaged({ gpFile: file, rawFile, parsed, selectedTrackIndex: 0 });
      setShowConfigModal(true);
    } catch {
      toast.error("Failed to load file. It may be corrupted.");
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleTrackSelect = (index: number) => {
    if (!staged) return;
    setStaged({ ...staged, selectedTrackIndex: index });
  };

  const startSession = (config: SessionConfig) => {
    if (!staged) return;
    const { parsed, rawFile, gpFile, selectedTrackIndex } = staged;
    const trackName = parsed.tracks[selectedTrackIndex].name;
    const exercise = buildExercise(gpFile.name, parsed.tempo, trackName);
    exercise.timeInMinutes = config.freeMode ? 999 : config.timeInMinutes;
    const plan: ExercisePlan = {
      id: "quick_session_" + Date.now(),
      title: "Quick Practice: " + exercise.title,
      difficulty: "medium",
      description: "Temporary practice plan from imported file",
      category: "mixed",
      exercises: [exercise],
      userId: "system",
      image: null,
    };
    setSessionFreeMode(config.freeMode);
    setSessionPlan(plan);
    setSessionRawFile(rawFile);
    setShowConfigModal(false);
  };

  const handleUpload = async (file: File) => {
    if (!userId) return;
    if (!isGpFile(file.name)) {
      toast.error(`Unsupported format. Supported: ${GP_EXTENSIONS.join(", ")}`);
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const uploaded = await uploadUserGpFile(userId, file, ({ progress }) =>
        setUploadProgress(progress)
      );
      setFiles((prev) => [uploaded, ...prev]);
      toast.success(`"${file.name}" uploaded!`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const handleDelete = async (file: UserGpFile) => {
    if (!userId) return;
    setDeletingId(file.id);
    if (staged?.gpFile.id === file.id) setStaged(null);
    try {
      await deleteUserGpFile(userId, file.id, file.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success(`"${file.name}" deleted`);
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Practice session fullscreen ──────────────────────────────────────────────
  if (sessionPlan) {
    return (
      <PracticeSession
        plan={sessionPlan}
        rawGpFile={sessionRawFile ?? undefined}
        freeMode={sessionFreeMode}
        onClose={() => {
          setSessionPlan(null);
          setSessionRawFile(null);
        }}
        onFinish={() => {
          setIsFinishing(true);
          router.push("/report");
        }}
        isFinishing={isFinishing}
        autoReport={false}
      />
    );
  }

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <HeroBanner
        title="GP Tabs"
        subtitle="Your Guitar Pro file library"
        eyebrow="Practice Files"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
        {...(isPremium && {
          buttonText: "Upload File",
          onClick: () => fileInputRef.current?.click(),
        })}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={GP_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleFileInput}
      />

      <PremiumGate feature="gp-tabs">

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Upload progress */}
        {isUploading && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">
                Uploading... {uploadProgress}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* File list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Loading your files...
            </span>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl border border-white/5 bg-white/[0.02]">
            <FolderOpen className="h-12 w-12 text-zinc-600 opacity-40" />
            <div className="text-center space-y-1">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                No GP files yet
              </p>
              <p className="text-xs text-zinc-600">
                Upload a Guitar Pro file to get started
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-widest"
            >
              <Upload className="h-3.5 w-3.5 mr-2" />
              Upload GP file
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const ext =
                GP_EXTENSIONS.find((e) => file.name.toLowerCase().endsWith(e)) ?? ".gp";
              const linked = linkedSongs[file.id] ?? [];
              const isDeleting = deletingId === file.id;
              const isThisLoading = loadingFileId === file.id;

              return (
                <div
                  key={file.id}
                  className="flex flex-col gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 h-11 w-11 rounded-xl overflow-hidden">
                      {linked[0]?.coverUrl ? (
                        <img
                          src={linked[0].coverUrl}
                          alt={linked[0].title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center">
                          <FileMusic className="h-5 w-5 text-cyan-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                        {ext.toUpperCase().slice(1)} · {formatSize(file.size)} ·{" "}
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleLoadForPractice(file)}
                        disabled={!!loadingFileId}
                        className="h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                      >
                        {isThisLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            Practice
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(file)}
                        disabled={isDeleting || !!loadingFileId}
                        className="h-9 w-9 p-0 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Linked songs */}
                  {linked.length > 0 && (
                    <div className="pl-14 flex flex-wrap gap-2">
                      {linked.map((song) => (
                        <Link
                          key={song.songId}
                          href={`/songs/practice/${song.songId}`}
                          className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider hover:bg-orange-500/20 transition-colors"
                        >
                          {song.coverUrl ? (
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <Music2 className="h-3 w-3" />
                          )}
                          {song.title} – {song.artist}
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      </PremiumGate>

      {/* ── Session config modal ─────────────────────────────────────────── */}
      {isPremium && showConfigModal && staged && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfigModal(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Session Setup
                </p>
                <h2 className="text-lg font-bold text-white leading-tight truncate max-w-[280px]">
                  {staged.gpFile.name.replace(/\.gp\w*$/i, "")}
                </h2>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {staged.parsed.tracks[staged.selectedTrackIndex].name} · {staged.parsed.tempo} BPM
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-600 hover:text-white transition-colors mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Track selector */}
            {staged.parsed.tracks.length > 1 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Track
                </p>
                <div className="flex flex-wrap gap-2">
                  {staged.parsed.tracks.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrackSelect(idx)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
                        staged.selectedTrackIndex === idx
                          ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                          : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                      )}
                    >
                      <TrackTypeIcon type={track.trackType} />
                      {track.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time mode toggle */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Time mode
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfigFreeMode(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-bold transition-all",
                    !configFreeMode
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                      : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                  )}
                >
                  <Clock className="h-5 w-5" />
                  Time Limit
                </button>
                <button
                  onClick={() => setConfigFreeMode(true)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-bold transition-all",
                    configFreeMode
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                      : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                  )}
                >
                  <Infinity className="h-5 w-5" />
                  No Limit
                </button>
              </div>
            </div>

            {/* Time presets — only when time limit mode */}
            {!configFreeMode && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Duration
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIME_PRESETS.map((min) => (
                    <button
                      key={min}
                      onClick={() => setConfigTimeMinutes(min)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all",
                        configTimeMinutes === min
                          ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                          : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                      )}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start button */}
            <Button
              onClick={() =>
                startSession({ freeMode: configFreeMode, timeInMinutes: configTimeMinutes })
              }
              className="w-full h-12 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 hover:shadow-[0_0_24px_rgba(6,182,212,0.3)] transition-all group"
            >
              Start Practice
              <Zap className="h-4 w-4 ml-2 fill-current group-hover:scale-125 transition-transform" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

GpTabsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="gp-tabs" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default GpTabsPage;
