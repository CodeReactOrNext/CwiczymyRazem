import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "hooks/useMediaQuery";
import { QuarterTurnContext } from "hooks/useQuarterTurn";
import { useTranslation } from "hooks/useTranslation";
import { transitions } from "lib/motion/motion";
import { Check, Info, Minimize2, Pause, PlayIcon, RotateCcw, SkipBack, SkipForward, SlidersHorizontal, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import { ExerciseQuickActionsBar } from "../components/ExerciseQuickActionsBar";
import { FavoriteExerciseButton } from "../components/FavoriteExerciseButton";
import { MediaControlsToolbar } from "../components/MediaControlsToolbar";
import { MobileExerciseContent } from "../components/MobileExerciseContent";
import { MobileInstructionsCard } from "../components/MobileInstructionsCard";
import { MobileMicGameHud } from "../components/MobileMicGameHud";
import { StartGate, useStartGate } from "../components/StartGate";
import { QUARTER_TURN_STYLE } from "../components/tablatureDirection";
import { useNoteScore } from "../contexts/NoteMatchingContext";
import { useTimerContext } from "../contexts/TimerContext";
import { strumSynthVolume } from "../helpers/strumSynthVolume";
import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";
import { useLingeringControls, useTabFullscreen } from "../hooks/useTabFullscreen";

export type PhoneOrientation = "portrait" | "landscape";

/**
 * The clock and the score are the two things on this screen that change while the player
 * plays — the clock many times a second, the score on every note. Each reads its own context
 * here, so a tick or a hit repaints a few characters instead of the whole session screen.
 */
function TimeLeft() {
  const { formattedTimeLeft } = useTimerContext();
  return <>{formattedTimeLeft}</>;
}

function DrawerMicStats() {
  const { t } = useTranslation("session");
  const { gameState, sessionAccuracy } = useNoteScore();
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-900/60 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium text-zinc-400">{t("success.score")}</div>
        <div className="text-base font-bold tabular-nums text-white">{gameState.score.toLocaleString()}</div>
      </div>
      <div className="min-w-0 text-center">
        <div className="truncate text-[11px] font-medium text-zinc-400">{t("hud.acc_short")}</div>
        <div className="text-base font-bold tabular-nums text-emerald-400">{sessionAccuracy}%</div>
      </div>
      <div className="min-w-0 text-right">
        <div className="truncate text-[11px] font-medium text-zinc-400">{t("hud.streak")}</div>
        <div className="text-base font-bold tabular-nums text-cyan-400">{gameState.combo}×{gameState.multiplier}</div>
      </div>
    </div>
  );
}

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
  /** Above the exercise, upright only — a boss fight's arena. */
  heroSlot?: React.ReactNode;
}

