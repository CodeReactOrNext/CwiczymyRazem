import { cn } from "assets/lib/utils";
import { AnimatePresence,motion } from "framer-motion";

import { getPerformanceGrade } from "../hooks/noteMatchingFeedback";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";

/**
 * The game HUD shown when mic mode is active: score, accuracy grade,
 * combo streak, multiplier, and animated feedback text.
 */
export const MicHud = () => {
  const { gameState, maxPossibleScore, sessionAccuracy } = useNoteMatchingContext();
  return (
  <div className="w-full max-w-5xl mb-6 animate-in fade-in slide-in-from-top-6 duration-700">
    <div className="flex items-end justify-between gap-8">

      {/* Left: Accuracy */}
      <div className="flex-1 flex items-center gap-3">
        <div>
          <span className="block text-[10px] font-semibold tracking-wide text-zinc-500 mb-1">Accuracy</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-400 tabular-nums">{sessionAccuracy}%</span>
            <AnimatePresence mode="wait">
              {(() => {
                const grade = getPerformanceGrade(sessionAccuracy);
                return (
                  <motion.span
                    key={grade.letter}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold",
                      grade.color, grade.bg, grade.border, grade.glow
                    )}
                  >
                    {grade.letter}
                  </motion.span>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Center: Total Score */}
      <div className="flex flex-col items-center">
        <span className="block text-[10px] font-semibold tracking-wide text-zinc-500 mb-1">Total Score</span>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={gameState.score}
            initial={{ scale: 1.15, filter: "brightness(1.5)" }}
            animate={{ scale: 1, filter: "brightness(1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="text-4xl font-bold text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] inline-block"
          >
            {gameState.score.toLocaleString()}
          </motion.span>
          {maxPossibleScore > 0 && (
            <span className="text-sm font-bold text-zinc-600 tabular-nums">
              / {maxPossibleScore.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Right: Streak + Multiplier */}
      <div className="flex-1 flex justify-end items-center gap-8">
        <div className="text-right">
          <span className="block text-[10px] font-semibold tracking-wide text-zinc-500 mb-1">Note Streak</span>
          <div className="flex items-center justify-end gap-3">
            <span className="text-3xl font-bold text-cyan-400 tabular-nums">{gameState.combo}</span>
            <div className="flex flex-col gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 h-3 rounded-full transition-all duration-300",
                    gameState.combo > i ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-zinc-800"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="block text-[10px] font-semibold tracking-wide text-zinc-500 mb-1">Multiplier</span>
          <motion.span
            key={gameState.multiplier}
            initial={{ scale: 1.3, filter: "brightness(2)" }}
            animate={{ scale: 1, filter: "brightness(1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn(
              "text-4xl font-bold italic tracking-tighter tabular-nums transition-colors duration-300",
              gameState.multiplier >= 4 ? "text-main drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" : "text-white"
            )}
          >
            x{gameState.multiplier}
          </motion.span>
        </div>
      </div>

    </div>
  </div>
  );
};
