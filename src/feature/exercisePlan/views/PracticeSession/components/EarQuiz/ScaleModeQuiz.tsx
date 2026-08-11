import { cn } from "assets/lib/utils";
import type { ScaleModeId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import type { ScaleModeQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { SCALE_MODES } from "feature/exercisePlan/logic/earQuiz/scaleModes";
import { Snail } from "lucide-react";
import { useState } from "react";

import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import {
  AnswerTile,
  ListenButton,
  QuizReveal,
  QuizSecondaryButton,
  QuizVerdict,
} from "./EarQuizChrome";

interface ScaleModeQuizProps {
  question: ScaleModeQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

const NOTE_SECONDS = 0.44;
const SLOW_NOTE_SECONDS = 0.78;
const NOTE_DURATION = 0.85;
/** The drone is background — loud enough to anchor the tonic, quiet enough that
 *  the run stays in front of it. */
const DRONE_GAIN = 0.45;

export function ScaleModeQuiz({
  question,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
}: ScaleModeQuizProps) {
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [picked, setPicked] = useState<ScaleModeId | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const playScale = (noteSeconds: number) => {
    const runSeconds = question.midis.length * noteSeconds;
    play(
      [
        // Tonic drone underneath — without it Dorian and Aeolian are the same
        // seven notes and the question has no answer.
        {
          midis: question.droneMidis,
          at: 0,
          duration: runSeconds + 1.2,
          spread: 0.04,
          gain: DRONE_GAIN,
        },
        ...question.midis.map((midi, index) => ({
          midis: [midi],
          at: 0.35 + index * noteSeconds,
          duration: NOTE_DURATION,
        })),
      ],
      runSeconds + 1.4,
    );
    setHasPlayed(true);
  };

  // The primary button doubles as a stop; the slow button always restarts, so it
  // never reads as "cut the scale off".
  const toggleScale = () => (isPlaying ? stop() : playScale(NOTE_SECONDS));

  const handlePick = (scale: ScaleModeId) => {
    if (isAnswered) return;
    setPicked(scale);
    onAnswer(scale === question.scale);
  };

  const answerScale = SCALE_MODES[question.scale];

  return (
    <>
      <div className='flex flex-col items-center gap-4 py-2'>
        <p className='text-center text-lg font-semibold text-zinc-100'>
          Which scale is this?
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <ListenButton
            onClick={toggleScale}
            isPlaying={isPlaying}
            label='Play scale'
            hasPlayed={hasPlayed}
          />
          <QuizSecondaryButton
            onClick={() => playScale(SLOW_NOTE_SECONDS)}
            icon={<Snail className='h-4 w-4' />}>
            Play it slowly
          </QuizSecondaryButton>
        </div>
        <p className='text-center text-xs text-zinc-500'>
          {isAnswered
            ? `Root: ${question.rootName}`
            : "The root is held underneath — measure every note against it"}
        </p>
      </div>

      <div
        className={cn(
          "grid gap-3",
          question.options.length > 3
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-3",
        )}>
        {question.options.map((id) => {
          const scale = SCALE_MODES[id];
          const state = !isAnswered
            ? "idle"
            : id === question.scale
              ? "correct"
              : id === picked
                ? "wrong"
                : "muted";
          return (
            <AnswerTile
              key={id}
              onClick={() => handlePick(id)}
              disabled={isAnswered}
              state={state}
              title={scale.name}
              subtitle={isAnswered ? scale.formula : undefined}
            />
          );
        })}
      </div>

      <QuizReveal show={isAnswered}>
        <QuizVerdict
          isCorrect={isCorrect}
          answer={`${question.rootName} ${answerScale.name}`}
          explanation={answerScale.character}
          footnote={`Listen for the ${answerScale.tell} — ${answerScale.formula}`}
          onNext={onNext}
          extraAction={
            <QuizSecondaryButton
              onClick={() => playScale(SLOW_NOTE_SECONDS)}
              icon={<Snail className='h-4 w-4' />}>
              Hear it again, slowly
            </QuizSecondaryButton>
          }
        />
      </QuizReveal>
    </>
  );
}
