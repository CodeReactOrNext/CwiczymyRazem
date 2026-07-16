import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { cn } from "assets/lib/utils";
import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { HeroBanner } from "components/UI/HeroBanner";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { PremiumFeaturePreview } from "feature/premium/components/PremiumFeaturePreview";
import {
  GP_EXTENSIONS,
  isGpFile,
  type ParsedGp,
  parseGpFile,
} from "feature/songs/services/gp5Parser.service";
import {
  deleteUserGpFile,
  fetchGpFileAsFile,
  getUserGpFiles,
  MAX_GP_FILE_SIZE_BYTES,
  MAX_USER_GP_FILES,
  moveUserGpFile,
  uploadUserGpFile,
  type UserGpFile,
} from "feature/songs/services/userGpFiles.service";
import {
  createGpFolder,
  deleteGpFolder,
  getFolderDepth,
  getUserGpFolders,
  type GpFolder,
  MAX_FOLDER_DEPTH,
} from "feature/songs/services/userGpFolders.service";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { doc, getDoc } from "firebase/firestore";
import AppLayout from "layouts/AppLayout";
import { Gauge, Music } from "lucide-react";
import {
  ChevronRight,
  Clock,
  Drum,
  ExternalLink,
  FileMusic,
  Folder,
  FolderOpen,
  FolderPlus,
  Infinity,
  Loader2,
  Music2,
  Play,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page.d";
import { db } from "utils/firebase/client/firebase.utils";

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

interface UploadQueueItem {
  id: string;
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

const TIME_PRESETS = [5, 10, 15, 20, 30];

/** Custom DataTransfer type used to drag a file row onto a folder card/breadcrumb to move it. */
const DRAG_FILE_MIME = "application/x-gp-file-id";

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

/** Flattens folders into a move-target list: top-level folders followed by their direct subfolders. */
function flattenFoldersForMove(folders: GpFolder[]): { folder: GpFolder; depth: number }[] {
  const roots = folders.filter((f) => !f.parentId);
  const result: { folder: GpFolder; depth: number }[] = [];
  roots.forEach((root) => {
    result.push({ folder: root, depth: 1 });
    folders
      .filter((f) => f.parentId === root.id)
      .forEach((child) => result.push({ folder: child, depth: 2 }));
  });
  return result;
}

const GpTabsPage: NextPageWithLayout = () => {
  const userId = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UserGpFile[]>([]);
  const [folders, setFolders] = useState<GpFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedSongs, setLinkedSongs] = useState<Record<string, LinkedSong[]>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configFreeMode, setConfigFreeMode] = useState(false);
  const [configTimeMinutes, setConfigTimeMinutes] = useState(10);
  const [sessionPlan, setSessionPlan] = useState<ExercisePlan | null>(null);
  const [sessionRawFile, setSessionRawFile] = useState<File | null>(null);
  const [sessionFreeMode, setSessionFreeMode] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [gpFiles, gpFolders, progress] = await Promise.all([
          getUserGpFiles(userId),
          getUserGpFolders(userId),
          getAllUserSongProgress(userId),
        ]);
        setFiles(gpFiles);
        setFolders(gpFolders);

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

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === currentFolderId) ?? null,
    [folders, currentFolderId]
  );
  const currentDepth = currentFolder ? getFolderDepth(currentFolder, folders) : 0;
  const canCreateFolderHere = currentDepth < MAX_FOLDER_DEPTH;

  const breadcrumbTrail = useMemo(() => {
    const trail: GpFolder[] = [];
    let cursor = currentFolder;
    while (cursor) {
      trail.unshift(cursor);
      cursor = folders.find((f) => f.id === cursor!.parentId) ?? null;
    }
    return trail;
  }, [currentFolder, folders]);

  const visibleFolders = folders.filter((f) => (f.parentId ?? null) === currentFolderId);
  const visibleFiles = files.filter((f) => (f.folderId ?? null) === currentFolderId);
  const moveTargets = useMemo(() => flattenFoldersForMove(folders), [folders]);
  const atFileCap = files.length >= MAX_USER_GP_FILES;

  const openFilePicker = () => {
    if (atFileCap) {
      toast.error(
        `You've reached the limit of ${MAX_USER_GP_FILES} GP files (total, across all folders). Delete some to upload more.`
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleLoadForPractice = async (file: UserGpFile) => {
    setLoadingFileId(file.id);
    setStaged(null);
    try {
      const rawFile = await fetchGpFileAsFile(file.downloadUrl, file.name);
      const parsed = await parseGpFile(rawFile);
      setStaged({ gpFile: file, rawFile, parsed, selectedTrackIndex: 0 });
      setShowConfigModal(true);
    } catch {
      toast.error("Nie udało się załadować pliku. Może być uszkodzony.");
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
    setIsStarting(true);

    setTimeout(() => {
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
      setIsStarting(false);
    }, 100);
  };

  const handleFilesSelected = async (incoming: File[]) => {
    if (!userId || incoming.length === 0) return;

    const validFiles: File[] = [];
    const invalidNames: string[] = [];
    const oversizedNames: string[] = [];
    incoming.forEach((file) => {
      if (!isGpFile(file.name)) {
        invalidNames.push(file.name);
      } else if (file.size > MAX_GP_FILE_SIZE_BYTES) {
        oversizedNames.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidNames.length > 0) {
      toast.error(
        `Unsupported format: ${invalidNames.join(", ")}. Supported: ${GP_EXTENSIONS.join(", ")}`
      );
    }
    if (oversizedNames.length > 0) {
      toast.error(
        `File too large (max ${formatSize(MAX_GP_FILE_SIZE_BYTES)}): ${oversizedNames.join(", ")}`
      );
    }
    if (validFiles.length === 0) return;

    const remainingSlots = MAX_USER_GP_FILES - files.length;
    if (remainingSlots <= 0) {
      toast.error(
        `You've reached the limit of ${MAX_USER_GP_FILES} GP files (total, across all folders). Delete some to upload more.`
      );
      return;
    }

    const toUpload = validFiles.slice(0, remainingSlots);
    if (validFiles.length > toUpload.length) {
      toast.warning(
        `Only ${toUpload.length} of ${validFiles.length} files will be uploaded — the ${MAX_USER_GP_FILES}-file limit was reached.`
      );
    }

    setIsUploading(true);
    setUploadQueue(
      toUpload.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        name: file.name,
        status: "pending" as const,
        progress: 0,
      }))
    );

    const uploaded: UserGpFile[] = [];
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      setUploadQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item))
      );
      try {
        const uploadedFile = await uploadUserGpFile(userId, file, {
          folderId: currentFolderId,
          onProgress: ({ progress }) =>
            setUploadQueue((prev) =>
              prev.map((item, idx) => (idx === i ? { ...item, progress } : item))
            ),
        });
        uploaded.push(uploadedFile);
        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "done", progress: 100 } : item))
        );
      } catch {
        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "error" } : item))
        );
      }
    }

    if (uploaded.length > 0) {
      setFiles((prev) => [...uploaded, ...prev]);
      toast.success(
        uploaded.length === 1 ? `"${uploaded[0].name}" uploaded!` : `${uploaded.length} files uploaded!`
      );
    }
    if (uploaded.length < toUpload.length) {
      toast.error("Some files failed to upload.");
    }

    setIsUploading(false);
    setUploadQueue([]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) handleFilesSelected(selected);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDraggingOver(false);
    // Internal file-row drag (move to folder) — not an OS file upload.
    if (e.dataTransfer.types.includes(DRAG_FILE_MIME)) return;
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files ?? []);
    if (dropped.length > 0) handleFilesSelected(dropped);
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

  const handleMoveFile = async (file: UserGpFile, folderId: string | null) => {
    if (!userId || file.folderId === folderId) return;
    try {
      await moveUserGpFile(userId, file.id, folderId);
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, folderId } : f)));
      toast.success(`"${file.name}" moved`);
    } catch {
      toast.error("Failed to move file");
    }
  };

  /** Drag & drop handlers so a file row can be dropped onto a folder card/breadcrumb to move it. */
  const makeFolderDropHandlers = (targetFolderId: string | null) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_FILE_MIME)) return;
      e.preventDefault();
      e.stopPropagation();
      if (targetFolderId === null) setDragOverRoot(true);
      else setDragOverFolderId(targetFolderId);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (e.currentTarget !== e.target) return;
      if (targetFolderId === null) setDragOverRoot(false);
      else setDragOverFolderId((id) => (id === targetFolderId ? null : id));
    },
    onDrop: (e: React.DragEvent) => {
      const fileId = e.dataTransfer.getData(DRAG_FILE_MIME);
      setDragOverRoot(false);
      setDragOverFolderId(null);
      if (!fileId) return;
      e.preventDefault();
      e.stopPropagation();
      const draggedFile = files.find((f) => f.id === fileId);
      if (draggedFile) handleMoveFile(draggedFile, targetFolderId);
    },
  });

  const handleCreateFolder = async () => {
    if (!userId) return;
    const name = newFolderName.trim();
    if (!name) return;
    setIsCreatingFolder(true);
    try {
      const folder = await createGpFolder(userId, name, currentFolderId);
      setFolders((prev) => [...prev, folder]);
      toast.success(`Folder "${name}" created`);
      setShowNewFolderDialog(false);
      setNewFolderName("");
    } catch {
      toast.error("Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: GpFolder) => {
    if (!userId) return;
    const hasChildren =
      folders.some((f) => f.parentId === folder.id) ||
      files.some((f) => f.folderId === folder.id);
    if (hasChildren) {
      toast.error("Move or delete the folder's contents first");
      return;
    }
    setDeletingFolderId(folder.id);
    try {
      await deleteGpFolder(userId, folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      toast.success(`Folder "${folder.name}" deleted`);
    } catch {
      toast.error("Failed to delete folder");
    } finally {
      setDeletingFolderId(null);
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

  // ── Show premium preview for non-premium users ──────────────────────────────
  if (!isPremium) {
    return (
      <PremiumFeaturePreview
        eyebrow="Practice Files"
        title="GP Tabs"
        description="Upload your own Guitar Pro files and practice them with tempo control, track selection, and real-time note detection. Build custom practice sessions from your favorite songs."
        features={[
          {
            icon: <Upload className="h-5 w-5" />,
            label: "Upload Your Files",
            description: "Import any Guitar Pro file (.gp, .gp5) from your collection",
          },
          {
            icon: <Music className="h-5 w-5" />,
            label: "Track Selection",
            description: "Choose which instrument track to practice on",
          },
          {
            icon: <Gauge className="h-5 w-5" />,
            label: "Tempo Control",
            description: "Practice at any speed with custom tempo settings",
          },
          {
            icon: <Zap className="h-5 w-5" />,
            label: "Real-time Detection",
            description: "Get real-time note feedback while practicing",
          },
        ]}
        availableIn="both"
      />
    );
  }

  return (
    <div className="bg-second-600 rounded-lg overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <HeroBanner
        title="Guitar Pro Files"
        subtitle="Your Guitar Pro file library"
        eyebrowContent={
          <Breadcrumbs
            items={[
              { label: "Practice", href: "/timer" },
              { label: "Guitar Pro Files" },
            ]}
          />
        }
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
        buttonText="Upload Files"
        onClick={openFilePicker}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={GP_EXTENSIONS.join(",")}
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      <div>

      <div
        className="px-4 md:px-8 pb-8 space-y-4"
        onDragOver={(e) => {
          // Only react to OS file drags — internal file-row drags (move to
          // folder) must not trigger the upload backdrop.
          if (e.dataTransfer.types.includes(DRAG_FILE_MIME)) return;
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setIsDraggingOver(false);
        }}
        onDrop={handleDrop}
      >
        {/* Folder navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold tracking-wide">
            <button
              onClick={() => setCurrentFolderId(null)}
              {...makeFolderDropHandlers(null)}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors hover:text-white",
                currentFolder ? "text-zinc-400" : "text-cyan-400",
                dragOverRoot && "bg-cyan-500/10 text-cyan-400"
              )}
            >
              All files
            </button>
            {breadcrumbTrail.map((folder) => (
              <span key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  {...makeFolderDropHandlers(folder.id)}
                  className={cn(
                    "rounded px-1.5 py-0.5 transition-colors hover:text-white",
                    currentFolder?.id === folder.id ? "text-cyan-400" : "text-zinc-400",
                    dragOverFolderId === folder.id && "bg-cyan-500/10 text-cyan-400"
                  )}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span
              className={cn(
                "text-xs font-medium",
                atFileCap ? "text-amber-400" : "text-zinc-400"
              )}
            >
              {files.length}/{MAX_USER_GP_FILES} files · max{" "}
              {formatSize(MAX_GP_FILE_SIZE_BYTES)} per file
            </span>
            {canCreateFolderHere && (
              <Button
                onClick={() => setShowNewFolderDialog(true)}
                variant="ghost"
                className="h-9 px-4 rounded-lg text-xs font-bold bg-zinc-800/60 text-zinc-200 hover:bg-zinc-700/60 hover:text-white"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New folder
              </Button>
            )}
          </div>
        </div>

        {/* Drag & drop overlay hint */}
        {isDraggingOver && (
          <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-cyan-500/30 bg-zinc-900 px-10 py-8">
              <Upload className="h-8 w-8 text-cyan-400" />
              <p className="text-sm font-bold text-cyan-400">Drop your GP files here</p>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">
                Uploading {uploadQueue.filter((i) => i.status === "done").length}/{uploadQueue.length} files...
              </span>
            </div>
            <div className="space-y-2">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">{item.name}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        item.status === "error"
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-cyan-600 to-cyan-400"
                      )}
                      style={{ width: `${item.status === "error" ? 100 : item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folders + file list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs font-bold capitalize tracking-widest">
              Loading your files...
            </span>
          </div>
        ) : visibleFolders.length === 0 && visibleFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 rounded-lg bg-zinc-900/40">
            <FolderOpen className="h-12 w-12 text-zinc-600 opacity-40" />
            <div className="text-center space-y-1">
              <p className="text-sm font-bold capitalize tracking-widest text-zinc-500">
                {currentFolder ? "This folder is empty" : "No GP files yet"}
              </p>
              <p className="text-xs text-zinc-600">
                {atFileCap
                  ? `You've reached the ${MAX_USER_GP_FILES}-file limit. Delete some to upload more.`
                  : "Upload Guitar Pro files or drag & drop them here to get started"}
              </p>
            </div>
            <Button
              onClick={openFilePicker}
              disabled={atFileCap}
              className="mt-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 h-10 px-6 rounded-lg text-xs font-bold capitalize tracking-widest"
            >
              <Upload className="h-3.5 w-3.5 mr-2" />
              Upload GP files
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Folders */}
            {visibleFolders.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visibleFolders.map((folder) => {
                  const childFileCount = files.filter((f) => f.folderId === folder.id).length;
                  const childFolderCount = folders.filter((f) => f.parentId === folder.id).length;
                  const isDeleting = deletingFolderId === folder.id;
                  const isDropTarget = dragOverFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-lg bg-zinc-800/40 p-4 transition-colors cursor-pointer hover:bg-zinc-700/40",
                        isDropTarget && "bg-cyan-500/10 hover:bg-cyan-500/10"
                      )}
                      onClick={() => setCurrentFolderId(folder.id)}
                      {...makeFolderDropHandlers(folder.id)}
                    >
                      <div className="flex items-start justify-between">
                        <Folder className="h-8 w-8 text-cyan-400/80" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder);
                          }}
                          disabled={isDeleting}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-bold text-white truncate">{folder.name}</p>
                      <p className="text-xs text-zinc-400">
                        {childFolderCount > 0 && `${childFolderCount} folder${childFolderCount > 1 ? "s" : ""} · `}
                        {childFileCount} file{childFileCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Files */}
            {visibleFiles.map((file) => {
              const ext =
                GP_EXTENSIONS.find((e) => file.name.toLowerCase().endsWith(e)) ?? ".gp";
              const linked = linkedSongs[file.id] ?? [];
              const isDeleting = deletingId === file.id;
              const isThisLoading = loadingFileId === file.id;

              return (
                <div
                  key={file.id}
                  draggable={folders.length > 0}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_FILE_MIME, file.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-4 transition-colors hover:bg-zinc-700/40"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 h-11 w-11 rounded-lg overflow-hidden">
                      {linked[0]?.coverUrl ? (
                        <img
                          src={linked[0].coverUrl}
                          alt={linked[0].title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-lg border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center">
                          <FileMusic className="h-5 w-5 text-cyan-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {ext.replace(".", "").toUpperCase()} · {formatSize(file.size)} ·{" "}
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleLoadForPractice(file)}
                        loading={isThisLoading}
                        disabled={!!loadingFileId}
                        className="h-9 px-4 rounded-lg text-[10px] font-bold capitalize tracking-wider border bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                      >
                        <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                        <span>Practice</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={folders.length === 0}
                            className="h-9 w-9 p-0 rounded-lg text-zinc-600 hover:text-cyan-400 hover:bg-cyan-400/10"
                            aria-label="Move to folder"
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {file.folderId !== null && (
                            <DropdownMenuItem onClick={() => handleMoveFile(file, null)}>
                              All files (no folder)
                            </DropdownMenuItem>
                          )}
                          {moveTargets
                            .filter(({ folder }) => folder.id !== file.folderId)
                            .map(({ folder, depth }) => (
                              <DropdownMenuItem
                                key={folder.id}
                                onClick={() => handleMoveFile(file, folder.id)}
                              >
                                {depth === 2 ? `↳ ${folder.name}` : folder.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                          className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold capitalize tracking-wider hover:bg-orange-500/20 transition-colors"
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

      </div>

      {/* ── New folder dialog ────────────────────────────────────────────── */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            maxLength={60}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
            }}
          />
          <DialogFooter>
            <Button
              onClick={handleCreateFolder}
              loading={isCreatingFolder}
              disabled={!newFolderName.trim()}
              className="bg-cyan-500 text-black font-bold hover:bg-cyan-400"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Session config modal ─────────────────────────────────────────── */}
      {showConfigModal && staged && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfigModal(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-zinc-900 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold capitalize tracking-widest text-zinc-500">
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
                <p className="text-[10px] font-bold capitalize tracking-widest text-zinc-500">
                  Track
                </p>
                <div className="flex flex-wrap gap-2">
                  {staged.parsed.tracks.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrackSelect(idx)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize tracking-wider transition-colors",
                        staged.selectedTrackIndex === idx
                          ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300"
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
              <p className="text-[10px] font-bold capitalize tracking-widest text-zinc-500">
                Time mode
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfigFreeMode(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg text-sm font-bold transition-colors",
                    !configFreeMode
                      ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                      : "bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300"
                  )}
                >
                  <Clock className="h-5 w-5" />
                  Time Limit
                </button>
                <button
                  onClick={() => setConfigFreeMode(true)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg text-sm font-bold transition-colors",
                    configFreeMode
                      ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                      : "bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300"
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
                <p className="text-[10px] font-bold capitalize tracking-widest text-zinc-500">
                  Duration
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIME_PRESETS.map((min) => (
                    <button
                      key={min}
                      onClick={() => setConfigTimeMinutes(min)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold capitalize tracking-wider transition-colors",
                        configTimeMinutes === min
                          ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300"
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
              loading={isStarting}
              className="w-full h-12 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors"
            >
              <span>Start Practice</span>
              <Zap className={cn("h-4 w-4 ml-2 fill-current", isStarting && "hidden")} />
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
