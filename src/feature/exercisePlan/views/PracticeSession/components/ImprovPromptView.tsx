import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ImprovPrompt, ImprovPromptRiddleConfig } from "../../../types/exercise.types";

const categoryColors: Record<ImprovPrompt['category'], { bg: string; text: string; border: string; glow: string }> = {
  notes:     { bg: "bg-cyan-500/15",    text: "text-cyan-400",    border: "border-cyan-500/30",    glow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]" },
  rhythm:    { bg: "bg-purple-500/15",   text: "text-purple-400",  border: "border-purple-500/30",  glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]" },
  dynamics:  { bg: "bg-orange-500/15",   text: "text-orange-400",  border: "border-orange-500/30",  glow: "shadow-[0_0_20px_rgba(251,146,60,0.15)]" },
  phrasing:  { bg: "bg-emerald-500/15",  text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]" },
  position:  { bg: "bg-blue-500/15",     text: "text-blue-400",    border: "border-blue-500/30",    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]" },
  technique: { bg: "bg-pink-500/15",     text: "text-pink-400",    border: "border-pink-500/30",    glow: "shadow-[0_0_20px_rgba(236,72,153,0.15)]" },
  behavior:  { bg: "bg-amber-500/15",    text: "text-amber-400",   border: "border-amber-500/30",   glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
};

interface ImprovPromptViewProps {
  config: ImprovPromptRiddleConfig;
  isRunning: boolean;
}

function pickRandomPrompts(prompts: ImprovPrompt[], count: number, exclude: ImprovPrompt[]): ImprovPrompt[] {
  const excludeTexts = new Set(exclude.map(p => p.text));
  const available = prompts.filter(p => !excludeTexts.has(p.text));
  const pool = available.length >= count ? available : prompts;

  const result: ImprovPrompt[] = [];
  const used = new Set<number>();
  while (result.length < count && result.length < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(pool[idx]);
    }
  }
  return result;
}

export const ImprovPromptView = ({ config, isRunning }: ImprovPromptViewProps) => {
  const [activePrompts, setActivePrompts] = useState<ImprovPrompt[]>(() =>
    pickRandomPrompts(config.prompts, config.simultaneousPrompts, [])
  );
  const [secondsLeft, setSecondsLeft] = useState(config.promptIntervalSeconds);
  const [promptKey, setPromptKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rotate = useCallback(() => {
    setActivePrompts(prev => {
      const next = pickRandomPrompts(config.prompts, config.simultaneousPrompts, prev);
      return next;
    });
    setSecondsLeft(config.promptIntervalSeconds);
    setPromptKey(k => k + 1);
  }, [config.prompts, config.simultaneousPrompts, config.promptIntervalSeconds]);

  // Tick countdown
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          rotate();
          return config.promptIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, rotate, config.promptIntervalSeconds]);

  // Reset on config change
  useEffect(() => {
    setActivePrompts(pickRandomPrompts(config.prompts, config.simultaneousPrompts, []));
    setSecondsLeft(config.promptIntervalSeconds);
    setPromptKey(0);
  }, [config]);

  const progress = secondsLeft / config.promptIntervalSeconds;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Countdown bar */}
      <div className="w-full max-w-md flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-zinc-500 tabular-nums w-8 text-right">
          {secondsLeft}s
        </span>
      </div>

      {/* Prompt card(s) */}
      <div className={cn(
        "w-full flex gap-3",
        config.simultaneousPrompts === 1 ? "justify-center" : "justify-center"
      )}>
        <AnimatePresence mode="wait">
          {activePrompts.map((prompt, i) => {
            const colors = categoryColors[prompt.category];
            return (
              <motion.div
                key={`${promptKey}-${i}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.05 }}
                className={cn(
                  "relative flex-1 max-w-sm rounded-2xl border p-5 backdrop-blur-sm overflow-hidden",
                  "bg-zinc-900/80",
                  colors.border,
                  colors.glow
                )}
              >
                {/* Subtle glow */}
                <div className={cn(
                  "absolute -inset-4 blur-[40px] rounded-full opacity-30",
                  colors.bg
                )} />

                <div className="relative flex flex-col items-center gap-3 text-center">
                  {/* Category badge */}
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border",
                    colors.bg,
                    colors.text,
                    colors.border
                  )}>
                    {prompt.category}
                  </span>

                  {/* Prompt text */}
                  <p className="text-lg font-bold text-white leading-snug tracking-tight">
                    {prompt.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!isRunning && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          Paused — press play to start prompts
        </p>
      )}
    </div>
  );
};
