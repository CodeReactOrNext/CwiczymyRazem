import { cn } from "assets/lib/utils";
import { CHORD_QUALITIES } from "feature/exercisePlan/logic/earQuiz/chordQualities";
import type { ChordQualityId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import type { ChordTypeQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { AudioWaveform } from "lucide-react";
import { useState } from "react";

import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import {
  AnswerTile,
  ListenButton,
  QuizReveal,
  QuizSecondaryButton,
  QuizVerdict,
} from "./EarQuizChrome";

interface ChordTypeQuizProps {
  question: ChordTypeQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

const CHORD_DURATION = 2.6;
const STRUM_SPREAD = 0.03;
/** Slow enough that each chord tone is a separate event to the ear. */
const ARPEGGIO_SPREAD = 0.42;

export function ChordTypeQuiz({
  question,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
}: ChordTypeQuizProps) {
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [picked, setPicked] = useState<ChordQualityId | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const playChord = (spread: number) => {
    play(
      [{ midis: question.midis, at: 0, duration: CHORD_DURATION, spread }],
      CHORD_DURATION + spread * question.midis.length,
    );
    setHasPlayed(true);
  };

  // The primary button doubles as a stop; the arpeggio button always restarts,
  // otherwise pressing it mid-chord would just cut the sound off.
  const toggleChord = () => (isPlaying ? stop() : playChord(STRUM_SPREAD));

  const handlePick = (quality: ChordQualityId) => {
    if (isAnswered) return;
    setPicked(quality);
    onAnswer(quality === question.quality);
  };

  const answerQuality = CHORD_QUALITIES[question.quality];

  return (
    <>
      <div className='flex flex-col items-center gap-4 py-2'>
        <p className='text-center text-lg font-semibold text-zinc-100'>
          What kind of chord is this?
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <ListenButton
            onClick={toggleChord}
            isPlaying={isPlaying}
            label='Play chord'
            hasPlayed={hasPlayed}
          />
          <QuizSecondaryButton
            onClick={() => playChord(ARPEGGIO_SPREAD)}
            icon={<AudioWaveform className='h-4 w-4' />}>
            One note at a time
          </QuizSecondaryButton>
        </div>
        <p className='text-center text-xs text-zinc-500'>
          {isAnswered
            ? `Root: ${question.rootName}`
            : "The root moves every round — listen to the colour, not the pitch"}
        </p>
      </div>

      <div
        className={cn(
          "grid gap-3",
          question.options.length > 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2",
        )}>
        {question.options.map((id) => {
          const quality = CHORD_QUALITIES[id];
          const state = !isAnswered
            ? "idle"
            : id === question.quality
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
              title={quality.name}
              subtitle={isAnswered ? quality.formula : undefined}
            />
          );
        })}
      </div>

      <QuizReveal show={isAnswered}>
        <QuizVerdict
          isCorrect={isCorrect}
          answer={`${question.rootName}${answerQuality.suffix} — ${answerQuality.name}`}
          explanation={answerQuality.character}
          footnote={`Formula: ${answerQuality.formula}`}
          onNext={onNext}
          extraAction={
            <QuizSecondaryButton
              onClick={() => playChord(ARPEGGIO_SPREAD)}
              icon={<AudioWaveform className='h-4 w-4' />}>
              Hear it again, slowly
            </QuizSecondaryButton>
          }
        />
      </QuizReveal>
    </>
  );
}
