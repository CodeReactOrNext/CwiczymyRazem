import { create } from "zustand";

interface EarQuizRunState {
  /** Right answers given while the session clock ran, this run. */
  correct: number;
  /** All answers given while the session clock ran, this run. */
  answered: number;
  record: (isCorrect: boolean) => void;
  reset: () => void;
}

/**
 * The listening quizzes' run, kept outside the panel so the session can score
 * it — the panel mounts twice (desktop and phone views), and only the one being
 * clicked writes here. Reset with the rest of the run: on a new exercise and on
 * every restart (see NoteMatchingContext).
 */
export const useEarQuizRunStore = create<EarQuizRunState>()((set) => ({
  correct: 0,
  answered: 0,
  record: (isCorrect) =>
    set((state) => ({
      correct: state.correct + (isCorrect ? 1 : 0),
      answered: state.answered + 1,
    })),
  reset: () => set({ correct: 0, answered: 0 }),
}));

/** Points per right answer, and taken off per wrong one — guessing fast must not pay. */
export const EAR_QUIZ_POINTS = 100;

/** A quiz run as a duel score: +100 a right answer, −100 a wrong one, never below 0. */
export const earQuizRunScore = (correct: number, answered: number): number =>
  Math.max(0, correct - (answered - correct)) * EAR_QUIZ_POINTS;
