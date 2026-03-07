import { cn } from "assets/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { feedbackStyles, getPerformanceGrade, type GameState } from "../hooks/useNoteMatching";

interface MicHudProps {
  gameState: GameState;
  maxPossibleScore: number;
  sessionAccuracy: number;
}

/**
 * The game HUD shown when mic mode is active: score, accuracy grade,
 * combo streak, multiplier, and animated feedback text.
 */
export const MicHud = ({ gameState, maxPossibleScore, sessionAccuracy }: MicHudProps) => (
  <div className="w-full max-w-5xl mb-6 animate-in fade-in slide-in-from-top-6 duration-700">
    <div className="flex items-end justify-between gap-8">

      {/* Left: Score & Accuracy */}
      <div className="flex-1 flex items-center gap-6">
        <div className="relative group">
          <div className="absolute -inset-2 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
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

      {/* Center: Dynamic Feedback */}
      <div className="flex-[0.5] flex flex-col items-center justify-center -mb-2 relative">
        <div className="absolute top-[-50px] whitespace-nowrap">
          <AnimatePresence mode="wait">
            {gameState.lastFeedback && (() => {
              const style = feedbackStyles[gameState.lastFeedback] || {
                color: "text-cyan-400",
                dropShadow: "drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]",
                scale: 1.4,
              };
              return (
                <motion.div
                  key={gameState.feedbackId}
                  initial={{ y: 40, opacity: 0, scale: 0.3, filter: "blur(10px)" }}
                  animate={{
                    y: 0, opacity: 1, scale: style.scale, filter: "blur(0px)",
                    transition: { type: "spring", stiffness: 300, damping: 15 },
                  }}
                  exit={{ y: -40, opacity: 0, scale: style.scale + 0.6, filter: "blur(5px)", transition: { duration: 0.4 } }}
                  className={cn("text-4xl font-bold italic tracking-tighter", style.color, style.dropShadow)}
                >
                  {gameState.lastFeedback}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
        <div className="mt-8 h-1 w-32 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
            animate={{ width: `${(gameState.combo % 5) * 20 || (gameState.combo > 0 ? 100 : 0)}%` }}
          />
        </div>
      </div>

      {/* Right: Streak & Multiplier */}
      <div className="flex-1 flex justify-end items-center gap-6">
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
        <div className="relative">
          <div className={cn(
            "absolute -inset-4 rounded-2xl blur-2xl transition-all duration-500",
            gameState.multiplier >= 4 ? "bg-main/30 opacity-100" : "bg-cyan-500/20 opacity-0"
          )} />
          <div className={cn(
            "relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all duration-500 overflow-hidden",
            gameState.multiplier >= 4
              ? "bg-main border-white/40 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110"
              : "bg-zinc-950 border-white/10"
          )}>
            <span className="text-[10px] font-semibold tracking-tight text-white/50 -mb-1">Multiplier</span>
            <span className="text-4xl font-bold text-white italic tracking-tighter">x{gameState.multiplier}</span>
            {gameState.multiplier >= 8 && (
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent animate-pulse" />
            )}
          </div>
        </div>
      </div>

    </div>
  </div>
);
