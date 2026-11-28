import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { BackingTrack,TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { isSongPackImportAvailable } from "feature/songPack/services/songPackBridge";
import { isSongPackFile, isSongPackSource, SONG_PACK_SOURCE_EXTENSION } from "feature/songPack/utils/songPackFiles";
import { useInstrumentPreferenceStore } from "feature/tuner/store/instrumentPreferenceStore";
import { useTranslation } from "hooks/useTranslation";
import { Drum,FileMusic, Music as MusicIcon, Upload, Zap } from "lucide-react";
import { useCallback, useMemo,useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import type { Instrument } from "utils/audio/tunings";

import type { ParsedGp} from "../../services/gp5Parser.service";
import { GP_EXTENSIONS,isGpFile, parseGpFile } from "../../services/gp5Parser.service";

interface ImportTablatureProps {
  /** Called when a file is imported or the selected track changes.
   *  `measures` / `backingTracks` are provided for callers that need to persist them (e.g. CreateCustomExerciseDialog).
   *  For PracticeSession-based callers (custom.tsx) these can be ignored — the session parses the GP file itself. */
  onImported: (
    measures: TablatureMeasure[],
    fileName: string,
    tempo: number,
    trackName: string,
    backingTracks: BackingTrack[],
    rawFile: File,
    /** What the picked track is played on — a bass track's strings are 1 (G) … 4 (E). */
    instrument: Instrument
  ) => void;
  /**
   * Takes a song package (.psarc) dropped here, when the caller can keep one:
   * its tab and recording stay on this computer, so only a place that never
   * uploads or shares what it is given passes this. Everywhere else a dropped
   * package is turned away with a note saying why.
   */
  onSongPack?: (file: File) => Promise<void>;
  className?: string;
}

const TRACK_TYPE_LABELS: Record<string, string> = {
  guitar: 'Guitar',
  bass: 'Bass',
  drums: 'Drums',
};

function TrackTypeIcon({ type }: { type: string }) {
  if (type === 'drums') return <Drum className="h-3 w-3" />;
  if (type === 'bass') return <span className="text-[10px] font-black">𝄢</span>;
  return <MusicIcon className="h-3 w-3" />;
}

function buildBackingTracks(data: ParsedGp, selectedIdx: number): BackingTrack[] {
  return data.tracks
    .map((t, idx) => ({
      id: `track-${idx}`,
      name: t.name,
      measures: t.measures,
      trackType: t.trackType as BackingTrack["trackType"],
      stringCount: t.stringCount,
      pan: t.pan,
    }))
    .filter((_, idx) => idx !== selectedIdx);
}

const instrumentOf = (track: ParsedGp["tracks"][number]): Instrument =>
  track.trackType === 'bass' ? 'bass' : 'guitar';

export const ImportTablature = ({ onImported, onSongPack, className }: ImportTablatureProps) => {
  const { t } = useTranslation("songs");
  const [isParsing, setIsParsing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedGp | null>(null);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const preferredInstrument = useInstrumentPreferenceStore((s) => s.instrument);

  const selectedTrack = parsedData?.tracks[selectedTrackIndex] ?? null;
  const showTabPreview = selectedTrack?.trackType !== 'drums';

  const previewMeasures = useMemo((): TablatureMeasure[] | null => {
    if (!parsedData || !parsedData.tracks[selectedTrackIndex]) return null;
    return parsedData.tracks[selectedTrackIndex].measures;
  }, [parsedData, selectedTrackIndex]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (isSongPackFile(selectedFile.name)) {
      // Only the package itself can be taken in, and only where nothing it
      // holds can end up uploaded or shared.
      if (!onSongPack || !isSongPackSource(selectedFile.name)) {
        toast.error(t("import_tab.song_pack_local_only"));
        return;
      }
      if (!isSongPackImportAvailable()) {
        toast.error(t("import_tab.song_pack_desktop_only"));
        return;
      }
      setIsParsing(true);
      try {
        await onSongPack(selectedFile);
      } catch (error) {
        toast.error(error instanceof Error && error.message ? error.message : t("import_tab.song_pack_error"));
      } finally {
        setIsParsing(false);
      }
      return;
    }

    if (!isGpFile(selectedFile.name)) {
      toast.error(t("import_tab.unsupported", { formats: GP_EXTENSIONS.join(", ") }));
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const data = await parseGpFile(selectedFile);
      // A bass player starts on the file's bass track.
      const index = Math.max(0, preferredInstrument === 'bass' ? data.tracks.findIndex((track) => track.trackType === 'bass') : 0);
      const track = data.tracks[index];
      setParsedData(data);
      setSelectedTrackIndex(index);
      onImported(track.measures, selectedFile.name, data.tempo, track.name, buildBackingTracks(data, index), selectedFile, instrumentOf(track));
      toast.success(`"${selectedFile.name}" imported successfully!`);
    } catch (error) {
      console.error("Failed to parse Guitar Pro file:", error);
      toast.error(t("import_tab.read_error"));
      setFile(null);
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  }, [onImported, onSongPack, preferredInstrument, t]);

  const handleTrackSelect = (index: number) => {
    setSelectedTrackIndex(index);
    if (parsedData && file) {
      const track = parsedData.tracks[index];
      onImported(track.measures, file.name, parsedData.tempo, track.name, buildBackingTracks(parsedData, index), file, instrumentOf(track));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // A package is let through to onDrop everywhere, so the places that
      // cannot take one can say why instead of silently ignoring the file.
      'application/octet-stream': [...GP_EXTENSIONS, SONG_PACK_SOURCE_EXTENSION],
    },
    multiple: false,
    disabled: isParsing
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setParsedData(null);
    setSelectedTrackIndex(0);
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {parsedData && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-slow">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <FileMusic className="h-3 w-3 text-cyan-400" />
              Tablature preview (Tempo: {parsedData.tempo} BPM)
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
            >
              {t("import_tab.remove")}
            </Button>
          </div>

          {/* Track Selection */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-400 px-1">
              {t("import_tab.choose_track")}
            </div>
            <div className="flex flex-wrap gap-2">
              {parsedData.tracks.map((track, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTrackSelect(idx)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                    selectedTrackIndex === idx
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                      : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                  )}
                >
                  <TrackTypeIcon type={track.trackType} />
                  {track.name}
                  {track.trackType !== 'guitar' && (
                    <span className="ml-1 opacity-60">({TRACK_TYPE_LABELS[track.trackType] ?? track.trackType})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Preview — only for non-drum tracks */}
          {showTabPreview && previewMeasures ? (
            <div className="relative group">
              <TablatureViewer
                measures={previewMeasures}
                stringCount={selectedTrack?.stringCount}
                bpm={parsedData.tempo}
                isPlaying={false}
                startTime={null}
                className="border border-white/5 shadow-2xl"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
              <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-medium text-zinc-400 flex items-center gap-2 text-center">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                {t("import_tab.all_tracks")}
              </div>
            </div>
          ) : selectedTrack?.trackType === 'drums' ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-zinc-800/40 py-10 text-zinc-500">
              <Drum className="h-8 w-8 opacity-40" />
              <p className="text-xs font-bold">{t("import_tab.drums")}</p>
              <p className="text-xs text-zinc-500">{t("import_tab.drums_hint")}</p>
            </div>
          ) : null}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-lg transition-colors duration-base",
          isDragActive ? "bg-zinc-800" : "bg-zinc-900/60 hover:bg-zinc-900",
          file ? "bg-emerald-500/10" : "",
          isParsing ? "opacity-50 cursor-wait" : "",
          parsedData ? "h-24" : ""
        )}
      >
        <input {...getInputProps()} />

        <div className={cn(
          "flex flex-col items-center text-center transition-all duration-base",
          parsedData ? "p-4 space-y-2" : "p-6 space-y-3"
        )}>
          {file ? (
            <>
              {!parsedData && (
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FileMusic className="h-5 w-5" />
                </div>
              )}
              <div className="space-y-1">
                <div className="text-sm font-medium text-zinc-100 flex items-center gap-2 justify-center">
                  <FileMusic className="h-4 w-4 text-emerald-400" />
                  {file.name}
                </div>
                {!parsedData && <div className="text-xs text-zinc-400">{t("import_tab.processing")}</div>}
                {parsedData && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 justify-center">
                    <Zap className="h-3 w-3 text-zinc-400" /> {parsedData.tracks.length} tracks detected
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-400 transition-colors duration-base",
                isDragActive && "text-zinc-100"
              )}>
                {isParsing ? (
                  <div className="h-5 w-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-zinc-100">
                  {isDragActive ? t("import_tab.drop") : t("import_tab.import")}
                </div>
                <div className="text-xs text-zinc-400">
                  {isParsing ? t("import_tab.analyzing") : t("import_tab.upload")}
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                Guitar Pro (Multi-Track)
              </div>
              {onSongPack && isSongPackImportAvailable() && (
                <p className="max-w-xs text-xs text-zinc-500">
                  {t("import_tab.song_pack_note")}
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
