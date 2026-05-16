import { ChartContainer, ChartTooltip, ChartTooltipContent } from "assets/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { SectionList, nextSectionColor } from "feature/songs/components/SongSections/SectionList";
import { SectionTimeline } from "feature/songs/components/SongSections/SectionTimeline";
import { YouTubeSongPlayer } from "feature/songs/components/YouTubeSongPlayer";
import type { YouTubeSongPlayerRef } from "feature/songs/components/YouTubeSongPlayer";
import { getUserSongMeta, saveUserSongMeta } from "feature/songs/services/songSections.service";
import type { MasteryLevel, SongSection } from "feature/songs/types/songSection.type";
import type { Song } from "feature/songs/types/songs.type";
import type { useTimerInterface } from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import { ArrowLeft, CheckCircle2, FileText, Keyboard, Music, Pause, Play, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface SongTimerLayoutProps {
  timer: useTimerInterface;
  song: Song;
  timerSubmitHandler: () => void;
  onBack: () => void;
  userId: string;
  songId: string;
}

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  0: "text-zinc-500",
  1: "text-red-400",
  2: "text-amber-400",
  3: "text-green-400",
  4: "text-zinc-500",
};

const MASTERY_LABELS_SHORT: Record<MasteryLevel, string> = {
  0: "Not learned",
  1: "Bad",
  2: "Medium",
  3: "Mastered",
  4: "Skip",
};

