import { Dialog, DialogContent } from "assets/components/ui/dialog";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Clock,
  Drum,
  FileMusic,
  Link2Off,
  Loader2,
  Mic,
  MicOff,
  Music as MusicIcon,
  Pause,
  Play,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { Song } from "feature/songs/types/songs.type";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import {
  fetchGpFileAsFile,
  getUserGpFiles,
  type UserGpFile,
} from "feature/songs/services/userGpFiles.service";
import { parseGpFile, type ParsedGp, GP_EXTENSIONS } from "feature/songs/services/gp5Parser.service";
import { ImportTablature } from "feature/songs/components/ImportTablature/ImportTablature";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { useAlphaTabPlayer } from "feature/exercisePlan/hooks/useAlphaTabPlayer";
import { useAudioAnalyzer } from "hooks/useAudioAnalyzer";
import { useNoteMatching } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteMatching";
import { MicHud } from "feature/exercisePlan/views/PracticeSession/components/MicHud";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TrackTypeIcon({ type }: { type: string }) {
  if (type === "drums") return <Drum className="h-3 w-3" />;
  if (type === "bass") return <span className="text-[10px] font-black">𝄢</span>;
  return <MusicIcon className="h-3 w-3" />;
}

type Phase = "attach" | "session" | "results";

// ── Props ────────────────────────────────────────────────────────────────────

