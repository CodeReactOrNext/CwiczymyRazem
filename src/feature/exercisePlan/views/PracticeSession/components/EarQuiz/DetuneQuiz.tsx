import * as SliderPrimitive from "@radix-ui/react-slider";
import { Button, PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useDetuneDrone } from "feature/exercisePlan/hooks/useDetuneDrone";
import { INTERVALS } from "feature/exercisePlan/logic/earQuiz/intervals";
import type { DetuneQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import {
  beatsPerSecond,
  isDetuneSolved,
  remainingDetuneCents,
} from "feature/exercisePlan/logic/earQuiz/questions";
import { motion } from "framer-motion";
import { fractionAlongX, useQuarterTurn } from "hooks/useQuarterTurn";
import { useTranslation } from "hooks/useTranslation";
import { Check } from "lucide-react";
import { type PointerEvent, useState } from "react";
import { midiToFrequency } from "utils/audio/noteUtils";

import { useAutoListen } from "../../hooks/useAutoListen";
import type { EarQuizBodyProps } from "./earQuizBody.types";
import { ListenKey, QuizPrompt } from "./EarQuizChrome";

interface DetuneQuizProps extends EarQuizBodyProps {
  question: DetuneQuestion;
}

/** Slider travel each way. Wider than the largest error a question can start
 *  with, so the in-tune point is always reachable without ever sitting at an end. */
const SLIDER_RANGE_CENTS = 60;
/** Scale marks every 10 cents; the centre and the ±30s drawn longer. */
const TICKS = Array.from({ length: (SLIDER_RANGE_CENTS * 2) / 10 + 1 }, (_, i) => i * 10 - SLIDER_RANGE_CENTS);

export function DetuneQuiz({
  question,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
  autoPlay = false,
}: DetuneQuizProps) {
  const { t } = useTranslation("session");
  const [sliderCents, setSliderCents] = useState(0);
  // Where the slider stood when Check was pressed — the verdict has to keep
  // reporting that, even after "Snap it in tune" moves the drone afterwards.
  const [submittedCents, setSubmittedCents] = useState<number | null>(null);
  const drone = useDetuneDrone(
    question.referenceMidi,
    // The drone's second voice is placed from the first: the interval, if the
    // round has one, plus whatever error is left.
    question.targetCents + remainingDetuneCents(question, sliderCents),
    autoPlay,
  );

  const judgedCents = submittedCents ?? sliderCents;
  const remaining = remainingDetuneCents(question, judgedCents);
  const solved = isDetuneSolved(question, judgedCents);
  const referenceFrequency = midiToFrequency(question.referenceMidi);
  // Two notes an interval apart beat where their overtones meet, not at the
  // lower note's own pitch — faster, for the same error in cents.
  const beats = beatsPerSecond(referenceFrequency * question.beatPartial, remaining);
  const intervalName = question.interval
    ? t(`quiz.intervals.${question.interval}.name`, INTERVALS[question.interval].name)
    : null;

  const submit = () => {
    if (isAnswered) return;
    setSubmittedCents(sliderCents);
    onAnswer(isDetuneSolved(question, sliderCents));
  };

  const snapToPitch = () => setSliderCents(-question.offsetCents);

  // On the turned phone screen the slider's track runs down the page, but Radix reads the
  // pointer's x — so the drag is taken here instead, before it reaches the slider. The thumb
  // still follows the value, and the keyboard still goes to Radix.
  const quarterTurned = useQuarterTurn();
  const slideTo = (e: PointerEvent<HTMLDivElement>) => {
    const fraction = fractionAlongX(e.currentTarget.getBoundingClientRect(), e, true);
    setSliderCents(Math.round(-SLIDER_RANGE_CENTS + fraction * SLIDER_RANGE_CENTS * 2));
  };
  const turnedDrag = quarterTurned && !isAnswered ? {
    onPointerDownCapture: (e: PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      slideTo(e);
    },
    onPointerMoveCapture: (e: PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      e.stopPropagation();
      slideTo(e);
    },
  } : {};

  const direction = remaining > 0 ? "sharp" : "flat";
  const verdictLine = solved
    ? t("quiz.detune_in_tune", {
        cents: Math.abs(Math.round(remaining)),
        window: question.toleranceCents,
      })
    : t(direction === "sharp" ? "quiz.detune_sharp" : "quiz.detune_flat", {
        cents: Math.abs(Math.round(remaining)),
        window: question.toleranceCents,
      });

  // Where a cent value sits along the track, in the same terms Radix places
  // the thumb — the marks live in a box inset by half the thumb, so the two line up.
  const along = (cents: number) =>
    `${((cents + SLIDER_RANGE_CENTS) / (SLIDER_RANGE_CENTS * 2)) * 100}%`;
  const targetCents = -question.offsetCents;
  const verdict = isAnswered
    ? {
        isCorrect,
        answer: verdictLine,
        explanation:
          beats < 0.15
            ? t("quiz.no_beating")
            : t("quiz.beating", { beats: beats.toFixed(1) }),
        footnote: t(intervalName ? "quiz.detune_interval_footnote" : "quiz.detune_footnote"),
      }
    : null;

  // A round that mounts on a running session starts inside the drone; this is
  // the first one, which was already up when Start was pressed.
  const [startsOnMount] = useState(autoPlay);
  useAutoListen(autoPlay && !startsOnMount && !isAnswered, drone.start);

  return (
    <>
      <QuizPrompt
        question={intervalName ? t("quiz.tune_interval", { interval: intervalName }) : t("quiz.tune_second")}
        verdict={verdict && {
          isCorrect,
          answer: verdict.answer,
          detail: `${verdict.explanation} ${verdict.footnote}`,
          onHear: drone.toggle,
          isSounding: drone.isPlaying,
          onContinue: onNext,
        }}>
        <ListenKey
          onClick={drone.toggle}
          isPlaying={drone.isPlaying}
          label={t("quiz.play_both")}
          stopIcon
        />
      </QuizPrompt>

      {/* The answer side — one block, so it sits beside the question when sideways */}
      <div className='flex flex-col items-center gap-4'>
        <div className='w-full space-y-2.5'>
          <div className='touch-none' {...turnedDrag}>
            <SliderPrimitive.Root
              value={[sliderCents]}
              onValueChange={([value]) => !isAnswered && setSliderCents(value)}
              min={-SLIDER_RANGE_CENTS}
              max={SLIDER_RANGE_CENTS}
              step={1}
              disabled={isAnswered}
              aria-label={t("quiz.second_pitch")}
              className='relative flex h-[4.5rem] w-full cursor-pointer touch-none select-none items-center data-[disabled]:cursor-default'>
              {/* A bipolar control: no filled range from the left, just a groove
                  with a scale — the centre is where the note started, not the answer. */}
              <SliderPrimitive.Track className='relative h-full w-full grow overflow-hidden rounded-lg bg-zinc-800'>
                <div className='absolute inset-y-0 left-[13px] right-[13px]'>
                  {TICKS.map((cents) => (
                    <span
                      key={cents}
                      className={cn(
                        "absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full",
                        cents === 0 ? "h-6 bg-zinc-400" : cents % 30 === 0 ? "h-4 bg-zinc-500" : "h-2.5 bg-zinc-600",
                      )}
                      style={{ left: along(cents) }}
                    />
                  ))}
                  {/* Answered: where in tune actually was, and how wide the window. */}
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0.4 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className='absolute inset-y-1.5 -translate-x-1/2 rounded bg-emerald-500/25'
                      style={{
                        left: along(targetCents),
                        width: `${(question.toleranceCents / SLIDER_RANGE_CENTS) * 100}%`,
                      }}>
                      <span className='absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-emerald-400' />
                    </motion.div>
                  )}
                </div>
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                className={cn(
                  PRESSABLE,
                  "block h-14 w-[26px] rounded-lg border-b-black/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
                  !isAnswered && "bg-zinc-100 hover:bg-white",
                  isAnswered && (solved ? "bg-emerald-400" : "bg-red-400"),
                )}
              />
            </SliderPrimitive.Root>
          </div>
          <div className='flex items-center justify-between text-xs font-medium text-zinc-400'>
            <span>♭ {t("quiz.flatter")}</span>
            <span
              className={cn(
                "tabular-nums",
                isAnswered && (solved ? "font-bold text-emerald-400" : "font-bold text-red-400"),
              )}>
              {isAnswered
                ? `${remaining > 0 ? "+" : ""}${Math.round(remaining)} cents`
                : t("quiz.trust_ears")}
            </span>
            <span>{t("quiz.sharper")} ♯</span>
          </div>
        </div>

        {isAnswered ? (
          <Button variant='ghost' size='lg' onClick={snapToPitch}>
            <Check />
            {t("quiz.snap")}
          </Button>
        ) : (
          <Button size='lg' onClick={submit}>
            <Check />
            {t("quiz.thats_in_tune")}
          </Button>
        )}
      </div>
    </>
  );
}
