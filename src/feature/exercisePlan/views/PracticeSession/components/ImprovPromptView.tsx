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
  style:     { bg: "bg-rose-500/15",     text: "text-rose-400",    border: "border-rose-500/30",    glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]" },
  form:      { bg: "bg-indigo-500/15",   text: "text-indigo-400",  border: "border-indigo-500/30",  glow: "shadow-[0_0_20px_rgba(99,102,241,0.15)]" },
  harmony:   { bg: "bg-teal-500/15",     text: "text-teal-400",    border: "border-teal-500/30",    glow: "shadow-[0_0_20px_rgba(20,184,166,0.15)]" },
  melody:    { bg: "bg-yellow-500/15",   text: "text-yellow-400",  border: "border-yellow-500/30",  glow: "shadow-[0_0_20px_rgba(234,179,8,0.15)]" },
};

interface ImprovPromptViewProps {
  config: ImprovPromptRiddleConfig;
  isRunning: boolean;
}

function pickRandomPrompts(prompts: ImprovPrompt[], count: number, exclude: ImprovPrompt[]): ImprovPrompt[] {
  const excludeTexts = new Set(exclude.map(p => p.text));
  const available = prompts.filter(p => !excludeTexts.has(p.text));
  const pool = available.length >= count ? available : prompts;

  // Group prompts by category
  const byCategory = new Map<string, ImprovPrompt[]>();
  for (const p of pool) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const categories = [...byCategory.keys()];
  const result: ImprovPrompt[] = [];
  const usedCategories = new Set<string>();

  // First pass: pick one prompt per unique category
  const shuffledCategories = categories.sort(() => Math.random() - 0.5);
  for (const cat of shuffledCategories) {
    if (result.length >= count) break;
    if (usedCategories.has(cat)) continue;
    const catPrompts = byCategory.get(cat)!;
    const pick = catPrompts[Math.floor(Math.random() * catPrompts.length)];
    result.push(pick);
    usedCategories.add(cat);
  }

  // Second pass: if we still need more, fill from remaining (allows duplicates)
  if (result.length < count) {
    const usedTexts = new Set(result.map(p => p.text));
    const remaining = pool.filter(p => !usedTexts.has(p.text));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    for (const p of shuffled) {
      if (result.length >= count) break;
      result.push(p);
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
        "w-full flex flex-wrap gap-3 justify-center",
        config.simultaneousPrompts > 2 ? "flex-col sm:flex-row" : ""
      )}>
        <AnimatePresence mode="wait">
          {activePrompts.map((prompt, i) => {
            const colors = categoryColors[prompt.category];
            const isCompact = config.simultaneousPrompts > 2;
            return (
              <motion.div
                key={`${promptKey}-${i}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.05 }}
                className={cn(
                  "relative rounded-2xl border backdrop-blur-sm overflow-hidden",
                  "bg-zinc-900/80",
                  colors.border,
                  colors.glow,
                  isCompact
                    ? "w-full sm:flex-1 sm:min-w-[140px] sm:max-w-[200px] p-3"
                    : "flex-1 max-w-sm p-5"
                )}
              >
                {/* Subtle glow */}
                <div className={cn(
                  "absolute -inset-4 blur-[40px] rounded-full opacity-30",
                  colors.bg
                )} />

                <div className={cn(
                  "relative text-center",
                  isCompact
                    ? "flex items-center gap-3 sm:flex-col sm:gap-2"
                    : "flex flex-col items-center gap-3"
                )}>
                  {/* Category badge */}
                  <span className={cn(
                    "inline-flex items-center shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border",
                    colors.bg,
                    colors.text,
                    colors.border
                  )}>
                    {prompt.category}
                  </span>

                  {/* Prompt text */}
                  <p className={cn(
                    "font-bold text-white leading-snug tracking-tight",
                    isCompact ? "text-sm" : "text-lg"
                  )}>
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
