/** A stretch of consecutive palm-muted beats, as inclusive indices into the beat list. */
export interface PalmMuteRun {
  start: number;
  end: number;
}

interface PalmMuteBeat {
  notes: readonly { isPalmMute?: boolean }[];
}

/**
 * Groups palm-muted beats into the runs one "P.M." span covers. A beat belongs
 * to a run when any of its notes is muted; a rest or an open beat ends the run,
 * so the span never runs under something that rings.
 */
export function palmMuteRuns(beats: readonly PalmMuteBeat[]): PalmMuteRun[] {
  const runs: PalmMuteRun[] = [];
  let start = -1;
  for (let i = 0; i < beats.length; i++) {
    const muted = beats[i].notes.some((note) => note.isPalmMute);
    if (muted && start < 0) start = i;
    if (!muted && start >= 0) {
      runs.push({ start, end: i - 1 });
      start = -1;
    }
  }
  if (start >= 0) runs.push({ start, end: beats.length - 1 });
  return runs;
}