/**
 * The phone's practice screen — one layout, turned rather than swapped. Sideways, the exercise
 * fills the screen with the timer under it and every control sits on one strip down the right
 * edge, the details drawer sliding out of it over the exercise.
 *
 * Upright on a phone, the exercise lays that same sideways screen on its side, so it reads
 * once the phone is turned: nudging the player round without forcing the page, which iOS can't
 * lock and a rotation-locked phone would never follow. The page then really rotating swaps the
 * turned box for the plain one with every element where it was — the exercise stays mounted
 * and a tab doesn't restart. Only a window that is wider than tall without being phone-short
 * (a small window, not a phone) gets the upright arrangement: strip along the bottom, drawer
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
  heroSlot,
}: PhoneSessionModalProps) {
  const { t } = useTranslation("session");
  const isPortrait = orientation === "portrait";
  // Every phone held upright, the big ones too — not just under 600px, which left a large
  // phone or a foldable with the exercise standing upright.
  const isUprightScreen = useMediaQuery("(orientation: portrait)");
  const hasTablature = !!activeTablature && activeTablature.length > 0;
  /** The sideways screen, laid on its side on an upright phone — every exercise reads sideways.
   *  What reads a drag off its own box (a tab, the detune slider, a song's section timeline)
   *  learns of the turn through QuarterTurnContext. */
  const isTurned = isPortrait && isUprightScreen;
  /** The sideways arrangement — the phone really turned, or the screen turned for it. */
  const isSideways = !isPortrait || isTurned;
  // The tools drawer starts shut: the tab owns the screen, the tools come up when asked for.
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  // What the exercise is about — over the exercise, opened from its title. Held per exercise,
  // so moving on to the next one closes it.
  const [infoExerciseId, setInfoExerciseId] = useState<string | null>(null);
  const isInfoOpen = infoExerciseId === currentExercise.id;
  const strumVolume = strumSynthVolume(isAudioMuted, audioTracks?.find(track => track.id === "main"));

  // "Like a film": the tab alone on the screen. Everything else here — title, timer, drawer,
  // strip — steps aside, and a small set of controls comes up on a touch, as in a video player.
  const { isFullscreen, showInstallHint, enter: enterFullscreen, exit: exitFullscreen } = useTabFullscreen();
  const handleTabFullscreenChange = useCallback(
    (on: boolean) => (on ? enterFullscreen() : exitFullscreen()),
    [enterFullscreen, exitFullscreen],
  );
  const { visible: fullscreenControlsVisible, wake: wakeFullscreenControls } =
    useLingeringControls(isFullscreen, isPlaying);

  // Start sits in the strip at the screen's far edge, away from the tab the
  // player is reading — until the first start the tab itself offers it.
  const startGate = useStartGate(isPlaying);
  const showStartGate = startGate.open && !heroSlot && !!activeTablature?.length
    && currentExercise.riddleConfig?.mode !== "sequenceRepeat";
  // The tab's own controls (look, zoom, full screen) live in the top bar — a row under the
  // tab cost it height on a screen that has none to spare.
  const [tabControlsSlot, setTabControlsSlot] = useState<HTMLElement | null>(null);
  // A tab runs to the screen's edges, like a video would; anything else keeps its margins.
  const isTabFlush = hasTablature && currentExercise.id !== "metronome_gap_test"
    && (currentExercise.riddleConfig?.mode !== "sequenceRepeat" || !!isRiddleRevealed);

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
  // Menus opened from this screen are portalled to the page, out of reach of its own classes.
  // The mark on <html> is what turns them into bottom sheets (globals.css, `phone-session`).
  useEffect(() => {
    if (!isOpen) return undefined;
    document.documentElement.classList.add("phone-session");
    return () => document.documentElement.classList.remove("phone-session");
  }, [isOpen]);

  const turnedSize = screenSize ?? (typeof window === "undefined"
    ? { width: 0, height: 0 }
    : { width: window.innerWidth, height: window.innerHeight });

  // The drawer turns with the screen: what sits in it is buttons and steppers, which take a tap
  // through the turn. Its sliders (volume) and lists (speed) open in menus portalled to the
  // page, so they come up upright — the only place a slider reads the pointer the right way.
  const drawer = (
    <AnimatePresence>
      {isPanelExpanded && (
        // Tapping the exercise beside the drawer shuts it, as any sheet on a phone would.
        <motion.button
          key="scrim"
          type="button"
          aria-label={t("tools.close_panel")}
          onClick={() => setIsPanelExpanded(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-0 bottom-0 top-10 z-10 cursor-default bg-black/50"
        />
      )}
      {isPanelExpanded && (
        <motion.div
          key="details"
          initial={isSideways ? { x: "100%" } : { y: "100%" }}
          animate={isSideways ? { x: 0 } : { y: 0 }}
          exit={isSideways ? { x: "100%" } : { y: "100%" }}
          transition={transitions.spring}
          // Sized off the exercise area, not the viewport: on a turned screen the viewport is
          // the upright phone, and 60vw of its narrow width left the drawer a sliver. It opens
          // under the top bar, so the title and the clock stay in sight.
          className={cn(
            "absolute z-10 flex flex-col gap-3 overflow-y-auto overscroll-contain scrollbar-hide bg-zinc-950 p-3",
            isSideways
              ? "bottom-0 right-0 top-10 w-[min(360px,66%)]"
              : "inset-x-0 bottom-0 max-h-[75%] rounded-t-lg",
          )}
        >
          {/* Mic stats — ear training keeps its own score inside EarTrainingView,
              the generic tab accuracy meter doesn't apply to it. */}
          {isMicEnabled && currentExercise.riddleConfig?.mode !== "sequenceRepeat" && (
            <DrawerMicStats />
          )}

          {/* Controls */}
          <div className="space-y-3">
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
              <div className="space-y-3 rounded-lg light-tint bg-gradient-to-br from-red-500/10 to-zinc-900/40 p-4">
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
            <QuarterTurnContext.Provider value={isTurned}>
              <div
                className={cn(
                  "flex overflow-hidden",
                  isSideways ? "flex-row" : "flex-col",
                  !isTurned && "h-full",
                  // Turned, the viewport is still the upright phone — this switches the
                  // `shortwide:` (phone held sideways) layouts on inside it.
                  isTurned && "sideways-screen",
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
                <div
                  onPointerDownCapture={isFullscreen ? wakeFullscreenControls : undefined}
                  className={cn(
                    "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                  )}
                  // Full screen runs edge to edge, so the notch is the board's to avoid — it sits
                  // at the board's start: the screen's left held sideways, its top when turned.
                  style={isFullscreen ? {
                    paddingLeft: isTurned ? "env(safe-area-inset-top, 0px)" : "env(safe-area-inset-left, 0px)",
                    paddingRight: isTurned ? undefined : "env(safe-area-inset-right, 0px)",
                  } : undefined}
                >
                  {/* Top bar — what is being played and how long is left, one slim row over
                      the exercise. The title opens the instructions the screen has no room for. */}
                  {!isFullscreen && (
                  <div className="flex h-10 shrink-0 items-center gap-2 pl-3 pr-2">
                    <button
                      type="button"
                      onClick={() => setInfoExerciseId(currentExercise.id)}
                      aria-label={t("header.exercise_info")}
                      className="flex h-10 min-w-0 items-center gap-1.5 text-left text-zinc-200 transition-colors hover:text-white"
                    >
                      <span className="truncate text-[13px] font-semibold">{currentExercise.title}</span>
                      <Info className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    </button>
                    {totalExercises > 1 && (
                      <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-500">
                        {currentExerciseIndex + 1}/{totalExercises}
                      </span>
                    )}
                    <div className="flex-1" />
                    <div ref={setTabControlsSlot} className="flex shrink-0 items-center" />
                    {currentExercise.id && <FavoriteExerciseButton exerciseId={currentExercise.id} compact />}
                    <span className={cn(
                      "shrink-0 font-mono text-base font-bold tabular-nums leading-none transition-colors",
                      isPlaying ? "text-white" : "text-zinc-400",
                    )}>
                      <TimeLeft />
                    </span>
                  </div>
                  )}

                  {/* Scroll container + min-h-full column: the exercise owns the free height — a
                      tab grows into it, anything shorter is centred in it — while tall exercises
                      (chord hunt, ear training) scroll instead of being clipped under the timer. */}
                  <div className={cn(
                    "min-h-0 w-full flex-1 overflow-y-auto overscroll-contain",
                    !isFullscreen && !isTabFlush && (isSideways ? "px-2 pb-2" : "px-4 pb-2"),
                  )}>
                    <div className="flex min-h-full w-full flex-col gap-4">
                      <div className="flex flex-1 flex-col justify-center gap-4">
                        {!isSideways && heroSlot}
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
                          tabFullscreen={isFullscreen}
                          tabFlush={isTabFlush}
                          tabControlsSlot={tabControlsSlot}
                          onTabFullscreenChange={handleTabFullscreenChange}
                        />
                      </div>

                      {/* Upright there's height to spare under the exercise, so the score reads
                          straight under the tab it's for; sideways it lives in the drawer. */}
                      {!isSideways && !heroSlot && isMicEnabled && !currentExercise.customGoal && currentExercise.riddleConfig?.mode !== "sequenceRepeat" && (
                        <MobileMicGameHud />
                      )}

                      {!isSideways && currentExercise.spotifyId && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-base">
                          <SpotifyPlayer trackId={currentExercise.spotifyId} height={80} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stood down while the drawer is open — the drawer's own menus sit over
                      the tab, and the veil would bury them. Back when the drawer closes. */}
                  {showStartGate && !isPanelExpanded && (
                    <StartGate
                      onStart={handleToggleTimer}
                      onPreview={startGate.dismiss}
                      countsIn={!!currentExercise.metronomeSpeed}
                      micOn={isMicEnabled}
                      // Under the top bar — the title and the clock stay readable.
                      className='top-10'
                    />
                  )}

                  {!isFullscreen && drawer}

                  {/* Full screen's own controls — over the board's corner, gone a moment after
                      the last touch while the tab plays. Hidden, they let touches through. */}
                  {isFullscreen && (
                    <div className={cn(
                      "absolute right-3 top-3 z-20 flex max-w-[min(22rem,70%)] flex-col items-end gap-2 transition-opacity duration-200",
                      !fullscreenControlsVisible && "pointer-events-none opacity-0",
                    )}
                    style={isTurned ? undefined : { right: "calc(0.75rem + env(safe-area-inset-right, 0px))" }}>
                      <div className="flex items-center gap-1.5 rounded-lg bg-zinc-950/90 p-1.5">
                        <span className={cn(
                          "px-2 font-mono text-sm font-black tabular-nums leading-none",
                          isPlaying ? "text-white" : "text-zinc-500",
                        )}>
                          <TimeLeft />
                        </span>
                        <Button onClick={handleRestart} variant="subtle" size="icon"
                          className="h-11 w-11 shrink-0 text-amber-400 hover:text-amber-300">
                          <RotateCcw size='1em' className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleToggleTimer} size="icon" className="h-11 w-11 shrink-0">
                          {isPlaying ? <Pause size='1em' className='h-4 w-4' /> : <PlayIcon size='1em' className='h-4 w-4' />}
                        </Button>
                        <Button onClick={exitFullscreen} variant="subtle" size="icon"
                          aria-label={t("tab.exit_fullscreen")}
                          className="h-11 w-11 shrink-0 text-zinc-400 hover:text-white">
                          <Minimize2 size='1em' className="h-4 w-4" />
                        </Button>
                      </div>
                      {showInstallHint && (
                        <p className="rounded-lg bg-zinc-950/90 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                          {t("tab.fullscreen_install_hint")}
                        </p>
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {isInfoOpen && (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 z-30 overflow-y-auto overscroll-contain bg-zinc-950"
                      >
                        <div className="mx-auto max-w-xl space-y-6 p-5">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <h3 className="text-sm font-bold text-white">{currentExercise.title}</h3>
                              {currentExercise.description && (
                                <p className="text-xs leading-relaxed text-zinc-400">{currentExercise.description}</p>
                              )}
                            </div>
                            <Button variant='ghost' size='icon' onClick={() => setInfoExerciseId(null)}
                              aria-label={t("header.close_info")}
                              className='-mr-2 -mt-2 h-9 w-9 shrink-0 text-zinc-400 hover:text-white'>
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                          <MobileInstructionsCard exercise={currentExercise} plain />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Always-visible controls strip — down the right edge sideways, along the bottom
                    upright */}
                <div className={cn(
                  "relative z-20 shrink-0 bg-zinc-950",
                  isSideways ? "w-16" : "pb-safe",
                  isFullscreen && "hidden",
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
                      className={cn(
                        "h-10 w-10 shrink-0 hover:text-white",
                        isPanelExpanded ? "bg-white/15 text-white" : "text-zinc-400",
                      )}
                    >
                      <SlidersHorizontal className='h-4 w-4' />
                    </Button>

                    <div className="flex-1" />

                    {currentExerciseIndex > 0 && (
                      <Button onClick={handleBackExerciseClick} variant="subtle" size="icon"
                        className="h-11 w-11 shrink-0 text-zinc-400">
                        <SkipBack size='1em' className="h-4 w-4" />
                      </Button>
                    )}
                    {hasTablature && (
                      <Button onClick={handleRestart} variant="subtle" size="icon"
                        className="h-11 w-11 shrink-0 text-amber-400 hover:text-amber-300">
                        <RotateCcw size='1em' className="h-4 w-4" />
                      </Button>
                    )}

                    {/* The one main action — white, like every primary button in the app. */}
                    <Button
                      onClick={handleToggleTimer}
                      size="icon"
                      className="h-12 w-12 shrink-0"
                    >
                      {isPlaying ? <Pause size='1em' className='h-4 w-4' /> : <PlayIcon size='1em' className='h-4 w-4' />}
                    </Button>

                    {!examMode && (
                      <Button
                        onClick={isLastExercise ? onFinish : handleNextExerciseClick}
                        disabled={isFinishing || isSubmittingReport }
                        variant="subtle" size="icon"
                        className="h-11 w-11 shrink-0 text-zinc-400"
                      >
                        {isFinishing || isSubmittingReport
                          ? <div className="h-3 w-3 animate-spin rounded-lg border-2 border-zinc-500/20 border-t-zinc-500" />
                          : isLastExercise ? <Check size='1em' className="h-4 w-4" /> : <SkipForward size='1em' className="h-4 w-4" />
                        }
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </QuarterTurnContext.Provider>

          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
}
