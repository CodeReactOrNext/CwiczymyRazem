import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { DegreeId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import { DEGREES } from "feature/exercisePlan/logic/earQuiz/progressions";
import type { ProgressionQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { checkProgressionAnswer } from "feature/exercisePlan/logic/earQuiz/questions";
import { Check, Music2, Undo2 } from "lucide-react";
import { useState } from "react";

import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import {
  ListenButton,
  QuizReveal,
  QuizSecondaryButton,
  QuizVerdict,
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

  return (
    <>
      <div className='flex flex-col items-center gap-4 py-2'>
        <p className='text-center text-lg font-semibold text-zinc-100'>
          Which progression is this?
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <ListenButton
            onClick={toggleProgression}
            isPlaying={isPlaying}
            label='Play progression'
            hasPlayed={hasPlayed}
          />
          <QuizSecondaryButton
            onClick={playTonic}
            icon={<Music2 className='h-4 w-4' />}>
            Hear the I chord
          </QuizSecondaryButton>
        </div>
        <p className='text-center text-xs text-zinc-500'>
          Key of {question.keyName} — build the degrees you hear, in order
        </p>
      </div>

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
                  ? `Slot ${index + 1}: ${slot}, tap to clear`
                  : `Slot ${index + 1}: empty`
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

      {!isAnswered && (
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Button
            onClick={submit}
            disabled={!isComplete}
            className='h-10 gap-2 bg-zinc-100 font-semibold text-zinc-900 hover:bg-white'>
            <Check className='h-4 w-4' />
            Check
          </Button>
          <Button
            variant='ghost'
            onClick={clearAll}
            disabled={slots.every((slot) => slot === null)}
            className='h-10 gap-2 text-zinc-400 hover:text-zinc-100'>
            <Undo2 className='h-4 w-4' />
            Clear
          </Button>
        </div>
      )}

      <QuizReveal show={isAnswered}>
        <QuizVerdict
          isCorrect={isCorrect}
          answer={question.degrees.join(" – ")}
          explanation={question.chords.map((chord) => chord.name).join("  ·  ")}
          footnote={`Heard in: ${question.heardIn}`}
          onNext={onNext}
          extraAction={
            <QuizSecondaryButton
              onClick={playProgression}
              icon={<Music2 className='h-4 w-4' />}>
              Play it again
            </QuizSecondaryButton>
          }
        />
      </QuizReveal>
    </>
  );
}
