import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { fadeUp } from "lib/motion/motion";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ImprovPrompt, ImprovPromptRiddleConfig } from "../../../types/exercise.types";

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
  const { t } = useTranslation("session");
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
  const count = config.simultaneousPrompts;
  // Long rotations (a composition prompt holds for 40 minutes) read as a clock, not "2400s".
  const timeLeft = secondsLeft >= 60
    ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
    : `${secondsLeft}s`;

  // Not a card of its own — it sits in the exercise's card (desktop) or is
  // given one by the phone view, so the prompt reads as plain, large text.
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className={cn(
        "grid gap-x-8 gap-y-5",
        count > 1 && "sm:grid-cols-2 shortwide:grid-cols-2",
        count > 2 && "lg:grid-cols-3 shortwide:grid-cols-3 shortwide:gap-y-4",
      )}>
        <AnimatePresence mode="wait">
          {activePrompts.map((prompt, i) => (
            <motion.div
              key={`${promptKey}-${i}`}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-1.5"
            >
              <p className="text-xs font-medium capitalize text-zinc-400">{prompt.category}</p>
              <p className={cn(
                "font-semibold leading-snug text-zinc-100",
                count > 2 ? "text-base" : "text-xl sm:text-2xl",
              )}>
                {prompt.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        {/* Time until the next prompt */}
        <div className="flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <motion.div
              className="h-full bg-cyan-400"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>
          <span className="min-w-8 text-right font-mono text-xs tabular-nums text-zinc-400">
            {timeLeft}
          </span>
        </div>
        {!isRunning && (
          <p className="text-xs text-zinc-500">{t("improv.paused")}</p>
        )}
      </div>
    </div>
  );
};
