/** Clean passes that see the player through a bar drill. */
export const DRILL_PASSES = 3;
/** The share of the run's tempo the bar is drilled at. */
export const DRILL_SPEED = 0.75;

interface BarPassCounter {
  /** Takes one judged note; returns the clean passes so far. */
  judge: (noteKey: string, hit: boolean) => number;
}

/**
 * Counts clean passes over a looping bar. The matcher settles every graded note
 * once a pass and repeats its key on the next, so a pass is over when each of
 * the bar's notes has been judged — and a key coming round again before that
 * means the bar was started over, which throws the unfinished pass away.
 */
export const createBarPassCounter = (notesInBar: number): BarPassCounter => {
  let seen = new Set<string>();
  let missed = false;
  let clean = 0;

  return {
    judge: (noteKey, hit) => {
      if (seen.has(noteKey)) {
        seen = new Set();
        missed = false;
      }
      seen.add(noteKey);
      if (!hit) missed = true;
      if (notesInBar > 0 && seen.size >= notesInBar) {
        if (!missed) clean += 1;
        seen = new Set();
        missed = false;
      }
      return clean;
    },
  };
};
