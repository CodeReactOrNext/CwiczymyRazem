import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight, type LucideIcon, Music2, RefreshCw, Volume1, Volume2 } from "lucide-react";
import React from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import type { GuitarString } from "../calibration.constants";
import { useAutoGain } from "../hooks/useAutoGain";
import { useSustainCheck } from "../hooks/useSustainCheck";
import { MAX_GAIN, MIN_GAIN } from "../inputLevel";
import { isWrongNote, SUSTAIN_PASS_SHARE, type SustainOutcome, sustainProgress } from "../sustainCheck";
import { CloseButton } from "./CloseButton";
import { LevelWave } from "./LevelWave";
import { IssueNote, ReadyCheck } from "./ReadyCheck";
import { SustainNeck } from "./SustainNeck";

/** What each failed check is about: too loud, too quiet, or off the note. */
const ISSUE_ICON: Record<Exclude<SustainOutcome, "pass">, LucideIcon> = {
  clipping: Volume2,
  too_hot: Volume2,
  gain: Volume1,
  quiet: Volume1,
  pitch: Music2,
};

/** A tab note's shape — a head and the tail for as long as it rings. The head
 *  carries a sound icon rather than the fret, which read as a score here. */
const NoteShape = ({ head, tail }: { head: string; tail: string }) => (
  <div className="absolute inset-0 flex items-center">
    <div className={cn("relative z-10 flex h-10 w-12 shrink-0 items-center justify-center rounded-lg", head)}>
      <Volume2 className="h-5 w-5" strokeWidth={2.25} />
    </div>
    <div className={cn("-ml-4 h-4 flex-1 rounded-r-full", tail)} />
  </div>
);

/**
 * The test note drawn like a tab note on its string, filling green while it is
 * heard — the same fill a tab note gets when the note rings.
 */
const NoteLength = ({ progress, failed }: { progress: number; failed: boolean }) => (
  <div className="relative h-12">
    <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-zinc-700" />
    <NoteShape head="bg-zinc-700 text-zinc-100" tail="bg-zinc-800" />
    {progress > 0 && (
      // The filled copy, clipped to how far the note got; the inner shape is
      // stretched back to the full width so it lines up with the one under it.
      <div
        className="absolute inset-0 transition-[clip-path] duration-100 ease-linear"
        style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
      >
        <div className="relative h-full w-full">
          <NoteShape
            head={failed ? "bg-amber-500 text-amber-950" : "bg-emerald-500 text-emerald-950"}
            tail={failed ? "bg-amber-500/70" : "bg-emerald-500/70"}
          />
        </div>
      </div>
    )}
    <div className="absolute top-1 bottom-1 w-0.5 rounded bg-zinc-400/60" style={{ left: `${SUSTAIN_PASS_SHARE * 100}%` }} />
  </div>
);

export interface SustainTarget {
  /** Note name, e.g. "D3". */
  name: string;
  hz: number;
  /** String number (1 = thinnest). */
  string: number;
  fret: number;
}

interface SustainStepProps {
  audioRefs:         AudioRefs;
  isListening:       boolean;
  /** The guitar's open strings, for the neck. */
  strings:           GuitarString[];
  target:            SustainTarget;
  inputGain:         number;
  onInputGainChange: (v: number) => void;
  onNext:            () => void;
  onBack:            () => void;
  onCancel:          () => void;
}

/**
 * One held note, followed the way the tab follows a note. The bar is that
 * note's green fill: if it doesn't reach the end here, it won't in the tab
 * either — and the step says which gain to turn up.
 */
