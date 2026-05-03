import { cn } from "assets/lib/utils";
import { Volume2, VolumeX, X } from "lucide-react";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheck, FaInfoCircle, FaLightbulb } from "react-icons/fa";
import { GiMetronome } from "react-icons/gi";

import { BpmProgressGrid } from "../../../components/BpmProgressGrid";
import { Metronome } from "../../../components/Metronome/Metronome";
import type { Exercise } from "../../../types/exercise.types";
import { useBpmProgressContext } from "../contexts/BpmProgressContext";

interface ExerciseQuickActionsBarProps {
  exercise: Exercise;
  metronome: any;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (v: boolean) => void;
  examMode?: boolean;
  compact?: boolean;
}

type ModalType = "instructions" | "metronome" | "bpm" | null;

const tempoColor = (bpm: number) =>
  bpm < 80 ? "text-emerald-400" : bpm < 120 ? "text-amber-400" : "text-red-400";

export const ExerciseQuickActionsBar = memo(function ExerciseQuickActionsBar({
  exercise,
  metronome,
  isMetronomeMuted,
  setIsMetronomeMuted,
  examMode = false,
  compact = false,
}: ExerciseQuickActionsBarProps) {
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const { bpmStages, completedBpms, isBpmLoading, onBpmToggle } = useBpmProgressContext();

  const hasInstructions = !!(exercise.instructions?.length || exercise.tips?.length);
  const hasMetronome = !!exercise.metronomeSpeed && !examMode;
  const hasBpmProgress = !!exercise.metronomeSpeed && bpmStages.length > 0 && !exercise.gpFileUrl && !examMode;

  if (!hasInstructions && !hasMetronome) return null;

  const bpm: number = metronome.bpm;
  const h = compact ? "h-8" : "h-12";

  const toggle = (modal: ModalType) => setOpenModal(openModal === modal ? null : modal);
  const close = () => setOpenModal(null);

  return (
    <>
      <div className={cn("flex items-center justify-center gap-1.5 flex-wrap", compact ? "" : "gap-3 mb-4")}>
        {hasInstructions && (
          <button
            onClick={() => toggle("instructions")}
            className={cn(
              "flex items-center gap-2 px-4 rounded-[8px] transition-all border",
              h,
              openModal === "instructions"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            )}
          >
            <FaInfoCircle className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
            {!compact && <span className="text-[10px] font-semibold tracking-wide hidden sm:block">About Exercise</span>}
          </button>
        )}

        {hasMetronome && (
          <div className={cn(
            "flex items-center rounded-[8px] border overflow-hidden transition-all",
            h,
            openModal === "metronome"
              ? "border-white/15 bg-zinc-800/60"
              : "border-white/5 bg-white/5"
          )}>
            <button
              onClick={() => toggle("metronome")}
              className={cn(
                "flex items-center gap-1.5 border-r border-white/5 h-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors",
                compact ? "px-2" : "px-3"
              )}
            >
              <GiMetronome className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
              {!compact && <span className="text-[10px] font-semibold tracking-wide hidden sm:block">Tempo</span>}
            </button>

            <button
              onClick={() => toggle("metronome")}
              className={cn(
                "flex items-center justify-center h-full border-r border-white/5 transition-colors hover:bg-white/5",
                compact ? "px-2" : "px-4",
                tempoColor(bpm)
              )}
            >
              <span className={cn("font-mono font-black", compact ? "text-[10px]" : "text-sm")}>{bpm}</span>
            </button>

            <button
              onClick={() => setIsMetronomeMuted(!isMetronomeMuted)}
              className={cn(
                "flex items-center justify-center h-full transition-colors",
                compact ? "px-2" : "px-2.5",
                isMetronomeMuted
                  ? "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title={isMetronomeMuted ? "Unmute metronome" : "Mute metronome"}
            >
              {isMetronomeMuted
                ? <VolumeX className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
                : <Volume2 className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
              }
            </button>
          </div>
        )}

        {hasBpmProgress && (
          <button
            onClick={() => toggle("bpm")}
            className={cn(
              "flex items-center gap-2 px-4 rounded-[8px] transition-all border font-bold",
              h,
              openModal === "bpm"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            )}
          >
            <FaCheck className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            {!compact && <span className="text-[10px] font-semibold tracking-wide">Speeds mastered</span>}
            <span className={cn(
              "font-mono px-1 rounded bg-white/5",
              compact ? "text-[10px]" : "text-xs px-1.5 py-0.5",
              completedBpms.length > 0 ? "text-emerald-400" : "text-zinc-500"
            )}>
              {completedBpms.length}/{bpmStages.length}
            </span>
          </button>
        )}
      </div>

      {openModal && createPortal(
        <div
          className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative w-full max-w-xl mx-4 bg-zinc-900 border border-white/10 rounded-[8px] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
            >
              <X size={18} />
            </button>

            {openModal === "instructions" && (
              <div className="p-8 max-h-[75vh] overflow-y-auto">
                {exercise.instructions && exercise.instructions.length > 0 && (
                  <div className={cn(exercise.tips?.length ? "mb-8" : "")}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-[8px] bg-cyan-500/10 text-cyan-400">
                        <FaInfoCircle />
                      </div>
                      <h3 className="font-bold text-white tracking-wide">Instructions</h3>
                    </div>
                    <div className="space-y-3 text-zinc-300 leading-relaxed text-left">
                      {exercise.instructions.map((instruction, idx) => (
                        <p key={idx}>{instruction}</p>
                      ))}
                    </div>
                  </div>
                )}
                {exercise.tips && exercise.tips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-[8px] bg-amber-500/10 text-amber-400">
                        <FaLightbulb />
                      </div>
                      <h3 className="font-bold text-white tracking-wide">Tips</h3>
                    </div>
                    <ul className="space-y-2 list-disc list-inside text-zinc-300 text-left">
                      {exercise.tips.map((tip, idx) => (
                        <li key={idx} className="marker:text-amber-500/50">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {openModal === "metronome" && (
              <div className="p-6">
                <Metronome
                  metronome={metronome}
                  isMuted={isMetronomeMuted}
                  onMuteToggle={setIsMetronomeMuted}
                  locked={examMode}
                />
              </div>
            )}

            {openModal === "bpm" && (
              <div className="p-6">
                <BpmProgressGrid
                  bpmStages={bpmStages}
                  completedBpms={completedBpms}
                  recommendedBpm={exercise.metronomeSpeed!.recommended}
                  onToggle={onBpmToggle}
                  isLoading={isBpmLoading}
                />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
});
