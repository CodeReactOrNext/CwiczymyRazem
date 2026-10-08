interface ReportOrigin {
  planId?: unknown;
  songId?: unknown;
  songs?: unknown;
}

/**
 * Whether a report was typed in by hand (the manual log form) rather than
 * recorded by a timer — only those may be edited or deleted.
 *
 * Every timer session carries `planId` (a song practised on its own is wrapped
 * in a plan), except the standalone song timer, which writes a bare `songId`.
 * The manual form attributes time to songs through the `songs` breakdown, so a
 * report with `songs` and no plan is still a hand-written one.
 */
export const isManualReport = (report: ReportOrigin): boolean => {
  if (report.planId) return false;
  if (!report.songId) return true;
  return Array.isArray(report.songs) && report.songs.length > 0;
};
