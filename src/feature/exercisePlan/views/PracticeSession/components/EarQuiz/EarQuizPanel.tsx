import type {
  EarQuizConfig,
  EarQuizMode,
} from "feature/exercisePlan/logic/earQuiz/earQuiz.types";

import { useEarQuizGame } from "../../hooks/useEarQuizGame";
import { ChordTypeQuiz } from "./ChordTypeQuiz";
import { DetuneQuiz } from "./DetuneQuiz";
import { EarQuizCard, EarQuizHeader, StartTimerHint } from "./EarQuizChrome";
import { ProgressionQuiz } from "./ProgressionQuiz";
import { ScaleModeQuiz } from "./ScaleModeQuiz";

interface EarQuizPanelProps {
  config: EarQuizConfig;
  /** Scopes the saved best streak — each exercise keeps its own record. */
  exerciseId: string;
  /** Whether the session timer is running. The quiz never blocks on it; it just
   *  reminds the player that practice time isn't being counted yet. */
  isSessionRunning?: boolean;
}

const MODE_LABEL: Record<EarQuizMode, string> = {
  chordType: "Chord quality",
  progression: "Chord progressions",
  detune: "Tuning by ear",
  scaleMode: "Scales & modes",
};

/**
 * The four click-to-answer listening drills. Each one owns its answer UI; this
 * panel holds the round loop and the scoreboard they all share, so a session can
 * drop in any of them by setting `earQuizConfig` on the exercise.
 */
export function EarQuizPanel({
  config,
  exerciseId,
  isSessionRunning,
}: EarQuizPanelProps) {
  const { question, round, isAnswered, isCorrect, stats, answer, next } =
    useEarQuizGame(config, exerciseId);

  // Every quiz body is keyed on the round (below), so a new question remounts it
  // and its per-round state resets by construction.
  const shared = { isAnswered, isCorrect, onAnswer: answer, onNext: next };

  return (
    <EarQuizCard>
      <EarQuizHeader label={MODE_LABEL[config.mode]} stats={stats} />
      {isSessionRunning === false && <StartTimerHint />}

      {question.kind === "chordType" && (
        <ChordTypeQuiz key={round} question={question} {...shared} />
      )}
      {question.kind === "progression" && (
        <ProgressionQuiz key={round} question={question} {...shared} />
      )}
      {question.kind === "detune" && (
        <DetuneQuiz key={round} question={question} {...shared} />
      )}
      {question.kind === "scaleMode" && (
        <ScaleModeQuiz key={round} question={question} {...shared} />
      )}
    </EarQuizCard>
  );
}
