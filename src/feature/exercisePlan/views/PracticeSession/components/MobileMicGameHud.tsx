import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { getAccuracyDisplay } from "../hooks/noteMatchingFeedback";

export function MobileMicGameHud() {
  const { t } = useTranslation("session");
  const { gameState, maxPossibleScore, sessionAccuracy, sessionStats } = useNoteMatchingContext();
  const accuracy = getAccuracyDisplay(sessionAccuracy, sessionStats);

  return (
    <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between gap-4">

        {/* Score */}
        <div className="flex-1">
          <span className="block text-[8px] font-black capitalize tracking-[0.2em] text-zinc-500 mb-0.5">{t("success.score")}</span>
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
          <span className="block text-[8px] font-black capitalize tracking-[0.2em] text-zinc-500 mb-0.5">{t("success.accuracy")}</span>
          <div className="flex items-center justify-center gap-1.5">
            <span
              title={accuracy.kind === "value" ? undefined : t(`hud.${accuracy.kind}_hint`, accuracy.hint)}
              className={cn(
                "font-bold tabular-nums",
                accuracy.kind === "value" ? "text-xl text-emerald-400" : cn(accuracy.color, accuracy.kind === "silent" ? "text-xs" : "text-xl"),
              )}>
              {accuracy.kind === "silent" ? t("hud.no_notes", accuracy.text) : accuracy.text}
            </span>
            <AnimatePresence mode="wait">
              {accuracy.kind === "value" && (() => {
                const grade = accuracy.grade;
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
          <span className="block text-[8px] font-black capitalize tracking-[0.2em] text-zinc-500 mb-0.5">{t("hud.streak")}</span>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-2xl font-black text-cyan-400 tabular-nums">{gameState.combo}</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-main/20 border border-main/20">
              <span className="text-xs font-black text-white italic">x{gameState.multiplier}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
