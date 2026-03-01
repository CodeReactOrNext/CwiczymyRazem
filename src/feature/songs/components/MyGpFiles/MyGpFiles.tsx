import { useEffect, useState } from "react";
import { FileMusic, Trash2, Play, Loader2, FolderOpen } from "lucide-react";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import {
  getUserGpFiles,
  deleteUserGpFile,
  fetchGpFileAsFile,
  UserGpFile,
} from "../../services/userGpFiles.service";
import { parseGpFile, GP_EXTENSIONS } from "../../services/gp5Parser.service";
import { TablatureMeasure, BackingTrack } from "feature/exercisePlan/types/exercise.types";
import { toast } from "sonner";

interface MyGpFilesProps {
  userId: string;
  onLoad: (
    measures: TablatureMeasure[],
    fileName: string,
    tempo: number,
    trackName: string,
    allTracks: BackingTrack[]
  ) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
}

function buildBackingTracks(
  tracks: Array<{ name: string; measures: TablatureMeasure[]; trackType: string; pan: number }>,
  selectedIdx: number
): BackingTrack[] {
  return tracks
    .map((t, idx) => ({
      id: `track-${idx}`,
      name: t.name,
      measures: t.measures,
      trackType: t.trackType as BackingTrack["trackType"],
      pan: t.pan,
    }))
    .filter((_, idx) => idx !== selectedIdx);
}

export function MyGpFiles({ userId, onLoad }: MyGpFilesProps) {
  const [files, setFiles] = useState<UserGpFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  useEffect(() => {
    getUserGpFiles(userId)
      .then(setFiles)
      .catch(() => toast.error("Nie udało się załadować listy plików"))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleLoad = async (file: UserGpFile) => {
    setLoadingFileId(file.id);
    try {
      const f = await fetchGpFileAsFile(file.downloadUrl, file.name);
      const parsed = await parseGpFile(f);
      const backingTracks = buildBackingTracks(parsed.tracks, 0);
      onLoad(
        parsed.tracks[0].measures,
        file.name,
        parsed.tempo,
        parsed.tracks[0].name,
        backingTracks
      );
      toast.success(`"${file.name}" wczytano!`);
    } catch {
      toast.error("Nie udało się wczytać pliku. Może być uszkodzony.");
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDelete = async (file: UserGpFile) => {
    setDeletingFileId(file.id);
    try {
      await deleteUserGpFile(userId, file.id, file.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success(`"${file.name}" usunięto`);
    } catch {
      toast.error("Nie udało się usunąć pliku");
    } finally {
      setDeletingFileId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Ładowanie biblioteki...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border border-white/5 bg-white/[0.02] text-zinc-600">
        <FolderOpen className="h-10 w-10 opacity-40" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold uppercase tracking-widest">Brak zapisanych plików</p>
          <p className="text-xs text-zinc-700">Wgraj plik GP, aby zapisać go w bibliotece</p>
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
                    Załaduj
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
