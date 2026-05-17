import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

import { getPerformanceGrade } from "../hooks/noteMatchingFeedback";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";

const mobileFeedbackStyles: Record<string, { color: string; dropShadow: string; scale: number }> = {
  "NICE!":          { color: "text-emerald-400", dropShadow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]",  scale: 1.15 },
  "GREAT!":         { color: "text-cyan-400",    dropShadow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]",  scale: 1.2  },
  "AMAZING!":       { color: "text-purple-400",  dropShadow: "drop-shadow-[0_0_12px_rgba(192,132,252,0.6)]", scale: 1.25 },
  "ON FIRE!":       { color: "text-orange-400",  dropShadow: "drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]",  scale: 1.3  },
  "UNSTOPPABLE!":   { color: "text-amber-400",   dropShadow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]",  scale: 1.35 },
  "MULTIPLIER UP!": { color: "text-main",        dropShadow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]",   scale: 1.3  },
};

export function MobileMicGameHud() {
  const { gameState, maxPossibleScore, sessionAccuracy } = useNoteMatchingContext();

  return (
    <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between gap-4">

        {/* Score */}
        <div className="flex-1">
          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Score</span>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={gameState.score}
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="text-2xl font-black text-white tabular-nums tracking-tighter inline-block"
            >
              {gameState.score.toLocaleString()}
            </motion.span>
            {maxPossibleScore != null && maxPossibleScore > 0 && (
              <span className="text-[10px] font-bold text-zinc-600 tabular-nums">/ {maxPossibleScore.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex-1 text-center">
          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Accuracy</span>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl font-bold text-emerald-400 tabular-nums">{sessionAccuracy}%</span>
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
                      "inline-flex items-center justify-center w-6 h-6 rounded-md border text-[10px] font-black",
                      grade.color, grade.bg, grade.glow
                    )}
                  >
                    {grade.letter}
                  </motion.span>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>

        {/* Streak */}
        <div className="flex-1 text-right">
          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Streak</span>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-2xl font-black text-cyan-400 tabular-nums">{gameState.combo}</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-main/20 border border-main/20">
              <span className="text-xs font-black text-white italic">x{gameState.multiplier}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Feedback text */}
      <div className="relative h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {gameState.lastFeedback && (() => {
            const style = mobileFeedbackStyles[gameState.lastFeedback] || {
              color: "text-cyan-400",
              dropShadow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]",
              scale: 1.2,
            };
            return (
              <motion.div
                key={gameState.feedbackId}
                initial={{ y: 20, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: style.scale }}
                exit={{ y: -20, opacity: 0, scale: style.scale + 0.3 }}
                className={cn("text-xl font-black uppercase italic tracking-tighter", style.color, style.dropShadow)}
              >
                {gameState.lastFeedback}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
