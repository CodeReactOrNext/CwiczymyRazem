import type { ReportSongEntry } from "feature/user/view/ReportView/ReportView.types";

import type { ExercisePlan } from "../types/exercise.types";

/**
 * The songs a routine session spent time on, in the shape the session report
 * takes (`ReportFormikInterface.songs`).
 *
 * Read off the time the session measured for each song item — never the
 * item's planned minutes: a song skipped after thirty seconds gets thirty
 * seconds, a song the player lingered on gets all of it. That keeps the
 * per-song figures a strict slice of the report's category totals, so the
 * song's own progress and the day's practice time can't disagree.
 *
 * A song that sits in the plan twice is one entry (its slots tick into one
 * bucket, see sessionTimeStore). Songs that never got any time are left out.
 */
export const collectPlanSongPractice = (
  plan: Pick<ExercisePlan, "exercises">,
  songTime: Record<string, number>
): ReportSongEntry[] => {
  const seen = new Set<string>();
  const entries: ReportSongEntry[] = [];

  for (const exercise of plan.exercises) {
    const song = exercise.songData;
    if (!song || seen.has(song.songId)) continue;
    seen.add(song.songId);

    const practiceMs = Math.round(songTime[song.songId] ?? 0);
    if (practiceMs <= 0) continue;

    // Song items are technique work unless the item was filed under hearing —
    // the same category its ticks landed in, so the split matches the totals.
    const isHearing = exercise.category === "hearing";
    entries.push({
      songId: song.songId,
      songTitle: song.title,
      songArtist: song.artist,
      practiceMs,
      techniqueMs: isHearing ? 0 : practiceMs,
      hearingMs: isHearing ? practiceMs : 0,
    });
  }

  return entries;
};

/**
 * The song the report is filed under for everything that still reads a single
 * `songId` (activity feed, practice log, rating popup): the one that got the
 * most time, the earlier one in the plan on a tie.
 */
export const pickPrimaryPlanSong = (
  songs: ReportSongEntry[]
): ReportSongEntry | undefined =>
  songs.reduce<ReportSongEntry | undefined>(
    (best, song) => (best && best.practiceMs >= song.practiceMs ? best : song),
    undefined
  );
