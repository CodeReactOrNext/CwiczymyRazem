import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { DegreeId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import {
  DEGREES,
  formatDegrees,
} from "feature/exercisePlan/logic/earQuiz/progressions";
import type { ProgressionQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { checkProgressionAnswer } from "feature/exercisePlan/logic/earQuiz/questions";
import { useTranslation } from "hooks/useTranslation";
import { Check, House } from "lucide-react";
import { useState } from "react";

import { useAnswerKeys } from "../../hooks/useAnswerKeys";
import { useAutoListen } from "../../hooks/useAutoListen";
import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import type { EarQuizBodyProps } from "./earQuizBody.types";
import { KeyNumber, ListenAidKey, ListenKey, QuizPrompt } from "./EarQuizChrome";

interface ProgressionQuizProps extends EarQuizBodyProps {
  question: ProgressionQuestion;
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
  autoPlay = false,
  keysEnabled = false,
}: ProgressionQuizProps) {
  const { t } = useTranslation("session");
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [slots, setSlots] = useState<(DegreeId | null)[]>(() =>
    question.degrees.map(() => null),
  );

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
        detail: t("quiz.heard_in", { songs: question.heardIn }),
        onHear: playProgression,
        aid: { icon: <House />, label: t("quiz.hear_tonic"), onClick: playTonic },
        onContinue: onNext,
      }
    : null;

  useAutoListen(autoPlay && !isAnswered, playProgression);
  useAnswerKeys(question.tiles.length, (index) => placeDegree(question.tiles[index]), keysEnabled);

  return (
    <>
      <QuizPrompt
        question={t("quiz.which_progression")}
        hint={t("quiz.key_of_build", { key: question.keyName })}
        verdict={roundVerdict}>
        <ListenKey onClick={toggleProgression} isPlaying={isPlaying} label={t("quiz.play_progression")} />
        <ListenAidKey onClick={playTonic} icon={<House aria-hidden />} label={t("quiz.hear_tonic")} />
      </QuizPrompt>

      {/* The answer side — one block, so it sits beside the question when sideways */}
      <div className='flex flex-col items-center gap-4 shortwide:gap-2.5'>
        {/* Slots the tiles drop into */}
        <div className='flex w-full flex-wrap items-center justify-center gap-3 shortwide:gap-2'>
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
                  "flex h-20 w-28 flex-col items-center justify-center gap-0.5 rounded-lg font-display text-2xl font-extrabold transition-colors duration-fast shortwide:h-14 shortwide:w-20 shortwide:text-xl",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none",
                  // A hole in the card, or on the phone's black a raised one.
                  slot === null && "bg-zinc-950 shortwide:bg-zinc-900",
                  slot !== null &&
                    verdict === undefined &&
                    cn(PRESSABLE_KEY, "bg-zinc-700 text-zinc-50 hover:bg-zinc-600"),
                  verdict === true && "bg-emerald-900 text-emerald-200",
                  verdict === false && "bg-red-950 text-red-200",
                )}>
                {slot && <span>{slot}</span>}
                {isAnswered && (
                  <span className='font-sans text-xs font-medium'>
                    {question.chords[index]?.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Degree tiles */}
        <div className='flex w-full flex-wrap items-center justify-center gap-2.5 shortwide:gap-2'>
          {question.tiles.map((degree, index) => (
            <button
              key={degree}
              type='button'
              onClick={() => placeDegree(degree)}
              disabled={isAnswered || isComplete}
              className={cn(
                PRESSABLE_KEY,
                "relative flex h-16 min-w-[92px] flex-1 flex-col items-center justify-center rounded-lg bg-zinc-800 px-3 transition-colors duration-fast shortwide:h-14 shortwide:min-w-[72px]",
                "text-lg font-bold text-zinc-100 hover:bg-zinc-700",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-40",
              )}>
              <KeyNumber n={index + 1} />
              {degree}
              <span className='text-xs font-medium text-zinc-400'>
                {QUALITY_LABEL[DEGREES[degree].quality]}
              </span>
            </button>
          ))}
        </div>

        {!isAnswered && (
          <Button size='lg' onClick={submit} disabled={!isComplete}>
            <Check />
            {t("quiz.check")}
          </Button>
        )}
      </div>
    </>
  );
}
