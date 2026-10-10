import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "hooks/useMediaQuery";
import { useTranslation } from "hooks/useTranslation";
import { X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import React, { useEffect, useRef, useState } from "react";
import { FaCheck, FaPause, FaPlay, FaStepBackward, FaStepForward, FaUndo } from "react-icons/fa";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import { ExerciseQuickActionsBar } from "../components/ExerciseQuickActionsBar";
import { FavoriteExerciseButton } from "../components/FavoriteExerciseButton";
import { MediaControlsToolbar } from "../components/MediaControlsToolbar";
import { MobileExerciseContent } from "../components/MobileExerciseContent";
import { MobileInstructionsCard } from "../components/MobileInstructionsCard";
import { MobileMicGameHud } from "../components/MobileMicGameHud";
import { QUARTER_TURN_STYLE } from "../components/tablatureDirection";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { useTimerContext } from "../contexts/TimerContext";
import { strumSynthVolume } from "../helpers/strumSynthVolume";
import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";

export type PhoneOrientation = "portrait" | "landscape";

interface PhoneSessionModalProps {
  orientation: PhoneOrientation;
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  currentExercise: any;
  currentExerciseIndex: number;
  totalExercises: number;
  isLastExercise: boolean;
  isPlaying: boolean;
  isFinishing?: boolean;
  isSubmittingReport?: boolean;
  metronome: any;
  effectiveBpm?: number;
  isMicEnabled: boolean;
  toggleMic: () => Promise<void>;
  isAudioMuted: boolean;
  setIsAudioMuted: (v: boolean) => void;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (v: boolean) => void;
  audioTracks?: AudioTrackConfig[];
  setTrackConfigs?: Dispatch<SetStateAction<Record<string, { volume: number; isMuted: boolean }>>>;
  masterVolume?: number;
  setMasterVolume?: (v: number) => void;
  speedMultiplier?: number;
  onSpeedMultiplierChange?: (value: number) => void;
  activeTablature?: any;
  isRiddleRevealed?: boolean;
  isRiddleGuessed?: boolean;
  hasPlayedRiddleOnce?: boolean;
  /** Ear training's own Play/Stop — replays the phrase from the top, unlike the session toggle. */
  onPlayRiddle?: () => void;
  handleRevealRiddle?: () => void;
  handleNextRiddle?: () => void;
  earTrainingScore?: number;
  earTrainingHighScore?: number | null;
  onEarTrainingGuessed?: () => void;
  riddleProgress?: RiddleProgress | null;
  examMode?: boolean;
  isListening: boolean;
  frequencyRef?: React.RefObject<number>;
  volumeRef?: React.RefObject<number>;
  onRecalibrate?: () => void;
  tabResetKey: number;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  handleToggleTimer: () => void;
  handleNextExerciseClick: () => void;
  handleBackExerciseClick: () => void;
  handleRestart: () => void;
  /** See MobileExerciseContent — a song item's section map, mounted once. */
  songSectionMapSlot?: React.ReactNode;
}

/**
 * The phone's practice screen — one layout, turned rather than swapped. Sideways, the exercise
 * fills the screen with the timer under it and every control sits on one strip down the right
 * edge, the details drawer sliding out of it over the exercise.
 *
 * Upright on a phone, a tab exercise lays that same sideways screen on its side, so it reads
 * once the phone is turned: nudging the player round without forcing the page, which iOS can't
 * lock and a rotation-locked phone would never follow. The page then really rotating swaps the
 * turned box for the plain one with every element where it was — the exercise stays mounted
 * and the tab doesn't restart. Everything else held upright — other exercises, a small tablet
 * with the width to spare — gets the upright arrangement: strip along the bottom, drawer
 * rising from it.
 */
export function PhoneSessionModal({
  orientation,
  isOpen,
  onClose,
  onFinish,
  currentExercise,
  currentExerciseIndex,
  totalExercises,
  isLastExercise,
  isPlaying,
  isFinishing,
  isSubmittingReport,
  metronome,
  effectiveBpm,
  isMicEnabled,
  toggleMic,
  isAudioMuted,
  setIsAudioMuted,
  isMetronomeMuted,
  setIsMetronomeMuted,
  audioTracks,
  setTrackConfigs,
  masterVolume,
  setMasterVolume,
  speedMultiplier,
  onSpeedMultiplierChange,
  activeTablature,
  isRiddleRevealed,
  isRiddleGuessed,
  hasPlayedRiddleOnce,
  onPlayRiddle,
  handleRevealRiddle,
  handleNextRiddle,
  earTrainingScore,
  earTrainingHighScore,
  onEarTrainingGuessed,
  riddleProgress,
  examMode,
  isListening,
  frequencyRef,
  volumeRef,
  onRecalibrate,
  tabResetKey,
  setVideoDuration,
  setTimerTime,
  startTimer,
  stopTimer,
  handleToggleTimer,
  handleNextExerciseClick,
  handleBackExerciseClick,
  handleRestart,
  songSectionMapSlot,
}: PhoneSessionModalProps) {
  const { t } = useTranslation("session");
  const isPortrait = orientation === "portrait";
  const isNarrow = useMediaQuery("(max-width: 599px)");
  const hasTablature = !!activeTablature && activeTablature.length > 0;
  // Only a tab is worth turning the phone for — and only a tab is safe to turn: the quizzes'
  // sliders read the pointer straight off the screen and would slide the wrong way. Ear
  // training keeps its tab hidden until it's guessed, so it stays upright throughout rather
  // than flipping mid-riddle.
  const isTabExercise =
    hasTablature &&
    !currentExercise.earQuizConfig &&
    currentExercise.id !== "metronome_gap_test" &&
    currentExercise.riddleConfig?.mode !== "sequenceRepeat";
  /** The sideways screen, laid on its side on an upright phone. */
  const isTurned = isPortrait && isNarrow && isTabExercise;
  /** The sideways arrangement — the phone really turned, or the screen turned for it. */
  const isSideways = !isPortrait || isTurned;
  // Sideways the drawer opens beside most of the tab. Upright it would cover the exercise, so
  // there it starts shut.
  const [isPanelExpanded, setIsPanelExpanded] = useState(!isPortrait);
  const { gameState, sessionAccuracy } = useNoteMatchingContext();
  const { formattedTimeLeft } = useTimerContext();
  const strumVolume = strumSynthVolume(isAudioMuted, audioTracks?.find(track => track.id === "main"));

  // The turned screen is sized off the real one: its width is the screen's height. Measured
  // inside the safe-area padding, so the strip — on the screen's lower edge once turned —
  // stays clear of the home indicator.
  const screenRef = useRef<HTMLDivElement>(null);
  const [screenSize, setScreenSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = screenRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    // Observing fires once straight away, which takes the first measurement.
    const observer = new ResizeObserver(([entry]) => {
      setScreenSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);
  const turnedSize = screenSize ?? (typeof window === "undefined"
    ? { width: 0, height: 0 }
    : { width: window.innerWidth, height: window.innerHeight });

  // The toggle's arrow points the way the drawer will move: out of the strip to open it,
  // back into the strip to close it.
  const toggleRotation = isSideways
    ? (isPanelExpanded ? 0 : 180)
    : (isPanelExpanded ? 90 : -90);

  // The drawer turns with the screen: what sits in it is buttons and steppers, which take a tap
  // through the turn. Its sliders (volume) and lists (speed) open in menus portalled to the
  // page, so they come up upright — the only place a slider reads the pointer the right way.
  const drawer = (
    <AnimatePresence>
      {isPanelExpanded && (
        <motion.div
          key="details"
          initial={isSideways ? { x: "100%" } : { y: "100%" }}
          animate={isSideways ? { x: 0 } : { y: 0 }}
          exit={isSideways ? { x: "100%" } : { y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          // Sized off the exercise area, not the viewport: on a turned screen the viewport is
          // the upright phone, and 60vw of its narrow width left the drawer a sliver.
          className={cn(
            "absolute z-10 flex flex-col overflow-y-auto overscroll-contain scrollbar-hide bg-zinc-950/90 shadow-2xl shadow-black/50 backdrop-blur-xl",
            isSideways
              ? "bottom-0 right-0 top-0 w-[min(320px,60%)]"
              : "inset-x-0 bottom-0 max-h-[75%] rounded-t-2xl",
          )}
        >
          {/* Title + counter */}
          <div className="flex items-center gap-1.5 px-3 pb-1 pt-3">
            <span className='flex-1 truncate text-[11px] font-bold text-foreground'>{currentExercise.title}</span>
            {currentExercise.id && <FavoriteExerciseButton exerciseId={currentExercise.id} compact />}
            <Badge variant='outline' className='shrink-0 text-[8px]'>{currentExerciseIndex + 1}/{totalExercises}</Badge>
          </div>

          {/* Mic stats — ear training keeps its own score inside EarTrainingView,
              the generic tab accuracy meter doesn't apply to it. */}
          {isMicEnabled && currentExercise.riddleConfig?.mode !== "sequenceRepeat" && (
            <div className="flex items-center justify-between gap-2 px-3 py-1 text-[9px]">
              <div className="min-w-0">
                <div className="tracking-widest text-zinc-600">{t("success.score")}</div>
                <div className="font-black tabular-nums text-white">{gameState.score.toLocaleString()}</div>
              </div>
              <div className="min-w-0">
                <div className="tracking-widest text-zinc-600">{t("hud.acc_short")}</div>
                <div className="font-black tabular-nums text-emerald-400">{sessionAccuracy}%</div>
              </div>
              <div className="min-w-0 text-right">
                <div className="tracking-widest text-zinc-600">{t("hud.streak")}</div>
                <div className="font-black tabular-nums text-cyan-400">{gameState.combo}×{gameState.multiplier}</div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-2 px-3 py-2">
            <MediaControlsToolbar
              hasMetronome={!!currentExercise.metronomeSpeed}
              hasAudioTrack={!!(activeTablature?.length > 0 || currentExercise.gpFileUrl || currentExercise.strummingPatterns?.length > 0) && !currentExercise.disableBackingTrack}
              hasMicControls={!!(activeTablature?.length > 0 || currentExercise.gpFileUrl || currentExercise.customGoal || currentExercise.strummingPatterns?.length > 0) && !currentExercise.disableMic}
              speedMultiplier={speedMultiplier ?? 1}
              onSpeedMultiplierChange={onSpeedMultiplierChange ?? (() => {})}
              isAudioMuted={isAudioMuted}
              isRiddleMode={currentExercise.riddleConfig?.mode === "sequenceRepeat"}
              onAudioToggle={() => setIsAudioMuted(!isAudioMuted)}
              isMicEnabled={isMicEnabled}
              onMicToggle={toggleMic}
              onRecalibrate={onRecalibrate ?? (() => {})}
              frequencyRef={frequencyRef}
              volumeRef={volumeRef}
              disableTuner={currentExercise.disableTuner}
              baseBpm={metronome?.bpm}
              metronome={metronome} isMetronomeMuted={isMetronomeMuted} setIsMetronomeMuted={setIsMetronomeMuted}
              audioTracks={audioTracks} setTrackConfigs={setTrackConfigs}
              masterVolume={currentExercise.gpFileUrl ? masterVolume : undefined}
              onMasterVolumeChange={currentExercise.gpFileUrl ? setMasterVolume : undefined}
              mobile
              dense
            />
            <ExerciseQuickActionsBar
              exercise={currentExercise}
              metronome={metronome}
              examMode={examMode}
              compact
            />
            <MobileInstructionsCard exercise={currentExercise} />

            {/* In the drawer, where every arrangement can reach them — the screen itself has no
                room under the exercise sideways. */}
            {currentExercise.links && currentExercise.links.length > 0 && (
              <div className="space-y-3 rounded-lg bg-gradient-to-br from-red-500/10 to-zinc-900/40 p-4">
                <div className="text-xs font-bold tracking-widest text-red-400">
                  {t("instructions.support_author")}
                </div>
                <div className="flex flex-col gap-2">
                  {currentExercise.links.map((link: any, idx: number) => (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-sm transition-all hover:bg-white/10"
                    >
                      <span className="font-medium text-zinc-300 group-hover:text-white">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <ModalWrapper zIndex='z-[9999999]'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={screenRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("relative h-full overflow-hidden bg-black", isTurned && "pb-safe")}
          >
            {/* The screen's own box — turned onto its side on an upright phone. The same element
                either way, so turning the phone never remounts what's inside it. */}
            <div
              className={cn(
                "flex overflow-hidden",
                isSideways ? "flex-row" : "flex-col",
                !isTurned && "h-full",
              )}
              style={isTurned ? {
                ...QUARTER_TURN_STYLE,
                position: "absolute",
                top: 0,
                left: 0,
                width: turnedSize.height,
                height: turnedSize.width,
              } : undefined}
            >
              {/* The exercise, the timer underneath it, and the drawer over both */}
              <div className={cn(
                "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                isSideways ? "p-2" : "px-4 pb-2 pt-4",
              )}>
                {/* Scroll container + min-h-full column: the exercise owns the free height — a
                    tab grows into it, anything shorter is centred in it — while tall exercises
                    (chord hunt, ear training) scroll instead of being clipped under the timer. */}
                <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
                  <div className="flex min-h-full w-full flex-col gap-4">
                    <div className="flex flex-1 flex-col justify-center gap-4">
                      <MobileExerciseContent
                        currentExercise={currentExercise}
                        activeTablature={activeTablature}
                        effectiveBpm={effectiveBpm}
                        metronome={metronome}
                        isRiddleRevealed={isRiddleRevealed}
                        isRiddleGuessed={isRiddleGuessed}
                        hasPlayedRiddleOnce={hasPlayedRiddleOnce}
                        isPlaying={isPlaying}
                        isListening={isListening}
                        isMicEnabled={isMicEnabled}
                        frequencyRef={frequencyRef}
                        tabResetKey={tabResetKey}
                        setVideoDuration={setVideoDuration}
                        setTimerTime={setTimerTime}
                        startTimer={startTimer}
                        stopTimer={stopTimer}
                        onVideoEnd={handleNextExerciseClick}
                        earTrainingScore={earTrainingScore}
                        earTrainingHighScore={earTrainingHighScore}
                        handleRevealRiddle={handleRevealRiddle}
                        handleNextRiddle={handleNextRiddle}
                        onEarTrainingGuessed={onEarTrainingGuessed}
                        riddleProgress={riddleProgress}
                        onPlayRiddle={onPlayRiddle ?? handleToggleTimer}
                        isExamMode={examMode}
                        strumVolume={strumVolume}
                        songSectionMapSlot={songSectionMapSlot}
                        turnTab={isTurned}
                      />
                    </div>

                    {/* Upright there's height to spare under the exercise, so the score reads
                        straight under the tab it's for; sideways it lives in the drawer. */}
                    {!isSideways && isMicEnabled && !currentExercise.customGoal && currentExercise.riddleConfig?.mode !== "sequenceRepeat" && (
                      <MobileMicGameHud />
                    )}

                    {!isSideways && currentExercise.spotifyId && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <SpotifyPlayer trackId={currentExercise.spotifyId} height={80} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer — always visible, even with the details drawer collapsed */}
                <div className="flex shrink-0 items-center justify-center pt-1.5">
                  <div className={cn(
                    "font-mono text-2xl font-black leading-none tracking-tighter transition-colors",
                    isPlaying ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]" : "text-zinc-500"
                  )}>
                    {formattedTimeLeft}
                  </div>
                </div>

                {drawer}
              </div>

              {/* Always-visible controls strip — down the right edge sideways, along the bottom
                  upright */}
              <div className={cn(
                "relative z-20 shrink-0 bg-zinc-950/80 backdrop-blur-xl",
                isSideways ? "w-16" : "pb-safe",
              )}>
                <div className={cn(
                  "flex items-center gap-1.5 overscroll-contain scrollbar-hide",
                  isSideways
                    ? "h-full flex-col overflow-y-auto py-2"
                    : "h-16 flex-row overflow-x-auto px-3",
                )}>
                  <Button variant='ghost' size='icon' onClick={onClose}
                    aria-label={t("header.close_session")}
                    className='h-10 w-10 shrink-0 text-zinc-500 hover:text-white'>
                    <X className='h-4 w-4' />
                  </Button>

                  <Button variant='ghost' size='icon'
                    onClick={() => setIsPanelExpanded(prev => !prev)}
                    aria-label={isPanelExpanded ? t("tools.close_panel") : t("tools.open_panel")}
                    aria-expanded={isPanelExpanded}
                    className='h-10 w-10 shrink-0 text-zinc-400 hover:text-white'
                  >
                    <motion.span
                      animate={{ rotate: toggleRotation }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <FaStepForward className='h-4 w-4' />
                    </motion.span>
                  </Button>

                  <div className="flex-1" />

                  {currentExerciseIndex > 0 && (
                    <Button onClick={handleBackExerciseClick} variant="ghost" size="icon"
                      className="h-11 w-11 shrink-0 rounded-lg bg-white/5 text-zinc-400 hover:text-white">
                      <FaStepBackward className="h-4 w-4" />
                    </Button>
                  )}
                  {hasTablature && (
                    <Button onClick={handleRestart} variant="ghost" size="icon"
                      className="h-11 w-11 shrink-0 rounded-lg bg-white/5 text-amber-400 hover:text-amber-300">
                      <FaUndo className="h-4 w-4" />
                    </Button>
                  )}

                  {/* The one main action — white, like every primary button in the app. */}
                  <Button
                    onClick={handleToggleTimer}
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-lg bg-white text-black transition-colors click-behavior hover:bg-zinc-200"
                  >
                    {isPlaying ? <FaPause className='h-4 w-4' /> : <FaPlay className='h-4 w-4' />}
                  </Button>

                  {!examMode && (
                    <Button
                      onClick={isLastExercise ? onFinish : handleNextExerciseClick}
                      disabled={isFinishing || isSubmittingReport }
                      variant="ghost" size="icon"
                      className="h-11 w-11 shrink-0 rounded-lg bg-white/5 text-zinc-400 hover:text-white"
                    >
                      {isFinishing || isSubmittingReport
                        ? <div className="h-3 w-3 animate-spin rounded-lg border-2 border-zinc-500/20 border-t-zinc-500" />
                        : isLastExercise ? <FaCheck className="h-4 w-4" /> : <FaStepForward className="h-4 w-4" />
                      }
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
}
