import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { BpmProgressGrid } from "feature/exercisePlan/components/BpmProgressGrid";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Minus, Plus, Volume2, VolumeX, X } from "lucide-react";
import React, { useState } from "react";
import {
  FaCheck, FaInfoCircle, FaLightbulb, FaPause, FaPlay,
  FaStepBackward, FaStepForward, FaUndo, FaVolumeMute, FaVolumeUp,
} from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { MobileExerciseContent } from "../components/MobileExerciseContent";
import { useTimerContext } from "../contexts/TimerContext";
import { useBpmProgressContext } from "../contexts/BpmProgressContext";

interface LandscapeSessionModalProps {
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
  isHalfSpeed?: boolean;
  onHalfSpeedToggle?: (value: boolean) => void;
  activeTablature?: any;
  isRiddleRevealed?: boolean;
  isRiddleGuessed?: boolean;
  hasPlayedRiddleOnce?: boolean;
  handleRevealRiddle?: () => void;
  handleNextRiddle?: () => void;
  earTrainingScore?: number;
  earTrainingHighScore?: number | null;
  onEarTrainingGuessed?: () => void;
  examMode?: boolean;
  isListening: boolean;
  frequencyRef?: React.MutableRefObject<number>;
  gradientClasses: string;
  tabResetKey: number;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  handleToggleTimer: () => void;
  handleNextExerciseClick: () => void;
  handleBackExerciseClick: () => void;
  handleRestart: () => void;
}

