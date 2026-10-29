import { DUEL_POOL, getDuelExercise } from "feature/duels/data/duelPool";
import { DUELS_REAL_DUEL } from "feature/landing/data/duels";

export interface DuelsPageProps {
  /** The real duel's exercise, as the library names it. */
  realDuelExercise: string;
  /** A handful of pool titles for the hero's draw to flick through. */
  drawReel: string[];
}

/**
 * The hero's real duel and a few pool titles for its draw, read from the
 * library at build time.
 */
export const buildDuelsProps = (): DuelsPageProps => {
  const real = getDuelExercise(DUELS_REAL_DUEL.exerciseId);
  if (!real) {
    throw new Error(
      `Duels landing: "${DUELS_REAL_DUEL.exerciseId}" is not in the library`,
    );
  }

  // Every fifth pool title, so the reel crosses all three kinds.
  const drawReel = DUEL_POOL.filter((_, idx) => idx % 5 === 0)
    .map((exercise) => exercise.title)
    .filter((title) => title !== real.title)
    .slice(0, 7);

  return { realDuelExercise: real.title, drawReel };
};