export const SongTimerLayout = ({
  timer,
  song,
  timerSubmitHandler,
  onBack,
  userId,
  songId,
}: SongTimerLayoutProps) => {
  const { t } = useTranslation("timer");
  const { timerEnabled, startTimer, stopTimer } = timer;
  const [time, setTime] = useState(() => timer.getTime());

  useEffect(() => {
    setTime(timer.getTime());
    return timer.subscribe((t) => setTime(t));
  }, [timer]);

  const playerRef = useRef<YouTubeSongPlayerRef>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopSectionId, setLoopSectionId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    getUserSongMeta(userId, songId).then((meta) => {
      setYoutubeUrl(meta.youtubeUrl ?? null);
      setSections(meta.sections ?? []);
      setNotes(meta.notes ?? "");
    });
  }, [userId, songId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveUserSongMeta(userId, songId, {
          youtubeUrl: youtubeUrl ?? undefined,
          sections,
          notes,
        });
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [youtubeUrl, sections, notes, userId, songId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          playerRef.current?.togglePlay();
          break;
        case "KeyM":
          if (!isLocked) {
             e.preventDefault();
             handleAddSection();
          }
          break;
        case "KeyL":
          e.preventDefault();
          // Toggle loop for current section if any
          const currentSection = sections.find(s => 
            currentTime >= s.startTime && 
            currentTime < (sections.find(next => next.startTime > s.startTime)?.startTime ?? Infinity)
          );
          if (currentSection) handleSectionLoop(currentSection);
          break;
        case "ArrowLeft":
          e.preventDefault();
          playerRef.current?.seekTo(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          playerRef.current?.seekTo(Math.min(duration, currentTime + 5));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, isLocked, sections]);

  const persistSections = useCallback(
    (next: SongSection[]) => setSections(next),
    []
  );

  const handleUrlSave = (url: string) => setYoutubeUrl(url);

  const handleTimeUpdate = useCallback(
    (t: number, d: number) => {
      setCurrentTime(t);
      if (d > 0 && d !== duration) setDuration(d);

      if (!loopSectionId) return;
      const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);
      const idx = sorted.findIndex((s) => s.id === loopSectionId);
      if (idx === -1) return;
      const loopSec = sorted[idx];
      const endTime = sorted[idx + 1]?.startTime ?? loopSec.startTime + 30;
      if (t >= endTime) {
        playerRef.current?.seekTo(loopSec.startTime);
      }
    },
    [duration, loopSectionId, sections]
  );

  const handleSeek = (time: number) => playerRef.current?.seekTo(time);

  const handleSectionPlay = (section: SongSection) => {
    setLoopSectionId(null);
    playerRef.current?.seekTo(section.startTime);
    playerRef.current?.play();
  };

  const handleSectionLoop = (section: SongSection) => {
    if (loopSectionId === section.id) {
      setLoopSectionId(null);
    } else {
      setLoopSectionId(section.id);
      playerRef.current?.seekTo(section.startTime);
      playerRef.current?.play();
    }
  };

  const handleAddSection = () => {
    const newSection: SongSection = {
      id: uuidv4(),
      name: `Section ${sections.length + 1}`,
      startTime: Math.floor(currentTime),
      color: nextSectionColor(sections),
      mastery: 0,
    };
    persistSections([...sections, newSection]);
  };

  const handleRename = (id: string, name: string) =>
    persistSections(sections.map((s) => (s.id === id ? { ...s, name } : s)));

  const handleTimeChange = (id: string, startTime: number) =>
    persistSections(sections.map((s) => (s.id === id ? { ...s, startTime } : s)));

  const handleMasteryChange = (id: string, mastery: MasteryLevel) =>
    persistSections(sections.map((s) => (s.id === id ? { ...s, mastery } : s)));

  const handleDelete = (id: string) => {
    if (loopSectionId === id) setLoopSectionId(null);
    persistSections(sections.filter((s) => s.id !== id));
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      const remMinutes = minutes % 60;
      return `${hours}:${remMinutes < 10 ? "0" : ""}${remMinutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const toggleTimer = () => (timerEnabled ? stopTimer() : startTimer());

  // Mastery summary counts
  const masteryCounts = ([0, 1, 2, 3, 4] as MasteryLevel[]).map((level) => ({
    level,
    count: sections.filter((s) => s.mastery === level).length,
  })).filter((m) => m.count > 0);

  return (
    <MainContainer noBorder>
      <div className="font-openSans h-full space-y-5 pb-8 md:p-8">
        <div className="pl-14 sm:pl-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t("practice_session")}</h1>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto space-y-8 px-4">

          {/* Compact timer bar */}
          <div className="flex items-center gap-2 sm:gap-4 bg-white/[0.02] rounded-lg p-2.5 sm:px-5 sm:py-3.5">
            <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0">
              {song.coverUrl ? (
                <img src={song.coverUrl} className="h-full w-full object-cover" alt={song.title} />
              ) : (
                <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                  <Music className="h-5 w-5 text-zinc-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 hidden xs:block">
              <p className="text-sm font-semibold text-white truncate">{song.title}</p>
              <p className="text-xs text-zinc-500 truncate hidden md:block">{song.artist}</p>
            </div>

            <div
              className={cn(
                "text-2xl font-black tabular-nums tracking-tight transition-colors",
                timerEnabled ? "text-white" : "text-zinc-600"
              )}
            >
              {formatTime(time)}
            </div>

            <button
              onClick={toggleTimer}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0",
                timerEnabled
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-white text-black hover:bg-zinc-100"
              )}
            >
              {timerEnabled ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            <div className="h-6 w-px bg-white/10 shrink-0" />

            <Button
              onClick={async () => {
                setIsSaving(true);
                try {
                  await saveUserSongMeta(userId, songId, {
                    youtubeUrl: youtubeUrl ?? undefined,
                    sections,
                    notes,
                  });
                } finally {
                  setIsSaving(false);
                  timerSubmitHandler();
                }
              }}
              className="sm:ml-2 gap-2 px-3 sm:px-4 rounded-lg"
            >
              <span className="hidden sm:inline">{t("finish")}</span>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>


        </div>

        {/* YouTube player + sections - WIDER CONTAINER */}
        <div className="w-full max-w-6xl mx-auto space-y-10 px-4">
          <div className="space-y-6">
            <YouTubeSongPlayer
              ref={playerRef}
              youtubeUrl={youtubeUrl}
              onUrlSave={handleUrlSave}
              onTimeUpdate={handleTimeUpdate}
              onDurationReady={setDuration}
              onPlay={startTimer}
              isLocked={isLocked}
              onLockToggle={() => setIsLocked(!isLocked)}
            />

            {youtubeUrl && (
              <div className="space-y-8 pt-4">
                <SectionTimeline
                  sections={sections}
                  currentTime={currentTime}
                  duration={duration}
                  loopSectionId={loopSectionId}
                  onSeek={handleSeek}
                  onSectionTimeChange={handleTimeChange}
                  isLocked={isLocked}
                />

                <SectionList
                  sections={sections}
                  loopSectionId={loopSectionId}
                  currentTime={currentTime}
                  onPlay={handleSectionPlay}
                  onLoop={handleSectionLoop}
                  onMasteryChange={handleMasteryChange}
                  onRename={handleRename}
                  onTimeChange={handleTimeChange}
                  onDelete={handleDelete}
                  onAdd={handleAddSection}
                  isLocked={isLocked}
                />
              </div>
            )}
          </div>

          {/* Shortcuts Legend - only show when YouTube URL exists */}
          {youtubeUrl && (
            <div className="hidden md:flex items-center gap-6 py-4 px-6 bg-white/[0.02] rounded-lg">
              <div className="flex items-center gap-2 text-zinc-500">
                <Keyboard className="h-4 w-4" />
                <span className="text-xs font-bold text-zinc-500">Shortcuts</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[10px] font-mono text-white">Space</kbd>
                  <span className="text-xs text-zinc-500">Play/Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[10px] font-mono text-white">M</kbd>
                  <span className="text-xs text-zinc-500">Mark section</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[10px] font-mono text-white">L</kbd>
                  <span className="text-xs text-zinc-500">Toggle loop</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[10px] font-mono text-white">← →</kbd>
                  <span className="text-xs text-zinc-500">Seek 5s</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA for YouTube link - show when no URL */}
          {!youtubeUrl && (
            <div className="bg-cyan-500/10 rounded-lg p-6 text-center">
              <h3 className="text-base font-bold text-white mb-2">Link a YouTube video to unlock features</h3>
              <p className="text-sm text-zinc-400 mb-4">Add a YouTube link above to use sections, mark passages, loop sections, and keyboard shortcuts for an enhanced practice experience.</p>
              <div className="inline-block px-4 py-2 bg-cyan-500/20 rounded-[4px] text-xs font-bold text-cyan-400">
                Paste a YouTube link in the player above
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="bg-white/[0.02] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.01]">
              <div className="flex items-center gap-2 text-zinc-400">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-bold text-zinc-500">Practice notes</span>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-[10px] text-zinc-500 animate-pulse">Saving...</span>
                )}
                <span className={cn(
                  "text-[10px] font-medium",
                  notes.split("\n").length > 250 ? "text-amber-500" : "text-zinc-600"
                )}>
                  {notes.split("\n").length} / 300 lines
                </span>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => {
                const lines = e.target.value.split("\n");
                if (lines.length <= 300) {
                  setNotes(e.target.value);
                }
              }}
              placeholder="Add your practice notes here... (e.g. settings, tips for difficult parts, gear used)"
              className="w-full min-h-[160px] bg-transparent p-5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </MainContainer>
  );
};
