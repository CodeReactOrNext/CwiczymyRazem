import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { BackingTrack,TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { AlertCircle, Drum,FileMusic, Music as MusicIcon, Upload, Zap } from "lucide-react";
import { useCallback, useMemo,useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

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
    rawFile: File
  ) => void;
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
      pan: t.pan,
    }))
    .filter((_, idx) => idx !== selectedIdx);
}

export const ImportTablature = ({ onImported, className }: ImportTablatureProps) => {
  const [isParsing, setIsParsing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedGp | null>(null);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  const selectedTrack = parsedData?.tracks[selectedTrackIndex] ?? null;
  const showTabPreview = selectedTrack?.trackType !== 'drums';

  const previewMeasures = useMemo((): TablatureMeasure[] | null => {
    if (!parsedData || !parsedData.tracks[selectedTrackIndex]) return null;
    return parsedData.tracks[selectedTrackIndex].measures;
  }, [parsedData, selectedTrackIndex]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (!isGpFile(selectedFile.name)) {
      toast.error(`Unsupported format. Supported: ${GP_EXTENSIONS.join(', ')}`);
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const data = await parseGpFile(selectedFile);
      setParsedData(data);
      setSelectedTrackIndex(0);
      onImported(data.tracks[0].measures, selectedFile.name, data.tempo, data.tracks[0].name, buildBackingTracks(data, 0), selectedFile);
      toast.success(`"${selectedFile.name}" imported successfully!`);
    } catch (error) {
      console.error("Failed to parse Guitar Pro file:", error);
      toast.error("Error reading Guitar Pro file. Make sure the file is not corrupted.");
      setFile(null);
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  }, [onImported]);

  const handleTrackSelect = (index: number) => {
    setSelectedTrackIndex(index);
    if (parsedData && file) {
      onImported(parsedData.tracks[index].measures, file.name, parsedData.tempo, parsedData.tracks[index].name, buildBackingTracks(parsedData, index), file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': [...GP_EXTENSIONS],
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
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <FileMusic className="h-3 w-3 text-cyan-400" />
              Tablature preview (Tempo: {parsedData.tempo} BPM)
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-7 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
            >
              Remove file
            </Button>
          </div>

          {/* Track Selection */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-1">
              You hear all tracks, but choose the one you'll practice:
            </div>
            <div className="flex flex-wrap gap-2">
              {parsedData.tracks.map((track, idx) => (
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
                bpm={parsedData.tempo}
                isPlaying={false}
                startTime={null}
                className="border border-white/5 shadow-2xl"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
              <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-medium text-zinc-400 flex items-center gap-2 text-center">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                All tracks active in background
              </div>
            </div>
          ) : selectedTrack?.trackType === 'drums' ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] py-10 text-zinc-500">
              <Drum className="h-8 w-8 opacity-40" />
              <p className="text-xs font-bold uppercase tracking-widest">Drum track — no tab notation</p>
              <p className="text-[10px] text-zinc-600">Drums will play automatically during the session</p>
            </div>
          ) : null}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden",
          isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
          file ? "border-green-500/50 bg-green-500/5" : "",
          isParsing ? "opacity-50 cursor-wait" : "",
          parsedData ? "h-24" : ""
        )}
      >
        <input {...getInputProps()} />

        <div className={cn(
          "flex flex-col items-center text-center transition-all duration-300",
          parsedData ? "p-4 space-y-2" : "p-8 space-y-4"
        )}>
          {file ? (
            <>
              {!parsedData && (
                <div className="h-16 w-16 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <FileMusic className="h-8 w-8" />
                </div>
              )}
              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-2 justify-center">
                  <FileMusic className="h-4 w-4 text-green-400" />
                  {file.name}
                </div>
                {!parsedData && <div className="text-xs text-zinc-500">Przetwarzanie...</div>}
                {parsedData && (
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 justify-center uppercase tracking-widest font-bold">
                    <Zap className="h-3 w-3 text-yellow-500" /> {parsedData.tracks.length} tracks detected
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                isDragActive ? "bg-cyan-500 text-white" : "bg-zinc-900 text-zinc-500 group-hover:scale-110 group-hover:bg-zinc-800"
              )}>
                {isParsing ? (
                  <div className="h-8 w-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                ) : (
                  <Upload className="h-8 w-8" />
                )}
              </div>

              <div className="space-y-1">
                <div className="font-bold text-white uppercase tracking-wider text-xs">
                  {isDragActive ? "Drop file here" : "Import Tablature"}
                </div>
                <div className="text-sm text-zinc-500">
                  {isParsing ? "Analyzing tracks and tempo..." : "Upload GP3 / GP4 / GP5 / GPX / GP file"}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-500/50 bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">
                <AlertCircle className="h-3 w-3" />
                Guitar Pro (Multi-Track) support
              </div>
            </>
          )}
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 h-24 w-24 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-24 w-24 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