interface SongPracticeModalProps {
  song: Song;
  userId: string;
  progress: UserSongProgress | null;
  onRecordSession: (songId: string, sessionMs: number, accuracy: number | null) => Promise<void>;
  onAttachGpFile: (songId: string, gpFileId: string, gpFileName: string, trackIndex: number) => Promise<void>;
  onDetachGpFile: (songId: string) => Promise<void>;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SongPracticeModal({
  song,
  userId,
  progress,
  onRecordSession,
  onAttachGpFile,
  onDetachGpFile,
  onClose,
}: SongPracticeModalProps) {
  // Always open in session — attach is only shown when user explicitly wants to change the file
  const [phase, setPhase] = useState<Phase>("session");

  // ── Attach phase state ────────────────────────────────────────────────────
  const [gpFiles, setGpFiles] = useState<UserGpFile[]>([]);
  const [gpFilesLoading, setGpFilesLoading] = useState(false);
  const [attachingFileId, setAttachingFileId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isDetaching, setIsDetaching] = useState(false);

  useEffect(() => {
    if (phase !== "attach") return;
    setGpFilesLoading(true);
    getUserGpFiles(userId)
      .then(setGpFiles)
      .catch(() => toast.error("Failed to load GP files"))
      .finally(() => setGpFilesLoading(false));
  }, [userId, phase]);

  const handleSelectGpFile = async (file: UserGpFile) => {
    setAttachingFileId(file.id);
    try {
      await onAttachGpFile(song.id, file.id, file.name, 0);
      toast.success(`"${file.name}" attached`);
      // Reset session state so new file loads
      setRawFile(null);
      setParsedGp(null);
      setIsPlaying(false);
      setStartTime(null);
      setPhase("session");
    } catch {
      toast.error("Failed to attach file");
    } finally {
      setAttachingFileId(null);
    }
  };

  const handleDetach = async () => {
    setIsDetaching(true);
    try {
      await onDetachGpFile(song.id);
      setRawFile(null);
      setParsedGp(null);
      setIsPlaying(false);
      setStartTime(null);
      toast.success("GP file detached");
      setPhase("session");
    } catch {
      toast.error("Failed to detach file");
    } finally {
      setIsDetaching(false);
    }
  };

  // ── Session phase state ───────────────────────────────────────────────────
  const [parsedGp, setParsedGp] = useState<ParsedGp | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(progress?.selectedTrackIndex ?? 0);

  // Play state
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [alphaTabAudioCtx, setAlphaTabAudioCtx] = useState<AudioContext | null>(null);

  // Session timer
  const sessionStartRef = useRef<number | null>(null);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // BPM
  const [bpm, setBpm] = useState<number>(120);

  // Mic
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Results
  const [finalElapsedMs, setFinalElapsedMs] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number | null>(null);

  // Load GP file when there's an attached gpFileId and file is not yet loaded
  useEffect(() => {
    if (!progress?.gpFileId || !progress.gpFileName || rawFile || isLoadingFile) return;

    const load = async (downloadUrl: string) => {
      setIsLoadingFile(true);
      try {
        const file = await fetchGpFileAsFile(downloadUrl, progress.gpFileName!);
        const parsed = await parseGpFile(file);
        setRawFile(file);
        setParsedGp(parsed);
        setBpm(parsed.tempo);
        setSelectedTrackIdx(progress.selectedTrackIndex ?? 0);
      } catch {
        toast.error("Failed to load GP file. Try re-attaching it.");
      } finally {
        setIsLoadingFile(false);
      }
    };

    // Try finding the downloadUrl from already-fetched gpFiles list
    const cached = gpFiles.find((f) => f.id === progress.gpFileId);
    if (cached) {
      load(cached.downloadUrl);
      return;
    }

    // Fetch file list first, then load
    getUserGpFiles(userId).then((files) => {
      setGpFiles(files);
      const found = files.find((f) => f.id === progress.gpFileId);
      if (!found) {
        toast.error("Attached GP file not found in library");
        return;
      }
      load(found.downloadUrl);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.gpFileId]);

  // Timer
  useEffect(() => {
    if (isPlaying) {
      if (sessionStartRef.current === null) sessionStartRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setSessionElapsedMs(Date.now() - (sessionStartRef.current ?? Date.now()));
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying]);

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setStartTime(Date.now());
    } else {
      setIsPlaying(false);
    }
  };

  const handleTrackSelect = async (idx: number) => {
    setSelectedTrackIdx(idx);
    setIsPlaying(false);
    setStartTime(null);
    if (progress?.gpFileId && progress.gpFileName) {
      await onAttachGpFile(song.id, progress.gpFileId, progress.gpFileName, idx);
    }
  };

  // AlphaTab player
  const alphaTabTrackConfigs = useMemo(
    () => ({ main: { isMuted: false, volume: 1.0 } }),
    []
  );

  useAlphaTabPlayer({
    rawGpFile: rawFile,
    bpm,
    isPlaying,
    startTime,
    onAudioContextReady: useCallback((ctx: AudioContext) => {
      setAlphaTabAudioCtx(ctx);
    }, []),
    trackConfigs: alphaTabTrackConfigs,
  });

  // Audio analyzer (mic)
  const {
    init: initMic,
    close: closeMic,
    isListening,
    audioRefs,
    getLatencyMs,
  } = useAudioAnalyzer();

  useEffect(() => {
    if (isMicEnabled && !isListening) initMic();
    if (!isMicEnabled && isListening) closeMic();
  }, [isMicEnabled, isListening, initMic, closeMic]);

  useEffect(() => () => { closeMic(); }, [closeMic]);

  const getAdjustedTargetFreq = useCallback((_: number, baseFreq: number) => baseFreq, []);

  const activeTablature: TablatureMeasure[] | null | undefined = useMemo(
    () => parsedGp?.tracks[selectedTrackIdx]?.measures ?? null,
    [parsedGp, selectedTrackIdx]
  );

  const { hitNotes, sessionAccuracy, gameState, maxPossibleScore, currentBeatsElapsed } =
    useNoteMatching({
      isPlaying,
      startTime,
      effectiveBpm: bpm,
      rawBpm: bpm,
      activeTablature,
      isMicEnabled,
      currentExerciseIndex: 0,
      isHalfSpeed: false,
      getLatencyMs,
      audioRefs,
      getAdjustedTargetFreq,
    });

  const handleFinish = async () => {
    setIsPlaying(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const elapsed = sessionStartRef.current ? Date.now() - sessionStartRef.current : 0;
    const accuracy = isMicEnabled ? sessionAccuracy : null;
    setFinalElapsedMs(elapsed);
    setFinalAccuracy(accuracy);
    setIsSaving(true);
    try {
      await onRecordSession(song.id, elapsed, accuracy);
    } finally {
      setIsSaving(false);
    }
    setPhase("results");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-full h-[90vh] p-0 bg-zinc-950 border border-white/10 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back to session from attach */}
            {phase === "attach" && (
              <button
                onClick={() => setPhase("session")}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{song.title}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{song.artist}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Attach phase ── */}
          {phase === "attach" && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">
                  {progress?.gpFileId ? "Change GP file" : "Attach a GP file to practice"}
                </p>
                <p className="text-xs text-zinc-600">
                  Select a file from your library or upload a new one.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpload(false)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all",
                    !showUpload
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "border-white/5 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  My Library
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all",
                    showUpload
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "border-white/5 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Upload New
                </button>
              </div>

              {!showUpload && (
                <div>
                  {gpFilesLoading ? (
                    <div className="flex items-center gap-3 py-8 text-zinc-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-widest">Loading library...</span>
                    </div>
                  ) : gpFiles.length === 0 ? (
                    <div className="py-10 text-center rounded-xl border border-white/5 bg-white/[0.02]">
                      <FileMusic className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">No GP files in library</p>
                      <p className="mt-1 text-xs text-zinc-700">Upload a file using the "Upload New" tab</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gpFiles.map((file) => {
                        const isThis = attachingFileId === file.id;
                        const isCurrent = file.id === progress?.gpFileId;
                        const ext = GP_EXTENSIONS.find((e) => file.name.toLowerCase().endsWith(e)) ?? ".gp";
                        return (
                          <div
                            key={file.id}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border transition-colors",
                              isCurrent
                                ? "border-cyan-500/30 bg-cyan-500/5"
                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                            )}
                          >
                            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                              <FileMusic className="h-4 w-4 text-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{file.name}</p>
                              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                                {ext.toUpperCase().slice(1)} · {formatSize(file.size)}
                                {isCurrent && <span className="ml-2 text-cyan-500">· current</span>}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSelectGpFile(file)}
                              disabled={!!attachingFileId || isCurrent}
                              className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40"
                            >
                              {isThis ? <Loader2 className="h-3 w-3 animate-spin" /> : isCurrent ? "Selected" : "Select"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {showUpload && (
                <ImportTablature
                  onImported={async (_measures, fileName) => {
                    const updatedFiles = await getUserGpFiles(userId);
                    setGpFiles(updatedFiles);
                    const uploaded = updatedFiles.find((f) => f.name === fileName);
                    if (uploaded) {
                      await handleSelectGpFile(uploaded);
                    } else {
                      toast.error("Could not find uploaded file in library");
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* ── Session phase ── */}
          {phase === "session" && (
            <div className="flex flex-col h-full">
              {/* No GP file attached */}
              {!progress?.gpFileId && !isLoadingFile && !parsedGp && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5 py-24 px-6 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-800/60 border border-white/5 flex items-center justify-center">
                    <FileMusic className="h-7 w-7 text-zinc-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-300">No GP file attached</p>
                    <p className="text-xs text-zinc-600 max-w-xs">
                      Attach a Guitar Pro file to see the tablature and track your accuracy with the microphone.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setPhase("attach")}
                    className="h-9 px-5 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    <FileMusic className="h-3.5 w-3.5 mr-1.5" />
                    Attach GP File
                  </Button>
                </div>
              )}

              {/* Loading */}
              {isLoadingFile && (
                <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20 text-zinc-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Loading tablature...</span>
                </div>
              )}

              {/* GP file failed to load */}
              {progress?.gpFileId && !isLoadingFile && !parsedGp && (
                <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20 text-zinc-600">
                  <FileMusic className="h-8 w-8 opacity-40" />
                  <span className="text-xs font-bold uppercase tracking-widest">Could not load GP file</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPhase("attach")}
                    className="text-[10px] font-bold uppercase tracking-widest"
                  >
                    Re-attach file
                  </Button>
                </div>
              )}

              {/* Loaded — full practice UI */}
              {parsedGp && (
                <div className="flex flex-col gap-0">
                  {isMicEnabled && (
                    <div className="px-5 pt-4">
                      <MicHud
                        gameState={gameState}
                        maxPossibleScore={maxPossibleScore}
                        sessionAccuracy={sessionAccuracy}
                      />
                    </div>
                  )}

                  <div className="px-4 pt-2">
                    <TablatureViewer
                      measures={activeTablature ?? undefined}
                      bpm={bpm}
                      isPlaying={isPlaying}
                      startTime={startTime}
                      hitNotes={hitNotes}
                      currentBeatsElapsed={currentBeatsElapsed}
                      audioContext={alphaTabAudioCtx}
                      className="rounded-xl overflow-hidden"
                    />
                  </div>

                  {/* Controls */}
                  <div className="px-5 py-4 flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      onClick={handlePlay}
                      className="h-9 px-4 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white"
                    >
                      {isPlaying ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5 fill-current" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>

                    {/* BPM */}
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-3 h-9">
                      <button
                        onClick={() => setBpm((b) => Math.max(40, b - 5))}
                        className="text-zinc-400 hover:text-white text-sm font-bold w-5 text-center"
                      >−</button>
                      <span className="text-xs font-bold text-zinc-300 tabular-nums w-14 text-center">
                        {bpm} BPM
                      </span>
                      <button
                        onClick={() => setBpm((b) => Math.min(300, b + 5))}
                        className="text-zinc-400 hover:text-white text-sm font-bold w-5 text-center"
                      >+</button>
                    </div>

                    {/* Timer */}
                    {sessionStartRef.current !== null && (
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold tabular-nums">{formatMs(sessionElapsedMs)}</span>
                      </div>
                    )}

                    {/* Mic toggle */}
                    <button
                      onClick={() => setIsMicEnabled((v) => !v)}
                      className={cn(
                        "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                        isMicEnabled
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                      )}
                    >
                      {isMicEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                      {isMicEnabled ? "Mic On" : "Mic"}
                    </button>

                    <div className="flex-1" />

                    {/* Change / Detach GP */}
                    <button
                      onClick={() => { setIsPlaying(false); setPhase("attach"); }}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:border-white/20 hover:text-zinc-300 transition-all"
                    >
                      <FileMusic className="h-3.5 w-3.5" />
                      Change
                    </button>

                    <button
                      onClick={handleDetach}
                      disabled={isDetaching}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-red-500/20 text-[10px] font-bold uppercase tracking-wider text-red-500/60 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-40"
                    >
                      {isDetaching
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Link2Off className="h-3.5 w-3.5" />
                      }
                      Detach
                    </button>

                    <Button
                      size="sm"
                      onClick={handleFinish}
                      disabled={isSaving}
                      className="h-9 px-4 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                      Finish
                    </Button>
                  </div>

                  {/* Track selector */}
                  {parsedGp.tracks.length > 1 && (
                    <div className="px-5 pb-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Track</p>
                      <div className="flex flex-wrap gap-2">
                        {parsedGp.tracks.map((track, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTrackSelect(idx)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
                              selectedTrackIdx === idx
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
                </div>
              )}
            </div>
          )}

          {/* ── Results phase ── */}
          {phase === "results" && (
            <div className="flex flex-col items-center justify-center gap-8 py-16 px-6 text-center">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Session complete</p>
                <p className="text-2xl font-bold text-white">{song.title}</p>
              </div>

              <div className="flex gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-cyan-400" />
                  </div>
                  <p className="text-xl font-bold text-white tabular-nums">{formatMs(finalElapsedMs)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Time practiced</p>
                </div>

                {finalAccuracy !== null && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Target className="h-6 w-6 text-emerald-400" />
                    </div>
                    <p className="text-xl font-bold text-emerald-400 tabular-nums">{finalAccuracy}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Accuracy</p>
                  </div>
                )}
              </div>

              {progress && (
                <div className="text-xs text-zinc-600 space-y-0.5">
                  <p>Total time: <span className="text-zinc-400 font-bold">{formatMs((progress.totalPracticeMs ?? 0) + finalElapsedMs)}</span></p>
                  {progress.bestAccuracy !== null && (
                    <p>Best accuracy: <span className="text-zinc-400 font-bold">{progress.bestAccuracy}%</span></p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sessionStartRef.current = null;
                    setSessionElapsedMs(0);
                    setIsPlaying(false);
                    setStartTime(null);
                    setPhase("session");
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest"
                >
                  Practice Again
                </Button>
                <Button
                  size="sm"
                  onClick={onClose}
                  className="text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
