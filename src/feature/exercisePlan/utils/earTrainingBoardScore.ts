/**
 * The Play by Ear score that may go on the leaderboard.
 *
 * Only melodies the mic heard the player repeat count: "I had it" is the
 * player's word, fine for their own record but no proof anyone can rank. And
 * only the ones solved within one attempt at the exercise, measured on a wall
 * clock from the moment the run's first melody sounded — the riddle has no
 * note-matching run of its own to time, and pausing the session must not stop
 * the count either, since the mic still listens while it is paused.
 *
 * A longer session is never thrown out: it simply ranks with what it had
 * solved by the time one attempt would have ended.
 */
export const earTrainingBoardScore = (
  verifiedAtMs: readonly number[],
  runStartMs: number | null,
  limitMs: number | null
): number => {
  if (verifiedAtMs.length === 0) return 0;
  if (limitMs === null) return verifiedAtMs.length;
  const startMs = runStartMs ?? verifiedAtMs[0];
  return verifiedAtMs.filter((atMs) => atMs - startMs <= limitMs).length;
};
