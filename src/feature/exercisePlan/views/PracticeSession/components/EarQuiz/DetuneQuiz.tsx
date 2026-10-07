import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { useDetuneDrone } from "feature/exercisePlan/hooks/useDetuneDrone";
import type { DetuneQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import {
  beatsPerSecond,
  isDetuneSolved,
  remainingDetuneCents,
} from "feature/exercisePlan/logic/earQuiz/questions";
import { useTranslation } from "hooks/useTranslation";
import { Check, Pause, Play } from "lucide-react";
import { useState } from "react";
import { midiToFrequency } from "utils/audio/noteUtils";

import { QuizReveal, QuizVerdict } from "./EarQuizChrome";

interface DetuneQuizProps {
  question: DetuneQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

/** Slider travel each way. Wider than the largest error a question can start
 *  with, so the in-tune point is always reachable without ever sitting at an end. */
const SLIDER_RANGE_CENTS = 60;

export function DetuneQuiz({
  question,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
}: DetuneQuizProps) {
  const { t } = useTranslation("session");
  const [sliderCents, setSliderCents] = useState(0);
  // Where the slider stood when Check was pressed — the verdict has to keep
  // reporting that, even after "Snap it in tune" moves the drone afterwards.
  const [submittedCents, setSubmittedCents] = useState<number | null>(null);
  const drone = useDetuneDrone(
    question.referenceMidi,
    remainingDetuneCents(question, sliderCents),
  );

  const judgedCents = submittedCents ?? sliderCents;
  const remaining = remainingDetuneCents(question, judgedCents);
  const solved = isDetuneSolved(question, judgedCents);
  const referenceFrequency = midiToFrequency(question.referenceMidi);
  const beats = beatsPerSecond(referenceFrequency, remaining);

  const submit = () => {
    if (isAnswered) return;
    setSubmittedCents(sliderCents);
    onAnswer(isDetuneSolved(question, sliderCents));
  };

  const snapToPitch = () => setSliderCents(-question.offsetCents);

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

  return (
    <>
      <div className='flex flex-col items-center gap-4 py-2'>
        <p className='text-center text-lg font-semibold text-zinc-100'>
          {t("quiz.tune_second")}
        </p>
        <Button
          size='lg'
          onClick={drone.toggle}
          className={cn(
            "h-12 min-w-[188px] gap-2 text-base font-semibold",
            drone.isPlaying
              ? "bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800"
              : "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25",
          )}>
          {drone.isPlaying ? (
            <Pause className='h-4 w-4' />
          ) : (
            <Play className='h-4 w-4' />
          )}
          {drone.isPlaying ? t("quiz.stop_notes") : t("quiz.play_both")}
        </Button>
        <p className='text-center text-xs text-zinc-500'>
          Reference: {question.referenceName} — listen for the wobble and slide
          it away
        </p>
      </div>

      <div className='space-y-4 px-1 sm:px-6'>
        <Slider
          value={[sliderCents]}
          onValueChange={([value]) => !isAnswered && setSliderCents(value)}
          min={-SLIDER_RANGE_CENTS}
          max={SLIDER_RANGE_CENTS}
          step={1}
          disabled={isAnswered}
          aria-label={t("quiz.second_pitch")}
          className='py-3'
        />
        <div className='flex items-center justify-between text-xs text-zinc-500'>
          <span>{t("quiz.flatter")}</span>
          <span
            className={cn(
              isAnswered && (solved ? "text-emerald-400" : "text-red-400"),
            )}>
            {isAnswered
              ? `${remaining > 0 ? "+" : ""}${Math.round(remaining)} cents`
              : "no numbers — trust your ears"}
          </span>
          <span>{t("quiz.sharper")}</span>
        </div>
      </div>

      {!isAnswered && (
        <div className='flex justify-center'>
          <Button
            onClick={submit}
            className='h-10 gap-2 bg-zinc-100 font-semibold text-zinc-900 hover:bg-white'>
            <Check className='h-4 w-4' />
            That&apos;s in tune
          </Button>
        </div>
      )}

      <QuizReveal show={isAnswered}>
        <QuizVerdict
          isCorrect={isCorrect}
          answer={verdictLine}
          explanation={
            beats < 0.15
              ? t("quiz.no_beating")
              : t("quiz.beating", { beats: beats.toFixed(1) })
          }
          footnote={t("quiz.detune_footnote")}
          onNext={onNext}
          extraAction={
            <Button
              variant='ghost'
              onClick={snapToPitch}
              className='h-10 gap-2 bg-zinc-800/40 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'>
              <Play className='h-4 w-4' />
              {t("quiz.snap")}
            </Button>
          }
        />
      </QuizReveal>
    </>
  );
}
