import { cn } from "assets/lib/utils";
import type { DegreeId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import {
  DEGREES,
  formatDegrees,
} from "feature/exercisePlan/logic/earQuiz/progressions";
import type { ProgressionQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { checkProgressionAnswer } from "feature/exercisePlan/logic/earQuiz/questions";
import { useTranslation } from "hooks/useTranslation";
import { Check, Music2, Undo2 } from "lucide-react";
import { useState } from "react";

import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import {
  ListenButton,
  QuizActionSwap,
  QuizNote,
  QuizPrimaryButton,
  QuizPrimarySlot,
  QuizQuestion,
  QuizSecondaryButton,
} from "./EarQuizChrome";

interface ProgressionQuizProps {
  question: ProgressionQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

const CHORD_SECONDS = 1.7;
const CHORD_DURATION = 1.9;
const STRUM_SPREAD = 0.028;

/** Roman numerals already encode the quality (upper/lower case) — spelled out
 *  under the tile so nobody has to remember the convention mid-round. */
const QUALITY_LABEL = { major: "major", minor: "minor", dim: "dim" } as const;

export function ProgressionQuiz({
  question,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
}: ProgressionQuizProps) {
  const { t } = useTranslation("session");
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [slots, setSlots] = useState<(DegreeId | null)[]>(() =>
    question.degrees.map(() => null),
  );
  const [hasPlayed, setHasPlayed] = useState(false);

  const playProgression = () => {
    play(
      question.chords.map((chord, index) => ({
        midis: chord.midis,
        at: index * CHORD_SECONDS,
        duration: CHORD_DURATION,
        spread: STRUM_SPREAD,
      })),
      question.chords.length * CHORD_SECONDS + 0.6,
    );
    setHasPlayed(true);
  };

  // Play/stop on the main button; every other control just starts its own sound.
  const toggleProgression = () => (isPlaying ? stop() : playProgression());

  const playTonic = () => {
    play(
      [
        {
          midis: question.tonicMidis,
          at: 0,
          duration: 2.2,
          spread: STRUM_SPREAD,
        },
      ],
      2.2,
    );
  };

  const placeDegree = (degree: DegreeId) => {
    if (isAnswered) return;
    setSlots((prev) => {
      const firstEmpty = prev.indexOf(null);
      if (firstEmpty === -1) return prev;
      const next = [...prev];
      next[firstEmpty] = degree;
      return next;
    });
  };

  const clearSlot = (index: number) => {
    if (isAnswered) return;
    setSlots((prev) => prev.map((value, i) => (i === index ? null : value)));
  };

  const clearAll = () => {
    if (isAnswered) return;
    setSlots(question.degrees.map(() => null));
  };

  const isComplete = slots.every((slot) => slot !== null);
  const verdicts = isAnswered ? checkProgressionAnswer(question, slots) : null;

  const submit = () => {
    if (isAnswered || !isComplete) return;
    onAnswer(checkProgressionAnswer(question, slots).every(Boolean));
  };

  // The chord names are already under each slot once answered, so the note
  // line carries where the progression turns up instead.
  const roundVerdict = isAnswered
    ? {
        isCorrect,
        answer: formatDegrees(question.degrees),
        explanation: t("quiz.heard_in", { songs: question.heardIn }),
      }
    : null;

  return (
    <>
      <div className='flex flex-col items-center gap-3'>
        <QuizQuestion question={t("quiz.which_progression")} verdict={roundVerdict} />
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <QuizPrimarySlot isAnswered={isAnswered} onNext={onNext}>
            <ListenButton
              onClick={toggleProgression}
              isPlaying={isPlaying}
              label={t("quiz.play_progression")}
              hasPlayed={hasPlayed}
            />
          </QuizPrimarySlot>
          <QuizSecondaryButton onClick={playTonic} icon={<Music2 />}>
            {t("quiz.hear_tonic")}
          </QuizSecondaryButton>
        </div>
        <QuizNote hint={t("quiz.key_of_build", { key: question.keyName })} verdict={roundVerdict} />
      </div>

      {/* The answer side — one block, so it sits beside the question when sideways */}
      <div className='flex flex-col gap-5 shortwide:gap-4'>
        {/* Slots the tiles drop into */}
        <div className='flex flex-wrap items-center justify-center gap-3'>
          {slots.map((slot, index) => {
            const verdict = verdicts?.[index];
            return (
              <button
                key={index}
                type='button'
                onClick={() => clearSlot(index)}
                disabled={isAnswered || slot === null}
                aria-label={
                  slot
                    ? t("quiz.slot_filled", { n: index + 1, chord: slot })
                    : t("quiz.slot_empty", { n: index + 1 })
                }
                className={cn(
                  "flex h-16 w-20 flex-col items-center justify-center gap-0.5 rounded-lg text-lg font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none",
                  slot === null && "bg-zinc-800/20 text-zinc-600",
                  slot !== null &&
                    verdict === undefined &&
                    "bg-zinc-800/60 text-zinc-100 hover:bg-zinc-800",
                  verdict === true && "bg-emerald-500/10 text-emerald-400",
                  verdict === false && "bg-red-500/10 text-red-400",
                )}>
                <span>{slot ?? index + 1}</span>
                {isAnswered && (
                  <span className='text-[11px] font-normal opacity-70'>
                    {question.chords[index]?.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Degree tiles */}
        <div className='flex flex-wrap items-center justify-center gap-2.5'>
          {question.tiles.map((degree) => (
            <button
              key={degree}
              type='button'
              onClick={() => placeDegree(degree)}
              disabled={isAnswered || isComplete}
              className={cn(
                "flex h-12 min-w-[72px] flex-col items-center justify-center rounded-lg bg-zinc-800/40 px-3 transition-colors",
                "text-base font-semibold text-zinc-100 hover:bg-zinc-800",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-40",
              )}>
              {degree}
              <span className='text-[10px] font-normal text-zinc-500'>
                {QUALITY_LABEL[DEGREES[degree].quality]}
              </span>
            </button>
          ))}
        </div>

        <QuizActionSwap
          isAnswered={isAnswered}
          answered={
            <QuizSecondaryButton onClick={playProgression} icon={<Music2 />} className='h-10'>
              {t("quiz.play_it_again")}
            </QuizSecondaryButton>
          }>
          <QuizPrimaryButton onClick={submit} disabled={!isComplete} icon={<Check />}>
            {t("quiz.check")}
          </QuizPrimaryButton>
          <QuizSecondaryButton
            onClick={clearAll}
            disabled={slots.every((slot) => slot === null)}
            icon={<Undo2 />}
            className='h-10'>
            {t("quiz.clear")}
          </QuizSecondaryButton>
        </QuizActionSwap>
      </div>
    </>
  );
}
