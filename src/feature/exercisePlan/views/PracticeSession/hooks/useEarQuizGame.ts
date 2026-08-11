import type { EarQuizConfig } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import type { EarQuizQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { generateEarQuizQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { useCallback, useEffect, useRef, useState } from "react";

import { loadEarQuizBestStreak, saveEarQuizBestStreak } from "../helpers/earQuizStorage";

export interface EarQuizStats {
  /** Correct answers this session. */
  correct: number;
  /** Rounds answered this session. */
  answered: number;
  streak: number;
  bestStreak: number;
}

/**
 * Round loop shared by all four listening quizzes: hold a question, take one
 * answer, show the verdict, roll the next one. Every quiz scores the same way —
 * a streak plus a hit rate — so none of them has to reimplement it.
 */
export function useEarQuizGame(config: EarQuizConfig, exerciseId: string) {
  const [question, setQuestion] = useState<EarQuizQuestion>(() => generateEarQuizQuestion(config));
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Bumped every round. The quiz bodies are keyed on it, so a new question
  // remounts them and their per-round state (picked answer, filled slots,
  // slider position, whatever is still ringing) resets by construction.
  const [round, setRound] = useState(0);
  // The session only ever mounts on the client (the page holds a loading screen
  // until the plan resolves), so the stored record can be read up front instead
  // of popping in after hydration.
  const [stats, setStats] = useState<EarQuizStats>(() => ({
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: loadEarQuizBestStreak(exerciseId),
  }));

  const answeredRef = useRef(false);

  useEffect(() => {
    if (stats.bestStreak > 0) saveEarQuizBestStreak(exerciseId, stats.bestStreak);
  }, [stats.bestStreak, exerciseId]);

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const answer = useCallback((correct: boolean) => {
    if (answeredRef.current) return; // one verdict per round
    answeredRef.current = true;

    setStats((prev) => {
      const streak = correct ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (correct ? 1 : 0),
        answered: prev.answered + 1,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      };
    });
    setIsCorrect(correct);
    setIsAnswered(true);
  }, []);

  const next = useCallback(() => {
    answeredRef.current = false;
    setQuestion((prev) => generateEarQuizQuestion(configRef.current, prev));
    setRound((prev) => prev + 1);
    setIsAnswered(false);
    setIsCorrect(false);
  }, []);

  return { question, round, isAnswered, isCorrect, stats, answer, next };
}
