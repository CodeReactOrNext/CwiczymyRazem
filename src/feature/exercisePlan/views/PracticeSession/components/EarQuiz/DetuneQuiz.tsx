import * as SliderPrimitive from "@radix-ui/react-slider";
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
import { Check, Pause, Play } from "lucide-react";
import { type PointerEvent, useState } from "react";
import { midiToFrequency } from "utils/audio/noteUtils";

import {
  ListenButton,
  QuizActionSwap,
  QuizNote,
  QuizPrimaryButton,
  QuizPrimarySlot,
  QuizQuestion,
  QuizSecondaryButton,
} from "./EarQuizChrome";

interface DetuneQuizProps {
  question: DetuneQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  /** Start the two notes straight away — set for every round reached via Next. */
  autoPlay?: boolean;
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

  return (
    <>
      <div className='flex flex-col items-center gap-3'>
        <QuizQuestion
          question={intervalName ? t("quiz.tune_interval", { interval: intervalName }) : t("quiz.tune_second")}
          verdict={verdict}
        />
        <QuizPrimarySlot isAnswered={isAnswered} onNext={onNext}>
          <ListenButton
            onClick={drone.toggle}
            isPlaying={drone.isPlaying}
            label={t("quiz.play_both")}
          />
        </QuizPrimarySlot>
        <QuizNote
          hint={
            intervalName
              ? t("quiz.interval_reference", { root: question.referenceName, interval: intervalName })
              : <>Reference: {question.referenceName} — listen for the wobble and slide it away</>
          }
          verdict={verdict}
        />
      </div>

      {/* The answer side — one block, so it sits beside the question when sideways */}
      <div className='flex flex-col gap-5 shortwide:gap-4'>
        <div className='space-y-2.5 px-1 sm:px-4'>
          <div className='touch-none' {...turnedDrag}>
            <SliderPrimitive.Root
              value={[sliderCents]}
              onValueChange={([value]) => !isAnswered && setSliderCents(value)}
              min={-SLIDER_RANGE_CENTS}
              max={SLIDER_RANGE_CENTS}
              step={1}
              disabled={isAnswered}
              aria-label={t("quiz.second_pitch")}
              className='relative flex h-14 w-full cursor-pointer touch-none select-none items-center data-[disabled]:cursor-default'>
              {/* A bipolar control: no filled range from the left, just a groove
                  with a scale — the centre is where the note started, not the answer. */}
              <SliderPrimitive.Track className='relative h-full w-full grow overflow-hidden rounded-lg bg-zinc-800/50'>
                <div className='absolute inset-y-0 left-[7px] right-[7px]'>
                  {TICKS.map((cents) => (
                    <span
                      key={cents}
                      className={cn(
                        "absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full",
                        cents === 0 ? "h-6 bg-zinc-500" : cents % 30 === 0 ? "h-4 bg-zinc-600" : "h-2.5 bg-zinc-700",
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
                      className='absolute inset-y-1.5 -translate-x-1/2 rounded-md bg-emerald-500/20'
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
                  "block h-11 w-3.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
                  !isAnswered && "bg-zinc-100 hover:bg-white",
                  isAnswered && (solved ? "bg-emerald-400" : "bg-red-400"),
                )}
              />
            </SliderPrimitive.Root>
          </div>
          <div className='flex items-center justify-between text-xs font-medium text-zinc-500'>
            <span>♭ {t("quiz.flatter")}</span>
            <span
              className={cn(
                "tabular-nums",
                isAnswered && (solved ? "font-bold text-emerald-400" : "font-bold text-red-400"),
              )}>
              {isAnswered
                ? `${remaining > 0 ? "+" : ""}${Math.round(remaining)} cents`
                : "no numbers — trust your ears"}
            </span>
            <span>{t("quiz.sharper")} ♯</span>
          </div>
        </div>

        <QuizActionSwap
          isAnswered={isAnswered}
          answered={
            // Next took the drone button's place up top, so it carries on
            // here — snapping in tune is only worth it if you can hear it.
            <>
              <QuizSecondaryButton
                onClick={drone.toggle}
                icon={drone.isPlaying ? <Pause /> : <Play />}
                className='h-10'>
                {drone.isPlaying ? t("quiz.stop_notes") : t("quiz.play_both")}
              </QuizSecondaryButton>
              <QuizSecondaryButton onClick={snapToPitch} icon={<Check />} className='h-10'>
                {t("quiz.snap")}
              </QuizSecondaryButton>
            </>
          }>
          <QuizPrimaryButton onClick={submit} icon={<Check />}>
            That&apos;s in tune
          </QuizPrimaryButton>
        </QuizActionSwap>
      </div>
    </>
  );
}
