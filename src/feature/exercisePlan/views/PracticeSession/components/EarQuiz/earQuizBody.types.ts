/** What every quiz body takes besides its own question. */
export interface EarQuizBodyProps {
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  /** Play the round by itself: the session runs, or Continue opened it. */
  autoPlay?: boolean;
  /** The number keys answer. */
  keysEnabled?: boolean;
}
