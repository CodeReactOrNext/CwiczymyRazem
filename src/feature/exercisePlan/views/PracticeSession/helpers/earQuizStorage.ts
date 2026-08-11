const BEST_STREAK_KEY = "riffquest.earQuiz.bestStreak";

/**
 * Best streak per ear-quiz exercise, kept in localStorage. The listening quizzes
 * score themselves inside the panel (there is no tab to grade against), so the
 * only thing worth carrying between sessions is the personal record.
 */
export function loadEarQuizBestStreak(exerciseId: string): number {
  try {
    const raw = localStorage.getItem(`${BEST_STREAK_KEY}.${exerciseId}`);
    const value = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveEarQuizBestStreak(exerciseId: string, streak: number): void {
  try {
    localStorage.setItem(`${BEST_STREAK_KEY}.${exerciseId}`, String(streak));
  } catch {
    /* private mode / storage disabled — the record just doesn't persist */
  }
}
