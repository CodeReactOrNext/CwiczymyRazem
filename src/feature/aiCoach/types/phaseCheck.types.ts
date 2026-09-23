/** One multiple-choice question of a phase checkpoint. */
export interface PhaseQuizQuestion {
  id: string;
  prompt: string;
  /** Exactly four, in the order they are shown. */
  options: string[];
  /** Index into `options`. */
  answerIndex: number;
  /** Shown after answering, right or wrong — the checkpoint teaches as it tests. */
  explanation: string;
}

/**
 * The checkpoint quiz of one phase — written once per roadmap and phase, from
 * the phase's own steps, and shared by everyone on that roadmap.
 */
export interface PhaseQuiz {
  roadmapId: string;
  phaseId: string;
  /** Hash of the steps the questions were written from; a rewrite regenerates. */
  fingerprint: string;
  questions: PhaseQuizQuestion[];
  createdAt: string;
}

/** How a player did on a phase's checkpoint — what the progress document keeps. */
export interface PhaseCheckResult {
  /** ISO date of the first passing attempt; null until it happens. */
  passedAt: string | null;
  attempts: number;
  bestScore: number;
  total: number;
}
