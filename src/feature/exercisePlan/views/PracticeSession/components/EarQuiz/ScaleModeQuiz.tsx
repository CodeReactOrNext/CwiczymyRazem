import { cn } from "assets/lib/utils";
import type { ScaleModeId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import type { ScaleModeQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import {
  buildScaleMidi,
  SCALE_MODES,
} from "feature/exercisePlan/logic/earQuiz/scaleModes";
import { useTranslation } from "hooks/useTranslation";
import { Snail } from "lucide-react";
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
  const { t } = useTranslation("session");
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [picked, setPicked] = useState<ScaleModeId | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  /** Which option is sounding, once the tiles have turned into players. */
  const [auditioned, setAuditioned] = useState<ScaleModeId | null>(null);

  const playRun = (midis: number[], noteSeconds: number) => {
    const runSeconds = midis.length * noteSeconds;
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
        ...midis.map((midi, index) => ({
          midis: [midi],
          at: 0.35 + index * noteSeconds,
          duration: NOTE_DURATION,
        })),
      ],
      runSeconds + 1.4,
    );
  };

  const playScale = (noteSeconds: number) => {
    playRun(question.midis, noteSeconds);
    setAuditioned(null);
    setHasPlayed(true);
  };

  // The primary button doubles as a stop; the slow button always restarts, so it
  // never reads as "cut the scale off".
  const toggleScale = () => (isPlaying ? stop() : playScale(NOTE_SECONDS));

  // Answered, every tile plays its own mode over the same drone, so the guess
  // can be heard against the mode that actually played.
  const handlePick = (scale: ScaleModeId) => {
    if (isAnswered) {
      playRun(buildScaleMidi(question.rootMidi, scale), NOTE_SECONDS);
      setAuditioned(scale);
      return;
    }
    setPicked(scale);
    onAnswer(scale === question.scale);
  };

  const answerScale = SCALE_MODES[question.scale];
  const scaleName = (id: ScaleModeId) =>
    t(`quiz.scales.${id}.name`, SCALE_MODES[id].name);

  const verdict = isAnswered
    ? {
        isCorrect,
        answer: `${question.rootName} ${scaleName(question.scale)}`,
        explanation: t(
          `quiz.scales.${question.scale}.character`,
          answerScale.character,
        ),
        footnote: t("quiz.listen_for", {
          tell: t(`quiz.scales.${question.scale}.tell`, answerScale.tell),
          formula: answerScale.formula,
        }),
      }
    : null;

  return (
    <>
      <div className='flex flex-col items-center gap-3'>
        <QuizQuestion question={t("quiz.which_scale")} verdict={verdict} />
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <QuizPrimarySlot isAnswered={isAnswered} onNext={onNext}>
            <ListenButton
              onClick={toggleScale}
              isPlaying={isPlaying}
              label={t("quiz.play_scale")}
              hasPlayed={hasPlayed}
            />
          </QuizPrimarySlot>
          <QuizSecondaryButton
            onClick={() => playScale(SLOW_NOTE_SECONDS)}
            icon={<Snail />}>
            {isAnswered ? t("quiz.hear_again_slowly") : t("quiz.play_slowly")}
          </QuizSecondaryButton>
        </div>
        <QuizNote hint={t("quiz.root_held")} verdict={verdict} />
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
              state={state}
              title={scaleName(id)}
              subtitle={scale.formula}
              listenLabel={
                isAnswered
                  ? t("quiz.hear_from_root", {
                      name: scaleName(id),
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
