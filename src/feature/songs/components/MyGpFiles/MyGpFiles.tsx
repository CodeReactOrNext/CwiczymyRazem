import { useEffect, useState } from "react";
import { FileMusic, Trash2, Play, Loader2, FolderOpen, ChevronLeft, Drum, Music as MusicIcon } from "lucide-react";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import {
  getUserGpFiles,
  deleteUserGpFile,
  fetchGpFileAsFile,
  UserGpFile,
} from "../../services/userGpFiles.service";
import { parseGpFile, ParsedGp, GP_EXTENSIONS } from "../../services/gp5Parser.service";
import { toast } from "sonner";

interface MyGpFilesProps {
  userId: string;
  onLoad: (fileName: string, tempo: number, trackName: string, rawFile: File) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
}

function TrackTypeIcon({ type }: { type: string }) {
  if (type === "drums") return <Drum className="h-3 w-3" />;
  if (type === "bass") return <span className="text-[10px] font-black">𝄢</span>;
  return <MusicIcon className="h-3 w-3" />;
}

interface ParsedState {
  gpFile: UserGpFile;
  rawFile: File;
  parsed: ParsedGp;
  selectedTrackIndex: number;
}

export function MyGpFiles({ userId, onLoad }: MyGpFilesProps) {
  const [files, setFiles] = useState<UserGpFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [parsedState, setParsedState] = useState<ParsedState | null>(null);

  useEffect(() => {
    getUserGpFiles(userId)
      .then(setFiles)
      .catch(() => toast.error("Failed to load file list"))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleLoad = async (file: UserGpFile) => {
    setLoadingFileId(file.id);
    try {
      const rawFile = await fetchGpFileAsFile(file.downloadUrl, file.name);
      const parsed = await parseGpFile(rawFile);
      setParsedState({ gpFile: file, rawFile, parsed, selectedTrackIndex: 0 });
      onLoad(file.name, parsed.tempo, parsed.tracks[0].name, rawFile);
      toast.success(`"${file.name}" loaded!`);
    } catch {
      toast.error("Failed to load file. It may be corrupted.");
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleTrackSelect = (index: number) => {
    if (!parsedState) return;
    const { parsed, gpFile, rawFile } = parsedState;
    setParsedState({ ...parsedState, selectedTrackIndex: index });
    onLoad(gpFile.name, parsed.tempo, parsed.tracks[index].name, rawFile);
  };

  const handleDelete = async (file: UserGpFile) => {
    setDeletingFileId(file.id);
    try {
      await deleteUserGpFile(userId, file.id, file.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (parsedState?.gpFile.id === file.id) setParsedState(null);
      toast.success(`"${file.name}" deleted`);
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeletingFileId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading library...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border border-white/5 bg-white/[0.02] text-zinc-600">
        <FolderOpen className="h-10 w-10 opacity-40" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold uppercase tracking-widest">No saved files</p>
          <p className="text-xs text-zinc-700">Upload a GP file to save it to your library</p>
        </div>
      </div>
    );
  }

  // Track selector shown after a file is loaded
  if (parsedState) {
    const { parsed, gpFile, selectedTrackIndex } = parsedState;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <button
          onClick={() => setParsedState(null)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to library
        </button>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">
          <FileMusic className="h-3 w-3 text-cyan-400" />
          {gpFile.name} · {parsed.tempo} BPM
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-1">
            Choose the track you'll practice:
          </div>
          <div className="flex flex-wrap gap-2">
            {parsed.tracks.map((track, idx) => (
              <button
                key={idx}
                onClick={() => handleTrackSelect(idx)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
                  selectedTrackIndex === idx
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const isThisLoading = loadingFileId === file.id;
        const isThisDeleting = deletingFileId === file.id;
        const ext = GP_EXTENSIONS.find((e) => file.name.toLowerCase().endsWith(e)) ?? ".gp";

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
          >
            {/* Icon + name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <FileMusic className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{file.name}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  {ext.toUpperCase().slice(1)} · {formatSize(file.size)} · {formatDate(file.uploadedAt)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => handleLoad(file)}
                disabled={isThisLoading || !!deletingFileId}
                className={cn(
                  "h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
                )}
              >
                {isThisLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1 fill-current" />
                    Load
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(file)}
                disabled={isThisDeleting || !!loadingFileId}
                className="h-8 w-8 p-0 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                {isThisDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
