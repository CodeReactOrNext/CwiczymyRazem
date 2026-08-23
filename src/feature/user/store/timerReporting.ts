/**
 * Takes the minutes a report logged for one category out of the running timer.
 *
 * `user.timer` is the store of practice time that has not been reported yet —
 * the Free Timer writes to it, so does every practice session — so a report
 * must only consume what it logged. Wiping the whole timer instead threw away
 * time the player had genuinely practised but not yet reported.
 *
 * Reports are written in whole minutes while the timer counts milliseconds, so
 * a leftover under a minute is rounding, not practice, and is dropped rather
 * than left to trickle into the next report.
 */
export const subtractReportedTime = (
  current: number,
  hours?: string | number,
  minutes?: string | number
) => {
  const reportedMs =
    (Number(hours) || 0) * 60 * 60 * 1000 + (Number(minutes) || 0) * 60 * 1000;
  const rest = (current || 0) - reportedMs;
  return rest < 60 * 1000 ? 0 : rest;
};
