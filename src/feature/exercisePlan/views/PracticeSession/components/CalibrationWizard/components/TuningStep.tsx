import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import React from "react";
import { FaCheck, FaRedo, FaTimes } from "react-icons/fa";

import type { CalibrationOffsets } from "../../../hooks/useCalibration";
import { STRINGS } from "../calibration.constants";
import { useTuningFrequency } from "../hooks/useTuningFrequency";
import { ArcTuner } from "./ArcTuner";
import { StringProgress } from "./StringProgress";

interface TuningStepProps {
  currentIndex:  number;
  offsets:       CalibrationOffsets;
  sampleCount:   number;
  stringState:   "listening" | "done";
  currentOffset: number | null;
  audioRefs:     AudioRefs;
  onRetry:       () => void;
  onAdvance:     () => void;
  onCancel:      () => void;
}

export const TuningStep = React.memo(function TuningStep({
  currentIndex, offsets, sampleCount, stringState, currentOffset,
  audioRefs, onRetry, onAdvance, onCancel,
}: TuningStepProps) {
  const str = STRINGS[currentIndex];
  const { cents, hasNote } = useTuningFrequency(audioRefs, str.hz);

  const abs          = Math.abs(cents);
  const isInTune     = hasNote && abs < 10;
  const isClose      = hasNote && abs < 25;
  const isWrongString = hasNote && abs > 200;
  const captureProgress = sampleCount / 8; // MIN_SAMPLES



  const statusText = isWrongString ? "Wrong string?"
    : !hasNote    ? `Play the open ${str.name} string`
    : isInTune    ? "In tune — keep holding…"
    : `${Math.round(abs)}¢ ${cents > 0 ? "sharp ↓ tune down" : "flat ↑ tune up"}`;

  const statusColor = isWrongString ? "text-zinc-500"
    : !hasNote  ? "text-zinc-600"
    : isInTune  ? "text-emerald-400"
    : isClose   ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="flex h-full flex-col px-5 py-5 text-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Tune Your Guitar</h2>
          <p className="text-[10px] text-zinc-600 font-bold tracking-widest mt-0.5">
            String {currentIndex + 1} of {STRINGS.length}
          </p>
        </div>
        <button onClick={onCancel} className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
      </div>



      <div className="h-0.5 w-full rounded-full bg-zinc-800 overflow-hidden mb-4">
        <motion.div className="h-full bg-cyan-500"
          animate={{ width: `${(Object.keys(offsets).length / STRINGS.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        />
      </div>

      <div className="mb-3"><StringProgress currentIndex={currentIndex} offsets={offsets} /></div>

      <AnimatePresence mode="wait">
        <motion.p key={currentIndex} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="text-center text-sm text-zinc-400 mb-2"
        >
          Play open string{" "}<span className="text-white font-bold">{str.name}</span>
          {str.id === 6 ? " — thickest" : str.id === 1 ? " — thinnest" : ""}
        </motion.p>
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-xs flex flex-col items-center">
          <ArcTuner cents={cents} hasNote={hasNote} />
          <div className="flex justify-between w-full px-3 -mt-1 mb-2">
            <span className="text-[9px] font-bold tracking-widest text-zinc-700">← Flat</span>
            <span className="text-[9px] font-bold tracking-widest text-zinc-700">Sharp →</span>
          </div>

          <div className="text-center space-y-0.5 mb-3">
            <div className={cn("text-5xl font-black tracking-tighter tabular-nums transition-colors duration-200",
              !hasNote && "text-zinc-700",
              hasNote && !isInTune && !isClose && "text-red-400",
              isClose && !isInTune && "text-amber-400",
              isInTune && "text-emerald-400"
            )}>{str.name}</div>
            <div className={cn("text-sm font-mono font-bold tabular-nums transition-colors duration-200",
              !hasNote && "text-zinc-700",
              hasNote && !isInTune && !isClose && "text-red-400/70",
              isClose && !isInTune && "text-amber-400/70",
              isInTune && "text-emerald-400/70"
            )}>
              {hasNote ? `${cents >= 0 ? "+" : ""}${Math.round(cents)}¢` : "—"}
            </div>
          </div>

          <AnimatePresence mode="wait">

              <div key="status" className="w-full">
                <p className={cn("text-sm font-medium text-center min-h-[1.25rem] transition-colors duration-200", statusColor)}>
                  {statusText}
                </p>
                <div className="w-full mt-6 space-y-2">
                  <div className="h-3 w-full rounded-lg bg-zinc-950 overflow-hidden shadow-inner">
                    <motion.div
                      className={cn(
                        "h-full rounded-lg relative",
                        isInTune ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" : "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      )}
                      animate={{ width: `${captureProgress * 100}%` }}
                      transition={{ duration: 0.1 }}
                    >
                      {captureProgress > 0 && captureProgress < 1 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      )}
                    </motion.div>
                  </div>

                </div>
              </div>
          </AnimatePresence>
        </div>
      </div>

        <div className="w-full mt-8 space-y-3">
          <motion.div
            animate={stringState === "done" ? {
              x: [0, -1, 1, -1, 1, 0],
              transition: {
                duration: 0.4,
                repeat: Infinity,
                repeatDelay: 2
              }
            } : {}}
          >
            <Button
              onClick={onAdvance}
              variant={stringState === "done" ? "default" : "secondary"}
              className={cn(
                "w-full h-12 transition-all duration-300",
                stringState === "done" && "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              )}
            >
              {stringState === "done" 
                ? (currentIndex < STRINGS.length - 1 ? "Next String" : "Finish Calibration")
                : "Skip String"
              }
            </Button>
          </motion.div>
          
          {stringState === "done" && (
            <Button 
              variant="ghost"
              onClick={onRetry}
              className="w-full h-8 text-zinc-500 hover:text-zinc-300"
            >
              Redo this string
            </Button>
          )}
        </div>
    </div>
  );
});