export const SustainStep = React.memo(function SustainStep({
  audioRefs, isListening, strings, target, inputGain, onInputGainChange, onNext, onBack, onCancel,
}: SustainStepProps) {
  const { t } = useTranslation("calibration");
  const { state, retry, passedOnce, lastFail } = useSustainCheck({ audioRefs, targetHz: target.hz, active: isListening });
  const autoGain = useAutoGain(audioRefs, inputGain, onInputGainChange);
  const isMobile = useResponsiveStore((s) => s.isMobile);

  const progress = sustainProgress(state);
  const done = state.phase === "done";
  const passed = state.outcome === "pass";
  const seconds = (state.heardMs / 1000).toFixed(1);

  const status = done
    ? t(`sustain.${state.outcome}`, { seconds, note: target.name })
    : state.phase === "holding" ? (state.clipped ? t("sustain.clipping_live") : t("sustain.holding"))
    : isWrongNote(state) ? t("sustain.wrong", { note: target.name })
    : t("sustain.waiting", { note: target.name });

  // A failed run re-arms by itself; its result stays up until the next note.
  const shownFail = done && !passed ? state : state.phase === "waiting" ? lastFail : null;
  const failText = shownFail?.outcome && shownFail.outcome !== "pass"
    ? t(`sustain.${shownFail.outcome}`, { seconds: (shownFail.heardMs / 1000).toFixed(1), note: target.name })
    : null;

  const statusColor = done
    ? (passed ? "text-emerald-400" : "text-amber-400")
    : isWrongNote(state) || (state.phase === "holding" && state.clipped) ? "text-amber-400" : "text-zinc-300";

  return (
    <div className="flex flex-1 flex-col px-5 py-5 text-white sm:px-12 sm:py-10 shortwide:px-8 shortwide:py-4">
      <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8 shortwide:mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("back")}
            className="-ml-2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-zinc-50">{t("sustain.title")}</h2>
        </div>
        <CloseButton onClick={onCancel} label={t("close")} />
      </div>

      {/* Sideways: where to play on the left, what was heard and the gain on the right. */}
      <div className="flex flex-1 flex-col gap-6 sm:gap-8 shortwide:grid shortwide:grid-cols-2 shortwide:grid-rows-[auto_auto_auto_1fr] shortwide:gap-x-10 shortwide:gap-y-4 shortwide:[grid-template-areas:'prompt_note'_'neck_note'_'neck_gain'_'neck_next']">
        <p className="text-base font-medium text-zinc-100 sm:text-lg shortwide:text-base shortwide:[grid-area:prompt]">
          {t("sustain.play", { note: target.name, string: target.string, fret: target.fret })}
        </p>

        {/* Where to play it — a small neck, it only has to point at one spot. */}
        <div className="mx-auto w-full max-w-md shortwide:self-start shortwide:[grid-area:neck]">
          <SustainNeck
            strings={strings}
            string={target.string}
            fret={target.fret}
            note={target.name}
            lit={state.phase === "holding" || passed}
            frets={isMobile ? target.fret + 1 : undefined}
          />
        </div>

        {/* How long it rang: the note as the tab draws it, filling as it is
            heard. The tick is the share that fills a tab note whole. */}
        <div className="space-y-3 shortwide:[grid-area:note]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <NoteLength progress={passed ? 1 : progress} failed={done && !passed} />
            </div>
            {/* Start over right where the result is — after a fail, or to try
                another sensitivity after a pass. */}
            <Button
              type="button"
              variant="secondary"
              onClick={retry}
              disabled={state.phase === "waiting"}
              className="h-10 shrink-0 px-4"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 shrink-0" />
                <span>{t("sustain.again")}</span>
              </span>
            </Button>
          </div>
          {passed ? (
            <ReadyCheck>{status}</ReadyCheck>
          ) : shownFail && failText ? (
            <IssueNote icon={ISSUE_ICON[shownFail.outcome as Exclude<SustainOutcome, "pass">]}>{failText}</IssueNote>
          ) : (
            <p className={cn("min-h-[2.5rem] text-base leading-relaxed", statusColor)}>{status}</p>
          )}
        </div>

        {/* Sensitivity: what's coming in (the wave), the slider, and the
            automatic setting as a plain link beside the value. */}
        <div className="space-y-3 shortwide:[grid-area:gain]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="whitespace-nowrap text-sm font-medium text-zinc-200">{t("setup.input_sensitivity")}</span>
            <div className="flex items-baseline gap-4 whitespace-nowrap">
              <button
                type="button"
                onClick={autoGain.startAutoGain}
                disabled={autoGain.phase === "measuring"}
                className="rounded text-sm text-zinc-400 transition-colors hover:text-zinc-200 disabled:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
              >
                {autoGain.phase === "measuring"
                  ? t("setup.play_notes", { seconds: autoGain.countdown })
                  : t("setup.auto_gain")}
              </button>
              <span className="text-sm tabular-nums text-zinc-300">{inputGain.toFixed(1)}×</span>
            </div>
          </div>
          <LevelWave audioRefs={audioRefs} gain={inputGain} active={isListening} className="h-10 w-full" />
          <Slider
            min={MIN_GAIN} max={MAX_GAIN} step={0.1}
            value={[inputGain]}
            onValueChange={([v]) => { autoGain.clearResult(); onInputGainChange(v); }}
          />
          {autoGain.result && (
            <p className={cn("text-sm leading-relaxed", autoGain.result.status === "ok" ? "text-emerald-400" : "text-amber-400")}>
              {t(`setup.auto.${autoGain.result.status}`, { gain: autoGain.result.gain.toFixed(1) })}
            </p>
          )}
        </div>

        {/* No way past without the check: the note has to ring to the end. */}
        <div className="mt-auto flex justify-end shortwide:[grid-area:next]">
          <Button onClick={onNext} disabled={!passedOnce} className="h-12 w-full gap-2 px-6 text-base font-semibold sm:h-11 sm:w-auto">
            {t("sustain.next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
