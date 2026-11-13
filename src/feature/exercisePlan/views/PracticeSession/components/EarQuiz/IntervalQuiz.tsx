import { cn } from "assets/lib/utils";
import type { IntervalId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import {
  buildIntervalMidi,
  INTERVALS,
} from "feature/exercisePlan/logic/earQuiz/intervals";
import type { IntervalQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { useTranslation } from "hooks/useTranslation";
import { AudioWaveform, Layers } from "lucide-react";
import { useState } from "react";

import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import {
  AnswerTile,
  ListenButton,
  QuizNote,
  QuizPrimarySlot,
  QuizQuestion,
  QuizSecondaryButton,
} from "./EarQuizChrome";

interface IntervalQuizProps {
  question: IntervalQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

const NOTE_DURATION = 1.6;
/** Gap between the two notes when they are played one after the other. */
const NOTE_GAP = 0.75;
const DIRECTION_LABEL = {
  ascending: "going up",
  descending: "going down",
  harmonic: "played together",
} as const;

export function IntervalQuiz({
  question,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
}: IntervalQuizProps) {
  const { t } = useTranslation("session");
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [picked, setPicked] = useState<IntervalId | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  /** Which option is sounding, once the tiles have turned into players. */
  const [auditioned, setAuditioned] = useState<IntervalId | null>(null);

  const isHarmonic = question.direction === "harmonic";

  const sound = (midis: [number, number], together: boolean) =>
    together
      ? play([{ midis, at: 0, duration: NOTE_DURATION }], NOTE_DURATION)
      : play(
          midis.map((midi, index) => ({
            midis: [midi],
            at: index * NOTE_GAP,
            duration: NOTE_DURATION,
          })),
          NOTE_GAP + NOTE_DURATION,
        );

  const playInterval = (together: boolean) => {
    sound(question.midis, together);
    setAuditioned(null);
    setHasPlayed(true);
  };

  // The primary button doubles as a stop; the other-way button always restarts.
  const toggleInterval = () => (isPlaying ? stop() : playInterval(isHarmonic));

  // Answered, every tile plays its own interval from the round's root the way
  // the question was asked, so the guess can be heard next to the real answer.
  const handlePick = (interval: IntervalId) => {
    if (isAnswered) {
      sound(
        buildIntervalMidi(question.rootMidi, interval, question.direction),
        isHarmonic,
      );
      setAuditioned(interval);
      return;
    }
    setPicked(interval);
    onAnswer(interval === question.interval);
  };

  const answerInterval = INTERVALS[question.interval];
  const intervalName = (id: IntervalId) =>
    t(`quiz.intervals.${id}.name`, INTERVALS[id].name);

  const verdict = isAnswered
    ? {
        isCorrect,
        answer: `${intervalName(question.interval)} — ${t(
          `quiz.interval_direction.${question.direction}`,
          DIRECTION_LABEL[question.direction],
        )}`,
        explanation: t(
          `quiz.intervals.${question.interval}.character`,
          answerInterval.character,
        ),
        footnote: t("quiz.interval_frets", {
          count: answerInterval.semitones,
          root: question.rootName,
        }),
      }
    : null;

  return (
    <>
      <div className='flex flex-col items-center gap-3'>
        <QuizQuestion question={t("quiz.which_interval")} verdict={verdict} />
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <QuizPrimarySlot isAnswered={isAnswered} onNext={onNext}>
            <ListenButton
              onClick={toggleInterval}
              isPlaying={isPlaying}
              label={t("quiz.play_interval")}
              hasPlayed={hasPlayed}
            />
          </QuizPrimarySlot>
          {/* The other presentation is a hint before the answer — two notes are
              easier apart, a melodic step is easier to size once stacked — and
              simply another way to hear it afterwards. */}
          <QuizSecondaryButton
            onClick={() => playInterval(!isHarmonic)}
            icon={isHarmonic ? <AudioWaveform /> : <Layers />}>
            {isHarmonic ? t("quiz.one_note") : t("quiz.play_together")}
          </QuizSecondaryButton>
        </div>
        <QuizNote hint={t("quiz.interval_hint")} verdict={verdict} />
      </div>

      <div
        className={cn(
          "grid gap-3",
          question.options.length > 6
            ? "grid-cols-2 sm:grid-cols-4"
            : question.options.length > 4
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-2",
        )}>
        {question.options.map((id) => {
          const state = !isAnswered
            ? "idle"
            : id === question.interval
              ? "correct"
              : id === picked
                ? "wrong"
                : "muted";
          return (
            <AnswerTile
              key={id}
              onClick={() => handlePick(id)}
              state={state}
              title={intervalName(id)}
              subtitle={INTERVALS[id].formula}
              listenLabel={
                isAnswered
                  ? t("quiz.hear_from_root", {
                      name: intervalName(id),
                      root: question.rootName,
                    })
                  : undefined
              }
              isSounding={isPlaying && auditioned === id}
            />
          );
        })}
      </div>
    </>
  );
}
