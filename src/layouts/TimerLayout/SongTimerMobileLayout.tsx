import { Accordion } from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SectionTimeline } from "feature/songs/components/SongSections/SectionTimeline";
import { MarkSectionStrip } from "feature/songs/components/SongSessionMobile/MarkSectionStrip";
import { MobileSectionList } from "feature/songs/components/SongSessionMobile/MobileSectionList";
import { SessionTransport } from "feature/songs/components/SongSessionMobile/SessionTransport";
import { YouTubeSongPlayer } from "feature/songs/components/YouTubeSongPlayer";
import type { SongSectionMapController } from "feature/songs/hooks/useSongSectionMap";
import type { Song } from "feature/songs/types/songs.type";
import type { useTimerInterface } from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowLeft,
  CheckCircle2,
  Music,
  Pause,
  Pencil,
  Play,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import FreeTimerMetronome from "./components/FreeTimerMetronome";
import { SongNotesCard } from "./components/SongNotesCard";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = `${seconds < 10 ? "0" : ""}${seconds}`;
  if (hours > 0) return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${ss}`;
  return `${minutes}:${ss}`;
};

/** Session time and Finish, pinned to the bottom of the screen in place of the app's tab bar. */
const SessionBar = ({
  timer,
  onFinish,
}: {
  timer: useTimerInterface;
  onFinish: () => void;
}) => {
  const { t } = useTranslation("timer");
  const { timerEnabled, startTimer, stopTimer } = timer;
  const [time, setTime] = useState(() => timer.getTime());

  useEffect(() => timer.subscribe(setTime), [timer]);

  return (
    <div className='pb-safe fixed inset-x-0 bottom-0 z-30 bg-zinc-900/95 backdrop-blur-xl'>
      <div className='flex items-center gap-3 px-4 py-2.5'>
        <button
          type='button'
          onClick={() => (timerEnabled ? stopTimer() : startTimer())}
          aria-label={
            timerEnabled
              ? t("song_timer.pause_timer")
              : t("song_timer.resume_timer")
          }
          className='-ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-zinc-800'>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
              timerEnabled
                ? "bg-zinc-800 text-zinc-300"
                : "bg-zinc-800/60 text-zinc-500",
            )}>
            {timerEnabled ? (
              <Pause className='h-3.5 w-3.5 fill-current' />
            ) : (
              <Play className='ml-0.5 h-3.5 w-3.5 fill-current' />
            )}
          </span>
          <span className='min-w-0'>
            <span className='block text-[11px] leading-tight text-zinc-500'>
              {t("song_timer.session_time")}
            </span>
            <span
              className={cn(
                "block text-lg font-bold tabular-nums leading-tight transition-colors",
                timerEnabled ? "text-zinc-100" : "text-zinc-500",
              )}>
              {formatTime(time)}
            </span>
          </span>
        </button>

        <Button onClick={onFinish} className='h-11 gap-2 rounded-lg px-5'>
          <CheckCircle2 className='h-4 w-4' />
          {t("finish")}
        </Button>
      </div>
    </div>
  );
};

interface SongTimerMobileLayoutProps {
  timer: useTimerInterface;
  song: Song;
  map: SongSectionMapController;
  onFinish: () => void;
  onBack: () => void;
}

/**
 * The song session on a phone, built around one loop — listen, loop the hard
 * part, play it. The video and its controls stay pinned at the top while the
 * sections scroll under them; session time and Finish sit in a bar at the
 * bottom, the only place the time is shown. The metronome, notes and video
 * link come after the sections, out of the way.
 */
export const SongTimerMobileLayout = ({
  timer,
  song,
  map,
  onFinish,
  onBack,
}: SongTimerMobileLayoutProps) => {
  const { t } = useTranslation("timer");
  const { t: tCommon } = useTranslation("common");
  const [isVideoShown, setIsVideoShown] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  /** The section just marked, while its name and start are still being settled. */
  const [markedId, setMarkedId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const {
    playerRef,
    youtubeUrl,
    sections,
    currentTime,
    duration,
    loopSectionId,
    notes,
    setNotes,
    isSaving,
    setDuration,
    handleUrlSave,
    handleTimeUpdate,
    handleSeek,
    handleSectionLoop,
    handleAddSection,
    handleRename,
    handleTimeChange,
    handleMasteryChange,
    handleDelete,
  } = map;

  // One button for the music and the session time. Pausing stops only the
  // video — working a riff out by hand between listens is still practice,
  // so the time keeps going until it's paused in the bottom bar.
  const handleTogglePlay = () => {
    if (isVideoPlaying) {
      playerRef.current?.pause();
      return;
    }
    playerRef.current?.play();
    timer.startTimer();
  };

  // Moving a start plays from it straight away — the only way to tell on a
  // phone whether the mark landed on the downbeat.
  const handleMoveStart = (id: string, startTime: number) => {
    const end = duration > 0 ? Math.floor(duration) : Infinity;
    const clamped = Math.min(end, Math.max(0, startTime));
    handleTimeChange(id, clamped);
    handleSeek(clamped);
    playerRef.current?.play();
  };

  const marked = sections.find((s) => s.id === markedId) ?? null;

  const handleFinish = () => {
    playerRef.current?.pause();
    onFinish();
  };

  return (
    // Hides the app's bottom tab bar for the session, see globals.css.
    <div data-song-session='' className='space-y-4 px-3 pb-28'>
      <div ref={topRef} className='flex items-center gap-3 pt-2'>
        <button
          type='button'
          onClick={onBack}
          aria-label={tCommon("back")}
          className='-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 active:bg-zinc-800'>
          <ArrowLeft className='h-5 w-5' />
        </button>
        <div className='h-10 w-10 shrink-0 overflow-hidden rounded-lg'>
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              className='h-full w-full object-cover'
              alt=''
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-zinc-800'>
              <Music className='h-5 w-5 text-zinc-500' />
            </div>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <h1 className='truncate text-base font-semibold text-zinc-100'>
            {song.title}
          </h1>
          <p className='truncate text-xs text-zinc-400'>{song.artist}</p>
        </div>
      </div>

      {/* Pinned while the sections scroll under it — except on short screens,
          where it would leave no room for them. */}
      <div
        className={cn(
          isVideoShown &&
            "sticky top-0 z-20 -mx-3 space-y-2 bg-zinc-950 px-3 pb-3 pt-2 [@media(max-height:640px)]:static",
        )}>
        <YouTubeSongPlayer
          ref={playerRef}
          compact
          youtubeUrl={youtubeUrl}
          onUrlSave={handleUrlSave}
          onTimeUpdate={handleTimeUpdate}
          onDurationReady={setDuration}
          onPlay={timer.startTimer}
          playbackRate={speed}
          onPlayingChange={setIsVideoPlaying}
          onVideoShownChange={setIsVideoShown}
          songTitle={song.title}
          songArtist={song.artist}
        />
        {isVideoShown && (
          <SessionTransport
            sections={sections}
            currentTime={currentTime}
            duration={duration}
            loopSectionId={loopSectionId}
            isPlaying={isVideoPlaying}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onLoop={handleSectionLoop}
            onMark={() => setMarkedId(handleAddSection())}
          />
        )}
        {isVideoShown && marked && (
          <MarkSectionStrip
            section={marked}
            sections={sections}
            onRename={handleRename}
            onMoveStart={handleMoveStart}
            onUndo={(id) => {
              handleDelete(id);
              setMarkedId(null);
            }}
            onClose={() => setMarkedId(null)}
          />
        )}
      </div>

      {isVideoShown && (
        <div className='space-y-4 rounded-lg bg-zinc-900/40 p-4'>
          {duration > 0 && (
            <SectionTimeline
              sections={sections}
              currentTime={currentTime}
              duration={duration}
              loopSectionId={loopSectionId}
              onSeek={handleSeek}
              onSectionTimeChange={handleTimeChange}
              seekOnly
              className='h-10'
            />
          )}
          <div className='flex items-center gap-3'>
            <span className='shrink-0 text-xs font-medium text-zinc-400'>
              {t("youtube_player.speed")}
            </span>
            <div className='grid flex-1 grid-cols-5 gap-1.5'>
              {SPEEDS.map((rate) => (
                <button
                  key={rate}
                  type='button'
                  onClick={() => setSpeed(rate)}
                  aria-pressed={speed === rate}
                  className={cn(
                    "h-9 rounded-lg text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    speed === rate
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                  )}>
                  {rate}×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {youtubeUrl && (
        <MobileSectionList
          sections={sections}
          loopSectionId={loopSectionId}
          currentTime={currentTime}
          duration={duration}
          onLoop={handleSectionLoop}
          onRename={handleRename}
          onTimeChange={handleMoveStart}
          onMasteryChange={handleMasteryChange}
          onDelete={handleDelete}
        />
      )}

      <Accordion type='multiple'>
        <FreeTimerMetronome />
      </Accordion>

      <SongNotesCard
        notes={notes}
        onNotesChange={setNotes}
        isSaving={isSaving}
      />

      {isVideoShown && (
        <button
          type='button'
          onClick={() => {
            playerRef.current?.editVideo();
            topRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className='flex h-12 w-full items-center gap-3 rounded-lg bg-zinc-900/40 px-4 text-sm font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/60 hover:text-zinc-100'>
          <Pencil className='h-4 w-4 text-zinc-400' />
          {t("youtube.change_link")}
        </button>
      )}

      <SessionBar timer={timer} onFinish={handleFinish} />
    </div>
  );
};
