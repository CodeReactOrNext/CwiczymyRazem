import type { EarQuizConfig } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import { useState } from "react";

import { useEarQuizVerdictShown } from "../../helpers/earQuizVerdictStore";
import { useEarQuizGame } from "../../hooks/useEarQuizGame";
import { ChordTypeQuiz } from "./ChordTypeQuiz";
import { DetuneQuiz } from "./DetuneQuiz";
import { EarQuizLayout, EarQuizStatus } from "./EarQuizChrome";
import { IntervalQuiz } from "./IntervalQuiz";
import { ProgressionQuiz } from "./ProgressionQuiz";
import { ScaleModeQuiz } from "./ScaleModeQuiz";

interface EarQuizPanelProps {
  config: EarQuizConfig;
  /** Scopes the saved best streak — each exercise keeps its own record. */
  exerciseId: string;
  /** Whether the session timer is running. The quiz never blocks on it; it just
   *  says that answers aren't counted while it is paused. */
  isSessionRunning?: boolean;
  /** The verdict was read and the next round is up. */
  onContinue?: () => void;
}

/**
 * The five click-to-answer listening drills. Each one owns its answer UI; this
 * panel holds the round loop they all share, so a session can drop in any of
 * them by setting `earQuizConfig` on the exercise. How a round went is said
 * where its question stood (see QuizPrompt).
 */
export function EarQuizPanel({ config, exerciseId, isSessionRunning, onContinue }: EarQuizPanelProps) {
  const { question, round, isAnswered, isCorrect, stats, answer, next } =
    useEarQuizGame(config, exerciseId, isSessionRunning);

  useEarQuizVerdictShown(isAnswered);

  // The first round plays as the session starts, the ones after it as they open.
  const [hasStarted, setHasStarted] = useState(!!isSessionRunning);
  if (isSessionRunning && !hasStarted) setHasStarted(true);

  // Every quiz body is keyed on the round (below), so a new question remounts it
  // and its per-round state resets by construction.
  const shared = {
    isAnswered,
    isCorrect,
    onAnswer: answer,
    onNext: () => {
      next();
      onContinue?.();
    },
    autoPlay: hasStarted || round > 0,
    // Under the start gate the answers are out of sight, so their keys sleep too.
    keysEnabled: isSessionRunning !== false && !isAnswered,
  };

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-2 shortwide:max-w-3xl'>
      <EarQuizStatus stats={stats} isPaused={isSessionRunning === false && hasStarted} />
      <EarQuizLayout>
        {question.kind === "chordType" && <ChordTypeQuiz key={round} question={question} {...shared} />}
        {question.kind === "progression" && <ProgressionQuiz key={round} question={question} {...shared} />}
        {question.kind === "detune" && <DetuneQuiz key={round} question={question} {...shared} />}
        {question.kind === "scaleMode" && <ScaleModeQuiz key={round} question={question} {...shared} />}
        {question.kind === "interval" && <IntervalQuiz key={round} question={question} {...shared} />}
      </EarQuizLayout>
    </div>
  );
}
