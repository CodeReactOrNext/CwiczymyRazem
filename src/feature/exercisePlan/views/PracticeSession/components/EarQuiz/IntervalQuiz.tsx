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

import { useAnswerKeys } from "../../hooks/useAnswerKeys";
import { useAutoListen } from "../../hooks/useAutoListen";
import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import type { EarQuizBodyProps } from "./earQuizBody.types";
import { AnswerTile, ListenAidKey, ListenKey, QuizPrompt } from "./EarQuizChrome";

interface IntervalQuizProps extends EarQuizBodyProps {
  question: IntervalQuestion;
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
  autoPlay = false,
  keysEnabled = false,
}: IntervalQuizProps) {
  const { t } = useTranslation("session");
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [picked, setPicked] = useState<IntervalId | null>(null);
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

  useAutoListen(autoPlay && !isAnswered, () => playInterval(isHarmonic));
  useAnswerKeys(question.options.length, (index) => handlePick(question.options[index]), keysEnabled);

  // The other presentation is a hint before the answer — two notes are easier
  // apart, a melodic step is easier to size once stacked — and simply another
  // way to hear it afterwards.
  const aid = {
    icon: isHarmonic ? <AudioWaveform aria-hidden /> : <Layers aria-hidden />,
    label: isHarmonic ? t("quiz.one_note") : t("quiz.play_together"),
    onClick: () => playInterval(!isHarmonic),
  };

  return (
    <>
      <QuizPrompt
        question={t("quiz.which_interval")}
        verdict={verdict && {
          isCorrect,
          answer: verdict.answer,
          detail: `${verdict.explanation} ${verdict.footnote}`,
          onHear: () => playInterval(isHarmonic),
          aid,
          onContinue: onNext,
        }}>
        <ListenKey onClick={toggleInterval} isPlaying={isPlaying && auditioned === null} label={t("quiz.play_interval")} />
        <ListenAidKey {...aid} />
      </QuizPrompt>

      <div
        className={cn(
          "grid gap-3 shortwide:gap-2",
          question.options.length > 6
            ? "grid-cols-2 sm:grid-cols-4 shortwide:grid-cols-3"
            : question.options.length > 4
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-2",
        )}>
        {question.options.map((id, index) => {
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
              number={index + 1}
              dense={question.options.length > 6}
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
