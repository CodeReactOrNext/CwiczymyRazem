import { Accordion } from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { CommunityMapImportModal } from "feature/songs/components/SongSections/CommunityMapImportModal";
import { SectionList } from "feature/songs/components/SongSections/SectionList";
import { SectionTimeline } from "feature/songs/components/SongSections/SectionTimeline";
import { YouTubeSongPlayer } from "feature/songs/components/YouTubeSongPlayer";
import { useSongSectionMap } from "feature/songs/hooks/useSongSectionMap";
import type { Song } from "feature/songs/types/songs.type";
import { AmpSimButton } from "feature/toneStudio/components/AmpSimButton";
import type { useTimerInterface } from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Keyboard,
  Music,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useState } from "react";

import FreeTimerMetronome from "./components/FreeTimerMetronome";

interface SongTimerLayoutProps {
  timer: useTimerInterface;
  song: Song;
  timerSubmitHandler: () => void;
  onBack: () => void;
  userId: string;
  songId: string;
}

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

  const {
    playerRef,
    youtubeUrl,
    sections,
    currentTime,
    duration,
    loopSectionId,
    isLocked,
    setIsLocked,
    notes,
    setNotes,
    isSaving,
    sectionMap,
    isImportModalOpen,
    setIsImportModalOpen,
    setDuration,
    saveNow,
    handleImportCommunityMap,
    handleUrlSave,
    handleTimeUpdate,
    handleSeek,
    handleSectionPlay,
    handleSectionLoop,
    handleAddSection,
    handleRename,
    handleTimeChange,
    handleMasteryChange,
    handleDelete,
  } = useSongSectionMap({ userId, songId });

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

  return (
    <MainContainer noBorder>
      <div className='h-full space-y-5 pb-8 md:p-8'>
        <div className='pl-14 sm:pl-0'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={onBack}
              className='rounded-full hover:bg-white/10'>
              <ArrowLeft className='h-5 w-5' />
            </Button>
            <h1 className='text-xl font-bold'>{t("practice_session")}</h1>
          </div>
        </div>

        <div className='mx-auto w-full space-y-8 px-2'>
          {/* Compact timer bar — sticky so the timer and Finish stay reachable while scrolling */}
          <div className='sticky top-2 z-20 flex items-center gap-2 rounded-lg bg-zinc-900/80 p-2.5 backdrop-blur sm:gap-4 sm:px-5 sm:py-3.5'>
            <div className='h-11 w-11 shrink-0 overflow-hidden rounded-lg'>
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  className='h-full w-full object-cover'
                  alt={song.title}
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-zinc-800'>
                  <Music className='h-5 w-5 text-zinc-600' />
                </div>
              )}
            </div>

            <div className='hidden min-w-0 flex-1 xs:block'>
              <p className='truncate text-sm font-semibold text-white'>
                {song.title}
              </p>
              <p className='hidden truncate text-xs text-zinc-500 md:block'>
                {song.artist}
              </p>
            </div>

            <div
              className={cn(
                "text-2xl font-black tabular-nums tracking-tight transition-colors",
                timerEnabled ? "text-white" : "text-zinc-500",
              )}>
              {formatTime(time)}
            </div>

            <button
              onClick={toggleTimer}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                timerEnabled
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-white text-black hover:bg-zinc-100",
              )}>
              {timerEnabled ? (
                <Pause className='h-4 w-4 fill-current' />
              ) : (
                <Play className='ml-0.5 h-4 w-4 fill-current' />
              )}
            </button>

            {/* Electron-only amp simulator (renders nothing on web). Non-compact
                so the "AMP"/"AMP ON" label is visible, not just a bare icon. */}
            <AmpSimButton h='h-10' />

            <Button
              onClick={async () => {
                try {
                  await saveNow();
                } finally {
                  timerSubmitHandler();
                }
              }}
              className='ml-1 gap-2 rounded-lg px-3 sm:ml-3 sm:px-4'>
              <span className='hidden sm:inline'>{t("finish")}</span>
              <CheckCircle2 className='h-4 w-4' />
            </Button>
          </div>

          {/* Player + metronome side by side on desktop, stacked on mobile */}
          <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
            <YouTubeSongPlayer
              ref={playerRef}
              youtubeUrl={youtubeUrl}
              onUrlSave={handleUrlSave}
              onTimeUpdate={handleTimeUpdate}
              onDurationReady={setDuration}
              onPlay={startTimer}
              isLocked={isLocked}
              onLockToggle={() => setIsLocked(!isLocked)}
              songTitle={song.title}
              songArtist={song.artist}
            />

            <Accordion type='multiple'>
              <FreeTimerMetronome />
            </Accordion>
          </div>

          {youtubeUrl && (
            <div className='space-y-8'>
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
                duration={duration}
                onPlay={handleSectionPlay}
                onLoop={handleSectionLoop}
                onMasteryChange={handleMasteryChange}
                onRename={handleRename}
                onTimeChange={handleTimeChange}
                onDelete={handleDelete}
                onAdd={handleAddSection}
                onAddNamed={(name) => handleAddSection(name)}
                isLocked={isLocked}
              />
            </div>
          )}

          {/* Shortcuts Legend - only show when YouTube URL exists */}
          {youtubeUrl && (
            <div className='hidden items-center gap-6 rounded-lg bg-zinc-900/40 px-6 py-4 md:flex'>
              <div className='flex items-center gap-2 text-zinc-500'>
                <Keyboard className='h-4 w-4' />
                <span className='text-xs font-bold text-zinc-500'>
                  Shortcuts
                </span>
              </div>
              <div className='flex flex-wrap gap-x-6 gap-y-2'>
                <div className='flex items-center gap-2'>
                  <kbd className='font-mono rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-100'>
                    Space
                  </kbd>
                  <span className='text-xs text-zinc-500'>Play/Pause</span>
                </div>
                <div className='flex items-center gap-2'>
                  <kbd className='font-mono rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-100'>
                    M
                  </kbd>
                  <span className='text-xs text-zinc-500'>Mark section</span>
                </div>
                <div className='flex items-center gap-2'>
                  <kbd className='font-mono rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-100'>
                    L
                  </kbd>
                  <span className='text-xs text-zinc-500'>Toggle loop</span>
                </div>
                <div className='flex items-center gap-2'>
                  <kbd className='font-mono rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-100'>
                    ← →
                  </kbd>
                  <span className='text-xs text-zinc-500'>Seek 5s</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className='rounded-lg bg-zinc-900/40'>
            <div className='flex items-center justify-between px-5 pt-4'>
              <div className='flex items-center gap-2 text-zinc-400'>
                <FileText className='h-4 w-4' />
                <span className='text-xs font-bold text-zinc-500'>
                  Practice notes
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {isSaving && (
                  <span className='animate-pulse text-[10px] text-zinc-500'>
                    Saving...
                  </span>
                )}
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    notes.split(" ").length > 250
                      ? "text-amber-400"
                      : "text-zinc-500",
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
              placeholder='Add your practice notes here... (e.g. settings, tips for difficult parts, gear used)'
              className='min-h-[160px] w-full resize-none bg-transparent px-5 pb-5 pt-3 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-600 focus:outline-none'
            />
          </div>
        </div>
      </div>

      <CommunityMapImportModal
        map={sectionMap}
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImportCommunityMap}
      />
    </MainContainer>
  );
};