export function LandscapeSessionModal({
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
  isHalfSpeed,
  onHalfSpeedToggle,
  activeTablature,
  isRiddleRevealed,
  isRiddleGuessed,
  hasPlayedRiddleOnce,
  handleRevealRiddle,
  handleNextRiddle,
  earTrainingScore,
  earTrainingHighScore,
  onEarTrainingGuessed,
  examMode,
  isListening,
  frequencyRef,
  gradientClasses,
  tabResetKey,
  setVideoDuration,
  setTimerTime,
  startTimer,
  stopTimer,
  handleToggleTimer,
  handleNextExerciseClick,
  handleBackExerciseClick,
  handleRestart,
}: LandscapeSessionModalProps) {
  const { bpmStages, completedBpms, isBpmLoading, onBpmToggle } = useBpmProgressContext();
  const { t } = useTranslation(["exercises"]);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const { gameState, sessionAccuracy } = useNoteMatchingContext();
  const { formattedTimeLeft } = useTimerContext();

  return (
    <ModalWrapper zIndex='z-[9999999]'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("flex h-full flex-row overflow-hidden", gradientClasses)}
          >
            {/* Left panel: exercise content */}
            <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
              <div className="w-full h-full flex items-center justify-center">
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
                  onPlayRiddle={handleToggleTimer}
                />
              </div>
            </div>

            {/* Right panel */}
            <motion.div
              animate={{ width: isPanelExpanded ? 240 : 56 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex shrink-0 flex-row border-l border-white/10 bg-zinc-950/80 backdrop-blur-xl overflow-hidden"
            >
              {/* Scrollable details — visible only when expanded */}
              <AnimatePresence>
                {isPanelExpanded && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex w-[184px] shrink-0 flex-col overflow-y-auto overscroll-contain scrollbar-hide border-r border-white/5"
                  >
                    {/* Title + counter */}
                    <div className="flex items-center gap-1 border-b border-white/5 px-2 py-2">
                      <span className='flex-1 truncate text-[10px] font-bold text-foreground'>{currentExercise.title}</span>
                      <Badge variant='outline' className='shrink-0 text-[8px]'>{currentExerciseIndex + 1}/{totalExercises}</Badge>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-center px-2 pt-3 pb-1">
                      <div className={cn(
                        "text-3xl font-mono font-black tracking-tighter leading-none transition-colors",
                        isPlaying ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]" : "text-zinc-500"
                      )}>
                        {formattedTimeLeft}
                      </div>
                    </div>

                    {/* Mic stats */}
                    {isMicEnabled && (
                      <div className="px-2 py-1 space-y-1 border-b border-white/5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-600 uppercase tracking-widest">Score</span>
                          <span className="font-black text-white tabular-nums">{gameState.score.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-600 uppercase tracking-widest">Acc</span>
                          <span className="font-black text-emerald-400 tabular-nums">{sessionAccuracy}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-600 uppercase tracking-widest">Streak</span>
                          <span className="font-black text-cyan-400 tabular-nums">{gameState.combo}×{gameState.multiplier}</span>
                        </div>
                      </div>
                    )}

                    {/* Metronome — compact inline */}
                    {currentExercise.metronomeSpeed && (
                      <div className="px-2 py-2 border-b border-white/5 space-y-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-500 w-6">BPM</span>
                          <span className="text-sm font-black text-white tabular-nums w-8 text-center">{metronome.bpm}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6 shrink-0 p-0"
                            onClick={() => metronome.setBpm(Math.max(metronome.minBpm, metronome.bpm - 1))}
                            disabled={metronome.bpm <= metronome.minBpm}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="flex-1">
                            <Slider
                              value={[metronome.bpm]}
                              min={metronome.minBpm}
                              max={metronome.maxBpm}
                              step={1}
                              onValueChange={(v) => metronome.setBpm(v[0])}
                              className="py-1"
                            />
                          </div>
                          <Button variant="outline" size="icon" className="h-6 w-6 shrink-0 p-0"
                            onClick={() => metronome.setBpm(Math.min(metronome.maxBpm, metronome.bpm + 1))}
                            disabled={metronome.bpm >= metronome.maxBpm}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-zinc-600 tabular-nums">{metronome.minBpm}–{metronome.maxBpm}</span>
                          <div className="flex-1" />
                          <Button variant="ghost" size="icon"
                            className={cn("h-6 w-6", isMetronomeMuted ? "text-zinc-500" : "text-cyan-400")}
                            onClick={() => setIsMetronomeMuted(!isMetronomeMuted)}>
                            {isMetronomeMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </Button>
                          {currentExercise.metronomeSpeed.recommended !== metronome.bpm && (
                            <Button variant="ghost" size="sm"
                              className="h-6 px-1.5 text-[8px] font-bold text-zinc-400 hover:text-white"
                              onClick={metronome.handleSetRecommendedBpm}>
                              Rec {currentExercise.metronomeSpeed.recommended}
                            </Button>
                          )}
                        </div>

                        {onHalfSpeedToggle && (
                          <Button variant="ghost" size="sm"
                            className={cn("w-full h-6 text-[9px] font-bold uppercase tracking-widest",
                              isHalfSpeed ? "text-cyan-400 bg-cyan-500/10" : "text-zinc-500")}
                            onClick={() => onHalfSpeedToggle(!isHalfSpeed)}>
                            ½× Half Speed
                          </Button>
                        )}

                        {currentExercise.tablature && currentExercise.tablature.length > 0 && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm"
                              className={cn("flex-1 gap-1 h-6 text-[9px] font-bold uppercase tracking-widest",
                                isAudioMuted ? "text-zinc-500" : "text-cyan-400 bg-cyan-500/10")}
                              onClick={() => setIsAudioMuted(!isAudioMuted)}>
                              <GiGuitar className="text-xs" />
                              {isAudioMuted ? <FaVolumeMute className="h-2.5 w-2.5" /> : <FaVolumeUp className="h-2.5 w-2.5" />}
                            </Button>
                            <Button variant="ghost" size="sm"
                              className={cn("flex-1 gap-1 h-6 text-[9px] font-bold uppercase tracking-widest",
                                !isMicEnabled ? "text-zinc-500" : "text-emerald-400 bg-emerald-500/10")}
                              onClick={toggleMic}>
                              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", isMicEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")} />
                              {isMicEnabled ? "Mic On" : "Mic Off"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BPM Progress */}
                    {currentExercise.metronomeSpeed && bpmStages && bpmStages.length > 0 && onBpmToggle && !currentExercise.gpFileUrl && (
                      <div className="px-2 py-2 border-b border-white/5">
                        <BpmProgressGrid
                          bpmStages={bpmStages}
                          completedBpms={completedBpms || []}
                          recommendedBpm={currentExercise.metronomeSpeed.recommended}
                          onToggle={onBpmToggle}
                          isLoading={isBpmLoading}
                        />
                      </div>
                    )}

                    {/* Instructions */}
                    {currentExercise.instructions?.length > 0 && (
                      <div className="px-2 py-2 border-b border-white/5">
                        <div className="flex items-center gap-1 mb-1.5">
                          <FaInfoCircle className="h-3 w-3 text-cyan-400" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{t("exercises:instructions")}</span>
                        </div>
                        <div className="space-y-1">
                          {currentExercise.instructions.map((ins: string, idx: number) => (
                            <p key={idx} className="text-[9px] text-zinc-500 leading-relaxed">{ins}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {currentExercise.tips?.length > 0 && (
                      <div className="px-2 py-2 pb-4">
                        <div className="flex items-center gap-1 mb-1.5">
                          <FaLightbulb className="h-3 w-3 text-amber-400" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{t("exercises:hints")}</span>
                        </div>
                        <ul className="space-y-1 list-disc list-inside marker:text-amber-500/50">
                          {currentExercise.tips.map((tip: string, idx: number) => (
                            <li key={idx} className="text-[9px] text-zinc-500 leading-relaxed">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Always-visible controls strip */}
              <div className="flex w-14 shrink-0 flex-col items-center gap-2 py-2">
                <Button variant='ghost' size='icon' onClick={onClose} className='h-8 w-8 shrink-0 text-zinc-500 hover:text-white'>
                  <X className='h-4 w-4' />
                </Button>

                <Button variant='ghost' size='icon'
                  onClick={() => setIsPanelExpanded(prev => !prev)}
                  className='h-8 w-8 shrink-0 text-zinc-400 hover:text-white'
                >
                  <motion.span
                    animate={{ rotate: isPanelExpanded ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <FaStepForward className='h-3 w-3' />
                  </motion.span>
                </Button>

                <div className="flex-1" />

                {currentExerciseIndex > 0 && (
                  <Button onClick={handleBackExerciseClick} variant="ghost" size="icon"
                    className="h-9 w-9 shrink-0 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white">
                    <FaStepBackward className="h-3 w-3" />
                  </Button>
                )}
                {activeTablature && activeTablature.length > 0 && (
                  <Button onClick={handleRestart} variant="ghost" size="icon"
                    className="h-9 w-9 shrink-0 rounded-full border border-white/5 bg-white/5 text-amber-400 hover:text-amber-300">
                    <FaUndo className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  onClick={handleToggleTimer}
                  size="icon"
                  className={cn(
                    "h-11 w-11 shrink-0 rounded-2xl transition-all click-behavior",
                    isPlaying ? "bg-white text-black shadow-lg" : "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                  )}
                >
                  {isPlaying ? <FaPause className='h-4 w-4' /> : <FaPlay className='h-4 w-4' />}
                </Button>

                {!examMode && (
                  <Button
                    onClick={isLastExercise ? onFinish : handleNextExerciseClick}
                    disabled={isFinishing || isSubmittingReport }
                    variant="ghost" size="icon"
                    className="h-9 w-9 shrink-0 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                  >
                    {isFinishing || isSubmittingReport
                      ? <div className="h-3 w-3 border-2 border-zinc-500/20 border-t-zinc-500 animate-spin rounded-full" />
                      : isLastExercise ? <FaCheck className="h-4 w-4" /> : <FaStepForward className="h-4 w-4" />
                    }
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
}
