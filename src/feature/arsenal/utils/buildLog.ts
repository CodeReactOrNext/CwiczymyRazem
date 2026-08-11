import type { BuildLogEntry, BuildLogLine } from "../types/arsenal.types";

/**
 * How many entries an item keeps. The log is a chronicle, not an audit trail:
 * the last handful is all anyone reads, and the whole array is re-read out of the
 * user document on every visit to the Arsenal, so it must not grow with play.
 */
export const BUILD_LOG_LIMIT = 10;

/**
 * Reads a stored log into one shape.
 *
 * Entries written before timestamps existed are bare strings — they stay
 * readable, they simply have no date to show.
 */
export const readBuildLog = (
  raw: BuildLogLine[] | undefined,
): BuildLogEntry[] =>
  (raw ?? []).map((entry) =>
    typeof entry === "string" ? { label: entry } : entry,
  );

/** Appends one job and trims the log back to the last `BUILD_LOG_LIMIT` entries. */
export const appendBuildLog = (
  raw: BuildLogLine[] | undefined,
  label: string,
  at: number = Date.now(),
): BuildLogEntry[] =>
  [...readBuildLog(raw), { label, at }].slice(-BUILD_LOG_LIMIT);
