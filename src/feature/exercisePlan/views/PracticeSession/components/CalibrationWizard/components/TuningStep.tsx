import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ArcTuner } from "feature/tuner/components/ArcTuner";
import { AnimatePresence, motion } from "framer-motion";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useTranslation } from "hooks/useTranslation";
import React from "react";

import type { GuitarString } from "../calibration.constants";
import { useTuningWalk } from "../hooks/useTuningWalk";
import { CLOSE_CENTS, IN_TUNE_CENTS } from "../tuneHold";
import { CloseButton } from "./CloseButton";
import { hasHeadstockArt,HeadstockGuide } from "./HeadstockGuide";
import { StringProgress } from "./StringProgress";

interface TuningStepProps {
  audioRefs:   AudioRefs;
  isListening: boolean;
  /** Reference pitches to tune to — follows the player's selected guitar tuning. */
  strings:     GuitarString[];
  /** All strings tuned or skipped. */
  onFinish:    (tunedCount: number) => void;
  onCancel:    () => void;
  /** Skips the strings that are left. */
  onAlreadyTuned: () => void;
}

const TONE_TEXT = {
  idle:  "text-zinc-600",
  good:  "text-emerald-400",
  close: "text-amber-400",
  far:   "text-red-400",
} as const;

/** Plain guitar tuning, string by string — nothing is measured or saved here. */
export const TuningStep = React.memo(function TuningStep({
  audioRefs, isListening, strings, onFinish, onCancel, onAlreadyTuned,
}: TuningStepProps) {
  const { t } = useTranslation("calibration");
  const { index, current, tuned, currentDone, reading, advance, goTo } =
    useTuningWalk({ audioRefs, strings, isListening, onFinish });

  const { cents, otherStringIndex, progress } = reading;
  const hasNote  = cents !== null;
  const abs      = Math.abs(cents ?? 0);
  const isInTune = currentDone || (hasNote && abs <= IN_TUNE_CENTS);
  const isClose  = hasNote && abs <= CLOSE_CENTS;

  const statusText = currentDone ? t("tuning.tuned")
    : otherStringIndex !== null ? t("tuning.sounds_like", { string: strings[otherStringIndex].name })
    : !hasNote ? t("tuning.waiting")
    : isInTune ? t("tuning.in_tune")
    : `${Math.round(abs)}¢ ${cents > 0 ? t("tuning.sharp") : t("tuning.flat")}`;

  const tone = !hasNote && !currentDone ? "idle"
    : isInTune ? "good"
    : otherStringIndex !== null ? "idle"
    : isClose ? "close"
    : "far";

  const position = index === 0 ? t("tuning.thickest") : index === strings.length - 1 ? t("tuning.thinnest") : null;
  const showHeadstock = hasHeadstockArt(strings);

  return (
    <div className="flex flex-1 flex-col px-6 py-8 text-white sm:px-12 sm:py-10">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">{t("tuning.title")}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {t("tuning.string_of", { current: index + 1, total: strings.length })}
          </p>
        </div>
        <CloseButton onClick={onCancel} label={t("close")} />
      </div>

      <StringProgress currentIndex={index} tuned={tuned} strings={strings} onSelect={goTo} />

      <AnimatePresence mode="wait">
        <motion.p key={index} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="mt-5 text-center text-sm text-zinc-400"
        >
          {t("tuning.play_open", { string: current.name })}
          {position && <span className="text-zinc-500"> · {position}</span>}
        </motion.p>
      </AnimatePresence>

      <div className={cn(
        "mt-4 flex-1 items-center",
        showHeadstock ? "grid gap-6 sm:grid-cols-2 sm:gap-10" : "flex flex-col justify-center",
      )}>
        {/* Which string, which tuner — on the art of a real headstock. */}
        {showHeadstock && (
          <div className="h-[220px] sm:h-[340px]">
            <HeadstockGuide strings={strings} currentId={current.id} tuned={tuned} inTune={isInTune} />
          </div>
        )}
        <div className="mx-auto w-full max-w-md flex flex-col items-center">
          <ArcTuner cents={currentDone ? 0 : (cents ?? 0)} hasNote={hasNote || currentDone} />
          <div className="flex justify-between w-full px-3 -mt-1 mb-2">
            <span className="text-xs text-zinc-600">← {t("tuning.flat_label")}</span>
            <span className="text-xs text-zinc-600">{t("tuning.sharp_label")} →</span>
          </div>

          <div className="text-center space-y-0.5 mb-3">
            <div className={cn("text-5xl font-black tracking-tighter tabular-nums transition-colors duration-base", TONE_TEXT[tone])}>
              {current.name}
            </div>
            <div className={cn("text-sm font-mono font-bold tabular-nums transition-colors duration-base", TONE_TEXT[tone])}>
              {hasNote && !currentDone ? `${cents >= 0 ? "+" : ""}${Math.round(cents)}¢` : " "}
            </div>
          </div>

          <p className={cn("text-sm font-medium text-center min-h-[1.25rem] transition-colors duration-base", TONE_TEXT[tone])}>
            {statusText}
          </p>
          {/* How long the string has held in tune — it ticks off once this fills. */}
          <div className="mt-4 h-1.5 w-full rounded-lg bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-lg bg-emerald-500"
              animate={{ width: `${(currentDone ? 1 : progress) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      <div className="w-full mt-8 space-y-2">
        <Button onClick={advance} variant="secondary" disabled={currentDone} className="w-full h-11">
          {t("tuning.skip_string")}
        </Button>
        <button
          type="button"
          onClick={onAlreadyTuned}
          className="w-full py-2 text-center text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {t("tuning.already_tuned")}
        </button>
      </div>
    </div>
  );
});
