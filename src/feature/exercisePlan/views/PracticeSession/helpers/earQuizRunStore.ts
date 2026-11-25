import type { EarQuizMode } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import { create } from "zustand";

interface EarQuizRunState {
  /** Right answers given while the session clock ran, this run. */
  correct: number;
  /** All answers given while the session clock ran, this run. */
  answered: number;
  /** Right answers in a row, now and at best, this run. */
  streak: number;
  bestStreak: number;
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
  streak: 0,
  bestStreak: 0,
  record: (isCorrect) =>
    set((state) => {
      const streak = isCorrect ? state.streak + 1 : 0;
      return {
        correct: state.correct + (isCorrect ? 1 : 0),
        answered: state.answered + 1,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
      };
    }),
  reset: () => set({ correct: 0, answered: 0, streak: 0, bestStreak: 0 }),
}));

/**
 * How many answers an exam run has to give before its hit rate stands by
 * itself. Tuning a note by ear takes several times longer than naming one, so
 * the slider quiz asks for fewer.
 */
export const EAR_QUIZ_EXAM_MIN_ANSWERS = 10;
export const EAR_QUIZ_EXAM_MIN_TUNINGS = 3;

export const earQuizExamMinAnswers = (mode: EarQuizMode): number =>
  mode === "detune" ? EAR_QUIZ_EXAM_MIN_TUNINGS : EAR_QUIZ_EXAM_MIN_ANSWERS;

/**
 * A quiz run as an exam accuracy (0–100): right answers over answers given.
 * A run shorter than `minAnswers` is graded as if the missing answers were
 * wrong, so one lucky answer and a minute of waiting is not a 100% exam.
 */
export const earQuizExamAccuracy = (
  correct: number,
  answered: number,
  minAnswers: number = EAR_QUIZ_EXAM_MIN_ANSWERS,
): number => Math.round((correct / Math.max(answered, minAnswers, 1)) * 100);

/** Points per right answer, and taken off per wrong one — guessing fast must not pay. */
export const EAR_QUIZ_POINTS = 100;

/** A quiz run as a duel score: +100 a right answer, −100 a wrong one, never below 0. */
export const earQuizRunScore = (correct: number, answered: number): number =>
  Math.max(0, correct - (answered - correct)) * EAR_QUIZ_POINTS;
